-- Move 4-digit vintages from name into vintage and strip from name
-- Pass 1: extract 1800-2039 years anywhere in the name
WITH candidates AS (
  SELECT id,
         name,
         (regexp_match(name, '\\b(18[0-9]{2}|19[0-9]{2}|20[0-3][0-9])\\b'))[1]::int AS yr
  FROM wine_database
  WHERE name ~ '\\b(18[0-9]{2}|19[0-9]{2}|20[0-3][0-9])\\b'
)
UPDATE wine_database w
SET 
  vintage = COALESCE(w.vintage, c.yr),
  name = trim(regexp_replace(w.name, '\\s*\\b(18[0-9]{2}|19[0-9]{2}|20[0-3][0-9])\\b\\s*', ' ', 'g'))
FROM candidates c
WHERE w.id = c.id;

-- Clean common trailing region/appellation hints and parentheses
UPDATE wine_database
SET name = trim(
  regexp_replace(
    regexp_replace(
      regexp_replace(name, '\\s*\\([^)]*\\)\\s*', ' ', 'g'),
      '\\s*[\\,\\-]\\s*[A-Za-z\\s]+$',
      '',
      'g'
    ),
    '\\s+', ' ', 'g'
  )
)
WHERE TRUE;