-- ==============================================================================
-- TutorFlow 2.0: Truncate All Data (Clean Slate While Keeping Users & Schema)
-- Run this in the Supabase SQL Editor to reset test data without dropping tables.
-- ==============================================================================

-- 1. Truncate all live session and whiteboard activity
truncate table public.lesson_messages restart identity cascade;
truncate table public.whiteboard_actions restart identity cascade;
truncate table public.tutoring_sessions restart identity cascade;

-- 2. Truncate AI memories and mistake logs
truncate table public.ai_mistake_logs restart identity cascade;
truncate table public.ai_learner_memories restart identity cascade;
truncate table public.weaknesses restart identity cascade;

-- 3. Truncate student learner model and mastery scores
truncate table public.student_learner_model restart identity cascade;
truncate table public.skill_mastery restart identity cascade;

-- 4. Truncate diagnostic submissions
truncate table public.diagnostic_questions restart identity cascade;
truncate table public.diagnostic_assessments restart identity cascade;

-- 5. Truncate flashcards and generated materials
truncate table public.revision_flashcards restart identity cascade;
truncate table public.learning_materials restart identity cascade;
truncate table public.confidence_snapshots restart identity cascade;
truncate table public.learning_style_profiles restart identity cascade;


update public.profiles
set learning_goals = '{}',
    preferred_teaching_style = 'step_by_step',
     learning_pace = 'normal';
