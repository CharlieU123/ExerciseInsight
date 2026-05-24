create table if not exists public.program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.training_programs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_order integer not null default 1,
  name text not null default '',
  is_rest_day boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.program_exercises
add column if not exists program_day_id uuid references public.program_days(id) on delete cascade;

alter table public.program_days enable row level security;

grant select, insert, update, delete on table public.program_days to authenticated;

drop policy if exists "Users can view their own program days" on public.program_days;
drop policy if exists "Users can create their own program days" on public.program_days;
drop policy if exists "Users can update their own program days" on public.program_days;
drop policy if exists "Users can delete their own program days" on public.program_days;
drop policy if exists "Shared users can view shared program days" on public.program_days;

create policy "Users can view their own program days"
on public.program_days
for select
using (auth.uid() = user_id);

create policy "Users can create their own program days"
on public.program_days
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own program days"
on public.program_days
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own program days"
on public.program_days
for delete
using (auth.uid() = user_id);

create policy "Shared users can view shared program days"
on public.program_days
for select
using (
  exists (
    select 1
    from public.program_shares
    where program_shares.program_id = program_days.program_id
      and lower(program_shares.shared_with_email) =
        lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);
