-- Update the COS Compliance panel name to CQC Checklist
UPDATE inspection_panels 
SET name = 'CQC Checklist' 
WHERE name = 'COS Compliance';