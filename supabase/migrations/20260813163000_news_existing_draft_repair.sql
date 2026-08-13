update public.news_articles
set published_at = coalesce(created_at, now())
where status = 'draft'
  and published_at is null;