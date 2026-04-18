-- Run in Supabase SQL editor. Links Stripe customers and Pro flag to auth users.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  stripe_customer_id text,
  is_pro boolean not null default false,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Service role (backend) bypasses RLS for webhook updates.
