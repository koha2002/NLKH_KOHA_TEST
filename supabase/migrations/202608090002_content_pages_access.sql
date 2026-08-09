-- Cho phép trang published áp dụng đăng nhập/vai trò thay vì chỉ công khai hoàn toàn.
drop policy if exists pages_public_read on public.content_pages;
create policy pages_public_read on public.content_pages for select using (
  (
    status = 'published'
    and coalesce(published_at, now()) <= now()
    and (
      not requires_auth
      or (
        auth.uid() is not null
        and (
          cardinality(allowed_roles) = 0
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.status = 'active' and p.role_id = any(allowed_roles)
          )
        )
      )
    )
  )
  or public.has_permission('content.manage')
);
