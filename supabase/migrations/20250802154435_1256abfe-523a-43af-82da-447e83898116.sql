-- Check the actual constraints on meeting_headers
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'meeting_headers' 
    AND tc.table_schema = 'public'
    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
GROUP BY tc.constraint_name, tc.constraint_type;