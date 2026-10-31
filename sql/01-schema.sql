-- tax.fsma.team - database schema (Supabase project "FSMA Tax")
-- Chay trong Supabase > SQL Editor. Chay lai lan 2 cung khong sao.

create table if not exists staff_tabs (
  id         serial primary key,
  name       text not null,
  color      text not null default 'Blue',
  font       text not null default 'Quicksand',
  title      text not null,
  tagline    text not null default '',
  sort       int  not null default 0,
  sheet_len  int  not null default 100,
  deleted_at timestamptz
);

create table if not exists users (
  id            serial primary key,
  username      text not null,
  full_name     text not null,
  display_name  text not null,
  role          text not null default 'preparer' check (role in ('admin','preparer')),
  tab_id        int references staff_tabs(id) on delete set null,
  pw_hash       text not null,
  must_change   boolean not null default true,
  active        boolean not null default true,
  failed_count  int not null default 0,
  lock_level    int not null default 0,
  lock_until    timestamptz,
  appt_font     text not null default 'Default',
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);
create unique index if not exists users_username_uq on users (lower(username));

create table if not exists sessions (
  token_hash text primary key,
  user_id    int not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists sessions_user_idx on sessions(user_id);

-- Ho so khach cua mua thue hien tai (moi dong = 1 khach trong tab nhan vien)
create table if not exists rows (
  id         bigserial primary key,
  tab_id     int not null references staff_tabs(id),
  pos        int not null,
  work_date  date,
  status     text not null default '' check (status in ('','E-file','Accepted','Rejected','Hold','Paper Mailed','Refund')),
  name       text not null default '',
  name_key   text not null default '',
  ssn        text not null default '' check (ssn ~ '^[0-9]{0,4}$'),
  amount     numeric(10,2) not null default 0,
  method     text not null default 'Cash' check (method in ('Cash','Check','Zelle','Venmo')),
  online     boolean not null default false,
  esign      boolean not null default false,
  paid       boolean not null default false,
  paid_date  date,
  note       text not null default '',
  tip        numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text,
  deleted_at timestamptz
);
create unique index if not exists rows_pos_uq on rows(tab_id, pos) where deleted_at is null;
create index if not exists rows_updated_idx on rows(updated_at);
create index if not exists rows_ssn_idx on rows(ssn);
create index if not exists rows_namekey_idx on rows(name_key);

-- Log cho Admin: sua ho so da Accepted, xoa ho so, khoi phuc
create table if not exists activity_log (
  id        bigserial primary key,
  at        timestamptz not null default now(),
  user_name text,
  tab_name  text,
  kind      text not null,
  text      text not null,
  row_id    bigint,
  snapshot  jsonb
);
create index if not exists activity_log_at_idx on activity_log(at desc);

create table if not exists settings (
  key   text primary key,
  value jsonb not null
);

create table if not exists blackouts (
  id   serial primary key,
  day  date not null,
  who  text not null default 'all',
  note text not null default ''
);

create table if not exists bookings (
  id         bigserial primary key,
  cal        text not null check (cal in ('Office','Daniel','Peter')),
  day        date not null,
  slot       text not null,
  span       int  not null default 1 check (span >= 1),
  client     text not null,
  phone      text not null,
  files      int  not null check (files > 0),
  preparer   text not null default '',
  note       text not null default '',
  created_by text,
  updated_at timestamptz not null default now(),
  unique (cal, day, slot)
);
create index if not exists bookings_day_idx on bookings(day);

create table if not exists sched_periods (
  id         serial primary key,
  start_date date not null,
  end_date   date not null,
  hours_week text not null default '',
  hours_sat  text not null default '',
  hours_sun  text not null default ''
);
create table if not exists sched_rows (
  id        serial primary key,
  period_id int not null references sched_periods(id) on delete cascade,
  name      text not null,
  note      text not null default '',
  hrs       text not null default '',
  days      jsonb not null default '{}'::jsonb,
  sort      int not null default 0
);

create table if not exists fee_items (
  id       serial primary key,
  section  text not null,
  sec_sort int not null default 0,
  item     text not null,
  fee      text not null,
  note     text not null default '',
  sort     int not null default 0
);
create table if not exists fee_tiers (
  id    serial primary key,
  title text not null,
  sort  int not null default 0,
  heads jsonb not null,
  vals  jsonb not null
);

-- Records: cac mua thue cu (2021-2025). Chi Admin xem so tong; moi user tim duoc tung khach.
create table if not exists records_daily (
  id       bigserial primary key,
  year     int not null,
  preparer text not null,
  day      date not null,
  clients  int not null,
  income   numeric(12,2) not null,
  tips     numeric(12,2) not null default 0,
  ef       int not null default 0,
  accepted int not null default 0,
  others   int not null default 0
);
create index if not exists records_daily_year_idx on records_daily(year);

create table if not exists records_clients (
  id       bigserial primary key,
  year     int not null,
  day      date not null,
  preparer text not null,
  name     text not null,
  name_key text not null,
  ssn      text not null default '',
  amount   numeric(10,2) not null default 0,
  status   text not null default '',
  note     text not null default ''
);
create index if not exists records_clients_year_idx on records_clients(year);
create index if not exists records_clients_ssn_idx on records_clients(ssn);
create index if not exists records_clients_key_idx on records_clients(name_key);

-- Khoa bang tu ben ngoai: chi server (DATABASE_URL) doc/ghi duoc
alter table staff_tabs      enable row level security;
alter table users           enable row level security;
alter table sessions        enable row level security;
alter table rows            enable row level security;
alter table activity_log    enable row level security;
alter table settings        enable row level security;
alter table blackouts       enable row level security;
alter table bookings        enable row level security;
alter table sched_periods   enable row level security;
alter table sched_rows      enable row level security;
alter table fee_items       enable row level security;
alter table fee_tiers       enable row level security;
alter table records_daily   enable row level security;
alter table records_clients enable row level security;
