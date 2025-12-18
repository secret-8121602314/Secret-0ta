


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'Global cache system for GameKnowledge, News, IGDB, and HQ features. Reduces grounding costs and improves performance.';



CREATE OR REPLACE FUNCTION "public"."add_message"("p_conversation_id" "text", "p_role" "text", "p_content" "text", "p_image_url" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_message_id uuid;
  v_conversation_exists boolean;
  v_auth_user_id uuid;
BEGIN
  -- Validation 1: Check if conversation exists
  SELECT EXISTS(
    SELECT 1 FROM conversations WHERE id = p_conversation_id
  ) INTO v_conversation_exists;
  
  IF NOT v_conversation_exists THEN
    RAISE EXCEPTION 'Conversation % does not exist', p_conversation_id
      USING HINT = 'Create conversation before adding messages';
  END IF;
  
  -- Validation 2: Get auth_user_id from conversation
  SELECT auth_user_id INTO v_auth_user_id
  FROM conversations 
  WHERE id = p_conversation_id;
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Conversation % has NULL auth_user_id', p_conversation_id
      USING HINT = 'Conversation must have valid auth_user_id';
  END IF;
  
  -- Validation 3: Validate role
  IF p_role NOT IN ('user', 'assistant', 'system') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be user, assistant, or system', p_role;
  END IF;
  
  -- ✅ FIXED: Allow empty content if image_url is provided
  IF (p_content IS NULL OR trim(p_content) = '') AND (p_image_url IS NULL OR trim(p_image_url) = '') THEN
    RAISE EXCEPTION 'Message must have either content or image';
  END IF;
  
  -- Insert message with explicit auth_user_id
  INSERT INTO messages (
    conversation_id,
    role,
    content,
    image_url,
    metadata,
    auth_user_id
  ) VALUES (
    p_conversation_id,
    p_role,
    COALESCE(p_content, ''),  -- ✅ Use empty string if null
    p_image_url,
    p_metadata,
    v_auth_user_id
  ) RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$;


ALTER FUNCTION "public"."add_message"("p_conversation_id" "text", "p_role" "text", "p_content" "text", "p_image_url" "text", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."add_message"("p_conversation_id" "text", "p_role" "text", "p_content" "text", "p_image_url" "text", "p_metadata" "jsonb") IS 'Adds a message to a conversation with validation. Validates conversation exists, has auth_user_id, and prevents orphan messages. Accepts TEXT conversation_id to support custom IDs like game-hub and game-* IDs.';



CREATE OR REPLACE FUNCTION "public"."cleanup_expired_cache"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  DELETE FROM public.app_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  DELETE FROM public.ai_responses WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  DELETE FROM public.game_insights WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_news_cache"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    DELETE FROM public.news_cache
    WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_news_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_shown_prompts"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.ai_shown_prompts
    WHERE shown_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_shown_prompts"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_shown_prompts"() IS 'Removes shown prompts older than 7 days';



CREATE OR REPLACE FUNCTION "public"."clear_user_cache"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  DELETE FROM public.app_cache WHERE user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."clear_user_cache"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_unreleased_tabs"("p_auth_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    tab_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO tab_count
    FROM public.unreleased_game_tabs
    WHERE auth_user_id = p_auth_user_id;
    
    RETURN tab_count;
END;
$$;


ALTER FUNCTION "public"."count_unreleased_tabs"("p_auth_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_record"("p_auth_user_id" "uuid", "p_email" "text", "p_full_name" "text" DEFAULT NULL::"text", "p_avatar_url" "text" DEFAULT NULL::"text", "p_is_developer" boolean DEFAULT false, "p_tier" "text" DEFAULT 'free'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_user_id UUID;
  v_text_limit INTEGER;
  v_image_limit INTEGER;
BEGIN
  -- Set limits based on tier
  CASE p_tier
    WHEN 'pro' THEN
      v_text_limit := 350;
      v_image_limit := 150;
    WHEN 'vanguard_pro' THEN
      v_text_limit := 350;
      v_image_limit := 150;
    ELSE
      v_text_limit := 20;
      v_image_limit := 15;
  END CASE;

  INSERT INTO public.users (
    auth_user_id,
    email,
    full_name,
    avatar_url,
    is_developer,
    tier,
    text_limit,
    image_limit,
    created_at,
    updated_at
  ) VALUES (
    p_auth_user_id,
    p_email,
    p_full_name,
    p_avatar_url,
    p_is_developer,
    p_tier,
    v_text_limit,
    v_image_limit,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;


ALTER FUNCTION "public"."create_user_record"("p_auth_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_avatar_url" "text", "p_is_developer" boolean, "p_tier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_trials"() RETURNS TABLE("expired_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- Update users whose trial has expired
  UPDATE users
  SET 
    tier = 'free',
    text_limit = 55,
    image_limit = 25,
    updated_at = NOW()
  WHERE 
    trial_expires_at < NOW()
    AND tier = 'pro'
    AND has_used_trial = true
    AND trial_started_at IS NOT NULL;
  
  -- Get count of affected rows
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Log the expiration
  RAISE NOTICE 'Expired % trial(s) at %', affected_rows, NOW();
  
  -- Return the count
  RETURN QUERY SELECT affected_rows;
END;
$$;


ALTER FUNCTION "public"."expire_trials"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."expire_trials"() IS 'Automatically expires 14-day free trials and reverts users to free tier. Runs daily via pg_cron.';



CREATE OR REPLACE FUNCTION "public"."get_cache_performance_metrics"() RETURNS TABLE("metric_name" "text", "metric_value" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'total_cache_entries'::TEXT,
    COUNT(*)::NUMERIC
  FROM public.app_cache
  
  UNION ALL
  
  SELECT 
    'expired_entries'::TEXT,
    COUNT(*)::NUMERIC
  FROM public.app_cache
  WHERE expires_at < NOW()
  
  UNION ALL
  
  SELECT 
    'total_ai_responses'::TEXT,
    COUNT(*)::NUMERIC
  FROM public.ai_responses
  
  UNION ALL
  
  SELECT 
    'total_game_insights'::TEXT,
    COUNT(*)::NUMERIC
  FROM public.game_insights;
END;
$$;


ALTER FUNCTION "public"."get_cache_performance_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_cache_stats"() RETURNS TABLE("cache_type" "text", "total_entries" bigint, "total_size_mb" numeric, "expired_entries" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.cache_type,
    COUNT(*)::BIGINT as total_entries,
    ROUND((SUM(c.size_bytes) / 1024.0 / 1024.0)::NUMERIC, 2) as total_size_mb,
    COUNT(*) FILTER (WHERE c.expires_at < NOW())::BIGINT as expired_entries
  FROM public.app_cache c
  GROUP BY c.cache_type;
END;
$$;


ALTER FUNCTION "public"."get_cache_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_cached_news"("p_prompt_hash" "text") RETURNS TABLE("response" "text", "cached_at" timestamp with time zone, "is_expired" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        response_text,
        news_cache.cached_at,
        (expires_at < NOW()) as is_expired
    FROM public.news_cache
    WHERE prompt_hash = p_prompt_hash;
    
    -- Update access stats if not expired
    UPDATE public.news_cache
    SET 
        access_count = access_count + 1,
        last_accessed_at = NOW()
    WHERE prompt_hash = p_prompt_hash
    AND expires_at > NOW();
END;
$$;


ALTER FUNCTION "public"."get_cached_news"("p_prompt_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_complete_user_data"("p_auth_user_id" "uuid") RETURNS TABLE("id" "uuid", "auth_user_id" "uuid", "email" "text", "full_name" "text", "avatar_url" "text", "tier" "text", "is_developer" boolean, "has_profile_setup" boolean, "has_seen_splash_screens" boolean, "has_seen_how_to_use" boolean, "has_seen_features_connected" boolean, "has_seen_pro_features" boolean, "has_seen_welcome_guide" boolean, "pc_connected" boolean, "pc_connection_skipped" boolean, "onboarding_completed" boolean, "has_welcome_message" boolean, "is_new_user" boolean, "has_used_trial" boolean, "text_count" integer, "image_count" integer, "text_limit" integer, "image_limit" integer, "total_requests" integer, "last_reset" timestamp with time zone, "preferences" "jsonb", "usage_data" "jsonb", "app_state" "jsonb", "profile_data" "jsonb", "onboarding_data" "jsonb", "behavior_data" "jsonb", "feedback_data" "jsonb", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "last_login" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.auth_user_id,
    u.email,
    u.full_name,
    u.avatar_url,
    u.tier,
    u.is_developer,
    u.has_profile_setup,
    u.has_seen_splash_screens,
    u.has_seen_how_to_use,
    u.has_seen_features_connected,
    u.has_seen_pro_features,
    u.has_seen_welcome_guide,  -- ✅ ADDED THIS LINE
    u.pc_connected,
    u.pc_connection_skipped,
    u.onboarding_completed,
    u.has_welcome_message,
    u.is_new_user,
    u.has_used_trial,
    u.text_count,
    u.image_count,
    u.text_limit,
    u.image_limit,
    u.total_requests,
    u.last_reset,
    u.preferences,
    u.usage_data,
    u.app_state,
    u.profile_data,
    u.onboarding_data,
    u.behavior_data,
    u.feedback_data,
    u.created_at,
    u.updated_at,
    u.last_login
  FROM public.users u
  WHERE u.auth_user_id = p_auth_user_id;
END;
$$;


ALTER FUNCTION "public"."get_complete_user_data"("p_auth_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_complete_user_data"("p_auth_user_id" "uuid") IS 'Returns complete user data including all onboarding flags. Updated 2025-12-16 to include has_seen_welcome_guide.';



CREATE OR REPLACE FUNCTION "public"."get_conversation_messages"("p_conversation_id" "text") RETURNS TABLE("id" "uuid", "conversation_id" "text", "role" "text", "content" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.conversation_id, m.role, m.content, m.created_at, m.created_at as updated_at
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
END;
$$;


ALTER FUNCTION "public"."get_conversation_messages"("p_conversation_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_conversation_messages"("p_conversation_id" "text") IS 'Gets all messages for a conversation. Accepts TEXT conversation_id to support custom IDs like game-hub and game-* IDs.';



CREATE OR REPLACE FUNCTION "public"."get_conversation_messages"("p_conversation_id" "uuid") RETURNS TABLE("id" "uuid", "conversation_id" "uuid", "role" "text", "content" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.conversation_id, m.role, m.content, m.created_at, m.updated_at
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
END;
$$;


ALTER FUNCTION "public"."get_conversation_messages"("p_conversation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_daily_refresh_count"("p_auth_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    refresh_count INTEGER;
BEGIN
    SELECT COALESCE(SUM(refresh_count), 0)
    INTO refresh_count
    FROM public.subtab_refresh_usage
    WHERE auth_user_id = p_auth_user_id
    AND refresh_date = CURRENT_DATE;
    
    RETURN refresh_count;
END;
$$;


ALTER FUNCTION "public"."get_daily_refresh_count"("p_auth_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_game_knowledge"("p_igdb_id" integer) RETURNS TABLE("knowledge" "text", "cached" boolean, "version" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        comprehensive_knowledge,
        true::BOOLEAN as cached,
        version
    FROM public.game_knowledge_cache
    WHERE igdb_id = p_igdb_id;
    
    -- Update access stats
    UPDATE public.game_knowledge_cache
    SET 
        access_count = access_count + 1,
        last_accessed_at = NOW()
    WHERE igdb_id = p_igdb_id;
END;
$$;


ALTER FUNCTION "public"."get_game_knowledge"("p_igdb_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_game_hub"("p_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE user_id = p_user_id AND is_game_hub = TRUE
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (user_id, title, is_game_hub)
    VALUES (p_user_id, 'Game Hub', TRUE)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_game_hub"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_or_create_game_hub"("p_user_id" "uuid") IS 'Gets or creates game hub conversation. SECURITY DEFINER with search_path protection.';



CREATE OR REPLACE FUNCTION "public"."get_recent_shown_prompts"("p_auth_user_id" "uuid", "p_prompt_type" "text", "p_game_title" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 20) RETURNS TABLE("prompt_text" "text", "shown_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.prompt_text,
        sp.shown_at
    FROM public.ai_shown_prompts sp
    WHERE sp.auth_user_id = p_auth_user_id
      AND sp.prompt_type = p_prompt_type
      AND (p_game_title IS NULL OR sp.game_title = p_game_title OR sp.game_title IS NULL)
      AND sp.shown_at > NOW() - INTERVAL '7 days'
    ORDER BY sp.shown_at DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_recent_shown_prompts"("p_auth_user_id" "uuid", "p_prompt_type" "text", "p_game_title" "text", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_recent_shown_prompts"("p_auth_user_id" "uuid", "p_prompt_type" "text", "p_game_title" "text", "p_limit" integer) IS 'Returns recently shown prompts for deduplication';



CREATE OR REPLACE FUNCTION "public"."get_user_active_subscription"("p_auth_user_id" "uuid") RETURNS TABLE("subscription_id" "uuid", "tier" "text", "status" "text", "renews_at" timestamp with time zone, "ends_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as subscription_id,
        s.tier,
        s.status,
        s.renews_at,
        s.ends_at
    FROM public.subscriptions s
    INNER JOIN public.users u ON s.user_id = u.id
    WHERE u.auth_user_id = p_auth_user_id
        AND s.status IN ('active', 'on_trial')
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_user_active_subscription"("p_auth_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_cache_entries"("p_user_id" "uuid") RETURNS TABLE("key" "text", "cache_type" "text", "size_bytes" integer, "expires_at" timestamp with time zone, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.key,
    c.cache_type,
    c.size_bytes,
    c.expires_at,
    c.created_at
  FROM public.app_cache c
  WHERE c.user_id = p_user_id
  ORDER BY c.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_cache_entries"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_corrections"("p_auth_user_id" "uuid", "p_game_title" "text" DEFAULT NULL::"text", "p_include_global" boolean DEFAULT true) RETURNS TABLE("id" "uuid", "correction_text" "text", "correction_type" "text", "correction_scope" "text", "game_title" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.correction_text,
        f.correction_type,
        f.correction_scope,
        f.game_title,
        f.created_at
    FROM public.ai_feedback f
    WHERE f.user_id = p_auth_user_id
      AND f.correction_text IS NOT NULL
      AND f.is_validated = TRUE
      AND f.category = 'correction'
      AND (
          -- Game-specific corrections for this game
          (f.correction_scope = 'game' AND f.game_title = p_game_title)
          OR
          -- Global corrections (if requested)
          (p_include_global AND f.correction_scope = 'global')
      )
    ORDER BY f.created_at DESC
    LIMIT 10;
END;
$$;


ALTER FUNCTION "public"."get_user_corrections"("p_auth_user_id" "uuid", "p_game_title" "text", "p_include_global" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_corrections"("p_auth_user_id" "uuid", "p_game_title" "text", "p_include_global" boolean) IS 'Returns active validated corrections for a user, optionally filtered by game';



CREATE OR REPLACE FUNCTION "public"."get_user_id_from_auth_id"("p_auth_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN (SELECT id FROM public.users WHERE auth_user_id = p_auth_user_id);
END;
$$;


ALTER FUNCTION "public"."get_user_id_from_auth_id"("p_auth_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_onboarding_status"("p_user_id" "uuid") RETURNS TABLE("is_new_user" boolean, "has_seen_splash_screens" boolean, "has_profile_setup" boolean, "has_welcome_message" boolean, "has_seen_how_to_use" boolean, "has_seen_features_connected" boolean, "has_seen_pro_features" boolean, "pc_connected" boolean, "pc_connection_skipped" boolean, "onboarding_completed" boolean, "tier" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.is_new_user,
    u.has_seen_splash_screens,
    u.has_profile_setup,
    u.has_welcome_message,
    u.has_seen_how_to_use,
    u.has_seen_features_connected,
    u.has_seen_pro_features,
    u.pc_connected,
    u.pc_connection_skipped,
    u.onboarding_completed,
    u.tier
  FROM users u
  WHERE u.auth_user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_onboarding_status"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_onboarding_status"("p_user_id" "uuid") IS 'Gets user onboarding status. SECURITY DEFINER with search_path protection.';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, full_name, avatar_url, tier, text_limit, image_limit)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        'free',
        55,
        25
    ) ON CONFLICT (auth_user_id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the auth flow
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_grounding_usage"("p_auth_user_id" "uuid", "p_month_year" character varying) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO public.user_grounding_usage (auth_user_id, month_year, usage_count)
    VALUES (p_auth_user_id, p_month_year, 1)
    ON CONFLICT (auth_user_id, month_year)
    DO UPDATE SET 
        usage_count = public.user_grounding_usage.usage_count + 1,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."increment_grounding_usage"("p_auth_user_id" "uuid", "p_month_year" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_grounding_usage"("p_auth_user_id" "uuid", "p_month_year" character varying, "p_usage_type" character varying DEFAULT 'ai_message'::character varying) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF p_usage_type = 'game_knowledge' THEN
        INSERT INTO public.user_grounding_usage (auth_user_id, month_year, game_knowledge_count, usage_count)
        VALUES (p_auth_user_id, p_month_year, 1, 1)
        ON CONFLICT (auth_user_id, month_year)
        DO UPDATE SET 
            game_knowledge_count = public.user_grounding_usage.game_knowledge_count + 1,
            usage_count = public.user_grounding_usage.usage_count + 1,
            updated_at = NOW();
    ELSE -- ai_message
        INSERT INTO public.user_grounding_usage (auth_user_id, month_year, ai_message_count, usage_count)
        VALUES (p_auth_user_id, p_month_year, 1, 1)
        ON CONFLICT (auth_user_id, month_year)
        DO UPDATE SET 
            ai_message_count = public.user_grounding_usage.ai_message_count + 1,
            usage_count = public.user_grounding_usage.usage_count + 1,
            updated_at = NOW();
    END IF;
END;
$$;


ALTER FUNCTION "public"."increment_grounding_usage"("p_auth_user_id" "uuid", "p_month_year" character varying, "p_usage_type" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_refresh_count"("p_auth_user_id" "uuid", "p_conversation_id" "text", "p_subtab_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Get current count
    SELECT COALESCE(SUM(refresh_count), 0)
    INTO current_count
    FROM public.subtab_refresh_usage
    WHERE auth_user_id = p_auth_user_id
    AND refresh_date = CURRENT_DATE;
    
    -- Check limit (3 per day)
    IF current_count >= 3 THEN
        RETURN false;
    END IF;
    
    -- Insert or update
    INSERT INTO public.subtab_refresh_usage (
        auth_user_id,
        conversation_id,
        subtab_id,
        refresh_date,
        refresh_count
    ) VALUES (
        p_auth_user_id,
        p_conversation_id,
        p_subtab_id,
        CURRENT_DATE,
        1
    )
    ON CONFLICT (auth_user_id, refresh_date)
    DO UPDATE SET
        refresh_count = subtab_refresh_usage.refresh_count + 1,
        last_refresh_at = NOW();
    
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."increment_refresh_count"("p_auth_user_id" "uuid", "p_conversation_id" "text", "p_subtab_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_user_usage"("p_auth_user_id" "uuid", "p_query_type" "text", "p_increment" integer DEFAULT 1) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF p_query_type = 'text' THEN
    UPDATE public.users
    SET 
      text_count = text_count + p_increment,
      total_requests = total_requests + p_increment,
      updated_at = NOW()
    WHERE auth_user_id = p_auth_user_id;
  ELSIF p_query_type = 'image' THEN
    UPDATE public.users
    SET 
      image_count = image_count + p_increment,
      total_requests = total_requests + p_increment,
      updated_at = NOW()
    WHERE auth_user_id = p_auth_user_id;
  END IF;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."increment_user_usage"("p_auth_user_id" "uuid", "p_query_type" "text", "p_increment" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."messages_set_auth_user_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Get auth_user_id from the conversation
  SELECT auth_user_id INTO NEW.auth_user_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."messages_set_auth_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_messages_to_table"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  conv_record RECORD;
  msg_record jsonb;
BEGIN
  FOR conv_record IN 
    SELECT id, messages 
    FROM conversations 
    WHERE messages IS NOT NULL 
      AND jsonb_array_length(messages) > 0
      AND NOT EXISTS (
        SELECT 1 FROM messages m WHERE m.conversation_id = conversations.id
      )
  LOOP
    FOR msg_record IN 
      SELECT * FROM jsonb_array_elements(conv_record.messages)
    LOOP
      INSERT INTO messages (conversation_id, role, content, created_at)
      VALUES (
        conv_record.id,
        msg_record->>'role',
        msg_record->>'content',
        COALESCE(
          (msg_record->>'timestamp')::timestamptz,
          (msg_record->>'created_at')::timestamptz,
          now()
        )
      );
    END LOOP;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."migrate_messages_to_table"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_and_activate_connection"("p_code" "text", "p_user_id" "uuid", "p_device_info" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("success" boolean, "message" "text", "user_email" "text", "user_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
DECLARE
  v_owner_user_id UUID;
  v_is_active BOOLEAN;
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  -- Validate code format
  IF p_code !~ '^\d{6}$' THEN
    RETURN QUERY SELECT 
      false, 
      'Invalid code format. Please enter exactly 6 digits.',
      NULL::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Check if this code is owned by anyone
  SELECT 
    id,
    connection_active,
    email,
    full_name
  INTO 
    v_owner_user_id, 
    v_is_active,
    v_user_email,
    v_user_name
  FROM public.users
  WHERE connection_code = p_code;

  -- Case 1: Code is completely new and unused
  IF v_owner_user_id IS NULL THEN
    -- First, clear any old code this user might have had to ensure they only own one at a time.
    UPDATE public.users
    SET connection_code = NULL, connection_active = false
    WHERE id = p_user_id;

    -- Now, claim the new code for the current user and activate it
    UPDATE public.users
    SET
      connection_code = p_code,
      connection_code_created_at = NOW(),
      connection_active = true,
      pc_connected = true,
      connection_device_info = p_device_info,
      last_connection_at = NOW(),
      updated_at = NOW()
    WHERE id = p_user_id;

    -- Return success
    RETURN QUERY SELECT true, 'Connection successful!', (SELECT u.email FROM public.users u WHERE u.id = p_user_id), (SELECT u.full_name FROM public.users u WHERE u.id = p_user_id);
    RETURN;
  END IF;

  -- Case 2: Code already exists. Check who owns it.
  IF v_owner_user_id = p_user_id THEN
    -- It's the user's own code. They are likely reconnecting.
    -- Check if it's already active on another device.
    IF v_is_active THEN
      -- Reject the connection because a device is already active with this code.
      RETURN QUERY SELECT false, 'A device is already connected with this code. Please disconnect the other device first or generate a new code in the PC app.', v_user_email, v_user_name;
      RETURN;
    ELSE
      -- It's their code, but it's inactive. This is a simple reconnection. Reactivate it.
      UPDATE public.users
      SET 
        connection_active = true, 
        pc_connected = true, 
        last_connection_at = NOW(), 
        connection_device_info = p_device_info, 
        updated_at = NOW()
      WHERE id = p_user_id;
      
      RETURN QUERY SELECT true, 'Connection re-established successfully!', v_user_email, v_user_name;
      RETURN;
    END IF;
  ELSE
    -- Case 3: The code belongs to a DIFFERENT user. This is a critical security check.
    RETURN QUERY SELECT 
      false, 
      'This code is already in use by another account. Please generate a new code in your connector app.', 
      NULL::TEXT, 
      NULL::TEXT;
    RETURN;
  END IF;
END;
$_$;


ALTER FUNCTION "public"."register_and_activate_connection"("p_code" "text", "p_user_id" "uuid", "p_device_info" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."register_and_activate_connection"("p_code" "text", "p_user_id" "uuid", "p_device_info" "jsonb") IS 'Validates a PC-generated code and activates the connection, enforcing single-device policy.';



CREATE OR REPLACE FUNCTION "public"."reset_monthly_usage"() RETURNS TABLE("users_reset" integer, "reset_timestamp" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_users_reset INTEGER := 0;
  v_reset_timestamp TIMESTAMPTZ := NOW();
BEGIN
  -- Reset usage for users whose last_reset is in a previous month
  UPDATE public.users
  SET 
    text_count = 0,
    image_count = 0,
    total_requests = 0,
    last_reset = v_reset_timestamp,
    updated_at = v_reset_timestamp
  WHERE 
    -- Check if last_reset is in a different month/year than current date
    DATE_TRUNC('month', last_reset) < DATE_TRUNC('month', v_reset_timestamp);
  
  -- Get count of affected rows
  GET DIAGNOSTICS v_users_reset = ROW_COUNT;
  
  -- Log the reset operation
  RAISE NOTICE 'Monthly usage reset completed. % users reset at %', v_users_reset, v_reset_timestamp;
  
  -- Return results
  RETURN QUERY SELECT v_users_reset, v_reset_timestamp;
END;
$$;


ALTER FUNCTION "public"."reset_monthly_usage"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reset_monthly_usage"() IS 'Resets text_count, image_count, and total_requests to 0 for all users whose last_reset was in a previous month. Returns the number of users reset and the timestamp.';



CREATE OR REPLACE FUNCTION "public"."rollback_messages_to_jsonb"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
  UPDATE conversations c
  SET messages = (
    SELECT jsonb_agg(
      jsonb_build_object(
        'role', m.role,
        'content', m.content,
        'timestamp', m.created_at
      )
      ORDER BY m.created_at
    )
    FROM messages m
    WHERE m.conversation_id = c.id
  )
  WHERE EXISTS (
    SELECT 1 FROM messages m WHERE m.conversation_id = c.id
  );
END;
$$;


ALTER FUNCTION "public"."rollback_messages_to_jsonb"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_message_transaction"("p_conversation_id" "text", "p_role" "text", "p_content" "text", "p_image_url" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("message_id" "uuid", "message_created_at" timestamp with time zone, "message_content" "text", "message_role" "text", "message_image_url" "text", "message_metadata" "jsonb", "conversation_updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_message_id UUID;
  v_auth_user_id UUID;
  v_created_at TIMESTAMPTZ;
  v_conversation_updated_at TIMESTAMPTZ;
BEGIN
  -- ✅ VALIDATION 1: Check conversation exists
  SELECT auth_user_id INTO v_auth_user_id
  FROM conversations
  WHERE id = p_conversation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation % does not exist', p_conversation_id
      USING HINT = 'Create conversation before adding messages';
  END IF;
  
  -- ✅ VALIDATION 2: Verify auth_user_id is not NULL
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Conversation % has NULL auth_user_id', p_conversation_id
      USING HINT = 'Conversation must have valid auth_user_id';
  END IF;
  
  -- ✅ VALIDATION 3: Validate role
  IF p_role NOT IN ('user', 'assistant', 'system') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be user, assistant, or system', p_role;
  END IF;
  
  -- ✅ VALIDATION 4: Validate content not empty
  IF p_content IS NULL OR trim(p_content) = '' THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;
  
  -- ✅ Get current timestamp for consistency
  v_created_at := NOW();
  
  -- ✅ TRANSACTION START: Insert message with explicit auth_user_id
  INSERT INTO messages (
    conversation_id,
    role,
    content,
    image_url,
    metadata,
    auth_user_id,
    created_at
  ) VALUES (
    p_conversation_id,
    p_role,
    p_content,
    p_image_url,
    p_metadata,
    v_auth_user_id,
    v_created_at
  )
  RETURNING id INTO v_message_id;
  
  -- ✅ TRANSACTION: Update conversation timestamp atomically
  UPDATE conversations
  SET updated_at = v_created_at
  WHERE id = p_conversation_id
  RETURNING updated_at INTO v_conversation_updated_at;
  
  -- ✅ Return complete message data (eliminates second SELECT)
  RETURN QUERY
  SELECT
    v_message_id,
    v_created_at,
    p_content,
    p_role,
    p_image_url,
    p_metadata,
    v_conversation_updated_at;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error context for debugging
    RAISE WARNING 'save_message_transaction failed for conversation %: %', 
      p_conversation_id, SQLERRM;
    -- Re-raise with context
    RAISE EXCEPTION 'Failed to save message: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."save_message_transaction"("p_conversation_id" "text", "p_role" "text", "p_content" "text", "p_image_url" "text", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."save_message_transaction"("p_conversation_id" "text", "p_role" "text", "p_content" "text", "p_image_url" "text", "p_metadata" "jsonb") IS 'Atomically saves a message and updates conversation timestamp. Returns complete message data to eliminate second SELECT. Validates conversation exists and has auth_user_id. Accepts TEXT conversation_id for custom IDs (game-hub, game-*).';



CREATE OR REPLACE FUNCTION "public"."save_onboarding_step"("p_user_id" "uuid", "p_step" "text", "p_data" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  -- Get auth_user_id from users table
  SELECT auth_user_id INTO v_auth_user_id
  FROM public.users
  WHERE id = p_user_id;

  -- If not found, use p_user_id directly (assuming it's auth_user_id)
  IF v_auth_user_id IS NULL THEN
    v_auth_user_id := p_user_id;
  END IF;

  -- Insert or update onboarding progress using auth_user_id
  INSERT INTO public.onboarding_progress (user_id, auth_user_id, step, data, completed, created_at, updated_at)
  VALUES (p_user_id, v_auth_user_id, p_step, p_data, false, NOW(), NOW())
  ON CONFLICT (user_id, step) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."save_onboarding_step"("p_user_id" "uuid", "p_step" "text", "p_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."subtabs_set_auth_user_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Get auth_user_id from the conversation
  SELECT auth_user_id INTO NEW.auth_user_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."subtabs_set_auth_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_last_login"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.last_login = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_last_login"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_subtabs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_subtabs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_onboarding_status"("user_id" "uuid", "status" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  -- function body (prefer schema-qualified names here too)
  UPDATE public.users SET onboarding_status = status WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."update_user_onboarding_status"("user_id" "uuid", "status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_onboarding_status"("p_user_id" "uuid", "p_step" "text", "p_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Update the specific step in users table
  CASE p_step
    WHEN 'initial' THEN
      UPDATE users 
      SET has_seen_splash_screens = true,
          onboarding_data = onboarding_data || p_data,
          updated_at = now()
      WHERE auth_user_id = p_user_id;
      
    WHEN 'how-to-use' THEN
      UPDATE users 
      SET has_seen_how_to_use = true,
          pc_connected = COALESCE((p_data->>'pc_connected')::boolean, pc_connected),
          pc_connection_skipped = COALESCE((p_data->>'pc_connection_skipped')::boolean, pc_connection_skipped),
          onboarding_data = onboarding_data || p_data,
          updated_at = now()
      WHERE auth_user_id = p_user_id;
      
    WHEN 'features-connected' THEN
      UPDATE users 
      SET has_seen_features_connected = true,
          onboarding_data = onboarding_data || p_data,
          updated_at = now()
      WHERE auth_user_id = p_user_id;
      
    WHEN 'pro-features' THEN
      UPDATE users 
      SET has_seen_pro_features = true,
          onboarding_data = onboarding_data || p_data,
          updated_at = now()
      WHERE auth_user_id = p_user_id;
      
    WHEN 'profile-setup' THEN
      UPDATE users 
      SET has_profile_setup = true,
          profile_data = COALESCE(p_data, profile_data),
          onboarding_data = onboarding_data || p_data,
          updated_at = now()
      WHERE auth_user_id = p_user_id;
      
    WHEN 'complete' THEN
      UPDATE users 
      SET onboarding_completed = true,
          onboarding_data = onboarding_data || p_data,
          updated_at = now()
      WHERE auth_user_id = p_user_id;
      
    ELSE
      RAISE EXCEPTION 'Unknown onboarding step: %', p_step;
  END CASE;
END;
$$;


ALTER FUNCTION "public"."update_user_onboarding_status"("p_user_id" "uuid", "p_step" "text", "p_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_user_onboarding_status"("p_user_id" "uuid", "p_step" "text", "p_data" "jsonb") IS 'Updates user onboarding progress. SECURITY DEFINER with search_path protection.';



CREATE OR REPLACE FUNCTION "public"."update_user_tier"("p_user_id" "uuid", "p_tier" "text", "p_text_limit" integer, "p_image_limit" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.users SET
    tier = p_tier,
    trial_expires_at = NULL,
    text_limit = p_text_limit,
    image_limit = p_image_limit,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."update_user_tier"("p_user_id" "uuid", "p_tier" "text", "p_text_limit" integer, "p_image_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_waitlist_email_status"("waitlist_email" "text", "new_status" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Update the waitlist entry
  UPDATE public.waitlist
  SET 
    email_status = new_status,
    email_sent_at = CASE WHEN new_status = 'sent' THEN NOW() ELSE email_sent_at END,
    updated_at = NOW()
  WHERE email = waitlist_email;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_waitlist_email_status"("waitlist_email" "text", "new_status" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_waitlist_email_status"("waitlist_email" "text", "new_status" "text") IS 'Updates the email delivery status for a waitlist entry. Uses fixed search_path for security.';



CREATE OR REPLACE FUNCTION "public"."upsert_subscription"("p_user_id" "uuid", "p_lemon_subscription_id" "text", "p_lemon_customer_id" "text", "p_tier" "text", "p_status" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_subscription_id UUID;
BEGIN
  INSERT INTO public.subscriptions (
    user_id, lemon_subscription_id, lemon_customer_id, 
    lemon_product_id, lemon_variant_id, tier, status, 
    billing_interval, updated_at
  ) VALUES (
    p_user_id, p_lemon_subscription_id, p_lemon_customer_id,
    '724192', CASE WHEN p_tier = 'vanguard_pro' THEN '1139844' ELSE '1139861' END,
    p_tier, p_status,
    CASE WHEN p_tier = 'vanguard_pro' THEN 'year' ELSE 'month' END,
    NOW()
  )
  ON CONFLICT (lemon_subscription_id) DO UPDATE SET
    status = EXCLUDED.status,
    tier = EXCLUDED.tier,
    updated_at = NOW()
  RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$;


ALTER FUNCTION "public"."upsert_subscription"("p_user_id" "uuid", "p_lemon_subscription_id" "text", "p_lemon_customer_id" "text", "p_tier" "text", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_active_subscription"("p_auth_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    has_subscription BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.subscriptions s
        INNER JOIN public.users u ON s.user_id = u.id
        WHERE u.auth_user_id = p_auth_user_id
            AND s.status IN ('active', 'on_trial')
    ) INTO has_subscription;
    
    RETURN has_subscription;
END;
$$;


ALTER FUNCTION "public"."user_has_active_subscription"("p_auth_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_subtab_for_unreleased"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  is_unreleased_game boolean;
BEGIN
  -- Check if conversation is for unreleased game
  SELECT is_unreleased INTO is_unreleased_game
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  IF is_unreleased_game = true THEN
    RAISE EXCEPTION 'Subtabs cannot be created for unreleased games'
      USING HINT = 'Unreleased games do not support subtabs feature';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_subtab_for_unreleased"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "conversation_id" "text",
    "message_id" "text" NOT NULL,
    "feedback_type" "text" NOT NULL,
    "content_type" "text" NOT NULL,
    "category" "text",
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "correction_text" "text",
    "correction_type" "text",
    "correction_scope" "text" DEFAULT 'game'::"text",
    "is_validated" boolean DEFAULT false,
    "validation_reason" "text",
    "game_title" "text",
    CONSTRAINT "ai_feedback_category_check" CHECK ((("category" IS NULL) OR ("category" = ANY (ARRAY['not_helpful'::"text", 'incorrect'::"text", 'off_topic'::"text", 'inappropriate'::"text", 'correction'::"text", 'other'::"text"])))),
    CONSTRAINT "ai_feedback_content_type_check" CHECK (("content_type" = ANY (ARRAY['message'::"text", 'subtab'::"text"]))),
    CONSTRAINT "ai_feedback_correction_scope_check" CHECK ((("correction_scope" IS NULL) OR ("correction_scope" = ANY (ARRAY['game'::"text", 'global'::"text"])))),
    CONSTRAINT "ai_feedback_correction_type_check" CHECK ((("correction_type" IS NULL) OR ("correction_type" = ANY (ARRAY['factual'::"text", 'style'::"text", 'terminology'::"text", 'behavior'::"text"])))),
    CONSTRAINT "ai_feedback_feedback_type_check" CHECK (("feedback_type" = ANY (ARRAY['up'::"text", 'down'::"text"])))
);


ALTER TABLE "public"."ai_feedback" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_feedback" IS 'Stores user feedback (thumbs up/down) on AI responses and subtab content';



COMMENT ON COLUMN "public"."ai_feedback"."feedback_type" IS 'Type of feedback: up (positive) or down (negative)';



COMMENT ON COLUMN "public"."ai_feedback"."content_type" IS 'Whether feedback is for a message or subtab';



COMMENT ON COLUMN "public"."ai_feedback"."category" IS 'Category of negative feedback for analysis';



COMMENT ON COLUMN "public"."ai_feedback"."comment" IS 'Optional user comment explaining their feedback';



COMMENT ON COLUMN "public"."ai_feedback"."correction_text" IS 'User-provided correction text (what AI should have said)';



COMMENT ON COLUMN "public"."ai_feedback"."correction_type" IS 'Type of correction: factual, style, terminology, behavior';



COMMENT ON COLUMN "public"."ai_feedback"."correction_scope" IS 'Scope: game (per-game) or global (all conversations)';



COMMENT ON COLUMN "public"."ai_feedback"."is_validated" IS 'Whether the correction passed AI validation';



COMMENT ON COLUMN "public"."ai_feedback"."validation_reason" IS 'Reason for validation success/failure';



COMMENT ON COLUMN "public"."ai_feedback"."game_title" IS 'Game title for game-specific corrections';



CREATE OR REPLACE VIEW "public"."ai_feedback_stats" WITH ("security_invoker"='true') AS
 SELECT "date_trunc"('day'::"text", "created_at") AS "date",
    "count"(*) AS "total_feedback",
    "count"(*) FILTER (WHERE ("feedback_type" = 'up'::"text")) AS "positive_count",
    "count"(*) FILTER (WHERE ("feedback_type" = 'down'::"text")) AS "negative_count",
    "count"(*) FILTER (WHERE ("category" = 'not_helpful'::"text")) AS "not_helpful_count",
    "count"(*) FILTER (WHERE ("category" = 'incorrect'::"text")) AS "incorrect_count",
    "count"(*) FILTER (WHERE ("category" = 'off_topic'::"text")) AS "off_topic_count",
    "count"(*) FILTER (WHERE ("category" = 'inappropriate'::"text")) AS "inappropriate_count",
    "count"(*) FILTER (WHERE ("category" = 'other'::"text")) AS "other_count"
   FROM "public"."ai_feedback"
  GROUP BY ("date_trunc"('day'::"text", "created_at"))
  ORDER BY ("date_trunc"('day'::"text", "created_at")) DESC;


ALTER VIEW "public"."ai_feedback_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "cache_key" "text" NOT NULL,
    "response_data" "jsonb" NOT NULL,
    "game_title" "text",
    "cache_type" "text" DEFAULT 'game_specific'::"text",
    "conversation_id" "uuid",
    "model_used" "text",
    "tokens_used" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."ai_responses" OWNER TO "postgres";


COMMENT ON COLUMN "public"."ai_responses"."user_id" IS 'Stores auth.uid() for tracking who created the cache - NOT a foreign key';



CREATE TABLE IF NOT EXISTS "public"."ai_shown_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "conversation_id" "text",
    "prompt_text" "text" NOT NULL,
    "prompt_type" "text" NOT NULL,
    "game_title" "text",
    "shown_at" timestamp with time zone DEFAULT "now"(),
    "clicked" boolean DEFAULT false,
    "clicked_at" timestamp with time zone,
    CONSTRAINT "ai_shown_prompts_prompt_type_check" CHECK (("prompt_type" = ANY (ARRAY['inline'::"text", 'news'::"text", 'suggested'::"text", 'exploration'::"text", 'help'::"text", 'followup'::"text"])))
);


ALTER TABLE "public"."ai_shown_prompts" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_shown_prompts" IS 'Tracks prompts shown to users to prevent repetition';



COMMENT ON COLUMN "public"."ai_shown_prompts"."auth_user_id" IS 'References auth.users(id) for RLS';



COMMENT ON COLUMN "public"."ai_shown_prompts"."prompt_type" IS 'Type: inline, news, suggested, exploration, help';



COMMENT ON COLUMN "public"."ai_shown_prompts"."game_title" IS 'Game context for game-specific prompt tracking';



COMMENT ON COLUMN "public"."ai_shown_prompts"."clicked" IS 'Whether the user clicked/used this prompt';



CREATE TABLE IF NOT EXISTS "public"."api_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "request_type" "text" NOT NULL,
    "tokens_used" integer DEFAULT 0,
    "cost_cents" real DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "auth_user_id" "uuid",
    "ai_model" "text",
    "endpoint" "text"
);


ALTER TABLE "public"."api_usage" OWNER TO "postgres";


COMMENT ON COLUMN "public"."api_usage"."user_id" IS 'References users.id (internal UUID, not auth_user_id)';



CREATE TABLE IF NOT EXISTS "public"."app_cache" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "cache_type" "text" DEFAULT 'general'::"text",
    "user_id" "uuid",
    "size_bytes" integer DEFAULT 0
);


ALTER TABLE "public"."app_cache" OWNER TO "postgres";


COMMENT ON COLUMN "public"."app_cache"."user_id" IS 'Stores auth.uid() for tracking - NOT a foreign key to users table';



CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "text" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "slug" "text",
    "title" "text" NOT NULL,
    "game_id" "text",
    "game_title" "text",
    "genre" "text",
    "is_active_session" boolean DEFAULT false,
    "active_objective" "text",
    "game_progress" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "is_pinned" boolean DEFAULT false,
    "pinned_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_game_hub" boolean DEFAULT false,
    "context_summary" "text",
    "last_summarized_at" bigint,
    "is_unreleased" boolean DEFAULT false,
    "auth_user_id" "uuid"
);

ALTER TABLE ONLY "public"."conversations" REPLICA IDENTITY FULL;


ALTER TABLE "public"."conversations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."conversations"."id" IS 'Primary key - TEXT type to support custom IDs like game-hub';



COMMENT ON COLUMN "public"."conversations"."user_id" IS 'References users.id (internal UUID, not auth_user_id)';



COMMENT ON COLUMN "public"."conversations"."slug" IS 'Optional slug for special conversations (e.g., "everything-else"). Regular conversations use UUID in id.';



COMMENT ON COLUMN "public"."conversations"."is_game_hub" IS 'Identifies the default Game Hub conversation - only one per user, cannot be deleted';



COMMENT ON COLUMN "public"."conversations"."context_summary" IS 'AI-generated summary of conversation history (max 500 words, text-only). Used for context injection in prompts.';



COMMENT ON COLUMN "public"."conversations"."last_summarized_at" IS 'Unix timestamp (milliseconds) of when context_summary was last updated. Used to determine staleness.';



COMMENT ON COLUMN "public"."conversations"."is_unreleased" IS 'Indicates if this conversation is for an unreleased/upcoming game. Unreleased games have limited features (e.g., no subtabs, discussion mode only).';



CREATE TABLE IF NOT EXISTS "public"."game_hub_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "query_text" "text" NOT NULL,
    "query_timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "message_id" "uuid",
    "response_text" "text",
    "response_timestamp" timestamp with time zone,
    "response_message_id" "uuid",
    "detected_game" "text",
    "detection_confidence" "text",
    "detected_genre" "text",
    "game_status" "text",
    "tab_created" boolean DEFAULT false,
    "tab_created_at" timestamp with time zone,
    "created_conversation_id" "text",
    "ai_model" "text" DEFAULT 'gemini-2.5-flash-preview-09-2025'::"text",
    "tokens_used" integer,
    "query_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "game_hub_interactions_detection_confidence_check" CHECK (("detection_confidence" = ANY (ARRAY['high'::"text", 'low'::"text"]))),
    CONSTRAINT "game_hub_interactions_game_status_check" CHECK (("game_status" = ANY (ARRAY['released'::"text", 'unreleased'::"text"]))),
    CONSTRAINT "game_hub_interactions_query_type_check" CHECK (("query_type" = ANY (ARRAY['general'::"text", 'game_specific'::"text", 'recommendation'::"text"])))
);


ALTER TABLE "public"."game_hub_interactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."game_hub_interactions" IS 'Tracks all Game Hub queries and responses with game detection metadata';



CREATE TABLE IF NOT EXISTS "public"."game_knowledge_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "igdb_id" integer NOT NULL,
    "game_name" "text" NOT NULL,
    "game_slug" "text",
    "comprehensive_knowledge" "text" NOT NULL,
    "knowledge_summary" "text",
    "tokens_used" integer DEFAULT 0,
    "fetched_with_grounding" boolean DEFAULT true,
    "is_post_cutoff" boolean DEFAULT false,
    "is_unreleased" boolean DEFAULT false,
    "release_date" "date",
    "version" integer DEFAULT 1,
    "last_refreshed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "access_count" integer DEFAULT 0,
    "last_accessed_at" timestamp with time zone
);


ALTER TABLE "public"."game_knowledge_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."game_knowledge_cache" IS 'Global cache for comprehensive game knowledge. Fetched once with grounding, shared across all users and tiers.';



COMMENT ON COLUMN "public"."game_knowledge_cache"."comprehensive_knowledge" IS 'Full game knowledge including spoilers, strategies, secrets. Used as RAG context.';



COMMENT ON COLUMN "public"."game_knowledge_cache"."is_post_cutoff" IS 'Game released after Gemini knowledge cutoff (Jan 2025)';



COMMENT ON COLUMN "public"."game_knowledge_cache"."version" IS 'Knowledge version for tracking updates (DLC, patches)';



CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "igdb_game_id" integer,
    "game_title" "text" NOT NULL,
    "game_slug" "text",
    "genre" "text",
    "cover_url" "text",
    "total_tabs_created" integer DEFAULT 0 NOT NULL,
    "total_conversations" integer DEFAULT 0 NOT NULL,
    "total_messages" integer DEFAULT 0 NOT NULL,
    "total_users" integer DEFAULT 0 NOT NULL,
    "total_subtabs_generated" integer DEFAULT 0 NOT NULL,
    "common_questions" "jsonb" DEFAULT '[]'::"jsonb",
    "popular_subtabs" "jsonb" DEFAULT '[]'::"jsonb",
    "top_genres_mentioned" "jsonb" DEFAULT '[]'::"jsonb",
    "average_session_length_minutes" real DEFAULT 0,
    "average_messages_per_conversation" real DEFAULT 0,
    "thumbs_up_count" integer DEFAULT 0,
    "thumbs_down_count" integer DEFAULT 0,
    "first_tab_created_at" timestamp with time zone,
    "last_tab_created_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."games" OWNER TO "postgres";


COMMENT ON TABLE "public"."games" IS 'GLOBAL game analytics table. Tracks aggregate statistics across ALL users for each game. NOT per-user data (use user_library for that).';



COMMENT ON COLUMN "public"."games"."igdb_game_id" IS 'IGDB game identifier for linking';



COMMENT ON COLUMN "public"."games"."total_tabs_created" IS 'How many users created tabs for this game';



COMMENT ON COLUMN "public"."games"."total_users" IS 'Number of unique users who interacted with this game';



COMMENT ON COLUMN "public"."games"."common_questions" IS 'Array of {question: string, count: number} - most asked questions';



COMMENT ON COLUMN "public"."games"."popular_subtabs" IS 'Array of {subtab_type: string, generated_count: number} - which subtabs users create most';



COMMENT ON COLUMN "public"."games"."thumbs_up_count" IS 'Total positive AI feedback for this game';



COMMENT ON COLUMN "public"."games"."thumbs_down_count" IS 'Total negative AI feedback for this game';



CREATE TABLE IF NOT EXISTS "public"."gaming_knowledge" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "igdb_game_id" integer NOT NULL,
    "game_name" "text" NOT NULL,
    "walkthrough_data" "jsonb",
    "story_progression" "jsonb",
    "collectibles" "jsonb",
    "achievements" "jsonb",
    "tips_and_tricks" "jsonb",
    "boss_strategies" "jsonb",
    "character_builds" "jsonb",
    "game_mechanics" "jsonb",
    "extracted_at" timestamp with time zone NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."gaming_knowledge" OWNER TO "postgres";


COMMENT ON TABLE "public"."gaming_knowledge" IS 'RLS policies optimized with (select auth.uid()) for better performance at scale';



COMMENT ON COLUMN "public"."gaming_knowledge"."igdb_game_id" IS 'IGDB game ID';



COMMENT ON COLUMN "public"."gaming_knowledge"."game_name" IS 'Name of the game';



COMMENT ON COLUMN "public"."gaming_knowledge"."walkthrough_data" IS 'Game walkthrough information';



COMMENT ON COLUMN "public"."gaming_knowledge"."story_progression" IS 'Story progression tracking';



COMMENT ON COLUMN "public"."gaming_knowledge"."collectibles" IS 'Collectibles information';



COMMENT ON COLUMN "public"."gaming_knowledge"."achievements" IS 'Achievements/trophies data';



COMMENT ON COLUMN "public"."gaming_knowledge"."tips_and_tricks" IS 'Tips and tricks';



COMMENT ON COLUMN "public"."gaming_knowledge"."boss_strategies" IS 'Boss fight strategies';



COMMENT ON COLUMN "public"."gaming_knowledge"."character_builds" IS 'Character build recommendations';



COMMENT ON COLUMN "public"."gaming_knowledge"."game_mechanics" IS 'Game mechanics explanations';



COMMENT ON COLUMN "public"."gaming_knowledge"."extracted_at" IS 'When the knowledge was first extracted';



COMMENT ON COLUMN "public"."gaming_knowledge"."last_updated" IS 'When the knowledge was last updated';



CREATE TABLE IF NOT EXISTS "public"."gaming_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "gaming_start_year" integer,
    "owned_count" integer DEFAULT 0 NOT NULL,
    "completed_count" integer DEFAULT 0 NOT NULL,
    "wishlist_count" integer DEFAULT 0 NOT NULL,
    "favorites_count" integer DEFAULT 0 NOT NULL,
    "disliked_count" integer DEFAULT 0 NOT NULL,
    "total_hours_played" integer DEFAULT 0 NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."gaming_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."gaming_profiles" IS 'RLS policies optimized with (select auth.uid()) for better performance at scale';



COMMENT ON COLUMN "public"."gaming_profiles"."gaming_start_year" IS 'Year the user started gaming';



COMMENT ON COLUMN "public"."gaming_profiles"."owned_count" IS 'Count of owned games';



COMMENT ON COLUMN "public"."gaming_profiles"."completed_count" IS 'Count of completed games';



COMMENT ON COLUMN "public"."gaming_profiles"."wishlist_count" IS 'Count of wishlist games';



COMMENT ON COLUMN "public"."gaming_profiles"."favorites_count" IS 'Count of favorite games';



COMMENT ON COLUMN "public"."gaming_profiles"."disliked_count" IS 'Count of disliked games';



COMMENT ON COLUMN "public"."gaming_profiles"."total_hours_played" IS 'Total hours played across all games';



CREATE TABLE IF NOT EXISTS "public"."gaming_search_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "igdb_game_id" integer NOT NULL,
    "game_data" "jsonb" NOT NULL,
    "searched_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."gaming_search_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."gaming_search_history" IS 'RLS policies optimized with (select auth.uid()) for better performance at scale';



COMMENT ON COLUMN "public"."gaming_search_history"."igdb_game_id" IS 'IGDB game ID';



COMMENT ON COLUMN "public"."gaming_search_history"."game_data" IS 'Full IGDB game data (cached for offline access)';



COMMENT ON COLUMN "public"."gaming_search_history"."searched_at" IS 'When the user last searched for this game';



CREATE TABLE IF NOT EXISTS "public"."igdb_game_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_name_key" "text" NOT NULL,
    "igdb_id" integer,
    "game_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "is_released" boolean DEFAULT true,
    "release_date" "date",
    "access_count" integer DEFAULT 0,
    "last_accessed_at" timestamp with time zone,
    CONSTRAINT "igdb_cache_expires_check" CHECK (("expires_at" > "created_at"))
);


ALTER TABLE "public"."igdb_game_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."igdb_game_cache" IS 'Global cache for IGDB API responses. 30-day TTL for unreleased games, permanent for released games.';



COMMENT ON COLUMN "public"."igdb_game_cache"."game_name_key" IS 'Lowercase normalized game name for cache lookups';



COMMENT ON COLUMN "public"."igdb_game_cache"."igdb_id" IS 'IGDB game ID for direct lookups';



COMMENT ON COLUMN "public"."igdb_game_cache"."game_data" IS 'Full IGDB game data including cover, screenshots, etc';



COMMENT ON COLUMN "public"."igdb_game_cache"."expires_at" IS 'Cache expiry timestamp (24 hours from creation)';



COMMENT ON COLUMN "public"."igdb_game_cache"."is_released" IS 'If false, cache expires in 30 days. If true, cache never expires.';



CREATE TABLE IF NOT EXISTS "public"."igdb_home_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cache_key" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "cached_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."igdb_home_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."igdb_home_cache" IS 'Global cache for IGDB home tab data - shared across all users to reduce API calls. Expires after set time.';



COMMENT ON COLUMN "public"."igdb_home_cache"."cache_key" IS 'Unique identifier for cached data (e.g., featured_games, latest_games, new_releases, highest_rated, categories)';



COMMENT ON COLUMN "public"."igdb_home_cache"."data" IS 'Cached IGDB game data in JSONB format';



COMMENT ON COLUMN "public"."igdb_home_cache"."expires_at" IS 'Expiration timestamp - data should be refreshed after this time';



CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "text" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "image_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "auth_user_id" "uuid",
    CONSTRAINT "messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


COMMENT ON COLUMN "public"."messages"."conversation_id" IS 'Foreign key to conversations.id (TEXT type to support custom IDs)';



COMMENT ON COLUMN "public"."messages"."auth_user_id" IS 'Denormalized auth.users.id for RLS performance optimization';



CREATE TABLE IF NOT EXISTS "public"."news_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_hash" "text" NOT NULL,
    "prompt_text" "text" NOT NULL,
    "response_text" "text" NOT NULL,
    "response_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "grounding_metadata" "jsonb",
    "cached_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "first_requested_by_tier" "text",
    "access_count" integer DEFAULT 0,
    "last_accessed_at" timestamp with time zone,
    CONSTRAINT "news_cache_expires_check" CHECK (("expires_at" > "cached_at")),
    CONSTRAINT "news_cache_tier_check" CHECK (("first_requested_by_tier" = ANY (ARRAY['free'::"text", 'pro'::"text", 'vanguard_pro'::"text"])))
);


ALTER TABLE "public"."news_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."news_cache" IS '24-hour cache for latest gaming news prompts. Shared across all users and tiers.';



COMMENT ON COLUMN "public"."news_cache"."prompt_hash" IS 'SHA-256 hash of normalized prompt text for deduplication';



COMMENT ON COLUMN "public"."news_cache"."expires_at" IS 'Cache expires 24 hours after creation. Auto-cleaned by cron job.';



CREATE TABLE IF NOT EXISTS "public"."payment_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid",
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_name" "text" NOT NULL,
    "lemon_event_id" "text",
    "payload" "jsonb" NOT NULL,
    "processed" boolean DEFAULT false,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."payment_events" IS 'Logs all webhook events from LemonSqueezy for debugging and audit trail';



COMMENT ON COLUMN "public"."payment_events"."payload" IS 'Full webhook payload as JSON';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "lemon_subscription_id" "text" NOT NULL,
    "lemon_customer_id" "text" NOT NULL,
    "lemon_order_id" "text",
    "lemon_product_id" "text" DEFAULT '724192'::"text" NOT NULL,
    "lemon_variant_id" "text" NOT NULL,
    "tier" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "billing_interval" "text",
    "price_amount" integer,
    "currency" "text" DEFAULT 'USD'::"text",
    "trial_ends_at" timestamp with time zone,
    "renews_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "subscriptions_billing_interval_check" CHECK (("billing_interval" = ANY (ARRAY['month'::"text", 'year'::"text"]))),
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'expired'::"text", 'past_due'::"text", 'paused'::"text", 'unpaid'::"text", 'on_trial'::"text"]))),
    CONSTRAINT "subscriptions_tier_check" CHECK (("tier" = ANY (ARRAY['pro'::"text", 'vanguard_pro'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscriptions" IS 'Tracks user subscriptions from LemonSqueezy';



COMMENT ON COLUMN "public"."subscriptions"."lemon_subscription_id" IS 'LemonSqueezy subscription ID (unique identifier)';



COMMENT ON COLUMN "public"."subscriptions"."tier" IS 'Subscription tier: pro ($5/month) or vanguard_pro ($35/year)';



COMMENT ON COLUMN "public"."subscriptions"."status" IS 'Current subscription status';



CREATE TABLE IF NOT EXISTS "public"."subtab_refresh_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "conversation_id" "text" NOT NULL,
    "subtab_id" "uuid" NOT NULL,
    "refresh_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "refresh_count" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_refresh_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subtab_refresh_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."subtab_refresh_usage" IS 'Tracks daily subtab refresh usage. Pro/Vanguard: 3 refreshes per day.';



COMMENT ON COLUMN "public"."subtab_refresh_usage"."refresh_count" IS 'Number of subtab refreshes used today (max 3 for Pro/Vanguard)';



CREATE TABLE IF NOT EXISTS "public"."subtabs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "game_id" "uuid",
    "title" "text" NOT NULL,
    "content" "text" DEFAULT ''::"text",
    "tab_type" "text" NOT NULL,
    "order_index" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "conversation_id" "text",
    "auth_user_id" "uuid"
);


ALTER TABLE "public"."subtabs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."subtabs"."game_id" IS 'Deprecated: Use conversation_id instead. Kept for backward compatibility but now nullable.';



COMMENT ON COLUMN "public"."subtabs"."conversation_id" IS 'References conversations.id - the conversation this subtab belongs to.';



COMMENT ON COLUMN "public"."subtabs"."auth_user_id" IS 'Denormalized auth.users.id for RLS performance optimization';



CREATE TABLE IF NOT EXISTS "public"."unreleased_game_tabs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "conversation_id" "text" NOT NULL,
    "game_title" "text" NOT NULL,
    "igdb_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."unreleased_game_tabs" OWNER TO "postgres";


COMMENT ON TABLE "public"."unreleased_game_tabs" IS 'Tracks unreleased game tabs per user. Free: 2-3 max, Pro/Vanguard: 10 max.';



CREATE TABLE IF NOT EXISTS "public"."user_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "auth_user_id" "uuid"
);


ALTER TABLE "public"."user_analytics" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_analytics"."user_id" IS 'References users.id (internal UUID, not auth_user_id)';



CREATE TABLE IF NOT EXISTS "public"."user_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "feedback_type" "text" NOT NULL,
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_resolved" boolean DEFAULT false,
    "notes" "text",
    CONSTRAINT "user_feedback_feedback_type_check" CHECK (("feedback_type" = ANY (ARRAY['bug'::"text", 'feature'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."user_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_grounding_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "month_year" character varying(7) NOT NULL,
    "usage_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "game_knowledge_count" integer DEFAULT 0 NOT NULL,
    "ai_message_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."user_grounding_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_grounding_usage" IS 'Tracks monthly Google Search grounding usage per user. Split into two pools: Game Knowledge (20/mo) and AI Messages (30/mo) for Pro/Vanguard tiers.';



COMMENT ON COLUMN "public"."user_grounding_usage"."month_year" IS 'Month in YYYY-MM format for monthly usage tracking';



COMMENT ON COLUMN "public"."user_grounding_usage"."usage_count" IS 'DEPRECATED: Total grounding searches (kept for backward compatibility). Use game_knowledge_count + ai_message_count instead.';



COMMENT ON COLUMN "public"."user_grounding_usage"."game_knowledge_count" IS 'Number of game knowledge grounding searches used this month (limit: 20 for Pro/Vanguard)';



COMMENT ON COLUMN "public"."user_grounding_usage"."ai_message_count" IS 'Number of AI message grounding searches used this month (limit: 30 for Pro/Vanguard)';



CREATE TABLE IF NOT EXISTS "public"."user_library" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "igdb_game_id" integer NOT NULL,
    "game_title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "igdb_data" "jsonb" DEFAULT '{}'::"jsonb",
    "platform" "text",
    "personal_rating" integer,
    "completion_status" "text",
    "hours_played" numeric(10,2) DEFAULT 0,
    "notes" "text",
    "date_added" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "library_category_check" CHECK (("category" = ANY (ARRAY['own'::"text", 'wishlist'::"text", 'favorite'::"text", 'disliked'::"text"]))),
    CONSTRAINT "library_completion_status_check" CHECK ((("completion_status" IS NULL) OR ("completion_status" = ANY (ARRAY['not_started'::"text", 'playing'::"text", 'completed'::"text", 'abandoned'::"text"])))),
    CONSTRAINT "user_library_personal_rating_check" CHECK ((("personal_rating" >= 1) AND ("personal_rating" <= 5)))
);


ALTER TABLE "public"."user_library" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_library" IS 'User game library (own, wishlist, favorites, disliked). Replaces localStorage for cross-device sync. [CACHE REFRESH 2025-12-09]';



COMMENT ON COLUMN "public"."user_library"."category" IS 'Library category: own, wishlist, favorite, or disliked';



COMMENT ON COLUMN "public"."user_library"."igdb_data" IS 'Cached IGDB game data to reduce API calls';



COMMENT ON COLUMN "public"."user_library"."completion_status" IS 'Game completion status: not_started, playing, completed, or abandoned';



CREATE TABLE IF NOT EXISTS "public"."user_screenshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "screenshot_url" "text" NOT NULL,
    "thumbnail_url" "text",
    "game_title" "text",
    "detected_game_id" integer,
    "conversation_id" "text",
    "width" integer,
    "height" integer,
    "file_size_bytes" integer,
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "captured_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_screenshots" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_screenshots" IS 'User screenshot gallery for HQ interface. Replaces LocalStorage.';



CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_data" "jsonb" DEFAULT '{}'::"jsonb",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "duration_seconds" integer,
    "auth_user_id" "uuid"
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_sessions"."user_id" IS 'References users.id (internal UUID, not auth_user_id)';



CREATE TABLE IF NOT EXISTS "public"."user_timeline" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_title" "text" NOT NULL,
    "event_description" "text",
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "game_title" "text",
    "igdb_game_id" integer,
    "conversation_id" "text",
    "event_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "timeline_event_type_check" CHECK (("event_type" = ANY (ARRAY['game_added'::"text", 'game_completed'::"text", 'boss_defeated'::"text", 'achievement_unlocked'::"text", 'milestone_reached'::"text", 'note_added'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."user_timeline" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_timeline" IS 'User gaming journey timeline for HQ interface. Replaces LocalStorage. [CACHE REFRESH 2025-12-09]';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "tier" "text" DEFAULT 'free'::"text" NOT NULL,
    "is_developer" boolean DEFAULT false,
    "has_profile_setup" boolean DEFAULT false,
    "has_seen_splash_screens" boolean DEFAULT false,
    "has_seen_how_to_use" boolean DEFAULT false,
    "has_seen_features_connected" boolean DEFAULT false,
    "has_seen_pro_features" boolean DEFAULT false,
    "pc_connected" boolean DEFAULT false,
    "pc_connection_skipped" boolean DEFAULT false,
    "onboarding_completed" boolean DEFAULT false,
    "has_welcome_message" boolean DEFAULT false,
    "is_new_user" boolean DEFAULT true,
    "has_used_trial" boolean DEFAULT false,
    "text_count" integer DEFAULT 0,
    "image_count" integer DEFAULT 0,
    "text_limit" integer DEFAULT 20,
    "image_limit" integer DEFAULT 15,
    "total_requests" integer DEFAULT 0,
    "last_reset" timestamp with time zone DEFAULT "now"(),
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "usage_data" "jsonb" DEFAULT '{}'::"jsonb",
    "app_state" "jsonb" DEFAULT '{}'::"jsonb",
    "profile_data" "jsonb" DEFAULT '{}'::"jsonb",
    "onboarding_data" "jsonb" DEFAULT '{}'::"jsonb",
    "behavior_data" "jsonb" DEFAULT '{}'::"jsonb",
    "feedback_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_login" timestamp with time zone DEFAULT "now"(),
    "trial_started_at" timestamp with time zone,
    "trial_expires_at" timestamp with time zone,
    "active_subscription_id" "uuid",
    "lemon_customer_id" "text",
    "has_seen_welcome_guide" boolean DEFAULT false,
    CONSTRAINT "check_image_count_within_limit" CHECK (("image_count" <= "image_limit")),
    CONSTRAINT "check_text_count_within_limit" CHECK (("text_count" <= "text_limit")),
    CONSTRAINT "users_tier_check" CHECK (("tier" = ANY (ARRAY['free'::"text", 'pro'::"text", 'vanguard_pro'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'User accounts and preferences. [CACHE REFRESH 2025-12-16]';



COMMENT ON COLUMN "public"."users"."auth_user_id" IS 'References auth.users(id) - this is what auth.uid() returns';



COMMENT ON COLUMN "public"."users"."trial_started_at" IS 'When the user started their 14-day trial';



COMMENT ON COLUMN "public"."users"."trial_expires_at" IS 'When the user trial expires';



COMMENT ON COLUMN "public"."users"."active_subscription_id" IS 'Reference to current active subscription';



COMMENT ON COLUMN "public"."users"."lemon_customer_id" IS 'LemonSqueezy customer ID for this user';



COMMENT ON COLUMN "public"."users"."has_seen_welcome_guide" IS 'Tracks whether user has seen the welcome guide/screen. Set to true after first view. Persists across devices and logout/login cycles.';



COMMENT ON CONSTRAINT "check_image_count_within_limit" ON "public"."users" IS 'Ensures image_count never exceeds image_limit at database level';



COMMENT ON CONSTRAINT "check_text_count_within_limit" ON "public"."users" IS 'Ensures text_count never exceeds text_limit at database level';



CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "source" "text" DEFAULT 'landing_page'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "invited_at" timestamp with time zone,
    "email_sent_at" timestamp with time zone,
    "email_status" "text" DEFAULT 'pending'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "waitlist_email_status_check" CHECK (("email_status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text"]))),
    CONSTRAINT "waitlist_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


COMMENT ON TABLE "public"."waitlist" IS 'Pre-launch waitlist for user signups';



CREATE OR REPLACE VIEW "public"."waitlist_pending_emails" WITH ("security_invoker"='true') AS
 SELECT "id",
    "email",
    "source",
    "created_at",
    "email_status"
   FROM "public"."waitlist"
  WHERE (("email_status" = 'pending'::"text") AND ("email_sent_at" IS NULL))
  ORDER BY "created_at";


ALTER VIEW "public"."waitlist_pending_emails" OWNER TO "postgres";


COMMENT ON VIEW "public"."waitlist_pending_emails" IS 'Shows waitlist entries pending email delivery. Uses SECURITY INVOKER (caller permissions).';



ALTER TABLE ONLY "public"."ai_feedback"
    ADD CONSTRAINT "ai_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_responses"
    ADD CONSTRAINT "ai_responses_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."ai_responses"
    ADD CONSTRAINT "ai_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_shown_prompts"
    ADD CONSTRAINT "ai_shown_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_usage"
    ADD CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_cache"
    ADD CONSTRAINT "app_cache_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_hub_interactions"
    ADD CONSTRAINT "game_hub_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_knowledge_cache"
    ADD CONSTRAINT "game_knowledge_cache_igdb_id_key" UNIQUE ("igdb_id");



ALTER TABLE ONLY "public"."game_knowledge_cache"
    ADD CONSTRAINT "game_knowledge_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_igdb_game_id_key" UNIQUE ("igdb_game_id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_unique_title" UNIQUE ("game_title");



ALTER TABLE ONLY "public"."gaming_knowledge"
    ADD CONSTRAINT "gaming_knowledge_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gaming_knowledge"
    ADD CONSTRAINT "gaming_knowledge_unique_game" UNIQUE ("auth_user_id", "igdb_game_id");



ALTER TABLE ONLY "public"."gaming_profiles"
    ADD CONSTRAINT "gaming_profiles_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."gaming_profiles"
    ADD CONSTRAINT "gaming_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gaming_search_history"
    ADD CONSTRAINT "gaming_search_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gaming_search_history"
    ADD CONSTRAINT "gaming_search_history_unique_search" UNIQUE ("auth_user_id", "igdb_game_id");



ALTER TABLE ONLY "public"."igdb_game_cache"
    ADD CONSTRAINT "igdb_game_cache_game_name_key_key" UNIQUE ("game_name_key");



ALTER TABLE ONLY "public"."igdb_game_cache"
    ADD CONSTRAINT "igdb_game_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."igdb_home_cache"
    ADD CONSTRAINT "igdb_home_cache_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."igdb_home_cache"
    ADD CONSTRAINT "igdb_home_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news_cache"
    ADD CONSTRAINT "news_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news_cache"
    ADD CONSTRAINT "news_cache_prompt_hash_key" UNIQUE ("prompt_hash");



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_lemon_event_id_key" UNIQUE ("lemon_event_id");



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_lemon_subscription_id_key" UNIQUE ("lemon_subscription_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subtab_refresh_usage"
    ADD CONSTRAINT "subtab_refresh_usage_auth_user_id_refresh_date_key" UNIQUE ("auth_user_id", "refresh_date");



ALTER TABLE ONLY "public"."subtab_refresh_usage"
    ADD CONSTRAINT "subtab_refresh_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subtabs"
    ADD CONSTRAINT "subtabs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_library"
    ADD CONSTRAINT "unique_user_game_category" UNIQUE ("auth_user_id", "igdb_game_id", "category");



ALTER TABLE ONLY "public"."unreleased_game_tabs"
    ADD CONSTRAINT "unreleased_game_tabs_conversation_id_key" UNIQUE ("conversation_id");



ALTER TABLE ONLY "public"."unreleased_game_tabs"
    ADD CONSTRAINT "unreleased_game_tabs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_analytics"
    ADD CONSTRAINT "user_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_grounding_usage"
    ADD CONSTRAINT "user_grounding_usage_auth_user_id_month_year_key" UNIQUE ("auth_user_id", "month_year");



ALTER TABLE ONLY "public"."user_grounding_usage"
    ADD CONSTRAINT "user_grounding_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_library"
    ADD CONSTRAINT "user_library_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_screenshots"
    ADD CONSTRAINT "user_screenshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_timeline"
    ADD CONSTRAINT "user_timeline_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



CREATE INDEX "games_game_title_idx" ON "public"."games" USING "btree" ("game_title");



CREATE INDEX "games_genre_idx" ON "public"."games" USING "btree" ("genre");



CREATE INDEX "games_igdb_game_id_idx" ON "public"."games" USING "btree" ("igdb_game_id");



CREATE INDEX "games_total_tabs_idx" ON "public"."games" USING "btree" ("total_tabs_created" DESC);



CREATE INDEX "games_total_users_idx" ON "public"."games" USING "btree" ("total_users" DESC);



CREATE INDEX "gaming_knowledge_auth_user_id_idx" ON "public"."gaming_knowledge" USING "btree" ("auth_user_id");



CREATE INDEX "gaming_knowledge_game_name_idx" ON "public"."gaming_knowledge" USING "btree" ("game_name");



CREATE INDEX "gaming_knowledge_igdb_game_id_idx" ON "public"."gaming_knowledge" USING "btree" ("igdb_game_id");



CREATE INDEX "gaming_knowledge_last_updated_idx" ON "public"."gaming_knowledge" USING "btree" ("last_updated" DESC);



CREATE INDEX "gaming_profiles_auth_user_id_idx" ON "public"."gaming_profiles" USING "btree" ("auth_user_id");



CREATE INDEX "gaming_search_history_auth_user_id_idx" ON "public"."gaming_search_history" USING "btree" ("auth_user_id");



CREATE INDEX "gaming_search_history_igdb_game_id_idx" ON "public"."gaming_search_history" USING "btree" ("igdb_game_id");



CREATE INDEX "gaming_search_history_searched_at_idx" ON "public"."gaming_search_history" USING "btree" ("searched_at" DESC);



CREATE INDEX "idx_ai_feedback_conversation_id" ON "public"."ai_feedback" USING "btree" ("conversation_id");



CREATE INDEX "idx_ai_feedback_corrections" ON "public"."ai_feedback" USING "btree" ("user_id", "is_validated", "correction_scope") WHERE ("correction_text" IS NOT NULL);



CREATE INDEX "idx_ai_feedback_created_at" ON "public"."ai_feedback" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ai_feedback_game_corrections" ON "public"."ai_feedback" USING "btree" ("user_id", "game_title", "is_validated") WHERE (("correction_text" IS NOT NULL) AND ("game_title" IS NOT NULL));



CREATE INDEX "idx_ai_feedback_message_id" ON "public"."ai_feedback" USING "btree" ("message_id");



CREATE INDEX "idx_ai_feedback_type" ON "public"."ai_feedback" USING "btree" ("feedback_type");



CREATE UNIQUE INDEX "idx_ai_feedback_unique_feedback" ON "public"."ai_feedback" USING "btree" ("user_id", "message_id");



CREATE INDEX "idx_ai_feedback_user_id" ON "public"."ai_feedback" USING "btree" ("user_id");



CREATE INDEX "idx_ai_responses_cache_key" ON "public"."ai_responses" USING "btree" ("cache_key");



CREATE INDEX "idx_ai_responses_expires_at" ON "public"."ai_responses" USING "btree" ("expires_at");



CREATE INDEX "idx_ai_responses_game_title" ON "public"."ai_responses" USING "btree" ("game_title");



CREATE INDEX "idx_ai_shown_prompts_auth_user_id" ON "public"."ai_shown_prompts" USING "btree" ("auth_user_id");



CREATE INDEX "idx_ai_shown_prompts_prompt_type" ON "public"."ai_shown_prompts" USING "btree" ("prompt_type");



CREATE INDEX "idx_ai_shown_prompts_shown_at" ON "public"."ai_shown_prompts" USING "btree" ("shown_at" DESC);



CREATE INDEX "idx_analytics_created_at" ON "public"."user_analytics" USING "btree" ("created_at");



CREATE INDEX "idx_analytics_event_type" ON "public"."user_analytics" USING "btree" ("event_type");



CREATE INDEX "idx_analytics_user_id" ON "public"."user_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_api_usage_auth_user_id" ON "public"."api_usage" USING "btree" ("auth_user_id");



CREATE INDEX "idx_api_usage_created_at" ON "public"."api_usage" USING "btree" ("created_at");



CREATE INDEX "idx_api_usage_user_id" ON "public"."api_usage" USING "btree" ("user_id");



CREATE INDEX "idx_app_cache_key" ON "public"."app_cache" USING "btree" ("key");



CREATE INDEX "idx_app_cache_user_id" ON "public"."app_cache" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_auth_user_game_hub" ON "public"."conversations" USING "btree" ("auth_user_id") WHERE ("is_game_hub" = true);



COMMENT ON INDEX "public"."idx_auth_user_game_hub" IS 'Enforces one Game Hub conversation per authenticated user (auth_user_id). 
Prevents duplicate Game Hubs from being created after login/logout cycles.';



CREATE INDEX "idx_cache_expires_at" ON "public"."app_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_cache_type" ON "public"."app_cache" USING "btree" ("cache_type");



CREATE INDEX "idx_cache_user_id" ON "public"."app_cache" USING "btree" ("user_id");



CREATE INDEX "idx_conversations_game_hub" ON "public"."conversations" USING "btree" ("is_game_hub") WHERE ("is_game_hub" = true);



CREATE INDEX "idx_conversations_game_id" ON "public"."conversations" USING "btree" ("game_id");



CREATE INDEX "idx_conversations_is_active" ON "public"."conversations" USING "btree" ("is_active");



CREATE INDEX "idx_conversations_is_unreleased" ON "public"."conversations" USING "btree" ("is_unreleased") WHERE ("is_unreleased" = true);



CREATE INDEX "idx_conversations_last_summarized" ON "public"."conversations" USING "btree" ("last_summarized_at");



CREATE INDEX "idx_conversations_user_id" ON "public"."conversations" USING "btree" ("user_id");



CREATE INDEX "idx_conversations_user_slug" ON "public"."conversations" USING "btree" ("user_id", "slug");



CREATE INDEX "idx_game_hub_interactions_auth_user_id" ON "public"."game_hub_interactions" USING "btree" ("auth_user_id");



CREATE INDEX "idx_game_hub_interactions_created_at" ON "public"."game_hub_interactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_game_hub_interactions_detected_game" ON "public"."game_hub_interactions" USING "btree" ("detected_game");



CREATE INDEX "idx_game_hub_interactions_query_type" ON "public"."game_hub_interactions" USING "btree" ("query_type");



CREATE INDEX "idx_game_knowledge_game_slug" ON "public"."game_knowledge_cache" USING "btree" ("game_slug");



CREATE INDEX "idx_game_knowledge_igdb_id" ON "public"."game_knowledge_cache" USING "btree" ("igdb_id");



CREATE INDEX "idx_game_knowledge_is_unreleased" ON "public"."game_knowledge_cache" USING "btree" ("is_unreleased") WHERE ("is_unreleased" = true);



CREATE INDEX "idx_game_knowledge_release_date" ON "public"."game_knowledge_cache" USING "btree" ("release_date");



CREATE INDEX "idx_grounding_usage_user_month" ON "public"."user_grounding_usage" USING "btree" ("auth_user_id", "month_year");



CREATE INDEX "idx_igdb_cache_igdb_id" ON "public"."igdb_game_cache" USING "btree" ("igdb_id");



CREATE INDEX "idx_igdb_game_cache_expires_at" ON "public"."igdb_game_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_igdb_game_cache_game_name_key" ON "public"."igdb_game_cache" USING "btree" ("game_name_key");



CREATE INDEX "idx_igdb_home_cache_expiry" ON "public"."igdb_home_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_igdb_home_cache_key" ON "public"."igdb_home_cache" USING "btree" ("cache_key");



CREATE INDEX "idx_library_category" ON "public"."user_library" USING "btree" ("category");



CREATE INDEX "idx_library_game" ON "public"."user_library" USING "btree" ("igdb_game_id");



CREATE INDEX "idx_library_updated_at" ON "public"."user_library" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_library_user" ON "public"."user_library" USING "btree" ("auth_user_id");



CREATE INDEX "idx_library_user_category" ON "public"."user_library" USING "btree" ("auth_user_id", "category");



CREATE INDEX "idx_messages_auth_user_id" ON "public"."messages" USING "btree" ("auth_user_id");



CREATE INDEX "idx_messages_conversation" ON "public"."messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "idx_messages_conversation_created" ON "public"."messages" USING "btree" ("conversation_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_messages_conversation_created" IS 'Optimizes paginated message queries (newest first).
Useful for infinite scroll or "load more" features.';



CREATE INDEX "idx_messages_conversation_id" ON "public"."messages" USING "btree" ("conversation_id");



COMMENT ON INDEX "public"."idx_messages_conversation_id" IS 'Speeds up message retrieval for a specific conversation. 
Used by get_conversation_messages().';



CREATE INDEX "idx_messages_role" ON "public"."messages" USING "btree" ("role");



CREATE INDEX "idx_news_cache_expires_at" ON "public"."news_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_news_cache_prompt_hash" ON "public"."news_cache" USING "btree" ("prompt_hash");



CREATE INDEX "idx_payment_events_created" ON "public"."payment_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_payment_events_processed" ON "public"."payment_events" USING "btree" ("processed");



CREATE INDEX "idx_payment_events_subscription" ON "public"."payment_events" USING "btree" ("subscription_id");



CREATE INDEX "idx_payment_events_type" ON "public"."payment_events" USING "btree" ("event_type");



CREATE INDEX "idx_payment_events_user" ON "public"."payment_events" USING "btree" ("user_id");



CREATE INDEX "idx_screenshots_captured_at" ON "public"."user_screenshots" USING "btree" ("captured_at" DESC);



CREATE INDEX "idx_screenshots_conversation" ON "public"."user_screenshots" USING "btree" ("conversation_id");



CREATE INDEX "idx_screenshots_game" ON "public"."user_screenshots" USING "btree" ("detected_game_id");



CREATE INDEX "idx_screenshots_user" ON "public"."user_screenshots" USING "btree" ("auth_user_id");



CREATE INDEX "idx_sessions_started_at" ON "public"."user_sessions" USING "btree" ("started_at");



CREATE INDEX "idx_sessions_user_id" ON "public"."user_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_shown_prompts_auth_user_type" ON "public"."ai_shown_prompts" USING "btree" ("auth_user_id", "prompt_type");



CREATE INDEX "idx_shown_prompts_conversation" ON "public"."ai_shown_prompts" USING "btree" ("conversation_id") WHERE ("conversation_id" IS NOT NULL);



CREATE INDEX "idx_shown_prompts_game" ON "public"."ai_shown_prompts" USING "btree" ("auth_user_id", "game_title") WHERE ("game_title" IS NOT NULL);



CREATE INDEX "idx_shown_prompts_shown_at" ON "public"."ai_shown_prompts" USING "btree" ("auth_user_id", "shown_at" DESC);



CREATE INDEX "idx_subscriptions_customer_id" ON "public"."subscriptions" USING "btree" ("lemon_customer_id");



CREATE INDEX "idx_subscriptions_lemon_id" ON "public"."subscriptions" USING "btree" ("lemon_subscription_id");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_subtab_refresh_user_date" ON "public"."subtab_refresh_usage" USING "btree" ("auth_user_id", "refresh_date");



CREATE INDEX "idx_subtabs_auth_user_id" ON "public"."subtabs" USING "btree" ("auth_user_id");



CREATE INDEX "idx_subtabs_conversation_id" ON "public"."subtabs" USING "btree" ("conversation_id");



CREATE INDEX "idx_subtabs_conversation_order" ON "public"."subtabs" USING "btree" ("conversation_id", "order_index");



CREATE INDEX "idx_subtabs_game" ON "public"."subtabs" USING "btree" ("game_id", "order_index");



CREATE INDEX "idx_subtabs_type" ON "public"."subtabs" USING "btree" ("tab_type");



CREATE INDEX "idx_timeline_event_type" ON "public"."user_timeline" USING "btree" ("event_type");



CREATE INDEX "idx_timeline_game" ON "public"."user_timeline" USING "btree" ("igdb_game_id");



CREATE INDEX "idx_timeline_user_date" ON "public"."user_timeline" USING "btree" ("auth_user_id", "event_date" DESC);



CREATE INDEX "idx_unreleased_tabs_igdb" ON "public"."unreleased_game_tabs" USING "btree" ("igdb_id");



CREATE INDEX "idx_unreleased_tabs_user" ON "public"."unreleased_game_tabs" USING "btree" ("auth_user_id");



CREATE INDEX "idx_user_analytics_auth_user_id" ON "public"."user_analytics" USING "btree" ("auth_user_id");



CREATE INDEX "idx_user_feedback_created" ON "public"."user_feedback" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_feedback_type" ON "public"."user_feedback" USING "btree" ("feedback_type");



CREATE INDEX "idx_user_sessions_auth_user_id" ON "public"."user_sessions" USING "btree" ("auth_user_id");



CREATE INDEX "idx_users_active_subscription" ON "public"."users" USING "btree" ("active_subscription_id");



CREATE INDEX "idx_users_auth_user_id" ON "public"."users" USING "btree" ("auth_user_id");



COMMENT ON INDEX "public"."idx_users_auth_user_id" IS 'Optimizes RLS policy checks and auth_user_id->id lookups. 
Critical for fast SELECT/INSERT/UPDATE/DELETE on conversations table.';



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_lemon_customer" ON "public"."users" USING "btree" ("lemon_customer_id");



CREATE INDEX "idx_users_tier" ON "public"."users" USING "btree" ("tier");



CREATE INDEX "idx_users_trial_expires_at" ON "public"."users" USING "btree" ("trial_expires_at") WHERE ("trial_expires_at" IS NOT NULL);



CREATE INDEX "idx_waitlist_email" ON "public"."waitlist" USING "btree" ("email");



CREATE INDEX "idx_waitlist_email_sent" ON "public"."waitlist" USING "btree" ("email_sent_at");



CREATE INDEX "idx_waitlist_email_status" ON "public"."waitlist" USING "btree" ("email_status");



CREATE INDEX "idx_waitlist_status" ON "public"."waitlist" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "messages_set_auth_user_id_trigger" BEFORE INSERT ON "public"."messages" FOR EACH ROW WHEN (("new"."auth_user_id" IS NULL)) EXECUTE FUNCTION "public"."messages_set_auth_user_id"();



CREATE OR REPLACE TRIGGER "subtabs_set_auth_user_id_trigger" BEFORE INSERT ON "public"."subtabs" FOR EACH ROW WHEN (("new"."auth_user_id" IS NULL)) EXECUTE FUNCTION "public"."subtabs_set_auth_user_id"();



CREATE OR REPLACE TRIGGER "trigger_update_subtabs_timestamp" BEFORE UPDATE ON "public"."subtabs" FOR EACH ROW EXECUTE FUNCTION "public"."update_subtabs_updated_at"();



CREATE OR REPLACE TRIGGER "update_conversations_updated_at" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_game_hub_interactions_updated_at" BEFORE UPDATE ON "public"."game_hub_interactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_last_login" BEFORE UPDATE ON "public"."users" FOR EACH ROW WHEN (("old"."auth_user_id" IS DISTINCT FROM "new"."auth_user_id")) EXECUTE FUNCTION "public"."update_last_login"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_subtab_unreleased_trigger" BEFORE INSERT OR UPDATE ON "public"."subtabs" FOR EACH ROW EXECUTE FUNCTION "public"."validate_subtab_for_unreleased"();



ALTER TABLE ONLY "public"."ai_feedback"
    ADD CONSTRAINT "ai_feedback_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_feedback"
    ADD CONSTRAINT "ai_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_shown_prompts"
    ADD CONSTRAINT "ai_shown_prompts_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_shown_prompts"
    ADD CONSTRAINT "ai_shown_prompts_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."api_usage"
    ADD CONSTRAINT "api_usage_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_usage"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_analytics"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_hub_interactions"
    ADD CONSTRAINT "game_hub_interactions_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_hub_interactions"
    ADD CONSTRAINT "game_hub_interactions_created_conversation_id_fkey" FOREIGN KEY ("created_conversation_id") REFERENCES "public"."conversations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."game_hub_interactions"
    ADD CONSTRAINT "game_hub_interactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."game_hub_interactions"
    ADD CONSTRAINT "game_hub_interactions_response_message_id_fkey" FOREIGN KEY ("response_message_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."game_hub_interactions"
    ADD CONSTRAINT "game_hub_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gaming_knowledge"
    ADD CONSTRAINT "gaming_knowledge_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gaming_profiles"
    ADD CONSTRAINT "gaming_profiles_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gaming_search_history"
    ADD CONSTRAINT "gaming_search_history_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subtab_refresh_usage"
    ADD CONSTRAINT "subtab_refresh_usage_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subtab_refresh_usage"
    ADD CONSTRAINT "subtab_refresh_usage_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subtab_refresh_usage"
    ADD CONSTRAINT "subtab_refresh_usage_subtab_id_fkey" FOREIGN KEY ("subtab_id") REFERENCES "public"."subtabs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subtabs"
    ADD CONSTRAINT "subtabs_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subtabs"
    ADD CONSTRAINT "subtabs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unreleased_game_tabs"
    ADD CONSTRAINT "unreleased_game_tabs_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unreleased_game_tabs"
    ADD CONSTRAINT "unreleased_game_tabs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_analytics"
    ADD CONSTRAINT "user_analytics_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_grounding_usage"
    ADD CONSTRAINT "user_grounding_usage_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_library"
    ADD CONSTRAINT "user_library_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_screenshots"
    ADD CONSTRAINT "user_screenshots_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_screenshots"
    ADD CONSTRAINT "user_screenshots_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_timeline"
    ADD CONSTRAINT "user_timeline_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_timeline"
    ADD CONSTRAINT "user_timeline_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_active_subscription_id_fkey" FOREIGN KEY ("active_subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anonymous users can store rate limits" ON "public"."app_cache" TO "anon" USING ((("cache_type" = 'rate_limit'::"text") AND ("user_id" IS NULL))) WITH CHECK ((("cache_type" = 'rate_limit'::"text") AND ("user_id" IS NULL)));



CREATE POLICY "Anyone can check waitlist" ON "public"."waitlist" FOR SELECT TO "anon", "authenticated" USING (true);



CREATE POLICY "Anyone can insert IGDB home cache" ON "public"."igdb_home_cache" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can insert into waitlist" ON "public"."waitlist" FOR INSERT TO "anon", "authenticated" WITH CHECK (true);



CREATE POLICY "Anyone can read IGDB home cache" ON "public"."igdb_home_cache" FOR SELECT USING (true);



CREATE POLICY "Anyone can read game knowledge cache" ON "public"."game_knowledge_cache" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can read news cache" ON "public"."news_cache" FOR SELECT TO "anon", "authenticated" USING (true);



CREATE POLICY "Anyone can update IGDB home cache" ON "public"."igdb_home_cache" FOR UPDATE USING (true);



CREATE POLICY "Anyone can view game analytics" ON "public"."games" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can access ai_responses" ON "public"."ai_responses" TO "authenticated" USING (true) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Authenticated users can access own cache" ON "public"."app_cache" TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("user_id" IS NULL))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("user_id" IS NULL)));



CREATE POLICY "Authenticated users can insert game knowledge" ON "public"."game_knowledge_cache" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can insert igdb cache" ON "public"."igdb_game_cache" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can read igdb cache" ON "public"."igdb_game_cache" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update game knowledge" ON "public"."game_knowledge_cache" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage analytics" ON "public"."user_analytics" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage api_usage" ON "public"."api_usage" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage game analytics" ON "public"."games" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage game knowledge" ON "public"."game_knowledge_cache" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage news cache" ON "public"."news_cache" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage waitlist" ON "public"."waitlist" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to igdb_game_cache" ON "public"."igdb_game_cache" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to payment events" ON "public"."payment_events" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to subscriptions" ON "public"."subscriptions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create own conversations" ON "public"."conversations" FOR INSERT WITH CHECK (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own conversations" ON "public"."conversations" FOR DELETE USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own feedback" ON "public"."ai_feedback" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own library" ON "public"."user_library" FOR DELETE TO "authenticated" USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own messages" ON "public"."messages" FOR DELETE USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own screenshots" ON "public"."user_screenshots" FOR DELETE TO "authenticated" USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own shown prompts" ON "public"."ai_shown_prompts" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can delete own subtabs" ON "public"."subtabs" FOR DELETE USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own timeline" ON "public"."user_timeline" FOR DELETE TO "authenticated" USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own unreleased tabs" ON "public"."unreleased_game_tabs" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can delete their own gaming knowledge" ON "public"."gaming_knowledge" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can delete their own gaming profile" ON "public"."gaming_profiles" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can delete their own search history" ON "public"."gaming_search_history" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can insert own analytics" ON "public"."user_analytics" FOR INSERT WITH CHECK (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own feedback" ON "public"."ai_feedback" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own feedback" ON "public"."user_feedback" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can insert own game hub interactions" ON "public"."game_hub_interactions" FOR INSERT WITH CHECK (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own grounding usage" ON "public"."user_grounding_usage" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can insert own library" ON "public"."user_library" FOR INSERT TO "authenticated" WITH CHECK (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own messages" ON "public"."messages" FOR INSERT WITH CHECK (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own refresh usage" ON "public"."subtab_refresh_usage" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can insert own screenshots" ON "public"."user_screenshots" FOR INSERT TO "authenticated" WITH CHECK (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own sessions" ON "public"."user_sessions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can insert own shown prompts" ON "public"."ai_shown_prompts" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can insert own subtabs" ON "public"."subtabs" FOR INSERT WITH CHECK (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own timeline" ON "public"."user_timeline" FOR INSERT TO "authenticated" WITH CHECK (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own unreleased tabs" ON "public"."unreleased_game_tabs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can insert their own gaming knowledge" ON "public"."gaming_knowledge" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can insert their own gaming profile" ON "public"."gaming_profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can insert their own search history" ON "public"."gaming_search_history" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can select own shown prompts" ON "public"."ai_shown_prompts" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can update own conversations" ON "public"."conversations" FOR UPDATE USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own feedback" ON "public"."ai_feedback" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own game hub interactions" ON "public"."game_hub_interactions" FOR UPDATE USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own grounding usage" ON "public"."user_grounding_usage" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can update own library" ON "public"."user_library" FOR UPDATE TO "authenticated" USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own messages" ON "public"."messages" FOR UPDATE USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("tier" = "tier")));



COMMENT ON POLICY "Users can update own profile" ON "public"."users" IS 'Optimized policy: Users can update their profile. Uses (select auth.uid()) for performance. Tier changes are restricted. Service_role bypasses RLS for webhook-based tier updates.';



CREATE POLICY "Users can update own refresh usage" ON "public"."subtab_refresh_usage" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can update own screenshots" ON "public"."user_screenshots" FOR UPDATE TO "authenticated" USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own sessions" ON "public"."user_sessions" FOR UPDATE TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update own shown prompts" ON "public"."ai_shown_prompts" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can update own subtabs" ON "public"."subtabs" FOR UPDATE USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own timeline" ON "public"."user_timeline" FOR UPDATE TO "authenticated" USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update their own gaming knowledge" ON "public"."gaming_knowledge" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can update their own gaming profile" ON "public"."gaming_profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can update their own search history" ON "public"."gaming_search_history" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can view own analytics" ON "public"."user_analytics" FOR SELECT USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own api_usage" ON "public"."api_usage" FOR SELECT TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view own conversations" ON "public"."conversations" FOR SELECT USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own feedback" ON "public"."ai_feedback" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own game hub interactions" ON "public"."game_hub_interactions" FOR SELECT USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own grounding usage" ON "public"."user_grounding_usage" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can view own library" ON "public"."user_library" FOR SELECT TO "authenticated" USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own messages" ON "public"."messages" FOR SELECT USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own payment events" ON "public"."payment_events" FOR SELECT TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own refresh usage" ON "public"."subtab_refresh_usage" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can view own screenshots" ON "public"."user_screenshots" FOR SELECT TO "authenticated" USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own sessions" ON "public"."user_sessions" FOR SELECT TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view own subscriptions" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view own subtabs" ON "public"."subtabs" FOR SELECT USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own timeline" ON "public"."user_timeline" FOR SELECT TO "authenticated" USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own unreleased tabs" ON "public"."unreleased_game_tabs" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can view their own gaming knowledge" ON "public"."gaming_knowledge" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can view their own gaming profile" ON "public"."gaming_profiles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can view their own search history" ON "public"."gaming_search_history" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



ALTER TABLE "public"."ai_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_shown_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_hub_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_knowledge_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gaming_knowledge" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gaming_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gaming_search_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."igdb_game_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."igdb_home_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subtab_refresh_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subtabs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unreleased_game_tabs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_grounding_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_library" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_screenshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_timeline" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON SCHEMA "public" TO PUBLIC;



GRANT ALL ON FUNCTION "public"."add_message"("p_conversation_id" "text", "p_role" "text", "p_content" "text", "p_image_url" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."add_message"("p_conversation_id" "text", "p_role" "text", "p_content" "text", "p_image_url" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_message"("p_conversation_id" "text", "p_role" "text", "p_content" "text", "p_image_url" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_news_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_news_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_news_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_shown_prompts"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_shown_prompts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_shown_prompts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_user_cache"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."clear_user_cache"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_user_cache"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."count_unreleased_tabs"("p_auth_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."count_unreleased_tabs"("p_auth_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_unreleased_tabs"("p_auth_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_record"("p_auth_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_avatar_url" "text", "p_is_developer" boolean, "p_tier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_record"("p_auth_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_avatar_url" "text", "p_is_developer" boolean, "p_tier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_record"("p_auth_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_avatar_url" "text", "p_is_developer" boolean, "p_tier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_trials"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_trials"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_trials"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cache_performance_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_cache_performance_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cache_performance_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cache_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_cache_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cache_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cached_news"("p_prompt_hash" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_cached_news"("p_prompt_hash" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cached_news"("p_prompt_hash" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_complete_user_data"("p_auth_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_complete_user_data"("p_auth_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_complete_user_data"("p_auth_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversation_messages"("p_conversation_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversation_messages"("p_conversation_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversation_messages"("p_conversation_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversation_messages"("p_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversation_messages"("p_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversation_messages"("p_conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_daily_refresh_count"("p_auth_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_daily_refresh_count"("p_auth_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_daily_refresh_count"("p_auth_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_game_knowledge"("p_igdb_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_game_knowledge"("p_igdb_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_game_knowledge"("p_igdb_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_game_hub"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_game_hub"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_game_hub"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recent_shown_prompts"("p_auth_user_id" "uuid", "p_prompt_type" "text", "p_game_title" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recent_shown_prompts"("p_auth_user_id" "uuid", "p_prompt_type" "text", "p_game_title" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_shown_prompts"("p_auth_user_id" "uuid", "p_prompt_type" "text", "p_game_title" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_active_subscription"("p_auth_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_active_subscription"("p_auth_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_active_subscription"("p_auth_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_cache_entries"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_cache_entries"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_cache_entries"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_corrections"("p_auth_user_id" "uuid", "p_game_title" "text", "p_include_global" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_corrections"("p_auth_user_id" "uuid", "p_game_title" "text", "p_include_global" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_corrections"("p_auth_user_id" "uuid", "p_game_title" "text", "p_include_global" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_id_from_auth_id"("p_auth_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_id_from_auth_id"("p_auth_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_id_from_auth_id"("p_auth_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_onboarding_status"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_onboarding_status"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_onboarding_status"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_grounding_usage"("p_auth_user_id" "uuid", "p_month_year" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_grounding_usage"("p_auth_user_id" "uuid", "p_month_year" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_grounding_usage"("p_auth_user_id" "uuid", "p_month_year" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_grounding_usage"("p_auth_user_id" "uuid", "p_month_year" character varying, "p_usage_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_grounding_usage"("p_auth_user_id" "uuid", "p_month_year" character varying, "p_usage_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_grounding_usage"("p_auth_user_id" "uuid", "p_month_year" character varying, "p_usage_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_refresh_count"("p_auth_user_id" "uuid", "p_conversation_id" "text", "p_subtab_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_refresh_count"("p_auth_user_id" "uuid", "p_conversation_id" "text", "p_subtab_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_refresh_count"("p_auth_user_id" "uuid", "p_conversation_id" "text", "p_subtab_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_user_usage"("p_auth_user_id" "uuid", "p_query_type" "text", "p_increment" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_user_usage"("p_auth_user_id" "uuid", "p_query_type" "text", "p_increment" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_user_usage"("p_auth_user_id" "uuid", "p_query_type" "text", "p_increment" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."messages_set_auth_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."messages_set_auth_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."messages_set_auth_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_messages_to_table"() TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_messages_to_table"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_messages_to_table"() TO "service_role";



GRANT ALL ON FUNCTION "public"."register_and_activate_connection"("p_code" "text", "p_user_id" "uuid", "p_device_info" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."register_and_activate_connection"("p_code" "text", "p_user_id" "uuid", "p_device_info" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_and_activate_connection"("p_code" "text", "p_user_id" "uuid", "p_device_info" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_monthly_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_monthly_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_monthly_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rollback_messages_to_jsonb"() TO "anon";
GRANT ALL ON FUNCTION "public"."rollback_messages_to_jsonb"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rollback_messages_to_jsonb"() TO "service_role";



GRANT ALL ON FUNCTION "public"."save_message_transaction"("p_conversation_id" "text", "p_role" "text", "p_content" "text", "p_image_url" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."save_message_transaction"("p_conversation_id" "text", "p_role" "text", "p_content" "text", "p_image_url" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_message_transaction"("p_conversation_id" "text", "p_role" "text", "p_content" "text", "p_image_url" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_onboarding_step"("p_user_id" "uuid", "p_step" "text", "p_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."save_onboarding_step"("p_user_id" "uuid", "p_step" "text", "p_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_onboarding_step"("p_user_id" "uuid", "p_step" "text", "p_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."subtabs_set_auth_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."subtabs_set_auth_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."subtabs_set_auth_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_last_login"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_last_login"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_last_login"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_subtabs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_subtabs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_subtabs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_onboarding_status"("user_id" "uuid", "status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_onboarding_status"("user_id" "uuid", "status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_onboarding_status"("user_id" "uuid", "status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_onboarding_status"("p_user_id" "uuid", "p_step" "text", "p_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_onboarding_status"("p_user_id" "uuid", "p_step" "text", "p_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_onboarding_status"("p_user_id" "uuid", "p_step" "text", "p_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_tier"("p_user_id" "uuid", "p_tier" "text", "p_text_limit" integer, "p_image_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_tier"("p_user_id" "uuid", "p_tier" "text", "p_text_limit" integer, "p_image_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_tier"("p_user_id" "uuid", "p_tier" "text", "p_text_limit" integer, "p_image_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_waitlist_email_status"("waitlist_email" "text", "new_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_waitlist_email_status"("waitlist_email" "text", "new_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_waitlist_email_status"("waitlist_email" "text", "new_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_subscription"("p_user_id" "uuid", "p_lemon_subscription_id" "text", "p_lemon_customer_id" "text", "p_tier" "text", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_subscription"("p_user_id" "uuid", "p_lemon_subscription_id" "text", "p_lemon_customer_id" "text", "p_tier" "text", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_subscription"("p_user_id" "uuid", "p_lemon_subscription_id" "text", "p_lemon_customer_id" "text", "p_tier" "text", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_active_subscription"("p_auth_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_active_subscription"("p_auth_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_active_subscription"("p_auth_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_subtab_for_unreleased"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_subtab_for_unreleased"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_subtab_for_unreleased"() TO "service_role";



GRANT ALL ON TABLE "public"."ai_feedback" TO "anon";
GRANT ALL ON TABLE "public"."ai_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."ai_feedback_stats" TO "anon";
GRANT ALL ON TABLE "public"."ai_feedback_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_feedback_stats" TO "service_role";



GRANT ALL ON TABLE "public"."ai_responses" TO "anon";
GRANT ALL ON TABLE "public"."ai_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_responses" TO "service_role";



GRANT ALL ON TABLE "public"."ai_shown_prompts" TO "anon";
GRANT ALL ON TABLE "public"."ai_shown_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_shown_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."api_usage" TO "anon";
GRANT ALL ON TABLE "public"."api_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."api_usage" TO "service_role";



GRANT ALL ON TABLE "public"."app_cache" TO "anon";
GRANT ALL ON TABLE "public"."app_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."app_cache" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."game_hub_interactions" TO "anon";
GRANT ALL ON TABLE "public"."game_hub_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."game_hub_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."game_knowledge_cache" TO "anon";
GRANT ALL ON TABLE "public"."game_knowledge_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."game_knowledge_cache" TO "service_role";



GRANT ALL ON TABLE "public"."games" TO "anon";
GRANT ALL ON TABLE "public"."games" TO "authenticated";
GRANT ALL ON TABLE "public"."games" TO "service_role";



GRANT ALL ON TABLE "public"."gaming_knowledge" TO "anon";
GRANT ALL ON TABLE "public"."gaming_knowledge" TO "authenticated";
GRANT ALL ON TABLE "public"."gaming_knowledge" TO "service_role";



GRANT ALL ON TABLE "public"."gaming_profiles" TO "anon";
GRANT ALL ON TABLE "public"."gaming_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."gaming_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."gaming_search_history" TO "anon";
GRANT ALL ON TABLE "public"."gaming_search_history" TO "authenticated";
GRANT ALL ON TABLE "public"."gaming_search_history" TO "service_role";



GRANT ALL ON TABLE "public"."igdb_game_cache" TO "anon";
GRANT ALL ON TABLE "public"."igdb_game_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."igdb_game_cache" TO "service_role";



GRANT ALL ON TABLE "public"."igdb_home_cache" TO "anon";
GRANT ALL ON TABLE "public"."igdb_home_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."igdb_home_cache" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."news_cache" TO "anon";
GRANT ALL ON TABLE "public"."news_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."news_cache" TO "service_role";



GRANT ALL ON TABLE "public"."payment_events" TO "anon";
GRANT ALL ON TABLE "public"."payment_events" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_events" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."subtab_refresh_usage" TO "anon";
GRANT ALL ON TABLE "public"."subtab_refresh_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."subtab_refresh_usage" TO "service_role";



GRANT ALL ON TABLE "public"."subtabs" TO "anon";
GRANT ALL ON TABLE "public"."subtabs" TO "authenticated";
GRANT ALL ON TABLE "public"."subtabs" TO "service_role";



GRANT ALL ON TABLE "public"."unreleased_game_tabs" TO "anon";
GRANT ALL ON TABLE "public"."unreleased_game_tabs" TO "authenticated";
GRANT ALL ON TABLE "public"."unreleased_game_tabs" TO "service_role";



GRANT ALL ON TABLE "public"."user_analytics" TO "anon";
GRANT ALL ON TABLE "public"."user_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."user_feedback" TO "anon";
GRANT ALL ON TABLE "public"."user_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."user_grounding_usage" TO "anon";
GRANT ALL ON TABLE "public"."user_grounding_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."user_grounding_usage" TO "service_role";



GRANT ALL ON TABLE "public"."user_library" TO "anon";
GRANT ALL ON TABLE "public"."user_library" TO "authenticated";
GRANT ALL ON TABLE "public"."user_library" TO "service_role";



GRANT ALL ON TABLE "public"."user_screenshots" TO "anon";
GRANT ALL ON TABLE "public"."user_screenshots" TO "authenticated";
GRANT ALL ON TABLE "public"."user_screenshots" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."user_timeline" TO "anon";
GRANT ALL ON TABLE "public"."user_timeline" TO "authenticated";
GRANT ALL ON TABLE "public"."user_timeline" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist" TO "anon";
GRANT ALL ON TABLE "public"."waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist_pending_emails" TO "anon";
GRANT ALL ON TABLE "public"."waitlist_pending_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist_pending_emails" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




