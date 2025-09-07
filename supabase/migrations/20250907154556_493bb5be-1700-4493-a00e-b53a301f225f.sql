-- Add policy for public access to active shared tables
CREATE POLICY "Public can access active shared tables" 
ON public.shared_tables 
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));