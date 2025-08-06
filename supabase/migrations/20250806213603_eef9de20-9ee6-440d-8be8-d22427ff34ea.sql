-- Rename CARING panel to SAFE
UPDATE inspection_panels 
SET name = 'SAFE' 
WHERE name = 'CARING';