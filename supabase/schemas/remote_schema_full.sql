
\restrict 1WfDRmwx2mT4gkWE2QCBzBHOvJHvMAHKIjGAlJaLJyDsPtkKkKeE2BI8ovJRcXe


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




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






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


CREATE OR REPLACE FUNCTION "public"."clear_user_cache"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  DELETE FROM public.app_cache WHERE user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."clear_user_cache"("p_user_id" "uuid") OWNER TO "postgres";


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
      v_text_limit := 1583;
      v_image_limit := 328;
    WHEN 'vanguard_pro' THEN
      v_text_limit := 1583;
      v_image_limit := 328;
    ELSE
      v_text_limit := 55;
      v_image_limit := 25;
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


CREATE OR REPLACE FUNCTION "public"."get_complete_user_data"("p_auth_user_id" "uuid") RETURNS TABLE("id" "uuid", "auth_user_id" "uuid", "email" "text", "full_name" "text", "avatar_url" "text", "tier" "text", "is_developer" boolean, "has_profile_setup" boolean, "has_seen_splash_screens" boolean, "has_seen_how_to_use" boolean, "has_seen_features_connected" boolean, "has_seen_pro_features" boolean, "pc_connected" boolean, "pc_connection_skipped" boolean, "onboarding_completed" boolean, "has_welcome_message" boolean, "is_new_user" boolean, "has_used_trial" boolean, "text_count" integer, "image_count" integer, "text_limit" integer, "image_limit" integer, "total_requests" integer, "last_reset" timestamp with time zone, "preferences" "jsonb", "usage_data" "jsonb", "app_state" "jsonb", "profile_data" "jsonb", "onboarding_data" "jsonb", "behavior_data" "jsonb", "feedback_data" "jsonb", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "last_login" timestamp with time zone)
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


CREATE OR REPLACE FUNCTION "public"."migrate_messages_to_conversation"("p_message_ids" "uuid"[], "p_target_conversation_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_migrated_count INTEGER := 0;
BEGIN
  UPDATE messages
  SET conversation_id = p_target_conversation_id
  WHERE id = ANY(p_message_ids);
  
  GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
  
  RETURN v_migrated_count;
END;
$$;


ALTER FUNCTION "public"."migrate_messages_to_conversation"("p_message_ids" "uuid"[], "p_target_conversation_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."migrate_messages_to_conversation"("p_message_ids" "uuid"[], "p_target_conversation_id" "uuid") IS 'Migrates messages to a different conversation. SECURITY DEFINER with search_path protection.';



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


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


SET default_tablespace = '';

SET default_table_access_method = "heap";


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



CREATE TABLE IF NOT EXISTS "public"."api_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "request_type" "text" NOT NULL,
    "tokens_used" integer DEFAULT 0,
    "cost_cents" real DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
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
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "slug" "text",
    "title" "text" NOT NULL,
    "messages" "jsonb" DEFAULT '[]'::"jsonb",
    "game_id" "text",
    "game_title" "text",
    "genre" "text",
    "subtabs" "jsonb" DEFAULT '[]'::"jsonb",
    "subtabs_order" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active_session" boolean DEFAULT false,
    "active_objective" "text",
    "game_progress" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "is_pinned" boolean DEFAULT false,
    "pinned_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_game_hub" boolean DEFAULT false
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."conversations"."user_id" IS 'References users.id (internal UUID, not auth_user_id)';



COMMENT ON COLUMN "public"."conversations"."slug" IS 'Optional slug for special conversations (e.g., "everything-else"). Regular conversations use UUID in id.';



COMMENT ON COLUMN "public"."conversations"."is_game_hub" IS 'Identifies the default Game Hub conversation - only one per user, cannot be deleted';



CREATE TABLE IF NOT EXISTS "public"."game_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_title" "text" NOT NULL,
    "genre" "text",
    "insights_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "user_id" "uuid"
);


ALTER TABLE "public"."game_insights" OWNER TO "postgres";


COMMENT ON COLUMN "public"."game_insights"."game_title" IS 'UNIQUE constraint allows for ON CONFLICT upserts';



COMMENT ON COLUMN "public"."game_insights"."user_id" IS 'Stores auth.uid() for tracking who contributed - NOT a foreign key';



CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "genre" "text",
    "platform" "text",
    "cover_url" "text",
    "notes" "text",
    "status" "text" DEFAULT 'backlog'::"text",
    "progress" integer DEFAULT 0,
    "playtime_hours" real DEFAULT 0,
    "rating" integer,
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "games_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "games_status_check" CHECK (("status" = ANY (ARRAY['playing'::"text", 'completed'::"text", 'backlog'::"text", 'wishlist'::"text"])))
);


ALTER TABLE "public"."games" OWNER TO "postgres";


COMMENT ON COLUMN "public"."games"."user_id" IS 'References users.id (internal UUID, not auth_user_id)';



CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "image_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "step" "text" NOT NULL,
    "completed" boolean DEFAULT false,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."onboarding_progress" OWNER TO "postgres";


COMMENT ON COLUMN "public"."onboarding_progress"."user_id" IS 'References users.id (internal UUID, not auth_user_id)';



CREATE TABLE IF NOT EXISTS "public"."subtabs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "game_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" DEFAULT ''::"text",
    "tab_type" "text" NOT NULL,
    "order_index" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subtabs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_analytics" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_analytics"."user_id" IS 'References users.id (internal UUID, not auth_user_id)';



CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_data" "jsonb" DEFAULT '{}'::"jsonb",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "duration_seconds" integer
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_sessions"."user_id" IS 'References users.id (internal UUID, not auth_user_id)';



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
    "text_limit" integer DEFAULT 55,
    "image_limit" integer DEFAULT 25,
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
    CONSTRAINT "users_tier_check" CHECK (("tier" = ANY (ARRAY['free'::"text", 'pro'::"text", 'vanguard_pro'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Core user table with auth_user_id referencing auth.users(id)';



COMMENT ON COLUMN "public"."users"."auth_user_id" IS 'References auth.users(id) - this is what auth.uid() returns';



CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "source" "text" DEFAULT 'landing_page'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "invited_at" timestamp with time zone,
    CONSTRAINT "waitlist_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


COMMENT ON TABLE "public"."waitlist" IS 'Pre-launch waitlist for user signups';



ALTER TABLE ONLY "public"."ai_responses"
    ADD CONSTRAINT "ai_responses_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."ai_responses"
    ADD CONSTRAINT "ai_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_usage"
    ADD CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_cache"
    ADD CONSTRAINT "app_cache_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_insights"
    ADD CONSTRAINT "game_insights_game_title_key" UNIQUE ("game_title");



ALTER TABLE ONLY "public"."game_insights"
    ADD CONSTRAINT "game_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "onboarding_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subtabs"
    ADD CONSTRAINT "subtabs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_analytics"
    ADD CONSTRAINT "user_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_ai_responses_cache_key" ON "public"."ai_responses" USING "btree" ("cache_key");



CREATE INDEX "idx_ai_responses_expires_at" ON "public"."ai_responses" USING "btree" ("expires_at");



CREATE INDEX "idx_ai_responses_game_title" ON "public"."ai_responses" USING "btree" ("game_title");



CREATE INDEX "idx_analytics_created_at" ON "public"."user_analytics" USING "btree" ("created_at");



CREATE INDEX "idx_analytics_event_type" ON "public"."user_analytics" USING "btree" ("event_type");



CREATE INDEX "idx_analytics_user_id" ON "public"."user_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_api_usage_created_at" ON "public"."api_usage" USING "btree" ("created_at");



CREATE INDEX "idx_api_usage_user_id" ON "public"."api_usage" USING "btree" ("user_id");



CREATE INDEX "idx_cache_expires_at" ON "public"."app_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_cache_type" ON "public"."app_cache" USING "btree" ("cache_type");



CREATE INDEX "idx_cache_user_id" ON "public"."app_cache" USING "btree" ("user_id");



CREATE INDEX "idx_conversations_game_id" ON "public"."conversations" USING "btree" ("game_id");



CREATE INDEX "idx_conversations_is_active" ON "public"."conversations" USING "btree" ("is_active");



CREATE INDEX "idx_conversations_user_id" ON "public"."conversations" USING "btree" ("user_id");



CREATE INDEX "idx_conversations_user_slug" ON "public"."conversations" USING "btree" ("user_id", "slug");



CREATE INDEX "idx_game_insights_game_title" ON "public"."game_insights" USING "btree" ("game_title");



CREATE INDEX "idx_game_insights_genre" ON "public"."game_insights" USING "btree" ("genre");



CREATE INDEX "idx_games_status" ON "public"."games" USING "btree" ("status");



CREATE INDEX "idx_games_title" ON "public"."games" USING "btree" ("title");



CREATE INDEX "idx_games_user_id" ON "public"."games" USING "btree" ("user_id");



CREATE INDEX "idx_messages_conversation" ON "public"."messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "idx_messages_role" ON "public"."messages" USING "btree" ("role");



CREATE INDEX "idx_onboarding_step" ON "public"."onboarding_progress" USING "btree" ("step");



CREATE INDEX "idx_onboarding_user_id" ON "public"."onboarding_progress" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_onboarding_user_step" ON "public"."onboarding_progress" USING "btree" ("user_id", "step");



CREATE INDEX "idx_sessions_started_at" ON "public"."user_sessions" USING "btree" ("started_at");



CREATE INDEX "idx_sessions_user_id" ON "public"."user_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_subtabs_game" ON "public"."subtabs" USING "btree" ("game_id", "order_index");



CREATE INDEX "idx_subtabs_type" ON "public"."subtabs" USING "btree" ("tab_type");



CREATE UNIQUE INDEX "idx_user_game_hub" ON "public"."conversations" USING "btree" ("user_id") WHERE ("is_game_hub" = true);



CREATE INDEX "idx_users_auth_user_id" ON "public"."users" USING "btree" ("auth_user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_tier" ON "public"."users" USING "btree" ("tier");



CREATE INDEX "idx_waitlist_email" ON "public"."waitlist" USING "btree" ("email");



CREATE INDEX "idx_waitlist_status" ON "public"."waitlist" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "update_conversations_updated_at" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_game_insights_updated_at" BEFORE UPDATE ON "public"."game_insights" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_games_updated_at" BEFORE UPDATE ON "public"."games" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_onboarding_updated_at" BEFORE UPDATE ON "public"."onboarding_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_last_login" BEFORE UPDATE ON "public"."users" FOR EACH ROW WHEN (("old"."auth_user_id" IS DISTINCT FROM "new"."auth_user_id")) EXECUTE FUNCTION "public"."update_last_login"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_usage"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."onboarding_progress"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_analytics"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subtabs"
    ADD CONSTRAINT "subtabs_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can check waitlist" ON "public"."waitlist" FOR SELECT TO "anon", "authenticated" USING (true);



CREATE POLICY "Anyone can insert into waitlist" ON "public"."waitlist" FOR INSERT TO "anon", "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can access ai_responses" ON "public"."ai_responses" TO "authenticated" USING (true) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Authenticated users can access game_insights" ON "public"."game_insights" TO "authenticated" USING (true) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Service role can manage analytics" ON "public"."user_analytics" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage api_usage" ON "public"."api_usage" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage waitlist" ON "public"."waitlist" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can access own cache" ON "public"."app_cache" TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("user_id" IS NULL))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("user_id" IS NULL)));



CREATE POLICY "Users can create own conversations" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can create own games" ON "public"."games" FOR INSERT TO "authenticated" WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can delete messages from their conversations" ON "public"."messages" FOR DELETE USING (("conversation_id" IN ( SELECT "c"."id"
   FROM ("public"."conversations" "c"
     JOIN "public"."users" "u" ON (("c"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can delete own conversations" ON "public"."conversations" FOR DELETE TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can delete own games" ON "public"."games" FOR DELETE TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can delete subtabs from their games" ON "public"."subtabs" FOR DELETE USING (("game_id" IN ( SELECT "g"."id"
   FROM ("public"."games" "g"
     JOIN "public"."users" "u" ON (("g"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can insert messages to their conversations" ON "public"."messages" FOR INSERT WITH CHECK (("conversation_id" IN ( SELECT "c"."id"
   FROM ("public"."conversations" "c"
     JOIN "public"."users" "u" ON (("c"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can insert subtabs to their games" ON "public"."subtabs" FOR INSERT WITH CHECK (("game_id" IN ( SELECT "g"."id"
   FROM ("public"."games" "g"
     JOIN "public"."users" "u" ON (("g"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can manage own onboarding" ON "public"."onboarding_progress" TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can manage own sessions" ON "public"."user_sessions" TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update messages in their conversations" ON "public"."messages" FOR UPDATE USING (("conversation_id" IN ( SELECT "c"."id"
   FROM ("public"."conversations" "c"
     JOIN "public"."users" "u" ON (("c"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update own conversations" ON "public"."conversations" FOR UPDATE TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update own games" ON "public"."games" FOR UPDATE TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update subtabs in their games" ON "public"."subtabs" FOR UPDATE USING (("game_id" IN ( SELECT "g"."id"
   FROM ("public"."games" "g"
     JOIN "public"."users" "u" ON (("g"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view messages from their conversations" ON "public"."messages" FOR SELECT USING (("conversation_id" IN ( SELECT "c"."id"
   FROM ("public"."conversations" "c"
     JOIN "public"."users" "u" ON (("c"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



COMMENT ON POLICY "Users can view messages from their conversations" ON "public"."messages" IS 'Optimized RLS policy using (select auth.uid()) to prevent per-row re-evaluation';



CREATE POLICY "Users can view own analytics" ON "public"."user_analytics" FOR SELECT TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view own api_usage" ON "public"."api_usage" FOR SELECT TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view own conversations" ON "public"."conversations" FOR SELECT TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view own games" ON "public"."games" FOR SELECT TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view subtabs from their games" ON "public"."subtabs" FOR SELECT USING (("game_id" IN ( SELECT "g"."id"
   FROM ("public"."games" "g"
     JOIN "public"."users" "u" ON (("g"."user_id" = "u"."id")))
  WHERE ("u"."auth_user_id" = ( SELECT "auth"."uid"() AS "uid")))));



COMMENT ON POLICY "Users can view subtabs from their games" ON "public"."subtabs" IS 'Optimized RLS policy using (select auth.uid()) to prevent per-row re-evaluation';



ALTER TABLE "public"."ai_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subtabs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON SCHEMA "public" TO PUBLIC;





















GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_user_cache"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."clear_user_cache"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_user_cache"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_record"("p_auth_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_avatar_url" "text", "p_is_developer" boolean, "p_tier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_record"("p_auth_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_avatar_url" "text", "p_is_developer" boolean, "p_tier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_record"("p_auth_user_id" "uuid", "p_email" "text", "p_full_name" "text", "p_avatar_url" "text", "p_is_developer" boolean, "p_tier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cache_performance_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_cache_performance_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cache_performance_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cache_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_cache_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cache_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_complete_user_data"("p_auth_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_complete_user_data"("p_auth_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_complete_user_data"("p_auth_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_game_hub"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_game_hub"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_game_hub"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_cache_entries"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_cache_entries"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_cache_entries"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_onboarding_status"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_onboarding_status"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_onboarding_status"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_user_usage"("p_auth_user_id" "uuid", "p_query_type" "text", "p_increment" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_user_usage"("p_auth_user_id" "uuid", "p_query_type" "text", "p_increment" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_user_usage"("p_auth_user_id" "uuid", "p_query_type" "text", "p_increment" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_messages_to_conversation"("p_message_ids" "uuid"[], "p_target_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_messages_to_conversation"("p_message_ids" "uuid"[], "p_target_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_messages_to_conversation"("p_message_ids" "uuid"[], "p_target_conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_monthly_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_monthly_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_monthly_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_last_login"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_last_login"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_last_login"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_onboarding_status"("user_id" "uuid", "status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_onboarding_status"("user_id" "uuid", "status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_onboarding_status"("user_id" "uuid", "status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_onboarding_status"("p_user_id" "uuid", "p_step" "text", "p_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_onboarding_status"("p_user_id" "uuid", "p_step" "text", "p_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_onboarding_status"("p_user_id" "uuid", "p_step" "text", "p_data" "jsonb") TO "service_role";















GRANT ALL ON TABLE "public"."ai_responses" TO "anon";
GRANT ALL ON TABLE "public"."ai_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_responses" TO "service_role";



GRANT ALL ON TABLE "public"."api_usage" TO "anon";
GRANT ALL ON TABLE "public"."api_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."api_usage" TO "service_role";



GRANT ALL ON TABLE "public"."app_cache" TO "anon";
GRANT ALL ON TABLE "public"."app_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."app_cache" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."game_insights" TO "anon";
GRANT ALL ON TABLE "public"."game_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."game_insights" TO "service_role";



GRANT ALL ON TABLE "public"."games" TO "anon";
GRANT ALL ON TABLE "public"."games" TO "authenticated";
GRANT ALL ON TABLE "public"."games" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_progress" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_progress" TO "service_role";



GRANT ALL ON TABLE "public"."subtabs" TO "anon";
GRANT ALL ON TABLE "public"."subtabs" TO "authenticated";
GRANT ALL ON TABLE "public"."subtabs" TO "service_role";



GRANT ALL ON TABLE "public"."user_analytics" TO "anon";
GRANT ALL ON TABLE "public"."user_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist" TO "anon";
GRANT ALL ON TABLE "public"."waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";









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



\unrestrict 1WfDRmwx2mT4gkWE2QCBzBHOvJHvMAHKIjGAlJaLJyDsPtkKkKeE2BI8ovJRcXe

RESET ALL;
