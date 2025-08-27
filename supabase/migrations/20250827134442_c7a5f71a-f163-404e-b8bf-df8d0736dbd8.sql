-- Remove serving temperature fields from wine_ratings table
ALTER TABLE public.wine_ratings 
DROP COLUMN IF EXISTS serving_temp_min,
DROP COLUMN IF EXISTS serving_temp_max;

-- Add dependency checking for wines
-- Create a function to check if a wine can be deleted
CREATE OR REPLACE FUNCTION public.can_delete_wine(wine_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'can_delete', NOT EXISTS (
      SELECT 1 FROM wine_cellar WHERE wine_id = $1
      UNION ALL
      SELECT 1 FROM wine_ratings WHERE wine_id = $1
      UNION ALL  
      SELECT 1 FROM wine_consumptions WHERE wine_id = $1
    ),
    'rating_count', (SELECT COUNT(*) FROM wine_ratings WHERE wine_id = $1),
    'cellar_count', (SELECT COUNT(*) FROM wine_cellar WHERE wine_id = $1),
    'consumption_count', (SELECT COUNT(*) FROM wine_consumptions WHERE wine_id = $1)
  );
$$;

-- Create test user profile and data
-- Note: The user account must be created through auth first with email 'testuser@example.com'

-- Insert test user profile (will only work after user signs up)
INSERT INTO public.profiles (user_id, username, display_name, bio)
SELECT 
  au.id,
  'testuser',
  'Test User',
  'Test user for friends functionality'
FROM auth.users au 
WHERE au.email = 'testuser@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- Insert test wines for the test user's cellar
INSERT INTO public.wines (name, producer, wine_type, vintage, alcohol_content)
VALUES 
  ('Cabernet Sauvignon Reserve', 'Test Winery', 'red', 2020, 14.5),
  ('Chardonnay Estate', 'Test Winery', 'white', 2022, 13.0),
  ('Pinot Noir Classic', 'Mountain Vineyards', 'red', 2021, 13.5)
ON CONFLICT DO NOTHING;

-- Insert wines into test user's cellar
INSERT INTO public.wine_cellar (user_id, wine_id, quantity, purchase_price, notes, storage_location)
SELECT 
  p.user_id,
  w.id,
  CASE w.name 
    WHEN 'Cabernet Sauvignon Reserve' THEN 3
    WHEN 'Chardonnay Estate' THEN 2  
    WHEN 'Pinot Noir Classic' THEN 4
  END,
  CASE w.name
    WHEN 'Cabernet Sauvignon Reserve' THEN 45.00
    WHEN 'Chardonnay Estate' THEN 28.00
    WHEN 'Pinot Noir Classic' THEN 35.00
  END,
  CASE w.name
    WHEN 'Cabernet Sauvignon Reserve' THEN 'Excellent vintage, aging well'
    WHEN 'Chardonnay Estate' THEN 'Crisp and refreshing'
    WHEN 'Pinot Noir Classic' THEN 'Smooth and elegant'
  END,
  'Wine Cellar - Rack A'
FROM public.profiles p
CROSS JOIN public.wines w
WHERE p.username = 'testuser'
  AND w.name IN ('Cabernet Sauvignon Reserve', 'Chardonnay Estate', 'Pinot Noir Classic')
ON CONFLICT DO NOTHING;

-- Insert ratings for test user
INSERT INTO public.wine_ratings (user_id, wine_id, rating, tasting_notes, food_pairing, tasting_date)
SELECT 
  p.user_id,
  w.id,
  CASE w.name
    WHEN 'Cabernet Sauvignon Reserve' THEN 9
    WHEN 'Chardonnay Estate' THEN 8
    WHEN 'Pinot Noir Classic' THEN 8
  END,
  CASE w.name
    WHEN 'Cabernet Sauvignon Reserve' THEN 'Rich tannins with notes of blackberry and oak. Excellent structure and long finish.'
    WHEN 'Chardonnay Estate' THEN 'Bright acidity with citrus and tropical fruit notes. Well-balanced with subtle oak.'
    WHEN 'Pinot Noir Classic' THEN 'Light to medium body with cherry and earth notes. Smooth tannins and elegant finish.'
  END,
  CASE w.name
    WHEN 'Cabernet Sauvignon Reserve' THEN 'Perfect with grilled ribeye steak'
    WHEN 'Chardonnay Estate' THEN 'Great with seafood and light pasta dishes'
    WHEN 'Pinot Noir Classic' THEN 'Excellent with salmon and mushroom dishes'
  END,
  CURRENT_DATE - INTERVAL '30 days'
FROM public.profiles p
CROSS JOIN public.wines w  
WHERE p.username = 'testuser'
  AND w.name IN ('Cabernet Sauvignon Reserve', 'Chardonnay Estate', 'Pinot Noir Classic')
ON CONFLICT DO NOTHING;