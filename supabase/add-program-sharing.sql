create table if not exists public.program_shares (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.training_programs(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  shared_with_email text not null,
  permission text not null default 'view' check (permission in ('view', 'edit')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.program_shares enable row level security;

grant select, insert, update, delete on table public.program_shares to authenticated;

drop policy if exists "Program owners can manage shares" on public.program_shares;
drop policy if exists "Shared users can view shares sent to them" on public.program_shares;
drop policy if exists "Shared users can view shared programs" on public.training_programs;
drop policy if exists "Shared users can view shared program exercises" on public.program_exercises;

create policy "Program owners can manage shares"
on public.program_shares
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Shared users can view shares sent to them"
on public.program_shares
for select
using (
  lower(shared_with_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "Shared users can view shared programs"
on public.training_programs
for select
using (
  exists (
    select 1
    from public.program_shares
    where program_shares.program_id = training_programs.id
      and lower(program_shares.shared_with_email) =
        lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

create policy "Shared users can view shared program exercises"
on public.program_exercises
for select
using (
  exists (
    select 1
    from public.program_shares
    where program_shares.program_id = program_exercises.program_id
      and lower(program_shares.shared_with_email) =
        lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);
