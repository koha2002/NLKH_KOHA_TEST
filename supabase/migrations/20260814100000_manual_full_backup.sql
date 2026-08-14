-- NLKH Manual Full Backup V1
-- Manual-only backup helpers. Google Drive scheduler is disabled/removed.

delete from public.scheduled_api_jobs where handler='website_backup';

alter table public.scheduled_api_jobs
  drop constraint if exists scheduled_api_jobs_handler_check;
alter table public.scheduled_api_jobs
  add constraint scheduled_api_jobs_handler_check
  check(handler in('integration','supabase_keepalive')) not valid;
alter table public.scheduled_api_jobs
  validate constraint scheduled_api_jobs_handler_check;

create or replace function public.manual_backup_table_inventory()
returns table(table_name text,row_count bigint)
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare r record;
declare c bigint;
begin
  for r in
    select tablename
    from pg_catalog.pg_tables
    where schemaname='public'
    order by tablename
  loop
    execute format('select count(*) from public.%I',r.tablename) into c;
    table_name:=r.tablename;
    row_count:=c;
    return next;
  end loop;
end
$$;

create or replace function public.manual_backup_table_page(
  p_table text,
  p_offset integer default 0,
  p_limit integer default 250
)
returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare out_data jsonb;
begin
  if not exists(
    select 1 from pg_catalog.pg_tables
    where schemaname='public' and tablename=p_table
  ) then
    raise exception 'Unknown public table: %',p_table;
  end if;

  execute format(
    'select coalesce(jsonb_agg(to_jsonb(q)),''[]''::jsonb)
       from (
         select * from public.%I
         offset $1 limit $2
       ) q',
    p_table
  )
  into out_data
  using greatest(0,p_offset),least(greatest(1,p_limit),500);

  return coalesce(out_data,'[]'::jsonb);
end
$$;

create or replace function public.manual_backup_storage_buckets()
returns jsonb
language sql
security definer
set search_path=pg_catalog,public
as $$
  select coalesce(jsonb_agg(to_jsonb(b) order by b.id),'[]'::jsonb)
  from storage.buckets b
$$;

create or replace function public.manual_backup_storage_objects_page(
  p_offset integer default 0,
  p_limit integer default 250
)
returns jsonb
language sql
security definer
set search_path=pg_catalog,public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',x.id,
        'bucket_id',x.bucket_id,
        'name',x.name,
        'owner',x.owner,
        'created_at',x.created_at,
        'updated_at',x.updated_at,
        'last_accessed_at',x.last_accessed_at,
        'metadata',x.metadata
      )
      order by x.bucket_id,x.name
    ),
    '[]'::jsonb
  )
  from (
    select o.*
    from storage.objects o
    order by o.bucket_id,o.name
    offset greatest(0,p_offset)
    limit least(greatest(1,p_limit),500)
  ) x
$$;

create or replace function public.manual_backup_schema_metadata()
returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare out_data jsonb;
begin
  select jsonb_build_object(
    'generated_at',now(),
    'database',current_database(),
    'postgres_version',version(),

    'columns',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.table_name,x.ordinal_position)
      from (
        select
          table_schema,table_name,column_name,ordinal_position,
          data_type,udt_schema,udt_name,is_nullable,column_default,
          is_identity,identity_generation,is_generated,generation_expression
        from information_schema.columns
        where table_schema='public'
      ) x
    ),'[]'::jsonb),

    'constraints',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.table_name,x.constraint_name)
      from (
        select
          c.relname as table_name,
          con.conname as constraint_name,
          con.contype as constraint_type,
          pg_get_constraintdef(con.oid,true) as definition
        from pg_constraint con
        join pg_class c on c.oid=con.conrelid
        join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public'
      ) x
    ),'[]'::jsonb),

    'indexes',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.tablename,x.indexname)
      from (
        select schemaname,tablename,indexname,indexdef
        from pg_indexes
        where schemaname='public'
      ) x
    ),'[]'::jsonb),

    'policies',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.tablename,x.policyname)
      from (
        select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
        from pg_policies
        where schemaname='public'
      ) x
    ),'[]'::jsonb),

    'triggers',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.table_name,x.trigger_name)
      from (
        select
          c.relname as table_name,
          t.tgname as trigger_name,
          pg_get_triggerdef(t.oid,true) as definition
        from pg_trigger t
        join pg_class c on c.oid=t.tgrelid
        join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and not t.tgisinternal
      ) x
    ),'[]'::jsonb),

    'functions',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.function_name)
      from (
        select
          p.proname as function_name,
          pg_get_function_identity_arguments(p.oid) as identity_arguments,
          pg_get_functiondef(p.oid) as definition
        from pg_proc p
        join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public' and p.prokind in('f','p')
      ) x
    ),'[]'::jsonb),

    'sequences',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.sequencename)
      from (
        select
          schemaname,sequencename,sequenceowner,data_type,start_value,
          min_value,max_value,increment_by,cycle,cache_size,last_value
        from pg_sequences
        where schemaname='public'
      ) x
    ),'[]'::jsonb),

    'extensions',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.extname)
      from (
        select e.extname,e.extversion,n.nspname as schema_name
        from pg_extension e
        join pg_namespace n on n.oid=e.extnamespace
      ) x
    ),'[]'::jsonb),

    'migration_history',coalesce((
      select jsonb_agg(to_jsonb(m) order by m.version)
      from supabase_migrations.schema_migrations m
    ),'[]'::jsonb)
  )
  into out_data;

  return out_data;
end
$$;

revoke all on function public.manual_backup_table_inventory() from public,anon,authenticated;
revoke all on function public.manual_backup_table_page(text,integer,integer) from public,anon,authenticated;
revoke all on function public.manual_backup_storage_buckets() from public,anon,authenticated;
revoke all on function public.manual_backup_storage_objects_page(integer,integer) from public,anon,authenticated;
revoke all on function public.manual_backup_schema_metadata() from public,anon,authenticated;

grant execute on function public.manual_backup_table_inventory() to service_role;
grant execute on function public.manual_backup_table_page(text,integer,integer) to service_role;
grant execute on function public.manual_backup_storage_buckets() to service_role;
grant execute on function public.manual_backup_storage_objects_page(integer,integer) to service_role;
grant execute on function public.manual_backup_schema_metadata() to service_role;
