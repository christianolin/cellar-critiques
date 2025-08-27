-- Function to generate massive wine database with realistic data
-- This will create 100,000+ wine entries using combinations of existing master data

-- First, let's create some additional producers to have enough variety
WITH country_refs AS (
  SELECT name, id FROM countries WHERE code IN ('FR', 'IT', 'ES', 'DE', 'US', 'AU', 'AR', 'CL', 'ZA', 'PT', 'NZ', 'AT', 'GR')
)
INSERT INTO producers (name, country_id)
SELECT producer_name, country_id FROM (
  VALUES
  -- More French producers
  ('Château Pichon Baron', (SELECT id FROM country_refs WHERE name = 'France')), 
  ('Château Lynch-Bages', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Château Cos d''Estournel', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Château Montrose', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Château Ducru-Beaucaillou', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Château Léoville Las Cases', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Château Palmer', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Château Rauzan-Ségla', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Domaine Armand Rousseau', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Domaine Henri Jayer', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Domaine Leroy', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Domaine Coche-Dury', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Bollinger', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Taittinger', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Pol Roger', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Veuve Clicquot', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Laurent-Perrier', (SELECT id FROM country_refs WHERE name = 'France')),
  ('M. Chapoutier', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Paul Jaboulet Aîné', (SELECT id FROM country_refs WHERE name = 'France')),
  ('Domaine Jean-Louis Chave', (SELECT id FROM country_refs WHERE name = 'France')),
  
  -- More Italian producers
  ('Tenuta San Guido', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Marchesi di Barolo', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Produttori del Barbaresco', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Vietti', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Fontodi', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Castello di Ama', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Isole e Olena', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Riserva di Fizzano', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Dal Forno Romano', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Quintarelli', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Allegrini', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Zenato', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Planeta', (SELECT id FROM country_refs WHERE name = 'Italy')),
  ('Tasca d''Almerita', (SELECT id FROM country_refs WHERE name = 'Italy')),
  
  -- More Spanish producers
  ('Artadi', (SELECT id FROM country_refs WHERE name = 'Spain')),
  ('Aalto', (SELECT id FROM country_refs WHERE name = 'Spain')),
  ('Pingus', (SELECT id FROM country_refs WHERE name = 'Spain')),
  ('Clos Mogador', (SELECT id FROM country_refs WHERE name = 'Spain')),
  ('Torres', (SELECT id FROM country_refs WHERE name = 'Spain')),
  ('Alvaro Palacios', (SELECT id FROM country_refs WHERE name = 'Spain')),
  
  -- More US producers
  ('Harlan Estate', (SELECT id FROM country_refs WHERE name = 'United States')),
  ('Dominus Estate', (SELECT id FROM country_refs WHERE name = 'United States')),
  ('Shafer Vineyards', (SELECT id FROM country_refs WHERE name = 'United States')),
  ('Joseph Phelps', (SELECT id FROM country_refs WHERE name = 'United States')),
  ('Silver Oak', (SELECT id FROM country_refs WHERE name = 'United States')),
  ('Stag''s Leap Wine Cellars', (SELECT id FROM country_refs WHERE name = 'United States')),
  ('Far Niente', (SELECT id FROM country_refs WHERE name = 'United States')),
  ('Cakebread Cellars', (SELECT id FROM country_refs WHERE name = 'United States')),
  ('Robert Mondavi', (SELECT id FROM country_refs WHERE name = 'United States')),
  ('Kendall-Jackson', (SELECT id FROM country_refs WHERE name = 'United States')),
  
  -- More Australian producers
  ('Henschke', (SELECT id FROM country_refs WHERE name = 'Australia')),  
  ('Torbreck', (SELECT id FROM country_refs WHERE name = 'Australia')),
  ('Clarendon Hills', (SELECT id FROM country_refs WHERE name = 'Australia')),
  ('Two Hands', (SELECT id FROM country_refs WHERE name = 'Australia')),
  ('d''Arenberg', (SELECT id FROM country_refs WHERE name = 'Australia')),
  
  -- New Zealand producers
  ('Villa Maria', (SELECT id FROM country_refs WHERE name = 'New Zealand')),
  ('Whitehaven', (SELECT id FROM country_refs WHERE name = 'New Zealand')),
  ('Kim Crawford', (SELECT id FROM country_refs WHERE name = 'New Zealand')),
  ('Brancott Estate', (SELECT id FROM country_refs WHERE name = 'New Zealand')),
  
  -- German producers
  ('Joh. Jos. Prüm', (SELECT id FROM country_refs WHERE name = 'Germany')),
  ('Fritz Haag', (SELECT id FROM country_refs WHERE name = 'Germany')),
  ('Dönnhoff', (SELECT id FROM country_refs WHERE name = 'Germany')),
  ('Georg Breuer', (SELECT id FROM country_refs WHERE name = 'Germany')),
  
  -- Argentine producers
  ('Achaval Ferrer', (SELECT id FROM country_refs WHERE name = 'Argentina')),
  ('Terrazas de los Andes', (SELECT id FROM country_refs WHERE name = 'Argentina')),
  ('Salentein', (SELECT id FROM country_refs WHERE name = 'Argentina')),
  
  -- Chilean producers
  ('Almaviva', (SELECT id FROM country_refs WHERE name = 'Chile')),
  ('Seña', (SELECT id FROM country_refs WHERE name = 'Chile')),
  ('Viña Errázuriz', (SELECT id FROM country_refs WHERE name = 'Chile'))
) AS producer_data(producer_name, country_id)
ON CONFLICT (name) DO NOTHING;

-- Create a function to generate wine database entries
CREATE OR REPLACE FUNCTION generate_wine_database()
RETURNS void AS $$
DECLARE
  producer_record RECORD;
  wine_counter INTEGER := 0;
  wine_types TEXT[] := ARRAY['red', 'white', 'sparkling', 'rose', 'dessert', 'fortified'];
  wine_descriptors TEXT[] := ARRAY[
    'Classic', 'Reserve', 'Premium', 'Estate', 'Vintage', 'Grand Cru', 'Single Vineyard',
    'Special Reserve', 'Limited Edition', 'Master''s Selection', 'Heritage', 'Excellence',
    'Tradition', 'Noble', 'Superior', 'Prestige', 'Select', 'Old Vine', 'Barrel Select'
  ];
  vintage_years INTEGER[] := ARRAY[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
  wine_name TEXT;
  wine_type TEXT;
  alcohol_content NUMERIC;
  description TEXT;
  region_record RECORD;
  appellation_record RECORD;
BEGIN
  -- Loop through each producer and create multiple wines
  FOR producer_record IN 
    SELECT p.id as producer_id, p.name as producer_name, p.country_id,
           c.name as country_name
    FROM producers p
    JOIN countries c ON p.country_id = c.id
  LOOP
    -- Create 80-200 wines per producer (varies to create realistic distribution)
    FOR wine_num IN 1..(80 + (RANDOM() * 120)::INTEGER) LOOP
      -- Generate wine name with variations
      wine_name := producer_record.producer_name || ' ' || 
                   wine_descriptors[1 + (RANDOM() * (array_length(wine_descriptors, 1) - 1))::INTEGER];
      
      -- Add vintage randomly (70% chance)
      IF RANDOM() > 0.3 THEN
        wine_name := wine_name || ' ' || vintage_years[1 + (RANDOM() * (array_length(vintage_years, 1) - 1))::INTEGER]::TEXT;
      END IF;
      
      -- Select wine type based on country preferences
      CASE 
        WHEN producer_record.country_name IN ('France', 'Italy', 'Spain') THEN
          wine_type := wine_types[1 + (RANDOM() * 3)::INTEGER]; -- More red/white/sparkling
        WHEN producer_record.country_name IN ('Germany') THEN
          wine_type := CASE WHEN RANDOM() > 0.2 THEN 'white' ELSE 'dessert' END;
        WHEN producer_record.country_name IN ('Australia', 'United States', 'Argentina', 'Chile') THEN
          wine_type := wine_types[1 + (RANDOM() * 2)::INTEGER]; -- More red/white
        ELSE
          wine_type := wine_types[1 + (RANDOM() * (array_length(wine_types, 1) - 1))::INTEGER];
      END CASE;
      
      -- Generate realistic alcohol content based on wine type
      alcohol_content := CASE wine_type
        WHEN 'red' THEN 12.5 + (RANDOM() * 3.5) -- 12.5-16%
        WHEN 'white' THEN 11.0 + (RANDOM() * 3.0) -- 11-14%
        WHEN 'sparkling' THEN 10.5 + (RANDOM() * 2.5) -- 10.5-13%
        WHEN 'rose' THEN 11.5 + (RANDOM() * 2.5) -- 11.5-14%
        WHEN 'dessert' THEN 8.0 + (RANDOM() * 7.0) -- 8-15%
        WHEN 'fortified' THEN 15.0 + (RANDOM() * 5.0) -- 15-20%
        ELSE 12.0 + (RANDOM() * 3.0)
      END;
      
      -- Generate description
      description := 'Premium ' || wine_type || ' wine from ' || producer_record.producer_name || 
                    ' showcasing the terroir of ' || producer_record.country_name || '.';
      
      -- Get a random region from this country
      SELECT r.id INTO region_record
      FROM regions r 
      WHERE r.country_id = producer_record.country_id 
      ORDER BY RANDOM() 
      LIMIT 1;
      
      -- Get a random appellation from this region (if exists)
      appellation_record := NULL;
      IF region_record IS NOT NULL THEN
        SELECT a.id INTO appellation_record
        FROM appellations a 
        WHERE a.region_id = region_record
        ORDER BY RANDOM() 
        LIMIT 1;
      END IF;
      
      -- Insert the wine
      INSERT INTO wine_database (
        name, 
        producer_id, 
        country_id, 
        region_id, 
        appellation_id, 
        wine_type, 
        alcohol_content, 
        description
      ) VALUES (
        wine_name,
        producer_record.producer_id,
        producer_record.country_id,
        region_record,
        appellation_record,
        wine_type,
        ROUND(alcohol_content, 1),
        description
      );
      
      wine_counter := wine_counter + 1;
      
      -- Log progress every 10000 wines
      IF wine_counter % 10000 = 0 THEN
        RAISE NOTICE 'Generated % wines so far...', wine_counter;
      END IF;
      
      -- Stop if we reach our target (safety measure)
      IF wine_counter >= 120000 THEN
        EXIT;
      END IF;
    END LOOP;
    
    -- Exit outer loop if we've reached our target
    IF wine_counter >= 120000 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Wine database generation complete! Generated % wines total.', wine_counter;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to generate the wine database
SELECT generate_wine_database();

-- Drop the function after use
DROP FUNCTION generate_wine_database();