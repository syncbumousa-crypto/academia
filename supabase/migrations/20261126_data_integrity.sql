-- ROADMAP-DATA-INTEGRITY · م٢-٣ و م٤-٢
-- إضافةٌ فقط: جدولان جديدان، ولا يُمَسّ جدولٌ قائم. ويُعاد تنفيذُه بلا ضرر (IF NOT EXISTS).

-- أخطاءُ الخادم: كلُّ 500 سطرٌ بمعرّفٍ يُردّ للعميل (‎_err.js‎). وسقفُه ألفُ سطر.
CREATE TABLE IF NOT EXISTS errlog (
  id    BIGSERIAL PRIMARY KEY,
  ts    BIGINT NOT NULL,          -- بالمللي
  ref   TEXT   NOT NULL,          -- المعرّفُ الذي رآه العميل
  route TEXT   NOT NULL,
  code  TEXT   NOT NULL DEFAULT '',
  msg   TEXT   NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS errlog_ts  ON errlog (ts);
CREATE INDEX IF NOT EXISTS errlog_ref ON errlog (ref);

-- ما قبل كلّ كتابة على وثيقةٍ مفردة (nook · prefs · srs · chap · exams): آخرُ عشرين نسخة.
CREATE TABLE IF NOT EXISTS udoc_hist (
  uid  TEXT   NOT NULL,
  kind TEXT   NOT NULL,
  rev  BIGINT NOT NULL,
  data TEXT   NOT NULL,
  ts   BIGINT NOT NULL,           -- بالثواني، متى استُبدلت
  PRIMARY KEY (uid, kind, rev)
);

-- لا يقرؤهما أحدٌ من المتصفّح: الدالّةُ وحدها (بدور القاعدة) تكتب وتقرأ.
ALTER TABLE errlog    ENABLE ROW LEVEL SECURITY;
ALTER TABLE udoc_hist ENABLE ROW LEVEL SECURITY;
