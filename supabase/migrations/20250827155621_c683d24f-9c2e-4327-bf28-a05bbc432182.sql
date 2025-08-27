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

-- Create a mapping function for country codes to avoid duplicates
CREATE OR REPLACE FUNCTION get_country_code(country_name TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    WHEN country_name = 'United States' OR country_name = 'USA' THEN 'US'
    WHEN country_name = 'United Kingdom' OR country_name = 'UK' THEN 'GB'
    WHEN country_name = 'France' THEN 'FR'
    WHEN country_name = 'Germany' THEN 'DE'
    WHEN country_name = 'Italy' THEN 'IT'
    WHEN country_name = 'Spain' THEN 'ES'
    WHEN country_name = 'Australia' THEN 'AU'
    WHEN country_name = 'New Zealand' THEN 'NZ'
    WHEN country_name = 'Chile' THEN 'CL'
    WHEN country_name = 'Argentina' THEN 'AR'
    WHEN country_name = 'South Africa' THEN 'ZA'
    WHEN country_name = 'Portugal' THEN 'PT'
    ELSE UPPER(LEFT(country_name, 2))
  END;
END;
$$ LANGUAGE plpgsql;

-- Insert missing countries from wine_database
INSERT INTO public.countries (name, code)
SELECT DISTINCT 
  wd.country,
  get_country_code(wd.country)
FROM public.wine_database wd
WHERE wd.country NOT IN (SELECT name FROM public.countries)
ON CONFLICT (code) DO NOTHING;

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
AND NOT EXISTS (
  SELECT 1 FROM public.regions r 
  WHERE r.name = wd.region AND r.country_id = c.id
);

-- Insert appellations where they don't exist  
INSERT INTO public.appellations (name, region_id)
SELECT DISTINCT wd.appellation, r.id
FROM public.wine_database wd
JOIN public.countries c ON c.name = wd.country
JOIN public.regions r ON r.name = wd.region AND r.country_id = c.id
WHERE wd.appellation IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.appellations a 
  WHERE a.name = wd.appellation AND a.region_id = r.id
);

-- Add foreign key columns to wine_database
ALTER TABLE public.wine_database 
ADD COLUMN producer_id UUID,
ADD COLUMN country_id UUID,
ADD COLUMN region_id UUID,
ADD COLUMN appellation_id UUID;

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

-- Add foreign key constraints
ALTER TABLE public.wine_database 
ADD CONSTRAINT fk_wine_database_producer FOREIGN KEY (producer_id) REFERENCES public.producers(id),
ADD CONSTRAINT fk_wine_database_country FOREIGN KEY (country_id) REFERENCES public.countries(id),
ADD CONSTRAINT fk_wine_database_region FOREIGN KEY (region_id) REFERENCES public.regions(id),
ADD CONSTRAINT fk_wine_database_appellation FOREIGN KEY (appellation_id) REFERENCES public.appellations(id);

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

-- Drop the helper function
DROP FUNCTION get_country_code(TEXT);