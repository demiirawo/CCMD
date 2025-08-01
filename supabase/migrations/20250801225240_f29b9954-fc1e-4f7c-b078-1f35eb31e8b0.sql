
-- Create trigger to handle magic link signups
CREATE TRIGGER on_auth_user_created_magic_link
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_magic_link_signup();
