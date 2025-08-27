-- Grant Owner role to a specific user by email, idempotent
DO $$
DECLARE
  u uuid;
BEGIN
  SELECT id INTO u FROM auth.users WHERE email = 'chrisdahlolin@gmail.com';
  IF u IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (u, 'owner'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;