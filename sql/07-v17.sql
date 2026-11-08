-- 07-v17.sql : v17 (Top producers, Lock day, text cho khách, trang xem hẹn).
-- Chạy 1 lần trong Supabase SQL Editor (chạy lại lần 2 cũng không sao).

-- Tên ngắn của tab (hiện ở Top producers và thanh dưới trên phone). Trống = dùng tên tab.
alter table staff_tabs add column if not exists short_name text not null default '';
update staff_tabs set short_name = 'Ngọcs' where name = 'Ngọc' and short_name = '';

-- Cash cuối ngày: Lock day. snap = số đã chốt lúc Lock (để phần sửa sau đó dời qua ngày sau).
create table if not exists cash_locks (
  day       date primary key,
  locked_at timestamptz not null default now(),
  locked_by text,
  snap      jsonb not null default '{}'::jsonb
);
alter table cash_locks enable row level security;

-- Hẹn: mã link cho khách + có gửi text hay không
alter table bookings add column if not exists token text;
alter table bookings add column if not exists sms boolean not null default true;
create unique index if not exists bookings_token_uq on bookings(token) where token is not null;

-- Trang khách xem hẹn (tax.fsma.team/b/<mã>): giữ lại cả khi hẹn đã hủy
create table if not exists booking_links (
  token      text primary key,
  data       jsonb not null,
  status     text not null default 'ok',          -- ok | updated | cancelled
  appt_at    timestamptz,                          -- giờ hẹn (để nhắc + hết hạn)
  updated_at timestamptz not null default now()
);
alter table booking_links enable row level security;

-- Tin nhắn đã / sẽ gửi
create table if not exists sms_log (
  id          bigserial primary key,
  token       text,
  kind        text not null,                       -- created | updated | cancelled | reminder | test
  ref         text not null default '',            -- reminder: "1440@2027-02-03 10:00" (không gửi trùng)
  to_phone    text not null,
  body        text not null,
  send_at     timestamptz not null default now(),
  status      text not null default 'queued',      -- queued | sent | failed | demo | skipped
  tries       int  not null default 0,
  error       text,
  provider_id text,
  created_by  text,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
create unique index if not exists sms_log_ref_uq on sms_log(token, kind, ref) where kind = 'reminder';
create index if not exists sms_log_queue_idx on sms_log(status, send_at);
create index if not exists sms_log_token_idx on sms_log(token);
alter table sms_log enable row level security;

-- Cài đặt tin nhắn mặc định (Admin sửa ở Settings > Customer messages). Mặc định TẮT.
insert into settings (key, value) values ('sms', '{
  "on": false,
  "from": "02-01", "to": "04-15",
  "quiet": ["08:00", "21:00"],
  "business": "First Source",
  "phone": "714-640-6654",
  "email": "contact@fsma.team",
  "address": "9741 Bolsa Avenue Suite 217, Westminster CA 92683",
  "bring": "Photo ID, Social Security cards, W-2 / 1099 forms, last year''s tax return.",
  "created":   {"on": true, "text": "Your booking at {{ business }} is scheduled for {{ date }} at {{ hour }}. Manage it at {{ link }}"},
  "updated":   {"on": true, "text": "Your booking at {{ business }} was updated: {{ link }}"},
  "cancelled": {"on": true, "text": "Your {{ business }} booking was cancelled. Hope to see you another day."},
  "reminder":  {"on": true, "text": "Just a reminder that your {{ business }} booking is on {{ date }} at {{ hour }}. Manage it at {{ link }}", "before": [1440, 60]}
}'::jsonb) on conflict (key) do nothing;

-- Giờ hẹn được đặt / dời lần cuối (để không gửi "nhắc" ngay sau khi vừa đặt hẹn sát giờ)
alter table bookings add column if not exists sched_at timestamptz not null default now();
