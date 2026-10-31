-- Cap nhat bang Fees (gia moi, nhom Minimum / Per forms / EIC & CTC, bang 1099-NEC va Business theo income)
-- Chay file nay se THAY TOAN BO bang Fees hien co bang du lieu moi. Neu ban da sua gia trong Settings > Fees thi sua lai sau khi chay.
begin;
delete from fee_items;
delete from fee_tiers;
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
) v(section,sec_sort,item,fee,note,sort);

insert into fee_tiers (title,sort,heads,vals)
select * from (values
  ('1099-NEC / Schedule C',0,'["10k", "20k", "30k", "40k", "50k", "75k", "100k", "150k"]'::jsonb,'[["Fees", ["$50*", "$60", "$70", "$80", "$100", "$120", "$160", "$210"]], ["* 10k: $50, hoặc included trong $100 nếu là khách mới", []]]'::jsonb),
  ('Business (Schedule C)',1,'["≤ $150k", "≤ $250k", "≤ $400k", "> $400k"]'::jsonb,'[["Fees", ["$150", "$250", "$350", "Case by case"]]]'::jsonb),
  ('Business returns – Corp & SMLLC',2,'["Minimum", "< $250k", "< $500k", "< $650k", "< $850k", "< $1.5m", "< $2.5m", "$2.5m – 4m", "$4m+"]'::jsonb,'[["Corp (LLC / S Corp / C)", ["$350", "$450", "$550", "$650 – 750", "$800 – 900+", "$1,000+", "$1,750+", "$2,350+", "Tùy"]], ["SMLLC", ["$250", "$300", "$400", "$700", "$700", "$850", "–", "–", "–"]]]'::jsonb)
) v(title,sort,heads,vals);
commit;
