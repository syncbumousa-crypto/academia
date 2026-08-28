-- ============================================================
--  ترتيبُ المساهمات: أغلفةُ الكتب للموقع لا لصاحبه
-- ============================================================
--  ٥٢ مساهمةً باسم «عبدالرحمن بن موسى» كلُّها في بند «المادة» وكلُّها غلافٌ —
--  نشرها الموقعُ الأساسيُّ باسم من دخل فيه، وهي محتوى الموقع لا عملَ صاحبه.
--  فيراها زميلٌ منسوبةً إلى شخصٍ لم يكتبها.
--
--  ولا يُمحى شيءٌ لا نظيرَ له: ما كان للموقع مثلُه يُمحى، وما انفرد يُنقل.
--  والنسخةُ قبلَه في posts-2026-08-28.json — ولا لايكَ عليها ولا تعليق.

-- ١ · نسخٌ طبقُ الأصل (٤٢): للموقع مثلُها حرفًا بحرف
DELETE FROM posts WHERE uid <> 'u-academia' AND EXISTS (
  SELECT 1 FROM posts s WHERE s.uid = 'u-academia'
    AND s.code = posts.code AND s.sec = posts.sec AND s.data = posts.data);

-- ٢ · مساراتٌ محلّيّة (٦): file:///C:/Users/… لا تُفتح عند أحدٍ سواه،
--     وللموقع نظيرُها بالمسار الصحيح
DELETE FROM posts WHERE uid <> 'u-academia' AND data LIKE '%file:///%' AND EXISTS (
  SELECT 1 FROM posts s WHERE s.uid = 'u-academia'
    AND s.code = posts.code AND s.sec = posts.sec);

-- ٣ · وما انفرد (٤): غلافٌ رفعه بيده ولا نظيرَ له — يُنقل إلى الموقع ولا يُمحى.
--     والشرطُ يحرس المفتاحَ الفريد (uid, code, sec)
UPDATE posts SET uid = 'u-academia' WHERE uid <> 'u-academia' AND NOT EXISTS (
  SELECT 1 FROM posts s WHERE s.uid = 'u-academia'
    AND s.code = posts.code AND s.sec = posts.sec);
