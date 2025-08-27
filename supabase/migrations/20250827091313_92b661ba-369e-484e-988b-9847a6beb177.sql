-- 1) Create roles enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'user');

-- 2) Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 3) Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4) has_role helper function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
$$;

-- 5) Seed owner/admin/user roles on new signups
CREATE OR REPLACE FUNCTION public.handle_new_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- everyone becomes a regular user by default
  INSERT INTO public.user_roles(user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  -- make the specified email the owner
  IF NEW.email = 'chrisdahlolin@gmail.com' THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (NEW.id, 'owner')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 6) Create trigger to assign roles on auth.users insert
CREATE TRIGGER on_auth_user_created_roles
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_roles();

-- 7) RLS policies for user_roles
-- Users can see their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins and Owners can view all roles
CREATE POLICY "Admins and Owners can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Only Owners can modify roles
CREATE POLICY "Only Owners can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Only Owners can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Only Owners can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'owner'));

-- 8) Allow Admins and Owners to modify master data tables
-- Countries
CREATE POLICY "Admins and Owners can insert countries"
ON public.countries
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins and Owners can update countries"
ON public.countries
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins and Owners can delete countries"
ON public.countries
FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Regions
CREATE POLICY "Admins and Owners can insert regions"
ON public.regions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins and Owners can update regions"
ON public.regions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins and Owners can delete regions"
ON public.regions
FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Appellations
CREATE POLICY "Admins and Owners can insert appellations"
ON public.appellations
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins and Owners can update appellations"
ON public.appellations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins and Owners can delete appellations"
ON public.appellations
FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Grape varieties
CREATE POLICY "Admins and Owners can insert grape varieties"
ON public.grape_varieties
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins and Owners can update grape varieties"
ON public.grape_varieties
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins and Owners can delete grape varieties"
ON public.grape_varieties
FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
