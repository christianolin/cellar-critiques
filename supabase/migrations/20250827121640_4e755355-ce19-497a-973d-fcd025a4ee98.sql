-- Fix security issue: Restrict profile visibility to authenticated users only
-- Drop the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a more secure policy that only allows authenticated users to view profiles
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Keep existing policies for users to manage their own profiles
-- (These are already secure: "Users can insert their own profile" and "Users can update their own profile")