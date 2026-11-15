// «الكتاب ٢» — محرّكُ تقليبٍ بـWebGL لكتاب «المصدر» (ROADMAP-BOOK2 · المرحلة ٣)
// ورقةٌ تلتفّ حول أسطوانةٍ خطُّها مائلٌ بحسب موضع الإمساك، تحت سماءٍ ناعمةٍ وشمسٍ تُلقي ظلًّا خفيفًا.
// كتابٌ عربيّ: الأوراقُ غيرُ المقلَّبة يسارًا، والتقليبُ يرفع اليسرى ويطويها إلى اليمين.
// شيفرةٌ مكتوبةٌ لهذا المشروع — الطريقةُ مستلهَمةٌ من OpenZine ولا يُنقل منه شيء
// (محرّكُ ذلك المشروع ومظلّلُه حقوقُهما لـPaper، فلا يُنسخ منهما سطر).
//
// الأوراق: ‎0‎ الغلاف (وجهُه صورةُ الغلاف، وظهرُه باطنُه بلونه) · ‎1..m‎ صفحاتُ الملفّ (وجهُ ‎i‎ صفحةُ ‎2i−1‎ وظهرُها ‎2i‎) ·
// والأخيرةُ الغلافُ الخلفيّ (لا تُقلَّب). ‏‎A‎ عددُ الأوراق المقلَّبة: ‎0‎ مغلق، و‎A ≥ 1‎ فتحةٌ يمينُها الصفحةُ ‎2(A−1)‎.

const SHEET_GLSL = /* glsl */`
uniform float uP;        // تقدّمُ التقليب ‎0..1‎
uniform float uBend;     // زاويةُ الالتفاف الكلّيّة (راديان)
uniform float uTilt;     // ميلُ خطّ الالتفاف (راديان)
uniform float uLift0;    // ارتفاعُ الورقة في كومة اليسار
uniform float uLift1;    // ارتفاعُها في كومة اليمين
uniform float uStiff;    // صلابةُ الورقة: الغلافُ لا ينثني كالورق
uniform float uFloorL;   // أعلى ما تحت الورقة في كومة اليسار (‎-1‎ لا شيء)
uniform float uFloorR;   // وفي كومة اليمين
uniform float uSpan;     // ‎1‎ تقليبٌ إلى اليمين (‎180°‎) · ‎2‎ طيٌّ حول الكعب إلى ما وراء الكتاب (‎360°‎ — وضعُ الصفحة الواحدة)
uniform vec2  uSize;     // عرضُ الورقة وقامتُها
attribute vec2 aSheet;   // ‎(u, v)‎ في ‎0..1‎ — ‎u‎ من الكعب إلى الحرف
varying vec2 vSheet;
const float PI = 3.14159265;
float bulgeAt(float sx) { return 0.012 * uSize.x * sin(clamp(sx / 0.18, 0.0, 1.0) * PI * 0.5) * (1.0 - 0.6 * sx); }
vec3 sheetPoint(vec2 s) {
  float W = uSize.x, H = uSize.y;
  float u = s.x * W, v = (s.y - 0.5) * H;
  float c = cos(uTilt), sn = sin(uTilt);
  float a = u * c + v * sn, b = -u * sn + v * c;
  float bend = uBend * (1.0 - uStiff);
  float a0 = 0.12 * W, span = W - a0;
  float t = max(0.0, a - a0);
  float ang = bend * t / span;
  float ap = a0 + (abs(bend) < 1e-4 ? t : span / bend * sin(ang));
  float zc = abs(bend) < 1e-4 ? 0.0 : span / bend * (1.0 - cos(ang));
  if (a < a0) ap = a;
  float x = ap * c - b * sn, y = ap * sn + b * c;
  float th = uP * PI * uSpan;
  vec2 eu = vec2(-cos(th), sin(th));
  vec2 en = vec2(sin(th), cos(th));
  vec2 xz = x * eu + zc * en;
  float lift = mix(uLift0, uLift1, smoothstep(0.0, 1.0, uP));
  // انتفاخُ الورق قرب الكعب واحدٌ لكلّ الأوراق والغلاف — وإلّا علت الصفحةُ الأولى على الغلاف فحجبته
  float z = xz.y + lift + bulgeAt(s.x) * (1.0 - sin(th));
  // لا تنزل الورقةُ تحت سطح الكومة التي فوقها: التفافُها قرب الهبوط أو مع التحويم كان يغوص في الأوراق تحتها
  float sx = clamp(abs(xz.x) / W, 0.0, 1.0);
  float fl = xz.x < 0.0 ? uFloorL : uFloorR;
  // والمطويّةُ وراء الكتاب لا أرضَ لها: بعد ربع دورتها تمضي خلفه
  if (fl > -0.5 && (uSpan < 1.5 || th < PI * 0.5)) z = max(z, fl + bulgeAt(sx) + 0.0006);
  return vec3(xz.x, y, z);
}
`;
const PAPER_GLSL = /* glsl */`
varying vec2 vSheet;
uniform sampler2D uThru; uniform float uThruFlip; uniform float uThruAmt;
uniform sampler2D uGrain; uniform vec2 uGrainRep; uniform vec3 uPaper; uniform float uGrainAmt;
`;
const PAPER_FRAG = /* glsl */`
#include <map_fragment>
float inkL = 1.0;
#ifdef USE_MAP
  inkL = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  vec3 thru = texture2D(uThru, vec2(uThruFlip > 0.5 ? 1.0 - vSheet.x : vSheet.x, vSheet.y)).rgb;
  diffuseColor.rgb *= mix(vec3(1.0), thru, uThruAmt);
#endif
  float gr = texture2D(uGrain, vSheet * uGrainRep).r;
  diffuseColor.rgb *= uPaper * (1.0 - uGrainAmt * 0.6 + uGrainAmt * gr);
`;

function patch(material, withNormal, nsign, paper) {
  material.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, material.userData.u, material.userData.x || {});
    sh.vertexShader = SHEET_GLSL + sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = sheetPoint(aSheet); vSheet = aSheet;`);
    if (withNormal) sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', `
      vec3 _p = sheetPoint(aSheet), _pu = sheetPoint(aSheet + vec2(0.01, 0.0)), _pv = sheetPoint(aSheet + vec2(0.0, 0.01));
      vec3 objectNormal = ${nsign < 0 ? '-' : ''}normalize(cross(_pv - _p, _pu - _p));`);
    if (material.userData.mirror != null) sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>',
      `#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vec2(${material.userData.mirror ? '1.0 - aSheet.x' : 'aSheet.x'}, aSheet.y);\n#endif`);
    if (paper) sh.fragmentShader = PAPER_GLSL + sh.fragmentShader
      .replace('#include <map_fragment>', PAPER_FRAG)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(1.0, roughnessFactor, smoothstep(0.25, 0.85, inkL));');
  };
  return material;
}

/* حُبيباتُ الورق: ضجيجٌ بثلاث طبقاتٍ وأليافٌ قصيرة — نسيجٌ نولّده لا صورة */
function grainTexture(THREE) {
  const N = 256, d = new Uint8Array(N * N * 4);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const oct = [[8, .35], [32, .3], [128, .35]].map(([n, w]) => { const g = new Float32Array(n * n); for (let i = 0; i < g.length; i++) g[i] = rnd(); return { n, w, g }; });
  const v = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let s = 0;
    for (const o of oct) {
      const fx = x * o.n / N, fy = y * o.n / N, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const G = (a, b) => o.g[((b % o.n) * o.n) + (a % o.n)];
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      s += o.w * ((G(ix, iy) * (1 - sx) + G(ix + 1, iy) * sx) * (1 - sy) + (G(ix, iy + 1) * (1 - sx) + G(ix + 1, iy + 1) * sx) * sy);
    }
    v[y * N + x] = s;
  }
  for (let k = 0; k < 420; k++) {
    let x = rnd() * N, y = rnd() * N; const a = rnd() * Math.PI, L = 4 + rnd() * 10, dv = (rnd() - 0.3) * 0.25;
    for (let t = 0; t < L; t++) { const i = ((Math.floor(y) + N) % N) * N + ((Math.floor(x) + N) % N); v[i] += dv; x += Math.cos(a); y += Math.sin(a); }
  }
  for (let i = 0; i < N * N; i++) { const c = Math.max(0, Math.min(255, v[i] * 255)); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = c; d[i * 4 + 3] = 255; }
  const t = new THREE.DataTexture(d, N, N); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

const LIGHTS = {
  light: { sky: ['#ffffff', '#d5d9db', 2.3], sun: ['#fffaf0', 1.1], ground: 0.12, paper: [1.0, 0.985, 0.955] },
  dark: { sky: ['#f2efe8', '#8a8f96', 2.05], sun: ['#fff4e2', 0.7], ground: 0.42, paper: [0.9, 0.885, 0.85] },
};

/**
 * cfg: { n, ar (عرض/قامة الصفحة), A, maxA, theme, cover (لون), tex(k, w) ⇒ Promise<canvas|null> (k: رقمُ صفحة أو 'cover'),
 *        onTurn(A) بعد كلّ تغيّرٍ مُلتزَم, onIdle() حين يسكن }
 */
export function createBook2(THREE, host, cfg) {
  const AR = 1 / cfg.ar, W = 1, H = AR;
  /* ‏‎cfg.one‎: صفحةٌ واحدةٌ أمامك — كلُّ صفحةٍ ورقةٌ وحدها (ظهرُها ورقٌ يشفّ عن وجهها كالمطبوع على وجهٍ واحد)،
     والمقلَّبةُ تُطوى حول الكعب إلى ما وراء الكتاب. ‏‎A‎ فيه رقمُ الصفحة الظاهرة (‎0‎ الغلاف) */
  const ONE = !!cfg.one;
  /* ‏‎cfg.skip‎: الغلافُ صفحةُ الملفّ الأولى نفسُها — فالكتابُ من داخله يبدأ بالثانية (لا تتكرّر). ‏‎N‎ ما في الكتاب من صفحات،
     ورقمُ الصفحة في الملفّ ‎k = v + skip‎ (‏‎v‎ ترتيبُها في الكتاب) */
  const SK = cfg.skip ? 1 : 0, N = cfg.n - SK;
  const m = ONE ? N : Math.ceil(N / 2), S = m + 2;
  const maxA = ONE ? N : Math.min(S - 1, Math.floor(N / 2) + 1);
  let A = Math.max(0, Math.min(maxA, cfg.A | 0));
  let needs = true, dead = false;
  /* ‏‎mo‎: تبدُّلُ الوضع أمام العين (صفحتان ⇄ صفحة) — نصفُ الفتحة يُطوى حول الكعب إلى ما وراء الكتاب والكاميرا تقترب من الباقي،
     أو ينفتح من ورائه وهي تبتعد. ‏‎side‎ النصفُ الذي يبقى: ‏‎L‎ اليسرى (تُطوى كومةُ اليمين) و‎R‎ اليمنى (تُطوى كومةُ اليسار) ·
     ‏‎k‎ ‎0‎ فتحةٌ تامّة و‎1‎ مطويّةٌ — ‏‎cfg.morph‎ يبدأ المحرّكُ مطويًّا لينفتح أمامها */
  let mo = !ONE && cfg.morph ? { side: cfg.morph === 'R' ? 'R' : 'L', k: 1, a: null } : null;
  /* ===== على الطاولة (طلبُ صاحب الموقع) =====
     ‏‎cfg.rest‎: الكتابُ المغلقُ موضوعٌ على طاولةٍ تُرى من جانبٍ مائل، بسُمكه وحوافّ أوراقه وظلّه. نقرُه يرفعه وتدور الكاميرا
     فوقه وينفتح غلافُه — والعودةُ إلى الغلاف تُنزله إليها. ‏‎tv‎ ‎0‎ الطاولة و‎1‎ القراءة (الكاميرا فوق الكتاب كما كانت)،
     وكلُّ ما بينهما مزيجٌ من الوضعين فلا يتبدّل شيءٌ بآخر */
  let tv = cfg.rest && A === 0 ? 0 : 1;
  let ta = null, tRise = 0, tHov = 0, tHovT = 0, tAfter = false;
  /* وفي الصفحة الواحدة كلُّ صفحةٍ ورقة: نصفُ السماكة، فلا يتضاعف سُمكُ الكتاب */
  const STACK = ONE ? 0.0008 : 0.0016;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const el = renderer.domElement;
  el.className = 'bk2-gl';
  host.appendChild(el);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
  const book = new THREE.Group(); scene.add(book);

  const sky = new THREE.HemisphereLight(); sky.position.set(0, 0.35, 1); scene.add(sky);
  const sun = new THREE.DirectionalLight();
  sun.position.set(-1.3, 1.5, 4.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -1.6, right: 1.6, top: 1.0 * Math.max(1, H), bottom: -1.0 * Math.max(1, H), near: 0.5, far: 8 });
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.012; sun.shadow.radius = 12;
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.12 }));
  /* وفي الصفحة الواحدة تحت الكتاب ما طُوي وراءه: الأرضُ تحتها جميعًا */
  const GZ = ONE ? -(S + 2) * 0.0008 - 0.004 : -0.004, GZ1 = -(cfg.n + 4) * 0.0008 - 0.004;
  ground.position.z = GZ; ground.receiveShadow = true; scene.add(ground);

  const geo = new THREE.PlaneGeometry(1, 1, 48, Math.round(48 * AR));
  geo.setAttribute('aSheet', geo.attributes.uv.clone());
  const grain = grainTexture(THREE);
  /* لونٌ واحدٌ صورةً بكسلٍ واحد — بقيم sRGB نفسِها (كانت تُكتب خطّيّةً ثمّ تُفكّ sRGB فيغمق اللونُ مرّتين: باطنُ الغلاف بدا أسود) */
  const solid = hex => { const h = new THREE.Color(hex).getHexString(); const t = new THREE.DataTexture(new Uint8Array([0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).concat(255)), 1, 1); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t; };
  const blank = solid('#f6f1e6');
  /* ظاهرُ الغلاف الخلفيّ بلون الغلاف أغمقَ قليلًا */
  const coverC = new THREE.Color(cfg.cover || '#2c5e65');   /* لونُ اللوحين والكعب (تحويلُ sRGB يجري عند القراءة) */
  /* باطنُ الغلاف بلونه الخارجيّ نفسِه (طلبُ صاحب الموقع) — صار يُرى بلونه بعد إصلاح ‎solid‎ (كان يغمق مرّتين فبدا أسود) */
  const inside = solid('#' + new THREE.Color(cfg.cover || '#2c5e65').getHexString());
  const outsideBack = solid('#' + new THREE.Color(cfg.cover || '#2c5e65').multiplyScalar(0.85).getHexString());

  let texW = 1024;
  const pageTex = new Map();
  function texFor(k) {
    if (k === 'inside') return inside;
    if (k === 'back') return outsideBack;
    if (k === 'blank') return blank;
    if (k !== 'cover' && (k < 1 || k > cfg.n)) return blank;
    if (pageTex.has(k)) return pageTex.get(k);
    const tex = new THREE.Texture();
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.userData.ready = Promise.resolve(cfg.tex(k, texW)).then(cv => {
      if (dead || !cv) return;
      tex.image = cv; tex.needsUpdate = true; needs = true;
    }).catch(() => {});
    pageTex.set(k, tex);
    return tex;
  }
  const pk = v => v >= 1 && v <= N ? v + SK : 'blank';
  const faces = i => i === 0 ? ['cover', 'inside'] : i === S - 1 ? ['inside', 'back'] : ONE ? [pk(i), 'blank'] : [pk(2 * i - 1), pk(2 * i)];

  const sheets = [];
  for (let i = 0; i < S; i++) {
    const isCover = i === 0 || i === S - 1;
    const u = { uP: { value: 0 }, uBend: { value: 0 }, uTilt: { value: 0 }, uLift0: { value: 0 }, uLift1: { value: 0 }, uFloorL: { value: -1 }, uFloorR: { value: -1 }, uSpan: { value: ONE ? 2 : 1 }, uStiff: { value: isCover ? 0.85 : 0 }, uSize: { value: new THREE.Vector2(W, H) } };
    /* ‏‎u‎ يتّجه إلى ‎−x‎ ساكنًا فينقلب ترتيبُ الرؤوس: الوجهُ مادّتُه ‎BackSide‎ والظهرُ ‎FrontSide‎، وكلاهما بعموديٍّ معكوس */
    const mk = (side, mirror, flipThru) => {
      const mt = patch(new THREE.MeshStandardMaterial({ side, roughness: isCover ? 0.7 : 0.86, metalness: 0, color: '#ffffff' }), true, -1, true);
      mt.userData.u = u; mt.userData.mirror = mirror;
      mt.userData.x = { uThru: { value: blank }, uThruFlip: { value: flipThru }, uThruAmt: { value: isCover ? 0 : ONE ? 0.11 : 0.07 },
        uGrain: { value: grain }, uGrainRep: { value: new THREE.Vector2(3, 3 * AR) }, uGrainAmt: { value: isCover ? 0.04 : 0.07 },
        uPaper: { value: new THREE.Vector3(1, 1, 1) } };
      return mt;
    };
    const fm = mk(THREE.BackSide, true, 0), bm = mk(THREE.FrontSide, false, 1);
    const meshes = [new THREE.Mesh(geo, fm), new THREE.Mesh(geo, bm)];
    for (const mh of meshes) {
      mh.castShadow = mh.receiveShadow = true; mh.frustumCulled = false;
      const dm = patch(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide }), false, 1, false);
      dm.userData.u = u; mh.customDepthMaterial = dm;
      book.add(mh);
    }
    sheets.push({ i, u, fm, bm, meshes, isCover, p: 0, target: 0, tilt: 0, tiltT: 0, dir: 1, anim: null, drag: null, cast: true });
  }

  /* لا تُبقى إلّا صورُ الأوراق القريبة من الفتحة — والبعيدةُ ورقٌ لا تراه العينُ تحت الكومة */
  const NEAR = 2;
  function keepNear() {
    const want = new Set();
    for (const s of sheets) {
      const near = s.i >= A - NEAR - 1 && s.i <= A + NEAR;
      const [fk, bk] = faces(s.i);
      const f = near ? texFor(fk) : blank, b = near ? texFor(bk) : blank;
      if (near) { want.add(fk); want.add(bk); }
      if (s.fm.map !== f) { s.fm.map = f; s.fm.needsUpdate = true; }
      if (s.bm.map !== b) { s.bm.map = b; s.bm.needsUpdate = true; }
      s.fm.userData.x.uThru.value = s.isCover ? blank : b; s.bm.userData.x.uThru.value = s.isCover ? blank : f;
    }
    pageTex.forEach((t, k) => { if (!want.has(k)) { t.dispose(); pageTex.delete(k); } });
    needs = true;
  }
  /* تغيّرت دقّةُ العرض كثيرًا: تُطلب الصورُ من جديد بالدقّة الجديدة */
  function retex(w) {
    if (Math.abs(w - texW) / texW < 0.3) return;
    texW = w;
    /* الصورةُ القديمةُ تبقى حتى تجهز الجديدة — لا تسودّ الصفحاتُ وهي تُرسم من جديد */
    pageTex.forEach((t, k) => Promise.resolve(cfg.tex(k, w)).then(cv => {
      if (dead || !cv || pageTex.get(k) !== t) return;
      /* مقاسٌ آخر: مخزنُ الصورة في البطاقة ثابتُ المقاس، فيُحرَّر ليُبنى بالجديد (وإلّا بقيت القديمةُ ملصقةً في زاويتها) */
      if (t.image && (t.image.width !== cv.width || t.image.height !== cv.height)) t.dispose();
      t.image = cv; t.needsUpdate = true; needs = true;
    }).catch(() => {}));
  }

  let curTheme = 'light', tlK = -1;
  function setTheme(th) {
    const L = LIGHTS[th === 'dark' ? 'dark' : 'light'];
    sky.color.set(L.sky[0]); sky.groundColor.set(L.sky[1]); sky.intensity = L.sky[2];
    sun.color.set(L.sun[0]); sun.intensity = L.sun[1];
    ground.material.opacity = L.ground; curTheme = th === 'dark' ? 'dark' : 'light'; tlK = -1;
    for (const s of sheets) for (const mt of [s.fm, s.bm]) mt.userData.x.uPaper.value.set(...(s.isCover ? [1, 1, 1] : L.paper));
    needs = true;
  }
  setTheme(cfg.theme);
  /* شمسُ الطاولة من يمين الناظر وأمامه قليلًا فيقع الظلُّ يسارَ الكتاب (طلبُ صاحب الموقع) — بدوران الكاميرا نفسِه */
  const SUN0 = new THREE.Vector3(-1.3, 1.5, 4.2), SUN1 = new THREE.Vector3(2.4, 1.3, 3.6).applyAxisAngle(new THREE.Vector3(0, 0, 1), -0.96);
  const BLOB = new THREE.Vector3(-0.06, 0.01, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), -0.96);
  /* ظلٌّ ناعمٌ عريضٌ تحت الكتاب على الطاولة (صورةٌ مضبَّبة) — كظلّ الكونسبت الذي يلفّه ويمتدّ خلفه */
  const blobCv = document.createElement('canvas'); blobCv.width = blobCv.height = 256;
  /* قلبُه المعتم بمقاس الكتاب نفسِه (‎176/256 × 1.45‎) والتلاشي حوله إلى الخارج — كان أغلبُه تحت الكتاب فلا يُرى منه إلّا حافّةٌ باهتة */
  { const c = blobCv.getContext('2d'); c.filter = 'blur(18px)'; c.fillStyle = '#000'; c.fillRect(40, 40, 176, 176); }
  const blobT = new THREE.CanvasTexture(blobCv);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobT, color: '#000', transparent: true, opacity: 0, depthWrite: false }));
  blob.renderOrder = -1; scene.add(blob);
  function tableLight(e) {
    if (Math.abs(e - tlK) < 1e-5) return; tlK = e;
    blob.visible = e < 1;
    blob.material.opacity = (curTheme === 'dark' ? 0.4 : 0.24) * (1 - e) * (1 - e);
    blob.scale.set(W * (1 + OV) * 1.55, H * (1 + OV) * 1.78, 1);
    blob.position.set(BLOB.x * W, BLOB.y * H, GZ + 0.0004);
    sun.position.copy(SUN1).lerp(SUN0, e);
    const L = LIGHTS[curTheme];
    ground.material.opacity = L.ground + ((curTheme === 'dark' ? 0.36 : 0.16) - L.ground) * (1 - e);
    /* ظلُّ الشمس المائلة على الطاولة حادٌّ قليلًا (التنعيمُ الواسع يرسمه نسخًا متراكبةً: خطوط) — النعومةُ من الظلّ المضبَّب تحته */
    sun.shadow.radius = 4 + 8 * e;
  }

  sheets.forEach(s => { s.p = s.target = s.i < A ? 1 : 0; });
  keepNear();

  /* ===== الكتابُ على الطاولة: غلافٌ صلبٌ حقيقيّ =====
     اللوحان والكعبُ المستدير جسمٌ واحدٌ متّصل (مقطعُه حرفُ C ممدودٌ بطول الكتاب، حوافُّه مشطوفة) فلا فجوةَ ولا خطَّ عند
     تقاطعاته، وفي جوفه كتلةُ الأوراق بحوافّها، وصورةُ الغلاف على وجه اللوح نفسِه. بسُمكٍ يُرى (‏‎TH‎ بحسب عدد الصفحات).
     يُرسم على الطاولة وفي الطريق منها وحدَه — وورقتا الغلاف من محرّك القراءة مخفيّتان — ويصغر إلى مقاس الكتاب الحقيقيّ،
     فإذا صارت الكاميرا فوقه سُلِّم إلى أوراق القراءة وهما على الصورة نفسِها */
  const TH = Math.min(0.2, Math.max(0.15, 0.12 + cfg.n * 0.0012)) * W, SH = S * STACK, OV = 0.032, BT = 0.02 * W;
  const WB = W * (1 + OV), HB = H * (1 + OV), SPB = BT * 1.9, XI = -BT * 0.6, BV = BT * 0.22;
  const edgeTex = vert => {
    const cv = document.createElement('canvas'); cv.width = vert ? 128 : 8; cv.height = vert ? 8 : 128;
    const c = cv.getContext('2d'); c.fillStyle = '#f1ebdb'; c.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < 128; i += 3) { c.fillStyle = i % 9 ? 'rgba(150,135,105,.16)' : 'rgba(150,135,105,.26)'; vert ? c.fillRect(i, 0, 1, 8) : c.fillRect(0, i, 8, 1); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const edgeH = edgeTex(false), edgeV = edgeTex(true);
  const hideM = new THREE.MeshBasicMaterial({ visible: false });
  const boardM = new THREE.MeshStandardMaterial({ color: coverC, roughness: 0.78, metalness: 0 });
  /* حوافُّ الورق مضيئةٌ قليلًا من نفسها (كالكونسبت: كريميّةٌ صافية ولو كانت في الجانب البعيد عن الشمس) */
  const edgeM = t => new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.32 });
  const caseG = new THREE.Group(); scene.add(caseG);
  let caseMesh = null;
  /* مقطعُ الغلاف في المستوى ‎(x, z)‎: اللوحُ العلويّ ← الكعبُ نصفُ قطعٍ ناقص ← اللوحُ السفليّ، وجوفُه حيث الأوراق */
  {
    const zt = TH + BT, zb = -BT, shp = new THREE.Shape();
    shp.moveTo(-WB, zt); shp.lineTo(0, zt);
    shp.absellipse(0, (zt + zb) / 2, SPB, (zt - zb) / 2, Math.PI / 2, -Math.PI / 2, true);
    shp.lineTo(-WB, zb); shp.lineTo(-WB, 0); shp.lineTo(XI, 0); shp.lineTo(XI, TH); shp.lineTo(-WB, TH); shp.closePath();
    const g = new THREE.ExtrudeGeometry(shp, { depth: HB - 2 * BV, bevelEnabled: true, bevelThickness: BV, bevelSize: BV * 0.6, bevelSegments: 3, curveSegments: 24 });
    g.rotateX(Math.PI / 2); g.translate(0, (HB - 2 * BV) / 2, 0);   /* الامتدادُ بطول الكتاب (‎y‎) */
    /* هدفُ الشكل: كلُّ نقطةٍ خارج مقاس الأوراق (الكعبُ البارز وبروزُ اللوحين) تنضمّ إليه — فيبلغ الغلافُ في التسليم
       مقاسَ ورقة الغلاف نفسَه تمامًا (التحجيمُ وحده كان يُبقي الكعبَ بارزًا شعرةً فيقفز) */
    const pos = g.attributes.position, mp = new Float32Array(pos.array.length);
    for (let i = 0; i < pos.count; i++) {
      mp[i * 3] = Math.min(0, Math.max(-W, pos.getX(i)));
      mp[i * 3 + 1] = Math.min(H / 2, Math.max(-H / 2, pos.getY(i)));
      mp[i * 3 + 2] = pos.getZ(i);
    }
    g.morphAttributes.position = [new THREE.BufferAttribute(mp, 3)];
    caseMesh = new THREE.Mesh(g, boardM); caseMesh.morphTargetInfluences = [0];
    caseMesh.castShadow = caseMesh.receiveShadow = true; caseG.add(caseMesh);
  }
  /* كتلةُ الأوراق: من حافّة الصفحات إلى باطن الكعب، بين اللوحين — وجوهُها ‎+x −x +y −y +z −z‎، وما يغطّيه الغلافُ لا يُرسم */
  const block = new THREE.Mesh(new THREE.BoxGeometry(W + XI, H, TH), [hideM, edgeM(edgeV), edgeM(edgeH), edgeM(edgeH), hideM, hideM]);
  block.position.set((-W + XI) / 2, 0, TH / 2); block.castShadow = block.receiveShadow = true; caseG.add(block);
  /* صورةُ الغلاف على وجه اللوح العلويّ (الصورةُ نفسُها التي على ورقة الغلاف) */
  const artM = new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0, color: '#ffffff' });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(WB - BV, HB - BV), artM);
  /* فوق الوجه المسطّح (الشطفُ يرفعه ‎0.6·BV‎) وداخلَ حوافّه المشطوفة */
  art.position.set(-(WB - BV) / 2 - BV * 0.2, 0, TH + BT + BV * 0.6 + 0.0004); art.receiveShadow = true; caseG.add(art);
  let caseK = -1;
  /* ‏‎e‎ مقدارُ القراءة ‎0..1‎ (بعد المنحنى): الغلافُ يصغر إلى مقاس الأوراق وسُمكها الحقيقيّ، ويُسلَّم إليها في ‎e = 1‎ */
  function updCase(e) {
    const show = e < 1 || !!ta;
    const sh = 1 - e;
    if (caseG.visible !== show) {
      caseG.visible = show;
      /* أوراقُ القراءة كلُّها مخفيّةٌ ما دام الجسمُ ظاهرًا (فيه كتلةُ أوراقه): انتفاخُ الورق قرب الكعب أعلى من سُمك الغلاف
         وهو يصغر إلى سُمكه الحقيقيّ، فكانت الصفحةُ تبرز من فوقه شريطًا ثمّ كلُّها قبيل الفتح — وتظهر كلُّها معًا في التسليم */
      for (const c of sheets) for (const mh of c.meshes) mh.visible = !show;
      needs = true;
    }
    if (!show) { caseK = -1; return; }
    if (artM.map !== sheets[0].fm.map) { artM.map = sheets[0].fm.map; artM.needsUpdate = true; }
    caseG.position.copy(book.position);
    if (Math.abs(sh - caseK) < 1e-6) return;
    caseK = sh;
    const sz = (SH + (TH - SH) * sh) / TH;
    caseG.scale.set(1, 1, sz);
    caseMesh.morphTargetInfluences[0] = 1 - sh;
    /* وصورةُ الغلاف من وجه اللوح إلى مقاس الورقة */
    const aw = W + (WB - BV - W) * sh, ah = H + (HB - BV - H) * sh;
    art.scale.set(aw / (WB - BV), ah / (HB - BV), 1); art.position.x = -aw / 2 - BV * 0.2 * sh;
  }
  updCase(tv);

  /* الكاميرا تسع الفتحةَ (‎2W × H‎) بهامشٍ للظلّ. ‏‎rect()‎ مستطيلُ الفتحة على اللوحة (بكسل CSS) */
  let frameNow = null;
  let cw = 0, ch = 0, fit = { x: 0, y: 0, w: 0, h: 0 };
  /* هامشُ الإطار: الكتابُ يملأ مساحتَه إلّا قليلًا (طلبُ صاحب الموقع) — ‏‎LIFT‎ رفعُه عن الوسط ليُرى ظلُّه تحته */
  /* ‏‎cfg.frame = { m, lift }‎ يأتي من الموقع (هيكلُ التحميل ومستطيلُ الفتحة يُحسبان به أيضًا) */
  const MX = cfg.frame ? cfg.frame.m : 1.04, MY = MX, DOLLY = 0.5, LIFT = cfg.frame ? cfg.frame.lift : 0.01;
  /* المغلقُ ورقةٌ واحدة: الكاميرا تقترب حتى يسع الغلافُ وحده، وتبتعد مع انفتاحه حتى تسع الفتحةَ (طلبُ صاحب الموقع: «كبّر الكتب»).
     ‏‎o‎ انفتاحُ الغلاف ‎0..1‎ (تقدُّمُ ورقته)، فالعرضُ المطلوب ‎W(1+o)‎ */
  let camOpen = -1, camVh = 0, camT = -1, calm = false;
  /* زاويةُ الطاولة: دورانُ كتاب الكونسبت نفسُه (‎−55°‎، مقيسٌ من زوايا غلافه في الفيديو معكوسًا لكتابٍ عربيّ كعبُه يمين)،
     والكاميرا أعلى منه (ميلٌ ‎42°‎ عن العموديّ — طلبُ صاحب الموقع) بعدسةٍ طويلةٍ كعدسته */
  const TILT = 0.74, AZ = -0.96, RM = 1.2, FOV = 28, FOV_T = 13;
  const qv = new THREE.Quaternion(), ev = new THREE.Euler(), v3 = new THREE.Vector3(), tRest = new THREE.Vector3();
  const tCorners = [];
  for (const x of [-WB, SPB]) for (const y of [-HB / 2, HB / 2]) for (const z of [0, TH + 2 * BT]) tCorners.push(new THREE.Vector3(x + W / 2, y, z));
  let restRect = null;
  const smooth = t => t * t * (3 - 2 * t);
  /* الطاولةُ بكاملها في الإطار: تُسقَط زوايا الكتاب على اتّجاه الكاميرا، فيُختار البعدُ الذي يسعها والمركزُ الذي يوسّطها */
  function restPose(q) {
    const qi = q.clone().invert(), tn = Math.tan(camera.fov * Math.PI / 360), asp = cw / ch;
    tRest.set(0, 0, TH / 2);
    let d = 0;
    for (let it = 0; it < 2; it++) {
      d = 0;
      const cs = tCorners.map(p => v3.copy(p).sub(tRest).applyQuaternion(qi).clone());
      for (const c of cs) d = Math.max(d, c.z + Math.abs(c.x) * RM / (tn * asp), c.z + Math.abs(c.y) * RM / tn);
      let u0 = Infinity, u1 = -Infinity, w0 = Infinity, w1 = -Infinity;
      for (const c of cs) { const u = c.x / (d - c.z), w = c.y / (d - c.z); u0 = Math.min(u0, u); u1 = Math.max(u1, u); w0 = Math.min(w0, w); w1 = Math.max(w1, w); }
      tRest.add(v3.set(1, 0, 0).applyQuaternion(q).multiplyScalar((u0 + u1) / 2 * d)).add(v3.set(0, 1, 0).applyQuaternion(q).multiplyScalar((w0 + w1) / 2 * d));
    }
    return d;
  }
  function frameCam() {
    /* والصفحةُ الواحدة عرضُها ورقةٌ — والكعبُ على حافّة الإطار، فإذا طُويت ورقةٌ تراجعت الكاميرا قليلًا نحو الكعب
       (يبقى حرفُ الصفحة الأيسرُ مكانه) فيُرى التفافُها حوله إلى ما وراء الكتاب، ثمّ تعود */
    let o;
    if (mo) o = 2 + mo.k;   /* ما يُرى عرضُه ‎(2−k)W‎ ووسطُه الكعبُ بعد إزاحة الكتاب */
    else if (ONE) { o = 0; if (!calm) for (const s of sheets) if (s.p > 1e-3 && s.p < 1 - 1e-3) o = Math.max(o, Math.sin(s.p * Math.PI)); }
    else o = sheets.length ? Math.max(0, Math.min(1, sheets[0].p)) : 1;
    /* في التبدُّل اللوحةُ ثابتةُ المقاس والكتابُ يُحجَّم على المساحة التي تتغيّر قامتُها حولها (‎vh‎) */
    const vh = mo && mo.vh ? mo.vh : ch;
    const tk = tv + book.position.z * 13;
    if (Math.abs(o - camOpen) < 1e-4 && vh === camVh && Math.abs(tk - camT) < 1e-6) return false;
    camOpen = o; camVh = vh; camT = tk;
    camera.fov = FOV;   /* وضعُ القراءة بعدسته؛ والطاولةُ بعدسةٍ أضيق (أدناه) */
    const tn = Math.tan(camera.fov * Math.PI / 360);
    const span = mo ? W * (2 - mo.k) : ONE ? W * (1 + DOLLY * o) : W * (1 + o), cx = mo || !ONE ? 0 : W * DOLLY * o / 2;
    let dist = ch / (2 * tn * Math.min(vh / (H * MY), cw / (span * MX)));
    /* مستوى القرب والبعد يلفّان الكتابَ وحده (ورقةٌ تقف نحو الكاميرا تبلغ عرضَها، والمطويّةُ وراءه كذلك): دقّةُ العمق
       تتوزّع على ما بينهما. كانا ‎0.1 · 20‎ فتقاربت الأوراقُ المتراصّة عند بطاقات العمق الخشنة (‎16bit‎ في هواتفَ كثيرة)
       فغلبت الورقةُ التي تحتُ التي فوقها */
    camera.near = Math.max(0.1, dist - W * 1.35); camera.far = dist + W * 1.6;
    camera.position.set(cx, -LIFT * H, dist); camera.lookAt(cx, -LIFT * H, 0);
    restRect = null;
    if (tv < 1) {
      /* بين الطاولة والقراءة: الميلُ والدورانُ يتلاشيان، والمركزُ والبعدُ يمضيان من وضع الطاولة إلى وضع القراءة */
      const e = smooth(tv);
      /* عدسةٌ طويلةٌ على الطاولة كالكونسبت (المنظورُ هادئ: حافّتا الكتاب شبهُ متوازيتين)، تتّسع إلى عدسة القراءة */
      camera.fov = FOV_T + (FOV - FOV_T) * e;
      const kf = tn / Math.tan(camera.fov * Math.PI / 360);   /* بعدُ القراءة بالعدسة الحاليّة: الإطارُ نفسُه */
      dist *= kf;
      qv.setFromEuler(ev.set(TILT * (1 - e), 0, AZ * (1 - e), 'ZXY'));
      /* يُسَع الكتابُ بميله الحاليّ (مائلًا يُرى أطولَ منه مسطّحًا)، ثمّ يمضي البعدُ والمركزُ إلى وضع القراءة نفسِه */
      const dF = restPose(qv), d = dF + (dist - dF) * e;
      v3.set(cx, -LIFT * H, 0).sub(tRest).multiplyScalar(e).add(tRest);
      camera.position.set(0, 0, d).applyQuaternion(qv).add(v3); camera.quaternion.copy(qv);
      camera.near = Math.max(0.05, d - W * 2.2); camera.far = d + W * 3;
      /* مستطيلُ الكتاب على اللوحة (للنقر والتحويم عليه) */
      camera.updateMatrixWorld(); camera.updateProjectionMatrix();
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const p of tCorners) { v3.copy(p); v3.z += book.position.z; v3.project(camera); const px = (v3.x + 1) / 2 * cw, py = (1 - v3.y) / 2 * ch; x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
      restRect = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    camera.updateProjectionMatrix();
    const ppu = ch / (2 * dist * tn);   // بكسلٌ لكلّ وحدة في مستوى الكتاب
    fit = mo ? { w: span * ppu, h: H * ppu, x: cw / 2 - span / 2 * ppu, y: ch / 2 - H * ppu / 2 }
      : ONE ? { w: W * ppu, h: H * ppu, x: cw / 2 + (-W / 2 - cx) * ppu, y: ch / 2 - H * ppu / 2 }
      : { w: 2 * W * ppu, h: H * ppu, x: cw / 2 - W * ppu, y: ch / 2 - H * ppu / 2 };
    return true;
  }
  function resize() {
    if (mo && mo.box) return;   /* التبدُّلُ جارٍ: لا تُعاد اللوحةُ كلَّ إطار (ثقيلٌ ويمسحها) — تُقاس بعده */
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    if (w === cw && h === ch) return;
    cw = w; ch = h;
    renderer.setSize(w, h, false); el.style.width = w + 'px'; el.style.height = h + 'px';
    camera.aspect = w / h;
    camOpen = -1; frameCam();
    /* الدقّةُ على أكبر قدرٍ تبلغه الصفحة (المغلقُ يُقرَّب) */
    const tn = Math.tan(FOV * Math.PI / 360), dMin = Math.max(H * MY / 2 / tn, W * MX / 2 / tn / camera.aspect);
    retex(Math.min(2048, Math.max(512, Math.ceil(W * (h / (2 * dMin * tn)) * Math.min(devicePixelRatio || 1, 2) / 256) * 256)));
    /* تغييرُ المقاس يمسح اللوحة: تُرسم الآن في الإطار نفسِه، وإلّا ظهرت فارغةً إطارًا بعد كلّ إطارٍ والقسمةُ تتحرّك (وميض) */
    if (!dead && typeof frameNow === 'function') frameNow(); else needs = true;
  }
  resize();

  // ===== الحركة =====
  let last = performance.now(), idle = false, hover = -1, raf = 0, goneAt = 0;
  const T = { follow: 0.07, settle: 0.12, flip: 0.8, hoverLift: 0.035, fan: 0.05 };
  function frame(now) {
    raf = requestAnimationFrame(frame);
    /* نُقل الكتابُ بين الرسمات فانفصل لحظةً — ويُطفأ إن طال انفصالُه (رُفع الكتاب) */
    if (!el.isConnected) { if (!goneAt) goneAt = now; else if (now - goneAt > 6000) dispose(); return; }
    goneAt = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    let moving = false, active = null;
    if (mo && mo.a) {
      const q = Math.min(1, Math.max(0, (now - mo.a.t0) / mo.a.dur));
      const e = cosE(q);
      mo.k = mo.a.from + (mo.a.to - mo.a.from) * e; moving = true;
      if (mo.box) mo.vh = mo.box.h0 + (mo.box.h1 - mo.box.h0) * e;
      if (q >= 1) {
        const r = mo.a.res; mo.k = mo.a.to; mo.a = null;
        if (mo.k === 0) { mo = null; el.style.top = el.style.marginTop = ''; resize(); }
        r();
      }
    }
    for (const s of sheets) if (s.drag != null || s.anim) { if (!active || s.drag != null) active = s; }
    if (calm && !active) calm = false;
    for (const s of sheets) {
      if (s.anim) {
        const k = Math.min(1, Math.max(0, (now - s.anim.t0) / s.anim.dur));
        s.p = s.anim.from + (s.anim.to - s.anim.from) * s.anim.ease(k);
        if (k >= 1) { s.p = s.anim.to; s.anim = null; }
        moving = true;
      } else if (s.drag != null) {
        s.p += (s.drag - s.p) * (1 - Math.exp(-dt / T.follow)); moving = true;
      } else {
        s.dir = s.target === 0 ? 1 : -1;   /* الساكنةُ (والمرفوعةُ بالتحويم) تلتفّ بعيدًا عن كومتها، لا نحوها */
        let goal = s.target;
        if (s.i === hover && !active) goal = s.target === 0 ? T.hoverLift / (ONE ? 2 : 1) : 1 - T.hoverLift;
        /* الانفراجُ في الكومة التي تغادرها الورقةُ وحدها — كومةُ الهبوط ساكنةٌ تنتظرها، وإلّا ارتفعت إليها فتداخلتا */
        if (active && active !== s && !s.isCover && !active.isCover && s.target === (active.dir > 0 ? 0 : 1)) {
          const d = s.target === 0 ? s.i - active.i : active.i - s.i;
          if (d >= 1 && d <= 2) {
            const lift = (s.target === 0 ? active.p : 1 - active.p) * T.fan / d;
            goal = s.target === 0 ? Math.max(goal, Math.min(lift, active.p - 0.02)) : Math.min(goal, Math.max(1 - lift, active.p + 0.02));
          }
        }
        if (Math.abs(goal - s.p) > 1e-4) { s.p += (goal - s.p) * (1 - Math.exp(-dt / T.settle)); moving = true; } else s.p = goal;
      }
      s.tilt += (s.tiltT - s.tilt) * (1 - Math.exp(-dt / 0.15));
      s.u.uP.value = s.p; /* الحرفُ يتقدّم في النصف الأوّل ويتأخّر في الثاني (كالورق يسقط على كومته) — فلا يغوص التفافُه في الأوراق التي يهبط عليها */
      const q = s.dir > 0 ? s.p : 1 - s.p;
      s.u.uBend.value = Math.sin(s.p * Math.PI) * Math.cos(q * Math.PI * 0.9) * 2.8 * s.dir; s.u.uTilt.value = s.tilt * Math.sin(s.p * Math.PI);
      s.u.uLift0.value = (S - s.i) * STACK;
      /* وراء الكتاب: الأحدثُ طيًّا أقربُ إلى ظهره */
      s.u.uLift1.value = ONE ? -(S - s.i) * STACK - 0.002 : (s.i + 1) * STACK;
      s.u.uFloorL.value = s.i < S - 1 ? (S - s.i - 1) * STACK : -1;
      s.u.uFloorR.value = !ONE && s.i > 0 ? s.i * STACK : -1;
      s.u.uSpan.value = ONE ? 2 : 1;
      /* النصفُ المطويّ كتلةً واحدة: يدور حول الكعب (‎θ‎ من ‎π‎ إلى ‎2π‎ لليمنى، ومن ‎0‎ إلى ‎−π‎ لليسرى)،
         وارتفاعاتُها تنزل إلى ما وراء الكتاب بترتيبها نفسِه (الأعلى يبقى أعلى فلا تتبادل الأوراقُ الظهورَ وهي تدور) */
      if (mo && mo.k > 0 && (mo.side === 'L' ? s.i < A : s.i >= A)) {
        const k = mo.k, L = mo.side === 'L', u = s.u;
        u.uSpan.value = 2; u.uP.value = L ? (1 + k) / 2 : -k / 2;
        u.uLift0.value = u.uLift1.value = (L ? s.i + 1 : S - s.i) * STACK - k * ((S + 1) * STACK + 0.002);
        u.uBend.value = 0; u.uTilt.value = 0;   /* بلا انحناء: الغلافُ صلبٌ والورقُ ينحني فيبرز أحدُهما من تحت الآخر */
        u.uFloorL.value = u.uFloorR.value = -1;
      }
      const cast = s.anim != null || s.drag != null || (s.p > 0.002 && s.p < 0.998) || Math.abs(s.i + 0.5 - A) < 2;
      if (s.cast !== cast) { s.cast = cast; for (const mh of s.meshes) mh.castShadow = cast; }
    }
    /* المغلقُ يقف في الوسط: الكتابُ كلُّه ينزاح نصفَ ورقةٍ مع الغلاف (وكذا في آخره مع الغلاف الخلفيّ) */
    const pc = sheets[0].p;
    const x = mo ? (mo.side === 'L' ? 1 : -1) * W / 2 * mo.k : ONE ? W / 2 : W / 2 * (1 - pc);
    ground.position.z = mo ? GZ + (GZ1 - GZ) * mo.k : GZ;
    if (Math.abs(book.position.x - x) > 1e-5) { book.position.x = x; moving = true; }
    /* على الطاولة: الارتفاعُ والدورانُ إلى القراءة (أو النزولُ منها)، والتحويمُ يرفعه شعرة */
    if (ta) {
      const q = Math.min(1, Math.max(0, (now - ta.t0) / ta.dur));
      tv = ta.from + (ta.to - ta.from) * q;
      tRise = Math.sin(Math.PI * q) * (ta.to > ta.from ? 1 : 0.55);
      /* يُفتح الغلافُ قرب آخر الدوران فتكون الحركةُ واحدة */
      if (q >= 1) {
        const opening = ta.to === 1, goal = ta.goal; tv = ta.to; tRise = 0; ta = null;
        /* الكاميرا فوقه والغلافُ سُلِّم إلى ورقة القراءة: الآن ينفتح (على الفتحة المطلوبة) */
        if (opening && A === 0) {
          updCase(1);
          /* الصفحةُ الواحدة: الغلافُ يُطوى إلى ما وراء الكتاب سريعًا والكاميرا ثابتة (كانت تتراجع معه فيُرى باطنُه لوحًا عريضًا
             بجانب الصفحة قبل أن ينطوي) — والفتحةُ صفحتان: يتقلّب الغلافُ كالعادة */
          if (ONE) { calm = true; goTo(goal || 1, 0.55); } else goTo(goal || 1);
        }
        if (cfg.onTable) cfg.onTable(tv < 1);
      }
      moving = true;
    }
    /* الغلافُ انطبق تمامًا (والكاميرا فوقه): يُسلَّم إلى الغلاف الصلب وينزل */
    if (tAfter && sheets[0].target === 0 && sheets[0].p === 0 && !sheets[0].anim) { tAfter = false; table(0); }
    const hv = tv < 1 ? tHovT : 0;
    if (Math.abs(hv - tHov) > 1e-4) { tHov += (hv - tHov) * (1 - Math.exp(-dt / 0.12)); moving = true; } else tHov = hv;
    const z = (tRise * 0.07 + tHov * 0.016) * W + BT * (1 - smooth(tv));   /* اللوحُ الخلفيّ على الطاولة لا تحتها */
    tableLight(smooth(tv));
    if (Math.abs(book.position.z - z) > 1e-6) { book.position.z = z; moving = true; }
    updCase(smooth(tv));
    if (frameCam()) moving = true;
    if (moving || needs) { renderer.render(scene, camera); needs = false; }
    const wasIdle = idle; idle = !moving && !drag;
    if (idle && !wasIdle && cfg.onIdle) cfg.onIdle();
    if (!idle && wasIdle && cfg.onBusy) cfg.onBusy();
  }
  raf = requestAnimationFrame(frame);
  frameNow = () => { if (el.isConnected) { renderer.render(scene, camera); needs = false; } else needs = true; };

  const cosE = k => 0.5 - 0.5 * Math.cos(Math.PI * k);
  /* الإفلاتُ يحمل سرعةَ اليد: منحنى ‎Hermite‎ يبدأ بميلٍ = السرعة × المدّة، وينتهي ساكنًا */
  const hermite = m0 => k => { const k2 = k * k, k3 = k2 * k; return (k3 - 2 * k2 + k) * m0 + (3 * k2 - 2 * k3); };
  function launch(s, to, v, delay = 0, durK = 1) {
    const dist = Math.abs(to - s.p);
    s.target = to;
    if (dist < 1e-4) { s.p = to; s.anim = null; return; }
    const dur = Math.max(0.22, T.flip * durK * Math.sqrt(dist) * (s.isCover ? 1.15 : 1) * (ONE ? 1.45 : 1));
    const towards = (to - s.p) * v > 0 ? Math.abs(v) : 0;
    const m0 = Math.min(2, towards * dur / dist);
    s.anim = { from: s.p, to, t0: performance.now() + delay, dur: dur * 1000, ease: m0 > 0.05 ? hermite(m0) : cosE };
  }
  const turnable = dir => dir > 0 ? A < maxA : A > 0;
  /* بعد كلّ تقليبة يُنسى المرفوعُ بالتحويم: كان رقمُه يبقى على الورقة نفسِها بعد هبوطها يمينًا فترتفع هناك.
     ويُحسب من جديد مع أوّل حركةٍ للفأرة */
  const commit = () => {
    hover = -1; keepNear();
    /* رجع إلى الغلاف: ينزل إلى الطاولة بعد أن ينطبق — وإن فُتح ثانيةً قبل ذلك بقي */
    if (cfg.rest) tAfter = A === 0 && tv === 1 && !ta;
    if (cfg.onTurn) cfg.onTurn(A);
  };
  /* ‏‎to = 1‎ يرفعه من الطاولة ويفتحه (على الفتحة ‎goal‎) · ‏‎0‎ ينزله إليها (والغلافُ منطبق) */
  function table(to, goal = 1) {
    if (dead || (ta ? ta.to === to : tv === to)) return;
    /* لا يبقى لونُ نصف التقليب ولا مؤشّرُه من قبل (الطاولةُ لا تُقلَّب) */
    tHovT = 0; hover = -1; setGrab(''); setCursor();
    if (cfg.onBusy && idle) cfg.onBusy();
    ta = { from: tv, to, t0: performance.now(), dur: to ? 1150 : 900, goal: Math.max(1, goal | 0) };
    needs = true;
  }
  function flip(dir) {
    if (tv < 1 || ta) { if (dir > 0 && !ta) table(1); return dir > 0; }
    if (mo || !turnable(dir)) return false;
    const s = sheets[dir > 0 ? A : A - 1];
    A += dir; s.dir = dir; s.tiltT = 0; launch(s, dir > 0 ? 1 : 0, 0);
    commit();
    return true;
  }
  /* القفزُ إلى فتحةٍ بعيدة: الأوراقُ بينهما تتقلّب متتابعةً سريعة (حتى ثمانٍ)، وما وراءها يُنقل ساكنًا تحت الكومة */
  function goTo(t, durK = 0.8) {
    t = Math.max(0, Math.min(maxA, t | 0));
    if (tv < 1 && !ta) { if (t > 0) table(1, t); return; }
    if (mo || t === A) return;
    const dir = t > A ? 1 : -1, list = [];
    for (let i = A; i !== t; i += dir) list.push(sheets[dir > 0 ? i : i - 1]);
    const far = list.length > 8 ? list.slice(0, list.length - 8) : [];
    const near = list.slice(far.length);
    A = t;
    for (const s of far) { s.anim = null; s.p = s.target = dir > 0 ? 1 : 0; }
    near.forEach((s, k) => { s.dir = dir; s.tiltT = 0; launch(s, dir > 0 ? 1 : 0, 0, k * 70, durK); });
    commit();
  }

  // ===== التفاعل =====
  // المقبضُ مساحةُ الكتاب لا الكتاب (طلبُ صاحب الموقع): نصفُها الأيسرُ كلُّه — جنبَ الكتاب وفوقه وتحته — يتقدّم (كتابٌ عربيّ)
  // والأيمنُ يرجع، والصفحةُ نفسُها للقراءة والتحديد لا تُمسك — إلّا الغلافَ المغلق يُنقر فيُفتح. ‏‎cfg.zone‎ المساحةُ (اللوحةُ إن لم تُعطَ)،
  // و‎cfg.armed()‎ أنّها المساحةُ المختارةُ التي يُعمل فيها: قبلها لا ترتفع ورقةٌ ولا تُسحب ·
  // السحبُ نسبيّ: ‎80%‎ من عرض الكتاب تقليبةٌ كاملة · ‎20%‎ أو رميةٌ سريعةٌ تُكمل · الضغطُ المطوّلُ يقلّب تلقائيًّا ويتسارع
  let zone = cfg.zone || el;
  zone.style.touchAction = 'pan-y';
  const armed = () => !cfg.armed || cfg.armed();
  /* أزرارُ المساحة وما يسمّيه الموقعُ (‎cfg.zoneSkip‎: رأسُها وأيقونتُها التي تُغلقها) ليست مقبضًا — لا تتلوّن ولا تُقلِّب */
  const SKIP = 'button, a, input, textarea, select, [contenteditable="true"]' + (cfg.zoneSkip ? ', ' + cfg.zoneSkip : '');
  const skip = e => e.target !== el && !!(e.target.closest && e.target.closest(SKIP));
  const at = e => {
    const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const yN = Math.max(-0.5, Math.min(0.5, (y - fit.y) / fit.h - 0.5));
    if (x >= fit.x && x <= fit.x + fit.w && y >= fit.y && y <= fit.y + fit.h) return A === 0 ? { fwd: true, yN, cover: true } : null;
    return { fwd: x < fit.x + fit.w / 2, yN };
  };
  let drag = null, hold = null;
  const stopHold = () => { if (hold) { clearTimeout(hold.timer); hold = null; } };
  /* المؤشّرُ على مقبضٍ يُقلِّب (ولو لم ترتفع له ورقة: المطويّةُ وراء الكتاب) — ‏‎'l' | 'r'‎ نصفُه، و‎'c'‎ الغلافُ المغلق ·
     ‏‎cfg.onZone(side)‎ يُخبر بالنصف الذي يُقلَّب منه الآن (أو ‎null‎) فيُرسَم دليلُه */
  let grab = '';
  const setGrab = v => { if (v === grab) return; grab = v; if (cfg.onZone) cfg.onZone(v === 'l' || v === 'r' ? v : null); };
  const setCursor = () => { zone.style.cursor = drag ? 'grabbing' : grab ? 'grab' : ''; };
  const onDown = e => {
    if (e.button !== 0) return;
    /* نصٌّ محدَّدٌ في الصفحة: النقرةُ تُلغي التحديد ولا تقلّب */
    const sel = window.getSelection && window.getSelection();
    if (sel && !sel.isCollapsed && host.contains(sel.anchorNode)) { sel.removeAllRanges(); return; }
    if (skip(e)) return;
    /* على الطاولة: الكتابُ نفسُه يُنقر فيرتفع وينفتح */
    if (tv < 1 || ta) { if (!ta && inRest(e)) table(1); return; }
    const g = at(e);
    if ((g || e.target === el) && cfg.interceptDown && cfg.interceptDown()) return;
    if (!g || (g.cover ? locked() : mo) || !armed()) return;
    const dir = g.fwd ? 1 : -1;
    if (!turnable(dir)) return;
    const s = sheets[g.fwd ? A : A - 1];
    s.anim = null; s.dir = dir; s.tiltT = s.isCover ? 0 : -g.yN * 0.7 * dir;
    hover = -1;
    drag = { s, fwd: g.fwd, x0: e.clientX, y0: e.clientY, base: s.p, w: fit.w || el.clientWidth, moved: false, hist: [[performance.now(), s.p]] };
    s.drag = s.p; try { zone.setPointerCapture(e.pointerId); } catch (er) {} setCursor();
    if (cfg.onGrab) cfg.onGrab();
    stopHold();
    hold = { n: 0, timer: setTimeout(function tick() {
      if (!drag || drag.moved) return stopHold();
      if (hold.n === 0) { drag.s.drag = null; drag.auto = true; }
      if (!flip(dir)) return stopHold();
      hold.n++; hold.timer = setTimeout(tick, Math.max(150, 420 - 45 * hold.n));
    }, 450) };
  };
  /* ‏‎cfg.locked‎: أداةُ تظليلٍ مختارة — لا تُقرأ الفأرةُ على **الصفحة** نيّةَ تقليبٍ (لا عجلةَ ولا نقرَ الغلاف). والمقبضُ حولها
     خارجَها فيبقى يُقلِّب والأداةُ مختارة (كان القفلُ يُعطّله بعد كلّ تظليل، إذ تُختار الأداةُ معه) — إلّا والكتابُ يتبدّل وضعُه */
  const locked = () => !!mo || !!(cfg.locked && cfg.locked());
  const onMove = e => {
    if (!drag) {
      if (e.pointerType !== 'mouse') return;
      if (mo) { if (hover !== -1 || grab) { hover = -1; setGrab(''); needs = true; setCursor(); } return; }
      if (tv < 1 || ta) {
        const on = !ta && inRest(e);
        if (hover !== -1 || grab) { hover = -1; setGrab(''); }
        tHovT = on ? 1 : 0; zone.style.cursor = on ? 'pointer' : ''; needs = true;
        return;
      }
      /* وفي الصفحة الواحدة لا ترتفع ورقةٌ بالتحويم (طلبُ صاحب الموقع): الكاميرا تتراجع مع كلّ ورقةٍ مرفوعة، فكانت الفأرةُ الباقيةُ
         في مكانها بعد التقليب ترفع التاليةَ فيبدو كأنّها تنفتح ثمّ ترجع — يكفيها لونُ النصف */
      const g0 = armed() && !skip(e) && at(e), g = g0 && !(g0.cover && locked()) && g0, ok = !!g && turnable(g.fwd ? 1 : -1), h = ok && !ONE ? (g.fwd ? A : A - 1) : -1;
      const gv = !ok ? '' : g.cover ? 'c' : g.fwd ? 'l' : 'r';
      if (h !== hover || gv !== grab) { hover = h; setGrab(gv); needs = true; setCursor(); }
      return;
    }
    if (drag.auto) return;
    const dx = e.clientX - drag.x0;
    if (!drag.moved && Math.hypot(dx, e.clientY - drag.y0) > 5) { drag.moved = true; stopHold(); }
    drag.s.drag = Math.max(0, Math.min(1, drag.base + dx / (drag.w * 0.8)));
    const now = performance.now(); drag.hist.push([now, drag.s.drag]);
    while (drag.hist.length > 2 && now - drag.hist[0][0] > 90) drag.hist.shift();
  };
  const onUp = () => {
    if (!drag) return;
    const { s, fwd, moved, base, hist, auto } = drag; drag = null; stopHold(); setCursor();
    if (auto) return;
    const hand = s.drag; s.drag = null;
    const tu = performance.now(); hist.push([tu, hand]);
    while (hist.length > 2 && tu - hist[0][0] > 90) hist.shift();
    const [t0, p0] = hist[0], [t1, p1] = hist[hist.length - 1];
    const v = t1 > t0 ? (p1 - p0) / ((t1 - t0) / 1000) : 0;
    const gone = fwd ? hand - base : base - hand, flick = fwd ? v > 1.6 : v < -1.6;
    if (!moved || gone >= 0.2 || flick) { A += fwd ? 1 : -1; launch(s, fwd ? 1 : 0, v); commit(); }
    else launch(s, base < 0.5 ? 0 : 1, v);
  };
  const inRest = e => { if (!restRect) return false; const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; return x >= restRect.x && x <= restRect.x + restRect.w && y >= restRect.y && y <= restRect.y + restRect.h; };
  const onLeave = () => {
    if (tHovT) { tHovT = 0; needs = true; zone.style.cursor = ''; } if (!drag && (hover !== -1 || grab)) { hover = -1; setGrab(''); needs = true; setCursor(); } };
  let wheelAcc = 0, wheelT = 0;
  const onWheel = e => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || locked() || tv < 1 || ta) return;
    e.preventDefault(); const now = performance.now();
    if (now - wheelT > 400) wheelAcc = 0;
    wheelT = now; wheelAcc += e.deltaX;
    if (Math.abs(wheelAcc) > 60) { flip(wheelAcc < 0 ? 1 : -1); wheelAcc = 0; wheelT = now + 250; }
  };
  /* ‏‎lostpointercapture‎: انقطع الإمساكُ (أُعيد رسمُ المساحة أثناء السحب) — يُتمّ السحبَ ولا تبقى ورقةٌ معلّقة */
  const evs = [['pointerdown', onDown], ['pointermove', onMove], ['pointerup', onUp], ['pointercancel', onUp], ['lostpointercapture', onUp], ['pointerleave', onLeave]];
  for (const [t, f] of evs) zone.addEventListener(t, f);
  /* المساحةُ تُبنى من جديد مع كلّ رسمةٍ للقسم والكتابُ يُنقل إليها كما هو: المستمعون ينتقلون معه، وإلّا بقوا على القديمة
     المنفصلة فتوقّف التقليبُ من حول الكتاب بعد أوّل رسمة */
  function setZone(z) {
    z = z || el;
    if (z === zone || dead) return;
    for (const [t, f] of evs) zone.removeEventListener(t, f);
    if (zone !== el) zone.style.cursor = zone.style.touchAction = '';
    if (drag) { drag.s.drag = null; drag = null; stopHold(); }
    hover = -1; setGrab(''); needs = true;
    zone = z; zone.style.touchAction = 'pan-y';
    for (const [t, f] of evs) zone.addEventListener(t, f);
    setCursor();
  }
  el.addEventListener('wheel', onWheel, { passive: false });

  function dispose() {
    if (dead) return; dead = true;
    cancelAnimationFrame(raf); stopHold();
    for (const [t, f] of evs) zone.removeEventListener(t, f);
    setGrab('');
    if (zone !== el) zone.style.cursor = zone.style.touchAction = '';
    pageTex.forEach(t => t.dispose()); pageTex.clear();
    [grain, blank, inside, outsideBack].forEach(t => t.dispose());
    for (const s of sheets) for (const mh of s.meshes) { mh.material.dispose(); mh.customDepthMaterial.dispose(); }
    geo.dispose(); ground.geometry.dispose(); ground.material.dispose();
    renderer.dispose(); renderer.forceContextLoss();
    el.remove();
  }

  return {
    el, flip, goTo, resize, setTheme, dispose, turnable, setZone, one: ONE,
    /* يرفعه من الطاولة ويفتحه (‎open‎) أو يُغلقه وينزله إليها (‎rest‎) */
    open() { if (tv < 1 || ta) table(1); },
    rest() { if (!cfg.rest) return; if (A > 0) { tAfter = true; goTo(0); } else table(0); },
    get onTable() { return tv < 1 || !!ta; },
    /* يطوي نصفَ الفتحة (‎to = 1‎) أو يفتحه (‎0‎) في ‎dur‎ ميلي ثانية — ويَعِد بانتهائه */
    /* ‏‎box = { h0, h1 }‎ قامةُ المساحة قبل التبدُّل وبعده (تتغيّر بالمدّة والمنحنى نفسَيهما): اللوحةُ تُكبَّر مرّةً إلى أطولهما
       وتتوسّط المساحة، والكتابُ يُحجَّم داخلها — فلا تُعاد اللوحةُ ولا صورُها في كلّ إطار */
    morph(side, to, dur = 700, box) {
      if (ONE || dead) return Promise.resolve();
      if (!mo) { if (!to) return Promise.resolve(); mo = { side: side === 'R' ? 'R' : 'L', k: 0, a: null }; }
      hover = -1; needs = true;
      if (box && box.h0 > 0 && box.h1 > 0) {
        mo.box = box; mo.vh = box.h0;
        const hc = Math.max(ch, box.h0, box.h1);
        if (hc !== ch) { ch = hc; renderer.setSize(cw, ch, false); el.style.height = ch + 'px'; camera.aspect = cw / ch; }
        el.style.top = '50%'; el.style.marginTop = -ch / 2 + 'px';
        camOpen = -1;
      }
      if (mo.a) mo.a.res();
      return new Promise(res => { mo.a = { from: mo.k, to: to ? 1 : 0, t0: performance.now(), dur: Math.max(1, dur), res }; });
    },
    /* صفحةٌ تغيّر ما يُرسم عليها (تحديداتٌ وأرقام): تُطلب صورتُها من جديد إن كانت محمَّلة */
    refreshPage(k) {
      const t = pageTex.get(k); if (!t) return Promise.resolve();
      return Promise.resolve(cfg.tex(k, texW)).then(cv => {
        if (dead || !cv) return;
        if (t.image && (t.image.width !== cv.width || t.image.height !== cv.height)) t.dispose();
        t.image = cv; t.needsUpdate = true; needs = true;
      }).catch(() => {});
    },
    /* كلُّ الأوراق مستقرّةٌ تمامًا في كومتها (لا مرفوعةَ بتحويمٍ ولا مُمسَكة): الصفحةُ مسطّحةٌ فتنطبق عليها طبقةُ النصّ */
    get flat() { return !mo && tv === 1 && !ta && !drag && sheets.every(s => !s.anim && s.drag == null && (s.p === 0 || s.p === 1)); },
    get A() { return A; }, get maxA() { return maxA; }, get dead() { return dead; },
    get settled() { return !mo && tv === 1 && !ta && idle && !drag && sheets.every(s => !s.anim); },
    rect: () => fit,
    /* الصفحاتُ الساكنةُ الظاهرة ومستطيلاتُها على اللوحة (بكسل CSS) — تُسقَط زواياها من موضعها الحقيقيّ (فوق كومتها) بالكاميرا نفسِها،
       فتنطبق عليها طبقةُ النصّ. ‏‎k‎ رقمُ الصفحة في الملفّ */
    pageRects() {
      if (A === 0 || mo) return [];
      const v = new THREE.Vector3(), out = [];
      const proj = (x, y, z) => { v.set(x + book.position.x, y, z).project(camera); return [(v.x + 1) / 2 * cw, (1 - v.y) / 2 * ch]; };
      const face = (vk, x0, x1, z) => {
        if (!(vk >= 1 && vk <= N)) return;
        const k = vk + SK;
        const [ax, ay] = proj(x0, H / 2, z), [bx, by] = proj(x1, -H / 2, z);
        out.push({ k, x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay) });
      };
      if (ONE) { if (A < S - 1) face(A, -W, 0, (S - A) * STACK); }
      else {
        if (A < S - 1) face(2 * A - 1, -W, 0, (S - A) * STACK);
        face(2 * (A - 1), 0, W, A * STACK);
      }
      return out;
    },
    ready: () => Promise.all([...pageTex.values()].map(t => t.userData.ready)),
    /* لقطةٌ للّوحة (للشبح الذي يخرج به الكتابُ في القسمة) — تُرسم الآن فتُقرأ قبل أن يُمسح المخزن */
    snapshot(cv) { renderer.render(scene, camera); const c = cv.getContext('2d'); cv.width = el.width; cv.height = el.height; c.drawImage(el, 0, 0); },
    sheets,
  };
}
