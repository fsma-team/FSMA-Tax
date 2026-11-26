# FSMA Tax — Addendum v22

## Cách deploy

1. Upload `FSMA-Tax-v22-full.zip` lên Netlify như mọi lần.
2. Supabase → SQL Editor:
   - Nếu **chưa deploy v21.7**: chạy `13-v21.1.sql` → `14-v21.4.sql` → `15-v22.sql`.
   - Nếu đã deploy v21.7: chỉ chạy `15-v22.sql`.
   - Chạy nhiều lần cũng không sao. Cuối file 15 có bảng đếm số người theo từng theme.
3. Ctrl+Shift+R để tải lại (bản `?v=220`).

## Có gì mới

- **Theme Gen-Z mới (Aura):** các mảng màu pastel mờ trôi chậm, chữ "hello …" viết thường, dòng "aura check" đổi theo cung hoàng đạo của từng người. Dải chạy dưới menu: "manifesting refunds ✦ protect your peace ✦ soft life…".
- **Bỏ** Gen-Z 1 (sticker) và Gen-Z 2 (groovy). Ai đang dùng 2 theme này sẽ tự chuyển qua Gen-Z mới.
- Còn 8 theme: Mùa thu, Cruising, Flowers, Professional, Gen-Z, Zodiac, Thần đồng toán học, Universe.

## Kiểm tra sau deploy

- Bấm Theme → thấy 8 theme, chọn Gen-Z → Lưu → F5 vẫn giữ.
- Người trước đây dùng Gen-Z 1 / 2 đăng nhập vào thấy theme Gen-Z mới.
