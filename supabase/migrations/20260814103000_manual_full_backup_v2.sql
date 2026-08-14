-- NLKH Manual Full Backup V2
-- Deterministic paging + richer restore metadata.

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
declare order_sql text;
begin
  if not exists(
    select 1
    from pg_catalog.pg_tables
    where schemaname='public' and tablename=p_table
  ) then
    raise exception 'Unknown public table: %',p_table;
  end if;

  select string_agg(format('%I',a.attname),',' order by k.ord)
  into order_sql
  from pg_index i
  cross join lateral unnest(i.indkey) with ordinality as k(attnum,ord)
  join pg_attribute a on a.attrelid=i.indrelid and a.attnum=k.attnum
  join pg_class c on c.oid=i.indrelid
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relname=p_table
    and i.indisprimary;

  if coalesce(order_sql,'')<>'' then
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(q)),''[]''::jsonb)
       from (
         select *
         from public.%I
         order by %s
         offset $1 limit $2
       ) q',
      p_table,order_sql
    )
    into out_data
    using greatest(0,p_offset),least(greatest(1,p_limit),500);
  else
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(q)),''[]''::jsonb)
       from (
         select *
         from public.%I t
         order by to_jsonb(t)::text
         offset $1 limit $2
       ) q',
      p_table
    )
    into out_data
    using greatest(0,p_offset),least(greatest(1,p_limit),500);
  end if;

  return coalesce(out_data,'[]'::jsonb);
end
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

    'tables',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.table_name)
      from (
        select
          c.relname as table_name,
          c.relrowsecurity as rls_enabled,
          c.relforcerowsecurity as rls_forced,
          obj_description(c.oid,'pg_class') as comment
        from pg_class c
        join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and c.relkind in('r','p')
      ) x
    ),'[]'::jsonb),

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
      select jsonb_agg(to_jsonb(x) order by x.function_name,x.identity_arguments)
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

    'views',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.viewname)
      from (
        select schemaname,viewname,viewowner,definition
        from pg_views
        where schemaname='public'
      ) x
    ),'[]'::jsonb),

    'materialized_views',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.matviewname)
      from (
        select schemaname,matviewname,matviewowner,tablespace,hasindexes,ispopulated,definition
        from pg_matviews
        where schemaname='public'
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

    'enums',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.type_name,x.sort_order)
      from (
        select
          t.typname as type_name,
          e.enumsortorder as sort_order,
          e.enumlabel as value
        from pg_type t
        join pg_namespace n on n.oid=t.typnamespace
        join pg_enum e on e.enumtypid=t.oid
        where n.nspname='public'
      ) x
    ),'[]'::jsonb),

    'table_grants',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.table_name,x.grantee,x.privilege_type)
      from (
        select table_schema,table_name,grantor,grantee,privilege_type,is_grantable
        from information_schema.table_privileges
        where table_schema='public'
      ) x
    ),'[]'::jsonb),

    'routine_grants',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.routine_name,x.grantee,x.privilege_type)
      from (
        select routine_schema,routine_name,grantor,grantee,privilege_type,is_grantable
        from information_schema.routine_privileges
        where routine_schema='public'
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

revoke all on function public.manual_backup_table_page(text,integer,integer) from public,anon,authenticated;
revoke all on function public.manual_backup_schema_metadata() from public,anon,authenticated;
grant execute on function public.manual_backup_table_page(text,integer,integer) to service_role;
grant execute on function public.manual_backup_schema_metadata() to service_role;
