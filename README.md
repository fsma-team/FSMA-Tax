# FSMA Tax (tax.fsma.team)

Web theo dõi hồ sơ thuế của nhân viên (mỗi người 1 tab), có Appointment, Fees, Attention, Reports, Records (các mùa 2021–2025) và tìm khách theo 4 số cuối SSN.
Netlify (web + server) + Supabase (database) + GitHub (code), giống pb.fsma.team và appt.fsma.team.

## Cài đặt (làm 1 lần)

**A. Supabase – tạo database**
1. Tạo project Supabase MỚI tên **FSMA Tax** (không dùng chung FSMA Appointment hay Pub Club). Chọn region gần California (West US).
2. SQL Editor > New query > dán nội dung từng file trong thư mục `sql/` theo đúng thứ tự, mỗi file bấm **Run** (chạy lại lần 2 cũng không sao):

| Thứ tự | File | Làm gì |
|---|---|---|
| 1 | `01-schema.sql` | Tạo các bảng |
| 2 | `02-seed.sql` | Tab nhân viên, 8 user (mật khẩu tạm **12345**), fees, lịch đi làm, settings |
| 3 | `03-records-2021.sql` … `03-records-2025.sql` | Hồ sơ từng khách 2021–2025 (khoảng 19.000 dòng, chỉ 4 số SSN cuối) |
| 4 | `04-records-daily.sql` | Số tổng theo ngày cho Records > Summary / Report |
| 5 | `05-fees-update.sql` | Chỉ chạy khi đã chạy `02-seed.sql` từ bản cũ: thay toàn bộ bảng Fees bằng giá mới (sẽ ghi đè giá bạn đã sửa) |

   Các file `03-...` khá lớn (300–380 KB). Nếu SQL Editor báo quá lớn hoặc bị đứng, chạy từ máy tính bằng Node (xem mục "Chạy file SQL lớn" bên dưới).
3. Bấm nút **Connect** ở trên cùng > tab Connection String > mục **Transaction pooler** > copy dòng URI (có `:6543`). Thay `[YOUR-PASSWORD]` (bỏ luôn 2 dấu ngoặc vuông) bằng database password. Đây là giá trị `DATABASE_URL`.

**B. GitHub** – tạo repo riêng (private) `fsma-team/FSMA-Tax`, upload toàn bộ thư mục này (kéo thả thư mục đã giải nén, không kéo file zip). Repo chứa tên khách trong các file `sql/03-...`, nên **phải để private**.

**C. Netlify** – Add new project > Import from GitHub > chọn repo `FSMA-Tax`. Tên project gợi ý: `fsma-tax`. Build settings để mặc định (đã có `netlify.toml`).
Project configuration > Environment variables > Add a variable:

| Key | Value |
|---|---|
| `DATABASE_URL` | dòng URI ở bước A3 |

Rồi Deploys > Trigger deploy > Deploy project without cache > chờ **Published**.

**D. Kiểm tra** – mở `https://<tên-site>.netlify.app/api/health`. Đúng khi thấy `"database":"connected"`, `"users":8`, `"tabs":6` và `"records_clients":19069`.

**E. Tên miền** – Netlify > Domain management > Add a domain `tax.fsma.team`. Squarespace Domains > DNS > Custom records > CNAME, Host `tax`, Data `<tên-site>.netlify.app`.

**F. Đăng nhập lần đầu** – mở `https://tax.fsma.team`, đăng nhập bằng username (không phân biệt hoa thường) và mật khẩu `12345`. Hệ thống bắt đổi mật khẩu ngay (ít nhất 8 ký tự, không được là `12345`).

| Username | Tên hiển thị | Quyền | Tab |
|---|---|---|---|
| Daniel | Daniel | Admin | Daniel |
| Hailey | Hailey | Admin | Hailey |
| Hari | Hari | Preparer | Hari |
| Ivy | Ivy | Preparer | Ivy |
| Ngoc | Ngọc | Preparer | Ngọc (dùng chung với Nina) |
| Nina | Nina | Preparer | Ngọc (dùng chung với Ngoc) |
| Trang | Trang | Preparer | (chưa có tab) |
| Peter | Peter | Preparer | Peter |

Thêm/sửa user, reset mật khẩu (về 12345), mở khóa: Settings > Users. 5 lần nhập sai thì khóa 15 phút (tăng dần tới 24 giờ).

## Quyền (server kiểm tra, không chỉ giấu nút)
- **Admin**: tất cả. Settings, Reports, Records, Activity log, đổi tên/thêm/xóa tab, sửa mọi tab.
- **Preparer**: sửa tab của mình, đặt hẹn, xem mọi tab (chỉ đọc), tìm khách (mọi năm, mọi preparer), sửa banner của mọi tab.
- Hồ sơ đã **Accepted**: mọi thay đổi và mọi lần xóa hồ sơ đều ghi vào Activity log (Admin xem, có nút Khôi phục).


## Tab Fees > EIC fee estimate
Chọn Filing status, số con, tuổi và thu nhập để ra Federal EIC, CalEITC và phí EIC (lấy từ mục "EIC – Single / 1 con / 2 con trở lên" trong bảng Fees, sửa ở Settings > Fees). Công thức và bảng CalEITC lấy từ file Tax Tools, đối chiếu 20.000 trường hợp ngẫu nhiên đều khớp. Số liệu là **năm thuế 2025**; mùa sau cập nhật các hằng số ở đầu file `public/js/eic.js` (FED, CA, CAL_T).

## Dữ liệu và bảo mật
- Chỉ lưu **4 số cuối SSN**; server từ chối nếu nhập nhiều hơn 4 số. Không lưu thông tin ngân hàng; số điện thoại và số tài khoản trong Note của các năm cũ đã được che `***`.
- Mật khẩu lưu dạng mã hóa (bcrypt). Cookie đăng nhập HttpOnly, Secure, SameSite=Strict, hết hạn sau 12 giờ hoặc 45 phút không dùng (tab bỏ mặc 30 phút thì không còn tự cập nhật).
- Các bảng bật RLS và không có policy công khai: chỉ server (qua `DATABASE_URL`) đọc/ghi được.
- Supabase Free **không có backup tự động**: Settings > Backup > Download mỗi tuần trong mùa thuế (file có tên khách, giữ kín), hoặc nâng lên Supabase Pro.
- Free Supabase bị tạm dừng sau 7 ngày không dùng: file `netlify/functions/keepalive.mjs` chạy mỗi ngày để giữ project hoạt động.

## Netlify credits
Mỗi tab đang mở hỏi server mỗi 30 giây để cập nhật hồ sơ (và lịch hẹn khi đang xem Appointment). Ước tính 8 máy mở 10 giờ/ngày, 26 ngày: khoảng 250.000 request/tháng, vài chục credits. Xem Netlify > Usage sau vài ngày.

## Chạy file SQL lớn từ máy tính (nếu cần)
```
npm install
DATABASE_URL="postgresql://..." node tools/import-sql.mjs sql/03-records-2021.sql sql/03-records-2022.sql sql/03-records-2023.sql sql/03-records-2024.sql sql/03-records-2025.sql sql/04-records-daily.sql
```

## Sửa code sau này
Upload file đã sửa lên GitHub (cùng đường dẫn sẽ ghi đè). Netlify tự deploy lại trong 1–2 phút.

## Mùa thuế mới
Settings > Work Schedule thêm period mới; Settings > Fees cập nhật giá. Năm mùa thuế hiện tại lưu ở bảng `settings` (khóa `season_year`, hiện là 2026 = khai thuế năm 2026, nộp trong 2027). Khi hết mùa, đổi `season_year` sang năm kế tiếp trong Supabase (Table Editor > settings) và dữ liệu mùa cũ chuyển vào Records bằng file SQL riêng (nhờ Claude làm giúp).

## Cấu trúc
```
public/            giao diện (index.html, css/app.css, js/app.js, js/eic.js + js/eic-ui.js cho tab EIC)
netlify/functions/ api.mjs (toàn bộ API), keepalive.mjs (chạy mỗi ngày)
netlify/lib/       core.mjs (database, đăng nhập, tiện ích)
sql/               01-schema, 02-seed, 03-records-*, 04-records-daily
tools/             dev-server.mjs (chạy thử trên máy), import-sql.mjs
```
Chạy thử trên máy: `npm install`, rồi `DATABASE_URL=... PGSSL=disable INSECURE_COOKIE=1 node tools/dev-server.mjs` và mở `http://localhost:8888`.
