-- Create wine_vintages table for vintage-specific metadata
CREATE TABLE IF NOT EXISTS public.wine_vintages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_database_id UUID NOT NULL REFERENCES public.wine_database(id) ON DELETE CASCADE,
  vintage INTEGER NOT NULL CHECK (vintage BETWEEN 1800 AND 2100),
  alcohol_content NUMERIC(4,1),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wine_database_id, vintage)
);

-- Create wine_vintage_grapes table for vintage-specific grape compositions
CREATE TABLE IF NOT EXISTS public.wine_vintage_grapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_vintage_id UUID NOT NULL REFERENCES public.wine_vintages(id) ON DELETE CASCADE,
  grape_variety_id UUID NOT NULL REFERENCES public.grape_varieties(id),
  percentage INTEGER NULL CHECK (percentage IS NULL OR (percentage BETWEEN 0 AND 100)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wine_vintage_id, grape_variety_id)
);

-- Enable RLS on new tables
ALTER TABLE public.wine_vintages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wine_vintage_grapes ENABLE ROW LEVEL SECURITY;

-- Create policies for wine_vintages
CREATE POLICY "Wine vintages are viewable by everyone" 
ON public.wine_vintages 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own wine vintages" 
ON public.wine_vintages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own wine vintages" 
ON public.wine_vintages 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete their own wine vintages" 
ON public.wine_vintages 
FOR DELETE 
USING (true);

-- Create policies for wine_vintage_grapes
CREATE POLICY "Wine vintage grapes are viewable by everyone" 
ON public.wine_vintage_grapes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own wine vintage grapes" 
ON public.wine_vintage_grapes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own wine vintage grapes" 
ON public.wine_vintage_grapes 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete their own wine vintage grapes" 
ON public.wine_vintage_grapes 
FOR DELETE 
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_wine_vintages_updated_at
BEFORE UPDATE ON public.wine_vintages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_wine_vintage_grapes_updated_at
BEFORE UPDATE ON public.wine_vintage_grapes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add wine_vintage_id to wine_cellar if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wine_cellar' AND column_name = 'wine_vintage_id') THEN
    ALTER TABLE public.wine_cellar ADD COLUMN wine_vintage_id UUID REFERENCES public.wine_vintages(id);
  END IF;
END $$;

-- Add wine_vintage_id to wine_ratings if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wine_ratings' AND column_name = 'wine_vintage_id') THEN
    ALTER TABLE public.wine_ratings ADD COLUMN wine_vintage_id UUID REFERENCES public.wine_vintages(id);
  END IF;
END $$;

-- Add wine_vintage_id to wine_consumptions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wine_consumptions' AND column_name = 'wine_vintage_id') THEN
    ALTER TABLE public.wine_consumptions ADD COLUMN wine_vintage_id UUID REFERENCES public.wine_vintages(id);
  END IF;
END $$;
