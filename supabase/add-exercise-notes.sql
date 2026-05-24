alter table public.exercises
add column if not exists notes text not null default '';
