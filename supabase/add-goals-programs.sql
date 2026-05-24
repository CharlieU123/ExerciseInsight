create table if not exists public.fitness_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_type text not null,
  title text not null,
  target text not null default '',
  current text not null default '',
  deadline text not null default '',
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  split_type text not null,
  days_per_week text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.training_programs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_order integer not null default 1,
  exercise text not null,
  muscle_group text not null,
  sets text not null default '',
  reps text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fitness_goals enable row level security;
alter table public.training_programs enable row level security;
alter table public.program_exercises enable row level security;

grant select, insert, update, delete on table public.fitness_goals to authenticated;
grant select, insert, update, delete on table public.training_programs to authenticated;
grant select, insert, update, delete on table public.program_exercises to authenticated;

drop policy if exists "Users can view their own goals" on public.fitness_goals;
drop policy if exists "Users can create their own goals" on public.fitness_goals;
drop policy if exists "Users can update their own goals" on public.fitness_goals;
drop policy if exists "Users can delete their own goals" on public.fitness_goals;
drop policy if exists "Users can view their own programs" on public.training_programs;
drop policy if exists "Users can create their own programs" on public.training_programs;
drop policy if exists "Users can update their own programs" on public.training_programs;
drop policy if exists "Users can delete their own programs" on public.training_programs;
drop policy if exists "Users can view their own program exercises" on public.program_exercises;
drop policy if exists "Users can create their own program exercises" on public.program_exercises;
drop policy if exists "Users can update their own program exercises" on public.program_exercises;
drop policy if exists "Users can delete their own program exercises" on public.program_exercises;

create policy "Users can view their own goals"
on public.fitness_goals
for select
using (auth.uid() = user_id);

create policy "Users can create their own goals"
on public.fitness_goals
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own goals"
on public.fitness_goals
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own goals"
on public.fitness_goals
for delete
using (auth.uid() = user_id);

create policy "Users can view their own programs"
on public.training_programs
for select
using (auth.uid() = user_id);

create policy "Users can create their own programs"
on public.training_programs
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own programs"
on public.training_programs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own programs"
on public.training_programs
for delete
using (auth.uid() = user_id);

create policy "Users can view their own program exercises"
on public.program_exercises
for select
using (auth.uid() = user_id);

create policy "Users can create their own program exercises"
on public.program_exercises
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own program exercises"
on public.program_exercises
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own program exercises"
on public.program_exercises
for delete
using (auth.uid() = user_id);
