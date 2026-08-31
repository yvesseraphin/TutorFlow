-- ==============================================================================
-- TutorFlow 2.0: Update Curriculum Grade Levels & Truncate All User Data
-- 1. Updates curriculum_nodes from 'Senior 1' -> 'Grade 8' (and Senior 2/3 -> Grade 9/10).
-- 2. Completely clears all user accounts, profiles, sessions, and progress.
-- 3. Preserves curriculum_nodes so the curriculum knowledge graph stays intact.
--
-- Run this directly in the Supabase SQL Editor.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. UPDATE CURRICULUM NODES TO STANDARD GRADE LEVELS
-- ------------------------------------------------------------------------------
update public.curriculum_nodes 
set grade_level = 'Grade 8' 
where grade_level in ('Senior 1', 'S1', '8th Grade', 'senior 1');

update public.curriculum_nodes 
set grade_level = 'Grade 9' 
where grade_level in ('Senior 2', 'S2', '9th Grade', 'senior 2');

update public.curriculum_nodes 
set grade_level = 'Grade 10' 
where grade_level in ('Senior 3', 'S3', '10th Grade', 'senior 3');

-- Re-upsert default curriculum with 'Grade 8', 'Grade 9', 'Grade 10'
insert into public.curriculum_nodes (id, subject, grade_level, topic_title, category, summary, difficulty_tier, prerequisites, core_concepts, standard_order)
values
  ('math_integers', 'Mathematics', 'Grade 8', 'Integers & Negative Numbers', 'Number Sense', 'Operations with positive and negative integers, absolute values, and number line modeling.', 1, '{}', '{"addition", "subtraction", "multiplication", "division", "number line"}', 1),
  ('math_fractions_decimals', 'Mathematics', 'Grade 8', 'Fractions, Decimals & Percentages', 'Number Sense', 'Converting and calculating with fractions, decimals, and percentage proportions.', 1, '{"math_integers"}', '{"fractions", "decimals", "percentages", "proportions"}', 2),
  ('math_order_of_operations', 'Mathematics', 'Grade 8', 'Order of Operations (PEMDAS)', 'Pre-Algebra', 'Evaluating complex arithmetic expressions following standard precedence rules.', 1, '{"math_integers"}', '{"parentheses", "exponents", "multiplication", "division", "addition", "subtraction"}', 3),
  ('math_algebraic_expressions', 'Mathematics', 'Grade 8', 'Algebraic Expressions & Like Terms', 'Algebra', 'Combining like terms, variable substitution, and simplifying polynomials.', 2, '{"math_order_of_operations"}', '{"variables", "coefficients", "like terms", "simplification"}', 4),
  ('math_one_step_equations', 'Mathematics', 'Grade 9', 'Solving One-Step Linear Equations', 'Algebra', 'Using inverse operations on balanced equations to isolate variables.', 2, '{"math_algebraic_expressions"}', '{"inverse operations", "addition property", "multiplication property"}', 5),
  ('math_two_step_equations', 'Mathematics', 'Grade 9', 'Solving Two-Step Linear Equations', 'Algebra', 'Systematic two-step methods for solving linear algebraic equations.', 3, '{"math_one_step_equations"}', '{"two-step inverse", "constants", "coefficients"}', 6),
  ('math_multi_step_equations', 'Mathematics', 'Grade 9', 'Multi-Step Equations with Parentheses', 'Algebra', 'Applying the distributive property and combining like terms across equation sides.', 3, '{"math_two_step_equations"}', '{"distributive property", "variables on both sides"}', 7),
  ('math_linear_inequalities', 'Mathematics', 'Grade 9', 'Linear Inequalities & Number Line Graphing', 'Algebra', 'Solving inequalities and representing solution sets on interval number lines.', 3, '{"math_multi_step_equations"}', '{"inequalities", "boundary points", "reversal rule"}', 8),
  ('math_linear_functions_slopes', 'Mathematics', 'Grade 10', 'Linear Functions & Slope-Intercept Form', 'Functions & Coordinate Geometry', 'Understanding slope, y-intercepts, and graphing linear functions y = mx + b.', 4, '{"math_multi_step_equations"}', '{"slope", "y-intercept", "graphing", "rate of change"}', 9),
  ('math_simultaneous_equations', 'Mathematics', 'Grade 10', 'Systems of Linear Equations', 'Algebra', 'Solving systems of two linear equations using substitution and elimination.', 4, '{"math_linear_functions_slopes"}', '{"substitution", "elimination", "intersection points"}', 10),
  ('math_quadratic_equations', 'Mathematics', 'Grade 10', 'Quadratic Equations & Factoring', 'Advanced Algebra', 'Factoring trinomials and applying the quadratic formula to solve non-linear equations.', 5, '{"math_simultaneous_equations"}', '{"factoring", "quadratic formula", "parabolas"}', 11)
on conflict (id) do update set
  grade_level = excluded.grade_level,
  topic_title = excluded.topic_title,
  category = excluded.category,
  summary = excluded.summary,
  difficulty_tier = excluded.difficulty_tier,
  prerequisites = excluded.prerequisites,
  core_concepts = excluded.core_concepts,
  standard_order = excluded.standard_order;

-- ------------------------------------------------------------------------------
-- 2. TRUNCATE ALL APPLICATION & SESSION TABLES
-- ------------------------------------------------------------------------------
truncate table public.learning_materials restart identity cascade;
truncate table public.revision_flashcards restart identity cascade;
truncate table public.ai_learner_memories restart identity cascade;
truncate table public.ai_mistake_logs restart identity cascade;
truncate table public.lesson_messages restart identity cascade;
truncate table public.whiteboard_actions restart identity cascade;
truncate table public.tutoring_sessions restart identity cascade;
truncate table public.diagnostic_questions restart identity cascade;
truncate table public.diagnostic_assessments restart identity cascade;
truncate table public.student_learner_model restart identity cascade;
truncate table public.skill_mastery restart identity cascade;
truncate table public.weaknesses restart identity cascade;
truncate table public.confidence_snapshots restart identity cascade;
truncate table public.learning_style_profiles restart identity cascade;
truncate table public.profiles restart identity cascade;

-- ------------------------------------------------------------------------------
-- 3. DELETE ALL AUTH USERS (CLEAN SLATE)
-- ------------------------------------------------------------------------------
delete from auth.users;
