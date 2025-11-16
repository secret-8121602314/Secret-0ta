-- Drop functions with CASCADE to automatically drop dependent event triggers
drop function if exists "extensions"."grant_pg_cron_access"() CASCADE;

drop function if exists "extensions"."grant_pg_graphql_access"() CASCADE;

drop function if exists "extensions"."grant_pg_net_access"() CASCADE;

drop function if exists "extensions"."pgrst_ddl_watch"() CASCADE;

drop function if exists "extensions"."pgrst_drop_watch"() CASCADE;

drop function if exists "extensions"."set_graphql_placeholder"() CASCADE;

drop extension if exists "pg_net";

drop extension if exists "pg_stat_statements";

set check_function_bodies = off;

create or replace view "extensions"."extension_info" as  SELECT 'uuid-ossp'::text AS extension_name,
    'extensions'::text AS schema_name,
    'UUID generation functions (uuid_generate_v4, etc.)'::text AS description,
    'Moved from public schema for security'::text AS status;


CREATE OR REPLACE FUNCTION extensions.generate_uuid()
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'extensions', 'public'
AS $function$
    SELECT gen_random_uuid();
$function$
;

CREATE OR REPLACE FUNCTION extensions.generate_uuid_v4()
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'extensions', 'public'
AS $function$
    SELECT uuid_generate_v4();
$function$
;

create or replace view "extensions"."uuid_functions" as  SELECT 'gen_random_uuid'::text AS function_name,
    'Built-in PostgreSQL function (recommended)'::text AS description,
    'pgcrypto'::text AS source_extension
UNION ALL
 SELECT 'uuid_generate_v4'::text AS function_name,
    'uuid-ossp extension function'::text AS description,
    'uuid-ossp'::text AS source_extension;



  create table "public"."ai_responses" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "cache_key" text not null,
    "response_data" jsonb not null,
    "game_title" text,
    "cache_type" text default 'game_specific'::text,
    "conversation_id" uuid,
    "model_used" text,
    "tokens_used" integer default 0,
    "created_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone not null
      );


alter table "public"."ai_responses" enable row level security;


  create table "public"."api_usage" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "request_type" text not null,
    "tokens_used" integer default 0,
    "cost_cents" real default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."api_usage" enable row level security;


  create table "public"."app_cache" (
    "key" text not null,
    "value" jsonb not null,
    "expires_at" timestamp with time zone not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "cache_type" text default 'general'::text,
    "user_id" uuid,
    "size_bytes" integer default 0
      );


alter table "public"."app_cache" enable row level security;


  create table "public"."conversations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "slug" text,
    "title" text not null,
    "messages" jsonb default '[]'::jsonb,
    "game_id" text,
    "game_title" text,
    "genre" text,
    "subtabs" jsonb default '[]'::jsonb,
    "subtabs_order" jsonb default '[]'::jsonb,
    "is_active_session" boolean default false,
    "active_objective" text,
    "game_progress" integer default 0,
    "is_active" boolean default true,
    "is_pinned" boolean default false,
    "pinned_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."conversations" enable row level security;


  create table "public"."game_insights" (
    "id" uuid not null default gen_random_uuid(),
    "game_title" text not null,
    "genre" text,
    "insights_data" jsonb not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone not null,
    "user_id" uuid
      );


alter table "public"."game_insights" enable row level security;


  create table "public"."games" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null,
    "genre" text,
    "platform" text,
    "cover_url" text,
    "notes" text,
    "status" text default 'backlog'::text,
    "progress" integer default 0,
    "playtime_hours" real default 0,
    "rating" integer,
    "tags" jsonb default '[]'::jsonb,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."games" enable row level security;


  create table "public"."onboarding_progress" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "step" text not null,
    "completed" boolean default false,
    "data" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."onboarding_progress" enable row level security;


  create table "public"."user_analytics" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "event_type" text not null,
    "event_data" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."user_analytics" enable row level security;


  create table "public"."user_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "session_data" jsonb default '{}'::jsonb,
    "started_at" timestamp with time zone default now(),
    "ended_at" timestamp with time zone,
    "duration_seconds" integer
      );


alter table "public"."user_sessions" enable row level security;


  create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "auth_user_id" uuid not null,
    "email" text not null,
    "full_name" text,
    "avatar_url" text,
    "tier" text not null default 'free'::text,
    "is_developer" boolean default false,
    "has_profile_setup" boolean default false,
    "has_seen_splash_screens" boolean default false,
    "has_seen_how_to_use" boolean default false,
    "has_seen_features_connected" boolean default false,
    "has_seen_pro_features" boolean default false,
    "pc_connected" boolean default false,
    "pc_connection_skipped" boolean default false,
    "onboarding_completed" boolean default false,
    "has_welcome_message" boolean default false,
    "is_new_user" boolean default true,
    "has_used_trial" boolean default false,
    "text_count" integer default 0,
    "image_count" integer default 0,
    "text_limit" integer default 55,
    "image_limit" integer default 25,
    "total_requests" integer default 0,
    "last_reset" timestamp with time zone default now(),
    "preferences" jsonb default '{}'::jsonb,
    "usage_data" jsonb default '{}'::jsonb,
    "app_state" jsonb default '{}'::jsonb,
    "profile_data" jsonb default '{}'::jsonb,
    "onboarding_data" jsonb default '{}'::jsonb,
    "behavior_data" jsonb default '{}'::jsonb,
    "feedback_data" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "last_login" timestamp with time zone default now()
      );


alter table "public"."users" enable row level security;


  create table "public"."waitlist" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "source" text default 'landing_page'::text,
    "status" text default 'pending'::text,
    "created_at" timestamp with time zone default now(),
    "invited_at" timestamp with time zone
      );


alter table "public"."waitlist" enable row level security;

CREATE UNIQUE INDEX ai_responses_cache_key_key ON public.ai_responses USING btree (cache_key);

CREATE UNIQUE INDEX ai_responses_pkey ON public.ai_responses USING btree (id);

CREATE UNIQUE INDEX api_usage_pkey ON public.api_usage USING btree (id);

CREATE UNIQUE INDEX app_cache_pkey ON public.app_cache USING btree (key);

CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id);

CREATE UNIQUE INDEX game_insights_game_title_key ON public.game_insights USING btree (game_title);

CREATE UNIQUE INDEX game_insights_pkey ON public.game_insights USING btree (id);

CREATE UNIQUE INDEX games_pkey ON public.games USING btree (id);

CREATE INDEX idx_ai_responses_cache_key ON public.ai_responses USING btree (cache_key);

CREATE INDEX idx_ai_responses_expires_at ON public.ai_responses USING btree (expires_at);

CREATE INDEX idx_ai_responses_game_title ON public.ai_responses USING btree (game_title);

CREATE INDEX idx_analytics_created_at ON public.user_analytics USING btree (created_at);

CREATE INDEX idx_analytics_event_type ON public.user_analytics USING btree (event_type);

CREATE INDEX idx_analytics_user_id ON public.user_analytics USING btree (user_id);

CREATE INDEX idx_api_usage_created_at ON public.api_usage USING btree (created_at);

CREATE INDEX idx_api_usage_user_id ON public.api_usage USING btree (user_id);

CREATE INDEX idx_cache_expires_at ON public.app_cache USING btree (expires_at);

CREATE INDEX idx_cache_type ON public.app_cache USING btree (cache_type);

CREATE INDEX idx_cache_user_id ON public.app_cache USING btree (user_id);

CREATE INDEX idx_conversations_game_id ON public.conversations USING btree (game_id);

CREATE INDEX idx_conversations_is_active ON public.conversations USING btree (is_active);

CREATE INDEX idx_conversations_user_id ON public.conversations USING btree (user_id);

CREATE INDEX idx_conversations_user_slug ON public.conversations USING btree (user_id, slug);

CREATE INDEX idx_game_insights_game_title ON public.game_insights USING btree (game_title);

CREATE INDEX idx_game_insights_genre ON public.game_insights USING btree (genre);

CREATE INDEX idx_games_status ON public.games USING btree (status);

CREATE INDEX idx_games_title ON public.games USING btree (title);

CREATE INDEX idx_games_user_id ON public.games USING btree (user_id);

CREATE INDEX idx_onboarding_step ON public.onboarding_progress USING btree (step);

CREATE INDEX idx_onboarding_user_id ON public.onboarding_progress USING btree (user_id);

CREATE UNIQUE INDEX idx_onboarding_user_step ON public.onboarding_progress USING btree (user_id, step);

CREATE INDEX idx_sessions_started_at ON public.user_sessions USING btree (started_at);

CREATE INDEX idx_sessions_user_id ON public.user_sessions USING btree (user_id);

CREATE INDEX idx_users_auth_user_id ON public.users USING btree (auth_user_id);

CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE INDEX idx_users_tier ON public.users USING btree (tier);

CREATE INDEX idx_waitlist_email ON public.waitlist USING btree (email);

CREATE INDEX idx_waitlist_status ON public.waitlist USING btree (status);

CREATE UNIQUE INDEX onboarding_progress_pkey ON public.onboarding_progress USING btree (id);

CREATE UNIQUE INDEX user_analytics_pkey ON public.user_analytics USING btree (id);

CREATE UNIQUE INDEX user_sessions_pkey ON public.user_sessions USING btree (id);

CREATE UNIQUE INDEX users_auth_user_id_key ON public.users USING btree (auth_user_id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX waitlist_email_key ON public.waitlist USING btree (email);

CREATE UNIQUE INDEX waitlist_pkey ON public.waitlist USING btree (id);

alter table "public"."ai_responses" add constraint "ai_responses_pkey" PRIMARY KEY using index "ai_responses_pkey";

alter table "public"."api_usage" add constraint "api_usage_pkey" PRIMARY KEY using index "api_usage_pkey";

alter table "public"."app_cache" add constraint "app_cache_pkey" PRIMARY KEY using index "app_cache_pkey";

alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "public"."game_insights" add constraint "game_insights_pkey" PRIMARY KEY using index "game_insights_pkey";

alter table "public"."games" add constraint "games_pkey" PRIMARY KEY using index "games_pkey";

alter table "public"."onboarding_progress" add constraint "onboarding_progress_pkey" PRIMARY KEY using index "onboarding_progress_pkey";

alter table "public"."user_analytics" add constraint "user_analytics_pkey" PRIMARY KEY using index "user_analytics_pkey";

alter table "public"."user_sessions" add constraint "user_sessions_pkey" PRIMARY KEY using index "user_sessions_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."waitlist" add constraint "waitlist_pkey" PRIMARY KEY using index "waitlist_pkey";

alter table "public"."ai_responses" add constraint "ai_responses_cache_key_key" UNIQUE using index "ai_responses_cache_key_key";

alter table "public"."api_usage" add constraint "fk_user" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."api_usage" validate constraint "fk_user";

alter table "public"."conversations" add constraint "fk_user" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."conversations" validate constraint "fk_user";

alter table "public"."game_insights" add constraint "game_insights_game_title_key" UNIQUE using index "game_insights_game_title_key";

alter table "public"."games" add constraint "fk_user" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."games" validate constraint "fk_user";

alter table "public"."games" add constraint "games_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."games" validate constraint "games_rating_check";

alter table "public"."games" add constraint "games_status_check" CHECK ((status = ANY (ARRAY['playing'::text, 'completed'::text, 'backlog'::text, 'wishlist'::text]))) not valid;

alter table "public"."games" validate constraint "games_status_check";

alter table "public"."onboarding_progress" add constraint "fk_user" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."onboarding_progress" validate constraint "fk_user";

alter table "public"."user_analytics" add constraint "fk_user" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."user_analytics" validate constraint "fk_user";

alter table "public"."user_sessions" add constraint "fk_user" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."user_sessions" validate constraint "fk_user";

alter table "public"."users" add constraint "users_auth_user_id_fkey" FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_auth_user_id_fkey";

alter table "public"."users" add constraint "users_auth_user_id_key" UNIQUE using index "users_auth_user_id_key";

alter table "public"."users" add constraint "users_tier_check" CHECK ((tier = ANY (ARRAY['free'::text, 'pro'::text, 'vanguard_pro'::text]))) not valid;

alter table "public"."users" validate constraint "users_tier_check";

alter table "public"."waitlist" add constraint "waitlist_email_key" UNIQUE using index "waitlist_email_key";

alter table "public"."waitlist" add constraint "waitlist_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))) not valid;

alter table "public"."waitlist" validate constraint "waitlist_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.clear_user_cache(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM public.app_cache WHERE user_id = p_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_record(p_auth_user_id uuid, p_email text, p_full_name text DEFAULT NULL::text, p_avatar_url text DEFAULT NULL::text, p_is_developer boolean DEFAULT false, p_tier text DEFAULT 'free'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_cache_performance_metrics()
 RETURNS TABLE(metric_name text, metric_value numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_cache_stats()
 RETURNS TABLE(cache_type text, total_entries bigint, total_size_mb numeric, expired_entries bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_complete_user_data(p_auth_user_id uuid)
 RETURNS TABLE(id uuid, auth_user_id uuid, email text, full_name text, avatar_url text, tier text, is_developer boolean, has_profile_setup boolean, has_seen_splash_screens boolean, has_seen_how_to_use boolean, has_seen_features_connected boolean, has_seen_pro_features boolean, pc_connected boolean, pc_connection_skipped boolean, onboarding_completed boolean, has_welcome_message boolean, is_new_user boolean, has_used_trial boolean, text_count integer, image_count integer, text_limit integer, image_limit integer, total_requests integer, last_reset timestamp with time zone, preferences jsonb, usage_data jsonb, app_state jsonb, profile_data jsonb, onboarding_data jsonb, behavior_data jsonb, feedback_data jsonb, created_at timestamp with time zone, updated_at timestamp with time zone, last_login timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_cache_entries(p_user_id uuid)
 RETURNS TABLE(key text, cache_type text, size_bytes integer, expires_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_onboarding_status(p_user_id uuid)
 RETURNS TABLE(is_new_user boolean, has_seen_splash_screens boolean, has_profile_setup boolean, has_welcome_message boolean, has_seen_how_to_use boolean, has_seen_features_connected boolean, has_seen_pro_features boolean, pc_connected boolean, pc_connection_skipped boolean, onboarding_completed boolean, tier text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.increment_user_usage(p_auth_user_id uuid, p_query_type text, p_increment integer DEFAULT 1)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_last_login()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.last_login = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_onboarding_status(p_user_id uuid, p_step text, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  END CASE;
  
  -- Also log the step in onboarding_progress table
  INSERT INTO onboarding_progress (user_id, step, completed, data)
  SELECT u.id, p_step, true, p_data
  FROM users u
  WHERE u.auth_user_id = p_user_id
  ON CONFLICT (user_id, step) 
  DO UPDATE SET 
    completed = true,
    data = onboarding_progress.data || p_data,
    updated_at = now();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_onboarding_status(user_id uuid, status text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- function body (prefer schema-qualified names here too)
  UPDATE public.users SET onboarding_status = status WHERE id = user_id;
END;
$function$
;


  create policy "Authenticated users can access ai_responses"
  on "public"."ai_responses"
  as permissive
  for all
  to authenticated
using (true)
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Service role can manage api_usage"
  on "public"."api_usage"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can view own api_usage"
  on "public"."api_usage"
  as permissive
  for select
  to authenticated
using ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can access own cache"
  on "public"."app_cache"
  as permissive
  for all
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR (user_id IS NULL)))
with check (((user_id = ( SELECT auth.uid() AS uid)) OR (user_id IS NULL)));



  create policy "Users can create own conversations"
  on "public"."conversations"
  as permissive
  for insert
  to authenticated
with check ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can delete own conversations"
  on "public"."conversations"
  as permissive
  for delete
  to authenticated
using ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can update own conversations"
  on "public"."conversations"
  as permissive
  for update
  to authenticated
using ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can view own conversations"
  on "public"."conversations"
  as permissive
  for select
  to authenticated
using ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Authenticated users can access game_insights"
  on "public"."game_insights"
  as permissive
  for all
  to authenticated
using (true)
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can create own games"
  on "public"."games"
  as permissive
  for insert
  to authenticated
with check ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can delete own games"
  on "public"."games"
  as permissive
  for delete
  to authenticated
using ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can update own games"
  on "public"."games"
  as permissive
  for update
  to authenticated
using ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can view own games"
  on "public"."games"
  as permissive
  for select
  to authenticated
using ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can manage own onboarding"
  on "public"."onboarding_progress"
  as permissive
  for all
  to authenticated
using ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_user_id = ( SELECT auth.uid() AS uid)))))
with check ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Service role can manage analytics"
  on "public"."user_analytics"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Users can view own analytics"
  on "public"."user_analytics"
  as permissive
  for select
  to authenticated
using ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can manage own sessions"
  on "public"."user_sessions"
  as permissive
  for all
  to authenticated
using ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_user_id = ( SELECT auth.uid() AS uid)))))
with check ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can update own profile"
  on "public"."users"
  as permissive
  for update
  to authenticated
using ((auth_user_id = ( SELECT auth.uid() AS uid)))
with check ((auth_user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can view own profile"
  on "public"."users"
  as permissive
  for select
  to authenticated
using ((auth_user_id = ( SELECT auth.uid() AS uid)));



  create policy "Anyone can check waitlist"
  on "public"."waitlist"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Anyone can insert into waitlist"
  on "public"."waitlist"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "Service role can manage waitlist"
  on "public"."waitlist"
  as permissive
  for all
  to service_role
using (true)
with check (true);


CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_insights_updated_at BEFORE UPDATE ON public.game_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_updated_at BEFORE UPDATE ON public.onboarding_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_last_login BEFORE UPDATE ON public.users FOR EACH ROW WHEN ((old.auth_user_id IS DISTINCT FROM new.auth_user_id)) EXECUTE FUNCTION update_last_login();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


