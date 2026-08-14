-- NLKH Presence V3 - reliable website heartbeat.
-- Separate RPC name avoids stale PostgREST/function-cache issues from the older implementation.

create or replace function public.touch_site_presence_v3(
  p_visitor_id uuid,
  p_path text
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid;
  v_path text;
  v_now timestamptz := now();
begin
  if p_visitor_id is null then
    return jsonb_build_object('ok',false,'error','missing visitor id');
  end if;

  v_path := left(coalesce(nullif(trim(p_path),''),'/'),300);

  select p.id
    into v_user
  from public.profiles p
  where p.id = auth.uid()
  limit 1;

  insert into public.site_presence(
    visitor_id,
    user_id,
    first_seen_at,
    last_seen_at,
    current_path,
    page_views,
    updated_at
  )
  values(
    p_visitor_id,
    v_user,
    v_now,
    v_now,
    v_path,
    1,
    v_now
  )
  on conflict(visitor_id) do update set
    user_id = coalesce(excluded.user_id, public.site_presence.user_id),
    last_seen_at = v_now,
    current_path = excluded.current_path,
    page_views = public.site_presence.page_views + 1,
    updated_at = v_now;

  return jsonb_build_object(
    'ok', true,
    'visitor_id', p_visitor_id,
    'user_id', v_user,
    'path', v_path,
    'server_time', v_now
  );
end;
$$;

revoke all on function public.touch_site_presence_v3(uuid,text) from public;
grant execute on function public.touch_site_presence_v3(uuid,text) to anon, authenticated;