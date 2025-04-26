-- Drop existing function to avoid conflicts
DROP FUNCTION IF EXISTS authenticate_admin(text, text, text);
DROP FUNCTION IF EXISTS authenticate_admin(text, text);

-- Create admin authentication function with proper error handling
CREATE OR REPLACE FUNCTION authenticate_admin(
  input_username text,
  input_password text
) RETURNS json AS $$
DECLARE
  admin_record admin_credentials%ROWTYPE;
  attempt_count integer;
  block_duration interval := interval '15 minutes';
BEGIN
  -- Get admin record
  SELECT * INTO admin_record
  FROM admin_credentials
  WHERE username = input_username;

  -- Check credentials
  IF admin_record.id IS NULL OR 
     admin_record.password_hash != crypt(input_password, admin_record.password_hash) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Geçersiz kullanıcı adı veya şifre'
    );
  END IF;

  -- Update last login
  UPDATE admin_credentials
  SET last_login = now()
  WHERE id = admin_record.id;

  RETURN json_build_object(
    'success', true,
    'admin_id', admin_record.id,
    'username', admin_record.username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to change admin password
CREATE OR REPLACE FUNCTION change_admin_password(
  admin_id uuid,
  current_password text,
  new_password text
) RETURNS json AS $$
DECLARE
  admin_record admin_credentials%ROWTYPE;
BEGIN
  -- Get admin record
  SELECT * INTO admin_record
  FROM admin_credentials
  WHERE id = admin_id;

  -- Verify current password
  IF admin_record.password_hash != crypt(current_password, admin_record.password_hash) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Mevcut şifre yanlış'
    );
  END IF;

  -- Update password
  UPDATE admin_credentials
  SET password_hash = crypt(new_password, gen_salt('bf', 10))
  WHERE id = admin_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Şifre başarıyla güncellendi'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION authenticate_admin TO anon;
GRANT EXECUTE ON FUNCTION change_admin_password TO authenticated;