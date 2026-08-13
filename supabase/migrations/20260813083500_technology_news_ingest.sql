-- Technology News V1
-- Tạo bảng ingest RIÊNG. Không sửa cấu trúc news_articles hiện có.
-- Worker chỉ ghi bài vào news_articles ở status='draft'.

create table if not exists public.technology_news_ingest (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null unique,
  source_title text,
  source_published_at text,
  relevance_score integer not null default 0,
  article_id uuid null references public.news_articles(id) on delete set null,
  ai_model text,
  state text not null default 'seen'
    check (state in ('seen','processing','draft_created','error','ignored')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists technology_news_ingest_created_idx
  on public.technology_news_ingest (created_at desc);

create index if not exists technology_news_ingest_state_idx
  on public.technology_news_ingest (state, created_at desc);

alter table public.technology_news_ingest enable row level security;

-- Không tạo policy public.
-- Browser/Admin hiện tại không cần truy cập bảng này.
-- Worker dùng service_role qua secret server-side.
