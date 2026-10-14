/* ============================================================
   الجسر — واجهة D1 فوق بوستجرس
   ============================================================
   شيفرة الخادم كلها (١٬٨٤٠ سطرا في ١٣ ملفا) تنادي القاعدة بلغة D1:

       db.prepare('SELECT … WHERE id = ?').bind(id).first()
       db.batch([ … ])

   فبدل اعادة كتابتها، يقلد هذا الملف تلك الواجهة حرفا بحرف. فتُنقل النقاط
   كما هي، ولا يتغير الا مكان القاعدة.

   ===== وثلاثة فروق فقط بين اللهجتين =====
   ١ · علامة الاستفهام ⇐ $1 $2 $3      — ههنا (‎qmarks‎)
   ٢ · BLOB ⇐ BYTEA                    — في مخطط الجداول
   ٣ · INTEGER PRIMARY KEY ⇐ BIGSERIAL — في مخطط الجداول
   وما عداه يعمل في الاثنين: ‎ON CONFLICT … DO UPDATE … RETURNING‎ و‎||‎ للربط.

   ===== وعلامة الاستفهام لا تُبدل عمياء =====
   في الشيفرة نصوص فيها علامة استفهام داخل اقتباس (رسائل عربية، وانماط LIKE).
   فلو بُدل كل ‎?‎ لفسد النص وانزاح ترقيم المعاملات كله بعده. فيُمشى على الجملة
   حرفا حرفا، ويُعرف ما داخل الاقتباس مما خارجه.

   ===== ولا يُفتح اتصال لكل نداء =====
   سائق نيون يعمل على HTTP لا على مقبس دائم، فهو يناسب الدوال التي تموت بعد
   كل طلب. ولا يحتاج تجميع اتصالات ولا اغلاقا. */

import postgres from 'npm:postgres@3.4.5';

let _sql = null;

/* ===== والعدد يجب ان يرجع عددا =====
   بوستجرس يرد ‎BIGINT‎ (و‎COUNT(*)‎ منه) **نصا** لا رقما، لان جافاسكربت لا
   تسع كل قيمه بامان. وسِكوَيْل كان يردها رقما. والفرق يمر صامتا ثم يكسر:
     · ‎ts: "1787877130325"‎ بدل رقم ⇒ كل موازنة تاريخ في العميل تكذب
     · ‎!!"0"‎ = ‎true‎ ⇒ «اعجبتني» تظهر مضيئة لمن لم يعجب بها
   والثانية اخطر: لا تصيح، وتبدو صحيحة.

   وقيمنا كلها اصغر من حد الامان (٩ كوادرليون): الطوابع بالمللي ١٫٨ تريليون،
   والاعداد عشرات. فيُقرا ‎int8‎ رقما، ويبقى ما سواه على اصله.

   وخيار ‎types‎ في السائق جُرّب فلم يُطبَّق — بقيت القيم نصا. فالتحويل ههنا
   على ما يقوله الخادم نفسه: ‎fullResults‎ يرد مع الصفوف **انواع الاعمدة**
   (‎dataTypeID‎)، فلا يُخمَّن نوع ولا يُحوَّل نص بريء لانه يشبه الرقم.
   (و‎int2‎/‎int4‎ يردهما السائق رقمين اصلا — ‎int8‎ وحده الشاذ.) */
const INT8 = 20;

/** الاتصال يُنشا مرة واحدة في عمر النسخة الحية */
function sql() {
  if (_sql) return _sql;
  const url = Deno.env.get('SUPABASE_DB_URL') || Deno.env.get('DATABASE_URL');
  if (!url) throw new Error('SUPABASE_DB_URL is missing');
  /* The pooler speaks the wire protocol, so prepared statements are off. */
  const pg = postgres(url, { prepare: false, max: 3, idle_timeout: 20 });
  const shape = r => ({
    rows: Array.from(r),
    fields: (r.columns || []).map(c => ({ name: c.name, dataTypeID: c.type })),
    rowCount: (r.count !== undefined ? r.count : r.length) | 0,
  });
  _sql = {
    /* Returns a thenable, not a promise: awaited alone it runs at once, and
       batch() keeps the list unawaited so transaction() can replay it inside
       one transaction. This is how the Neon driver behaved. */
    query(text, args) {
      const d = { text, args: args || [] };
      d.then = (ok, no) => pg.unsafe(text, d.args).then(shape).then(ok, no);
      return d;
    },
    async transaction(list) {
      return await pg.begin(async tx => {
        const out = [];
        for (const d of list) out.push(shape(await tx.unsafe(d.text, d.args)));
        return out;
      });
    },
  };
  return _sql;
}


/** يرد الصفوف بعد رد ‎int8‎ الى رقم — بشهادة الخادم لا بالتخمين */
function cast(res) {
  const rows = (res && res.rows) || [];
  const big = ((res && res.fields) || []).filter(f => f.dataTypeID === INT8).map(f => f.name);
  if (big.length) {
    for (const r of rows) {
      for (const k of big) if (r[k] !== null && r[k] !== undefined) r[k] = Number(r[k]);
    }
  }
  return rows;
}

/* ============================================================
   تحويل علامات الاستفهام
   ============================================================
   يُمشى حرفا حرفا لان الاقتباس يخفي علامات ليست معاملات:
     · اقتباس مفرد، والمضاعف داخله ('') هروب لا اغلاق
     · اقتباس مضاعف: معرف مقتبس
     · شرطتان: تعليق حتى اخر السطر
     · تعليق كتلة على نمط سي
   وما خرج عن هذا كله فهو معامل يُرقم. */
export function qmarks(q) {
  let out = '';
  let n = 0;
  for (let i = 0; i < q.length; i++) {
    const c = q[i];

    if (c === "'" || c === '"') {
      const quote = c;
      out += c;
      i++;
      while (i < q.length) {
        if (q[i] === quote) {
          if (q[i + 1] === quote) { out += quote + quote; i += 2; continue; }  /* هروب */
          break;
        }
        out += q[i];
        i++;
      }
      out += quote;
      continue;
    }

    if (c === '-' && q[i + 1] === '-') {
      while (i < q.length && q[i] !== '\n') { out += q[i]; i++; }
      out += q[i] === undefined ? '' : '\n';
      continue;
    }

    if (c === '/' && q[i + 1] === '*') {
      out += '/*';
      i += 2;
      while (i < q.length && !(q[i] === '*' && q[i + 1] === '/')) { out += q[i]; i++; }
      out += '*/';
      i++;
      continue;
    }

    if (c === '?') { out += '$' + (++n); continue; }

    out += c;
  }
  return { text: out, n };
}

/* ============================================================
   الواجهة
   ============================================================ */

/* ===== والبِتات تُمرَّر بِتاتٍ لا كائنًا =====
   سائقُ نيون يُرسل المعاملاتِ على HTTP **مسلسَلةً بـJSON**. و‎ArrayBuffer‎ ليس له
   في JSON صورةٌ إلّا ‎{}‎ — فتُخزَّن الصورةُ بايتين اثنين، ويردّ المستودعُ
   ‎{}‎ بترويسةِ ‎image/jpeg‎: صورةٌ مكسورةٌ **بلا خطأ في أيّ طرف**.
   و‎request.arrayBuffer()‎ هو ما يعطيه الخادمُ لرفع الصور، فالتحويلُ ههنا لا في
   النقطة — النقطةُ تبقى كما هي في كلاودفلير، والجسرُ يبتلع فرقَ اللهجة.
   (و‎Buffer‎ يعرفه السائقُ فيكتبه ‎bytea‎ صحيحًا — وبه نُقلت الستَّ عشرةَ الأولى.) */
const asArg = v => {
  if (v instanceof ArrayBuffer) return Buffer.from(new Uint8Array(v));
  if (ArrayBuffer.isView(v) && !(v instanceof DataView)) {
    return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
  }
  return v;
};

class Stmt {
  constructor(query, args) {
    this.query = query;
    this.args = (args || []).map(asArg);
  }

  /** يُرد جديد لا يُبدل القائم: ‎prepare‎ واحدة قد تُربط مرارا */
  bind(...args) {
    return new Stmt(this.query, args);
  }

  async _run() {
    const { text, n } = qmarks(this.query);
    if (n !== this.args.length) {
      throw new Error(
        'عدد المعاملات لا يطابق: الجملة تنتظر ' + n + ' وجاءها ' + this.args.length +
        '  ⇦ ' + this.query.slice(0, 90));
    }
    return sql().query(text, this.args);
  }

  /** اول صف او ‎null‎ — كما ترد D1 تماما */
  async first(col) {
    const rows = cast(await this._run());
    const r = rows.length ? rows[0] : null;
    if (!r) return null;
    return col === undefined ? r : r[col];
  }

  /** ‎{ results, success, meta }‎ — الشكل الذي تنتظره الشيفرة */
  async all() {
    const res = await this._run();
    const rows = cast(res);
    return { results: rows, success: true, meta: { rows_read: rows.length } };
  }

  async run() {
    const res = await this._run();
    const rows = cast(res);
    /* و‎changes‎ ما غيّره الخادمُ فعلا، لا عددُ ما ردّه:
       ‎DELETE‎ بلا ‎RETURNING‎ يردّ صفرَ صفوفٍ وقد محا مئة. */
    return { success: true, results: rows, meta: { changes: res.rowCount | 0 } };
  }
}

export const db = {
  prepare(query) {
    return new Stmt(query, []);
  },

  /* ===== والدفعة صفقة =====
     في D1 تقع ‎batch‎ كلها او لا تقع. وبوستجرس يعطي المعنى نفسه بـ‎transaction‎.
     ولولاها لوقعت لحظة يكون فيها الكتالوج نصفه ممحو ونصفه مكتوب. */
  async batch(stmts) {
    const list = stmts.map(s => {
      const { text, n } = qmarks(s.query);
      if (n !== s.args.length) {
        throw new Error('دفعة: عدد المعاملات لا يطابق ⇦ ' + s.query.slice(0, 90));
      }
      return sql().query(text, s.args);
    });
    const res = await sql().transaction(list);
    return (res || []).map(r => ({ results: cast(r), success: true, meta: { changes: r.rowCount | 0 } }));
  },
};

export default db;
