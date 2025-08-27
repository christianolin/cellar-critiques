-- Clear all wine-related data
TRUNCATE TABLE wine_consumptions RESTART IDENTITY CASCADE;
TRUNCATE TABLE wine_ratings RESTART IDENTITY CASCADE;
TRUNCATE TABLE wine_cellar RESTART IDENTITY CASCADE;
TRUNCATE TABLE wine_grape_composition RESTART IDENTITY CASCADE;
TRUNCATE TABLE wines RESTART IDENTITY CASCADE;
TRUNCATE TABLE wine_database RESTART IDENTITY CASCADE;

-- Also clear master data to start fresh
TRUNCATE TABLE appellations RESTART IDENTITY CASCADE;
TRUNCATE TABLE regions RESTART IDENTITY CASCADE;
TRUNCATE TABLE countries RESTART IDENTITY CASCADE;
TRUNCATE TABLE producers RESTART IDENTITY CASCADE;
TRUNCATE TABLE grape_varieties RESTART IDENTITY CASCADE;

-- Recreate the wine_database structure with proper foreign keys
DROP TABLE IF EXISTS public.wine_database CASCADE;

CREATE TABLE public.wine_database (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  producer_id UUID NOT NULL REFERENCES public.producers(id),
  wine_type TEXT NOT NULL CHECK (wine_type IN ('red', 'white', 'rose', 'sparkling', 'dessert', 'fortified')),
  country_id UUID NOT NULL REFERENCES public.countries(id),
  region_id UUID REFERENCES public.regions(id),
  appellation_id UUID REFERENCES public.appellations(id),
  alcohol_content NUMERIC(3,1),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wine_database ENABLE ROW LEVEL SECURITY;

-- Create policies for wine database
CREATE POLICY "Wine database is viewable by everyone" 
ON public.wine_database 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and Owners can insert wine database entries" 
ON public.wine_database 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and Owners can update wine database entries" 
ON public.wine_database 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and Owners can delete wine database entries" 
ON public.wine_database 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_wine_database_updated_at
BEFORE UPDATE ON public.wine_database
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();