-- Run a one-time import by calling the function
-- Insert some sample wine data directly
INSERT INTO wine_database (name, wine_type, description, producer_id, country_id)
SELECT 
  'Sample Wine ' || generate_series(1, 50),
  CASE (random() * 4)::int
    WHEN 0 THEN 'Red'
    WHEN 1 THEN 'White'
    WHEN 2 THEN 'Rosé'
    WHEN 3 THEN 'Sparkling'
    ELSE 'Dessert'
  END,
  'A quality wine from a renowned producer with excellent characteristics.',
  p.id,
  c.id
FROM 
  producers p,
  countries c
WHERE p.id IN (SELECT id FROM producers LIMIT 10)
  AND c.id IN (SELECT id FROM countries LIMIT 5)
LIMIT 50;