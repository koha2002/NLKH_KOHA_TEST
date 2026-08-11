-- Admin HTML Tool runtime mode.
alter table public.tools
  add column if not exists tool_type text not null default 'source';

update public.tools
set tool_type = 'html'
where coalesce(btrim(inline_html), '') <> '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tools_tool_type_check'
      and conrelid = 'public.tools'::regclass
  ) then
    alter table public.tools
      add constraint tools_tool_type_check check (tool_type in ('source','html'));
  end if;
end $$;

-- Với HTML thuần, Admin không phải điền code/route/accent/status.
-- Trigger chạy BEFORE INSERT/UPDATE để đáp ứng các NOT NULL hiện có của bảng tools.
create or replace function public.nlkh_prepare_html_tool()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.tool_type,'source') = 'html' then
    new.slug := lower(trim(new.slug));
    new.route := '/tools/' || new.slug;
    new.code := upper(left(regexp_replace(new.slug, '[^a-zA-Z0-9]+', '', 'g'), 12));
    if coalesce(new.code,'') = '' then new.code := 'HTML'; end if;
    if coalesce(new.accent,'') = '' then new.accent := '#3157f6'; end if;
    if coalesce(new.status,'') = '' then new.status := 'ready'; end if;
    new.show_orbit := false;
    new.requires_auth := false;
    new.allowed_roles := '{}'::uuid[];
  end if;
  return new;
end;
$$;

drop trigger if exists trg_nlkh_prepare_html_tool on public.tools;
create trigger trg_nlkh_prepare_html_tool
before insert or update on public.tools
for each row execute function public.nlkh_prepare_html_tool();
