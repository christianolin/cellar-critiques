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

-- Create a temporary mapping to handle country name differences
CREATE TEMP TABLE country_mapping AS
SELECT 
  CASE 
    WHEN wd.country = 'USA' THEN 'United States'
    ELSE wd.country 
  END as normalized_country,
  wd.country as original_country
FROM public.wine_database wd
GROUP BY wd.country;

-- Insert producers using the country mapping
INSERT INTO public.producers (name, country_id)
SELECT DISTINCT wd.producer, c.id
FROM public.wine_database wd
JOIN country_mapping cm ON cm.original_country = wd.country
JOIN public.countries c ON c.name = cm.normalized_country
ON CONFLICT (name) DO NOTHING;

-- Insert regions using country mapping
INSERT INTO public.regions (name, country_id)
SELECT DISTINCT wd.region, c.id
FROM public.wine_database wd
JOIN country_mapping cm ON cm.original_country = wd.country
JOIN public.countries c ON c.name = cm.normalized_country
WHERE wd.region IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM public.regions r 
  WHERE r.name = wd.region AND r.country_id = c.id
);

-- Insert appellations using country and region mapping
INSERT INTO public.appellations (name, region_id)
SELECT DISTINCT wd.appellation, r.id
FROM public.wine_database wd
JOIN country_mapping cm ON cm.original_country = wd.country
JOIN public.countries c ON c.name = cm.normalized_country
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

-- Update wine_database with foreign keys using the mapping
UPDATE public.wine_database wd
SET producer_id = p.id
FROM public.producers p
WHERE p.name = wd.producer;

UPDATE public.wine_database wd
SET country_id = c.id
FROM country_mapping cm, public.countries c
WHERE cm.original_country = wd.country AND c.name = cm.normalized_country;

UPDATE public.wine_database wd
SET region_id = r.id
FROM country_mapping cm, public.countries c, public.regions r
WHERE cm.original_country = wd.country 
AND c.name = cm.normalized_country
AND r.name = wd.region 
AND r.country_id = c.id
AND wd.region IS NOT NULL;

UPDATE public.wine_database wd
SET appellation_id = a.id
FROM country_mapping cm, public.countries c, public.regions r, public.appellations a
WHERE cm.original_country = wd.country 
AND c.name = cm.normalized_country
AND r.name = wd.region 
AND r.country_id = c.id
AND a.name = wd.appellation 
AND a.region_id = r.id
AND wd.appellation IS NOT NULL;

-- Add foreign key constraints
ALTER TABLE public.wine_database 
ADD CONSTRAINT fk_wine_database_producer FOREIGN KEY (producer_id) REFERENCES public.producers(id),
ADD CONSTRAINT fk_wine_database_country FOREIGN KEY (country_id) REFERENCES public.countries(id),
ADD CONSTRAINT fk_wine_database_region FOREIGN KEY (region_id) REFERENCES public.regions(id),
ADD CONSTRAINT fk_wine_database_appellation FOREIGN KEY (appellation_id) REFERENCES public.appellations(id);

-- Make producer_id and country_id required
ALTER TABLE public.wine_database 
ALTER COLUMN producer_id SET NOT NULL,
ALTER COLUMN country_id SET NOT NULL;

-- Drop old text columns
ALTER TABLE public.wine_database 
DROP COLUMN producer,
DROP COLUMN country,
DROP COLUMN region,
DROP COLUMN appellation;

-- Remove cellar_tracker_id from wines table
ALTER TABLE public.wines DROP COLUMN IF EXISTS cellar_tracker_id;