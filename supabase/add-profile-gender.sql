alter table public.profiles
add column if not exists gender text not null default '';
