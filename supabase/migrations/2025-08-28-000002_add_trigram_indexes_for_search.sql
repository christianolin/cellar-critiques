-- Enable trigram extension for fast ILIKE searches
create extension if not exists pg_trgm;

-- Producers: speed up name ILIKE queries
create index if not exists idx_producers_name_trgm on public.producers using gin (lower(name) gin_trgm_ops);

-- Countries: name search
create index if not exists idx_countries_name_trgm on public.countries using gin (lower(name) gin_trgm_ops);

-- Regions: name search
create index if not exists idx_regions_name_trgm on public.regions using gin (lower(name) gin_trgm_ops);

-- Appellations: name search
create index if not exists idx_appellations_name_trgm on public.appellations using gin (lower(name) gin_trgm_ops);

-- Wine database: name search
create index if not exists idx_wine_database_name_trgm on public.wine_database using gin (lower(name) gin_trgm_ops);

