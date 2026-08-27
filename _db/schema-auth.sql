-- ============================================================
--  م١أ — المستخدمون والجلسات
-- ============================================================
--  ولا يُخزَّن سرٌّ خامًا في هذا الملفّ ولا في القاعدة:
--    · كلمةُ السرّ تُشتقّ بـPBKDF2 بملحٍ لكلّ مستخدمٍ على حدة.
--    · ورمزُ الجلسة يُخزَّن **مُجزَّأً** (SHA-256) لا كما هو — فمن قرأ الجدولَ
--      لا يستطيع أن ينتحل جلسةً قائمة، إذ لا يُستخرج الأصلُ من تجزئته.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id       TEXT PRIMARY KEY,          -- u + عشوائيّ: يُولد على الخادم لا على المتصفّح
  email    TEXT NOT NULL UNIQUE,      -- مخزَّنٌ بحروفٍ صغيرة دائمًا (يُطبَّع قبل الكتابة)
  name     TEXT NOT NULL DEFAULT '',
  img      TEXT NOT NULL DEFAULT '',  -- صورةُ البروفايل (data: أو مسار — تصير R2 في م٤)
  pw_hash  TEXT NOT NULL,             -- PBKDF2-SHA256 · base64
  pw_salt  TEXT NOT NULL,             -- ١٦ بايتًا · base64
  pw_iter  INTEGER NOT NULL,          -- عددُ الجولات: يُخزَّن مع كلّ سرٍّ ليُرفع لاحقًا بلا كسر القديم
  verified INTEGER NOT NULL DEFAULT 0,-- م١ب: التحقّقُ بالبريد. وقبله القصرُ على نطاقٍ مسرحيّة
  created  INTEGER NOT NULL,
  seen     INTEGER NOT NULL           -- آخرُ دخول
);

CREATE TABLE IF NOT EXISTS sessions (
  th      TEXT PRIMARY KEY,           -- تجزئةُ الرمز (SHA-256 · hex) — لا الرمزُ نفسُه
  uid     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created INTEGER NOT NULL,
  expires INTEGER NOT NULL,
  ua      TEXT NOT NULL DEFAULT ''    -- طرفٌ من ‎User-Agent‎: ليرى صاحبُه أين هو داخل
);

CREATE INDEX IF NOT EXISTS idx_sessions_uid ON sessions(uid);
CREATE INDEX IF NOT EXISTS idx_sessions_exp ON sessions(expires);
