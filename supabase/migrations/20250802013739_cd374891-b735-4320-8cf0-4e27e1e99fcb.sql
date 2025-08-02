-- Add slug column to companies table for clean URLs
ALTER TABLE public.companies 
ADD COLUMN slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX companies_slug_unique ON public.companies (slug);

-- Create function to generate slug from company name
CREATE OR REPLACE FUNCTION generate_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
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

-- Generate slugs for existing companies
UPDATE public.companies 
SET slug = generate_slug(name) || '-' || substring(id::text, 1, 8)
WHERE slug IS NULL;

-- Create trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION set_company_slug()
RETURNS trigger
LANGUAGE plpgsql
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

CREATE TRIGGER set_company_slug_trigger
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION set_company_slug();