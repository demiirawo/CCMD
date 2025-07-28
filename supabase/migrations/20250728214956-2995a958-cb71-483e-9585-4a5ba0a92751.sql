-- Fix security warning: Set search_path for existing functions
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.get_user_company_id() SET search_path = 'public';
ALTER FUNCTION public.is_admin() SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.update_subsection_data_updated_at() SET search_path = 'public';