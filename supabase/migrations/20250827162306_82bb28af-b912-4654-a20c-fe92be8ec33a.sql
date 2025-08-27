-- Insert Countries (major wine producing countries)
INSERT INTO countries (name, code) VALUES
('France', 'FR'),
('Italy', 'IT'),
('Spain', 'ES'),
('Germany', 'DE'),
('United States', 'US'),
('Australia', 'AU'),
('Argentina', 'AR'),
('Chile', 'CL'),
('South Africa', 'ZA'),
('Portugal', 'PT'),
('New Zealand', 'NZ'),
('Austria', 'AT'),
('Greece', 'GR')
ON CONFLICT (code) DO NOTHING;

-- Insert Regions with conflict handling
WITH country_refs AS (
  SELECT name, id FROM countries WHERE code IN ('FR', 'IT', 'ES', 'DE', 'US', 'AU', 'AR', 'CL', 'ZA', 'PT', 'NZ', 'AT', 'GR')
),
region_inserts AS (
  SELECT DISTINCT region_name, country_id FROM (
    VALUES
    -- France
    ('Bordeaux', (SELECT id FROM country_refs WHERE name = 'France')),
    ('Burgundy', (SELECT id FROM country_refs WHERE name = 'France')),
    ('Champagne', (SELECT id FROM country_refs WHERE name = 'France')),
    ('Rhône Valley', (SELECT id FROM country_refs WHERE name = 'France')),
    ('Loire Valley', (SELECT id FROM country_refs WHERE name = 'France')),
    ('Alsace', (SELECT id FROM country_refs WHERE name = 'France')),
    ('Languedoc-Roussillon', (SELECT id FROM country_refs WHERE name = 'France')),
    
    -- Italy
    ('Tuscany', (SELECT id FROM country_refs WHERE name = 'Italy')),
    ('Piedmont', (SELECT id FROM country_refs WHERE name = 'Italy')),
    ('Veneto', (SELECT id FROM country_refs WHERE name = 'Italy')),
    ('Sicily', (SELECT id FROM country_refs WHERE name = 'Italy')),
    ('Umbria', (SELECT id FROM country_refs WHERE name = 'Italy')),
    
    -- Spain
    ('Rioja', (SELECT id FROM country_refs WHERE name = 'Spain')),
    ('Ribera del Duero', (SELECT id FROM country_refs WHERE name = 'Spain')),
    ('Catalonia', (SELECT id FROM country_refs WHERE name = 'Spain')),
    ('Andalusia', (SELECT id FROM country_refs WHERE name = 'Spain')),
    
    -- Germany
    ('Mosel', (SELECT id FROM country_refs WHERE name = 'Germany')),
    ('Rheingau', (SELECT id FROM country_refs WHERE name = 'Germany')),
    ('Pfalz', (SELECT id FROM country_refs WHERE name = 'Germany')),
    
    -- United States
    ('Napa Valley', (SELECT id FROM country_refs WHERE name = 'United States')),
    ('Sonoma County', (SELECT id FROM country_refs WHERE name = 'United States')),
    ('Oregon', (SELECT id FROM country_refs WHERE name = 'United States')),
    ('Washington State', (SELECT id FROM country_refs WHERE name = 'United States')),
    
    -- Australia
    ('Barossa Valley', (SELECT id FROM country_refs WHERE name = 'Australia')),
    ('Hunter Valley', (SELECT id FROM country_refs WHERE name = 'Australia')),
    ('McLaren Vale', (SELECT id FROM country_refs WHERE name = 'Australia')),
    
    -- Argentina
    ('Mendoza', (SELECT id FROM country_refs WHERE name = 'Argentina')),
    ('Salta', (SELECT id FROM country_refs WHERE name = 'Argentina')),
    
    -- Chile
    ('Maipo Valley', (SELECT id FROM country_refs WHERE name = 'Chile')),
    ('Colchagua Valley', (SELECT id FROM country_refs WHERE name = 'Chile')),
    
    -- New Zealand
    ('Marlborough', (SELECT id FROM country_refs WHERE name = 'New Zealand')),
    ('Central Otago', (SELECT id FROM country_refs WHERE name = 'New Zealand'))
  ) AS region_data(region_name, country_id)
)
INSERT INTO regions (name, country_id)
SELECT region_name, country_id FROM region_inserts
ON CONFLICT (name, country_id) DO NOTHING;

-- Insert Appellations with conflict handling
WITH region_refs AS (
  SELECT r.name as region_name, r.id as region_id, c.name as country_name
  FROM regions r 
  JOIN countries c ON r.country_id = c.id
),
appellation_inserts AS (
  SELECT DISTINCT appellation_name, region_id FROM (
    VALUES
    -- Bordeaux appellations
    ('Médoc', (SELECT region_id FROM region_refs WHERE region_name = 'Bordeaux')),
    ('Saint-Estèphe', (SELECT region_id FROM region_refs WHERE region_name = 'Bordeaux')),
    ('Pauillac', (SELECT region_id FROM region_refs WHERE region_name = 'Bordeaux')),
    ('Saint-Julien', (SELECT region_id FROM region_refs WHERE region_name = 'Bordeaux')),
    ('Margaux', (SELECT region_id FROM region_refs WHERE region_name = 'Bordeaux')),
    ('Pessac-Léognan', (SELECT region_id FROM region_refs WHERE region_name = 'Bordeaux')),
    ('Saint-Émilion', (SELECT region_id FROM region_refs WHERE region_name = 'Bordeaux')),
    ('Pomerol', (SELECT region_id FROM region_refs WHERE region_name = 'Bordeaux')),
    
    -- Burgundy appellations
    ('Chablis', (SELECT region_id FROM region_refs WHERE region_name = 'Burgundy')),
    ('Côte de Nuits', (SELECT region_id FROM region_refs WHERE region_name = 'Burgundy')),
    ('Côte de Beaune', (SELECT region_id FROM region_refs WHERE region_name = 'Burgundy')),
    ('Pouilly-Fuissé', (SELECT region_id FROM region_refs WHERE region_name = 'Burgundy')),
    
    -- Champagne appellations
    ('Champagne', (SELECT region_id FROM region_refs WHERE region_name = 'Champagne')),
    
    -- Rhône Valley appellations
    ('Châteauneuf-du-Pape', (SELECT region_id FROM region_refs WHERE region_name = 'Rhône Valley')),
    ('Hermitage', (SELECT region_id FROM region_refs WHERE region_name = 'Rhône Valley')),
    ('Côte-Rôtie', (SELECT region_id FROM region_refs WHERE region_name = 'Rhône Valley')),
    
    -- Tuscany appellations
    ('Chianti Classico', (SELECT region_id FROM region_refs WHERE region_name = 'Tuscany')),
    ('Brunello di Montalcino', (SELECT region_id FROM region_refs WHERE region_name = 'Tuscany')),
    ('Vino Nobile di Montepulciano', (SELECT region_id FROM region_refs WHERE region_name = 'Tuscany')),
    
    -- Piedmont appellations
    ('Barolo', (SELECT region_id FROM region_refs WHERE region_name = 'Piedmont')),
    ('Barbaresco', (SELECT region_id FROM region_refs WHERE region_name = 'Piedmont')),
    
    -- Rioja appellations
    ('Rioja DOCa', (SELECT region_id FROM region_refs WHERE region_name = 'Rioja')),
    
    -- Napa Valley appellations
    ('Napa Valley AVA', (SELECT region_id FROM region_refs WHERE region_name = 'Napa Valley')),
    ('Stags Leap District', (SELECT region_id FROM region_refs WHERE region_name = 'Napa Valley')),
    ('Oakville', (SELECT region_id FROM region_refs WHERE region_name = 'Napa Valley'))
  ) AS appellation_data(appellation_name, region_id)
)
INSERT INTO appellations (name, region_id)
SELECT appellation_name, region_id FROM appellation_inserts
ON CONFLICT (name, region_id) DO NOTHING;

-- Insert Producers with conflict handling
WITH country_refs AS (
  SELECT name, id FROM countries WHERE code IN ('FR', 'IT', 'ES', 'DE', 'US', 'AU', 'AR', 'CL', 'ZA', 'PT', 'NZ', 'AT', 'GR')
)
INSERT INTO producers (name, country_id)
SELECT producer_name, country_id FROM (
  VALUES
  -- French producers
  ('Château Margaux', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Château Lafite Rothschild', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Château Latour', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Château Mouton Rothschild', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Château Haut-Brion', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Domaine de la Romanée-Conti', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Louis Jadot', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Domaine Leflaive', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Krug', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Dom Pérignon', (SELECT id FROM country_refs WHERE name = 'France')),
  ('E. Guigal', (SELECT id FROM country_refs WHERE name = 'France')),
  
  -- Italian producers
  ('Antinori', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Gaja', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Ornellaia', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Sassicaia', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Barolo Mascarello', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Brunello di Montalcino', (SELECT id FROM country_refs WHERE name = 'Italy')),
  
  -- Spanish producers
  ('Marqués de Riscal', (SELECT id FROM country_refs WHERE name = 'Spain')),
  ('Bodegas Muga', (SELECT id FROM country_refs WHERE name = 'Spain')),
  ('Vega Sicilia', (SELECT id FROM country_refs WHERE name = 'Spain')),
  
  -- German producers
  ('Dr. Loosen', (SELECT id FROM country_refs WHERE name = 'Germany')),
  ('Egon Müller', (SELECT id FROM country_refs WHERE name = 'Germany')),
  
  -- US producers
  ('Opus One', (SELECT id FROM country_refs WHERE name = 'United States')),
  ('Screaming Eagle', (SELECT id FROM country_refs WHERE name = 'United States')),
  ('Caymus', (SELECT id FROM country_refs WHERE name = 'United States')),
  ('Beringer', (SELECT id FROM country_refs WHERE name = 'United States')),
  
  -- Australian producers  
  ('Penfolds', (SELECT id FROM country_refs WHERE name = 'Australia')),
  ('Wolf Blass', (SELECT id FROM country_refs WHERE name = 'Australia')),
  
  -- Argentine producers
  ('Catena Zapata', (SELECT id FROM country_refs WHERE name = 'Argentina')),
  ('Luigi Bosca', (SELECT id FROM country_refs WHERE name = 'Argentina')),
  
  -- Chilean producers
  ('Concha y Toro', (SELECT id FROM country_refs WHERE name = 'Chile')),
  ('Santa Rita', (SELECT id FROM country_refs WHERE name = 'Chile')),
  
  -- New Zealand producers
  ('Cloudy Bay', (SELECT id FROM country_refs WHERE name = 'New Zealand')),
  ('Oyster Bay', (SELECT id FROM country_refs WHERE name = 'New Zealand'))
) AS producer_data(producer_name, country_id)
ON CONFLICT (name) DO NOTHING;

-- Insert Wine Database entries with conflict handling
INSERT INTO wine_database (name, producer_id, country_id, region_id, appellation_id, wine_type, alcohol_content, description)
SELECT wine_name, producer_id, country_id, region_id, appellation_id, wine_type, alcohol_content, description FROM (
  VALUES
  -- Bordeaux wines
  ('Château Margaux', 
   (SELECT p.id FROM producers p WHERE p.name = 'Château Margaux'), 
   (SELECT c.id FROM countries c WHERE c.name = 'France'), 
   (SELECT r.id FROM regions r JOIN countries c ON r.country_id = c.id WHERE r.name = 'Bordeaux' AND c.name = 'France'),
   (SELECT a.id FROM appellations a JOIN regions r ON a.region_id = r.id JOIN countries c ON r.country_id = c.id WHERE a.name = 'Margaux' AND c.name = 'France'),
   'red', 13.5, 'Premier Grand Cru Classé from Margaux appellation'),
   
  ('Château Lafite Rothschild', 
   (SELECT p.id FROM producers p WHERE p.name = 'Château Lafite Rothschild'), 
   (SELECT c.id FROM countries c WHERE c.name = 'France'), 
   (SELECT r.id FROM regions r JOIN countries c ON r.country_id = c.id WHERE r.name = 'Bordeaux' AND c.name = 'France'),
   (SELECT a.id FROM appellations a JOIN regions r ON a.region_id = r.id JOIN countries c ON r.country_id = c.id WHERE a.name = 'Pauillac' AND c.name = 'France'),
   'red', 13.0, 'Premier Grand Cru Classé from Pauillac'),
   
  -- Burgundy wines
  ('Romanée-Conti', 
   (SELECT p.id FROM producers p WHERE p.name = 'Domaine de la Romanée-Conti'), 
   (SELECT c.id FROM countries c WHERE c.name = 'France'), 
   (SELECT r.id FROM regions r JOIN countries c ON r.country_id = c.id WHERE r.name = 'Burgundy' AND c.name = 'France'),
   (SELECT a.id FROM appellations a JOIN regions r ON a.region_id = r.id JOIN countries c ON r.country_id = c.id WHERE a.name = 'Côte de Nuits' AND c.name = 'France'),
   'red', 13.0, 'The most prestigious Pinot Noir in the world'),
   
  -- Champagne wines
  ('Dom Pérignon Vintage', 
   (SELECT p.id FROM producers p WHERE p.name = 'Dom Pérignon'), 
   (SELECT c.id FROM countries c WHERE c.name = 'France'), 
   (SELECT r.id FROM regions r JOIN countries c ON r.country_id = c.id WHERE r.name = 'Champagne' AND c.name = 'France'),
   (SELECT a.id FROM appellations a JOIN regions r ON a.region_id = r.id JOIN countries c ON r.country_id = c.id WHERE a.name = 'Champagne' AND c.name = 'France'),
   'sparkling', 12.5, 'Prestige cuvée Champagne'),
   
  -- Italian wines
  ('Ornellaia', 
   (SELECT p.id FROM producers p WHERE p.name = 'Ornellaia'), 
   (SELECT c.id FROM countries c WHERE c.name = 'Italy'), 
   (SELECT r.id FROM regions r JOIN countries c ON r.country_id = c.id WHERE r.name = 'Tuscany' AND c.name = 'Italy'),
   NULL,
   'red', 14.0, 'Super Tuscan blend from Bolgheri'),
   
  ('Barolo Brunate', 
   (SELECT p.id FROM producers p WHERE p.name = 'Barolo Mascarello'), 
   (SELECT c.id FROM countries c WHERE c.name = 'Italy'), 
   (SELECT r.id FROM regions r JOIN countries c ON r.country_id = c.id WHERE r.name = 'Piedmont' AND c.name = 'Italy'),
   (SELECT a.id FROM appellations a JOIN regions r ON a.region_id = r.id JOIN countries c ON r.country_id = c.id WHERE a.name = 'Barolo' AND c.name = 'Italy'),
   'red', 14.5, 'Traditional Barolo from Brunate vineyard'),
   
  -- Spanish wines  
  ('Marqués de Riscal Reserva', 
   (SELECT p.id FROM producers p WHERE p.name = 'Marqués de Riscal'), 
   (SELECT c.id FROM countries c WHERE c.name = 'Spain'), 
   (SELECT r.id FROM regions r JOIN countries c ON r.country_id = c.id WHERE r.name = 'Rioja' AND c.name = 'Spain'),
   (SELECT a.id FROM appellations a JOIN regions r ON a.region_id = r.id JOIN countries c ON r.country_id = c.id WHERE a.name = 'Rioja DOCa' AND c.name = 'Spain'),
   'red', 13.5, 'Classic Rioja Reserva with Tempranillo'),
   
  -- US wines
  ('Opus One', 
   (SELECT p.id FROM producers p WHERE p.name = 'Opus One'), 
   (SELECT c.id FROM countries c WHERE c.name = 'United States'), 
   (SELECT r.id FROM regions r JOIN countries c ON r.country_id = c.id WHERE r.name = 'Napa Valley' AND c.name = 'United States'),
   (SELECT a.id FROM appellations a JOIN regions r ON a.region_id = r.id JOIN countries c ON r.country_id = c.id WHERE a.name = 'Napa Valley AVA' AND c.name = 'United States'),
   'red', 14.5, 'Bordeaux-style blend from Napa Valley'),
   
  ('Caymus Cabernet Sauvignon', 
   (SELECT p.id FROM producers p WHERE p.name = 'Caymus'), 
   (SELECT c.id FROM countries c WHERE c.name = 'United States'), 
   (SELECT r.id FROM regions r JOIN countries c ON r.country_id = c.id WHERE r.name = 'Napa Valley' AND c.name = 'United States'),
   (SELECT a.id FROM appellations a JOIN regions r ON a.region_id = r.id JOIN countries c ON r.country_id = c.id WHERE a.name = 'Napa Valley AVA' AND c.name = 'United States'),
   'red', 14.8, 'Rich Napa Valley Cabernet Sauvignon'),
   
  -- Australian wines
  ('Penfolds Grange', 
   (SELECT p.id FROM producers p WHERE p.name = 'Penfolds'), 
   (SELECT c.id FROM countries c WHERE c.name = 'Australia'), 
   (SELECT r.id FROM regions r JOIN countries c ON r.country_id = c.id WHERE r.name = 'Barossa Valley' AND c.name = 'Australia'),
   NULL,
   'red', 14.5, 'Australia''s most iconic Shiraz'),
   
  -- German wines
  ('Dr. Loosen Riesling Spätlese', 
   (SELECT p.id FROM producers p WHERE p.name = 'Dr. Loosen'), 
   (SELECT c.id FROM countries c WHERE c.name = 'Germany'), 
   (SELECT r.id FROM regions r JOIN countries c ON r.country_id = c.id WHERE r.name = 'Mosel' AND c.name = 'Germany'),
   NULL,
   'white', 8.5, 'Premium Mosel Riesling with natural sweetness'),
   
  -- New Zealand wines
  ('Cloudy Bay Sauvignon Blanc', 
   (SELECT p.id FROM producers p WHERE p.name = 'Cloudy Bay'), 
   (SELECT c.id FROM countries c WHERE c.name = 'New Zealand'), 
   (SELECT r.id FROM regions r JOIN countries c ON r.country_id = c.id WHERE r.name = 'Marlborough' AND c.name = 'New Zealand'),
   NULL,
   'white', 13.0, 'Iconic Marlborough Sauvignon Blanc')
) AS wine_data(wine_name, producer_id, country_id, region_id, appellation_id, wine_type, alcohol_content, description)
WHERE producer_id IS NOT NULL AND country_id IS NOT NULL;