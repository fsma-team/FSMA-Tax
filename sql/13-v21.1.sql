-- tax.fsma.team v21.1 · chạy SAU sql/12-v21.sql. Chạy nhiều lần không lỗi (chỉ chạy thật 1 lần, khoá bằng settings 'v21_1_paid_old').
-- Payroll › Fees: mọi ô có số của năm 2025 trở về trước (kể cả cột Extra) = ĐÃ PAID (tô xanh #c8e6c9).
-- Ô bạn đã tô màu khác thì giữ nguyên màu đó. Năm 2026 không đụng tới.
do $$
declare n int;
begin
  if exists (select 1 from settings where key = 'v21_1_paid_old') then
    raise notice 'v21.1: đã tô paid các năm cũ trước đó - bỏ qua';
    return;
  end if;

  update pr_fee_lines l set hl = l.hl
      || coalesce((select jsonb_object_agg(k, '#c8e6c9') from jsonb_object_keys(l.m) k where not (l.hl ? k)), '{}'::jsonb)
      || case when l.extra <> 0 and not (l.hl ? 'x') then '{"x":"#c8e6c9"}'::jsonb else '{}'::jsonb end
  where l.year <= 2025;
  get diagnostics n = row_count;
  raise notice 'v21.1: đã tô paid % dòng fee (năm <= 2025)', n;

  insert into settings (key, value) values ('v21_1_paid_old', to_jsonb(now()::text));
end $$;

select year, sum((select count(*) from jsonb_object_keys(hl))) as o_da_to,
       sum((select count(*) from jsonb_object_keys(m)) + (case when extra <> 0 then 1 else 0 end)) as o_co_so
from pr_fee_lines group by year order by year;
