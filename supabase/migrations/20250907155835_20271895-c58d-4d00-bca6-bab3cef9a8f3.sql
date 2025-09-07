-- Drop the overly permissive policies and create more specific ones
DROP POLICY "Public can view published tables" ON public.base_tables;
DROP POLICY "Public can view fields of published tables" ON public.base_fields;  
DROP POLICY "Public can view records of published tables" ON public.base_records;

-- Create more specific policies that work with anonymous access
-- For base_tables: Allow public read access (anonymous users have auth.uid() = null)
CREATE POLICY "Anonymous can view any table for embeds" 
ON public.base_tables 
FOR SELECT 
TO anon
USING (true);

-- For base_fields: Allow public read access to fields
CREATE POLICY "Anonymous can view table fields for embeds" 
ON public.base_fields 
FOR SELECT 
TO anon
USING (true);

-- For base_records: Allow public read access to records
CREATE POLICY "Anonymous can view table records for embeds" 
ON public.base_records 
FOR SELECT 
TO anon
USING (true);