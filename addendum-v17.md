# tax.fsma.team v17

## Có gì mới
1. **First Source**: đầu trang ghi First Source, icon nhà giống Pub Club (tab trình duyệt + Add to Home Screen). Header ghi **Tax season 2026** (= season_year, không +1 nữa). Mọi ngày giờ theo giờ LA.
2. **Top producers** trên Homepage: Vua doanh thu (Income), Vua tốc độ (số hồ sơ), FS Idol (Tips), top 3.
   - Trong mùa (02/01 – 04/15/2027): tính theo tuần Thứ 2 – Chủ nhật.
   - Sau 04/15: hiện tổng cả mùa 02/01 – 04/15/2027.
   - Tab dùng chung hiện "Tên ngắn" (Ngọc → **Ngọcs**). Sửa ở Settings > Tab nhân viên > cột Tên ngắn.
3. **Chat** (nút Chat trên menu; phone: nút Chat ở thanh dưới) = Chat của Pub Club.
   - Lần đầu mở trong mỗi lần đăng nhập Tax: phải log in bằng tài khoản **Pub Club**. Không dính tới Pub Club đang mở ở tab khác.
   - Sign out Tax (hoặc Tax tự hết phiên) = sign out luôn Chat.
   - Chat PIN vẫn theo luật của Pub Club: hỏi lần đầu trên 1 trình duyệt và mỗi tuần 1 lần.
4. **Text cho khách** (Settings > Customer messages), câu chữ theo Waitwhile:
   - Hẹn mới, Đổi ngày / giờ, Hủy hẹn, Nhắc trước 1 ngày + 1 giờ (sửa được, thêm được tới 4 lần nhắc).
   - Chỉ gửi trong khoảng ngày cài (mặc định 02/01 – 04/15), không gửi 9pm – 8am (chờ tới sáng). Mặc định **TẮT**.
   - Ô hẹn có tick "Text cho khách" + dòng lịch sử tin đã gửi. Xóa hẹn luôn hỏi lại, có tick gửi tin hủy.
   - Link trong tin mở **trang khách** `tax.fsma.team/b/<mã>`: ngày giờ, With (chỉ khi khách request preparer), View address (Google / Apple Maps), Contact details (Call 714-640-6654, Email contact@fsma.team, giờ mở cửa lấy từ Work Schedule), Add to calendar, What to bring. Hết hạn 7 ngày sau giờ hẹn. Chỉ hiện tên + chữ đầu họ.
   - Chưa có Twilio thì tin chỉ ghi "demo" (không gửi thật) để thử trước.
5. **Phone**: thanh dưới Home · Fees · Appt · [tab của mình] · Chat; ☰ góc phải trên mở các trang còn lại.
   - Home: Top producers, Work Schedule tuần (chấm xanh), hẹn hôm nay của mình. Admin có thêm Summary.
   - Appt hiện cả tuần.
   - Tab hồ sơ dòng thấp, bấm dòng hoặc "+ Hồ sơ" mở form toàn màn hình.
   - Nhân viên trên phone chỉ thấy tab của mình.
6. **Accounting > Cash cuối ngày**:
   - Bỏ ô "Đã nhận": gõ Thực nhận là đã nhận.
   - **Lock day** cho cả ngày: sau khi Lock, thêm / sửa / xóa hồ sơ của ngày đó thì phần chênh hiện thành dòng vàng ở ngày hôm sau (hoặc ngày đầu tiên chưa Lock).
   - **Unlock** để sửa lại.
   - **Peter** tự giữ tiền: không có ô Thực nhận, không tính vào "Phải nộp", vẫn tính vào "Cả office".

## Cài đặt (theo thứ tự)
1. **Pub Club trước**: up bản vá Chat (`PubClub-v82-taxchat-patch.zip`, xem `addendum-taxchat.md` trong đó). Không cần SQL.
2. **Supabase (FSMA Tax)** > SQL Editor: chạy `sql/07-v17.sql` (chạy lại lần 2 cũng không sao).
3. **GitHub FSMA-Tax**: up các file trong `FSMA-Tax-update-v17.zip` (kéo thả thư mục, cùng đường dẫn sẽ ghi đè). Netlify tự deploy.
4. Kiểm tra: mở tax.fsma.team, thấy First Source + icon nhà. Settings > Customer messages > Gửi thử tới số của mình. Lúc này sẽ báo "demo" vì chưa nối Twilio.

## Twilio (gửi text thật)
1. twilio.com > tạo tài khoản > Upgrade, nạp khoảng $20.
2. Phone Numbers > Buy a number > chọn **Toll-free**, tick SMS (khoảng $2 / tháng).
3. Messaging > Regulatory Compliance > **Toll-Free Verification**:
   - Business: First Source, 9741 Bolsa Avenue Suite 217, Westminster CA 92683; website tax.fsma.team.
   - Use case: Appointment confirmations and reminders.
   - Sample message: "Your booking at First Source is scheduled for Tue, Feb 3 at 10:00 AM. Manage it at https://tax.fsma.team/b/k3P9xQw2Ab".
   - Opt-in: khách đưa số điện thoại khi đặt hẹn qua phone / tại office và đồng ý nhận text về hẹn. Khách trả lời STOP thì Twilio tự ngừng gửi.
   - Duyệt khoảng 1 – 3 tuần: **nộp trước 01/15**.
4. Netlify (FSMA Tax) > Environment variables, thêm rồi Deploy lại:

   | Key | Value |
   |---|---|
   | `TWILIO_SID` | Account SID (bắt đầu bằng AC…) |
   | `TWILIO_TOKEN` | Auth Token |
   | `TWILIO_FROM` | số toll-free dạng `+18335551234` |

5. Settings > Customer messages: tick "Gửi text cho khách" > Lưu > Gửi thử.

Chi phí ước tính: khoảng 4.000 tin / mùa (20 hẹn × ~63 ngày × 3 tin), khoảng $50 – 60 tiền tin + giữ số khoảng $26 / năm. Giá Twilio có thể đổi; xem twilio.com/sms/pricing/us. Viết tin tiếng Anh hoặc không dấu: có dấu thì 1 tin chỉ 70 ký tự (đắt gấp 2 – 3).

## Kỹ thuật
- Mới:
  - `netlify/lib/sms.mjs`: gửi Twilio, nhắc hẹn, hàng chờ.
  - `netlify/functions/sms-cron.mjs`: chạy 10 phút / lần, chỉ tháng 1 – 4 giờ LA; ngoài các tháng đó trả về ngay, không đụng database. Nếu đổi khoảng gửi ra ngoài tháng 1 – 4 thì sửa dòng `if (m > 4)`.
  - `public/js/v17.js`: Top producers, Chat, Customer messages, phone.
  - `public/book.html`, `public/js/book.js`, `public/css/book.css`: trang khách.
  - `public/img/*`, `public/manifest.webmanifest`.
- Bảng mới:
  - `cash_locks`: Lock day + số đã chốt.
  - `booking_links`: dữ liệu trang khách, giữ lại cả khi hẹn đã hủy.
  - `sms_log`: tin đã / sẽ gửi.
  - Cột mới: `bookings.token / sms / sched_at`, `staff_tabs.short_name`.
- Settings key mới:
  - `sms`: cài đặt tin nhắn.
  - `self_keep`: danh sách tab tự giữ tiền. Không có thì mặc định là `["Peter"]`.
- API mới:
  - `GET /api/public/b/:code` (+ `/ics`): không cần login.
  - `GET /api/sms/log`, `POST /api/sms/test`.
  - `PUT` / `DELETE /api/cash/lock`.
- Chat: iframe tới `https://pb.fsma.team/chat-tax.html`; CSP của Tax có `frame-src https://pb.fsma.team`.
  - Khi đăng nhập / đăng xuất Tax: đặt cờ `taxChatReset`, lần mở Chat sau gọi `?reset=1` để log out người cũ.
  - Hai bên nói chuyện qua postMessage: `{pbtax:1, t:'unread'|'ready'|'logout'}`.
- Đã thử local (Postgres 16 + dev server + Playwright, desktop 1360px + iPhone 13):
  - Login, Top producers (tuần / cả mùa), Lock / Unlock và dời phần chênh, Peter tự giữ.
  - Đặt / sửa / dời / xóa hẹn → text demo, trang khách + .ics, nhắc 1 giờ (không nhắc trùng, không nhắc khi vừa đặt sát giờ).
  - Form phone thêm hồ sơ / hẹn / xóa hẹn.
  - Chat trong Tax với Pub Club local: log in, sign out Tax → phiên Chat bị xóa.
- Chưa thử được với Twilio thật và Supabase thật: kiểm tra sau khi deploy.

## v17.1 (sau khi deploy)
- Top producers luôn hiện trên Homepage. Chưa có hồ sơ thì ghi "Chưa có hồ sơ".
- Chat:
  - Menu **Chat** mở trang Chat lớn, chiếm hết phần dưới menu, giống pb.fsma.team.
  - Nút **Chat** tròn ở góc phải dưới mở cửa sổ nhỏ: 350px, chữ thu nhỏ 86% để thấy nhiều dòng hơn. Nút ⤢ trên cửa sổ nhỏ mở trang lớn.
  - Phone giữ như cũ (toàn màn hình).
- File đổi: `public/index.html` (số ?v=171 để trình duyệt tải bản mới), `public/js/v17.js`, `public/js/app.js`, `public/css/app.css`.

## v17.2 (11/07, sửa Chat)
- Bỏ thu nhỏ chữ trong cửa sổ Chat (làm Chat bị cắt mất bên phải và mất ô gõ tin). Cửa sổ nhỏ: 360 × 560px, giao diện giống Chat trên phone của pb.
- Pub Club (bản vá Chat, cần up lại): thêm `public/css/chat-tax.css`. Khi Chat nằm trong Tax thì ẩn header, menu và thanh xanh "Pub Club Chat" của Pub Club, Chat lấp đầy khung. Trang Chat lớn giống pb (3 cột).
- Nút "Sign out" (chỉ sign out Chat) nằm trên thanh "Chat" của cửa sổ nhỏ; trên phone nằm trong ☰ (Sign out Chat).
- index.html dùng ?v=172.

## v17.3 (11/07, Chat giống hệt pb)
- Mọi trang Tax: góc phải dưới là thanh Chat của pb (A− A+ ⚙ ▴), mở được tới 3 cửa sổ chat cạnh nhau, cỡ chữ và thanh công cụ giống pb. Khung Chat trong suốt: bấm ra ngoài các cửa sổ chat vẫn bấm được trang Tax bên dưới.
- Menu Chat = trang Chat lớn như pb.fsma.team/#/chat.
- Chưa log in Chat: góc phải dưới có nút "Chat" mở trang Chat để log in.
- "Sign out Chat" nằm cạnh "Đổi mật khẩu" (desktop) / trong ☰ (phone).
- Phone: bấm Chat ở thanh dưới = Chat toàn màn hình, vừa khít giữa 2 thanh.
- Pub Club (cần up lại): `public/js/app.js` (thêm trang trống `#/dock` khi Chat nằm trong Tax), `public/js/chat-tax.js`, `public/css/chat-tax.css`, `public/chat-tax.html`.
- index.html dùng ?v=173.
