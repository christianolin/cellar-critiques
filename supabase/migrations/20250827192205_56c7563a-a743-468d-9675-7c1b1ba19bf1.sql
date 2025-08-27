-- More aggressive vintage cleaning from wine names
-- Pass 2: Clean up more patterns with years
UPDATE wine_database 
SET name = trim(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(name, 
          '\\s*\\b(1[89][0-9]{2}|20[0-3][0-9])\\b\\s*', ' ', 'g'),
        '\\s*[\\(\\[]\\s*[1-2][0-9]{3}\\s*[\\)\\]]\\s*', ' ', 'g'),
      '\\s*[,\\-]\\s*[1-2][0-9]{3}\\s*', ' ', 'g'),
    '\\s+', ' ', 'g')
)
WHERE name ~ '\\b(1[89][0-9]{2}|20[0-3][0-9])\\b' OR name ~ '[\\(\\[]\\s*[1-2][0-9]{3}\\s*[\\)\\]]';

-- Clean up common wine name endings that contain regional info
UPDATE wine_database
SET name = trim(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(name,
          '\\s*\\b(AOC|AOP|DOC|DOCG|AVA|IGP|VDP)\\b.*$', '', 'i'),
        '\\s*\\bAppellation\\b.*$', '', 'i'),
      '\\s*[,\\-]\\s*[A-Za-z\\s]{2,}\\s*(Valley|Region|County|Wine|Vineyard|Estate)\\s*$', '', 'i'),
    '\\s+', ' ', 'g')
)
WHERE name ~* '\\b(AOC|AOP|DOC|DOCG|AVA|IGP|VDP|Appellation)\\b' 
   OR name ~* '[,\\-]\\s*[A-Za-z\\s]{2,}\\s*(Valley|Region|County|Wine|Vineyard|Estate)\\s*$';