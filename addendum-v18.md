# tax.fsma.team v18

## Có gì mới
1. **Bỏ Chat hoàn toàn**: không còn menu Chat, thanh Chat góc phải dưới, nút Chat trên phone, "Sign out Chat". Không nhúng pb.fsma.team nữa. Phone còn 4 nút dưới: Home · Fees · Appt · tab của mình.
2. **Giao diện nhẹ, kiểu đám mây** (thứ tự và luật của các trang giữ nguyên):
   - Tiêu đề Homepage (Hello Team!, Top producers, Informations / Tips, Summary) là đám mây viền xanh.
   - Dưới Hello Team! và dưới tên mỗi tab có 1 câu quote ngẫu nhiên. Bấm vào câu để đổi.
   - Top producers: vương miện ở tiêu đề và cạnh người hạng 1.
   - Menu máy tính nền trắng, trang đang mở gạch chân. Tab nhân viên: hình nhỏ + tên, tab đang mở gạch chân màu của người đó.
   - Appointment máy tính: hẹn đã đặt là thẻ nổi, không viền. Phone: thẻ có viền.
   - Phone Home: Top producers → Informations / Tips → Hẹn hôm nay (của mình) → Work Schedule → Summary (Admin).
   - Phone Appt: chọn từng ngày ở hàng trên (kéo ngang), bấm ô trống để đặt. Giữ ngón tay trên hẹn khoảng nửa giây rồi kéo sang giờ khác, hoặc thả lên ngày khác ở hàng trên.
   - Phone tab nhân viên: 4 số tổng gom 1 dòng nhỏ.
3. **Lỗi không thêm hẹn được ("Server error")**: do database thiếu các cột của v17 (file `sql/07-v17.sql` chưa chạy). Từ v18, server tự kiểm tra và tự thêm phần còn thiếu ở lần chạy đầu, không cần chạy SQL tay. Ô Files tự điền **1**.
4. **Admin không bao giờ bị khóa**: Admin gõ sai mật khẩu bao nhiêu lần cũng không bị lock (mỗi lần sai chờ khoảng 1,5 giây, có ghi vào Activity log). Admin đang bị khóa từ trước cũng vào được. Admin không tự bỏ quyền Admin hay tự khóa mình được. Nhân viên giữ luật cũ (sai 5 lần thì khóa).
5. **Hình đại diện cho mỗi tab** (Sửa banner): mặt cười, hình (tự nén còn 256px), GIF (giữ chuyển động; lớn hơn 2MB thì tự thu nhỏ), hoặc chữ cái đầu. "Lời nhắn" cũ vẫn còn, hiện dưới câu quote nếu có viết.

## Cài đặt
1. **GitHub FSMA-Tax**: up các file trong `FSMA-Tax-update-v18.zip` (kéo thả, cùng đường dẫn sẽ ghi đè). Netlify tự deploy.
2. **Không cần chạy SQL**: server tự thêm. Muốn chạy tay thì chạy `sql/07-v17.sql` rồi `sql/08-v18.sql` trong Supabase SQL Editor (chạy lại không sao).
3. **Pub Club**: không cần làm gì. Các file chat-tax ở Pub Club để đó cũng không ảnh hưởng.
4. Kiểm tra: mở tax.fsma.team (nếu còn thấy giao diện cũ thì tải lại trang), đặt thử 1 hẹn, kéo sang giờ khác, xóa.

## Kỹ thuật
- File mới: `public/js/v18.js`, `public/css/v18.css`, `public/js/vendor/gif-tools.js` (gifuct-js + gifenc, MIT, chỉ tải khi cần thu nhỏ GIF), `sql/08-v18.sql`.
- File đổi: `public/index.html` (?v=180), `public/js/app.js`, `public/js/v17.js` (bỏ Chat; `start()` chuyển sang cuối v18.js), `public/css/app.css` (bỏ CSS Chat), `netlify/functions/api.mjs`, `netlify.toml` (bỏ `frame-src https://pb.fsma.team`).
- API mới: `PUT /api/tabs/:id/avatar` ({t:'letter'} | {t:'emo',v} | {t:'img',mime,data}), `GET /api/avatar/:id` (hình, cache theo `?v=`).
- Cột / bảng mới: `staff_tabs.avatar_kind / avatar_emoji / avatar_ver`, bảng `tab_avatars` (hình lưu dạng bytea, tối đa 2MB).
- `ensureSchema()` trong api.mjs: lần đầu mỗi server instance đọc information_schema; chỉ khi thiếu mới chạy nội dung 07 + 08 (đều dạng `if not exists`).
- Đã thử local (Postgres 16 + dev server + Playwright, máy tính 1360px + iPhone 13, sáng và tối):
  - Database thiếu v17 → đặt hẹn vẫn được (server tự thêm cột).
  - Đặt (Files = 1), sửa, kéo dời, xóa hẹn trên máy tính; đặt, giữ-kéo dời, xóa trên phone.
  - Admin gõ sai 7 lần vẫn đăng nhập được.
  - Hình đại diện: mặt cười, PNG lớn tự nén, GIF 6,3MB thu nhỏ còn 1,1MB vẫn chuyển động.
