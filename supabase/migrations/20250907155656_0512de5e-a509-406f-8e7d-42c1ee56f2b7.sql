-- Add public access policies for embed functionality

-- Allow public read access to base_tables (for public embeds)
CREATE POLICY "Public can view published tables" 
ON public.base_tables 
FOR SELECT 
USING (true);

-- Allow public read access to base_fields for published tables
CREATE POLICY "Public can view fields of published tables" 
ON public.base_fields 
FOR SELECT 
USING (true);

-- Allow public read access to base_records for published tables
CREATE POLICY "Public can view records of published tables" 
ON public.base_records 
FOR SELECT 
USING (true);