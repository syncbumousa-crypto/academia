/* ============================================================
   ‎/api/mcp‎ — موصّلُ Claude وChatGPT (ROADMAP-MCP)
   ============================================================
   بروتوكولُ MCP (Streamable HTTP، ردٌّ بـJSON بلا SSE) ودخولُه OAuth 2.1 بـPKCE.

     POST /api/mcp                                   ⇐ JSON-RPC (يلزمه رمزُ دخول)
     GET  /api/mcp/.well-known/oauth-protected-resource
     GET  /api/mcp/.well-known/oauth-authorization-server · openid-configuration
     POST /api/mcp/oauth/register                    ⇐ تسجيلُ عميلٍ (ChatGPT وغيرُه)
     GET  /api/mcp/oauth/authorize                   ⇐ يحوّل إلى صفحة الموافقة في الموقع
     GET  /api/mcp/oauth/client?client_id=           ⇐ اسمُ العميل لصفحة الموافقة
     POST /api/mcp/oauth/approve                     ⇐ (جلسةُ الموقع) يصنع رمزَ التفويض
     POST /api/mcp/oauth/token                       ⇐ رمزُ الدخول والتجديد
     GET  /api/mcp/oauth/links                       ⇐ (جلسةُ الموقع) ما رُبط بحسابي
     POST /api/mcp/oauth/revoke                      ⇐ (جلسةُ الموقع) إلغاءُ ربط
     GET  /api/mcp/inbox  · POST /api/mcp/inbox {done:[ids]} ⇐ (جلسةُ الموقع) ما كتبه المساعدُ ولم يُدمج

   ===== وما يكتبه المساعدُ لا يُكتب في المساهمة =====
   المتصفّحُ يعدّ نسختَه أصلًا ويدفعها كاملة، فيمحو ما كُتب في ‎posts‎ من غيره. فيُكتب في ‎mcp_inbox‎،
   والموقعُ يدمجه حين يُفتح — مسوّدةً يراجعها صاحبُها ثمّ ينشر. */
import { db } from '../_db.js';

const SITE = 'https://syncbumousa-crypto.github.io/academia/Almaslakh/';
const CONNECT = SITE + 'connect.html';
const ACCESS_TTL = 24 * 3600, REFRESH_TTL = 90 * 24 * 3600, CODE_TTL = 600;
const PROTO = '2025-06-18';

const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const now = () => Math.floor(Date.now() / 1000);
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const b64u = u8 => btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const rand = (n = 32) => b64u(crypto.getRandomValues(new Uint8Array(n)));
const s256 = async v => b64u(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(v))));

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization, mcp-protocol-version, mcp-session-id',
  'access-control-expose-headers': 'www-authenticate, mcp-session-id', 'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS' };
const J = (o, status = 200, extra = {}) => new Response(JSON.stringify(o), {
  status, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, CORS, extra) });

/* أساسُ العناوين كما يراه العالم (لا كما يراه الموجّهُ الداخليّ) */
const baseOf = req => {
  const u = new URL(req.url);
  return 'https://' + (req.headers.get('x-forwarded-host') || u.host) + '/functions/v1/api/mcp';
};

/* جلسةُ الموقع (لصفحة الموافقة والإعدادات) — نفسُ قراءة ‎posts.js‎ */
const SID = req => {
  const a = req.headers.get('authorization') || '';
  if (a.slice(0, 7).toLowerCase() === 'bearer ') return a.slice(7).trim();
  return ((req.headers.get('cookie') || '').match(/(?:^|;\s*)sid=([^;]+)/) || [])[1] || '';
};
async function session(req) {
  const t = SID(req); if (!t) return null;
  return await db.prepare('SELECT uid FROM sessions WHERE th = ? AND expires > ?').bind(await sha256(t), now()).first();
}
/* رمزُ الموصّل */
async function bearer(req) {
  const t = SID(req); if (!t) return null;
  const r = await db.prepare("SELECT uid, cid FROM mcp_tokens WHERE h = ? AND kind = 'access' AND exp > ?").bind(await sha256(t), now()).first();
  if (r) db.prepare('UPDATE mcp_tokens SET last = ? WHERE h = ?').bind(now(), await sha256(t)).run().catch(() => {});
  return r;
}

/* ===== العملاء ===== */
async function clientOf(cid) {
  if (!cid) return null;
  if (/^https:\/\//.test(cid)) {           /* رابطُ بيانات العميل (CIMD) */
    const c = await db.prepare('SELECT id, name, redirects FROM mcp_clients WHERE id = ?').bind(cid).first();
    if (c && c.redirects) return { id: c.id, name: c.name, redirects: JSON.parse(c.redirects) };
    try {
      const r = await fetch(cid, { signal: AbortSignal.timeout(5000), headers: { accept: 'application/json' } });
      if (!r.ok) return null;
      const m = await r.json();
      if (m.client_id !== cid || !Array.isArray(m.redirect_uris)) return null;
      const name = String(m.client_name || new URL(cid).host).slice(0, 80);
      await db.prepare('INSERT INTO mcp_clients (id, name, redirects, ts) VALUES (?,?,?,?) ON CONFLICT (id) DO UPDATE SET name = excluded.name, redirects = excluded.redirects')
        .bind(cid, name, JSON.stringify(m.redirect_uris.slice(0, 20)), now()).run();
      return { id: cid, name, redirects: m.redirect_uris };
    } catch (e) { return null; }
  }
  const c = await db.prepare('SELECT id, name, redirects FROM mcp_clients WHERE id = ?').bind(cid).first();
  return c ? { id: c.id, name: c.name, redirects: JSON.parse(c.redirects || '[]') } : null;
}

/* ===== الأدوات ===== */
const TOOLS = [
  { name: 'find_course', title: 'Find a course',
    description: 'Search Almaslakh courses by code (e.g. "ACCT 301") or Arabic/English name. Returns matching course codes and names. Use the code with the other tools.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Course code or part of its name' } }, required: ['query'] },
    annotations: { readOnlyHint: true } },
  { name: 'my_contribution', title: 'Read my contribution',
    description: "Read the signed-in user's own contribution in a course: the summary folders and cards (deck) and the question bank (qb), plus any drafts this assistant already sent that the user has not opened yet. Read it before adding, so you do not repeat what exists.",
    inputSchema: { type: 'object', properties: { code: { type: 'string', description: 'Course code, e.g. "ACCT 301"' } }, required: ['code'] },
    annotations: { readOnlyHint: true } },
  { name: 'add_summary', title: 'Add summary cards',
    description: "Add a folder of summary cards to the user's contribution in a course. Each card has a short front (a term, concept or question) and a back (the explanation). Written as a DRAFT: it appears in the user's edit mode on Almaslakh, marked as coming from the assistant, and is published only when the user publishes it. Write in the language of the course material (usually Arabic).",
    inputSchema: { type: 'object', properties: {
      code: { type: 'string', description: 'Course code' },
      folder: { type: 'string', description: 'Folder title, e.g. "الفصل 3: المخزون"' },
      cards: { type: 'array', minItems: 1, maxItems: 200, items: { type: 'object', properties: {
        front: { type: 'string' }, back: { type: 'string' } }, required: ['front', 'back'] } } },
      required: ['code', 'folder', 'cards'] },
    annotations: { readOnlyHint: false, destructiveHint: false } },
  { name: 'add_questions', title: 'Add multiple-choice questions',
    description: "Add a folder of multiple-choice questions to the user's question bank in a course. Each question has 2-6 options and the index (0-based) of the correct one, and may have a short explanation. Written as a DRAFT the user reviews and publishes on Almaslakh.",
    inputSchema: { type: 'object', properties: {
      code: { type: 'string', description: 'Course code' },
      folder: { type: 'string', description: 'Folder title' },
      questions: { type: 'array', minItems: 1, maxItems: 200, items: { type: 'object', properties: {
        question: { type: 'string' }, options: { type: 'array', minItems: 2, maxItems: 6, items: { type: 'string' } },
        answer: { type: 'integer', minimum: 0, description: '0-based index of the correct option' },
        explanation: { type: 'string' } }, required: ['question', 'options', 'answer'] } } },
      required: ['code', 'folder', 'questions'] },
    annotations: { readOnlyHint: false, destructiveHint: false } },
];

const T = s => String(s == null ? '' : s);
async function clientName(cid) { const c = await db.prepare('SELECT name FROM mcp_clients WHERE id = ?').bind(cid).first(); return c ? c.name : ''; }
const clip = (s, n) => T(s).slice(0, n);
async function courseOf(code) {
  const c = clip(code, 40).trim().toUpperCase().replace(/\s+/g, ' ');
  if (!c) return null;
  return await db.prepare('SELECT code, ar, "full" FROM courses WHERE UPPER(code) = ?').bind(c).first();
}
/* الشجرةُ مختصرةً للمساعد: مجلداتٌ وبطاقاتٌ بلا زخرف */
function brief(nodes, depth = 0) {
  return (nodes || []).slice(0, 400).map(n => n.t === 'f'
    ? { folder: T(n.name), items: depth < 4 ? brief(n.ch, depth + 1) : [] }
    : n.t === 'q' ? { question: clip(strip(n.f), 400), options: opts(n.b), answer: n.ok }
    : { front: clip(strip(n.f), 400), back: clip(strip(n.b), 600) });
}
const strip = h => T(h).replace(/<li>/g, '\n- ').replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').trim();
const opts = h => [...T(h).matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => strip(m[1]));

async function callTool(name, a, who) {
  a = a || {}; const uid = who.uid;
  if (name === 'find_course') {
    const q = clip(a.query, 60).trim();
    if (!q) return { error: 'query is empty' };
    const like = '%' + q.replace(/[%_]/g, '') + '%';
    const rs = await db.prepare('SELECT code, ar, "full" FROM courses WHERE code ILIKE ? OR ar ILIKE ? OR "full" ILIKE ? ORDER BY code LIMIT 15')
      .bind(like, like, like).all();
    return { courses: (rs.results || []).map(r => ({ code: r.code, name: r.ar || r.full || '' })) };
  }
  const c = await courseOf(a.code);
  if (!c) return { error: `No course with code "${clip(a.code, 40)}". Use find_course first.` };
  if (name === 'my_contribution') {
    const p = await db.prepare("SELECT data, st FROM posts WHERE uid = ? AND code = ? AND sec = 'cards'").bind(uid, c.code).first();
    let d = {}; try { d = p ? JSON.parse(p.data) : {}; } catch (e) {}
    const ib = await db.prepare('SELECT kind, payload, ts FROM mcp_inbox WHERE uid = ? AND code = ? AND done = 0 ORDER BY ts').bind(uid, c.code).all();
    return { course: { code: c.code, name: c.ar || c.full || '' }, exists: !!p, published: !!(p && p.st === 'pub'), title: T(d.title),
      summary: brief(d.deck), question_bank: brief(d.qb),
      pending_drafts: (ib.results || []).map(r => { let x = {}; try { x = JSON.parse(r.payload); } catch (e) {} return { kind: r.kind, folder: x.folder, count: (x.items || []).length }; }) };
  }
  if (name === 'add_summary' || name === 'add_questions') {
    const folder = clip(a.folder, 160).trim();
    if (!folder) return { error: 'folder is required' };
    let items;
    if (name === 'add_summary') {
      items = (Array.isArray(a.cards) ? a.cards : []).slice(0, 200).map(x => ({ f: clip(x && x.front, 2000), b: clip(x && x.back, 6000) })).filter(x => x.f.trim() || x.b.trim());
    } else {
      items = (Array.isArray(a.questions) ? a.questions : []).slice(0, 200).map(x => {
        const o = (Array.isArray(x && x.options) ? x.options : []).slice(0, 6).map(v => clip(v, 600));
        return { q: clip(x && x.question, 2000), o, ok: Math.max(0, Math.min(o.length - 1, x && x.answer | 0)), ex: clip(x && x.explanation, 3000) };
      }).filter(x => x.q.trim() && x.o.length >= 2);
    }
    if (!items.length) return { error: 'nothing to add' };
    const busy = await db.prepare('SELECT COUNT(*) n FROM mcp_inbox WHERE uid = ? AND ts > ?').bind(uid, now() - 3600).first();
    if (busy && (busy.n | 0) >= 60) return { error: 'Too many additions in the last hour. Try again later.' };
    const id = 'mi' + rand(9);
    await db.prepare('INSERT INTO mcp_inbox (id, uid, code, kind, payload, ts, done) VALUES (?,?,?,?,?,?,0)')
      .bind(id, uid, c.code, name === 'add_summary' ? 'deck' : 'qb', JSON.stringify({ folder, items, by: await clientName(who.cid) }), now()).run();
    return { ok: true, course: c.code, folder, added: items.length,
      note: `Saved as a draft in the user's contribution in ${c.code}. It appears the next time they open the course on Almaslakh (${SITE}), where they can review and publish it.` };
  }
  return { error: 'unknown tool' };
}

async function rpc(msg, who) {
  const { id, method, params } = msg || {};
  const ok = result => ({ jsonrpc: '2.0', id, result });
  const err = (code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
  if (method === 'initialize') return ok({ protocolVersion: (params && params.protocolVersion) || PROTO,
    capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'almaslakh', title: 'Almaslakh', version: '1.0.0' },
    instructions: 'Almaslakh (المسلخ) is a study site. Use find_course to get a course code, my_contribution to see what the user already has, then add_summary / add_questions to write summary cards and multiple-choice questions into their contribution as drafts. Write in the language of the material.' });
  if (method === 'ping') return ok({});
  if (method === 'tools/list') return ok({ tools: TOOLS });
  if (method === 'tools/call') {
    const name = params && params.name;
    if (!TOOLS.find(t => t.name === name)) return err(-32602, 'Unknown tool: ' + name);
    let out;
    try { out = await callTool(name, params.arguments, who); } catch (e) { console.error('mcp tool', name, e && e.message); out = { error: 'server error' }; }
    return ok({ content: [{ type: 'text', text: JSON.stringify(out) }], structuredContent: out, isError: !!out.error });
  }
  if (method && method.startsWith('notifications/')) return null;
  return err(-32601, 'Method not found');
}

/* ===== OAuth ===== */
function asMeta(base) {
  return { issuer: base, authorization_endpoint: base + '/oauth/authorize', token_endpoint: base + '/oauth/token',
    registration_endpoint: base + '/oauth/register', revocation_endpoint: base + '/oauth/revoke',
    response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['maslakh'], client_id_metadata_document_supported: true, subject_types_supported: ['public'] };
}
const form = async req => {
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('json')) { try { return await req.json(); } catch (e) { return {}; } }
  const t = await req.text(); return Object.fromEntries(new URLSearchParams(t));
};
const OE = (e, d, s = 400) => J({ error: e, error_description: d }, s);

async function issue(uid, cid) {
  const at = 'mka_' + rand(), rt = 'mkr_' + rand(), t = now();
  await db.batch([
    db.prepare('INSERT INTO mcp_tokens (h, uid, cid, kind, exp, ts, last) VALUES (?,?,?,?,?,?,?)').bind(await sha256(at), uid, cid, 'access', t + ACCESS_TTL, t, t),
    db.prepare('INSERT INTO mcp_tokens (h, uid, cid, kind, exp, ts, last) VALUES (?,?,?,?,?,?,?)').bind(await sha256(rt), uid, cid, 'refresh', t + REFRESH_TTL, t, t),
  ]);
  return { access_token: at, token_type: 'Bearer', expires_in: ACCESS_TTL, refresh_token: rt, scope: 'maslakh' };
}

export async function onRequest({ request, params }) {
  const m = request.method, path = (params.path || []).join('/'), base = baseOf(request);
  if (m === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  try {
    /* ---------- الاكتشاف ---------- */
    if (path === '.well-known/oauth-protected-resource' || path === '.well-known/oauth-protected-resource/mcp')
      return J({ resource: base, authorization_servers: [base], scopes_supported: ['maslakh'], bearer_methods_supported: ['header'], resource_name: 'Almaslakh' });
    if (path === '.well-known/oauth-authorization-server' || path === '.well-known/openid-configuration') return J(asMeta(base));

    /* ---------- OAuth ---------- */
    if (path === 'oauth/register' && m === 'POST') {
      const b = await form(request);
      const ru = (Array.isArray(b.redirect_uris) ? b.redirect_uris : []).map(String).filter(u => /^https:\/\/|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(u)).slice(0, 10);
      if (!ru.length) return OE('invalid_redirect_uri', 'redirect_uris required');
      const id = 'mc_' + rand(12), name = clip(b.client_name || 'MCP client', 80);
      await db.prepare('INSERT INTO mcp_clients (id, name, redirects, ts) VALUES (?,?,?,?)').bind(id, name, JSON.stringify(ru), now()).run();
      return J({ client_id: id, client_name: name, redirect_uris: ru, grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'],
        token_endpoint_auth_method: 'none', client_id_issued_at: now() }, 201);
    }
    if (path === 'oauth/authorize' && m === 'GET') {
      const q = new URL(request.url).searchParams, c = await clientOf(q.get('client_id'));
      const ru = q.get('redirect_uri') || (c && c.redirects.length === 1 ? c.redirects[0] : '');
      if (!c || !c.redirects.includes(ru)) return OE('invalid_request', 'unknown client or redirect_uri');
      const back = (e, d) => { const u = new URL(ru); u.searchParams.set('error', e); if (d) u.searchParams.set('error_description', d); if (q.get('state')) u.searchParams.set('state', q.get('state')); return Response.redirect(u.toString(), 302); };
      if (q.get('response_type') !== 'code') return back('unsupported_response_type');
      if (!q.get('code_challenge') || (q.get('code_challenge_method') || 'plain') !== 'S256') return back('invalid_request', 'PKCE S256 required');
      const u = new URL(CONNECT);
      ['client_id', 'state', 'code_challenge', 'scope', 'resource'].forEach(k => { if (q.get(k)) u.searchParams.set(k, q.get(k)); });
      u.searchParams.set('redirect_uri', ru);
      return Response.redirect(u.toString(), 302);
    }
    if (path === 'oauth/client' && m === 'GET') {
      const c = await clientOf(new URL(request.url).searchParams.get('client_id'));
      return c ? J({ name: c.name, hosts: [...new Set(c.redirects.map(r => { try { return new URL(r).host; } catch (e) { return ''; } }))] }) : J({ error: 'client' }, 404);
    }
    if (path === 'oauth/approve' && m === 'POST') {
      const s = await session(request); if (!s) return J({ error: 'auth' }, 401);
      const b = await form(request), c = await clientOf(b.client_id);
      if (!c || !c.redirects.includes(b.redirect_uri)) return J({ error: 'client' }, 400);
      const u = new URL(b.redirect_uri);
      if (b.state) u.searchParams.set('state', b.state);
      u.searchParams.set('iss', base);
      if (b.deny) { u.searchParams.set('error', 'access_denied'); return J({ redirect: u.toString() }); }
      if (!b.code_challenge) return J({ error: 'pkce' }, 400);
      const code = 'mko_' + rand();
      await db.prepare('INSERT INTO mcp_codes (h, cid, uid, redirect, chal, exp) VALUES (?,?,?,?,?,?)')
        .bind(await sha256(code), c.id, s.uid, b.redirect_uri, clip(b.code_challenge, 200), now() + CODE_TTL).run();
      u.searchParams.set('code', code);
      return J({ redirect: u.toString() });
    }
    if (path === 'oauth/token' && m === 'POST') {
      const b = await form(request);
      if (b.grant_type === 'authorization_code') {
        const h = await sha256(T(b.code));
        const r = await db.prepare('DELETE FROM mcp_codes WHERE h = ? RETURNING cid, uid, redirect, chal, exp').bind(h).first();
        if (!r || r.exp < now()) return OE('invalid_grant', 'code expired or used');
        if (b.client_id && b.client_id !== r.cid) return OE('invalid_grant', 'client mismatch');
        if (b.redirect_uri && b.redirect_uri !== r.redirect) return OE('invalid_grant', 'redirect mismatch');
        if (!b.code_verifier || await s256(b.code_verifier) !== r.chal) return OE('invalid_grant', 'PKCE failed');
        return J(await issue(r.uid, r.cid));
      }
      if (b.grant_type === 'refresh_token') {
        const r = await db.prepare("DELETE FROM mcp_tokens WHERE h = ? AND kind = 'refresh' RETURNING uid, cid, exp").bind(await sha256(T(b.refresh_token))).first();
        if (!r || r.exp < now()) return OE('invalid_grant', 'refresh token expired');
        return J(await issue(r.uid, r.cid));
      }
      return OE('unsupported_grant_type', '');
    }
    if (path === 'oauth/links' && m === 'GET') {
      const s = await session(request); if (!s) return J({ error: 'auth' }, 401);
      const rs = await db.prepare(`SELECT t.cid, c.name, MIN(t.ts) ts, MAX(t.last) last FROM mcp_tokens t LEFT JOIN mcp_clients c ON c.id = t.cid
        WHERE t.uid = ? AND t.exp > ? GROUP BY t.cid, c.name ORDER BY last DESC`).bind(s.uid, now()).all();
      return J({ links: (rs.results || []).map(r => ({ cid: r.cid, name: r.name || '', ts: r.ts | 0, last: r.last | 0 })) });
    }
    if (path === 'oauth/revoke' && m === 'POST') {
      const b = await form(request);
      if (b.token) { await db.prepare('DELETE FROM mcp_tokens WHERE h = ?').bind(await sha256(T(b.token))).run(); return J({ ok: true }); }
      const s = await session(request); if (!s) return J({ error: 'auth' }, 401);
      if (b.cid) await db.prepare('DELETE FROM mcp_tokens WHERE uid = ? AND cid = ?').bind(s.uid, T(b.cid)).run();
      else await db.prepare('DELETE FROM mcp_tokens WHERE uid = ?').bind(s.uid).run();
      return J({ ok: true });
    }

    /* ---------- صندوقُ الوارد للموقع ---------- */
    if (path === 'inbox') {
      const s = await session(request); if (!s) return J({ error: 'auth' }, 401);
      if (m === 'GET') {
        const rs = await db.prepare('SELECT id, code, kind, payload, ts FROM mcp_inbox WHERE uid = ? AND done = 0 ORDER BY ts LIMIT 100').bind(s.uid).all();
        return J({ items: (rs.results || []).map(r => { let p = {}; try { p = JSON.parse(r.payload); } catch (e) {} return { id: r.id, code: r.code, kind: r.kind, ts: r.ts, folder: p.folder, items: p.items || [], by: p.by || '' }; }) });
      }
      if (m === 'POST') {
        const b = await form(request), ids = (Array.isArray(b.done) ? b.done : []).map(String).slice(0, 100);
        for (const id of ids) await db.prepare('UPDATE mcp_inbox SET done = 1 WHERE id = ? AND uid = ?').bind(id, s.uid).run();
        return J({ ok: true, done: ids.length });
      }
    }

    /* ---------- MCP ---------- */
    if (path === '') {
      if (m === 'GET' || m === 'DELETE') return J({ error: 'method' }, 405, { allow: 'POST' });
      const who = await bearer(request);
      if (!who) return J({ error: 'invalid_token' }, 401, { 'www-authenticate': `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource", scope="maslakh"` });
      let body; try { body = await request.json(); } catch (e) { return J({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400); }
      if (Array.isArray(body)) {
        const out = (await Promise.all(body.map(x => rpc(x, who)))).filter(Boolean);
        return out.length ? J(out) : new Response(null, { status: 202, headers: CORS });
      }
      const out = await rpc(body, who);
      return out ? J(out) : new Response(null, { status: 202, headers: CORS });
    }
    return J({ error: 'not-found' }, 404);
  } catch (e) {
    console.error('mcp:', path, e && e.message);
    return J({ error: 'server' }, 500);
  }
}
