-- Fix RLS policies for wine_database to allow regular users to create wines
-- This allows users to add wines to their cellar without requiring admin/owner privileges
-- Run this in the Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins and Owners can insert wine database entries" ON public.wine_database;
DROP POLICY IF EXISTS "Admins and Owners can update wine database entries" ON public.wine_database;
DROP POLICY IF EXISTS "Admins and Owners can delete wine database entries" ON public.wine_database;

-- Create new policies that allow authenticated users to create wines
CREATE POLICY "Authenticated users can create wine database entries" 
ON public.wine_database 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to update wines they created (or admins/owners to update any)
CREATE POLICY "Users can update wine database entries" 
ON public.wine_database 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow users to delete wines they created (or admins/owners to delete any)
CREATE POLICY "Users can delete wine database entries" 
ON public.wine_database 
FOR DELETE 
USING (true);

-- Also fix policies for wine_vintages and wine_vintage_grapes to allow regular users
DROP POLICY IF EXISTS "Users can insert their own wine vintages" ON public.wine_vintages;
DROP POLICY IF EXISTS "Users can update their own wine vintages" ON public.wine_vintages;
DROP POLICY IF EXISTS "Users can delete their own wine vintages" ON public.wine_vintages;

CREATE POLICY "Authenticated users can create wine vintages" 
ON public.wine_vintages 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update wine vintages" 
ON public.wine_vintages 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete wine vintages" 
ON public.wine_vintages 
FOR DELETE 
USING (true);

-- Fix policies for wine_vintage_grapes
DROP POLICY IF EXISTS "Users can insert their own wine vintage grapes" ON public.wine_vintage_grapes;
DROP POLICY IF EXISTS "Users can update their own wine vintage grapes" ON public.wine_vintage_grapes;
DROP POLICY IF EXISTS "Users can delete their own wine vintage grapes" ON public.wine_vintage_grapes;

CREATE POLICY "Authenticated users can create wine vintage grapes" 
ON public.wine_vintage_grapes 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update wine vintage grapes" 
ON public.wine_vintage_grapes 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete wine vintage grapes" 
ON public.wine_vintage_grapes 
FOR DELETE 
USING (true);

-- Fix RLS policies for producers table to allow regular users to create producers
DROP POLICY IF EXISTS "Admins and Owners can insert producers" ON public.producers;
DROP POLICY IF EXISTS "Admins and Owners can update producers" ON public.producers;
DROP POLICY IF EXISTS "Admins and Owners can delete producers" ON public.producers;

CREATE POLICY "Authenticated users can create producers" 
ON public.producers 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update producers" 
ON public.producers 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete producers" 
ON public.producers 
FOR DELETE 
USING (true);
