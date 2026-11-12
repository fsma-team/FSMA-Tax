-- 09-v19.sql : v19 (theme từng người, món ruột, cung hoàng đạo, hẹn Business, bảng dán giấy, Trưa nay ăn gì).
-- Không bắt buộc chạy: server tự thêm lần đầu chạy. Chạy tay trong Supabase SQL Editor cũng được (chạy lại không sao).

alter table users add column if not exists theme  text not null default 'simple';
alter table users add column if not exists food   text not null default '';
alter table users add column if not exists zodiac text not null default '';

alter table bookings add column if not exists biz boolean not null default false;

-- Bảng dán giấy trên Homepage (tự ẩn sau 3 ngày)
create table if not exists home_notes (
  id         bigserial primary key,
  user_id    int references users(id) on delete set null,
  user_name  text not null,
  body       text not null,
  hearts     int[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists home_notes_created_idx on home_notes(created_at);
alter table home_notes enable row level security;

-- Trưa nay ăn gì + mood hôm nay (mỗi người 1 phiếu / ngày)
create table if not exists home_votes (
  day     date not null,
  user_id int  not null references users(id) on delete cascade,
  kind    text not null check (kind in ('lunch','mood')),
  choice  text not null,
  primary key (day, user_id, kind)
);
alter table home_votes enable row level security;

insert into settings (key, value) values ('lunch', '["🍜 Phở","🥖 Bánh mì","🍚 Cơm tấm","🍕 Pizza"]'::jsonb) on conflict (key) do nothing;
