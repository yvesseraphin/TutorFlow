-- ==============================================================================
-- TutorFlow 2.0 Standalone Migration Script: Existing DB -> AI-First Architecture
-- Run this in your Supabase SQL Editor if you already have existing tables!
-- ==============================================================================

create extension if not exists "pgcrypto";

-- 1. Upgrade profiles table with AI teaching persona & learning preferences
alter table public.profiles add column if not exists curriculum text default 'General / National';
alter table public.profiles add column if not exists preferred_teaching_style text default 'step_by_step';
alter table public.profiles add column if not exists learning_pace text default 'normal';
alter table public.profiles add column if not exists voice_preference text default 'Aoede';
alter table public.profiles add column if not exists language_preference text default 'en';

-- 2. Upgrade tutoring_sessions table with dynamic lesson plans and understanding states
alter table public.tutoring_sessions add column if not exists subject text not null default 'Mathematics';
alter table public.tutoring_sessions add column if not exists grade_level text;
alter table public.tutoring_sessions add column if not exists teaching_strategy text not null default 'step_by_step';
alter table public.tutoring_sessions add column if not exists lesson_plan jsonb default '{}'::jsonb;
alter table public.tutoring_sessions add column if not exists current_step_index integer not null default 0;
alter table public.tutoring_sessions add column if not exists understanding_state text not null default 'evaluating';
alter table public.tutoring_sessions add column if not exists session_duration_sec integer not null default 0;
alter table public.tutoring_sessions add column if not exists ai_summary text;

-- 3. Upgrade lesson_messages table with multimodal payload fields
alter table public.lesson_messages add column if not exists audio_url text;
alter table public.lesson_messages add column if not exists whiteboard_event jsonb;
alter table public.lesson_messages add column if not exists evaluation_metric jsonb;

-- 4. Create Curriculum Knowledge Graph
create table if not exists public.curriculum_nodes (
  id                text primary key,
  subject           text not null,
  grade_level       text not null,
  topic_title       text not null,
  category          text not null default 'Algebra',
  summary           text not null default '',
  difficulty_tier   integer not null default 2 check (difficulty_tier between 1 and 5),
  prerequisites     text[] default '{}',
  core_concepts     text[] default '{}',
  standard_order    integer not null default 0,
  created_at        timestamptz not null default now()
);

-- 5. Create Evolving Student Learner Model
create table if not exists public.student_learner_model (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  topic_id              text not null,
  mastery_score         numeric(4,3) not null default 0.000 check (mastery_score between 0 and 1),
  confidence_score      numeric(4,3) not null default 0.500 check (confidence_score between 0 and 1),
  retention_stability   numeric(4,3) not null default 1.000,
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

-- 6. Create Diagnostic Assessments & Question Breakdown
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

-- 7. Create Whiteboard Synchronization Table
create table if not exists public.whiteboard_actions (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.tutoring_sessions(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  action_type      text not null check (action_type in ('draw', 'write_math', 'highlight', 'arrow', 'clear', 'hint', 'diagram')),
  payload          jsonb not null default '{}'::jsonb,
  timestamp_offset numeric(8,2) not null default 0.0,
  created_at       timestamptz not null default now()
);

-- 8. Create AI Misconception Diagnosis & Mistake Log
create table if not exists public.ai_mistake_logs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  session_id         uuid references public.tutoring_sessions(id) on delete set null,
  topic              text not null,
  subtopic           text,
  problem_context    text not null,
  student_response   text not null,
  correct_response   text not null,
  misconception_type text not null,
  root_cause         text not null,
  ai_intervention    text,
  occurrences        integer not null default 1,
  resolved           boolean not null default false,
  resolved_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 9. Create AI Long-Term Learner Memories (Teacher Memory)
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

-- 10. Create Spaced Revision Flashcards
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

-- 11. Create Performance Indexes
create index if not exists idx_tutoring_sessions_user_created on public.tutoring_sessions(user_id, created_at desc);
create index if not exists idx_lesson_messages_session_created on public.lesson_messages(session_id, created_at asc);
create index if not exists idx_whiteboard_actions_session_ts on public.whiteboard_actions(session_id, timestamp_offset asc);
create index if not exists idx_student_learner_model_user on public.student_learner_model(user_id, topic_id);
create index if not exists idx_ai_mistake_logs_user_unresolved on public.ai_mistake_logs(user_id, resolved, topic);
create index if not exists idx_ai_learner_memories_user on public.ai_learner_memories(user_id, topic);
create index if not exists idx_flashcards_user_review on public.revision_flashcards(user_id, next_review_at);
create index if not exists idx_diagnostic_assessments_user on public.diagnostic_assessments(user_id, created_at desc);

-- 12. Enable RLS and Add Policies
alter table public.curriculum_nodes        enable row level security;
alter table public.student_learner_model   enable row level security;
alter table public.diagnostic_assessments  enable row level security;
alter table public.diagnostic_questions    enable row level security;
alter table public.whiteboard_actions      enable row level security;
alter table public.ai_mistake_logs         enable row level security;
alter table public.ai_learner_memories     enable row level security;
alter table public.revision_flashcards     enable row level security;

do $$ begin
  drop policy if exists "curriculum public read" on public.curriculum_nodes;
  drop policy if exists "learner_model owner access" on public.student_learner_model;
  drop policy if exists "diagnostics owner access" on public.diagnostic_assessments;
  drop policy if exists "whiteboard owner access" on public.whiteboard_actions;
  drop policy if exists "mistakes owner access" on public.ai_mistake_logs;
  drop policy if exists "memories owner access" on public.ai_learner_memories;
  drop policy if exists "flashcards owner access" on public.revision_flashcards;
end $$;

create policy "curriculum public read" on public.curriculum_nodes for select using (true);
create policy "learner_model owner access" on public.student_learner_model for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "diagnostics owner access" on public.diagnostic_assessments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "whiteboard owner access" on public.whiteboard_actions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mistakes owner access" on public.ai_mistake_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memories owner access" on public.ai_learner_memories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "flashcards owner access" on public.revision_flashcards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
