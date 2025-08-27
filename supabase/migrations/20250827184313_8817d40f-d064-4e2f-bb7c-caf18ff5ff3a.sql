-- Add vintage column to wine_database table
ALTER TABLE public.wine_database 
ADD COLUMN vintage integer;