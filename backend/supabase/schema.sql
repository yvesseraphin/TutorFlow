-- Run this once in Supabase SQL Editor before starting the API.
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  grade text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tutoring_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.lesson_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.tutoring_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.skill_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill text not null,
  mastery numeric(4,3) not null default 0 check (mastery between 0 and 1),
  attempts integer not null default 0 check (attempts >= 0),
  correct_attempts integer not null default 0 check (correct_attempts >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, skill)
);

create table if not exists public.weaknesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill text not null,
  kind text not null,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  occurrences integer not null default 1 check (occurrences > 0),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, skill, kind)
);

create index if not exists tutoring_sessions_user_created_idx on public.tutoring_sessions(user_id, created_at desc);
create index if not exists lesson_messages_session_created_idx on public.lesson_messages(session_id, created_at);

alter table public.profiles enable row level security;
alter table public.tutoring_sessions enable row level security;
alter table public.lesson_messages enable row level security;
alter table public.skill_mastery enable row level security;
alter table public.weaknesses enable row level security;

create policy "profiles owner access" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "sessions owner access" on public.tutoring_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "messages owner access" on public.lesson_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mastery owner access" on public.skill_mastery for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weaknesses owner access" on public.weaknesses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
