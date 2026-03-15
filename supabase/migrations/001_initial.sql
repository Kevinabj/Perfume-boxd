-- =========================================================================
-- Perfumisto — initial schema
-- =========================================================================

-- 1. Profiles
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text unique not null,
  display_name text,
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view any profile"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. Collections
create table public.collections (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  fragrance_id text not null,
  added_at     timestamptz not null default now(),
  unique (user_id, fragrance_id)
);

alter table public.collections enable row level security;

create policy "Users can view own collection"
  on public.collections for select
  using (auth.uid() = user_id);

create policy "Users can insert into own collection"
  on public.collections for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from own collection"
  on public.collections for delete
  using (auth.uid() = user_id);


-- 3. Wishlists
create table public.wishlists (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  fragrance_id text not null,
  added_at     timestamptz not null default now(),
  unique (user_id, fragrance_id)
);

alter table public.wishlists enable row level security;

create policy "Users can view own wishlist"
  on public.wishlists for select
  using (auth.uid() = user_id);

create policy "Users can insert into own wishlist"
  on public.wishlists for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from own wishlist"
  on public.wishlists for delete
  using (auth.uid() = user_id);


-- 4. Wearing log
create table public.wearing_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  fragrance_id text not null,
  worn_at      timestamptz not null default now(),
  note         text,
  unique (user_id, fragrance_id, worn_at)
);

alter table public.wearing_log enable row level security;

create policy "Users can view own wearing log"
  on public.wearing_log for select
  using (auth.uid() = user_id);

create policy "Users can insert into own wearing log"
  on public.wearing_log for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wearing log"
  on public.wearing_log for update
  using (auth.uid() = user_id);

create policy "Users can delete from own wearing log"
  on public.wearing_log for delete
  using (auth.uid() = user_id);


-- 5. Reviews
create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  fragrance_id text not null,
  rating       numeric(2,1) not null check (rating >= 0.5 and rating <= 5),
  body         text,
  created_at   timestamptz not null default now(),
  unique (user_id, fragrance_id)
);

alter table public.reviews enable row level security;

create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

create policy "Users can insert own review"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own review"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete own review"
  on public.reviews for delete
  using (auth.uid() = user_id);
