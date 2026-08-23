-- Run this in your Supabase SQL editor to set up the database

-- 1. PROFILES (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key,
  clerk_id text constraint profiles_clerk_id_unique unique,
  display_name text not null,
  avatar_url text,
  is_anonymous boolean not null default true,
  pseudonym_id text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.jwt()->>'sub' = clerk_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.jwt()->>'sub' = clerk_id);

-- 1b. CLERK AUTH HELPER
create or replace function public.clerk_profile_id()
returns uuid
language sql
stable
as $$
  select id from public.profiles where clerk_id = auth.jwt()->>'sub'
$$;

-- 2. LISTINGS
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  price numeric(10,2) not null,
  negotiable boolean not null default false,
  category text not null check (category in ('physical_resale','handmade_creative','services','digital')),
  condition text check (condition in ('new','like_new','good','fair','poor')),
  payment_method text not null default 'UPI / Cash',
  images text[] not null default '{}',
  is_anonymous boolean not null default true,
  is_sample boolean not null default false,
  status text not null default 'active' check (status in ('active','sold','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings enable row level security;

create policy "Anyone can view active listings"
  on public.listings for select
  using (status = 'active' or seller_id = public.clerk_profile_id());

create policy "Authenticated users can create listings"
  on public.listings for insert
  with check (seller_id = public.clerk_profile_id());

create policy "Sellers can update their own listings"
  on public.listings for update
  using (seller_id = public.clerk_profile_id());

create policy "Sellers can delete their own listings"
  on public.listings for delete
  using (seller_id = public.clerk_profile_id());

-- 2b. NEGOTIABLE FLAG (migration — safe to re-run on an existing database;
-- the create table above already includes this column for fresh setups)
alter table public.listings add column if not exists negotiable boolean not null default false;

-- 3. CONVERSATIONS
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz default now(),
  created_at timestamptz not null default now(),
  unique(listing_id, buyer_id, seller_id)
);

alter table public.conversations enable row level security;

create policy "Participants can view conversations"
  on public.conversations for select
  using (buyer_id = public.clerk_profile_id() or seller_id = public.clerk_profile_id());

create policy "Participants can create conversations"
  on public.conversations for insert
  with check (buyer_id = public.clerk_profile_id());

-- 4. MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where id = messages.conversation_id
      and (buyer_id = public.clerk_profile_id() or seller_id = public.clerk_profile_id())
    )
  );

create policy "Participants can insert messages"
  on public.messages for insert
  with check (
    sender_id = public.clerk_profile_id() and
    exists (
      select 1 from public.conversations
      where id = messages.conversation_id
      and (buyer_id = public.clerk_profile_id() or seller_id = public.clerk_profile_id())
    )
  );

create policy "Participants can mark messages as read"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations
      where id = messages.conversation_id
      and (buyer_id = public.clerk_profile_id() or seller_id = public.clerk_profile_id())
    )
  );

-- 5. REVIEWS
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  content text not null,
  created_at timestamptz not null default now(),
  unique(listing_id, reviewer_id)
);

alter table public.reviews enable row level security;

create policy "Reviews are viewable by authenticated users"
  on public.reviews for select
  using (auth.role() = 'authenticated');

create policy "Buyers can create reviews"
  on public.reviews for insert
  with check (reviewer_id = public.clerk_profile_id());

-- 6. STORAGE BUCKET for listing images
insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "Public can view listing images"
  on storage.objects for select
  using (bucket_id = 'listing-images');

create policy "Authenticated users can upload listing images"
  on storage.objects for insert
  with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');

create policy "Sellers can delete their own images"
  on storage.objects for delete
  using (bucket_id = 'listing-images' and auth.role() = 'authenticated');

-- 7. AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, pseudonym_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'Student#' || upper(substr(md5(new.id::text), 1, 4))
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
