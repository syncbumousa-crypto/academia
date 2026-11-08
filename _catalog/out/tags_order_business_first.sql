-- Majors filter order: MIS first, then the six Business School majors, then the rest.
BEGIN;
UPDATE tags SET ord = ord + 6 WHERE ord BETWEEN 1 AND 28;
UPDATE tags SET ord = CASE id WHEN 'acf' THEN 1 WHEN 'ffe' THEN 2 WHEN 'dsmm' THEN 3 WHEN 'fte' THEN 4 WHEN 'baai' THEN 5 WHEN 'osc' THEN 6 END
 WHERE id IN ('acf','ffe','dsmm','fte','baai','osc');
UPDATE meta SET v = (extract(epoch from now()) * 1000)::bigint::text WHERE k = 'catalog_rev';
COMMIT;
