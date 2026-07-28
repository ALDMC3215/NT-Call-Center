-- =============================================================================
-- Migration: Add profile dropdown fields and Avatar support
-- File: supabase/migrations/20260728_add_profile_dropdown.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create the 'avatars' storage bucket if it doesn't exist
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars', 
    'avatars', 
    true, 
    1048576, -- 1MB
    ARRAY['image/png', 'image/jpg', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Storage RLS Policies
-- ---------------------------------------------------------------------------
-- Avatars are publicly readable
CREATE POLICY "Avatar images are publicly accessible." 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Authenticated users can upload their own avatars
CREATE POLICY "Users can upload their own avatars." 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Authenticated users can update their own avatars
CREATE POLICY "Users can update their own avatars."
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- ---------------------------------------------------------------------------
-- 3. Extend public.profiles Table
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS shift TEXT DEFAULT 'Morning',
ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'پردیس';

-- ---------------------------------------------------------------------------
-- 4. RPC for users to update their own profile data
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_own_profile_data(
    p_name TEXT, 
    p_shift TEXT, 
    p_branch TEXT, 
    p_avatar_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Forbidden: unauthenticated';
  END IF;

  IF length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Validation: full_name cannot be empty';
  END IF;

  UPDATE public.profiles
  SET 
    full_name = trim(p_name),
    shift = p_shift,
    branch = p_branch,
    avatar_url = COALESCE(p_avatar_url, avatar_url)
  WHERE id = caller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;
