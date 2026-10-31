-- Shiny Dex: species released after the bundled data, added from PokéAPI by
-- the owner from within the app. Read publicly (showcase page), written only
-- by accounts listed in public.editors. Applied once in the Supabase SQL editor.

create table public.added_entries (
  entry_id text primary key check (entry_id ~ '^[a-z0-9-]+$'),
  dex integer not null unique check (dex > 0),
  -- Empty until PokéAPI publishes the French name; completed by a later check.
  name_fr text not null default '',
  name_en text not null,
  genus_fr text not null default '',
  generation integer not null check (generation > 0),
  types text[] not null check (cardinality(types) between 1 and 2),
  -- HOME sprites hosted by PokéAPI; null until PokéAPI has them.
  sprite_normal_url text,
  sprite_shiny_url text,
  updated_at timestamptz not null default now()
);
alter table public.added_entries enable row level security;

create policy "Added entries are public"
  on public.added_entries for select
  to anon, authenticated
  using (true);

create policy "Editors can add entries"
  on public.added_entries for insert
  to authenticated
  with check ((select public.is_editor()));

create policy "Editors can complete entries"
  on public.added_entries for update
  to authenticated
  using ((select public.is_editor()))
  with check ((select public.is_editor()));
