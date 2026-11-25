# tax.fsma.team v21 — addendum (11/25/2026)

## 1. SQL cần chạy (Supabase › SQL Editor)
Chạy **`sql/12-v21.sql`**, một lần.
- Nếu chưa deploy v20 thì chạy theo thứ tự: `sql/10-v20.sql` → `11-v20-payroll-data.sql` (file riêng, không nằm trong zip) → `sql/12-v21.sql`.
- Chạy lại nhiều lần cũng không sao. Phần "tick Q1–Q3" chỉ chạy **lần đầu**: web ghi nhớ trong settings `v21_once`, lần sau tự bỏ qua, nên các ô bạn bỏ tick sau đó không bị tick lại.
- Chạy xong thấy dòng `v21 update done` là được.

File SQL làm 2 việc:
1. Tạo bảng `pr_rep_mode`: lưu mỗi business, mỗi quý report **Monthly (M)** hay **Quarterly (Q)**. Năm 2026 được điền sẵn theo các ô có trong sheet cũ:
   - quý có từ 2 ô tháng trở lên → Monthly;
   - quý có 1 ô tháng hoặc có ô quý → Quarterly;
   - quý trống → giống quý trước.
2. Tick **đã report Q1–Q3 2026** cho mọi khách payroll đang active (Q4 để trống vì đang làm). **Không đụng tới Fees**: không ô nào bị tô paid.

## 2. Đã thay đổi gì
**Payroll**
- Pop-up business có khu **Payroll report 2026**: Q1–Q4, mỗi quý chọn **Monthly | Quarterly**. Bảng Payroll hiện 3 ô tháng hoặc 1 ô quý theo lựa chọn.
- Vì sao trước bị lỗi: web tự đoán Monthly/Quarterly theo các ô có trong sheet. Ô nào chưa tick thì server không lưu, nên load lại là ô đó biến mất (ví dụ Nhut Van Thap Nguyen chỉ còn ô Dec).

**Fees (Payroll › Fees)**
- **Ô tô màu = đã paid. Ô có số nhưng chưa tô = expecting.**
- Chọn ô giống Excel: kéo chuột, Shift + click để chọn một vùng, Ctrl/⌘ + click để thêm từng ô. Thanh đen dưới đáy hiện số ô · Sum · Paid · Expecting. Bấm **✓ Mark paid** (hoặc 4 màu khác) để đánh dấu paid, **Chưa paid** để bỏ màu, Esc để bỏ chọn.
- Mỗi năm có cột **Paid** + **Expecting**, dòng Paid + Expecting ở cuối bảng.
- Summary, Fees YTD ở Home, và Fees paid trong pop-up chỉ tính tiền **đã paid**. Bảng Summary có thêm cột Expecting.
- **Due · Not received** (Home) = ô có số nhưng chưa tô, **chỉ năm nay**, từ Jan tới tháng hiện tại.
- Lưu ý: vì không tô sẵn gì, các năm cũ sẽ hiện Paid $0, toàn bộ nằm ở cột Expecting. Kéo chọn cả năm rồi bấm Mark paid là xong.

**Ô sửa bằng double-click**
- Ô nhập hiện **đè lên ô cũ**: không giãn ô, không xô ô khác. Áp dụng cho Fees, Payroll note, Lương (Hours / Wages / Bonus / Note) và Cash.
- Cash: bỏ hết ô nhập. **Cash received** và **Note** hiện chữ, double-click để sửa, Enter = lưu, Esc = huỷ.

**Appointment**
- Flat, không khung. Ô nào cũng ghi giờ, vạch giờ chẵn đậm, vạch dọc ngăn từng ngày.
- Mỗi hẹn hiện **tên + phone**, có vạch màu của người làm bên trái. Business nền vàng. Hẹn dài hơn 30 phút ghi thêm giờ, ví dụ "14:00 – 15:00".
- Hôm nay có vòng tròn màu theme và **vạch đỏ giờ hiện tại**.
- Phần **đã qua** (ngày trước + các ô giờ đã hết của hôm nay) có **nền xám**, chữ vẫn rõ, không làm mờ nữa.
- Hàng tên ngày luôn nằm trên cùng khi cuộn.

**Tab nhân viên**
- Banner theo theme, có hình trang trí nhỏ. 4 ô số dạng thẻ. Header bảng màu theme, chữ in hoa.

## 3. Đã test (local Postgres 16 + Playwright)
- Database mới: chạy hết SQL 01 → 10, data payroll, rồi `12-v21.sql` **2 lần**, không lỗi. Ra 204 dòng M/Q, 233 ô tick "v21", 0 ô Fees bị tô.
- API `PUT /api/pr/mode`: Admin lưu được; quý sai / mode sai → 400; Preparer → 403.
- Đổi Nhut Q4: Quarterly hiện 1 ô, Monthly hiện 3 ô; tick xong load lại vẫn còn.
- Fees: kéo chọn 9 ô → Mark paid → load lại vẫn tô xanh.
- Double-click: độ rộng ô Fees / Lương Hours / Lương Note / Cash **giữ nguyên** (đo trước và sau khi mở ô nhập). Lương Hours = 90 và Cash received = 225 lưu đúng.
- Appointment + tab nhân viên ở 4 theme; iPhone 13; Preparer không thấy tab Payroll. Không có lỗi JS.

## 4. Ghi chú kỹ thuật
- File mới: `public/js/v21.js` (load cuối: `cellEdit21`, Appointment `pageAppt` wrapper + `post21` / `nowLine21` / `pastToday21`, staff tab `pageStaff` wrapper), `public/css/v21.css`, `sql/12-v21.sql`.
- Sửa: `pay20.js` (`modeOf`, `quarterCells`, `isPd` / `lineSum` / `qPaid`, `owed` chỉ năm nay, `feeYear`, chọn ô kéo chuột + `#selbar21`, `repModeBox`), `v20.js` (Cash double-click `editCash21`, Lương dùng `cellEdit21`, guard `bindCash`), `pr.mjs` (`modes` trong `/pr/data`, `putMode`), `api.mjs` (route `PUT /pr/mode`, tự tạo bảng `pr_rep_mode` khi khởi động), `index.html` `?v=210`.
- Phone: Fees trên điện thoại không kéo chọn được; chạm 1 ô vẫn chọn được và hiện thanh Mark paid.
