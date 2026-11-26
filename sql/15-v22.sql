-- v22: theme Gen-Z (Aura) thay Gen-Z 1 (genz) + Gen-Z 2 (groovy). Chạy nhiều lần không sao.
update users set theme = 'gzaura' where theme in ('genz', 'groovy');
update users set theme = 'autumn' where theme is null or theme not in ('autumn','cruise','bloom','pro','gzaura','zodiac','math','universe');
select theme, count(*) as so_nguoi from users group by theme order by theme;
