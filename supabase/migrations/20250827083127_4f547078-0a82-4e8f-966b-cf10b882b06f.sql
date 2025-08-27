-- Add birth_year column to profiles table
ALTER TABLE public.profiles ADD COLUMN birth_year INTEGER;

-- Add check constraint to ensure valid birth year range
ALTER TABLE public.profiles ADD CONSTRAINT birth_year_range CHECK (birth_year >= 1900 AND birth_year <= 2010);