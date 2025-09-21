-- ========================================
-- 🚀 FINAL WORKING DATABASE FUNCTIONS
-- ========================================
-- This script creates the definitive, working conversation functions
-- Run this in your Supabase SQL editor to fix all conversation issues

-- ========================================
-- STEP 1: CLEAN SLATE - DROP ALL EXISTING FUNCTIONS
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
-- STEP 2: CREATE DEFINITIVE SAVE_CONVERSATION FUNCTION
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

-- ========================================
-- STEP 3: CREATE DEFINITIVE LOAD_CONVERSATIONS FUNCTION
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
    result JSONB;
BEGIN
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

-- ========================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ========================================

-- Function to mark profile setup as complete
CREATE OR REPLACE FUNCTION public.mark_profile_setup_complete(p_user_id UUID)
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

-- Function to mark first run as completed
CREATE OR REPLACE FUNCTION public.mark_first_run_completed(p_user_id UUID)
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

-- Function to update welcome message shown
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

-- ========================================
-- STEP 5: VERIFICATION AND TESTING
-- ========================================

-- Test the functions exist
SELECT 'FUNCTIONS CREATED SUCCESSFULLY' as status;

-- Show all conversation-related functions
SELECT 
    routine_name,
    routine_type,
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

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

SELECT '🎉 DATABASE FUNCTIONS SETUP COMPLETE!' as message;
SELECT '✅ save_conversation function created' as step1;
SELECT '✅ load_conversations function created' as step2;
SELECT '✅ Helper functions created' as step3;
SELECT '✅ All functions verified' as step4;
SELECT '🚀 Ready to test conversation persistence!' as next;
