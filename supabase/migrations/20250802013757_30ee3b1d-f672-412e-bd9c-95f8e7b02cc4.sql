-- Fix security warnings by setting proper search_path in functions

-- Update generate_slug function with proper search_path
CREATE OR REPLACE FUNCTION generate_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(trim(input_text), '[^a-zA-Z0-9\s]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$;

-- Update set_company_slug function with proper search_path
CREATE OR REPLACE FUNCTION set_company_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Generate base slug from name
  base_slug := generate_slug(NEW.name);
  final_slug := base_slug;
  
  -- Check for duplicates and append counter if needed
  WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;