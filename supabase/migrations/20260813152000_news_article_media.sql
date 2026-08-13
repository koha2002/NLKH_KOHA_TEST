create table if not exists public.news_article_media (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete cascade,
  role text not null default 'inline' check (role in ('cover','inline')),
  sort_order integer not null default 0,
  source_url text,
  created_at timestamptz not null default now(),
  unique(article_id,media_id)
);

create index if not exists news_article_media_article_idx
  on public.news_article_media(article_id,sort_order);

create index if not exists news_article_media_media_idx
  on public.news_article_media(media_id);

alter table public.news_article_media enable row level security;

drop policy if exists "news_article_media_admin_read" on public.news_article_media;
create policy "news_article_media_admin_read"
on public.news_article_media for select
to authenticated
using (public.has_permission('news.manage'));