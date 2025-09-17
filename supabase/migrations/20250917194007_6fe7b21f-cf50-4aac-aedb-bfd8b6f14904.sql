-- Remove the base-attachments storage bucket since BASE functionality has been removed
DELETE FROM storage.buckets WHERE id = 'base-attachments';