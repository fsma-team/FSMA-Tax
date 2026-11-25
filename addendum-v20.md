# tax.fsma.team · v20

Bản này làm đúng theo mockup v20.5 đã duyệt: 4 theme mới, tab **Payroll & Service** (chỉ Admin thấy), tab **Tools**, tin tức tự cập nhật, Records và Accounting làm lại.

## 1. Cài đặt (làm 1 lần, theo thứ tự)

Không cần import Excel, không cần đặt khoá mã hoá.

### Bước 1 · Chạy 2 file SQL trong Supabase
Supabase › SQL Editor › New query › dán nội dung file › **Run**:

1. `sql/10-v20.sql` (có trong zip): tạo bảng payroll, bảng tin, 3 email template mẫu, cột `users.tab_styles`, `pay_rows.wages_manual`, và **đổi theme của mọi người về Mùa thu** (7 theme cũ đã bỏ).
2. `11-v20-payroll-data.sql` (file **gửi riêng**, không nằm trong zip): toàn bộ dữ liệu từ Google Sheet "Payroll Infos" – **208 business · 51 payroll active** (Bi-weekly 14 · Semi-monthly 6 · Monthly 10 · Quarterly 21) · 43 formations · 78 dòng 1099/Annual · tick báo cáo 2026 · 5 khoản nợ cũ đã waive sẵn.
   File khoảng 120 KB, SQL Editor chạy được. Chạy lại lần 2 không sao: nếu đã có dữ liệu thì bỏ qua, không ghi đè.

**File 11 có đầy đủ SSN, EFTPS PIN, password, số tài khoản ngân hàng → chỉ dán vào Supabase, KHÔNG upload lên GitHub, chạy xong thì xoá file khỏi máy / email.**

### Bước 2 · Upload code
GitHub repo `FSMA-Tax`: thay toàn bộ bằng thư mục trong zip (kéo thả thư mục đã giải nén). Netlify tự build. Package mới: `exceljs` – Netlify tự cài từ `package.json`.

### Bước 3 · Tin tức
Tự chạy hàng ngày (function `news-cron`, khoảng 6–7 giờ sáng giờ California): tin Tax mỗi 3 ngày (2 IRS + 2 FTB), tin Payroll mỗi thứ Hai (3 tin: IRS, EDD, SSA, DIR).
Lần đầu: Payroll & Service › Settings › **News** › bấm **Pull now** cho cả 2 dòng. Không dùng AI: chỉ lấy tiêu đề + 1 câu từ trang chính thức. Nguồn lỗi → giữ tin cũ và ghi lỗi ở dòng "Lần cuối". Bỏ tick "Hiện" để ẩn 1 tin.

### Về bảo mật thông tin mật
SSN / PIN / password / bank được lưu dạng chữ thường trong database Supabase (database riêng, chỉ server đọc được; trên web chỉ Admin xem được). Không cần biến `PR_ENC_KEY` nữa.
Nếu sau này muốn mã hoá thêm: đặt `PR_ENC_KEY` trên Netlify (32 bytes base64) – các giá trị lưu **mới** sẽ được mã hoá, giá trị cũ vẫn đọc bình thường. Không bắt buộc.

### (Không bắt buộc) Import lại từ Google Sheet
Payroll & Service › Settings › **Import lại**: chỉ dùng khi muốn nạp lại toàn bộ từ file .xlsx – sẽ **thay toàn bộ** dữ liệu payroll (ticks, fees, notes nhập trên web sẽ mất).

## 2. Có gì mới

**Theme (cho tất cả):** Mùa thu · Cruising · Mùa hoa nở · Professional. Bấm **Theme** (góc trên phải) để chọn theme, kiểu tab tên (6 kiểu, nhớ riêng cho từng theme) và bật/tắt Animation. Lưu theo từng user.

**Homepage:** bên phải hình Hello là Thông báo · Quote · Tax day (bỏ thời tiết). Tin IRS / FTB tự cập nhật. Bỏ dòng mô tả nhỏ dưới các tiêu đề.

**Tools (mọi người):** link IRS / FTB (Where's My Refund, Direct Pay, Business Tax Account, EFTPS, Mailing addresses…), phí thường niên FTB 2026 theo loại cty (LLC fee theo tổng thu nhập CA, S corp / C corp kèm thuế Federal), ô tính nhanh.

**Records (Admin):** Summary / Average / Daily income / All details – chọn nhiều năm, Average có biểu đồ từng preparer theo thời gian, All details sắp xếp theo ngày / preparer / tên / số tiền / trạng thái và xem được các năm trước.

**Accounting (Admin):** 2 tab **Lương** và **Cash** (từ 1/1 đến 15/4 mở sẵn tab Cash). Lương: wages tự tính, **double-click** ô để sửa tay (ô sửa tay có nền vàng). Cash: chênh lệch 0 hiện ✓, có lịch sử mùa 1/15–4/15.

**Payroll & Service (chỉ Admin; preparer không thấy tab, API trả 403):**
- Home: tiền chưa nhận (Waive / Undo), Fees YTD, tiến độ quý này, tin payroll.
- Payroll: theo quý, ô tick (3 ô = báo cáo tháng, 1 ô = báo cáo quý), double-click cột Note, **Prep email** (template EN / VN).
- Businesses / Search / Formations: bấm 1 cty → pop-up đầy đủ (copy 1 chạm), Notes có cột Fee paid (= thu nhập khác), **Edit** để sửa thông tin, payroll, formation, thông tin mật (🔒), hoặc **Delete** (vào Trash).
- Fees: double-click ô để ghi tiền đã nhận (ô trống = chưa trả), chọn ô (Ctrl/Cmd để chọn nhiều) rồi bấm màu để highlight; tab 1099 (thêm tên, link vào business); Summary theo năm (Formation để riêng, không cộng vào total).
- Settings: Email templates (tự lưu), Price list, News, Import, Trash (giữ 100 ngày, khôi phục được).
- Mọi thay đổi được ghi vào `pr_audit` (ai, lúc nào, trước/sau – không ghi giá trị mật).

## 3. Đã kiểm tra
- PostgreSQL 16: chạy toàn bộ `sql/01…10` hai lần trên database mới – không lỗi.
- Database mới: chạy `10` rồi `11` (2 lần) → 208 business / 51 active / 43 formations / 78 dòng 1099, Due = $0, Fees 2026 YTD $45,430. Chạy server **không có** `PR_ENC_KEY`: PIN / PW / SSN hiện đúng, sửa SSN lưu được.
- Admin: tick, note, Prep email, sửa ô fee + highlight, thêm 1099, thêm / xoá note, sửa / tạo business, thêm Bookkeeping, price list, Trash, Search, Formations – lưu và tải lại đúng.
- Preparer (Hari): menu chỉ có Homepage · Fees · Appointment · Attention · Tools; `/api/pr/*` trả 403.
- 4 theme, chọn kiểu tab tên → lưu vào user. Lương: double-click sửa giờ / wages.
- Playwright màn hình 1366 px và iPhone 13: không có lỗi JavaScript.
- **Chưa thử được**: lấy tin thật từ irs.gov / ftb.ca.gov / edd.ca.gov (máy test không vào được các trang này). Sau khi deploy, bấm **Pull now** để kiểm tra; nếu 1 nguồn báo lỗi, gửi lại dòng lỗi để chỉnh.

## 4. Lưu ý
- Thông tin mật chỉ Admin xem được; vẫn nên giữ ít Admin.
- Bỏ: 7 theme cũ, Reports › Nhân viên, biểu đồ fees theo tháng ở Home (vẫn còn ở Fees › Summary), dòng chú thích 1099 2024 (Annual fee giờ là 1 dòng riêng trong Fees).
