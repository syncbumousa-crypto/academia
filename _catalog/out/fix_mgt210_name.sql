-- found by _catalog/check_catalog.py: MGT 210 had no full Arabic name
BEGIN;
UPDATE courses SET "full" = 'اتصالات الأعمال' WHERE code = 'MGT 210' AND coalesce("full", '') = '';
UPDATE meta SET v = (extract(epoch from now()) * 1000)::bigint::text WHERE k = 'catalog_rev';
COMMIT;
