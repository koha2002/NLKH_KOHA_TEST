-- NLKH STATIC V2
-- RPC tiện cho frontend/admin tĩnh. Không chứa secret.

create or replace function public.get_my_access()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then
      jsonb_build_object('authenticated', false)
    else
      coalesce(
        (
          select jsonb_build_object(
            'authenticated', true,
            'id', p.id,
            'email', p.email,
            'display_name', p.display_name,
            'avatar_url', p.avatar_url,
            'role_id', p.role_id,
            'status', p.status,
            'permissions', r.permissions
          )
          from public.profiles p
          join public.roles r on r.id = p.role_id
          where p.id = auth.uid()
        ),
        jsonb_build_object('authenticated', true, 'status', 'missing_profile')
      )
  end;
$$;

revoke all on function public.get_my_access() from public;
grant execute on function public.get_my_access() to authenticated;

revoke delete, update, insert on public.audit_logs from anon, authenticated;

create index if not exists tools_visible_sort_idx
  on public.tools(visible, sort_order);
create index if not exists nav_visible_sort_idx
  on public.navigation_items(visible, location, sort_order);
create index if not exists content_blocks_page_sort_idx
  on public.content_blocks(page_key, visible, sort_order);
create index if not exists cv_sections_profile_sort_idx
  on public.cv_sections(profile_id, visible, sort_order);

comment on column public.api_integrations.secret_ciphertext is
  'AES-GCM ciphertext; chỉ Edge Functions có INTEGRATION_SECRETS_KEY mới giải mã được.';
