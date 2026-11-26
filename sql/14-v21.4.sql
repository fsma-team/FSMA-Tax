-- tax.fsma.team v21.4 · chạy nhiều lần không lỗi (server cũng tự thêm khi khởi động).
-- theme đã bỏ (Y2K, Road Trip, Chinese, Aquarium, Đô thị - chỉ có trong mockup) + theme lạ → Mùa thu
update users set theme = 'autumn' where theme not in ('autumn','cruise','bloom','pro','genz','groovy','zodiac','math','universe');
-- Quick reading: tử vi mỗi ngày của 12 cung (Free Horoscope API, tiếng Anh), server tự lấy mỗi sáng
create table if not exists horoscopes (sign text not null, day date not null, text text not null default '', url text, fetched_at timestamptz not null default now(), primary key (sign, day));
alter table horoscopes enable row level security;
select 'v21.4 update done' as status;
