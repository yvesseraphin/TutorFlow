-- ==============================================================================
-- TutorFlow 2.0: Complete Database Reset & Recreate Script
-- WARNING: This will drop all TutorFlow tables and recreate the entire schema fresh.
-- Run in the Supabase SQL Editor.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DROP ALL EXISTING TABLES & TRIGGERS (CASCADE)
-- ------------------------------------------------------------------------------
drop table if exists public.learning_materials cascade;
drop table if exists public.revision_flashcards cascade;
drop table if exists public.ai_learner_memories cascade;
drop table if exists public.ai_mistake_logs cascade;
drop table if exists public.lesson_messages cascade;
drop table if exists public.whiteboard_actions cascade;
drop table if exists public.tutoring_sessions cascade;
drop table if exists public.diagnostic_questions cascade;
drop table if exists public.diagnostic_assessments cascade;
drop table if exists public.student_learner_model cascade;
drop table if exists public.curriculum_nodes cascade;
drop table if exists public.skill_mastery cascade;
drop table if exists public.weaknesses cascade;
drop table if exists public.confidence_snapshots cascade;
drop table if exists public.learning_style_profiles cascade;
drop table if exists public.profiles cascade;

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. CREATE PROFILES TABLE (Learner Personas & AI Preferences)
-- ------------------------------------------------------------------------------
create table public.profiles (
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

-- ------------------------------------------------------------------------------
-- 3. CURRICULUM & KNOWLEDGE GRAPH (Prerequisites & Difficulty)
-- ------------------------------------------------------------------------------
create table public.curriculum_nodes (
  id                text primary key,
  subject           text not null default 'Mathematics',
  grade_level       text not null default 'Senior 2',
  topic_title       text not null,
  category          text not null default 'Algebra',
  summary           text not null default '',
  difficulty_tier   integer not null default 2 check (difficulty_tier between 1 and 5),
  prerequisites     text[] default '{}',
  core_concepts     text[] default '{}',
  standard_order    integer not null default 0,
  created_at        timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 4. STUDENT LEARNER MODEL & TOPIC MASTERY (Mastery Tracking)
-- ------------------------------------------------------------------------------
create table public.student_learner_model (
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

create table public.skill_mastery (
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
-- 5. DIAGNOSTIC ASSESSMENTS & KNOWLEDGE GAPS
-- ------------------------------------------------------------------------------
create table public.diagnostic_assessments (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  subject                text not null default 'Mathematics',
  target_topic           text,
  status                 text not null default 'completed' check (status in ('in_progress', 'completed', 'abandoned')),
  overall_score          numeric(4,3) not null default 0 check (overall_score between 0 and 1),
  detected_gaps          text[] default '{}',
  missing_prerequisites  text[] default '{}',
  recommendations        jsonb default '[]'::jsonb,
  evaluation_summary     text not null default '',
  created_at             timestamptz not null default now()
);

create table public.diagnostic_questions (
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
-- 6. TUTORING SESSIONS & CONVERSATION MESSAGES
-- ------------------------------------------------------------------------------
create table public.tutoring_sessions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  topic                text not null,
  subject              text not null default 'Mathematics',
  grade_level          text,
  status               text not null default 'active' check (status in ('active', 'completed', 'paused')),
  teaching_strategy    text not null default 'step_by_step',
  lesson_plan          jsonb default '{}'::jsonb,
  current_step_index   integer not null default 0,
  understanding_state  text not null default 'evaluating' check (understanding_state in ('evaluating', 'mastered', 'confused', 'gap_detected', 'advancing')),
  session_duration_sec integer not null default 0,
  ai_summary           text,
  created_at           timestamptz not null default now(),
  ended_at             timestamptz
);

create table public.whiteboard_actions (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.tutoring_sessions(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  action_type      text not null check (action_type in ('draw', 'write_math', 'highlight', 'arrow', 'clear', 'hint', 'diagram')),
  payload          jsonb not null default '{}'::jsonb,
  timestamp_offset numeric(8,2) not null default 0.0,
  created_at       timestamptz not null default now()
);

create table public.lesson_messages (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references public.tutoring_sessions(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,
  role               text not null check (role in ('user', 'assistant', 'system')),
  content            text not null,
  audio_url          text,
  whiteboard_event   jsonb,
  evaluation_metric  jsonb,
  created_at         timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 7. AI MISTAKE LOGS & PERSISTENT MEMORIES
-- ------------------------------------------------------------------------------
create table public.ai_mistake_logs (
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

create table public.weaknesses (
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

create table public.ai_learner_memories (
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
-- 8. REVISION FLASHCARDS & GENERATED MATERIALS
-- ------------------------------------------------------------------------------
create table public.revision_flashcards (
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

create table public.learning_materials (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  session_id   uuid references public.tutoring_sessions(id) on delete cascade,
  category     text not null,
  topic        text not null default 'General',
  title        text not null,
  description  text not null default '',
  content_type text not null default 'markdown',
  content_body text,
  metadata     jsonb default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create table public.confidence_snapshots (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  score      numeric(4,3) not null check (score between 0 and 1),
  label      text,
  created_at timestamptz not null default now()
);

create table public.learning_style_profiles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  style_key  text not null,
  percentage numeric(5,2) not null default 0 check (percentage between 0 and 100),
  updated_at timestamptz not null default now(),
  unique (user_id, style_key)
);

-- ------------------------------------------------------------------------------
-- 9. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
create index idx_tutoring_sessions_user_created on public.tutoring_sessions(user_id, created_at desc);
create index idx_lesson_messages_session_created on public.lesson_messages(session_id, created_at asc);
create index idx_whiteboard_actions_session_ts on public.whiteboard_actions(session_id, timestamp_offset asc);
create index idx_student_learner_model_user on public.student_learner_model(user_id, topic_id);
create index idx_ai_mistake_logs_user_unresolved on public.ai_mistake_logs(user_id, resolved, topic);
create index idx_ai_learner_memories_user on public.ai_learner_memories(user_id, topic);
create index idx_flashcards_user_review on public.revision_flashcards(user_id, next_review_at);
create index idx_diagnostic_assessments_user on public.diagnostic_assessments(user_id, created_at desc);

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
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

-- Public read for curriculum nodes
create policy "curriculum public read" on public.curriculum_nodes for select using (true);

-- User-scoped policies
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
create policy "skills owner access" on public.skill_mastery for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weaknesses owner access" on public.weaknesses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "confidence owner access" on public.confidence_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "learning_style owner access" on public.learning_style_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 11. UPDATED_AT TRIGGER FUNCTION
-- ------------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger set_student_learner_model_updated_at before update on public.student_learner_model for each row execute procedure public.handle_updated_at();
create trigger set_ai_mistake_logs_updated_at before update on public.ai_mistake_logs for each row execute procedure public.handle_updated_at();
create trigger set_ai_learner_memories_updated_at before update on public.ai_learner_memories for each row execute procedure public.handle_updated_at();
create trigger set_revision_flashcards_updated_at before update on public.revision_flashcards for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 12. SEED DEFAULT CURRICULUM NODES (Mathematics S1-S3 Knowledge Graph)
-- ------------------------------------------------------------------------------
insert into public.curriculum_nodes (id, subject, grade_level, topic_title, category, summary, difficulty_tier, prerequisites, core_concepts, standard_order)
values
  ('math_integers', 'Mathematics', 'Senior 1', 'Integers & Negative Numbers', 'Number Sense', 'Operations with positive and negative integers, absolute values, and number line modeling.', 1, '{}', '{"addition", "subtraction", "multiplication", "division", "number line"}', 1),
  ('math_fractions_decimals', 'Mathematics', 'Senior 1', 'Fractions, Decimals & Percentages', 'Number Sense', 'Converting and calculating with fractions, decimals, and percentage proportions.', 1, '{"math_integers"}', '{"fractions", "decimals", "percentages", "proportions"}', 2),
  ('math_order_of_operations', 'Mathematics', 'Senior 1', 'Order of Operations (PEMDAS)', 'Pre-Algebra', 'Evaluating complex arithmetic expressions following standard precedence rules.', 1, '{"math_integers"}', '{"parentheses", "exponents", "multiplication", "division", "addition", "subtraction"}', 3),
  ('math_algebraic_expressions', 'Mathematics', 'Senior 1', 'Algebraic Expressions & Like Terms', 'Algebra', 'Combining like terms, variable substitution, and simplifying polynomials.', 2, '{"math_order_of_operations"}', '{"variables", "coefficients", "like terms", "simplification"}', 4),
  ('math_one_step_equations', 'Mathematics', 'Senior 2', 'Solving One-Step Linear Equations', 'Algebra', 'Using inverse operations on balanced equations to isolate variables.', 2, '{"math_algebraic_expressions"}', '{"inverse operations", "addition property", "multiplication property"}', 5),
  ('math_two_step_equations', 'Mathematics', 'Senior 2', 'Solving Two-Step Linear Equations', 'Algebra', 'Systematic two-step methods for solving linear algebraic equations.', 3, '{"math_one_step_equations"}', '{"two-step inverse", "constants", "coefficients"}', 6),
  ('math_multi_step_equations', 'Mathematics', 'Senior 2', 'Multi-Step Equations with Parentheses', 'Algebra', 'Applying the distributive property and combining like terms across equation sides.', 3, '{"math_two_step_equations"}', '{"distributive property", "variables on both sides"}', 7),
  ('math_linear_inequalities', 'Mathematics', 'Senior 2', 'Linear Inequalities & Number Line Graphing', 'Algebra', 'Solving inequalities and representing solution sets on interval number lines.', 3, '{"math_multi_step_equations"}', '{"inequalities", "boundary points", "reversal rule"}', 8),
  ('math_linear_functions_slopes', 'Mathematics', 'Senior 3', 'Linear Functions & Slope-Intercept Form', 'Functions & Coordinate Geometry', 'Understanding slope, y-intercepts, and graphing linear functions y = mx + b.', 4, '{"math_multi_step_equations"}', '{"slope", "y-intercept", "graphing", "rate of change"}', 9),
  ('math_simultaneous_equations', 'Mathematics', 'Senior 3', 'Systems of Linear Equations', 'Algebra', 'Solving systems of two linear equations using substitution and elimination.', 4, '{"math_linear_functions_slopes"}', '{"substitution", "elimination", "intersection points"}', 10),
  ('math_quadratic_equations', 'Mathematics', 'Senior 3', 'Quadratic Equations & Factoring', 'Advanced Algebra', 'Factoring trinomials and applying the quadratic formula to solve non-linear equations.', 5, '{"math_simultaneous_equations"}', '{"factoring", "quadratic formula", "parabolas"}', 11)
on conflict (id) do update set
  topic_title = excluded.topic_title,
  category = excluded.category,
  summary = excluded.summary,
  difficulty_tier = excluded.difficulty_tier,
  prerequisites = excluded.prerequisites,
  core_concepts = excluded.core_concepts,
  standard_order = excluded.standard_order;
