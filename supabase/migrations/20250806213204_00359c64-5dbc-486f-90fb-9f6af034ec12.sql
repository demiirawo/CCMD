-- Set all existing team members to company_admin permission
UPDATE team_members SET permission = 'company_admin';

-- Update all existing profiles to company_admin permission  
UPDATE profiles SET permission = 'company_admin' WHERE role != 'admin';