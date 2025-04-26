-- Ensure all users have confirmed emails
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Set default for new users to have confirmed emails
ALTER TABLE auth.users
ALTER COLUMN email_confirmed_at
SET DEFAULT NOW();

-- Ensure all users have a profile in the public.users table
INSERT INTO public.users (id, email, full_name, role, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', SPLIT_PART(email, '@', 1)) as full_name,
  'buyer' as role,
  COALESCE(created_at, NOW()) as created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;