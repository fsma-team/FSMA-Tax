# FSMA Tax — Addendum v21.7

Gộp v21.1 → v21.7 (chưa deploy bản nào sau v21).

## Cách deploy

1. Upload zip `FSMA-Tax-v21.7-full.zip` lên Netlify như mọi lần.
2. Supabase → SQL Editor, chạy theo thứ tự:
   - `sql/13-v21.1.sql` — đánh dấu **paid** mọi ô fees từ **2025 trở về trước** (chỉ chạy 1 lần, chạy lại không sao). Cuối file có bảng kiểm tra: năm ≤ 2025 phải toàn paid, 2026 không đụng.
   - `sql/14-v21.4.sql` — tạo bảng `horoscopes`, ai đang dùng theme đã bỏ (Đô thị, Y2K, Road Trip, Chinese, Aquarium) sẽ về **Mùa thu**.
   - Nếu chưa từng chạy `12-v21.sql` thì chạy 12 → 13 → 14.
3. Ctrl+Shift+R để tải lại (bản `?v=217`).

## Có gì mới

**Fees (v21.1)**
- Sửa lỗi highlight paid bị mất sau 15 phút: trước đây server chỉ lưu tối đa 200 ô mà vẫn báo ok. Giờ lưu được 3000 ô/lần, báo đúng số ô đã lưu, lỗi thì trả ô về như cũ và báo đỏ.
- **Các ô 2026 đã tô trước đây bị mất → cần tô lại 1 lần.**

**Theme (v21.2 → v21.7)**
- Còn 9 theme: Mùa thu, Cruising, Flowers, Professional, Gen-Z 1, Gen-Z 2 (Groovy), Zodiac, Thần đồng toán học, Universe.
- Khi chọn theme: chỉ còn lưới theme + Zodiac sign + Animation. Bỏ chọn kiểu tab tên, món ăn vặt, tuổi.
- Dải chạy dưới menu cho Cruising (cờ hàng hải + thuyền + hải âu), Pro (bảng điện chứng khoán), Zodiac (sao băng + ký hiệu cung), Universe (sao + hành tinh + tên lửa), cùng Gen-Z và Toán như trước.
- Universe vẽ lại: tinh vân, hành tinh vòng, hố đen, sao Hoả, Trái Đất có mặt trăng quay.

**Homepage Tax**
- Phần đầu giống Home của Payroll: hình Hello rộng bên trái, cột phải (Thông báo / Quote / Tax day) chữ to dễ đọc.
- **Quick reading** thay "Bảng dán giấy" và "Trưa nay ăn gì": horoscope tiếng Anh theo cung đã chọn, chỉ đọc, không có link.
  - Nguồn: Free Horoscope API (miễn phí, không cần key). Cron mỗi ngày lấy sẵn 12 cung và lưu vào bảng `horoscopes`.

## Kiểm tra sau deploy

- Mở Home → Quick reading phải hiện đoạn horoscope. Nếu thấy "Chưa lấy được…": vào Netlify → Functions → `api` / `news-cron` → xem log có lỗi gọi `freehoroscopeapi.com` không.
- Fees: tô vài ô → F5 → vẫn còn.
- Thử đổi theme + cung → F5 → vẫn giữ.
