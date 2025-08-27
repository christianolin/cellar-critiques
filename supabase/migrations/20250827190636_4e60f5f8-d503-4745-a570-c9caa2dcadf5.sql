-- Clean up wine names in wine_database table
-- Move vintage from name to vintage column and remove region/appellation info

-- This function will extract vintages from wine names and clean them up
DO $$
DECLARE
    wine_record RECORD;
    vintage_match TEXT[];
    clean_name TEXT;
    extracted_vintage INTEGER;
BEGIN
    -- Loop through all wines in wine_database
    FOR wine_record IN 
        SELECT id, name 
        FROM wine_database 
        WHERE name IS NOT NULL
    LOOP
        clean_name := wine_record.name;
        extracted_vintage := NULL;
        
        -- Extract 4-digit year (vintage) from name - look for pattern like "2018", "1995", etc.
        vintage_match := regexp_match(clean_name, '\b(19[0-9]{2}|20[0-9]{2})\b');
        IF vintage_match[1] IS NOT NULL THEN
            extracted_vintage := vintage_match[1]::INTEGER;
            -- Remove the vintage from the name
            clean_name := regexp_replace(clean_name, '\s*\b(19[0-9]{2}|20[0-9]{2})\b\s*', ' ', 'g');
        END IF;
        
        -- Remove common region/appellation patterns
        -- Remove patterns like "AOC Something", "DOC Something", "AVA Something"
        clean_name := regexp_replace(clean_name, '\s*(AOC|DOC|AVA|AOP|IGP|VDP)\s+[^,\-\(\)]+', '', 'gi');
        
        -- Remove parenthetical region info like "(Bordeaux)", "(Napa Valley)"
        clean_name := regexp_replace(clean_name, '\s*\([^)]*\)\s*', ' ', 'g');
        
        -- Remove trailing region patterns after comma or dash
        clean_name := regexp_replace(clean_name, '\s*[\,\-]\s*[A-Za-z\s]+$', '', 'g');
        
        -- Clean up extra whitespace
        clean_name := regexp_replace(clean_name, '\s+', ' ', 'g');
        clean_name := trim(clean_name);
        
        -- Update the record if changes were made
        IF clean_name != wine_record.name OR extracted_vintage IS NOT NULL THEN
            UPDATE wine_database 
            SET 
                name = clean_name,
                vintage = COALESCE(vintage, extracted_vintage)
            WHERE id = wine_record.id;
        END IF;
    END LOOP;
END $$;