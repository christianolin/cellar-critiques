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

-- Insert all missing countries first (handle duplicates)
DO $$
DECLARE
    wine_countries TEXT[] := ARRAY['France', 'Italy', 'Spain', 'Germany', 'USA', 'Australia', 'New Zealand', 'Chile', 'Argentina', 'South Africa', 'Portugal'];
    country TEXT;
    country_code TEXT;
BEGIN
    FOREACH country IN ARRAY wine_countries LOOP
        -- Determine country code
        country_code := CASE 
            WHEN country = 'USA' THEN 'US'
            WHEN country = 'France' THEN 'FR'
            WHEN country = 'Germany' THEN 'DE'
            WHEN country = 'Italy' THEN 'IT'
            WHEN country = 'Spain' THEN 'ES'
            WHEN country = 'Australia' THEN 'AU'
            WHEN country = 'New Zealand' THEN 'NZ'
            WHEN country = 'Chile' THEN 'CL'
            WHEN country = 'Argentina' THEN 'AR'
            WHEN country = 'South Africa' THEN 'ZA'
            WHEN country = 'Portugal' THEN 'PT'
            ELSE UPPER(LEFT(country, 2))
        END;
        
        -- Insert if not exists
        INSERT INTO public.countries (name, code)
        VALUES (country, country_code)
        ON CONFLICT (name) DO NOTHING;
    END LOOP;
END $$;

-- Insert all producers from wine_database
INSERT INTO public.producers (name, country_id)
SELECT DISTINCT wd.producer, c.id
FROM public.wine_database wd
JOIN public.countries c ON c.name = wd.country
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

-- Add foreign key columns to wine_database (nullable first)
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
WHERE r.name = wd.region AND c.name = wd.country
AND wd.region IS NOT NULL;

UPDATE public.wine_database wd
SET appellation_id = a.id
FROM public.appellations a
JOIN public.regions r ON a.region_id = r.id
JOIN public.countries c ON r.country_id = c.id
WHERE a.name = wd.appellation AND r.name = wd.region AND c.name = wd.country
AND wd.appellation IS NOT NULL;

-- Check if all required foreign keys are populated before making them NOT NULL
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.wine_database WHERE producer_id IS NULL) THEN
        RAISE EXCEPTION 'Some wines do not have a matching producer_id';
    END IF;
    
    IF EXISTS (SELECT 1 FROM public.wine_database WHERE country_id IS NULL) THEN
        RAISE EXCEPTION 'Some wines do not have a matching country_id';
    END IF;
END $$;

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