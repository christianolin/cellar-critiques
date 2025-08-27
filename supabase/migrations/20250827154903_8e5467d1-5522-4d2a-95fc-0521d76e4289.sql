-- Create a comprehensive wine database table
CREATE TABLE public.wine_database (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  producer TEXT NOT NULL,
  wine_type TEXT NOT NULL CHECK (wine_type IN ('red', 'white', 'rose', 'sparkling', 'dessert', 'fortified')),
  country TEXT NOT NULL,
  region TEXT,
  appellation TEXT,
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

-- Insert comprehensive wine database
INSERT INTO public.wine_database (name, producer, wine_type, country, region, appellation, alcohol_content, description) VALUES
-- French Wines
('Château Margaux', 'Château Margaux', 'red', 'France', 'Bordeaux', 'Margaux', 13.5, 'Premier Grand Cru Classé, elegant Cabernet Sauvignon blend'),
('Dom Pérignon', 'Dom Pérignon', 'sparkling', 'France', 'Champagne', 'Champagne', 12.5, 'Prestige cuvée Champagne, Chardonnay and Pinot Noir blend'),
('Chablis Premier Cru Les Montmains', 'Louis Michel & Fils', 'white', 'France', 'Burgundy', 'Chablis Premier Cru', 12.5, 'Mineral-driven Chardonnay from premier cru vineyard'),
('Châteauneuf-du-Pape Rouge', 'Domaine du Vieux Télégraphe', 'red', 'France', 'Rhône Valley', 'Châteauneuf-du-Pape', 14.5, 'Traditional Rhône blend, Grenache-based'),
('Sancerre', 'Henri Bourgeois', 'white', 'France', 'Loire Valley', 'Sancerre', 13.0, 'Pure Sauvignon Blanc, mineral and citrus notes'),
('Puligny-Montrachet', 'Olivier Leflaive', 'white', 'France', 'Burgundy', 'Puligny-Montrachet', 13.5, 'Premier white Burgundy, complex Chardonnay'),
('Château d''Yquem', 'Château d''Yquem', 'dessert', 'France', 'Bordeaux', 'Sauternes', 14.0, 'Legendary sweet wine, noble rot Sémillon and Sauvignon Blanc'),
('Côte-Rôtie La Mouline', 'E. Guigal', 'red', 'France', 'Rhône Valley', 'Côte-Rôtie', 13.5, 'Single vineyard Syrah with Viognier'),
('Pol Roger Brut Réserve', 'Pol Roger', 'sparkling', 'France', 'Champagne', 'Champagne', 12.0, 'House style Champagne, balanced and elegant'),
('Muscadet Sèvre-et-Maine', 'Domaine de l''Ecu', 'white', 'France', 'Loire Valley', 'Muscadet', 12.0, 'Crisp seafood wine, sur lie aging'),

-- Italian Wines
('Barolo Brunate', 'Giuseppe Rinaldi', 'red', 'Italy', 'Piedmont', 'Barolo', 14.0, 'Traditional Nebbiolo from prestigious vineyard'),
('Amarone della Valpolicella', 'Allegrini', 'red', 'Italy', 'Veneto', 'Amarone della Valpolicella', 15.5, 'Dried grape wine, rich and powerful'),
('Chianti Classico Riserva', 'Castello di Ama', 'red', 'Italy', 'Tuscany', 'Chianti Classico', 13.5, 'Premium Sangiovese blend with aging'),
('Brunello di Montalcino', 'Biondi-Santi', 'red', 'Italy', 'Tuscany', 'Brunello di Montalcino', 14.0, '100% Sangiovese, long-lived and structured'),
('Soave Classico', 'Pieropan', 'white', 'Italy', 'Veneto', 'Soave Classico', 12.5, 'Garganega-based white, mineral and fresh'),
('Gavi di Gavi', 'La Chiara', 'white', 'Italy', 'Piedmont', 'Gavi', 12.0, 'Cortese grape, crisp and mineral'),
('Franciacorta Brut', 'Ca'' del Bosco', 'sparkling', 'Italy', 'Lombardy', 'Franciacorta', 12.5, 'Italian sparkling wine, Champagne method'),
('Prosecco di Valdobbiadene', 'Nino Franco', 'sparkling', 'Italy', 'Veneto', 'Prosecco di Valdobbiadene', 11.0, 'Premium Prosecco from DOCG zone'),
('Super Tuscan', 'Ornellaia', 'red', 'Italy', 'Tuscany', 'Bolgheri', 14.0, 'Bordeaux blend in Tuscany terroir'),
('Pinot Grigio Alto Adige', 'Elena Walch', 'white', 'Italy', 'Alto Adige', 'Alto Adige', 13.0, 'Alpine Pinot Grigio, fresh and aromatic'),

-- Spanish Wines
('Rioja Gran Reserva', 'La Rioja Alta', 'red', 'Spain', 'Rioja', 'Rioja', 14.0, 'Traditional Tempranillo blend, extended aging'),
('Ribera del Duero', 'Vega Sicilia Único', 'red', 'Spain', 'Castilla y León', 'Ribera del Duero', 14.5, 'Iconic Spanish red, Tinto Fino blend'),
('Albariño Rías Baixas', 'Martín Códax', 'white', 'Spain', 'Galicia', 'Rías Baixas', 12.5, 'Atlantic white wine, fresh and mineral'),
('Priorat', 'Clos Mogador', 'red', 'Spain', 'Catalonia', 'Priorat', 14.5, 'Garnacha and Cariñena blend, mineral terroir'),
('Sherry Fino', 'Tío Pepe', 'fortified', 'Spain', 'Andalusia', 'Jerez', 15.0, 'Dry fortified wine, biological aging'),
('Cava Brut', 'Freixenet', 'sparkling', 'Spain', 'Catalonia', 'Cava', 11.5, 'Traditional method sparkling wine'),
('Verdejo Rueda', 'José Pariente', 'white', 'Spain', 'Castilla y León', 'Rueda', 13.0, 'Indigenous white variety, fresh and herbal'),
('Monastrell Jumilla', 'Casa Castillo', 'red', 'Spain', 'Murcia', 'Jumilla', 14.0, 'Full-bodied red from warm climate'),

-- German Wines
('Riesling Kabinett', 'Dr. Loosen', 'white', 'Germany', 'Mosel', 'Mosel', 8.5, 'Light and delicate Riesling, off-dry'),
('Riesling Spätlese', 'Egon Müller', 'white', 'Germany', 'Mosel', 'Mosel', 8.0, 'Late harvest Riesling, more concentrated'),
('Gewürztraminer', 'Trimbach', 'white', 'Germany', 'Alsace', 'Alsace', 13.5, 'Aromatic white wine, spicy and floral'),
('Pinot Noir Spätburgunder', 'Meyer-Näkel', 'red', 'Germany', 'Ahr', 'Ahr', 13.0, 'German Pinot Noir, elegant and refined'),
('Eiswein', 'Inniskillin', 'dessert', 'Germany', 'Rheingau', 'Rheingau', 11.0, 'Ice wine, concentrated sweetness'),

-- US Wines
('Opus One', 'Opus One Winery', 'red', 'USA', 'California', 'Napa Valley', 14.5, 'Bordeaux-style blend, Mondavi-Rothschild collaboration'),
('Caymus Cabernet Sauvignon', 'Caymus Vineyards', 'red', 'USA', 'California', 'Napa Valley', 14.8, 'Rich and opulent Cabernet Sauvignon'),
('Silver Oak Cabernet Sauvignon', 'Silver Oak Cellars', 'red', 'USA', 'California', 'Napa Valley', 14.4, 'American oak aged Cabernet'),
('Screaming Eagle', 'Screaming Eagle', 'red', 'USA', 'California', 'Napa Valley', 15.0, 'Cult Cabernet Sauvignon, extremely limited'),
('Domaine de la Côte Pinot Noir', 'Domaine de la Côte', 'red', 'USA', 'California', 'Santa Barbara', 13.5, 'Cool climate Pinot Noir'),
('Kosta Browne Pinot Noir', 'Kosta Browne', 'red', 'USA', 'California', 'Sonoma Coast', 14.0, 'Artisanal Pinot Noir producer'),
('Stag''s Leap Artemis', 'Stag''s Leap Wine Cellars', 'red', 'USA', 'California', 'Napa Valley', 13.5, 'Historic Cabernet Sauvignon producer'),
('Chateau Ste. Michelle Riesling', 'Chateau Ste. Michelle', 'white', 'USA', 'Washington', 'Columbia Valley', 12.0, 'Pacific Northwest Riesling'),
('Willamette Valley Pinot Noir', 'Domaine Drouhin', 'red', 'USA', 'Oregon', 'Willamette Valley', 13.0, 'Burgundian-style Pinot Noir'),
('Finger Lakes Riesling', 'Dr. Konstantin Frank', 'white', 'USA', 'New York', 'Finger Lakes', 11.5, 'Cool climate Riesling'),

-- Australian Wines
('Penfolds Grange', 'Penfolds', 'red', 'Australia', 'South Australia', 'Barossa Valley', 14.5, 'Iconic Australian Shiraz, multi-regional blend'),
('Henschke Hill of Grace', 'Henschke', 'red', 'Australia', 'South Australia', 'Eden Valley', 14.0, 'Single vineyard Shiraz, old vines'),
('Leeuwin Estate Chardonnay', 'Leeuwin Estate', 'white', 'Australia', 'Western Australia', 'Margaret River', 13.5, 'Premium Australian Chardonnay'),
('Tyrrell''s Vat 1 Semillon', 'Tyrrell''s', 'white', 'Australia', 'New South Wales', 'Hunter Valley', 10.5, 'Aged Semillon, unique style'),
('Moss Wood Cabernet Sauvignon', 'Moss Wood', 'red', 'Australia', 'Western Australia', 'Margaret River', 14.0, 'Bordeaux-style blend'),
('Clarendon Hills Astralis Syrah', 'Clarendon Hills', 'red', 'Australia', 'South Australia', 'McLaren Vale', 15.0, 'Single vineyard Syrah'),

-- New Zealand Wines
('Cloudy Bay Sauvignon Blanc', 'Cloudy Bay', 'white', 'New Zealand', 'South Island', 'Marlborough', 13.0, 'Iconic New Zealand Sauvignon Blanc'),
('Felton Road Pinot Noir', 'Felton Road', 'red', 'New Zealand', 'South Island', 'Central Otago', 13.5, 'Premium Pinot Noir from Central Otago'),
('Villa Maria Sauvignon Blanc', 'Villa Maria', 'white', 'New Zealand', 'South Island', 'Marlborough', 12.5, 'Classic Marlborough Sauvignon Blanc'),
('Ata Rangi Pinot Noir', 'Ata Rangi', 'red', 'New Zealand', 'North Island', 'Martinborough', 13.0, 'Pioneering Pinot Noir producer'),

-- Chilean Wines
('Almaviva', 'Almaviva', 'red', 'Chile', 'Central Valley', 'Puente Alto', 14.5, 'Bordeaux blend, Rothschild partnership'),
('Concha y Toro Don Melchor', 'Concha y Toro', 'red', 'Chile', 'Central Valley', 'Maipo Valley', 14.0, 'Premium Cabernet Sauvignon'),
('Santa Rita Casa Real', 'Santa Rita', 'red', 'Chile', 'Central Valley', 'Maipo Valley', 13.5, 'Old vine Cabernet Sauvignon'),

-- Argentinian Wines
('Catena Zapata Malbec', 'Catena Zapata', 'red', 'Argentina', 'Mendoza', 'Mendoza', 14.5, 'High altitude Malbec, Argentine flagship'),
('Cheval des Andes', 'Cheval des Andes', 'red', 'Argentina', 'Mendoza', 'Mendoza', 14.0, 'French-Argentine collaboration'),
('Achaval Ferrer Malbec', 'Achaval Ferrer', 'red', 'Argentina', 'Mendoza', 'Mendoza', 14.5, 'Single vineyard Malbec expressions'),

-- South African Wines
('Klein Constantia Vin de Constance', 'Klein Constantia', 'dessert', 'South Africa', 'Western Cape', 'Constantia', 14.0, 'Historic dessert wine, Muscat de Frontignan'),
('Kanonkop Paul Sauer', 'Kanonkop', 'red', 'South Africa', 'Western Cape', 'Stellenbosch', 14.5, 'Bordeaux blend from Stellenbosch'),

-- Portuguese Wines
('Quinta do Noval Vintage Port', 'Quinta do Noval', 'fortified', 'Portugal', 'Douro', 'Porto', 20.0, 'Traditional vintage Port wine'),
('Vinha do Contador', 'Anselmo Mendes', 'white', 'Portugal', 'Minho', 'Vinho Verde', 11.5, 'Premium Vinho Verde, Alvarinho grape');