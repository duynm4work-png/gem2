-- Run once in Supabase SQL Editor. Never expose service_role to the browser.
create table if not exists public.game_rooms (
 code text primary key,
 version bigint not null default 0,
 state jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.game_rooms enable row level security;
revoke all on public.game_rooms from anon, authenticated;
grant all on public.game_rooms to service_role;
create or replace function public.game_insert(p_code text,p_state jsonb)
returns boolean language plpgsql security invoker set search_path=public as $$
begin
 insert into game_rooms(code,state) values(p_code,p_state) on conflict do nothing;
 return found;
end;$$;
create or replace function public.game_cas(p_code text,p_version bigint,p_state jsonb)
returns boolean language plpgsql security invoker set search_path=public as $$
begin
 update game_rooms set state=p_state,version=version+1 where code=p_code and version=p_version;
 return found;
end;$$;
revoke all on function public.game_insert(text,jsonb) from public, anon, authenticated;
revoke all on function public.game_cas(text,bigint,jsonb) from public, anon, authenticated;
grant execute on function public.game_insert(text,jsonb) to service_role;
grant execute on function public.game_cas(text,bigint,jsonb) to service_role;
