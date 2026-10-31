-- Shiny Dex: online copy of the statuses, read publicly (showcase page) and
-- written only by the owner's account. Applied once in the Supabase SQL editor.

-- Accounts allowed to change statuses. Filled by hand with the owner's user id
-- (Authentication > Users); no policy, so the API cannot read or change it.
create table public.editors (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.editors enable row level security;

create table public.shiny_statuses (
  entry_id text primary key check (entry_id ~ '^[a-z0-9-]+$'),
  status text not null check (status in ('obtained', 'to-farm', 'locked')),
  -- When the change was made, on the device that made it. Decides which
  -- change wins when two devices edit the same entry (last write wins).
  updated_at timestamptz not null,
  -- When the server stored the row. Devices pull "everything stored since my
  -- last pull" with it, which stays correct even if device clocks differ.
  synced_at timestamptz not null default now()
);
alter table public.shiny_statuses enable row level security;
create index shiny_statuses_synced_at_idx on public.shiny_statuses (synced_at);

-- Security definer so policies can consult public.editors, which has no policy.
create function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.editors where user_id = auth.uid());
$$;

create policy "Statuses are public"
  on public.shiny_statuses for select
  to anon, authenticated
  using (true);

create policy "Editors can add statuses"
  on public.shiny_statuses for insert
  to authenticated
  with check ((select public.is_editor()));

create policy "Editors can change statuses"
  on public.shiny_statuses for update
  to authenticated
  using ((select public.is_editor()))
  with check ((select public.is_editor()));

-- Stores a batch of changes in one request. A change replaces the stored row
-- only if it is more recent, so replaying an old change is harmless.
-- Security invoker: the policies above still decide who may write.
create function public.push_statuses(changes jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  applied integer;
begin
  insert into public.shiny_statuses as stored (entry_id, status, updated_at, synced_at)
  select change ->> 'entry_id', change ->> 'status', (change ->> 'updated_at')::timestamptz, now()
  from jsonb_array_elements(changes) as change
  on conflict (entry_id) do update
    set status = excluded.status,
        updated_at = excluded.updated_at,
        synced_at = now()
    where stored.updated_at < excluded.updated_at;
  get diagnostics applied = row_count;
  return applied;
end;
$$;

revoke execute on function public.push_statuses (jsonb) from public, anon;
grant execute on function public.push_statuses (jsonb) to authenticated;
