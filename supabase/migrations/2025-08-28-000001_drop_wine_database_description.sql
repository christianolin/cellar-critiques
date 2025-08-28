-- Drop description column from wine_database
ALTER TABLE public.wine_database
  DROP COLUMN IF EXISTS description;



