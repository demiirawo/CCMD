-- Fix inconsistent date formats in last_reviewed field
-- Convert dates like "03 Oct 25" or "06 Sept 25" to "03/10/2025" format

UPDATE public.subsection_data
SET last_reviewed = 
  TO_CHAR(
    TO_DATE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  REGEXP_REPLACE(
                    REGEXP_REPLACE(
                      REGEXP_REPLACE(
                        REGEXP_REPLACE(
                          REGEXP_REPLACE(
                            REGEXP_REPLACE(last_reviewed, 
                              'Sept', 'Sep', 'g'),
                            'Januar', 'Jan', 'g'),
                          'Februar', 'Feb', 'g'),
                        'April', 'Apr', 'g'),
                      'June', 'Jun', 'g'),
                    'July', 'Jul', 'g'),
                  'August', 'Aug', 'g'),
                'September', 'Sep', 'g'),
              'October', 'Oct', 'g'),
            'November', 'Nov', 'g'),
          'December', 'Dec', 'g'),
        'March', 'Mar', 'g'),
      'DD Mon YY'
    ),
    'DD/MM/YYYY'
  )
WHERE last_reviewed IS NOT NULL
  AND last_reviewed !~ '^\d{2}/\d{2}/\d{4}$'  -- Only update non-standard formats
  AND last_reviewed ~ '^\d{1,2}\s+[A-Za-z]+\s+\d{2}$';  -- Match "DD Month YY" pattern