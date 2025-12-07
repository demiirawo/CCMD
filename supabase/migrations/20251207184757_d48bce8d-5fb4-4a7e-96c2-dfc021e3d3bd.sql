-- Add manager column to matching_staff table
ALTER TABLE public.matching_staff 
ADD COLUMN IF NOT EXISTS manager text DEFAULT '';

-- Add manager column to matching_service_users table
ALTER TABLE public.matching_service_users 
ADD COLUMN IF NOT EXISTS manager text DEFAULT '';