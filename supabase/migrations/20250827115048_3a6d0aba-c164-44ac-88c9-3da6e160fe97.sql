-- Remove legacy fields from wine_ratings and delete all existing ratings
DELETE FROM public.wine_ratings;

-- Drop legacy columns that were replaced with detailed rating fields
ALTER TABLE public.wine_ratings 
DROP COLUMN IF EXISTS color,
DROP COLUMN IF EXISTS body, 
DROP COLUMN IF EXISTS sweetness;