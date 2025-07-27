-- Fix the handle_new_user function to set search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'username',
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'user')
  );
  RETURN NEW;
END;
$$;