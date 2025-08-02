-- Check all constraints on meeting_headers including indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'meeting_headers' 
AND schemaname = 'public';

-- Also check constraints
SELECT 
    con.conname as constraint_name,
    con.contype as constraint_type,
    pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'meeting_headers'
AND nsp.nspname = 'public';