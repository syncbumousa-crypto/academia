#!/usr/bin/env node
/*
 * استخراج المقررات المطروحة من إديوقيت جامعة الملك سعود (صفحات الزوار فقط، بدون تسجيل دخول).
 *
 *   node scrape.js                 كل المراحل: القوائم (عربي ثم إنجليزي) ثم تفاصيل الشعب ثم البناء
 *   node scrape.js --phase lists   قوائم الشعب فقط (سريعة)
 *   node scrape.js --phase details تفاصيل الشعب (المحاضر/الأيام/الوقت/القاعة) — طلب لكل شعبة
 *   node scrape.js --phase build   بناء offering.json من ملفات الـ checkpoint بدون أي طلبات
 *
 * خيارات: --degrees 4  --campuses 1,11  --langs ar,en  --limit-majors N  --delay 1100
 *
 * لازم يشتغل من داخل السعودية (السيرفر يقطع الاتصال من الخارج). يحتاج Node 18+ وبدون أي مكتبات.
 * الـ checkpoint في ‎.state/‎ : لو انقطع، أعد تشغيل نفس الأمر ويكمل من مكانه.
 * لبداية فصل جديد: احذف مجلد ‎.state/‎ ثم شغّل.
 *
 * كيف يشتغل الموقع (JSF، ViewState على السيرفر):
 *   1) scheduleTreeCoursesIndex.faces : قائمتا «المقر» و«الدرجة العلمية» + شجرة كلية ← قسم ← تخصص.
 *   2) اختيار تخصص (myForm:indexs = "c_d_m") ينقل لـ scheduleCoursesIndex.faces، وزر «إبحث» يرجّع
 *      جدول كل شعب مقررات خطة التخصص (رمز، اسم، شعبة، نشاط، ساعات، جنس، حالة).
 *   3) تفاصيل الشعبة: POST /ksu/ajaxGetSectionAllocationsServlet?courseIndex=<رقم الصف>&campusCode=<المقر>
 *      يرجّع نص (windows-1256) مفصول بـ "#__#": حجز الشعبة، المحاضر، يوم/وقت/تاريخ الاختبار، الأوقات.
 *   «البحث المتقدم» فيه كابتشا، فما نستخدمه.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const BASE = 'https://edugate.ksu.edu.sa';
const TREE = '/ksu/ui/guest/timetable/index/scheduleTreeCoursesIndex.faces';
const COURSES = '/ksu/ui/guest/timetable/index/scheduleCoursesIndex.faces';
const DETAILS = '/ksu/ajaxGetSectionAllocationsServlet';
const HOME = '/ksu/init';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const DIR = __dirname;
const STATE = path.join(DIR, '.state');
const F_LISTS = path.join(STATE, 'lists.jsonl');
const F_DETAILS = path.join(STATE, 'details.jsonl');
const F_META = path.join(STATE, 'meta.json');
const F_OUT = path.join(DIR, 'offering.json');
const F_SUMMARY = path.join(DIR, 'summary.json');

// ---------- args ----------
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) args[a.slice(2)] = (process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) ? process.argv[++i] : '1';
}
const PHASE = args.phase || 'all';
const DEGREES = (args.degrees || '4').split(',');
const CAMPUSES = args.campuses ? args.campuses.split(',') : null; // null = كل المقرات
const LANGS = (args.langs || 'ar,en').split(',');
const LIMIT = args['limit-majors'] ? +args['limit-majors'] : Infinity;
const DELAY = Math.max(1000, +(args.delay || 1100));

class Blocked extends Error {}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ---------- HTTP (تسلسلي، طلب كل DELAY ms) ----------
let lastReq = 0;
let reqCount = 0;
class Session {
  constructor() { this.jar = new Map(); }
  cookie() { return [...this.jar].map(([k, v]) => `${k}=${v}`).join('; '); }
  async req(method, url, body, referer) {
    let lastErr;
    for (let attempt = 1; attempt <= 4; attempt++) {
      const wait = lastReq + DELAY - Date.now();
      if (wait > 0) await sleep(wait);
      lastReq = Date.now();
      reqCount++;
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 180000);
      try {
        const headers = { 'User-Agent': UA, 'Accept-Language': 'ar,en;q=0.8', Cookie: this.cookie() };
        if (referer) headers.Referer = BASE + referer;
        let payload;
        if (method === 'POST') {
          headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
          payload = body ? new URLSearchParams(body).toString() : '';
        }
        const res = await fetch(BASE + url, { method, headers, body: payload, redirect: 'manual', signal: ctl.signal });
        for (const c of res.headers.getSetCookie()) {
          const m = c.match(/^([^=]+)=([^;]*)/);
          if (m) this.jar.set(m[1], m[2]);
        }
        if (res.status >= 300 && res.status < 400) {
          const loc = new URL(res.headers.get('location'), BASE + url);
          clearTimeout(timer);
          if (loc.hostname !== new URL(BASE).hostname) throw new Blocked(`تحويل لموقع خارجي: ${loc.origin}`);
          if (/login|sso|iam/i.test(loc.pathname)) throw new Blocked(`تحويل لصفحة دخول: ${loc.pathname}`);
          return await this.req('GET', loc.pathname + loc.search, null, url);
        }
        const buf = Buffer.from(await res.arrayBuffer());
        clearTimeout(timer);
        if ([401, 403, 429].includes(res.status)) throw new Blocked(`HTTP ${res.status} على ${url}`);
        let text;
        try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { text = new TextDecoder('windows-1256').decode(buf); }
        if (/Request Rejected|The requested URL was rejected/i.test(text)) throw new Blocked('جدار الحماية رفض الطلب (Request Rejected)');
        if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
        return text;
      } catch (e) {
        clearTimeout(timer);
        if (e instanceof Blocked) throw e;
        lastErr = e;
        log(`  ! محاولة ${attempt} فشلت (${e.message}) ${url}`);
        await sleep(5000 * attempt);
      }
    }
    throw lastErr;
  }
}

// ---------- parsing ----------
const decodeEnt = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const clean = (s) => decodeEnt(String(s).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const viewState = (html, formId = 'myForm') => {
  const i = html.indexOf(`<form id="${formId}"`);
  const m = html.slice(i < 0 ? 0 : i).match(/name="javax\.faces\.ViewState"[^>]*value="([^"]*)"/);
  if (!m) throw new Error('ما لقيت ViewState (الجلسة انتهت؟)');
  return m[1];
};
const selectOptions = (html, id) => {
  const m = html.match(new RegExp(`<select id="${id}"[^>]*>([\\s\\S]*?)</select>`));
  if (!m) return [];
  return [...m[1].matchAll(/<option value="([^"]*)"( selected="selected")?>([^<]*)<\/option>/g)].map((o) => ({ value: o[1], selected: !!o[2], label: clean(o[3]) }));
};
const spanText = (html, id) => { const m = html.match(new RegExp(`<span id="${id}"[^>]*>([\\s\\S]*?)</span>`)); return m ? clean(m[1]) : ''; };

function parseTree(html) {
  const nodes = new Map();
  for (const m of html.matchAll(/tree\.add\((\d+),\s*(-?\d+),\s*'((?:[^'\\]|\\.)*)'(?:,\s*(?:'([^']*)'|"([^"]*)"))?\)/g)) {
    nodes.set(+m[1], { id: +m[1], parent: +m[2], name: clean(m[3].replace(/\\'/g, "'")), href: m[4] || m[5] || '' });
  }
  const leaves = [];
  for (const n of nodes.values()) {
    const idx = n.href.match(/setIndex\('([^']+)'\)/);
    if (!idx) continue;
    const dept = nodes.get(n.parent) || {};
    const college = nodes.get(dept.parent) || {};
    leaves.push({ index: idx[1], major: n.name, dept: dept.name || '', college: college.name || '' });
  }
  return leaves;
}

function parseRows(html) {
  const i = html.indexOf('id="myForm:timetable"');
  if (i < 0) return null;
  const j = html.indexOf('</table>', i);
  const rows = [];
  for (const tr of html.slice(i, j).split(/<tr[ >]/).slice(1)) {
    const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    if (tds.length < 8) continue;
    const idx = tds[7].match(/showToolTipDilaog\(event,\s*'(\d+)'\)/);
    const camp = tds[7].match(/campusDet"[^>]*value="([^"]*)"/);
    rows.push({ idx: idx ? +idx[1] : rows.length, code: clean(tds[0]), name: clean(tds[1]), no: clean(tds[2]), type: clean(tds[3]), h: clean(tds[4]), gender: clean(tds[5]), status: clean(tds[6]), campus: camp ? camp[1] : '' });
  }
  return rows;
}

const to24 = (t) => {
  const m = t.match(/(\d{1,2}):(\d{2})\s*(ص|م|AM|PM)?/i);
  if (!m) return t.trim();
  let h = +m[1];
  const ap = (m[3] || '').toUpperCase();
  if ((ap === 'م' || ap === 'PM') && h < 12) h += 12;
  if ((ap === 'ص' || ap === 'AM') && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
};
function parseDetails(text) {
  const p = text.split('#__#');
  if (p.length < 6) return null;
  const dash = (s) => { s = clean(s); return /^-+$/.test(s) ? '' : s; };
  const meetings = [];
  for (const part of p[5].split('@n')) {
    if (!part.trim()) continue;
    const [dt, room = ''] = part.split('@r');
    const [d = '', t = ''] = dt.split('@t');
    const tt = t.split(' - ');
    meetings.push({ days: (d.match(/\d/g) || []).map(Number), time: tt.length === 2 ? `${to24(tt[0])}-${to24(tt[1])}` : clean(t), room: clean(room) });
  }
  // الكليات/الأقسام الحاجزة للشعبة: جدول HTML
  const alloc = [];
  const body = p[0].match(/<tbody>([\s\S]*?)<\/tbody>/);
  if (body) for (const tr of body[1].split(/<tr/).slice(1)) {
    const c = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/+td>/g)].map((m) => dash(m[1]));
    if (c.some(Boolean)) alloc.push(c);
  }
  const exam = { day: dash(p[2]), time: dash(p[3]), date: dash(p[4]) };
  return { instructor: dash(p[1]), meetings, exam: (exam.day || exam.date) ? exam : null, alloc };
}

// ---------- checkpoint ----------
const readJsonl = (f) => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];
const appendJsonl = (f, o) => fs.appendFileSync(f, JSON.stringify(o) + '\n');
const loadMeta = () => fs.existsSync(F_META) ? JSON.parse(fs.readFileSync(F_META, 'utf8')) : { started: new Date().toISOString(), term: {}, campuses: {}, degrees: {}, trees: {}, problems: [] };
const saveMeta = (m) => fs.writeFileSync(F_META, JSON.stringify(m, null, 1));

// ---------- navigation ----------
async function openSession(lang) {
  const s = new Session();
  if (lang === 'en') {
    const home = await s.req('GET', HOME);
    const link = home.match(/\{'(j_id_id\d+)':'\1'\},''\);return false"[^>]*>\s*English/);
    const act = home.match(/<form id="loginForm"[^>]*action="([^"]*)"/);
    if (!link || !act) throw new Error('ما لقيت رابط English في الصفحة الرئيسية');
    // تبديل اللغة فقط: نرسل الحقول المخفية ورابط اللغة، وما نرسل أي بيانات دخول.
    const i = home.indexOf('<form id="loginForm"');
    const form = home.slice(i, home.indexOf('</form>', i));
    const body = {};
    for (const m of form.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
      const n = m[0].match(/name="([^"]*)"/), v = m[0].match(/value="([^"]*)"/);
      if (n) body[n[1]] = v ? decodeEnt(v[1]) : '';
    }
    // حقول النموذج النصية تُرسل فارغة كما يرسلها المتصفح (بدون أي بيانات دخول)
    for (const m of form.matchAll(/<input[^>]*type="(?:text|password)"[^>]*>/g)) { const n = m[0].match(/name="([^"]*)"/); if (n) body[n[1]] = ""; }
    body[link[1]] = link[1];
    await s.req('POST', act[1], body, act[1]);
  }
  return s;
}

// يفتح الشجرة على المقر/الدرجة المطلوبة ويرجّع الصفحة
async function openTree(s, campus, degree) {
  let html = await s.req('GET', TREE);
  if (/jcaptcha|captchaImage/i.test(html)) throw new Blocked('ظهرت كابتشا في صفحة الشجرة');
  const cur = (id) => (selectOptions(html, id).find((o) => o.selected) || {}).value;
  if (campus && degree && (cur('myForm:select2') !== campus || cur('myForm:select1') !== degree)) {
    // المقر أولاً ثم الدرجة (قائمة الدرجات تتغير حسب المقر)
    if (cur('myForm:select2') !== campus) {
      html = await s.req('POST', TREE, { myForm: 'myForm', 'myForm:indexs': '', 'myForm:select2': campus, 'myForm:select1': cur('myForm:select1') || degree, 'javax.faces.ViewState': viewState(html) }, TREE);
    }
    if (cur('myForm:select1') !== degree) {
      if (!selectOptions(html, 'myForm:select1').some((o) => o.value === degree)) return { html, missing: true };
      html = await s.req('POST', TREE, { myForm: 'myForm', 'myForm:indexs': '', 'myForm:select2': campus, 'myForm:select1': degree, 'javax.faces.ViewState': viewState(html) }, TREE);
    }
    if (cur('myForm:select2') !== campus || cur('myForm:select1') !== degree) throw new Error(`ما تغيّر المقر/الدرجة (${campus}/${degree})`);
  }
  return { html };
}

// يفتح تخصصاً ويضغط «إبحث» ويرجّع الصفوف
async function searchLeaf(s, treeHtml, campus, degree, leaf) {
  const page = await s.req('POST', TREE, { myForm: 'myForm', 'myForm:indexs': leaf.index, 'myForm:select2': campus, 'myForm:select1': degree, 'javax.faces.ViewState': viewState(treeHtml), 'myForm:commandLink': 'myForm:commandLink' }, TREE);
  if (!page.includes('myForm:searchTimeCmd')) throw new Error('ما فتحت صفحة التخصص');
  if (/jcaptcha|captchaImage/i.test(page)) throw new Blocked('ظهرت كابتشا في صفحة التخصص');
  const shown = spanText(page, 'myForm:majorDesc');
  const res = await s.req('POST', COURSES, { myForm: 'myForm', 'myForm:courseCodeId': '', 'myForm:courseNameId': '', 'myForm:tableItem': '0', 'myForm:sectionTypeItem': '0', 'myForm:sectionStatusItem': '-1', 'javax.faces.ViewState': viewState(page), 'myForm:searchTimeCmd': 'myForm:searchTimeCmd' }, COURSES);
  return { rows: parseRows(res) || [], shown, college: spanText(page, 'myForm:facultyDesc'), dept: spanText(page, 'myForm:deptName') };
}

// ---------- phases ----------
async function phaseLists(lang) {
  const meta = loadMeta();
  const done = new Set(readJsonl(F_LISTS).filter((r) => r.lang === lang).map((r) => `${r.campus}|${r.degree}|${r.leaf}`));
  let s = await openSession(lang);
  const first = await openTree(s);
  const term = spanText(first.html, 'regSemester');
  meta.term[lang] = term;
  const campuses = selectOptions(first.html, 'myForm:select2');
  if (lang === 'en' && campuses.length && /[؀-ۿ]/.test(campuses.map((c) => c.label).join(''))) log('  ! تنبيه: الواجهة ما تحولت للإنجليزية بالكامل');
  meta.campuses[lang] = Object.fromEntries(campuses.map((c) => [c.value, c.label]));
  saveMeta(meta);
  log(`[${lang}] الفصل: ${term} — المقرات: ${campuses.length}`);
  let n = 0;
  for (const camp of campuses) {
    if (CAMPUSES && !CAMPUSES.includes(camp.value)) continue;
    for (const degree of DEGREES) {
      const t = await openTree(s, camp.value, degree);
      if (t.missing) { log(`[${lang}] ${camp.label}: الدرجة ${degree} غير متاحة`); continue; }
      meta.degrees[lang] = Object.fromEntries(selectOptions(t.html, 'myForm:select1').map((o) => [o.value, o.label]));
      const leaves = parseTree(t.html);
      meta.trees[`${lang}|${camp.value}|${degree}`] = leaves;
      saveMeta(meta);
      log(`[${lang}] ${camp.label} / ${degree}: ${leaves.length} تخصص`);
      for (const leaf of leaves) {
        const key = `${camp.value}|${degree}|${leaf.index}`;
        if (done.has(key)) continue;
        if (n++ >= LIMIT) return;
        let out;
        for (let attempt = 1; ; attempt++) {
          try {
            const tr = attempt === 1 && leaf === leaves[0] ? t : await openTree(s, camp.value, degree);
            out = await searchLeaf(s, tr.html, camp.value, degree, leaf);
            break;
          } catch (e) {
            if (e instanceof Blocked || attempt >= 3) throw e;
            log(`  ! ${leaf.major}: ${e.message} — جلسة جديدة`);
            await sleep(10000); s = await openSession(lang);
          }
        }
        appendJsonl(F_LISTS, { lang, campus: camp.value, degree, leaf: leaf.index, college: leaf.college, dept: leaf.dept, major: leaf.major, rows: out.rows.map((r) => [r.code, r.name, r.no, r.type, r.h, r.gender, r.status, r.campus]) });
        done.add(key);
        log(`[${lang}] ${camp.label} › ${leaf.college} › ${leaf.major}: ${out.rows.length} شعبة`);
      }
    }
  }
}

async function phaseDetails() {
  const meta = loadMeta();
  const have = new Set(readJsonl(F_DETAILS).map((d) => d.key));
  const lists = readJsonl(F_LISTS).filter((r) => r.lang === 'ar' && (!CAMPUSES || CAMPUSES.includes(r.campus)) && DEGREES.includes(r.degree));
  const all = new Set();
  for (const l of lists) for (const r of l.rows) all.add(`${r[7]}:${r[2]}`);
  log(`تفاصيل: ${all.size} شعبة فريدة، منها ${[...all].filter((k) => have.has(k)).length} جاهزة`);
  let s = await openSession('ar');
  let n = 0;
  for (const l of lists) {
    if (!l.rows.some((r) => !have.has(`${r[7]}:${r[2]}`))) continue;
    if (n++ >= LIMIT) return;
    let rows;
    for (let attempt = 1; ; attempt++) {
      try {
        const t = await openTree(s, l.campus, l.degree);
        const leaf = parseTree(t.html).find((x) => x.index === l.leaf && x.major === l.major);
        if (!leaf) { meta.problems.push(`التخصص ${l.major} (${l.campus}) اختفى من الشجرة`); saveMeta(meta); rows = []; break; }
        rows = (await searchLeaf(s, t.html, l.campus, l.degree, leaf)).rows;
        break;
      } catch (e) {
        if (e instanceof Blocked || attempt >= 3) throw e;
        log(`  ! ${l.major}: ${e.message} — جلسة جديدة`);
        await sleep(10000); s = await openSession('ar');
      }
    }
    let got = 0;
    for (const r of rows) {
      const key = `${r.campus}:${r.no}`;
      if (have.has(key)) continue;
      let d = null;
      for (let attempt = 1; attempt <= 3 && !d; attempt++) {
        const txt = await s.req('POST', `${DETAILS}?courseIndex=${r.idx}&campusCode=${encodeURIComponent(r.campus)}`, null, COURSES);
        if (/jcaptcha|captchaImage/i.test(txt)) throw new Blocked('ظهرت كابتشا في تفاصيل الشعبة');
        d = parseDetails(txt);
        if (!d) { log(`  ! رد غير متوقع للشعبة ${r.no}: ${txt.slice(0, 80)}`); await sleep(5000 * attempt); }
      }
      if (!d) { meta.problems.push(`تفاصيل الشعبة ${key} ما رجعت`); saveMeta(meta); break; } // الأرجح الجلسة انتهت؛ نعيد التخصص في التشغيل القادم
      appendJsonl(F_DETAILS, { key, ...d });
      have.add(key); got++;
    }
    log(`تفاصيل ${l.college} › ${l.major} (${meta.campuses.ar?.[l.campus] || l.campus}): +${got} — المجموع ${have.size}/${all.size}`);
  }
}

// ---------- build ----------
const normCode = (raw) => {
  const glued = raw.match(/^([A-Za-z]+)\s*(\d\S*)$/); // الإنجليزي يجي ملتصق: ARAB101
  if (glued) return `${glued[1].toUpperCase()} ${glued[2]}`;
  const t = raw.split(' ').filter(Boolean);
  const num = t.filter((x) => /^\d/.test(x));
  const pre = t.filter((x) => !/^\d/.test(x));
  return pre.length && num.length ? `${pre.join(' ')} ${num.join(' ')}` : raw;
};
const prefixOf = (code) => code.replace(/\s*\d.*$/, '');
const mode = (arr) => { const c = new Map(); let best = '', bn = 0; for (const x of arr) { if (!x) continue; const n = (c.get(x) || 0) + 1; c.set(x, n); if (n > bn) { bn = n; best = x; } } return best; };

function build() {
  const meta = loadMeta();
  const lists = readJsonl(F_LISTS);
  const details = new Map(readJsonl(F_DETAILS).map((d) => [d.key, d]));
  const en = new Map(); // key -> {code,name,type}
  for (const l of lists) if (l.lang === 'en') for (const r of l.rows) en.set(`${r[7]}:${r[2]}`, { code: normCode(r[0]), name: r[1] });
  const courses = new Map();
  const plansSeen = new Set();
  for (const l of lists) {
    if (l.lang !== 'ar') continue;
    plansSeen.add(`${l.college}|${l.dept}|${l.major}`);
    for (const r of l.rows) {
      const arCode = normCode(r[0]);
      let c = courses.get(arCode);
      if (!c) courses.set(arCode, c = { ar_code: arCode, names: [], hs: [], secs: new Map(), plans: new Map() });
      c.names.push(r[1]);
      if (r[4]) c.hs.push(r[4]);
      c.plans.set(`${l.college}|${l.dept}|${l.major}`, { college: l.college, dept: l.dept, major: l.major });
      const key = `${r[7]}:${r[2]}`;
      if (!c.secs.has(key)) c.secs.set(key, { no: r[2], type: r[3], gender: r[5], status: r[6], campus: r[7] });
    }
  }
  // مالك الرمز: القسم اللي خططه فيها أكبر عدد من مقررات هذا الرمز (استنتاج، لأن الشجرة مرتبة بالخطط لا بالقسم المالك)
  const owner = new Map();
  for (const c of courses.values()) {
    const p = prefixOf(c.ar_code);
    let m = owner.get(p); if (!m) owner.set(p, m = new Map());
    const seen = new Set();
    for (const pl of c.plans.values()) { const k = `${pl.college}|${pl.dept}`; if (!seen.has(k)) { seen.add(k); m.set(k, (m.get(k) || 0) + 1); } }
  }
  const ownerOf = (p) => { const m = owner.get(p); let best = '|', bn = 0; for (const [k, n] of m) if (n > bn) { bn = n; best = k; } return best.split('|'); };
  const term = meta.term.ar || '';
  const out = [];
  let withInstr = 0, secTotal = 0, secDetailed = 0;
  for (const c of courses.values()) {
    const keys = [...c.secs.keys()];
    const code = mode(keys.map((k) => en.get(k)?.code).filter((x) => x && !/[؀-ۿ]/.test(x)));
    const enName = mode(keys.map((k) => en.get(k)?.name).filter((x) => x && !/[؀-ۿ]/.test(x)));
    const [college, dept] = ownerOf(prefixOf(c.ar_code));
    const sections = keys.map((k) => {
      const s = c.secs.get(k), d = details.get(k);
      secTotal++;
      const o = { no: s.no, type: s.type, instructor: null, days: null, time: null, room: null, gender: s.gender, status: s.status, campus: meta.campuses.ar?.[s.campus] || s.campus };
      if (d) {
        secDetailed++;
        const instr = d.instructor && !d.instructor.startsWith("لم يحدد") ? d.instructor : null; // «لم يحدد من الكلية» = ما تعيّن محاضر
        if (instr) withInstr++;
        const uniq = (a) => [...new Set(a.filter(Boolean))];
        o.instructor = instr;
        o.days = [...new Set(d.meetings.flatMap((m) => m.days))].sort();
        o.time = uniq(d.meetings.map((m) => m.time)).join(' | ') || null;
        o.room = uniq(d.meetings.map((m) => m.room)).join(' | ') || null;
        if (d.meetings.length > 1) o.meetings = d.meetings;
        if (d.exam) o.exam = d.exam;
      }
      return o;
    }).sort((a, b) => a.campus.localeCompare(b.campus, 'ar') || (+a.no - +b.no));
    out.push({ code: code || null, ar_code: c.ar_code, ar: mode(c.names), en: enName || null, h: c.hs.length ? +mode(c.hs) : null, college, dept, term, plans: [...c.plans.values()], sections });
  }
  out.sort((a, b) => (a.code || '~' + a.ar_code).localeCompare(b.code || '~' + b.ar_code));
  fs.writeFileSync(F_OUT, JSON.stringify(out, null, 1));
  const arLists = lists.filter((l) => l.lang === 'ar');
  const summary = {
    built: new Date().toISOString(), term, term_en: meta.term.en || null,
    campuses_scraped: [...new Set(arLists.map((l) => meta.campuses.ar?.[l.campus] || l.campus))],
    degrees_scraped: [...new Set(arLists.map((l) => meta.degrees.ar?.[l.degree] || l.degree))],
    colleges: new Set(arLists.map((l) => l.college)).size,
    depts: new Set(arLists.map((l) => `${l.college}|${l.dept}`)).size,
    majors: plansSeen.size,
    majors_empty: arLists.filter((l) => !l.rows.length).map((l) => `${meta.campuses.ar?.[l.campus] || l.campus} › ${l.college} › ${l.major}`),
    courses: out.length, courses_with_en_code: out.filter((c) => c.code).length, courses_with_en_name: out.filter((c) => c.en).length,
    sections: secTotal, sections_with_details: secDetailed, sections_with_instructor: withInstr,
    problems: meta.problems,
  };
  fs.writeFileSync(F_SUMMARY, JSON.stringify(summary, null, 1));
  log('بناء:', JSON.stringify({ ...summary, majors_empty: summary.majors_empty.length, problems: summary.problems.length }));
}

// ---------- main ----------
(async () => {
  fs.mkdirSync(STATE, { recursive: true });
  try {
    if (PHASE === 'all' || PHASE === 'lists') for (const lang of LANGS) await phaseLists(lang);
    if (PHASE === 'all' || PHASE === 'details') await phaseDetails();
    build();
    log(`تم. عدد الطلبات: ${reqCount}`);
  } catch (e) {
    try { build(); } catch (_) { /* نبني اللي عندنا */ }
    if (e instanceof Blocked) { console.error(`\n*** توقفت: حظر/كابتشا — ${e.message}\n*** لا تعيد التشغيل قبل ما تراجع الوضع.`); process.exit(2); }
    console.error(`\n*** خطأ: ${e.stack || e}\n*** أعد تشغيل نفس الأمر ويكمل من الـ checkpoint.`); process.exit(1);
  }
})();
