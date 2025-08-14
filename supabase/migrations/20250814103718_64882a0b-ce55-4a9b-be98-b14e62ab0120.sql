-- Insert COS Compliance panel
INSERT INTO public.inspection_panels (name, rating)
VALUES ('COS Compliance', 'G');

-- Insert categories for COS Compliance panel
INSERT INTO public.inspection_categories (panel_id, name)
SELECT 
  p.id,
  category_name
FROM public.inspection_panels p
CROSS JOIN (
  VALUES 
    ('Recruitment Records'),
    ('Salary & Employment Terms'),
    ('Skills & Qualifications'),
    ('Additional Records')
) AS categories(category_name)
WHERE p.name = 'COS Compliance';