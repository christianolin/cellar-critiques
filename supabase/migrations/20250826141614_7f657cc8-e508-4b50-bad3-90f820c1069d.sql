-- Create master data tables for wine information
CREATE TABLE public.countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, country_id)
);

CREATE TABLE public.appellations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, region_id)
);

CREATE TABLE public.grape_varieties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('red', 'white')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on master data tables
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grape_varieties ENABLE ROW LEVEL SECURITY;

-- Create policies for master data (read-only for regular users)
CREATE POLICY "Master data is viewable by everyone" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Master data is viewable by everyone" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Master data is viewable by everyone" ON public.appellations FOR SELECT USING (true);
CREATE POLICY "Master data is viewable by everyone" ON public.grape_varieties FOR SELECT USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON public.countries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON public.regions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_appellations_updated_at BEFORE UPDATE ON public.appellations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_grape_varieties_updated_at BEFORE UPDATE ON public.grape_varieties FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert WSET-based data for countries
INSERT INTO public.countries (name, code) VALUES
('France', 'FR'),
('Italy', 'IT'),
('Spain', 'ES'),
('Germany', 'DE'),
('United States', 'US'),
('Australia', 'AU'),
('Chile', 'CL'),
('Argentina', 'AR'),
('South Africa', 'ZA'),
('New Zealand', 'NZ'),
('Portugal', 'PT'),
('Austria', 'AT'),
('Greece', 'GR'),
('Hungary', 'HU'),
('Romania', 'RO'),
('Bulgaria', 'BG'),
('Croatia', 'HR'),
('Slovenia', 'SI'),
('Switzerland', 'CH'),
('Canada', 'CA'),
('Brazil', 'BR'),
('Uruguay', 'UY'),
('Mexico', 'MX'),
('Israel', 'IL'),
('Lebanon', 'LB'),
('Turkey', 'TR'),
('Georgia', 'GE'),
('China', 'CN'),
('Japan', 'JP'),
('India', 'IN');

-- Insert major wine regions
INSERT INTO public.regions (name, country_id) VALUES
-- France
('Bordeaux', (SELECT id FROM countries WHERE code = 'FR')),
('Burgundy', (SELECT id FROM countries WHERE code = 'FR')),
('Champagne', (SELECT id FROM countries WHERE code = 'FR')),
('Rhône Valley', (SELECT id FROM countries WHERE code = 'FR')),
('Loire Valley', (SELECT id FROM countries WHERE code = 'FR')),
('Alsace', (SELECT id FROM countries WHERE code = 'FR')),
('Languedoc-Roussillon', (SELECT id FROM countries WHERE code = 'FR')),
('Provence', (SELECT id FROM countries WHERE code = 'FR')),
-- Italy
('Tuscany', (SELECT id FROM countries WHERE code = 'IT')),
('Piedmont', (SELECT id FROM countries WHERE code = 'IT')),
('Veneto', (SELECT id FROM countries WHERE code = 'IT')),
('Sicily', (SELECT id FROM countries WHERE code = 'IT')),
('Puglia', (SELECT id FROM countries WHERE code = 'IT')),
('Marche', (SELECT id FROM countries WHERE code = 'IT')),
-- Spain
('Rioja', (SELECT id FROM countries WHERE code = 'ES')),
('Ribera del Duero', (SELECT id FROM countries WHERE code = 'ES')),
('Priorat', (SELECT id FROM countries WHERE code = 'ES')),
('Rías Baixas', (SELECT id FROM countries WHERE code = 'ES')),
-- Germany
('Mosel', (SELECT id FROM countries WHERE code = 'DE')),
('Rheingau', (SELECT id FROM countries WHERE code = 'DE')),
('Pfalz', (SELECT id FROM countries WHERE code = 'DE')),
-- United States
('Napa Valley', (SELECT id FROM countries WHERE code = 'US')),
('Sonoma County', (SELECT id FROM countries WHERE code = 'US')),
('Oregon', (SELECT id FROM countries WHERE code = 'US')),
('Washington State', (SELECT id FROM countries WHERE code = 'US')),
-- Australia
('Barossa Valley', (SELECT id FROM countries WHERE code = 'AU')),
('Hunter Valley', (SELECT id FROM countries WHERE code = 'AU')),
('Margaret River', (SELECT id FROM countries WHERE code = 'AU')),
('Clare Valley', (SELECT id FROM countries WHERE code = 'AU')),
-- Chile
('Maipo Valley', (SELECT id FROM countries WHERE code = 'CL')),
('Colchagua Valley', (SELECT id FROM countries WHERE code = 'CL')),
-- Argentina
('Mendoza', (SELECT id FROM countries WHERE code = 'AR')),
-- South Africa
('Stellenbosch', (SELECT id FROM countries WHERE code = 'ZA')),
('Western Cape', (SELECT id FROM countries WHERE code = 'ZA')),
-- New Zealand
('Marlborough', (SELECT id FROM countries WHERE code = 'NZ')),
('Central Otago', (SELECT id FROM countries WHERE code = 'NZ'));

-- Insert major grape varieties
INSERT INTO public.grape_varieties (name, type) VALUES
-- Red varieties
('Cabernet Sauvignon', 'red'),
('Merlot', 'red'),
('Pinot Noir', 'red'),
('Syrah/Shiraz', 'red'),
('Grenache', 'red'),
('Sangiovese', 'red'),
('Tempranillo', 'red'),
('Nebbiolo', 'red'),
('Barbera', 'red'),
('Dolcetto', 'red'),
('Chianti', 'red'),
('Zinfandel', 'red'),
('Petite Sirah', 'red'),
('Mourvèdre', 'red'),
('Carignan', 'red'),
('Gamay', 'red'),
('Cabernet Franc', 'red'),
('Malbec', 'red'),
('Petit Verdot', 'red'),
-- White varieties
('Chardonnay', 'white'),
('Sauvignon Blanc', 'white'),
('Riesling', 'white'),
('Pinot Grigio/Pinot Gris', 'white'),
('Gewürztraminer', 'white'),
('Chenin Blanc', 'white'),
('Sémillon', 'white'),
('Viognier', 'white'),
('Albariño', 'white'),
('Verdejo', 'white'),
('Grüner Veltliner', 'white'),
('Moscato', 'white'),
('Pinot Blanc', 'white'),
('Roussanne', 'white'),
('Marsanne', 'white'),
('Vermentino', 'white'),
('Trebbiano', 'white'),
('Garganega', 'white'),
('Cortese', 'white'),
('Falanghina', 'white');

-- Insert some major appellations
INSERT INTO public.appellations (name, region_id) VALUES
-- Bordeaux appellations
('Saint-Julien', (SELECT id FROM regions WHERE name = 'Bordeaux')),
('Pauillac', (SELECT id FROM regions WHERE name = 'Bordeaux')),
('Saint-Estèphe', (SELECT id FROM regions WHERE name = 'Bordeaux')),
('Margaux', (SELECT id FROM regions WHERE name = 'Bordeaux')),
('Pessac-Léognan', (SELECT id FROM regions WHERE name = 'Bordeaux')),
('Saint-Émilion', (SELECT id FROM regions WHERE name = 'Bordeaux')),
('Pomerol', (SELECT id FROM regions WHERE name = 'Bordeaux')),
-- Burgundy appellations
('Chablis', (SELECT id FROM regions WHERE name = 'Burgundy')),
('Côte de Nuits', (SELECT id FROM regions WHERE name = 'Burgundy')),
('Côte de Beaune', (SELECT id FROM regions WHERE name = 'Burgundy')),
('Gevrey-Chambertin', (SELECT id FROM regions WHERE name = 'Burgundy')),
('Chambolle-Musigny', (SELECT id FROM regions WHERE name = 'Burgundy')),
('Vosne-Romanée', (SELECT id FROM regions WHERE name = 'Burgundy')),
('Meursault', (SELECT id FROM regions WHERE name = 'Burgundy')),
('Puligny-Montrachet', (SELECT id FROM regions WHERE name = 'Burgundy')),
-- Tuscany appellations
('Chianti Classico', (SELECT id FROM regions WHERE name = 'Tuscany')),
('Brunello di Montalcino', (SELECT id FROM regions WHERE name = 'Tuscany')),
('Vino Nobile di Montepulciano', (SELECT id FROM regions WHERE name = 'Tuscany')),
('Bolgheri', (SELECT id FROM regions WHERE name = 'Tuscany')),
-- Piedmont appellations
('Barolo', (SELECT id FROM regions WHERE name = 'Piedmont')),
('Barbaresco', (SELECT id FROM regions WHERE name = 'Piedmont')),
('Barbera d''Alba', (SELECT id FROM regions WHERE name = 'Piedmont')),
('Dolcetto d''Alba', (SELECT id FROM regions WHERE name = 'Piedmont'));

-- Update wines table to use foreign keys for master data
ALTER TABLE public.wines 
DROP COLUMN IF EXISTS country,
DROP COLUMN IF EXISTS region,
DROP COLUMN IF EXISTS subregion,
DROP COLUMN IF EXISTS appellation,
DROP COLUMN IF EXISTS grape_varieties;

ALTER TABLE public.wines 
ADD COLUMN country_id UUID REFERENCES countries(id),
ADD COLUMN region_id UUID REFERENCES regions(id),
ADD COLUMN appellation_id UUID REFERENCES appellations(id),
ADD COLUMN grape_variety_ids UUID[] DEFAULT '{}';

-- Remove characteristics from wines table (move to ratings only)
ALTER TABLE public.wines
DROP COLUMN IF EXISTS color,
DROP COLUMN IF EXISTS body,
DROP COLUMN IF EXISTS sweetness,
DROP COLUMN IF EXISTS serving_temp_min,
DROP COLUMN IF EXISTS serving_temp_max,
DROP COLUMN IF EXISTS drink_from,
DROP COLUMN IF EXISTS drink_until;

-- Add characteristics to wine_ratings table
ALTER TABLE public.wine_ratings
ADD COLUMN IF NOT EXISTS color color_type,
ADD COLUMN IF NOT EXISTS body body_type,
ADD COLUMN IF NOT EXISTS sweetness sweetness_type,
ADD COLUMN IF NOT EXISTS serving_temp_min INTEGER,
ADD COLUMN IF NOT EXISTS serving_temp_max INTEGER;