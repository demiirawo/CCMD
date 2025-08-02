-- Create storage bucket for meeting documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meeting-documents', 'meeting-documents', false);

-- Create policies for meeting documents
CREATE POLICY "Users can view their company meeting documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'meeting-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload their company meeting documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'meeting-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their company meeting documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'meeting-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their company meeting documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'meeting-documents' AND auth.uid() IS NOT NULL);

-- Add document_url column to meetings table to store uploaded document links
ALTER TABLE meetings ADD COLUMN document_url TEXT;