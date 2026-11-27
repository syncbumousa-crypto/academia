-- ROADMAP-HIVE · خ٢ — جداولُ الخلية (جامعة مانشستر) في مخطّطٍ مستقلّ، بنسخة ‎mudarraj‎ نفسها
-- إضافةٌ فقط: مخطّطٌ جديد وجداولُ فارغة، ولا يُمَسّ جدولٌ في ‎public‎ (المسلخ) ولا في ‎mudarraj‎ (المدرج).
-- والمشتركُ يبقى في ‎public‎: users · sessions · media · book_* · hits · errlog · meta · mcp_*.
-- ويُعاد تنفيذُه بلا ضرر (IF NOT EXISTS).

CREATE SCHEMA IF NOT EXISTS hive;

-- الكتالوج
CREATE TABLE IF NOT EXISTS hive.tags        (LIKE public.tags        INCLUDING ALL);
CREATE TABLE IF NOT EXISTS hive.courses     (LIKE public.courses     INCLUDING ALL);
CREATE TABLE IF NOT EXISTS hive.course_tags (LIKE public.course_tags INCLUDING ALL);

-- المحتوى
CREATE TABLE IF NOT EXISTS hive.posts     (LIKE public.posts     INCLUDING ALL);
CREATE TABLE IF NOT EXISTS hive.likes     (LIKE public.likes     INCLUDING ALL);
CREATE TABLE IF NOT EXISTS hive.comments  (LIKE public.comments  INCLUDING ALL);
CREATE TABLE IF NOT EXISTS hive.cmt_likes (LIKE public.cmt_likes INCLUDING ALL);
CREATE TABLE IF NOT EXISTS hive.udoc      (LIKE public.udoc      INCLUDING ALL);
CREATE TABLE IF NOT EXISTS hive.udoc_hist (LIKE public.udoc_hist INCLUDING ALL);

-- المفاتيحُ الأجنبيّة لا ينسخها ‎LIKE‎: تُعاد بأسمائها، والمستخدمُ من ‎public‎
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hive_course_tags_code_fkey') THEN
    ALTER TABLE hive.course_tags ADD CONSTRAINT hive_course_tags_code_fkey FOREIGN KEY (code)   REFERENCES hive.courses(code) ON DELETE CASCADE;
    ALTER TABLE hive.course_tags ADD CONSTRAINT hive_course_tags_tag_fkey  FOREIGN KEY (tag_id) REFERENCES hive.tags(id)      ON DELETE CASCADE;
    ALTER TABLE hive.posts     ADD CONSTRAINT hive_posts_uid_fkey     FOREIGN KEY (uid) REFERENCES public.users(id)     ON DELETE CASCADE;
    ALTER TABLE hive.likes     ADD CONSTRAINT hive_likes_pid_fkey     FOREIGN KEY (pid) REFERENCES hive.posts(id)   ON DELETE CASCADE;
    ALTER TABLE hive.likes     ADD CONSTRAINT hive_likes_uid_fkey     FOREIGN KEY (uid) REFERENCES public.users(id)     ON DELETE CASCADE;
    ALTER TABLE hive.comments  ADD CONSTRAINT hive_comments_pid_fkey  FOREIGN KEY (pid) REFERENCES hive.posts(id)   ON DELETE CASCADE;
    ALTER TABLE hive.comments  ADD CONSTRAINT hive_comments_uid_fkey  FOREIGN KEY (uid) REFERENCES public.users(id)     ON DELETE CASCADE;
    ALTER TABLE hive.cmt_likes ADD CONSTRAINT hive_cmt_likes_cid_fkey FOREIGN KEY (cid) REFERENCES hive.comments(id) ON DELETE CASCADE;
    ALTER TABLE hive.cmt_likes ADD CONSTRAINT hive_cmt_likes_uid_fkey FOREIGN KEY (uid) REFERENCES public.users(id)     ON DELETE CASCADE;
    ALTER TABLE hive.udoc      ADD CONSTRAINT hive_udoc_uid_fkey      FOREIGN KEY (uid) REFERENCES public.users(id)     ON DELETE CASCADE;
  END IF;
END $$;

-- لا يقرؤها أحدٌ من المتصفّح: الدالّةُ وحدها (بدور القاعدة)
ALTER TABLE hive.tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hive.courses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hive.course_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE hive.posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hive.likes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hive.comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hive.cmt_likes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hive.udoc        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hive.udoc_hist   ENABLE ROW LEVEL SECURITY;

-- نسخةُ كتالوج الخلية في ‎meta‎ المشتركة (‎comKey‎ في ‎_db.js‎)
INSERT INTO public.meta (k, v) VALUES ('catalog_rev:hive', '0') ON CONFLICT (k) DO NOTHING;
