-- tax.fsma.team v21 · chạy SAU sql/10-v20.sql và 11-v20-payroll-data.sql. Chạy nhiều lần không lỗi.
-- 1) Payroll: mỗi business mỗi quý chọn report Monthly (M) hay Quarterly (Q)
-- 2) Một lần duy nhất: tick ĐÃ REPORT Q1–Q3 2026 (không đụng tới Fees / paid)

create table if not exists pr_rep_mode (
  business_id int not null references pr_businesses(id) on delete cascade,
  year        int not null,
  q           smallint not null check (q between 1 and 4),
  mode        char(1) not null check (mode in ('M','Q')),
  primary key (business_id, year, q)
);
alter table pr_rep_mode enable row level security;

do $$
declare
  b record; qq int; nm int; hasq boolean; md char(1); last char(1);
begin
  if exists (select 1 from settings where key = 'v21_once') then
    raise notice 'v21: đã chạy phần một-lần trước đó - bỏ qua';
    return;
  end if;

  -- 1) ghi rõ M/Q cho 2026 (trước đây web tự đoán theo ô có trong sheet)
  for b in select p.business_id as id, p.period from pr_payroll p where p.active loop
    last := null;
    for qq in 1..4 loop
      select count(*) into nm from pr_ticks t where t.business_id = b.id and t.year = 2026
        and t.slot in ('m' || (qq*3-2), 'm' || (qq*3-1), 'm' || (qq*3));
      select exists (select 1 from pr_ticks t where t.business_id = b.id and t.year = 2026 and t.slot = 'q' || qq) into hasq;
      md := case when nm >= 2 then 'M' when hasq or nm = 1 then 'Q'
                 when last is not null then last
                 when b.period = 'Quarterly' then 'Q' else 'M' end;
      insert into pr_rep_mode (business_id, year, q, mode) values (b.id, 2026, qq, md) on conflict do nothing;
      last := md;
    end loop;
  end loop;

  -- 2) Q1–Q3 2026 = đã report
  insert into pr_ticks (business_id, year, slot, done, done_at, done_by)
  select r.business_id, 2026, s.slot, true, now(), 'v21'
  from pr_rep_mode r
  join pr_payroll p on p.business_id = r.business_id and p.active
  cross join lateral (
    select unnest(case when r.mode = 'M' then array['m'||(r.q*3-2), 'm'||(r.q*3-1), 'm'||(r.q*3)] else array['q'||r.q] end) as slot
  ) s
  where r.year = 2026 and r.q <= 3
  on conflict (business_id, year, slot) do update set done = true, done_at = now(), done_by = 'v21';

  insert into settings (key, value) values ('v21_once', to_jsonb(now()::text));
end $$;

select 'v21 update done' as status;
