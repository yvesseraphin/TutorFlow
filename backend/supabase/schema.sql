create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null default '',
  grade           text,
  school          text,
  learning_goals  text[] default '{}',
  bio             text,
  avatar_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.tutoring_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  topic      text not null,
  status     text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  ended_at   timestamptz
);

create table if not exists public.lesson_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.tutoring_sessions(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant', 'system')),
  content    text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.skill_mastery (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  skill            text not null,
  mastery          numeric(4,3) not null default 0 check (mastery between 0 and 1),
  attempts         integer not null default 0 check (attempts >= 0),
  correct_attempts integer not null default 0 check (correct_attempts >= 0),
  updated_at       timestamptz not null default now(),
  unique (user_id, skill)
);

create table if not exists public.weaknesses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  skill       text not null,
  kind        text not null,
  confidence  numeric(4,3) not null check (confidence between 0 and 1),
  occurrences integer not null default 1 check (occurrences > 0),
  resolved    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, skill, kind)
);

create table if not exists public.confidence_snapshots (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  score      numeric(4,3) not null check (score between 0 and 1),
  label      text,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_style_profiles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  style_key  text not null,
  percentage numeric(5,2) not null default 0 check (percentage between 0 and 100),
  updated_at timestamptz not null default now(),
  unique (user_id, style_key)
);

create table if not exists public.learning_materials (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  session_id   uuid references public.tutoring_sessions(id) on delete cascade,
  category     text not null,
  topic        text not null default 'General',
  title        text not null,
  description  text not null default '',
  content_type text not null default 'pdf',
  content_body text,
  metadata     jsonb default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists tutoring_sessions_user_created_idx
  on public.tutoring_sessions(user_id, created_at desc);

create index if not exists lesson_messages_session_created_idx
  on public.lesson_messages(session_id, created_at);

create index if not exists skill_mastery_user_idx
  on public.skill_mastery(user_id);

create index if not exists weaknesses_user_resolved_confidence_idx
  on public.weaknesses(user_id, resolved, confidence desc);

create index if not exists confidence_snapshots_user_created_idx
  on public.confidence_snapshots(user_id, created_at);

create index if not exists learning_materials_user_category_idx
  on public.learning_materials(user_id, category, created_at desc);

alter table public.profiles                enable row level security;
alter table public.tutoring_sessions       enable row level security;
alter table public.lesson_messages         enable row level security;
alter table public.skill_mastery           enable row level security;
alter table public.weaknesses              enable row level security;
alter table public.confidence_snapshots    enable row level security;
alter table public.learning_style_profiles enable row level security;
alter table public.learning_materials      enable row level security;

do $$ begin
  drop policy if exists "profiles owner access"          on public.profiles;
  drop policy if exists "sessions owner access"          on public.tutoring_sessions;
  drop policy if exists "messages owner access"          on public.lesson_messages;
  drop policy if exists "mastery owner access"           on public.skill_mastery;
  drop policy if exists "weaknesses owner access"        on public.weaknesses;
  drop policy if exists "confidence owner access"        on public.confidence_snapshots;
  drop policy if exists "learning style owner access"    on public.learning_style_profiles;
  drop policy if exists "materials owner access"         on public.learning_materials;
end $$;

create policy "profiles owner access"
  on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "sessions owner access"
  on public.tutoring_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "messages owner access"
  on public.lesson_messages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mastery owner access"
  on public.skill_mastery for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "weaknesses owner access"
  on public.weaknesses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "confidence owner access"
  on public.confidence_snapshots for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "learning style owner access"
  on public.learning_style_profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "materials owner access"
  on public.learning_materials for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_weaknesses_updated_at on public.weaknesses;
create trigger set_weaknesses_updated_at
  before update on public.weaknesses
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_mastery_updated_at on public.skill_mastery;
create trigger set_mastery_updated_at
  before update on public.skill_mastery
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_learning_style_updated_at on public.learning_style_profiles;
create trigger set_learning_style_updated_at
  before update on public.learning_style_profiles
  for each row execute procedure public.handle_updated_at();


