-- 06-accounting.sql : tab Accounting (Cash cuối ngày + Lương) và giờ Office.
-- Chạy 1 lần trong Supabase SQL Editor (chạy lại lần 2 cũng không sao).

-- Cash cuối ngày: Admin nhận cash của từng preparer (tab hồ sơ) mỗi ngày
create table if not exists cash_days (
  day        date not null,
  tab_id     int  not null references staff_tabs(id) on delete cascade,
  received   numeric(10,2),
  done       boolean not null default false,
  note       text not null default '',
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (day, tab_id)
);

-- Nhân viên tính lương (có cả người không có tab hồ sơ, ví dụ Nhi)
create table if not exists pay_staff (
  id      serial primary key,
  name    text not null unique,
  rate    numeric(8,2) not null default 0,
  note    text not null default '',
  tab_id  int references staff_tabs(id) on delete set null,
  active  boolean not null default true,
  sort    int not null default 0
);

create table if not exists pay_periods (
  id         serial primary key,
  start_date date not null,
  end_date   date not null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists pay_rows (
  period_id int not null references pay_periods(id) on delete cascade,
  staff_id  int not null references pay_staff(id) on delete cascade,
  hours     numeric(7,2),
  wages     numeric(10,2),
  bonus     numeric(10,2),
  note      text not null default '',
  primary key (period_id, staff_id)
);

alter table cash_days   enable row level security;
alter table pay_staff   enable row level security;
alter table pay_periods enable row level security;
alter table pay_rows    enable row level security;

-- Danh sách nhân viên ban đầu (rate = 0, Admin sửa trong Accounting > Lương)
insert into pay_staff (name, sort, tab_id)
select v.name, v.sort, (select id from staff_tabs t where t.name = v.tab and t.deleted_at is null limit 1)
from (values ('Daniel',1,'Daniel'),('Hailey',2,'Hailey'),('Hari',3,'Hari'),('Ivy',4,'Ivy'),
             ('Ngọc',5,'Ngọc'),('Nina',6,'Ngọc'),('Peter',7,'Peter'),('Trang',8,null),('Nhi',9,null)) as v(name,sort,tab)
on conflict (name) do nothing;

-- Office: giờ "Đóng" giờ là giờ nhận hẹn cuối (slot cuối).
-- Thứ 2–6 nhận hẹn tới 18:00; Thứ 7 giữ như cũ (slot cuối 15:30 = đóng 16:00).
update settings set value = jsonb_set(value, '{6,1}', '"15:30"')
where key = 'hours' and value->'6'->>1 = '16:00';
update settings set value = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(value,
  '{1,1}', '"18:00"'), '{2,1}', '"18:00"'), '{3,1}', '"18:00"'), '{4,1}', '"18:00"'), '{5,1}', '"18:00"')
where key = 'hours' and value->'1' is not null and value->'1' <> 'null'::jsonb
  and value->'2' <> 'null'::jsonb and value->'3' <> 'null'::jsonb and value->'4' <> 'null'::jsonb and value->'5' <> 'null'::jsonb;
update settings set value = jsonb_set(value, '{Office,last}', '"18:00"')
where key = 'cal' and value->'Office'->>'last' < '18:00';
