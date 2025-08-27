-- Remove vintage column from wine_database table
ALTER TABLE public.wine_database DROP COLUMN IF EXISTS vintage;