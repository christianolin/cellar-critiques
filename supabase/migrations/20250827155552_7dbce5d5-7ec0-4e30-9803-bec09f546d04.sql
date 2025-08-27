-- Create producers table
CREATE TABLE public.producers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  country_id UUID REFERENCES public.countries(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on producers
ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;

-- Create policies for producers
CREATE POLICY "Master data is viewable by everyone" 
ON public.producers 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and Owners can insert producers" 
ON public.producers 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and Owners can update producers" 
ON public.producers 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and Owners can delete producers" 
ON public.producers 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Create trigger for producers updated_at
CREATE TRIGGER update_producers_updated_at
BEFORE UPDATE ON public.producers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- First, let's populate the missing countries, regions, and appellations from wine_database
INSERT INTO public.countries (name, code)
SELECT DISTINCT country, UPPER(LEFT(country, 2))
FROM public.wine_database 
WHERE country NOT IN (SELECT name FROM public.countries)
ON CONFLICT (name) DO NOTHING;

-- Insert producers
INSERT INTO public.producers (name, country_id)
SELECT DISTINCT wd.producer, c.id
FROM public.wine_database wd
JOIN public.countries c ON c.name = wd.country
WHERE wd.producer NOT IN (SELECT name FROM public.producers)
ON CONFLICT (name) DO NOTHING;

-- Insert regions where they don't exist
INSERT INTO public.regions (name, country_id)
SELECT DISTINCT wd.region, c.id
FROM public.wine_database wd
JOIN public.countries c ON c.name = wd.country
WHERE wd.region IS NOT NULL 
AND wd.region NOT IN (SELECT name FROM public.regions)
ON CONFLICT DO NOTHING;

-- Insert appellations where they don't exist  
INSERT INTO public.appellations (name, region_id)
SELECT DISTINCT wd.appellation, r.id
FROM public.wine_database wd
JOIN public.countries c ON c.name = wd.country
JOIN public.regions r ON r.name = wd.region AND r.country_id = c.id
WHERE wd.appellation IS NOT NULL
AND wd.appellation NOT IN (SELECT name FROM public.appellations)
ON CONFLICT DO NOTHING;

-- Add foreign key columns to wine_database
ALTER TABLE public.wine_database 
ADD COLUMN producer_id UUID REFERENCES public.producers(id),
ADD COLUMN country_id UUID REFERENCES public.countries(id),
ADD COLUMN region_id UUID REFERENCES public.regions(id),
ADD COLUMN appellation_id UUID REFERENCES public.appellations(id);

-- Update wine_database with foreign keys
UPDATE public.wine_database wd
SET producer_id = p.id
FROM public.producers p
WHERE p.name = wd.producer;

UPDATE public.wine_database wd
SET country_id = c.id
FROM public.countries c
WHERE c.name = wd.country;

UPDATE public.wine_database wd
SET region_id = r.id
FROM public.regions r
JOIN public.countries c ON r.country_id = c.id
WHERE r.name = wd.region AND c.name = wd.country;

UPDATE public.wine_database wd
SET appellation_id = a.id
FROM public.appellations a
JOIN public.regions r ON a.region_id = r.id
JOIN public.countries c ON r.country_id = c.id
WHERE a.name = wd.appellation AND r.name = wd.region AND c.name = wd.country;

-- Drop old text columns and make foreign keys required
ALTER TABLE public.wine_database 
DROP COLUMN producer,
DROP COLUMN country,
DROP COLUMN region,
DROP COLUMN appellation;

-- Make producer_id and country_id required
ALTER TABLE public.wine_database 
ALTER COLUMN producer_id SET NOT NULL,
ALTER COLUMN country_id SET NOT NULL;

-- Remove cellar_tracker_id from wines table
ALTER TABLE public.wines DROP COLUMN IF EXISTS cellar_tracker_id;