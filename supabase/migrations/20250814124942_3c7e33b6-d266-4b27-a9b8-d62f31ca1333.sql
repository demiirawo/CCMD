-- Update all existing companies with blue theme color to use black
UPDATE companies 
SET theme_color = '#000000' 
WHERE theme_color = '#3b82f6';