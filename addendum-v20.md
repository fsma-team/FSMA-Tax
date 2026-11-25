# tax.fsma.team · v20

Bản này làm đúng theo mockup v20.5 đã duyệt: 4 theme mới, tab **Payroll & Service** (chỉ Admin thấy), tab **Tools**, tin tức tự cập nhật, Records và Accounting làm lại.

## 1. Cài đặt (làm 1 lần, theo thứ tự)

### Bước 1 · Tạo khoá mã hoá `PR_ENC_KEY` (bắt buộc trước khi import)
SSN, EFTPS PIN, password, số tài khoản ngân hàng và bằng lái được **mã hoá** trước khi lưu vào database (AES-256-GCM). Khoá này là khoá **mới**, không dùng chung `ENC_KEY` cũ.

1. Tạo khoá: mở Terminal trên máy, chạy
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   (hoặc `openssl rand -base64 32`). Kết quả là 1 dòng 44 ký tự, kết thúc bằng `=`.
2. Netlify › site **tax.fsma.team** › Site configuration › Environment variables › **Add a variable**: Key `PR_ENC_KEY`, Value = dòng vừa tạo. Scope: All.
3. **Lưu khoá ở 2 nơi** (ví dụ: 1Password / Bitwarden + 1 bản in cất két). Mất khoá = mất toàn bộ SSN / PIN / PW / bank đã lưu (phải import lại từ Google Sheet). Không gửi khoá qua email / chat.
4. Không bao giờ đổi khoá sau khi đã import. Muốn đổi: đặt khoá mới rồi import lại toàn bộ.

### Bước 2 · Chạy SQL
Supabase › SQL Editor › dán nội dung `sql/10-v20.sql` › **Run**. Chạy lại lần 2 không sao. (Server cũng tự tạo bảng nếu thiếu, nhưng nên chạy tay.)

File này: thêm bảng payroll (`pr_*`), bảng tin (`news_items`, `news_feeds`), 3 email template mẫu, cột `users.tab_styles`, `pay_rows.wages_manual`, và **đổi theme của mọi người về Mùa thu** (7 theme cũ đã bỏ).

### Bước 3 · Upload code
GitHub repo `FSMA-Tax`: thay toàn bộ bằng thư mục trong zip (kéo thả thư mục đã giải nén). Netlify tự build. Package mới: `exceljs` (đọc file .xlsx) – Netlify tự cài từ `package.json`.

### Bước 4 · Import Google Sheet "Payroll Infos"
1. Google Sheet › File › Download › **Microsoft Excel (.xlsx)**.
2. tax.fsma.team › **Payroll & Service** › Settings › **Import from Google Sheet** › chọn file › **Xem trước**.
   Số đúng với file hiện tại: **208 business · 51 payroll active** (Bi-weekly 14 · Semi-monthly 6 · Monthly 10 · Quarterly 21) · 43 formations · 78 dòng 1099/Annual.
3. Mục "cty gộp từ nhiều tab": bỏ tick nếu 2 tab bị gộp sai (giữ lại record payroll).
4. **Lưu vào database**. Sau khi lưu, app tự **waive** các khoản nợ cũ (trước năm nay), giống mockup.
5. Import lại lần sau = **thay toàn bộ** dữ liệu payroll (phải tick "Thay toàn bộ"). Ticks, fees, notes, 1099 nhập tay trên web sẽ mất → chỉ import lại khi thật cần.

### Bước 5 · Tin tức
Tự chạy hàng ngày (function `news-cron`, khoảng 6–7 giờ sáng giờ California): tin Tax mỗi 3 ngày (2 IRS + 2 FTB), tin Payroll mỗi thứ Hai (3 tin: IRS, EDD, SSA, DIR).
Lần đầu: Payroll & Service › Settings › **News** › bấm **Pull now** cho cả 2 dòng. Không dùng AI: chỉ lấy tiêu đề + 1 câu từ trang chính thức. Nguồn lỗi → giữ tin cũ và ghi lỗi ở dòng "Lần cuối". Bỏ tick "Hiện" để ẩn 1 tin.

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
- Import `Payroll Infos.xlsx` qua giao diện → 208 business / 51 active, tự waive 5 khoản cũ (Due = $0), SSN / PIN / PW giải mã đúng.
- Admin: tick, note, Prep email, sửa ô fee + highlight, thêm 1099, thêm / xoá note, sửa / tạo business, thêm Bookkeeping, price list, Trash, Search, Formations – lưu và tải lại đúng.
- Preparer (Hari): menu chỉ có Homepage · Fees · Appointment · Attention · Tools; `/api/pr/*` trả 403.
- 4 theme, chọn kiểu tab tên → lưu vào user. Lương: double-click sửa giờ / wages.
- Playwright màn hình 1366 px và iPhone 13: không có lỗi JavaScript.
- **Chưa thử được**: lấy tin thật từ irs.gov / ftb.ca.gov / edd.ca.gov (máy test không vào được các trang này). Sau khi deploy, bấm **Pull now** để kiểm tra; nếu 1 nguồn báo lỗi, gửi lại dòng lỗi để chỉnh.

## 4. Lưu ý
- File import tối đa khoảng 4 MB (giới hạn của Netlify Functions). File hiện tại nhỏ hơn nhiều.
- Thông tin mật chỉ Admin xem được; vẫn nên giữ ít Admin.
- Bỏ: 7 theme cũ, Reports › Nhân viên, biểu đồ fees theo tháng ở Home (vẫn còn ở Fees › Summary), dòng chú thích 1099 2024 (Annual fee giờ là 1 dòng riêng trong Fees).
