-- Rename SAFE panel back to CARING
UPDATE inspection_panels 
SET name = 'CARING' 
WHERE name = 'SAFE';