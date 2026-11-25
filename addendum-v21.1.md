# tax.fsma.team v21.1 — sửa lỗi tô Paid bị mất (11/25/2026)

## SQL (Supabase › SQL Editor)
Chạy **`sql/13-v21.1.sql`** sau khi đã chạy `sql/12-v21.sql`.
- Mọi ô có số của **năm 2025 trở về trước** (kể cả cột Extra) được tô **paid** (xanh). Ô bạn đã tô màu khác thì giữ nguyên màu đó. **Năm 2026 không đụng tới.**
- Chỉ chạy thật **1 lần** (web nhớ bằng settings `v21_1_paid_old`). Chạy lại thì bỏ qua, không tô lại những ô bạn đã bỏ màu.
- Cuối file có bảng kiểm tra: cột `o_da_to` của 2022–2025 phải **bằng** cột `o_co_so`.

Thứ tự đầy đủ nếu chưa chạy gì của v20 / v21: `10-v20.sql` → `11-v20-payroll-data.sql` (file riêng) → `12-v21.sql` → `13-v21.1.sql`.

## Lỗi
Tô màu Paid ở Payroll › Fees, lúc sau load lại thì các ô trở về chưa paid.

**Nguyên nhân:** server chỉ lưu **200 ô đầu tiên** mỗi lần bấm Mark paid, phần còn lại bỏ qua mà không báo lỗi. Trên màn hình thì vẫn tô hết, nên nhìn như đã lưu. Kéo chọn cả năm (vài trăm ô) thì phần lớn bị mất. Thử lại trên máy: chọn 683 ô → bản cũ chỉ lưu 200.

## Đã sửa
- Server lưu tối đa **3000 ô** mỗi lần, gom thành 1 lệnh duy nhất (nhanh, không bị quá thời gian).
- Web gửi theo từng đợt 400 ô và **chờ server trả lời**. Xong mới báo "Đã lưu n ô = paid", con số là số ô server thật sự lưu.
- Nếu lưu không được, các ô chưa lưu **tự trả lại màu cũ** kèm thông báo lỗi. Màn hình không bao giờ hiện màu mà server chưa lưu.
- Mỗi lần tô / bỏ tô có ghi vào audit (`pr_audit`, kind `fee_hl`).

## Đã test
- `13-v21.1.sql` chạy 2 lần: lần 1 tô 138 dòng (2022: 231/231 ô, 2023: 289/289, 2024: 311/311, 2025: 391/391), lần 2 bỏ qua. Ô đã tô vàng từ trước vẫn giữ màu vàng, 2026 không đổi.
- API: 683 ô một lần → lưu đủ 683, mất khoảng 0.02 giây trên máy.
- Trình duyệt: kéo chọn 635 ô (428 ô có số) → Mark paid → load lại → còn đủ 428.
- Không có lỗi JS.

## Kiểm tra sau khi tô thêm (Supabase › SQL Editor)
```sql
select year, sum((select count(*) from jsonb_object_keys(hl))) as o_da_to
from pr_fee_lines group by year order by year;
```
Sau khi tô xong, số này phải tăng đúng với số ô bạn đã tô.

## Kỹ thuật
`netlify/lib/pr.mjs` `putFeeHl` (bỏ `slice(0,200)`, 1 select + 1 update dùng `unnest`, trả về `{n}`), `public/js/pay20.js` `applyHl21` (chia đợt, chờ server, trả màu khi lỗi), `index.html ?v=211`, `sql/13-v21.1.sql`.
