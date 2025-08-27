-- Fix the core issue: Remove table-level permissions for anonymous users
-- The anon role currently has 'arwdDxtm' permissions which includes SELECT access
-- This bypasses RLS policies, so we need to revoke these permissions

-- Revoke all permissions from anon role on profiles table
REVOKE ALL ON public.profiles FROM anon;

-- Grant only necessary permissions to authenticated role  
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Ensure service_role retains full access for administrative functions
GRANT ALL ON public.profiles TO service_role;