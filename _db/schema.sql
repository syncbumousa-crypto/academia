-- ============================================================
--  مخطّطُ قاعدة أكاديميا — م٠: الكتالوج وحدَه
-- ============================================================
--  ولا يُبنى إلّا ما يُستعمل اليوم. لكنّ الأسماءَ والمفاتيحَ تُختار وفي البال
--  ما بعدها (ROADMAP-SERVER.md)، فلا يُعاد تسميةُ جدولٍ فيه بياناتُ الناس.
--
--  والكتالوجُ **يُقرأ ولا يُكتب** في م٠: لا توثيقَ بعدُ، فلا كاتبَ يُوثَق به.
--  والكتابةُ تبقى في لوحة الأدمن على الدرج المحلّيّ حتى م١.
-- ============================================================

DROP TABLE IF EXISTS course_tags;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS tags;

-- ---------- الوسوم (التخصصات) ----------
CREATE TABLE tags (
  id   TEXT PRIMARY KEY,        -- 'mis' · 'tmrtb0jbn' — كما ولّدتها اللوحة
  ar   TEXT NOT NULL,
  en   TEXT NOT NULL DEFAULT '',
  ord  INTEGER NOT NULL DEFAULT 0
);

-- ---------- المواد ----------
--  المفتاحُ رمزُ المادّة نفسُه ('MIS 301') لا رقمٌ مُولَّد: هو معرّفُها في الشيفرة
--  كلِّها وفي بيانات الناس (state.cinfo مفاتيحُه أكوادٌ)، فجعلُه مفتاحًا يمنع
--  طبقةَ ترجمةٍ لا لزوم لها.
CREATE TABLE courses (
  code TEXT PRIMARY KEY,        -- 'MIS 301'
  ar   TEXT NOT NULL,           -- المختصر المعروض: 'نظم 301'
  full TEXT NOT NULL DEFAULT '',-- الاسم الكامل: 'تحليل وتصميم النظم'
  h    INTEGER NOT NULL DEFAULT 0,
  lab  INTEGER NOT NULL DEFAULT 0   -- 0/1 — سِكوَيْل لا يعرف البولين
);

-- ---------- الوصل: مادّةٌ لها وسوم ----------
--  جدولٌ ثالثٌ لا عمودُ نصٍّ فيه وسومٌ مفصولةٌ بفاصلة: الاستعلامُ عن «موادّ هذا
--  التخصّص» يصير فهرسًا لا مسحًا، وحذفُ وسمٍ لا يترك أثرًا في مئة صفّ.
CREATE TABLE course_tags (
  code   TEXT NOT NULL REFERENCES courses(code) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id)      ON DELETE CASCADE,
  PRIMARY KEY (code, tag_id)
);

CREATE INDEX idx_course_tags_tag ON course_tags(tag_id);

-- ---------- ختمُ النسخة ----------
--  صفٌّ واحدٌ يقول متى تبدّل الكتالوج. والموقعُ يقرؤه فيعرف: أيُعيد التنزيل أم
--  يكتفي بما في درجه؟ — فلا تُنقل مئةُ مادّةٍ في كلّ إقلاع.
CREATE TABLE meta (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);
INSERT INTO meta (k, v) VALUES ('catalog_rev', '0');
