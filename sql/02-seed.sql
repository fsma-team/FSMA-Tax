-- tax.fsma.team - du lieu ban dau: tab nhan vien, users (mat khau tam 12345), settings, fees, lich di lam
-- Chay SAU 01-schema.sql. Chay lai lan 2 khong tao trung (chi them khi bang con trong).

insert into staff_tabs (name,color,font,title,tagline,sort)
select * from (values
  ('Daniel','Blue','Gloria Hallelujah','Daniel','Tax prep · Schedule C',1),
  ('Hailey','Rose','Pacifico','Hailey','Cố lên team ✨',2),
  ('Hari','Pink','Lobster','Hari 😎','',3),
  ('Ngọc','Sunshine','Lobster','Ngọc & Nina','T6 e-file files T2 cho Ngọc',4),
  ('Peter','Green','Oswald','Peter','',5),
  ('Ivy','Purple','Quicksand','Ivy','',6)
) v(name,color,font,title,tagline,sort)
where not exists (select 1 from staff_tabs);

insert into users (username,full_name,display_name,role,tab_id,pw_hash)
select * from (values
  ('Daniel','Daniel Bach Phan','Daniel','admin',(select id from staff_tabs where name='Daniel' and deleted_at is null limit 1),'$2a$10$yGzoFWOcK1k.6d7WN3oc7.dcTJUAo5qBy5p2DyqkI00UldMH2YZP6'),
  ('Hailey','Hailey Yen','Hailey','admin',(select id from staff_tabs where name='Hailey' and deleted_at is null limit 1),'$2a$10$vNQBdP.WPZMxAHhLggUYYOLr5hzzAprADqi5dry/4tSMce1xIx7m2'),
  ('Hari','Hải Anh Đinh','Hari','preparer',(select id from staff_tabs where name='Hari' and deleted_at is null limit 1),'$2a$10$jkcGg2PCqHSn0zQ63p2L1.u0dYzRsMd36Y5TLcbJgEclTyQFoQorq'),
  ('Ivy','Ivy Yen','Ivy','preparer',(select id from staff_tabs where name='Ivy' and deleted_at is null limit 1),'$2a$10$RhPu81GvByzNpNv.LmWVBO9ZB9m5Gwommvd1b6XWE3aX6m5Zq.hVC'),
  ('Ngoc','Kim Ngọc Nguyen','Ngọc','preparer',(select id from staff_tabs where name='Ngọc' and deleted_at is null limit 1),'$2a$10$SSuJ4HqNlU02VKBkCUBaP.rlgLITJ.4vY3BGrpV/8REKeh5icG0vu'),
  ('Nina','Nina Ngọc Nguyễn','Nina','preparer',(select id from staff_tabs where name='Ngọc' and deleted_at is null limit 1),'$2a$10$4Hr/BVNNfr8iA.xBaB2jbOA6Qqmk4ZH7T0Dk1rOdUYLZ4l9jQWn.S'),
  ('Trang','Trang Trần','Trang','preparer',null,'$2a$10$3Pbiz2Y0KSueI1jdxBAl4uDst4WBsy.AiKXqk0EbNA8gVVU96djJu'),
  ('Peter','Peter','Peter','preparer',(select id from staff_tabs where name='Peter' and deleted_at is null limit 1),'$2a$10$0m4D0hj8oHpg8hN/BTvI1.n5j8Rpa7LVdFsiNt/2k4vgApqvGpYd2')
) v(username,full_name,display_name,role,tab_id,pw_hash)
where not exists (select 1 from users);

insert into settings (key,value) values ('notice','"Nhớ nhắc khách mang theo 1099 / 1098 trước khi vào hẹn."'::jsonb) on conflict (key) do nothing;
insert into settings (key,value) values ('hours','{"0": null, "1": ["09:00", "18:00"], "2": ["09:00", "18:00"], "3": ["09:00", "18:00"], "4": ["09:00", "18:00"], "5": ["09:00", "18:00"], "6": ["09:00", "16:00"]}'::jsonb) on conflict (key) do nothing;
insert into settings (key,value) values ('cal','{"Office": {"start": "09:00", "last": "18:00", "step": 30}, "Daniel": {"start": "10:00", "last": "18:30", "step": 30}, "Peter": {"start": "10:00", "last": "19:00", "step": 60}}'::jsonb) on conflict (key) do nothing;
insert into settings (key,value) values ('prep_list','["Ivy", "Nina", "Hari", "Hailey", "Nhi"]'::jsonb) on conflict (key) do nothing;
insert into settings (key,value) values ('season_year','2026'::jsonb) on conflict (key) do nothing;

insert into fee_items (section,sec_sort,item,fee,note,sort)
select * from (values
  ('Minimum',0,'Minimum – SSA only return','$30','Không còn discount nữa',0),
  ('Minimum',0,'Khách cũ – W-2 / 1099-R','từ $40','',1),
  ('Minimum',0,'Khách mới – W-2 / 1099-R / 1099 dưới $10k','từ $100','',2),
  ('Per forms',1,'SSA, IRA contribution','$0','',0),
  ('Per forms',1,'1095-A','$10 × n','',1),
  ('Per forms',1,'Student loan / interest (2 người trở lên)','$10 × n','',2),
  ('Per forms',1,'HSA','$10 × n','',3),
  ('Per forms',1,'OT / Tips (tự điền)','$10 × n','',4),
  ('Per forms',1,'1099-MISC','$10 × n','',5),
  ('Per forms',1,'EDD','$10 × n','',6),
  ('Per forms',1,'Extension','$10 × n','',7),
  ('Per forms',1,'W2G','$10 × n','',8),
  ('Per forms',1,'Residence home','$20 × n','',9),
  ('Per forms',1,'Stocks, Crypto','$30 × n','Carry over: thêm $30',10),
  ('Per forms',1,'Dependent care','$30 × n','',11),
  ('Per forms',1,'Car loan interest','$30 × n','',12),
  ('Per forms',1,'IHSS – claim thêm EIC','$30','cần ký disclaimer',13),
  ('Per forms',1,'K-1 (mỗi công ty)','$40','',14),
  ('Per forms',1,'Education credits (mỗi student)','$40','',15),
  ('Per forms',1,'Solar / Xe điện','$50','',16),
  ('Per forms',1,'Rentals','$70 + ($60 × n)','Năm đầu có depreciation: thêm $30 – $50',17),
  ('Per forms',1,'Bán nhà ở (mỗi căn)','$100','',18),
  ('Per forms',1,'Non Resident','$150','',19),
  ('Per forms',1,'Foreign income exclusion','$150','',20),
  ('Per forms',1,'Bán nhà cho thuê (mỗi căn)','$150','',21),
  ('Per forms',1,'ITIN','$180','',22),
  ('EIC & CTC',2,'EIC – không con','$15','',0),
  ('EIC & CTC',2,'EIC – 1 con','$30','',1),
  ('EIC & CTC',2,'EIC – 2 con trở lên','$40','',2),
  ('EIC & CTC',2,'CTC – bé dưới 17 tuổi','+$20','',3),
  ('Amendments',3,'Khách mới','$130 – 170 + docs','',0),
  ('Amendments',3,'Khách cũ','$90 + docs','',1)
) v(section,sec_sort,item,fee,note,sort)
where not exists (select 1 from fee_items);

insert into fee_tiers (title,sort,heads,vals)
select * from (values
  ('1099-NEC / Schedule C',0,'["10k", "20k", "30k", "40k", "50k", "75k", "100k", "150k"]'::jsonb,'[["Fees", ["$50*", "$60", "$70", "$80", "$100", "$120", "$160", "$210"]], ["* 10k: $50, hoặc included trong $100 nếu là khách mới", []]]'::jsonb),
  ('Business (Schedule C)',1,'["≤ $150k", "≤ $250k", "≤ $400k", "> $400k"]'::jsonb,'[["Fees", ["$150", "$250", "$350", "Case by case"]]]'::jsonb),
  ('Business returns – Corp & SMLLC',2,'["Minimum", "< $250k", "< $500k", "< $650k", "< $850k", "< $1.5m", "< $2.5m", "$2.5m – 4m", "$4m+"]'::jsonb,'[["Corp (LLC / S Corp / C)", ["$350", "$450", "$550", "$650 – 750", "$800 – 900+", "$1,000+", "$1,750+", "$2,350+", "Tùy"]], ["SMLLC", ["$250", "$300", "$400", "$700", "$700", "$850", "–", "–", "–"]]]'::jsonb)
) v(title,sort,heads,vals)
where not exists (select 1 from fee_tiers);


do $$ declare p int; begin
 if not exists (select 1 from sched_periods) then
  insert into sched_periods (start_date,end_date,hours_week,hours_sat,hours_sun) values ('2026-10-14','2026-10-31','9AM – 6PM','9AM – 4PM','') returning id into p;
  insert into sched_rows (period_id,name,note,hrs,days,sort) values (p,'Hailey','','','{"mon": "", "tue": "", "wed": "", "thu": "", "fri": ""}'::jsonb,0);
  insert into sched_rows (period_id,name,note,hrs,days,sort) values (p,'Ivy','','','{"mon": "", "tue": "", "wed": "", "thu": "", "fri": ""}'::jsonb,1);
  insert into sched_rows (period_id,name,note,hrs,days,sort) values (p,'Nina','','','{"mon": "", "tue": "9-4:30", "wed": "", "thu": "9-4:30", "fri": ""}'::jsonb,2);
  insert into sched_rows (period_id,name,note,hrs,days,sort) values (p,'Ngọc','','','{"sat": ""}'::jsonb,3);
  insert into sched_rows (period_id,name,note,hrs,days,sort) values (p,'Hari','','','{"tue": "", "thu": "9-7", "fri": "9-7", "sat": ""}'::jsonb,4);
  insert into sched_periods (start_date,end_date,hours_week,hours_sat,hours_sun) values ('2026-11-01','2026-12-06','9AM – 6PM','9AM – 5PM','') returning id into p;
  insert into sched_rows (period_id,name,note,hrs,days,sort) values (p,'Hailey','','','{"mon": "", "tue": "", "wed": "", "thu": "", "fri": ""}'::jsonb,0);
  insert into sched_rows (period_id,name,note,hrs,days,sort) values (p,'Ivy','','','{"mon": "", "tue": "", "wed": "", "fri": "", "sat": ""}'::jsonb,1);
  insert into sched_rows (period_id,name,note,hrs,days,sort) values (p,'Nina','','','{"mon": "", "tue": "", "wed": "", "thu": "9-4:30", "fri": ""}'::jsonb,2);
  insert into sched_rows (period_id,name,note,hrs,days,sort) values (p,'Nhi','','','{"mon": "", "wed": "", "thu": ""}'::jsonb,3);
  insert into sched_rows (period_id,name,note,hrs,days,sort) values (p,'Hari','','','{"tue": "", "thu": "9-7", "fri": "", "sat": ""}'::jsonb,4);
  insert into sched_rows (period_id,name,note,hrs,days,sort) values (p,'Ngọc','','','{"sat": ""}'::jsonb,5);
 end if;
end $$;
