-- Otagon App - Initial Schema
-- This file is deprecated - use master-schema.sql instead
-- This schema will grow as we add more pages and features

-- ⚠️  DEPRECATED: Use master-schema.sql for the complete schema
-- This file is kept for reference only

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Waitlist table (for landing page) - Basic version
CREATE TABLE IF NOT EXISTS public.waitlist (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    email text NOT NULL UNIQUE,
    source text DEFAULT 'landing_page',
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access to waitlist (for landing page signups)
CREATE POLICY "Allow public access to waitlist" ON public.waitlist
    FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at);

-- Note: For the complete schema with authentication, onboarding, and all features,
-- please run the master-schema.sql file instead.
