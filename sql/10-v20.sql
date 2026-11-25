-- 10-v20.sql : v20 (Payroll & Service trong Tax, 4 theme, tin tức tự lấy, tab style, lương sửa tay).
-- Không bắt buộc chạy: server tự chạy lần đầu. Chạy tay trong Supabase SQL Editor cũng được (chạy lại nhiều lần không sao).

-- ---------- Theme: chỉ còn 4 theme ----------
alter table users add column if not exists tab_styles jsonb not null default '{}'::jsonb;
alter table users alter column theme set default 'autumn';
update users set theme = 'autumn' where theme is null or theme not in ('autumn','cruise','bloom','pro');

-- ---------- Lương: Wages sửa tay ----------
alter table pay_rows add column if not exists wages_manual boolean not null default false;

-- ---------- Payroll & Service (prefix pr_, chỉ Admin) ----------
create table if not exists pr_businesses (
  id          serial primary key,
  name        text not null,
  name_key    text not null default '',
  type        text not null default '',
  ein         text not null default '',
  sos         text not null default '',
  addr        text not null default '',
  phone       text not null default '',
  email       text not null default '',
  owner       text not null default '',
  ssn_enc     text,
  formed      date,
  si_due      date,
  status      text not null default 'Active',
  links       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists pr_businesses_key_idx on pr_businesses(name_key);

create table if not exists pr_payroll (
  business_id int primary key references pr_businesses(id) on delete cascade,
  active      boolean not null default true,
  period      text not null default '',
  fee         numeric(10,2),
  fee_txt     text not null default '',
  start_txt   text not null default '',
  irs         boolean not null default false,
  edd         boolean not null default false,
  eddno       text not null default '',
  pin_enc     text,
  pw_enc      text,
  pw_note     text not null default '',
  routing_enc text,
  account_enc text,
  note        text not null default ''
);

create table if not exists pr_ticks (
  business_id int not null references pr_businesses(id) on delete cascade,
  year        int not null,
  slot        text not null check (slot ~ '^(m([1-9]|1[0-2])|q[1-4])$'),
  done        boolean not null default false,
  done_at     timestamptz,
  done_by     text,
  primary key (business_id, year, slot)
);

create table if not exists pr_formations (
  business_id int primary key references pr_businesses(id) on delete cascade,
  no          int,
  date        date,
  boi         boolean not null default false,
  si          boolean not null default false,
  fee         numeric(10,2),
  f2553       text not null default '',
  permit      boolean not null default false,
  dl_enc      text,
  boir        text not null default ''
);

create table if not exists pr_fee_lines (
  id          serial primary key,
  business_id int not null references pr_businesses(id) on delete cascade,
  year        int not null,
  svc         text not null default 'Payroll',
  m           jsonb not null default '{}'::jsonb,
  extra       numeric(10,2) not null default 0,
  xnote       text not null default '',
  flags       jsonb not null default '[]'::jsonb,
  hl          jsonb not null default '{}'::jsonb,
  sort        int not null default 0
);
create index if not exists pr_fee_lines_biz_idx on pr_fee_lines(business_id, year);

create table if not exists pr_1099 (
  id          serial primary key,
  year        int not null,
  name        text not null,
  name_key    text not null default '',
  amount      numeric(10,2) not null default 0,
  kind        text not null default '1099' check (kind in ('1099','Annual')),
  business_id int references pr_businesses(id) on delete set null
);

create table if not exists pr_notes (
  id          serial primary key,
  business_id int not null references pr_businesses(id) on delete cascade,
  body        text not null,
  fee_paid    numeric(10,2),
  created_at  timestamptz not null default now(),
  created_by  text not null default ''
);

create table if not exists pr_waivers (
  k           text primary key,
  created_by  text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists pr_email_templates (
  id    serial primary key,
  name  text not null,
  en_s  text not null default '', en_b text not null default '',
  vn_s  text not null default '', vn_b text not null default '',
  sort  int not null default 0
);

create table if not exists pr_trash (
  id          serial primary key,
  kind        text not null,
  row         jsonb not null,
  deleted_by  text not null default '',
  deleted_at  timestamptz not null default now()
);

create table if not exists pr_audit (
  id        bigserial primary key,
  user_name text not null default '',
  action    text not null,
  kind      text not null default '',
  row_id    text,
  before    jsonb,
  after     jsonb,
  at        timestamptz not null default now()
);

-- ---------- Tin tức tự lấy (Homepage Tax + Payroll Home) ----------
create table if not exists news_items (
  id          bigserial primary key,
  feed        text not null check (feed in ('tax','payroll')),
  grp         text not null default '',
  source      text not null default '',
  title       text not null,
  summary     text not null default '',
  url         text not null,
  published   text not null default '',
  fetched_at  timestamptz not null default now(),
  hidden      boolean not null default false,
  unique (feed, url)
);
create table if not exists news_feeds (
  feed        text primary key,
  every_days  int not null default 3,
  last_run    timestamptz,
  last_error  text
);
insert into news_feeds (feed, every_days) values ('tax', 3), ('payroll', 7) on conflict (feed) do nothing;

alter table pr_businesses     enable row level security;
alter table pr_payroll        enable row level security;
alter table pr_ticks          enable row level security;
alter table pr_formations     enable row level security;
alter table pr_fee_lines      enable row level security;
alter table pr_1099           enable row level security;
alter table pr_notes          enable row level security;
alter table pr_waivers        enable row level security;
alter table pr_email_templates enable row level security;
alter table pr_trash          enable row level security;
alter table pr_audit          enable row level security;
alter table news_items        enable row level security;
alter table news_feeds        enable row level security;

-- 3 mẫu email có sẵn (chỉ thêm khi bảng trống)
insert into pr_email_templates (name, en_s, en_b, vn_s, vn_b, sort)
select * from (values
  ('Quarterly report filed + taxes paid',
   '{business} - {period} payroll report filed',
   E'Hi {owner},\n\nThis is to let you know that we have filed the {period} payroll reports (941 / DE9) for {business}, and the payroll taxes have been paid through EFTPS and EDD.\n\nIf you have any changes in employees or wages for the next period, please let us know.\n\nThank you',
   '{business} - đã nộp report payroll {period}',
   E'Chào anh/chị {owner},\n\nVăn phòng đã nộp report payroll {period} (941 / DE9) cho {business} và đã đóng tiền thuế payroll qua EFTPS và EDD.\n\nNếu kỳ tới có thay đổi nhân viên hoặc lương, anh/chị báo giúp văn phòng nhé.\n\nCảm ơn anh/chị', 1),
  ('Monthly payroll done + deposit made',
   '{business} - {period} payroll done',
   E'Hi {owner},\n\nWe have completed the {period} payroll for {business} and made the tax deposit.\n\nThank you',
   '{business} - xong payroll {period}',
   E'Chào anh/chị {owner},\n\nVăn phòng đã làm xong payroll {period} cho {business} và đã đóng tiền thuế.\n\nCảm ơn anh/chị', 2),
  ('Ask for hours / wages',
   '{business} - hours for {period}',
   E'Hi {owner},\n\nPlease send us the hours / wages of your employees for {period} so we can run payroll on time.\n\nThank you',
   '{business} - giờ làm {period}',
   E'Chào anh/chị {owner},\n\nAnh/chị gửi giúp văn phòng giờ làm / lương của nhân viên {period} để văn phòng làm payroll đúng hạn nhé.\n\nCảm ơn anh/chị', 3)
) as t(name, en_s, en_b, vn_s, vn_b, sort)
where not exists (select 1 from pr_email_templates);

insert into settings (key, value) values
  ('pr_price', '[["1-5",80,90,120],["<10",95,120,175],["<15",130,165,245],["<20",170,220,320],["<30",230,280,380]]'::jsonb)
on conflict (key) do nothing;
