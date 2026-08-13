-- A deleted News article uses ON DELETE SET NULL on technology_news_ingest.article_id.
-- Previously the ingest row could remain state='draft_created', so the Worker treated
-- that source item as a permanent duplicate even though the draft no longer existed.

-- Repair already-stale ingest rows now.
update public.technology_news_ingest
set
  state = 'seen',
  last_error = null,
  updated_at = now()
where state = 'draft_created'
  and article_id is null;

-- Keep future deletes from becoming permanent false duplicates.
create or replace function public.reset_technology_news_ingest_after_article_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.article_id is not null
     and new.article_id is null
     and new.state = 'draft_created' then
    new.state := 'seen';
    new.last_error := null;
    new.updated_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reset_technology_news_ingest_after_article_delete
on public.technology_news_ingest;

create trigger trg_reset_technology_news_ingest_after_article_delete
before update of article_id
on public.technology_news_ingest
for each row
execute function public.reset_technology_news_ingest_after_article_delete();