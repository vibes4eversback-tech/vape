create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('mini','abuse','countdown','background','dismiss','announcement')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists site_events_created_at_idx on public.site_events (created_at desc);
alter table public.site_events enable row level security;
revoke all on public.site_events from anon, authenticated;
grant select on public.site_events to anon, authenticated;
drop policy if exists "Visitors can read active site events" on public.site_events;
create policy "Visitors can read active site events"
  on public.site_events for select to anon, authenticated
  using (expires_at is null or expires_at > now());

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='site_events'
  ) then
    alter publication supabase_realtime add table public.site_events;
  end if;
end $$;
