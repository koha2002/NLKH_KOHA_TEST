alter table public.news_articles
  alter column published_at set default now();

update public.news_articles
set published_at = coalesce(created_at, now())
where published_at is null;

create or replace function public.ensure_news_article_datetime()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.published_at is null then
    new.published_at := coalesce(new.created_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_news_article_datetime on public.news_articles;

create trigger trg_news_article_datetime
before insert or update on public.news_articles
for each row
execute function public.ensure_news_article_datetime();