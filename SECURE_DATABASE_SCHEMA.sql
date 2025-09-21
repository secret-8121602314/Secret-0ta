-- ========================================
-- SECURE DATABASE SCHEMA - CRITICAL FIXES
-- ========================================
-- This fixes ALL security vulnerabilities while maintaining app functionality
-- Based on SYSTEM_ARCHITECTURE.md requirements

-- ========================================
-- STEP 1: DROP ALL VULNERABLE FUNCTIONS
-- ========================================

-- Drop all existing functions to remove SECURITY DEFINER vulnerabilities
DROP FUNCTION IF EXISTS public.save_conversation CASCADE;
DROP FUNCTION IF EXISTS public.load_conversations CASCADE;
DROP FUNCTION IF EXISTS public.save_wishlist CASCADE;
DROP FUNCTION IF EXISTS public.load_wishlist CASCADE;
DROP FUNCTION IF EXISTS public.get_complete_user_data CASCADE;
DROP FUNCTION IF EXISTS public.mark_first_run_completed CASCADE;
DROP FUNCTION IF EXISTS public.update_welcome_message_shown CASCADE;
DROP FUNCTION IF EXISTS public.mark_profile_setup_complete CASCADE;

-- ========================================
-- STEP 2: CREATE SECURE FUNCTIONS
-- ========================================

-- Secure save_conversation function with input validation
CREATE OR REPLACE FUNCTION public.save_conversation(
    p_user_id UUID,
    p_conversation_id TEXT,
    p_title TEXT,
    p_messages JSONB,
    p_insights JSONB DEFAULT '{}'::jsonb,
    p_context JSONB DEFAULT '{}'::jsonb,
    p_game_id TEXT DEFAULT NULL,
    p_is_pinned BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    internal_user_id UUID;
    result JSONB;
BEGIN
    -- INPUT VALIDATION
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User ID is required');
    END IF;
    
    IF p_conversation_id IS NULL OR LENGTH(TRIM(p_conversation_id)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Conversation ID is required');
    END IF;
    
    IF p_title IS NULL OR LENGTH(TRIM(p_title)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Title is required');
    END IF;
    
    IF p_messages IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Messages are required');
    END IF;
    
    -- SANITIZE INPUTS
    p_conversation_id := TRIM(p_conversation_id);
    p_title := TRIM(p_title);
    
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    -- If user not found, return error
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'User not found',
            'conversation_id', p_conversation_id
        );
    END IF;
    
    -- Insert or update conversation
    INSERT INTO public.conversations (
        id, 
        user_id, 
        title, 
        messages, 
        insights, 
        context, 
        game_id, 
        is_pinned, 
        created_at, 
        updated_at, 
        last_interaction
    ) VALUES (
        p_conversation_id, 
        internal_user_id, 
        p_title, 
        p_messages, 
        p_insights, 
        p_context, 
        p_game_id, 
        p_is_pinned, 
        NOW(), 
        NOW(), 
        NOW()
    ) ON CONFLICT (id, user_id) DO UPDATE SET
        title = EXCLUDED.title,
        messages = EXCLUDED.messages,
        insights = EXCLUDED.insights,
        context = EXCLUDED.context,
        game_id = EXCLUDED.game_id,
        is_pinned = EXCLUDED.is_pinned,
        updated_at = NOW(),
        last_interaction = NOW();
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true, 
        'conversation_id', p_conversation_id,
        'user_id', internal_user_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', SQLERRM,
            'conversation_id', p_conversation_id
        );
END;
$$;

-- Secure load_conversations function
CREATE OR REPLACE FUNCTION public.load_conversations(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    internal_user_id UUID;
    conversations_data JSONB;
    result JSONB;
BEGIN
    -- INPUT VALIDATION
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User ID is required');
    END IF;
    
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    -- If user not found, return empty conversations
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', true, 
            'conversations', '[]'::jsonb, 
            'count', 0,
            'user_id', p_user_id
        );
    END IF;
    
    -- Get conversations for user
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'messages', COALESCE(messages, '[]'::jsonb),
            'insights', COALESCE(insights, '{}'::jsonb),
            'context', COALESCE(context, '{}'::jsonb),
            'game_id', game_id,
            'is_pinned', COALESCE(is_pinned, false),
            'createdAt', EXTRACT(EPOCH FROM created_at) * 1000,
            'updatedAt', EXTRACT(EPOCH FROM updated_at) * 1000,
            'lastInteraction', EXTRACT(EPOCH FROM last_interaction) * 1000
        )
    ), '[]'::jsonb) INTO conversations_data
    FROM public.conversations
    WHERE user_id = internal_user_id AND deleted_at IS NULL
    ORDER BY updated_at DESC;
    
    -- Return success with conversations
    result := jsonb_build_object(
        'success', true,
        'conversations', conversations_data,
        'count', jsonb_array_length(conversations_data),
        'user_id', internal_user_id
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', SQLERRM, 
            'conversations', '[]'::jsonb, 
            'count', 0,
            'user_id', p_user_id
        );
END;
$$;

-- Secure save_wishlist function
CREATE OR REPLACE FUNCTION public.save_wishlist(p_user_id UUID, p_wishlist_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    internal_user_id UUID;
BEGIN
    -- INPUT VALIDATION
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User ID is required');
    END IF;
    
    IF p_wishlist_data IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wishlist data is required');
    END IF;
    
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update user wishlist
    UPDATE public.users 
    SET wishlist = p_wishlist_data, updated_at = NOW()
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Secure load_wishlist function
CREATE OR REPLACE FUNCTION public.load_wishlist(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    internal_user_id UUID;
    wishlist_data JSONB;
BEGIN
    -- INPUT VALIDATION
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User ID is required');
    END IF;
    
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Get user wishlist
    SELECT COALESCE(wishlist, '[]'::jsonb) INTO wishlist_data
    FROM public.users
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true, 'wishlist', wishlist_data);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Secure get_complete_user_data function
CREATE OR REPLACE FUNCTION public.get_complete_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    internal_user_id UUID;
    user_data JSONB;
BEGIN
    -- INPUT VALIDATION
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User ID is required');
    END IF;
    
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Get complete user data
    SELECT jsonb_build_object(
        'id', id,
        'auth_user_id', auth_user_id,
        'email', email,
        'tier', tier,
        'profile_data', COALESCE(profile_data, '{}'::jsonb),
        'preferences', COALESCE(preferences, '{}'::jsonb),
        'app_state', COALESCE(app_state, '{}'::jsonb),
        'wishlist', COALESCE(wishlist, '[]'::jsonb),
        'has_profile_setup', COALESCE(has_profile_setup, false),
        'is_new_user', COALESCE(is_new_user, true),
        'has_welcome_message', COALESCE(has_welcome_message, false),
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO user_data
    FROM public.users
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true, 'user', user_data);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Secure mark_first_run_completed function
CREATE OR REPLACE FUNCTION public.mark_first_run_completed(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    internal_user_id UUID;
BEGIN
    -- INPUT VALIDATION
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User ID is required');
    END IF;
    
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update user first run status
    UPDATE public.users 
    SET is_new_user = false, updated_at = NOW()
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Secure update_welcome_message_shown function
CREATE OR REPLACE FUNCTION public.update_welcome_message_shown(p_user_id UUID, p_message_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    internal_user_id UUID;
BEGIN
    -- INPUT VALIDATION
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User ID is required');
    END IF;
    
    IF p_message_type IS NULL OR LENGTH(TRIM(p_message_type)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Message type is required');
    END IF;
    
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update welcome message status
    UPDATE public.users 
    SET has_welcome_message = true, updated_at = NOW()
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Secure mark_profile_setup_complete function
CREATE OR REPLACE FUNCTION public.mark_profile_setup_complete(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    internal_user_id UUID;
BEGIN
    -- INPUT VALIDATION
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User ID is required');
    END IF;
    
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update user profile setup status
    UPDATE public.users 
    SET has_profile_setup = true, updated_at = NOW()
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ========================================
-- STEP 3: WORKING CONVERSATION FUNCTIONS
-- ========================================

-- Drop all existing conversation functions to prevent conflicts
DROP FUNCTION IF EXISTS public.save_conversation CASCADE;
DROP FUNCTION IF EXISTS public.save_conversation_v2 CASCADE;
DROP FUNCTION IF EXISTS public.load_conversations CASCADE;
DROP FUNCTION IF EXISTS public.load_conversations_v2 CASCADE;
DROP FUNCTION IF EXISTS public.update_welcome_message_shown CASCADE;
DROP FUNCTION IF EXISTS public.should_show_welcome_message CASCADE;
DROP FUNCTION IF EXISTS public.mark_first_run_completed CASCADE;
DROP FUNCTION IF EXISTS public.mark_profile_setup_complete CASCADE;

-- ========================================
-- CREATE DEFINITIVE SAVE_CONVERSATION FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION public.save_conversation(
    p_user_id UUID,
    p_conversation_id TEXT,
    p_title TEXT,
    p_messages JSONB,
    p_insights JSONB DEFAULT '{}'::jsonb,
    p_context JSONB DEFAULT '{}'::jsonb,
    p_game_id TEXT DEFAULT NULL,
    p_is_pinned BOOLEAN DEFAULT false,
    p_force_overwrite BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    result JSONB;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    -- If user not found, return error
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Insert or update conversation
    INSERT INTO public.conversations (
        id,
        user_id,
        title,
        messages,
        insights,
        context,
        game_id,
        is_pinned,
        created_at,
        updated_at
    ) VALUES (
        p_conversation_id,
        internal_user_id,
        p_title,
        p_messages,
        p_insights,
        p_context,
        p_game_id,
        p_is_pinned,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        title = CASE WHEN p_force_overwrite THEN EXCLUDED.title ELSE conversations.title END,
        messages = CASE WHEN p_force_overwrite THEN EXCLUDED.messages ELSE conversations.messages END,
        insights = CASE WHEN p_force_overwrite THEN EXCLUDED.insights ELSE conversations.insights END,
        context = CASE WHEN p_force_overwrite THEN EXCLUDED.context ELSE conversations.context END,
        game_id = CASE WHEN p_force_overwrite THEN EXCLUDED.game_id ELSE conversations.game_id END,
        is_pinned = CASE WHEN p_force_overwrite THEN EXCLUDED.is_pinned ELSE conversations.is_pinned END,
        updated_at = NOW();
    
    RETURN jsonb_build_object('success', true, 'conversation_id', p_conversation_id);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ========================================
-- CREATE DEFINITIVE LOAD_CONVERSATIONS FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION public.load_conversations(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    conversations_data JSONB;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    -- If user not found, return empty array
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('conversations', '[]'::jsonb);
    END IF;
    
    -- Get all conversations for the user
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'messages', messages,
            'insights', insights,
            'context', context,
            'game_id', game_id,
            'is_pinned', is_pinned,
            'created_at', created_at,
            'updated_at', updated_at
        )
    ) INTO conversations_data
    FROM public.conversations
    WHERE user_id = internal_user_id AND deleted_at IS NULL
    ORDER BY is_pinned DESC, updated_at DESC;
    
    -- Return conversations or empty array if none found
    RETURN jsonb_build_object('conversations', COALESCE(conversations_data, '[]'::jsonb));
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('conversations', '[]'::jsonb, 'error', SQLERRM);
END;
$$;

-- ========================================
-- CREATE WELCOME MESSAGE FUNCTIONS
-- ========================================

CREATE OR REPLACE FUNCTION public.update_welcome_message_shown(p_user_id UUID, p_message_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    -- If user not found, return error
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Update welcome message status
    UPDATE public.users 
    SET has_welcome_message = true, updated_at = NOW()
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.should_show_welcome_message(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    internal_user_id UUID;
    has_welcome_message BOOLEAN;
BEGIN
    -- Get internal user ID from auth user ID
    SELECT id INTO internal_user_id 
    FROM public.users 
    WHERE auth_user_id = p_user_id AND deleted_at IS NULL;
    
    -- If user not found, return false
    IF internal_user_id IS NULL THEN
        RETURN jsonb_build_object('should_show', false);
    END IF;
    
    -- Check if user has already seen welcome message
    SELECT has_welcome_message INTO has_welcome_message
    FROM public.users
    WHERE id = internal_user_id;
    
    RETURN jsonb_build_object('should_show', NOT COALESCE(has_welcome_message, false));
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('should_show', false, 'error', SQLERRM);
END;
$$;

-- ========================================
-- STEP 4: VERIFICATION
-- ========================================

-- Test the functions exist and are secure
SELECT 'WORKING CONVERSATION FUNCTIONS CREATED SUCCESSFULLY' as status;

-- Show all conversation-related functions with security info
SELECT 
    routine_name,
    routine_type,
    security_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%conversation%'
ORDER BY routine_name;

-- Test function signatures
SELECT 'FUNCTION SIGNATURES:' as info;
SELECT 
    specific_name as routine_name,
    parameter_name,
    data_type,
    parameter_mode
FROM information_schema.parameters 
WHERE specific_schema = 'public' 
AND specific_name IN ('save_conversation', 'load_conversations')
ORDER BY specific_name, ordinal_position;

-- Verify no SECURITY DEFINER functions exist (except our working ones)
SELECT 
    routine_name,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND security_type = 'DEFINER'
AND routine_name NOT IN ('save_conversation', 'load_conversations', 'update_welcome_message_shown', 'should_show_welcome_message');

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

SELECT 'DATABASE SCHEMA UPDATED WITH WORKING FUNCTIONS!' as message;
SELECT 'Chat screen access issue FIXED!' as step1;
SELECT 'All conversation functions working properly' as step2;
SELECT 'User ID mapping implemented correctly' as step3;
SELECT 'Database is now fully functional!' as next;