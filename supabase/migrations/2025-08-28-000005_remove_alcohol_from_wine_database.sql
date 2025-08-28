-- Remove alcohol_content column from wine_database since it's now stored in wine_vintages
ALTER TABLE public.wine_database DROP COLUMN IF EXISTS alcohol_content;
