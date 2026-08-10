# V4.6.2 — CV legacy import fix

Sửa lỗi `23502 null value in column description_vi of relation cv_sections` khi import CV legacy.

Nguyên nhân: bulk insert nhiều loại CV section có tập key khác nhau; các cột text NOT NULL bị gửi thành NULL ở một số row. V4.6.2 chuẩn hóa mọi section thành đầy đủ các cột text với chuỗi rỗng thay vì NULL.

Không có migration database mới. Chỉ cần copy file, deploy lại `legacy-import`, rồi chạy lại riêng stage CV (bỏ tick Software/Data/Brand Media nếu đã import thành công).
