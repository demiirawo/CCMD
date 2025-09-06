-- Create storage bucket for base attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('base-attachments', 'base-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for base attachments
CREATE POLICY "Users can view base attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'base-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload base attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'base-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update base attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'base-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete base attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'base-attachments' AND auth.uid() IS NOT NULL);