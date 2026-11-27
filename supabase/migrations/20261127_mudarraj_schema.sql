-- ROADMAP-MUDARRAJ · م٢ — جداولُ المدرج في مخطّطٍ مستقلّ
-- إضافةٌ فقط: مخطّطٌ جديد وجداولُ فارغة، ولا يُمَسّ جدولٌ في ‎public‎ (المسلخ).
-- والمشتركُ يبقى في ‎public‎: users · sessions · media · book_* · hits · errlog · meta · mcp_*.
-- ويُعاد تنفيذُه بلا ضرر (IF NOT EXISTS).

CREATE SCHEMA IF NOT EXISTS mudarraj;

-- الكتالوج
CREATE TABLE IF NOT EXISTS mudarraj.tags        (LIKE public.tags        INCLUDING ALL);
CREATE TABLE IF NOT EXISTS mudarraj.courses     (LIKE public.courses     INCLUDING ALL);
CREATE TABLE IF NOT EXISTS mudarraj.course_tags (LIKE public.course_tags INCLUDING ALL);

-- المحتوى
CREATE TABLE IF NOT EXISTS mudarraj.posts     (LIKE public.posts     INCLUDING ALL);
CREATE TABLE IF NOT EXISTS mudarraj.likes     (LIKE public.likes     INCLUDING ALL);
CREATE TABLE IF NOT EXISTS mudarraj.comments  (LIKE public.comments  INCLUDING ALL);
CREATE TABLE IF NOT EXISTS mudarraj.cmt_likes (LIKE public.cmt_likes INCLUDING ALL);
CREATE TABLE IF NOT EXISTS mudarraj.udoc      (LIKE public.udoc      INCLUDING ALL);
CREATE TABLE IF NOT EXISTS mudarraj.udoc_hist (LIKE public.udoc_hist INCLUDING ALL);

-- المفاتيحُ الأجنبيّة لا ينسخها ‎LIKE‎: تُعاد بأسمائها، والمستخدمُ من ‎public‎
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mud_course_tags_code_fkey') THEN
    ALTER TABLE mudarraj.course_tags ADD CONSTRAINT mud_course_tags_code_fkey FOREIGN KEY (code)   REFERENCES mudarraj.courses(code) ON DELETE CASCADE;
    ALTER TABLE mudarraj.course_tags ADD CONSTRAINT mud_course_tags_tag_fkey  FOREIGN KEY (tag_id) REFERENCES mudarraj.tags(id)      ON DELETE CASCADE;
    ALTER TABLE mudarraj.posts     ADD CONSTRAINT mud_posts_uid_fkey     FOREIGN KEY (uid) REFERENCES public.users(id)     ON DELETE CASCADE;
    ALTER TABLE mudarraj.likes     ADD CONSTRAINT mud_likes_pid_fkey     FOREIGN KEY (pid) REFERENCES mudarraj.posts(id)   ON DELETE CASCADE;
    ALTER TABLE mudarraj.likes     ADD CONSTRAINT mud_likes_uid_fkey     FOREIGN KEY (uid) REFERENCES public.users(id)     ON DELETE CASCADE;
    ALTER TABLE mudarraj.comments  ADD CONSTRAINT mud_comments_pid_fkey  FOREIGN KEY (pid) REFERENCES mudarraj.posts(id)   ON DELETE CASCADE;
    ALTER TABLE mudarraj.comments  ADD CONSTRAINT mud_comments_uid_fkey  FOREIGN KEY (uid) REFERENCES public.users(id)     ON DELETE CASCADE;
    ALTER TABLE mudarraj.cmt_likes ADD CONSTRAINT mud_cmt_likes_cid_fkey FOREIGN KEY (cid) REFERENCES mudarraj.comments(id) ON DELETE CASCADE;
    ALTER TABLE mudarraj.cmt_likes ADD CONSTRAINT mud_cmt_likes_uid_fkey FOREIGN KEY (uid) REFERENCES public.users(id)     ON DELETE CASCADE;
    ALTER TABLE mudarraj.udoc      ADD CONSTRAINT mud_udoc_uid_fkey      FOREIGN KEY (uid) REFERENCES public.users(id)     ON DELETE CASCADE;
  END IF;
END $$;

-- لا يقرؤها أحدٌ من المتصفّح: الدالّةُ وحدها (بدور القاعدة)
ALTER TABLE mudarraj.tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mudarraj.courses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE mudarraj.course_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE mudarraj.posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mudarraj.likes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mudarraj.comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mudarraj.cmt_likes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mudarraj.udoc        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mudarraj.udoc_hist   ENABLE ROW LEVEL SECURITY;

-- نسخةُ كتالوج المدرج في ‎meta‎ المشتركة (‎comKey‎ في ‎_db.js‎)
INSERT INTO public.meta (k, v) VALUES ('catalog_rev:mudarraj', '0') ON CONFLICT (k) DO NOTHING;
