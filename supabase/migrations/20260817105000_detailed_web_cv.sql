-- Detailed WEB CV for nguyenlekhanhhoa.com
-- 2026-08-17
-- The short PDF résumé remains separate.
-- DO NOT modify pdf_url / pdf_media_id / pdf_access / photo / theme here.

do $$
declare
  p uuid;
begin
  select id
  into p
  from public.cv_profiles
  where published = true
  order by updated_at desc
  limit 1;

  if p is null then
    select id
    into p
    from public.cv_profiles
    order by updated_at desc
    limit 1;
  end if;

  if p is null then
    raise exception 'No cv_profiles row exists';
  end if;

  update public.cv_profiles
  set
    name = 'Nguyễn Lê Khánh Hòa',
    role_vi = 'Kỹ sư điện · Tự động hóa hệ thống điện',
    role_en = 'Electrical Engineer · Power System Automation',
    headline_vi = 'Kỹ sư điện • Tự động hóa hệ thống điện',
    headline_en = 'Electrical Engineer • Power System Automation',
    summary_vi = 'Kỹ sư điện có nền tảng Tự động hóa Hệ thống điện, kinh nghiệm từ thí nghiệm – bảo dưỡng thiết bị điện, thiết kế hệ thống bảo vệ/tủ bảng đến chuẩn bị dự án, bóc tách khối lượng, mua sắm vật tư và nghiệm thu. Đồng thời có kinh nghiệm vận hành website, thương mại điện tử và quản lý kỹ thuật.',
    summary_en = 'Electrical engineer with a Power System Automation background and hands-on experience spanning electrical testing and maintenance, protection and control panel design, project preparation, quantity take-off, procurement and acceptance documentation. Also experienced in website operations, e-commerce and technical management.',
    birth_date = '15/05/2002',
    address_vi = 'Hà Nội, Việt Nam',
    address_en = 'Hanoi, Vietnam',
    phone = '+84 343 43 45 84',
    email = 'Khanhhoa2002.hh@gmail.com',
    published = true,
    updated_at = now()
  where id = p;

  -- Replace only the website detail sections.
  delete from public.cv_sections
  where profile_id = p;

  -- EDUCATION
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
    'Tự động hóa Hệ thống điện',
    'Power System Automation',
    'Tốt nghiệp loại Giỏi',
    'Graduated with Good honors',
    '2020 – 2025',
    '',
    '',
    'Trường Đại học Điện lực',
    'Electric Power University',
    null, 10, true
  );

  -- CERTIFICATES / LICENSES
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values
  (
    p, 'certificate',
    'Giấy phép lái xe A1, B2',
    'A1, B2 Driving Licenses',
    'Do Bộ Giao thông Vận tải cấp',
    'Issued by the transport authority',
    '2020',
    '', '',
    '', '',
    null, 20, true
  ),
  (
    p, 'certificate',
    'Chứng chỉ Tin học văn phòng ICDL',
    'ICDL Office Computing Certificate',
    'International Certification of Digital Literacy',
    'International Certification of Digital Literacy',
    '2025',
    '', '',
    'ICDL', 'ICDL',
    null, 21, true
  );

  -- CORE CAPABILITIES
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values
  (
    p, 'skill',
    'Thí nghiệm & kiểm định thiết bị điện',
    'Electrical Testing & Inspection',
    '', '', '',
    '', '', '', '',
    null, 30, true
  ),
  (
    p, 'skill',
    'Thiết kế bảo vệ & tủ bảng điện',
    'Protection & Control Panel Design',
    '', '', '',
    '', '', '', '',
    null, 31, true
  ),
  (
    p, 'skill',
    'Hệ thống nhị thứ TBA 110–500kV',
    '110–500kV Substation Secondary Systems',
    '', '', '',
    '', '', '', '',
    null, 32, true
  ),
  (
    p, 'skill',
    'Bóc tách khối lượng & quản lý vật tư',
    'Quantity Take-off & Material Management',
    '', '', '',
    '', '', '', '',
    null, 33, true
  ),
  (
    p, 'skill',
    'Hồ sơ dự thầu, nghiệm thu & CBDA',
    'Tendering, Acceptance & Project Preparation',
    '', '', '',
    '', '', '', '',
    null, 34, true
  ),
  (
    p, 'skill',
    'Website & thương mại điện tử',
    'Website & E-commerce Operations',
    '', '', '',
    '', '', '', '',
    null, 35, true
  );

  -- EXPERIENCE 1: CURRENT
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'experience',
    'Kỹ sư điện phòng CBDA',
    'Electrical Engineer – Project Preparation Department',
    'Chuẩn bị dự án · Vật tư · Nhị thứ · Nghiệm thu',
    'Project preparation · Procurement · Secondary systems · Acceptance',
    '11/2025 – Nay',
$cv$
• Lên khối lượng vật tư phục vụ thi công, lắp đặt các hệ thống điện: solar, hệ thống nhị thứ, công tơ và các hạng mục liên quan.
• Thi công, lắp đặt hệ thống nhị thứ cho trạm biến áp 110kV.
• Hỗ trợ giám sát và hướng dẫn đội thí nghiệm thầu phụ bên ngoài công ty.
• Phối hợp khảo giá thực tế để xây dựng giá cho hồ sơ dự thầu.
• Lập danh sách thiết bị cho các trạm biến áp 500kV triển khai mới.
• Hỗ trợ mua sắm thiết bị, vật tư và theo dõi các đầu việc phục vụ triển khai.
• Thực hiện thủ tục và hồ sơ nghiệm thu cho dự án.
## Công trình đã tham gia
◦ Nhà máy Điện mặt trời Issyk-Kul – Giai đoạn 1.
◦ Trạm biến áp 110kV cho Nhà máy Điện mặt trời Issyk-Kul – Giai đoạn 1.
◦ Trạm biến áp 220kV Yên Dũng – Bắc Giang.
◦ Trạm biến áp 110kV Bảo Thạnh.
$cv$,
$cv$
• Prepare material quantity take-offs for electrical installation scopes including solar, secondary systems, metering and related packages.
• Install secondary systems for 110kV substations.
• Support supervision and technical guidance for external testing subcontractors.
• Coordinate market-price research for tender cost preparation.
• Prepare equipment lists for newly developed 500kV substations.
• Support equipment/material procurement and deployment activities.
• Prepare project acceptance procedures and documentation.
## Selected projects
◦ Issyk-Kul Solar Power Plant – Phase 1.
◦ 110kV substation for Issyk-Kul Solar Power Plant – Phase 1.
◦ 220kV Yen Dung Substation – Bac Giang.
◦ 110kV Bao Thanh Substation.
$cv$,
    'Công ty TNHH Công nghệ Việt',
    'Viet Technology Co., Ltd.',
    null, 100, true
  );

  -- EXPERIENCE 2
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'experience',
    'Kỹ sư thiết kế',
    'Design Engineer',
    'Thiết kế bảo vệ · Tủ bảng · Hồ sơ kỹ thuật',
    'Protection design · Panels · Technical documentation',
    '06/2025 – 11/2025',
$cv$
• Kiểm tra phần đáp ứng kỹ thuật của thiết bị trong hồ sơ thầu do phòng kinh doanh lập.
• Lập khối lượng vật tư dự trù cho dự án trước giai đoạn triển khai.
• Thiết kế tủ bảo vệ và hệ thống bảo vệ cho trạm biến áp 110kV.
• Phối hợp cùng bộ phận KCS test tủ bảng điện trước khi bàn giao thiết bị cho chủ đầu tư.
## Công trình đã tham gia
◦ Thiết kế trạm biến áp 110kV Đông Triều – ngăn lộ mở rộng đi đường dây Tràng Bạch – Thủy Nguyên.
◦ Thiết kế hệ thống tủ SC cho trạm biến áp 110kV Gia Nghĩa.
$cv$,
$cv$
• Review equipment technical-compliance sections in tender documentation prepared by the sales team.
• Prepare preliminary material quantities before project execution.
• Design protection panels and protection systems for 110kV substations.
• Coordinate with QC/KCS to test electrical panels before delivery to the investor.
## Selected projects
◦ 110kV Dong Trieu Substation – extension bay for the Trang Bach – Thuy Nguyen line.
◦ SC panel system for 110kV Gia Nghia Substation.
$cv$,
    'Công ty Cổ phần Entec Kỹ thuật Năng lượng',
    'Entec Energy Engineering JSC',
    null, 101, true
  );

  -- EXPERIENCE 3
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'experience',
    'Thí nghiệm viên',
    'Electrical Testing Engineer',
    'Thí nghiệm · Bảo dưỡng · Thi công điện',
    'Testing · Maintenance · Electrical installation',
    '05/2024 – 06/2025',
$cv$
• Kiểm định máy biến áp, máy cắt, dao tiếp địa và điện trở tiếp địa tại các trạm biến áp.
• Thí nghiệm định kỳ máy biến áp 110kV và các thiết bị trong sân trạm.
• Thi công cáp ngầm, đấu nối thiết bị điện và phối hợp quản lý công việc tại công trình.
• Thực hiện hồ sơ nghiệm thu theo quy trình cho công trình thuộc GENCO2 – Nhiệt điện Hải Phòng.
## Công trình thí nghiệm / bảo dưỡng tiêu biểu
◦ Thí nghiệm máy biến áp khô lắp mới trước khi vận hành tại Công ty Tonly; vệ sinh, kiểm tra TI và máy cắt sau bão 09/2024 tại Quảng Ninh.
◦ Thí nghiệm máy biến áp AT4 Nhiệt điện Cẩm Phả trước và sau bảo dưỡng.
◦ Thí nghiệm định kỳ và bảo dưỡng 13 trạm biến áp turbine điện gió Phương Mai.
◦ Bảo dưỡng định kỳ sân trạm 220kV Điện mặt trời Thiên Thiên Tân 1.4 và 14 trạm kiosk.
◦ Thí nghiệm định kỳ sân trạm 110kV Phước Hữu – Duyên Hải 1 và 9 trạm turbine.
◦ Thi công lắp đặt, thí nghiệm trạm 110kV Cộng Hòa 2 – Hải Dương.
◦ Thí nghiệm định kỳ tổ máy 2 T2/TD92 Nhiệt điện Đông Triều.
◦ Thay mới, thí nghiệm phòng DC1 và DC2 Nhiệt điện Đông Triều.
◦ Thí nghiệm, bảo dưỡng định kỳ tổ máy 1 và các ngăn kéo 6,6kV Nhiệt điện Uông Bí.
◦ Thí nghiệm, bảo dưỡng định kỳ toàn bộ tổ máy số 2 Nhiệt điện Hải Phòng; thực hiện hồ sơ lĩnh vật tư, quản lý tồn kho và hồ sơ nghiệm thu kỹ thuật – tài chính cho gói sửa chữa lớn năm 2024.
## Thiết bị đã sử dụng
◦ Kyoritsu 3125A – đo điện trở cách điện (thành thạo).
◦ ZC302 và HYHL-200A – đo điện trở tiếp xúc (thành thạo).
◦ Kvtester PCT 386I Analyzer – hợp bộ Analyzer (thành thạo).
◦ HYBC-901 – cầu đo tỉ số biến (thành thạo).
◦ HZ-3320D – cầu đo điện trở một chiều (thành thạo).
◦ ZC221 – cầu đo tang; ZC-300B – hợp bộ chụp sóng máy cắt (đã sử dụng).
◦ YDJZ-50/70 và TC-YDJ-YDJZ 200kV – hợp bộ thử cao áp (đã sử dụng).
$cv$,
$cv$
• Inspect transformers, circuit breakers, earthing switches and grounding resistance at substations.
• Perform periodic testing of 110kV transformers and switchyard equipment.
• Install underground cables, connect electrical equipment and coordinate site work.
• Prepare acceptance documentation for GENCO2 projects at Hai Phong Thermal Power Plant.
## Selected testing / maintenance projects
◦ Commissioning tests for a newly installed dry transformer at Tonly; post-storm inspection of CTs and circuit breakers in Quang Ninh (09/2024).
◦ Pre- and post-maintenance testing of AT4 transformer at Cam Pha Thermal Power Plant.
◦ Periodic testing and maintenance for 13 transformer stations at Phuong Mai Wind Farm.
◦ Periodic maintenance of the 220kV switchyard at Thien Thien Tan 1.4 Solar Plant and 14 kiosk substations.
◦ Periodic testing at 110kV Phuoc Huu – Duyen Hai 1 switchyard and 9 turbine substations.
◦ Installation and testing for 110kV Cong Hoa 2 Substation – Hai Duong.
◦ Periodic testing of Unit 2 T2/TD92 at Dong Trieu Thermal Power Plant.
◦ Replacement and testing of DC1 and DC2 rooms at Dong Trieu Thermal Power Plant.
◦ Periodic testing and maintenance of Unit 1 and 6.6kV drawers at Uong Bi Thermal Power Plant.
◦ Periodic testing and maintenance of Unit 2 at Hai Phong Thermal Power Plant, including material issue records, inventory management, and technical/financial acceptance documentation for the 2024 major-overhaul package.
## Test equipment used
◦ Kyoritsu 3125A insulation resistance tester – proficient.
◦ ZC302 and HYHL-200A contact resistance testers – proficient.
◦ Kvtester PCT 386I Analyzer – proficient.
◦ HYBC-901 transformer ratio tester – proficient.
◦ HZ-3320D DC resistance tester – proficient.
◦ ZC221 tan-delta tester and ZC-300B circuit-breaker timing/waveform set – working experience.
◦ YDJZ-50/70 and TC-YDJ-YDJZ 200kV high-voltage test sets – working experience.
$cv$,
    'Công ty TNHH MTV Đo lường Thí nghiệm điện miền Bắc',
    'Northern Electrical Measurement & Testing Co., Ltd.',
    null, 102, true
  );

  -- EXPERIENCE 4
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'experience',
    'Kỹ thuật viên – Quản lý (remote)',
    'Technician – Remote Operations Manager',
    'Kỹ thuật · Website · TMĐT · Vận hành',
    'Technical service · Website · E-commerce · Operations',
    '06/2023 – 10/2025',
$cv$
• Tiếp nhận bảo hành sản phẩm, thiết bị và vật tư; kiểm tra tình trạng hỏng hóc.
• Sửa chữa bo mạch và đấu nối lại các đường mạch bị đứt đoạn.
• Kiểm soát quỹ cửa hàng và lập bảng lương nhân viên cuối tháng.
• Thiết kế website bán hàng hoangmaimobile.vn, xây dựng dữ liệu sao lưu, kiểm tra chức năng và xử lý lỗi tồn đọng.
• Tích hợp vận hành giữa Meta/Facebook và Shopee Seller; quản lý Zalo OA và các chức năng liên quan.
• Viết nội dung quảng cáo sản phẩm mới, lên lịch và phối hợp chạy chiến dịch.
• Quản lý dữ liệu sản phẩm và bán hàng trên Shopee, Lazada, Tiki và TikTok.
• Theo dõi tồn kho, tính thời điểm nhập hàng để duy trì khả năng cung ứng.
• Theo dõi giá thị trường, điều chỉnh giá bán để tăng khả năng cạnh tranh.
• Làm việc trực tiếp với nhà cung cấp về vấn đề kỹ thuật, số lượng và hàng hóa.
$cv$,
$cv$
• Handle product/equipment warranty intake and fault inspection.
• Repair circuit boards and reconnect damaged PCB traces.
• Control store cash flow and prepare monthly payroll.
• Design and operate hoangmaimobile.vn, maintain backups, test website functions and resolve outstanding issues.
• Integrate Meta/Facebook workflows with Shopee Seller and manage Zalo OA.
• Write advertising content for new products and schedule campaign activities.
• Manage product data and sales across Shopee, Lazada, Tiki and TikTok.
• Monitor inventory and determine replenishment timing to maintain availability.
• Monitor market prices and adjust selling prices for competitiveness.
• Work directly with suppliers on technical issues, quantities and merchandise.
$cv$,
    'Hoàng Mai Mobile',
    'Hoang Mai Mobile',
    'https://hoangmaimobile.vn',
    103, true
  );

  -- EXPERIENCE 5
  insert into public.cv_sections(
    profile_id, section_type,
    title_vi, title_en,
    subtitle_vi, subtitle_en,
    period,
    description_vi, description_en,
    organization, organization_en,
    url, sort_order, visible
  ) values (
    p, 'experience',
    'Kỹ thuật viên',
    'Technician',
    'Thiết bị di động · Laptop · Bán hàng kỹ thuật',
    'Mobile devices · Laptops · Technical sales',
    '09/2021 – 06/2023',
$cv$
• Tiếp nhận bảo hành sản phẩm.
• Xử lý các lỗi cơ bản về phần mềm và phần cứng.
• Thay pin iPhone, vệ sinh và sửa chữa các lỗi nhẹ của linh kiện bên trong điện thoại.
• Cài đặt, kiểm tra và sửa chữa laptop.
• Tìm hiểu chức năng của các sản phẩm công nghệ mới để hỗ trợ tư vấn khách hàng.
• Tư vấn bán hàng thiết bị điện tử.
• Kiểm kê hàng hóa và kiểm quỹ cửa hàng.
$cv$,
$cv$
• Handle product warranty intake.
• Troubleshoot common software and hardware issues.
• Replace iPhone batteries, clean devices and repair minor internal component faults.
• Install, inspect and repair laptops.
• Study new technology products to support customer consultation.
• Provide technical sales consultation for electronic devices.
• Perform inventory checks and store cash reconciliation.
$cv$,
    'Công ty Cổ phần Xây dựng và Đầu tư Thương mại Hoàng Hà',
    'Hoang Ha Construction & Trading Investment JSC',
    null, 104, true
  );
end $$;