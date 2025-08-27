-- Remove all generated wine data
DELETE FROM wine_database;

-- Reset the sequences if needed
-- Note: We'll repopulate with real wine data from scraping