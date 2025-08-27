-- Allow updating wines by authenticated users
DROP POLICY IF EXISTS "Authenticated users can update wines" ON public.wines;
CREATE POLICY "Authenticated users can update wines"
ON public.wines
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

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

DROP POLICY IF EXISTS "Users manage their own consumptions" ON public.wine_consumptions;
CREATE POLICY "Users manage their own consumptions"
ON public.wine_consumptions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);