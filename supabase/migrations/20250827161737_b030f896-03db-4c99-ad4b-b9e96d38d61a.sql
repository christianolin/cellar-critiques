-- Insert wine data using existing producers
INSERT INTO public.wine_database (name, producer_id, wine_type, country_id, region_id, appellation_id, alcohol_content, description) VALUES

-- French wines using existing producers
('Château Margaux 2010', (SELECT id FROM producers WHERE name = 'Château Margaux'), 'red', (SELECT id FROM countries WHERE name = 'France'), (SELECT id FROM regions WHERE name = 'Bordeaux'), (SELECT id FROM appellations WHERE name = 'Margaux'), 13.0, 'First Growth Bordeaux with unparalleled elegance'),
('Château d''Yquem 2001', (SELECT id FROM producers WHERE name = 'Château d''Yquem'), 'dessert', (SELECT id FROM countries WHERE name = 'France'), (SELECT id FROM regions WHERE name = 'Bordeaux'), (SELECT id FROM appellations WHERE name = 'Sauternes'), 14.0, 'The king of dessert wines with honeyed complexity'),
('Dom Pérignon Vintage', (SELECT id FROM producers WHERE name = 'Dom Pérignon'), 'sparkling', (SELECT id FROM countries WHERE name = 'France'), (SELECT id FROM regions WHERE name = 'Champagne'), (SELECT id FROM appellations WHERE name = 'Champagne'), 12.5, 'Prestige cuvée champagne with exceptional finesse'),
('Côte-Rôtie La Mouline', (SELECT id FROM producers WHERE name = 'E. Guigal'), 'red', (SELECT id FROM countries WHERE name = 'France'), (SELECT id FROM regions WHERE name = 'Rhône Valley'), (SELECT id FROM appellations WHERE name = 'Côte-Rôtie'), 13.5, 'Single vineyard Syrah with violet aromatics'),
('Sancerre Les Baronnes', (SELECT id FROM producers WHERE name = 'Henri Bourgeois'), 'white', (SELECT id FROM countries WHERE name = 'France'), (SELECT id FROM regions WHERE name = 'Loire Valley'), (SELECT id FROM appellations WHERE name = 'Sancerre'), 13.0, 'Pure Loire Sauvignon Blanc with mineral precision'),
('Chablis Premier Cru Montmains', (SELECT id FROM producers WHERE name = 'Louis Michel & Fils'), 'white', (SELECT id FROM countries WHERE name = 'France'), (SELECT id FROM regions WHERE name = 'Burgundy'), (SELECT id FROM appellations WHERE name = 'Chablis Premier Cru'), 12.5, 'Classic Chablis with steely minerality'),
('Châteauneuf-du-Pape Vieux Mas', (SELECT id FROM producers WHERE name = 'Domaine du Vieux Télégraphe'), 'red', (SELECT id FROM countries WHERE name = 'France'), (SELECT id FROM regions WHERE name = 'Rhône Valley'), (SELECT id FROM appellations WHERE name = 'Châteauneuf-du-Pape'), 14.5, 'Traditional Southern Rhône blend with power and elegance'),
('Champagne Brut Réserve', (SELECT id FROM producers WHERE name = 'Pol Roger'), 'sparkling', (SELECT id FROM countries WHERE name = 'France'), (SELECT id FROM regions WHERE name = 'Champagne'), (SELECT id FROM appellations WHERE name = 'Champagne'), 12.0, 'Classic champagne house style with consistent quality'),
('Puligny-Montrachet', (SELECT id FROM producers WHERE name = 'Olivier Leflaive'), 'white', (SELECT id FROM countries WHERE name = 'France'), (SELECT id FROM regions WHERE name = 'Burgundy'), (SELECT id FROM appellations WHERE name = 'Puligny-Montrachet'), 13.0, 'Burgundian Chardonnay with elegance and complexity'),
('Muscadet Sèvre-et-Maine', (SELECT id FROM producers WHERE name = 'Domaine de l''Ecu'), 'white', (SELECT id FROM countries WHERE name = 'France'), (SELECT id FROM regions WHERE name = 'Loire Valley'), (SELECT id FROM appellations WHERE name = 'Muscadet'), 12.0, 'Crisp Loire white wine with saline minerality'),

-- Add some wines from other countries using available producers
('Barolo Cannubi', (SELECT id FROM producers WHERE name = 'Marchesi di Barolo'), 'red', (SELECT id FROM countries WHERE name = 'Italy'), (SELECT id FROM regions WHERE name = 'Piedmont'), (SELECT id FROM appellations WHERE name = 'Barolo'), 14.0, 'King of wines from the prestigious Cannubi vineyard'),
('Brunello di Montalcino', (SELECT id FROM producers WHERE name = 'Biondi-Santi'), 'red', (SELECT id FROM countries WHERE name = 'Italy'), (SELECT id FROM regions WHERE name = 'Tuscany'), (SELECT id FROM appellations WHERE name = 'Brunello di Montalcino'), 14.5, 'Noble Sangiovese with exceptional aging potential'),
('Amarone della Valpolicella', (SELECT id FROM producers WHERE name = 'Giuseppe Quintarelli'), 'red', (SELECT id FROM countries WHERE name = 'Italy'), (SELECT id FROM regions WHERE name = 'Veneto'), (SELECT id FROM appellations WHERE name = 'Amarone della Valpolicella'), 16.0, 'Rich wine from dried grapes'),
('Prosecco di Valdobbiadene', (SELECT id FROM producers WHERE name = 'Bisol'), 'sparkling', (SELECT id FROM countries WHERE name = 'Italy'), (SELECT id FROM regions WHERE name = 'Veneto'), (SELECT id FROM appellations WHERE name = 'Prosecco di Valdobbiadene'), 11.0, 'Premium Italian sparkling wine'),

-- Spanish wines
('Único', (SELECT id FROM producers WHERE name = 'Vega Sicilia'), 'red', (SELECT id FROM countries WHERE name = 'Spain'), (SELECT id FROM regions WHERE name = 'Castilla y León'), (SELECT id FROM appellations WHERE name = 'Ribera del Duero'), 14.0, 'Spain''s most prestigious red wine'),
('Viña Tondonia', (SELECT id FROM producers WHERE name = 'López de Heredia'), 'red', (SELECT id FROM countries WHERE name = 'Spain'), (SELECT id FROM regions WHERE name = 'La Rioja'), (SELECT id FROM appellations WHERE name = 'Rioja'), 13.5, 'Traditional Rioja with extended aging'),

-- German wines
('Riesling Kabinett', (SELECT id FROM producers WHERE name = 'Dr. Loosen'), 'white', (SELECT id FROM countries WHERE name = 'Germany'), (SELECT id FROM regions WHERE name = 'Mosel'), (SELECT id FROM appellations WHERE name = 'Mosel'), 8.5, 'Delicate Riesling with perfect balance'),
('Eiswein', (SELECT id FROM producers WHERE name = 'Inniskillin'), 'dessert', (SELECT id FROM countries WHERE name = 'Germany'), (SELECT id FROM regions WHERE name = 'Rheinhessen'), (SELECT id FROM appellations WHERE name = 'Rheinhessen'), 11.0, 'Concentrated dessert wine from frozen grapes'),

-- Australian wines
('Penfolds Grange', (SELECT id FROM producers WHERE name = 'Penfolds'), 'red', (SELECT id FROM countries WHERE name = 'Australia'), (SELECT id FROM regions WHERE name = 'Barossa Valley'), (SELECT id FROM appellations WHERE name = 'Barossa Valley'), 14.5, 'Australia''s most iconic wine'),
('Tyrrell''s Vat 1 Semillon', (SELECT id FROM producers WHERE name = 'Tyrrell''s'), 'white', (SELECT id FROM countries WHERE name = 'Australia'), (SELECT id FROM regions WHERE name = 'Hunter Valley'), (SELECT id FROM appellations WHERE name = 'Hunter Valley'), 11.0, 'Unique Australian Semillon'),

-- New Zealand wines
('Cloudy Bay Sauvignon Blanc', (SELECT id FROM producers WHERE name = 'Cloudy Bay'), 'white', (SELECT id FROM countries WHERE name = 'New Zealand'), (SELECT id FROM regions WHERE name = 'Marlborough'), (SELECT id FROM appellations WHERE name = 'Marlborough'), 13.0, 'Iconic New Zealand Sauvignon Blanc'),

-- American wines
('Screaming Eagle Cabernet', (SELECT id FROM producers WHERE name = 'Screaming Eagle'), 'red', (SELECT id FROM countries WHERE name = 'United States'), (SELECT id FROM regions WHERE name = 'Napa Valley'), (SELECT id FROM appellations WHERE name = 'Napa Valley'), 15.0, 'Cult Napa Cabernet with incredible concentration'),
('Williams Selyem Pinot Noir', (SELECT id FROM producers WHERE name = 'Williams Selyem'), 'red', (SELECT id FROM countries WHERE name = 'United States'), (SELECT id FROM regions WHERE name = 'Sonoma County'), (SELECT id FROM appellations WHERE name = 'Russian River Valley'), 14.0, 'Elegant Pinot Noir from cool climate'),

-- Chilean wines
('Almaviva', (SELECT id FROM producers WHERE name = 'Viña Almaviva'), 'red', (SELECT id FROM countries WHERE name = 'Chile'), (SELECT id FROM regions WHERE name = 'Central Valley'), (SELECT id FROM appellations WHERE name = 'Maipo Valley'), 14.5, 'Premium Chilean Cabernet Sauvignon'),

-- Argentine wines
('Catena Zapata Malbec', (SELECT id FROM producers WHERE name = 'Catena Zapata'), 'red', (SELECT id FROM countries WHERE name = 'Argentina'), (SELECT id FROM regions WHERE name = 'Mendoza'), (SELECT id FROM appellations WHERE name = 'Mendoza'), 14.0, 'Flagship Argentine Malbec from high altitude');