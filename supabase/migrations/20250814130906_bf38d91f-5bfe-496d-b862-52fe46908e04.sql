-- Update all existing companies to use dark navy theme color
UPDATE companies 
SET theme_color = '#1e293b' 
WHERE theme_color = '#3b82f6' OR theme_color = '#000000';