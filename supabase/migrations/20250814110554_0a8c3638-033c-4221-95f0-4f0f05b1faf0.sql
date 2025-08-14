-- Update the CQC Checklist panel name to COS Checklist
UPDATE inspection_panels 
SET name = 'COS Checklist' 
WHERE name = 'CQC Checklist';