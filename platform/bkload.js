/* ===== تحميلُ الكتاب المركون «يُجمَع ورقةً ورقة» (اختيارُ صاحب الموقع) =====
   الكتابُ على الطاولة بزاويته التي يرسمه بها المحرّك: ينفتح غلافُه، وكلّما تقدّم التحميلُ انقلبت ورقةٌ من الكتلة إلى تحت الغلاف — بالتقليب
   نفسِه الذي في المحرّك (‎book2.js‎: ‏‎pageCurve · rfTick‎ «المجلدُ يستدعي تحديداته») — فإذا جهز الكتابُ انقلب باقيها وانطبق الغلافُ عليها،
   فيتسلّمه المحرّكُ في مكانه نفسِه.
   يعمل في عاملٍ (‎Worker‎) على لوحةٍ منقولةٍ إليه (‎OffscreenCanvas‎): الصفحةُ تنشغل في التحميل نفسِه (فتحُ الملفّ، ورسمُ صوره، وبناءُ
   الكتاب) فلو رُسم فيها لتجمّد معها وقفز. وحيث لا يُنقل الرسمُ يعمل في الصفحة بالواجهة نفسِها (‎createLoader‎).
   لا يمسّ ‎document‎ في أعلاه: هو وحدةٌ للعامل وللصفحة معًا */

const BKL = { tilt: .74, az: -.96, fov: 13, rm: 1.2, ov: .032, bt: .02 };
/* إعداداتُ ظلّ الطاولة في المحرّك (‎SHD‎) — تُنسخ هنا كما هي */
const SHD = { offX: -.125, offY: .045, margin: .155, blur: .05, softDark: .21, softLight: .24 };
const RF = { open: 130, ivMin: 18, ivMax: 75, leaf: 260, close: 260, angle: 1.05, seg: 12, nMax: 40, leaves: 8 };
const mk = (w, h) => { if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h); const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/* ===== كاميرا الطاولة في المحرّك (الميلُ والدورانُ والعدسةُ وسَعةُ الإطار ‎restPose‎) محسوبةً بلا مكتبة، فيقع الكتابُ حيث سيرسمه =====
   نقطةٌ محلّيّة: ‏‎x‎ من الكعب نحو الحافّة، و‏‎y‎ من الرأس، و‏‎z‎ إلى الأعلى. ‏‎P‎ بكسلُها، و‏‎D‎ بُعدُها عن الكاميرا (به تُرتَّب الشرائح)، و‏‎vw‎ اتّجاهُ الناظر */
function camera(cw, ch, ar, n) {
  const H = 1 / ar, TH = Math.min(.2, Math.max(.15, .12 + n * .0012)), BT = BKL.bt, WB = 1 + BKL.ov, HB = H * (1 + BKL.ov), SPB = BT * 1.9;
  const ca = Math.cos(BKL.az), sa = Math.sin(BKL.az), ct = Math.cos(BKL.tilt), st = Math.sin(BKL.tilt);
  const R = [ca, -sa * ct, sa * st, sa, ca * ct, -ca * st, 0, st, ct];   /* ‏‎Rz·Rx‎ (ترتيبُ ‎ZXY‎ في المحرّك) */
  const inv = (x, y, z) => [R[0] * x + R[3] * y + R[6] * z, R[1] * x + R[4] * y + R[7] * z, R[2] * x + R[5] * y + R[8] * z];
  const fw = (x, y, z) => [R[0] * x + R[1] * y + R[2] * z, R[3] * x + R[4] * y + R[5] * z, R[6] * x + R[7] * y + R[8] * z];
  const tn = Math.tan(BKL.fov * Math.PI / 360), asp = cw / ch, cs0 = [];
  for (const x of [-WB, SPB]) for (const y of [-HB / 2, HB / 2]) for (const z of [0, TH + 2 * BT]) cs0.push([x + .5, y, z]);
  let t = [0, 0, TH / 2], d = 0;
  for (let it = 0; it < 2; it++) {
    const cs = cs0.map(p => inv(p[0] - t[0], p[1] - t[1], p[2] - t[2]));
    d = 0; for (const c of cs) d = Math.max(d, c[2] + Math.abs(c[0]) * BKL.rm / (tn * asp), c[2] + Math.abs(c[1]) * BKL.rm / tn);
    let u0 = Infinity, u1 = -Infinity, w0 = Infinity, w1 = -Infinity;
    for (const c of cs) { const u = c[0] / (d - c[2]), w = c[1] / (d - c[2]); u0 = Math.min(u0, u); u1 = Math.max(u1, u); w0 = Math.min(w0, w); w1 = Math.max(w1, w); }
    const ax = fw(1, 0, 0), ay = fw(0, 1, 0), mu = (u0 + u1) / 2 * d, mw = (w0 + w1) / 2 * d;
    t = [t[0] + ax[0] * mu + ay[0] * mw, t[1] + ax[1] * mu + ay[1] * mw, t[2] + ax[2] * mu + ay[2] * mw];
  }
  const zc = fw(0, 0, d), cam = [t[0] + zc[0], t[1] + zc[1], t[2] + zc[2]];
  const P = (x, y, z) => { const c = inv(.5 - x - cam[0], H / 2 - y - cam[1], z - cam[2]), k = -1 / c[2]; return [(c[0] * k / (tn * asp) + 1) / 2 * cw, (1 - c[1] * k / tn) / 2 * ch]; };
  const D = (x, y, z) => -inv(.5 - x - cam[0], H / 2 - y - cam[1], z - cam[2])[2];
  return { P, D, H, TH, BT, WB, HB, SPB, vw: [-R[2], -R[5], R[8]] };
}

/* ===== صورٌ وألوان ===== */
let TEX = null;
function texs() {
  if (TEX) return TEX;
  const t = (w, h, f) => { const c = mk(w, h); f(c.getContext('2d'), w, h); return c; };
  return TEX = {
    page: t(120, 170, (g, w, h) => { g.fillStyle = '#f8f3e6'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(70,64,52,.2)'; for (let y = h * .1, i = 0; y < h * .9; y += h * .036, i++) g.fillRect(w * .1, y, w * (i % 6 === 5 ? .4 : .78), 2); }),
    edge: t(32, 32, (g, w, h) => { g.fillStyle = '#f2ecdf'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(150,130,95,${.16 + .12 * Math.sin(y * 1.7) ** 2})`; g.fillRect(0, y, w, 1); } }),
  };
}
/* لونُ الغلاف كما يأتي (‎#rrggbb‎ أو ‎rgb(…)‎) ← ‎#rrggbb‎، وإلّا لونُ الكتاب الافتراضيّ */
export function hex(c) {
  c = String(c || '').trim(); if (/^#[0-9a-f]{6}$/i.test(c)) return c;
  const m = c.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  return m ? '#' + m.slice(1, 4).map(v => Math.min(255, +v).toString(16).padStart(2, '0')).join('') : '#2c5e65';
}
const shade = (h, f) => { const n = parseInt(h.slice(1), 16), c = v => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${c(n >> 16)},${c(n >> 8 & 255)},${c(n & 255)})`; };

/* ===== أدوات الرسم ===== */
function poly(g, q, fill) { g.beginPath(); g.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) g.lineTo(q[i][0], q[i][1]); g.closePath(); g.fillStyle = fill; g.fill(); }
/* بطانةٌ تحت وجوه كتلةٍ واحدة، بلونها ومحدودةٌ بخطٍّ منه — فلا يظهر من شقوق الحوافّ الملساء بين الوجوه ما وراءها */
function under(g, qs, col) { g.save(); g.fillStyle = g.strokeStyle = col; g.lineWidth = 1.4; g.lineJoin = 'round'; for (const q of qs) { g.beginPath(); g.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) g.lineTo(q[i][0], q[i][1]); g.closePath(); g.fill(); g.stroke(); } g.restore(); }
/* وجهٌ مستوٍ بصورته: أصلُه وزاويتاه على الشاشة (العدسةُ طويلة: الوجهُ متوازي أضلاعٍ تقريبًا) */
function img(g, im, a, b, d, dim = 0, e = null) {
  /* ‏‎e‎ الركنُ الرابعُ الحقيقيّ: التحويلُ متوازي أضلاعٍ يمدّ الركنَ الرابعَ ‎b + d − a‎، والمنظورُ يجعل الحقيقيَّ دونه — فيُقصّ عليه لئلّا يبرز ركنُ الوجه */
  g.save(); if (e) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(e[0], e[1]); g.lineTo(d[0], d[1]); g.closePath(); g.clip(); }
  g.transform((b[0] - a[0]) / im.width, (b[1] - a[1]) / im.width, (d[0] - a[0]) / im.height, (d[1] - a[1]) / im.height, a[0], a[1]);
  g.drawImage(im, 0, 0); if (dim) { g.fillStyle = `rgba(0,0,0,${dim})`; g.fillRect(0, 0, im.width, im.height); } g.restore();
}

/* ===== منحنى الصفحة (نموذجُ المحرّك): مربوطةٌ بجدار الكعب على عمقها ‎δ‎، تُقلَّب بزاوية ‎θ‎ حول مفصل الغلاف، تنثني في ثنية الكعب (‎GUT‎)
   ثمّ تستوي؛ و‏‎curl‎ تأخُّرُ طرفها نحو الكتلة. المقطعُ ‎(x, z)‎ ممدودٌ بطول الصفحة ===== */
export function curve(C, delta, th, curl) {
  const XI = -C.BT * .6, GUT = .2, WP = 1 + XI, out = [];
  const ux = -Math.cos(th), uz = Math.sin(th), nx = -Math.sin(th), nz = -Math.cos(th), U0 = -delta * Math.sin(th), N0 = delta * Math.cos(th);
  for (let j = 0; j <= RF.seg; j++) {
    const f = j / RF.seg, U = U0 + WP * f, k = Math.min(1, (U - U0) / GUT), N = N0 + (delta - N0) * k * k * (3 - 2 * k) + curl * f * f;
    out.push([-(XI + U * ux + N * nx), C.TH + U * uz + N * nz + C.BT]);
  }
  return out;
}
/* شريطٌ من منحنًى: شرائحُ بصورة الصفحة (باتّجاه صورة الكتلة)، مظلّلةٌ بميلها للضوء — كلُّ شريحةٍ عنصرٌ يُرسم في دوره من العمق */
function strip(g, C, pts, im, out) {
  const { P, D, H } = C, S = pts.length - 1, sw = im.width / S;
  for (let j = 0; j < S; j++) {
    const [xa, za] = pts[j], [xb, zb] = pts[j + 1], dx = xb - xa, dz = zb - za, l = Math.hypot(dx, dz) || 1, lit = Math.max(0, (-dz * .42 + dx * .86) / l);
    out.push({ d: D((xa + xb) / 2, H / 2, (za + zb) / 2), f: () => {
      g.save(); const a = P(xb, 0, zb), b = P(xa, 0, za), d = P(xb, H, zb);
      g.transform((b[0] - a[0]) / sw, (b[1] - a[1]) / sw, (d[0] - a[0]) / im.height, (d[1] - a[1]) / im.height, a[0], a[1]);
      g.drawImage(im, im.width - (j + 1) * sw - .3, 0, sw + .6, im.height, -.3, 0, sw + .6, im.height);
      g.fillStyle = `rgba(40,30,15,${(.03 + .16 * (1 - lit)).toFixed(3)})`; g.fillRect(-.3, 0, sw + .6, im.height);
      g.restore();
    } });
  }
}

/* ===== الطبقةُ الثابتة (مرّةً لكلّ مقاس): الظلُّ واللوحُ السفليّ وباطنُه والكعبُ المستدير — لا تتغيّر والكتابُ يُقلَّب ===== */
function base(L) {
  const { C, s } = L, { P, H, HB, WB, TH, BT } = C, y0 = -(HB - H) / 2, y1 = H + (HB - H) / 2, zt = TH + 2 * BT, cv = L.cover, dark = shade(cv, .55);
  const c = mk(L.cv.width, L.cv.height), g = c.getContext('2d'); g.scale(s, s);
  /* الظلُّ الناعمُ نفسُه الذي يرسمه المحرّكُ والكتابُ مركون (‎book2.js‎: ‏‎SHD · blobTex · tableLight‎): مستطيلٌ بمقاس الغلاف وهامشٍ متساوٍ،
     مطموسُ الحافّة، مزاحٌ قليلًا، بعتمة ‎.24‎ (‎.21‎ في الداكن) — فلا يتحرّك الظلُّ حين يتسلّم المحرّكُ الكتاب */
  {
    const az = -.96, ca = Math.cos(az), sa = Math.sin(az), bx = SHD.offX * ca - SHD.offY * sa, by = SHD.offX * sa + SHD.offY * ca;
    const BM = SHD.margin, bw = 1 + BKL.ov + 2 * BM, bh = H * (1 + BKL.ov) + 2 * BM, ppu = 256 / bw;
    const t = mk(256, Math.round(bh * ppu)), tg = t.getContext('2d');
    if ('filter' in tg) tg.filter = `blur(${(BM * SHD.blur * ppu).toFixed(1)}px)`;
    tg.fillStyle = '#000'; const m = BM * .55 * ppu; tg.fillRect(m, m, t.width - 2 * m, t.height - 2 * m);
    /* زوايا المستوى في العالم ← محلّيّ الهيكل (‎x = 0.5 − X‎، ‏‎y = H/2 − Y‎) — على الطاولة */
    const Q = (X, Y) => P(.5 - X, H / 2 - Y, 0);
    g.save(); g.globalAlpha = L.dark ? SHD.softDark : SHD.softLight;
    img(g, t, Q(bx + bw / 2, by + bh / 2), Q(bx - bw / 2, by + bh / 2), Q(bx + bw / 2, by - bh / 2), 0, Q(bx - bw / 2, by - bh / 2));
    g.restore();
  }
  poly(g, [P(WB, y0, BT), P(WB, y1, BT), P(WB, y1, 0), P(WB, y0, 0)], dark);
  poly(g, [P(WB, y1, BT), P(0, y1, BT), P(0, y1, 0), P(WB, y1, 0)], dark);
  poly(g, [P(0, y0, BT), P(WB, y0, BT), P(WB, y1, BT), P(0, y1, BT)], shade(cv, .8));   /* باطنُ اللوح (بلون الغلاف كالمحرّك) */
  return c;
}
/* الكعبُ المستدير (مرّةً لكلّ مقاس): وجوهُه وطرفُه عند الذيل — يُرسم بعد الكتلة والكومة والأوراق، فهو أقربُ إلى الناظر منها
   (تحته كان يُرسم أوّلًا فيبرز ركنُ الكتلة فوقه خارج الغلاف) */
function spineFaces(L) {
  const { C } = L, { P, D, H, HB, TH, BT } = C, y0 = -(HB - H) / 2, y1 = H + (HB - H) / 2, zt = TH + 2 * BT, cv = L.cover, out = [];
  const R = zt / 2, N = 8, sp = t => [-C.SPB * Math.sin(t), R + R * Math.cos(t)];
  /* كلُّ وجهٍ بعمقه */
  for (let i = 0; i < N; i++) {
    const tm = Math.PI * (i + .5) / N;
    const [xa, za] = sp(Math.PI * i / N), [xb, zb] = sp(Math.PI * (i + 1) / N);
    out.push({ d: D((xa + xb) / 2, H / 2, (za + zb) / 2), q: [P(xa, y0, za), P(xb, y0, zb), P(xb, y1, zb), P(xa, y1, za)], c: shade(cv, .62 + .3 * Math.cos(tm - .5)) });
  }
  const cap = []; for (let i = 0; i <= N; i++) { const [x, z] = sp(Math.PI * i / N); cap.push(P(x, y1, z)); }
  out.push({ d: D(-C.SPB / 2, y1, R), q: cap, c: shade(cv, .55) });
  /* وجدارُه الداخليّ (كقالب المحرّك: صلبٌ من الكعب إلى ‎x0 = 0.6·BT‎ بارتفاع الكتلة كاملًا) — يحجب جانبَ الكتلة عند الكعب وهي تنقص */
  const x0 = .6 * BT, zw = BT + TH;
  out.push({ d: D(x0 / 2, H / 2, zw), q: [P(0, y0, zw), P(x0, y0, zw), P(x0, y1, zw), P(0, y1, zw)], c: shade(cv, .7) });
  out.push({ d: D(x0, H / 2, zw / 2), q: [P(x0, y0, zw), P(x0, y1, zw), P(x0, y1, BT), P(x0, y0, BT)], c: shade(cv, .8) });   /* باطنُه بلون الغلاف كالمحرّك */
  out.push({ d: D(x0 / 2, y1, zw / 2), q: [P(0, y1, zw), P(x0, y1, zw), P(x0, y1, 0), P(0, y1, 0)], c: shade(cv, .55) });
  return out;
}

/* ===== إطارٌ: ‏‎a‎ زاويةُ الغلاف، و‏‎R‎ حالُ التقليب — ما فوق اللوح عناصرُ بعمقها، تُرسم من الأبعد إلى الأقرب (كمخزن العمق في المحرّك:
   الورقةُ التي تدخل ثنيةَ الكعب تمرّ وراء الكومة). الكتلةُ أدنى شيءٍ فأوّلُه، والغلافُ أوّلُه ما دام باطنُه نحو الناظر وآخرُه إذا ظهر ظاهرُه ===== */
function draw(L, a, R) {
  const { g, C } = L, { P, D, H, TH, BT, WB, HB } = C, tx = texs(), cvr = L.cover, dark = shade(cvr, .55), mid = shade(cvr, .8), y0 = -(HB - H) / 2, y1 = H + (HB - H) / 2;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, L.cv.width, L.cv.height); g.drawImage(L.base, 0, 0); g.setTransform(L.s, 0, 0, L.s, 0, 0);
  const it = [];
  const hb = TH * (1 - R.launched / R.n), zb = BT + hb;
  /* ترتيبٌ عدديٌّ صريح (‎Infinity‎ لا يُقارَن بمثله فيضطرب الفرز): الكعبُ وجدارُه وراء الكتلة (الكاميرا من جهة الحافّة)، ثمّ الكتلة،
     ثمّ باطنُ الغلاف المرفوع (فوق الكتلة فحافّتُه عند المفصل تحجب ركنَها)، ثمّ الكومةُ والأوراق بعمقها، ثمّ ظاهرُ الغلاف إذا ظهر */
  const SP = 3e12, BK = 2e12, LI = 1e12;
  if (hb > 1e-4) it.push({ d: BK, f: () => {
    /* من جدار الكعب الداخليّ (‎x0 = 0.6·BT‎، كالمحرّك) إلى الحافّة — من الكعب نفسِه كانت تعلوه فيبرز ركنُها خارج الغلاف */
    const x0 = .6 * BT;
    under(g, [[P(1, 0, zb), P(1, H, zb), P(1, H, BT), P(1, 0, BT)], [P(1, H, zb), P(x0, H, zb), P(x0, H, BT), P(1, H, BT)], [P(1, 0, zb), P(x0, 0, zb), P(x0, H, zb), P(1, H, zb)]], '#ece5d4');
    img(g, tx.edge, P(1, 0, zb), P(1, H, zb), P(1, 0, BT), 0, P(1, H, BT));
    img(g, tx.edge, P(1, H, zb), P(x0, H, zb), P(1, H, BT), .06, P(x0, H, BT));
    img(g, tx.page, P(1, 0, zb), P(x0, 0, zb), P(1, H, zb), 0, P(x0, H, zb));
  } });
  const hz = BT + TH, c = Math.cos(a), s = Math.sin(a), at = (x, y, z) => P(x * c - (z - hz) * s, y, x * s + (z - hz) * c + hz);
  const seen = -s * C.vw[0] + c * C.vw[2] > 0;   /* وجهُه الخارجيّ ‎(−sin a, 0, cos a)‎ نحو الناظر */
  it.push({ d: seen ? -LI : LI, f: () => {
    poly(g, [at(WB, y1, hz + BT), at(0, y1, hz + BT), at(0, y1, hz), at(WB, y1, hz)], dark);
    poly(g, [at(WB, y0, hz + BT), at(WB, y1, hz + BT), at(WB, y1, hz), at(WB, y0, hz)], mid);
    if (seen) poly(g, [at(WB, y0, hz + BT), at(0, y0, hz + BT), at(0, y1, hz + BT), at(WB, y1, hz + BT)], cvr);
    else poly(g, [at(WB, y0, hz), at(0, y0, hz), at(0, y1, hz), at(WB, y1, hz)], mid);
  } });
  /* الكومةُ تحت الغلاف: بين منحنى أولاها وآخرِ ما نزل — بطانتُها، ووجهُها شرائح، وحافّتُها الأماميّة، ومقطعُها عند ذيل الورق */
  const pt = TH * R.landed / R.n;
  if (pt > 1e-4) {
    const A2 = curve(C, .0006, a, 0), B2 = curve(C, pt, a, 0), ea = A2[A2.length - 1], eb = B2[B2.length - 1], mi = A2[A2.length >> 1], mb = B2[B2.length >> 1];
    const dp = D((mi[0] + mb[0]) / 2, H / 2, (mi[1] + mb[1]) / 2), sec = [...A2, ...B2.slice().reverse()].map(([x, z]) => P(x, H, z));
    it.push({ d: dp + 1e-6, f: () => under(g, [B2.map(([x, z]) => P(x, 0, z)).concat(B2.slice().reverse().map(([x, z]) => P(x, H, z))),
      [P(ea[0], 0, ea[1]), P(ea[0], H, ea[1]), P(eb[0], H, eb[1]), P(eb[0], 0, eb[1])], sec], '#ece5d4') });
    strip(g, C, B2, tx.page, it);
    it.push({ d: D((ea[0] + eb[0]) / 2, H / 2, (ea[1] + eb[1]) / 2), f: () => img(g, tx.edge, P(ea[0], 0, ea[1]), P(ea[0], H, ea[1]), P(eb[0], 0, eb[1]), 0, P(eb[0], H, eb[1])) });
    it.push({ d: dp, f: () => poly(g, sec, '#e9e1cf') });
  }
  for (const f of R.fly) strip(g, C, curve(C, f.delta, f.th, f.curl), tx.page, it);
  /* الكعبُ وجدارُه: أوّلًا، ووجوهُه بينها بعمقها */
  for (const x of L.spine) it.push({ d: SP + x.d, f: () => poly(g, x.q, x.c) });
  it.sort((p, q) => q.d - p.d);
  for (const x of it) x.f();
}

/* ===== حالُ التقليب في لحظة (توقيتُ المحرّك): ورقةٌ تنطلق إذا بلغها التحميل — لا أسرعَ من ‎ivMax‎ بينها، ومتى جهز الكتابُ فبأقصى سرعته،
   ولا أكثرَ من ثمانٍ طائرة — وتطير ‎leaf‎؛ ثمّ ينطبق الغلافُ بعد نزول آخرها. وإذا تمهّل التحميلُ سكنت الكتلة (لا ورقةَ تنهض منها فتبرز) ===== */
function state(L, now) {
  const T = L.T, want = L.fin ? T.n : Math.min(T.n - 1, Math.floor(L.p * T.n));
  let flying = 0; for (const t of T.at) if (now - t < RF.leaf) flying++;
  while (T.at.length < want && now >= T.next && flying < RF.leaves) { T.at.push(now); flying++; T.next = now + (L.fin ? RF.ivMin : RF.ivMax); }
  let landed = 0; const fly = [];
  T.at.forEach((t, i) => { const k = (now - t) / RF.leaf; if (k >= 1) landed++; else fly.push({ i, k }); });
  let a = RF.angle * (1 - Math.pow(1 - Math.min(1, (now - T.t0) / RF.open), 3));
  if (L.fin && landed === T.n) { if (!T.end) T.end = now + 40; const k = Math.min(1, Math.max(0, (now - T.end) / RF.close)); a = RF.angle * (1 - k * k * k); if (k >= 1) T.closed = true; }
  const fl = fly.map(f => ({ i: f.i, k: f.k, th: a * (1 - Math.pow(1 - f.k, 3)) }));
  /* الأسبقُ أعلى، وانحناءُ كلٍّ محدودٌ بنصف الفُرجة بينه وبين التي تحته */
  for (let q = 0; q < fl.length; q++) { const below = q + 1 < fl.length ? fl[q + 1].th : 0; fl[q].curl = Math.min(.09 * Math.sin(Math.PI * fl[q].k), .5 * Math.max(0, fl[q].th - below)); fl[q].delta = L.C.TH * (fl[q].i + .5) / T.n; }
  return { a, R: { n: T.n, launched: T.at.length, landed, fly: fl } };
}

/* ===== هيكلٌ واحد على لوحة: ‏‎o = { w, h, dpr, ar, n, cover, dark, reduce, p }‎. حلقتُه تقف حين ينتهي. ساعتُه لا تتقدّم في الإطار أكثرَ
   من إطار — فإذا تأخّر إطارٌ أكملت الحركةُ من حيث وقفت ولم تقفز ===== */
const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : f => setTimeout(() => f(performance.now()), 16);
export function createLoader(cv, o, onClosed, onDrawn) {
  const L = { cv, g: cv.getContext('2d'), p: 0, fin: false, dead: false, t: 0, last: 0, T: null, n: o.n || 120, cover: hex(o.cover), dark: !!o.dark, reduce: !!o.reduce };
  const fit = q => {
    const w = Math.round(q.w), h = Math.round(q.h); if (!w || !h) return;
    const s = Math.min(2, q.dpr || 1), ar = q.ar || 1 / Math.SQRT2;
    if (L.C && w === L.w && h === L.h && s === L.s && ar === L.ar) return;
    Object.assign(L, { w, h, s, ar });
    const cw = Math.round(w * s), chh = Math.round(h * s);
    if (cv.width !== cw || cv.height !== chh) { cv.width = cw; cv.height = chh; }   /* تغييرُ المقاس يمحو اللوحة — فلا يُغيَّر إلّا حين يلزم */
    L.C = camera(w, h, ar, L.n); L.base = base(L); L.spine = spineFaces(L);
  };
  const frame = now => {
    if (L.dead) return;
    if (L.C) {
      if (!L.drawn) { L.drawn = true; if (onDrawn) Promise.resolve().then(onDrawn); }   /* أوّلُ إطار: تظهر النسبةُ معه */
      if (!L.last) L.last = now;
      L.t += Math.min(34, Math.max(0, now - L.last)); L.last = now;
      if (!L.T) L.T = { t0: L.t, n: Math.max(12, Math.min(RF.nMax, Math.round(L.n / 6) || 20)), at: [], next: L.t + RF.open, end: 0, closed: false };
      if (L.reduce) {
        const n = 20, k = Math.floor(L.p * n); draw(L, L.fin ? 0 : RF.angle, { n, launched: k, landed: k, fly: [] });
        if (L.fin) { L.dead = true; onClosed && onClosed(); return; }
      } else {
        const st = state(L, L.t); draw(L, st.a, st.R); if (o.trace) o.trace(st, L);   /* ‏‎trace‎ لأداة الفحص وحدها */
        if (L.T.closed) { L.dead = true; onClosed && onClosed(); return; }
      }
    }
    raf(frame);
  };
  fit(o); L.p = Math.min(1, o.p || 0); raf(frame);
  return {
    set(q) {
      if (q.p != null) L.p = Math.min(1, q.p);
      if (q.dark != null && !!q.dark !== L.dark) { L.dark = !!q.dark; if (L.C) { L.base = base(L); L.spine = spineFaces(L); } }
      if (q.cover && hex(q.cover) !== L.cover) { L.cover = hex(q.cover); if (L.C) { L.base = base(L); L.spine = spineFaces(L); } }
      if (q.w) fit(q);
    },
    fin() { L.fin = true; },
    dispose() { L.dead = true; },
  };
}

/* ===== في العامل: لوحةٌ لكلّ كتاب بمعرّفه، والرسائلُ من الصفحة ===== */
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  const all = new Map();
  self.onmessage = ({ data: m }) => {
    const x = all.get(m.id);
    if (m.t === 'add') { if (x) x.dispose(); all.set(m.id, createLoader(m.canvas, m, () => { all.delete(m.id); self.postMessage({ t: 'closed', id: m.id }); }, () => self.postMessage({ t: 'drawn', id: m.id }))); }
    else if (!x) { if (m.t === 'fin') self.postMessage({ t: 'closed', id: m.id }); }
    else if (m.t === 'set') x.set(m);
    else if (m.t === 'fin') x.fin();
    else if (m.t === 'del') { x.dispose(); all.delete(m.id); }
  };
}
