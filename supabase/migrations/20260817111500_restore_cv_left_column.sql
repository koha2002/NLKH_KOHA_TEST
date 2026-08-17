-- Restore CV LEFT COLUMN exactly from the profile version before detailed-web CV.
-- Right-side experience remains detailed.
-- Short CV PDF fields are untouched.

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
    address_vi = 'Thanh Xu├ón, H├á Nß╗Öi',
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
    'Tß╗▒ ─æß╗Öng h├│a Hß╗ç thß╗æng ─æiß╗çn', 'Power System Automation',
    'Kß╗╣ s╞░', 'Engineer''s Degree',
    '2020ΓÇö2025',
    '', '',
    'Tr╞░ß╗¥ng ─Éß║íi hß╗ìc ─Éiß╗çn lß╗▒c', 'Electric Power University',
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
    'Quß║ún trß╗ï kinh doanh', 'Business Administration',
    'Hß╗ç cß╗¡ nh├ón - GPA 3.86', 'Bachelor''s Degree - GPA 3.86',
    '2025-2028',
    '', '',
    '─Éß║íi hß╗ìc Th╞░╞íng Mß║íi', 'Thuongmai University',
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
    'Kß╗╣ thuß║¡t n─âng l╞░ß╗úng', 'Energy Engineering',
    'Thß║íc Sß╗╣', 'Master''s Degree',
    '2025-2027',
    '', '',
    'Tr╞░ß╗¥ng ─æß║íi hß╗ìc ─Éiß╗çn Lß╗▒c', 'Electric Power University',
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
    'Tiß║┐ng Anh B1 - ─Éß║íi hß╗ìc ─Éiß╗çn lß╗▒c (2023)', 'B1 English - Electric Power University (2023)',
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
    'ICDL 5 kß╗╣ n─âng (2025)', 'ICDL 5 modules (2025)',
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
    'Giß║Ñy ph├⌐p l├íi xe hß║íng B2', 'B2 driving license',
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
    '─Éß╗ìc t├ái liß╗çu kß╗╣ thuß║¡t', 'Technical documentation',
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
    'Tiß║┐ng Anh B1', 'B1 English',
    '', '',
    '',
    '', '',
    '', '',
    null,
    35, true
  );
end
$$;