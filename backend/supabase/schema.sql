-- ==============================================================================
-- TutorFlow 2.0 Database Schema & Migration Script
-- Comprehensive AI-First Personalized Teacher Architecture
-- ==============================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Extended for AI Learner Profile & Persona)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  full_name               text not null default '',
  grade                   text,
  curriculum              text default 'General / National',
  school                  text,
  learning_goals          text[] default '{}',
  bio                     text,
  avatar_url              text,
  preferred_teaching_style text default 'step_by_step' check (preferred_teaching_style in ('step_by_step', 'socratic', 'visual', 'direct', 'analogy_based', 'practice_based')),
  learning_pace           text default 'normal' check (learning_pace in ('slow', 'normal', 'fast')),
  voice_preference        text default 'Aoede',
  language_preference     text default 'en',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Ensure newly added columns exist if table already existed
alter table public.profiles add column if not exists curriculum text default 'General / National';
alter table public.profiles add column if not exists preferred_teaching_style text default 'step_by_step';
alter table public.profiles add column if not exists learning_pace text default 'normal';
alter table public.profiles add column if not exists voice_preference text default 'Aoede';
alter table public.profiles add column if not exists language_preference text default 'en';

-- ------------------------------------------------------------------------------
-- 2. CURRICULUM & KNOWLEDGE GRAPH (Subjects, Topics, Prerequisites)
-- ------------------------------------------------------------------------------
create table if not exists public.curriculum_nodes (
  id                text primary key, -- e.g. 'math_s2_linear_equations'
  subject           text not null,    -- e.g. 'Mathematics'
  grade_level       text not null,    -- e.g. 'Senior 2'
  topic_title       text not null,    -- e.g. 'Linear Equations in One Variable'
  category          text not null default 'Algebra',
  summary           text not null default '',
  difficulty_tier   integer not null default 2 check (difficulty_tier between 1 and 5),
  prerequisites     text[] default '{}', -- array of node IDs
  core_concepts     text[] default '{}',
  standard_order    integer not null default 0,
  created_at        timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 3. STUDENT LEARNER MODEL & TOPIC MASTERY
-- ------------------------------------------------------------------------------
create table if not exists public.student_learner_model (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  topic_id              text not null, -- references curriculum_nodes(id) or topic name
  mastery_score         numeric(4,3) not null default 0.000 check (mastery_score between 0 and 1),
  confidence_score      numeric(4,3) not null default 0.500 check (confidence_score between 0 and 1),
  retention_stability   numeric(4,3) not null default 1.000, -- Spaced repetition forgetting curve index
  status                text not null default 'not_started' check (status in ('not_started', 'in_progress', 'needs_reinforcement', 'mastered')),
  total_time_seconds    integer not null default 0 check (total_time_seconds >= 0),
  attempts_count        integer not null default 0 check (attempts_count >= 0),
  correct_count         integer not null default 0 check (correct_count >= 0),
  last_practiced_at     timestamptz,
  next_review_due_at    timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id, topic_id)
);

-- Legacy compatibility table (retained & indexed)
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

-- ------------------------------------------------------------------------------
-- 4. DIAGNOSTIC ASSESSMENTS & KNOWLEDGE GAP DETECTIONS
-- ------------------------------------------------------------------------------
create table if not exists public.diagnostic_assessments (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  subject                text not null,
  target_topic           text,
  status                 text not null default 'completed' check (status in ('in_progress', 'completed', 'abandoned')),
  overall_score          numeric(4,3) not null default 0 check (overall_score between 0 and 1),
  detected_gaps          text[] default '{}',
  missing_prerequisites  text[] default '{}',
  recommendations        jsonb default '[]'::jsonb,
  evaluation_summary     text not null default '',
  created_at             timestamptz not null default now()
);

create table if not exists public.diagnostic_questions (
  id                     uuid primary key default gen_random_uuid(),
  assessment_id          uuid not null references public.diagnostic_assessments(id) on delete cascade,
  question_text          text not null,
  topic_tested           text not null,
  prerequisite_skill     text,
  difficulty             integer not null default 1 check (difficulty between 1 and 5),
  student_answer         text,
  is_correct             boolean not null default false,
  misconception_type     text,
  ai_analysis            text,
  created_at             timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 5. TUTORING SESSIONS & DYNAMIC LESSON PLANS
-- ------------------------------------------------------------------------------
create table if not exists public.tutoring_sessions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  topic                text not null,
  subject              text not null default 'Mathematics',
  grade_level          text,
  status               text not null default 'active' check (status in ('active', 'completed', 'paused')),
  teaching_strategy    text not null default 'step_by_step',
  lesson_plan          jsonb default '{}'::jsonb, -- dynamic multi-step teaching plan
  current_step_index   integer not null default 0,
  understanding_state  text not null default 'evaluating' check (understanding_state in ('evaluating', 'mastered', 'confused', 'gap_detected', 'advancing')),
  session_duration_sec integer not null default 0,
  ai_summary           text,
  created_at           timestamptz not null default now(),
  ended_at             timestamptz
);

-- Ensure newly added columns exist if table already existed
alter table public.tutoring_sessions add column if not exists subject text not null default 'Mathematics';
alter table public.tutoring_sessions add column if not exists grade_level text;
alter table public.tutoring_sessions add column if not exists teaching_strategy text not null default 'step_by_step';
alter table public.tutoring_sessions add column if not exists lesson_plan jsonb default '{}'::jsonb;
alter table public.tutoring_sessions add column if not exists current_step_index integer not null default 0;
alter table public.tutoring_sessions add column if not exists understanding_state text not null default 'evaluating';
alter table public.tutoring_sessions add column if not exists session_duration_sec integer not null default 0;
alter table public.tutoring_sessions add column if not exists ai_summary text;

-- ------------------------------------------------------------------------------
-- 6. WHITEBOARD SYNCHRONIZATION & ACTIONS
-- ------------------------------------------------------------------------------
create table if not exists public.whiteboard_actions (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.tutoring_sessions(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  action_type      text not null check (action_type in ('draw', 'write_math', 'highlight', 'arrow', 'clear', 'hint', 'diagram')),
  payload          jsonb not null default '{}'::jsonb, -- coordinates, stroke data, math latex, colors
  timestamp_offset numeric(8,2) not null default 0.0, -- seconds relative to speech sync
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 7. LESSON MESSAGES & MULTIMODAL CONVERSATION LOGS
-- ------------------------------------------------------------------------------
create table if not exists public.lesson_messages (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references public.tutoring_sessions(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,
  role               text not null check (role in ('user', 'assistant', 'system')),
  content            text not null,
  audio_url          text,
  whiteboard_event   jsonb,
  evaluation_metric  jsonb, -- reasoning accuracy, misconception tag
  created_at         timestamptz not null default now()
);

alter table public.lesson_messages add column if not exists audio_url text;
alter table public.lesson_messages add column if not exists whiteboard_event jsonb;
alter table public.lesson_messages add column if not exists evaluation_metric jsonb;

-- ------------------------------------------------------------------------------
-- 8. AI MISTAKE LOGS & MISCONCEPTION DIAGNOSIS
-- ------------------------------------------------------------------------------
create table if not exists public.ai_mistake_logs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  session_id         uuid references public.tutoring_sessions(id) on delete set null,
  topic              text not null,
  subtopic           text,
  problem_context    text not null,
  student_response   text not null,
  correct_response   text not null,
  misconception_type text not null, -- e.g. 'sign_reversal', 'distributive_error', 'prerequisite_gap'
  root_cause         text not null,
  ai_intervention    text,
  occurrences        integer not null default 1,
  resolved           boolean not null default false,
  resolved_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Legacy weaknesses table enhancement
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

-- ------------------------------------------------------------------------------
-- 9. AI LONG-TERM MEMORY & TEACHING REFLECTIONS
-- ------------------------------------------------------------------------------
create table if not exists public.ai_learner_memories (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  memory_type         text not null check (memory_type in ('strength', 'weakness', 'preference', 'breakthrough', 'prerequisite_gap', 'strategy_effectiveness')),
  topic               text not null,
  summary             text not null,
  confidence_rating   numeric(4,3) not null default 0.85,
  source_session_id   uuid references public.tutoring_sessions(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 10. REVISION NOTES, FLASHCARDS & GENERATED MATERIALS
-- ------------------------------------------------------------------------------
create table if not exists public.revision_flashcards (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  session_id          uuid references public.tutoring_sessions(id) on delete set null,
  topic               text not null,
  front_prompt        text not null,
  back_explanation    text not null,
  formula_latex       text,
  interval_days       integer not null default 1,
  repetitions         integer not null default 0,
  ease_factor         numeric(4,2) not null default 2.50,
  next_review_at      timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.learning_materials (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  session_id   uuid references public.tutoring_sessions(id) on delete cascade,
  category     text not null, -- 'notes', 'summary', 'worksheet', 'flashcards'
  topic        text not null default 'General',
  title        text not null,
  description  text not null default '',
  content_type text not null default 'markdown',
  content_body text,
  metadata     jsonb default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 11. CONFIDENCE SNAPSHOTS & LEARNING STYLE PROFILES
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 12. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
create index if not exists idx_tutoring_sessions_user_created on public.tutoring_sessions(user_id, created_at desc);
create index if not exists idx_lesson_messages_session_created on public.lesson_messages(session_id, created_at asc);
create index if not exists idx_whiteboard_actions_session_ts on public.whiteboard_actions(session_id, timestamp_offset asc);
create index if not exists idx_student_learner_model_user on public.student_learner_model(user_id, topic_id);
create index if not exists idx_ai_mistake_logs_user_unresolved on public.ai_mistake_logs(user_id, resolved, topic);
create index if not exists idx_ai_learner_memories_user on public.ai_learner_memories(user_id, topic);
create index if not exists idx_flashcards_user_review on public.revision_flashcards(user_id, next_review_at);
create index if not exists idx_diagnostic_assessments_user on public.diagnostic_assessments(user_id, created_at desc);

-- ------------------------------------------------------------------------------
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
alter table public.profiles                enable row level security;
alter table public.curriculum_nodes        enable row level security;
alter table public.student_learner_model   enable row level security;
alter table public.diagnostic_assessments  enable row level security;
alter table public.diagnostic_questions    enable row level security;
alter table public.tutoring_sessions       enable row level security;
alter table public.whiteboard_actions      enable row level security;
alter table public.lesson_messages         enable row level security;
alter table public.ai_mistake_logs         enable row level security;
alter table public.ai_learner_memories     enable row level security;
alter table public.revision_flashcards     enable row level security;
alter table public.skill_mastery           enable row level security;
alter table public.weaknesses              enable row level security;
alter table public.confidence_snapshots    enable row level security;
alter table public.learning_style_profiles enable row level security;
alter table public.learning_materials      enable row level security;

-- Curriculum nodes are read-only public for all authenticated students
do $$ begin
  drop policy if exists "curriculum public read" on public.curriculum_nodes;
end $$;
create policy "curriculum public read" on public.curriculum_nodes for select using (true);

-- User-scoped policies
do $$ begin
  drop policy if exists "profiles owner access" on public.profiles;
  drop policy if exists "learner_model owner access" on public.student_learner_model;
  drop policy if exists "diagnostics owner access" on public.diagnostic_assessments;
  drop policy if exists "sessions owner access" on public.tutoring_sessions;
  drop policy if exists "whiteboard owner access" on public.whiteboard_actions;
  drop policy if exists "messages owner access" on public.lesson_messages;
  drop policy if exists "mistakes owner access" on public.ai_mistake_logs;
  drop policy if exists "memories owner access" on public.ai_learner_memories;
  drop policy if exists "flashcards owner access" on public.revision_flashcards;
  drop policy if exists "materials owner access" on public.learning_materials;
end $$;

create policy "profiles owner access" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "learner_model owner access" on public.student_learner_model for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "diagnostics owner access" on public.diagnostic_assessments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sessions owner access" on public.tutoring_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "whiteboard owner access" on public.whiteboard_actions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "messages owner access" on public.lesson_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mistakes owner access" on public.ai_mistake_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memories owner access" on public.ai_learner_memories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "flashcards owner access" on public.revision_flashcards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "materials owner access" on public.learning_materials for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 14. UPDATED_AT TRIGGER FUNCTION & ATTACHMENTS
-- ------------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();

drop trigger if exists set_student_learner_model_updated_at on public.student_learner_model;
create trigger set_student_learner_model_updated_at before update on public.student_learner_model for each row execute procedure public.handle_updated_at();

drop trigger if exists set_ai_mistake_logs_updated_at on public.ai_mistake_logs;
create trigger set_ai_mistake_logs_updated_at before update on public.ai_mistake_logs for each row execute procedure public.handle_updated_at();

drop trigger if exists set_ai_learner_memories_updated_at on public.ai_learner_memories;
create trigger set_ai_learner_memories_updated_at before update on public.ai_learner_memories for each row execute procedure public.handle_updated_at();

drop trigger if exists set_revision_flashcards_updated_at on public.revision_flashcards;
create trigger set_revision_flashcards_updated_at before update on public.revision_flashcards for each row execute procedure public.handle_updated_at();
