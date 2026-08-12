create or replace function public.admin_system_usage()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  db_bytes bigint := 0;
  st_bytes bigint := 0;
  st_objects bigint := 0;
begin
  select pg_database_size(current_database()) into db_bytes;

  begin
    execute $q$
      select
        coalesce(sum(case
          when coalesce(metadata->>'size','') ~ '^[0-9]+$'
          then (metadata->>'size')::bigint else 0 end),0)::bigint,
        count(*)::bigint
      from storage.objects
    $q$ into st_bytes, st_objects;
  exception when others then
    st_bytes := 0;
    st_objects := 0;
  end;

  return jsonb_build_object(
    'database_bytes',db_bytes,
    'storage_bytes',st_bytes,
    'storage_objects',st_objects
  );
end;
$$;

revoke all on function public.admin_system_usage() from public,anon,authenticated;
grant execute on function public.admin_system_usage() to service_role;