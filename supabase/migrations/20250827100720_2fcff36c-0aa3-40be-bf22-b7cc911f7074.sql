-- Remove unique constraint to allow multiple ratings per wine per user
ALTER TABLE wine_ratings DROP CONSTRAINT wine_ratings_user_id_wine_id_key;