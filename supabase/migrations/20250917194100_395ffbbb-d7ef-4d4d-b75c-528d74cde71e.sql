-- First remove all objects from the base-attachments bucket
DELETE FROM storage.objects WHERE bucket_id = 'base-attachments';

-- Then remove the bucket itself
DELETE FROM storage.buckets WHERE id = 'base-attachments';