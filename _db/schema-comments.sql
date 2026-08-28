-- ============================================================
--  م٣ب — التعليقاتُ على مساهمات الغير
-- ============================================================
--  التعليقُ يسكن عقدةَ البطاقة (‎n.cm‎) **داخل متن مساهمة صاحبها**، والقارئُ
--  لا يملك أن يكتب في متنِ غيره. فيسكن جدولًا مستقلًّا ويُدمَج عند العرض.
--
--  والمفتاحُ ثلاثةٌ: أيُّ مساهمة (‎pid‎)، وأيُّ بطاقةٍ فيها (‎nid‎)، وأيُّ وجهٍ
--  منها (‎face‎). فالتعليقُ في الموقع موسومٌ بوجهه ساعةَ يُكتب — وصفُّ الوجه
--  يعرض جيبَه وصفُّ البطاقة يعرض كلامَها كلَّه.
--
--  والردُّ ليس جدولًا ثانيًا: هو صفٌّ له ‎parent‎. فالخيطُ يُبنى في الذاكرة،
--  ولا يُقيَّد العمقُ في المخطّط — والموقعُ يعرض مستويين فيكفيه.
-- ============================================================

CREATE TABLE IF NOT EXISTS comments (
  id     TEXT PRIMARY KEY,          -- من العميل (فريدٌ بـidSeed)
  pid    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  nid    TEXT NOT NULL,             -- عقدةُ البطاقة داخل المساهمة
  parent TEXT,                      -- ردٌّ على تعليق (NULL = تعليقٌ أصل)
  uid    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  face   INTEGER NOT NULL DEFAULT 1,
  txt    TEXT NOT NULL,
  ts     INTEGER NOT NULL
);

-- القراءةُ الغالبة: «تعليقاتُ هذه المساهمة» — تُقرأ مرّةً وتُوزَّع على عقدها
CREATE INDEX IF NOT EXISTS idx_cmt_pid ON comments(pid, nid);
CREATE INDEX IF NOT EXISTS idx_cmt_uid ON comments(uid);
