create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text not null,
  coins integer not null default 1000 check (coins >= 0),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  drop constraint if exists profiles_username_key;

alter table public.profiles enable row level security;

drop policy if exists "Public leaderboard can read profiles" on public.profiles;
create policy "Public leaderboard can read profiles"
  on public.profiles for select
  using (true);

drop policy if exists "Players can create their own profile" on public.profiles;
create policy "Players can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Players can update their own profile" on public.profiles;
create policy "Players can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
