-- ==============================================================================
-- TutorFlow 3.0 Database Migration: RAG Pipeline & Custom Class Architecture
-- Enables document upload, semantic chunk embeddings, RAG search & persistent classes
-- ==============================================================================

-- 1. Enable Vector Extension (Supabase pgvector)
create extension if not exists vector;
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. UPLOADED DOCUMENTS TABLE
-- Stores metadata & extracted full text for syllabus, notes, textbooks, and homework
-- ------------------------------------------------------------------------------
create table if not exists public.uploaded_documents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  file_name      text not null,
  file_type      text not null default 'text/plain',
  file_size      integer not null default 0 check (file_size >= 0),
  storage_path   text,
  extracted_text text,
  summary        text,
  status         text not null default 'processed' check (status in ('pending', 'processing', 'processed', 'failed')),
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Ensure columns exist if table already exists
alter table public.uploaded_documents add column if not exists storage_path text;
alter table public.uploaded_documents add column if not exists summary text;
alter table public.uploaded_documents add column if not exists metadata jsonb not null default '{}'::jsonb;

-- ------------------------------------------------------------------------------
-- 3. DOCUMENT CHUNKS TABLE (RAG Vector Store)
-- Semantic overlapping chunks indexed with 768-dim Gemini embeddings
-- ------------------------------------------------------------------------------
create table if not exists public.document_chunks (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references public.uploaded_documents(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  chunk_index    integer not null default 0,
  chunk_text     text not null,
  embedding      vector(768), -- Gemini text-embedding-004
  embedding_json jsonb,       -- Fallback array representation for maximum portability
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 4. CUSTOM CLASSES TABLE (AI-Synthesized Personal Classes)
-- Generated automatically from uploaded study materials and saved permanently
-- ------------------------------------------------------------------------------
create table if not exists public.custom_classes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  subject        text not null default 'Mathematics',
  description    text not null default '',
  level          text not null default 'Intermediate',
  document_id    uuid references public.uploaded_documents(id) on delete set null,
  curriculum     jsonb not null default '{}'::jsonb,
  progress       integer not null default 0 check (progress between 0 and 100),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Link tutoring_sessions optionally to custom_classes
alter table public.tutoring_sessions add column if not exists class_id uuid references public.custom_classes(id) on delete set null;
alter table public.tutoring_sessions add column if not exists document_id uuid references public.uploaded_documents(id) on delete set null;

-- ------------------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
create index if not exists idx_uploaded_documents_user on public.uploaded_documents(user_id, created_at desc);
create index if not exists idx_document_chunks_doc on public.document_chunks(document_id, chunk_index asc);
create index if not exists idx_document_chunks_user on public.document_chunks(user_id);
create index if not exists idx_custom_classes_user on public.custom_classes(user_id, created_at desc);

-- Vector IVFFlat / HNSW index for fast nearest neighbor search
do $$
begin
  if exists (select 1 from pg_am where amname = 'hnsw') then
    execute 'create index if not exists idx_document_chunks_vector on public.document_chunks using hnsw (embedding vector_cosine_ops);';
  elsif exists (select 1 from pg_am where amname = 'ivfflat') then
    execute 'create index if not exists idx_document_chunks_vector on public.document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);';
  end if;
exception
  when others then
    raise notice 'Vector index creation skipped or pending data: %', sqlerrm;
end $$;

-- ------------------------------------------------------------------------------
-- 6. SIMILARITY MATCH FUNCTION (RAG Pipeline)
-- Fast cosine similarity search across document chunks with user and document filters
-- ------------------------------------------------------------------------------
create or replace function public.match_document_chunks(
  query_embedding vector(768),
  match_threshold float default 0.35,
  match_count int default 5,
  filter_user_id uuid default null,
  filter_doc_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index int,
  chunk_text text,
  metadata jsonb,
  similarity float
)
language plpgsql
security definer
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.chunk_text,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where (filter_user_id is null or dc.user_id = filter_user_id)
    and (filter_doc_id is null or dc.document_id = filter_doc_id)
    and dc.embedding is not null
    and (1 - (dc.embedding <=> query_embedding)) >= match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Students can strictly only access their own documents, chunks, and custom classes
-- ------------------------------------------------------------------------------
alter table public.uploaded_documents enable row level security;
alter table public.document_chunks    enable row level security;
alter table public.custom_classes     enable row level security;

do $$ begin
  drop policy if exists "uploaded_documents owner access" on public.uploaded_documents;
  drop policy if exists "document_chunks owner access"    on public.document_chunks;
  drop policy if exists "custom_classes owner access"     on public.custom_classes;
end $$;

create policy "uploaded_documents owner access" on public.uploaded_documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "document_chunks owner access" on public.document_chunks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "custom_classes owner access" on public.custom_classes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 8. UPDATED_AT TRIGGERS
-- ------------------------------------------------------------------------------
drop trigger if exists set_uploaded_documents_updated_at on public.uploaded_documents;
create trigger set_uploaded_documents_updated_at
  before update on public.uploaded_documents
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_custom_classes_updated_at on public.custom_classes;
create trigger set_custom_classes_updated_at
  before update on public.custom_classes
  for each row execute procedure public.handle_updated_at();
