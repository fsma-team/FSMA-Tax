-- 08-v18.sql : v18 (hình đại diện cho tab nhân viên).
-- Không bắt buộc chạy: server tự thêm các cột / bảng này lần đầu chạy (và tự thêm phần của 07-v17.sql nếu còn thiếu).
-- Chạy tay trong Supabase SQL Editor cũng được (chạy lại lần 2 cũng không sao).

alter table staff_tabs add column if not exists avatar_kind  text not null default '';   -- '' = chữ cái | emo | img
alter table staff_tabs add column if not exists avatar_emoji text not null default '';
alter table staff_tabs add column if not exists avatar_ver   int  not null default 0;

create table if not exists tab_avatars (
  tab_id     int primary key references staff_tabs(id) on delete cascade,
  mime       text not null,
  data       bytea not null,
  updated_at timestamptz not null default now()
);
alter table tab_avatars enable row level security;
