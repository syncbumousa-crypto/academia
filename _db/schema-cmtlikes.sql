-- ============================================================
--  إعجابُ التعليقات
-- ============================================================
--  كجدول ‎likes‎ سواءً بسواء: تُخزَّن **الأفعالُ لا العدّاد**، والعدُّ يُحسب.
--  والمفتاحُ المركّبُ يمنع الإعجابَ مرّتين — قيدٌ في القاعدة لا فحصٌ يُلتفّ عليه.
--
--  ولمَ جدولٌ ثانٍ لا عمودٌ في ‎likes‎ يقول «أهذا تعليقٌ أم مساهمة»؟
--  لأنّ ‎pid‎ هناك يشير إلى ‎posts‎ بقيدٍ حقيقيّ (‎REFERENCES‎)، فيمحو الحذفُ
--  المتتابعُ إعجاباتِ ما مُحي وحدَه. وعمودٌ يخلط الجنسين يُبطل ذلك القيد.
-- ============================================================

CREATE TABLE IF NOT EXISTS cmt_likes (
  cid TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  uid TEXT NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  ts  INTEGER NOT NULL,
  PRIMARY KEY (cid, uid)
);

CREATE INDEX IF NOT EXISTS idx_cmtlikes_uid ON cmt_likes(uid);
