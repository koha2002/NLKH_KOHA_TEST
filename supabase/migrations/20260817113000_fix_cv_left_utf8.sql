-- V4 robust UTF-8 repair for the OLD LEFT COLUMN only.
-- Detailed experience and short CV PDF are intentionally untouched.

do $$
declare
  p uuid;
begin
  select id into p
  from public.cv_profiles
  where published = true
  order by updated_at desc
  limit 1;

  if p is null then
    select id into p
    from public.cv_profiles
    order by updated_at desc
    limit 1;
  end if;

  if p is null then
    raise exception 'No cv_profiles row exists';
  end if;

  update public.cv_profiles
  set
    birth_date = '15/05/2002',
    address_vi = 'Thanh Xuân, Hà Nội',
    address_en = 'Thanh Xuan, Hanoi',
    phone = '0343 434 584',
    email = 'khanhhoa2002.hh@gmail.com',
    updated_at = now()
  where id = p;

  delete from public.cv_sections
  where profile_id = p
    and section_type in ('education','certificate','skill');

  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'education',
    'Tự động hóa Hệ thống điện', 'Power System Automation',
    'Kỹ sư', 'Engineer''s Degree',
    '2020—2025',
    '', '',
    'Trường Đại học Điện lực', 'Electric Power University',
    null,
    10, true
  );
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'education',
    'Quản trị kinh doanh', 'Business Administration',
    'Hệ cử nhân - GPA 3.86', 'Bachelor''s Degree - GPA 3.86',
    '2025-2028',
    '', '',
    'Đại học Thương Mại', 'Thuongmai University',
    null,
    11, true
  );
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'education',
    'Kỹ thuật năng lượng', 'Energy Engineering',
    'Thạc Sỹ', 'Master''s Degree',
    '2025-2027',
    '', '',
    'Trường đại học Điện Lực', 'Electric Power University',
    null,
    12, true
  );

  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'certificate',
    'Tiếng Anh B1 - Đại học Điện lực (2023)', 'B1 English - Electric Power University (2023)',
    '', '',
    '',
    '', '',
    '', '',
    null,
    20, true
  );
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'certificate',
    'ICDL 5 kỹ năng (2025)', 'ICDL 5 modules (2025)',
    '', '',
    '',
    '', '',
    '', '',
    null,
    21, true
  );
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'certificate',
    'Giấy phép lái xe hạng B2', 'B2 driving license',
    '', '',
    '',
    '', '',
    '', '',
    null,
    22, true
  );

  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'skill',
    'AutoCAD', 'AutoCAD',
    '', '',
    '',
    '', '',
    '', '',
    null,
    30, true
  );
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'skill',
    'EPLAN', 'EPLAN',
    '', '',
    '',
    '', '',
    '', '',
    null,
    31, true
  );
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'skill',
    'Microsoft Excel', 'Microsoft Excel',
    '', '',
    '',
    '', '',
    '', '',
    null,
    32, true
  );
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'skill',
    'Microsoft Word', 'Microsoft Word',
    '', '',
    '',
    '', '',
    '', '',
    null,
    33, true
  );
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'skill',
    'Đọc tài liệu kỹ thuật', 'Technical documentation',
    '', '',
    '',
    '', '',
    '', '',
    null,
    34, true
  );
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'skill',
    'Tiếng Anh B1', 'B1 English',
    '', '',
    '',
    '', '',
    '', '',
    null,
    35, true
  );
end
$$;