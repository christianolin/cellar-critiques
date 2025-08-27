-- Allow updating wines by authenticated users
DROP POLICY IF EXISTS "Authenticated users can update wines" ON public.wines;
CREATE POLICY "Authenticated users can update wines"
ON public.wines
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create table for grape composition per wine
CREATE TABLE IF NOT EXISTS public.wine_grape_composition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_id uuid NOT NULL REFERENCES public.wines(id) ON DELETE CASCADE,
  grape_variety_id uuid NOT NULL REFERENCES public.grape_varieties(id),
  percentage integer NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wine_id, grape_variety_id)
);

-- RLS for composition
ALTER TABLE public.wine_grape_composition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Composition viewable by everyone"
ON public.wine_grape_composition
FOR SELECT
USING (true);

CREATE POLICY "Authenticated can insert composition"
ON public.wine_grape_composition
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update composition"
ON public.wine_grape_composition
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_wine_grape_composition'
  ) THEN
    CREATE TRIGGER handle_updated_at_wine_grape_composition
    BEFORE UPDATE ON public.wine_grape_composition
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Create table for consumed wines archive
CREATE TABLE IF NOT EXISTS public.wine_consumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wine_id uuid NOT NULL REFERENCES public.wines(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  consumed_at timestamptz NOT NULL DEFAULT now(),
  rating_id uuid NULL REFERENCES public.wine_ratings(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wine_consumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own consumptions"
ON public.wine_consumptions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on consumptions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_wine_consumptions'
  ) THEN
    CREATE TRIGGER handle_updated_at_wine_consumptions
    BEFORE UPDATE ON public.wine_consumptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;