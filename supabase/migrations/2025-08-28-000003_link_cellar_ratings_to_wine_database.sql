-- 1) Add wine_database_id columns (nullable for backfill phase)
alter table public.wine_cellar add column if not exists wine_database_id uuid;
alter table public.wine_ratings add column if not exists wine_database_id uuid;

-- 2) Backfill: map existing wines -> wine_database by (name + producer)
--    Assumes producers table has unique names for matching
update public.wine_cellar wc
set wine_database_id = wd.id
from public.wines w
join public.producers p on p.name = w.producer
join public.wine_database wd on wd.name = w.name and wd.producer_id = p.id
where wc.wine_id = w.id and wc.wine_database_id is null;

update public.wine_ratings wr
set wine_database_id = wd.id
from public.wines w
join public.producers p on p.name = w.producer
join public.wine_database wd on wd.name = w.name and wd.producer_id = p.id
where wr.wine_id = w.id and wr.wine_database_id is null;

-- 3) Add FK constraints (deferrable to allow staged backfill in app where needed)
alter table public.wine_cellar
  add constraint wine_cellar_wine_database_id_fkey
  foreign key (wine_database_id) references public.wine_database(id) deferrable initially deferred;

alter table public.wine_ratings
  add constraint wine_ratings_wine_database_id_fkey
  foreign key (wine_database_id) references public.wine_database(id) deferrable initially deferred;

-- 4) Optional: create helper indexes
create index if not exists idx_wine_cellar_wine_database_id on public.wine_cellar(wine_database_id);
create index if not exists idx_wine_ratings_wine_database_id on public.wine_ratings(wine_database_id);

-- NOTE: A later migration can set wine_database_id NOT NULL and drop wine_id FKs
-- after the application has fully switched to using wine_database_id.

