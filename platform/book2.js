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
  float th = uP * PI;
  vec2 eu = vec2(-cos(th), sin(th));
  vec2 en = vec2(sin(th), cos(th));
  vec2 xz = x * eu + zc * en;
  float lift = mix(uLift0, uLift1, smoothstep(0.0, 1.0, uP));
  // انتفاخُ الورق قرب الكعب واحدٌ لكلّ الأوراق والغلاف — وإلّا علت الصفحةُ الأولى على الغلاف فحجبته
  float z = xz.y + lift + bulgeAt(s.x) * (1.0 - sin(th));
  // لا تنزل الورقةُ تحت سطح الكومة التي فوقها: التفافُها قرب الهبوط أو مع التحويم كان يغوص في الأوراق تحتها
  float sx = clamp(abs(xz.x) / W, 0.0, 1.0);
  float fl = xz.x < 0.0 ? uFloorL : uFloorR;
  if (fl > -0.5) z = max(z, fl + bulgeAt(sx) + 0.0006);
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
  const m = Math.ceil(cfg.n / 2), S = m + 2;
  const maxA = Math.min(S - 1, Math.floor(cfg.n / 2) + 1);
  let A = Math.max(0, Math.min(maxA, cfg.A | 0));
  let needs = true, dead = false;

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
  ground.position.z = -0.004; ground.receiveShadow = true; scene.add(ground);

  const geo = new THREE.PlaneGeometry(1, 1, 48, Math.round(48 * AR));
  geo.setAttribute('aSheet', geo.attributes.uv.clone());
  const grain = grainTexture(THREE);
  const solid = hex => { const c = new THREE.Color(hex); const t = new THREE.DataTexture(new Uint8Array([c.r * 255, c.g * 255, c.b * 255, 255].map(Math.round)), 1, 1); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t; };
  const blank = solid('#f6f1e6');
  /* باطنُ الغلاف بلونه، وظاهرُ الغلاف الخلفيّ أغمقُ قليلًا */
  const coverC = new THREE.Color(cfg.cover || '#2c5e65'); coverC.convertSRGBToLinear();
  const inside = solid('#' + new THREE.Color(cfg.cover || '#2c5e65').getHexString());
  const outsideBack = solid('#' + new THREE.Color(cfg.cover || '#2c5e65').multiplyScalar(0.85).getHexString());

  let texW = 1024;
  const pageTex = new Map();
  function texFor(k) {
    if (k === 'inside') return inside;
    if (k === 'back') return outsideBack;
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
  const faces = i => i === 0 ? ['cover', 'inside'] : i === S - 1 ? ['inside', 'back'] : [2 * i - 1, 2 * i];

  const sheets = [];
  for (let i = 0; i < S; i++) {
    const isCover = i === 0 || i === S - 1;
    const u = { uP: { value: 0 }, uBend: { value: 0 }, uTilt: { value: 0 }, uLift0: { value: 0 }, uLift1: { value: 0 }, uFloorL: { value: -1 }, uFloorR: { value: -1 }, uStiff: { value: isCover ? 0.85 : 0 }, uSize: { value: new THREE.Vector2(W, H) } };
    /* ‏‎u‎ يتّجه إلى ‎−x‎ ساكنًا فينقلب ترتيبُ الرؤوس: الوجهُ مادّتُه ‎BackSide‎ والظهرُ ‎FrontSide‎، وكلاهما بعموديٍّ معكوس */
    const mk = (side, mirror, flipThru) => {
      const mt = patch(new THREE.MeshStandardMaterial({ side, roughness: isCover ? 0.7 : 0.86, metalness: 0, color: '#ffffff' }), true, -1, true);
      mt.userData.u = u; mt.userData.mirror = mirror;
      mt.userData.x = { uThru: { value: blank }, uThruFlip: { value: flipThru }, uThruAmt: { value: isCover ? 0 : 0.07 },
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
    pageTex.forEach(t => t.dispose()); pageTex.clear();
    keepNear();
  }

  function setTheme(th) {
    const L = LIGHTS[th === 'dark' ? 'dark' : 'light'];
    sky.color.set(L.sky[0]); sky.groundColor.set(L.sky[1]); sky.intensity = L.sky[2];
    sun.color.set(L.sun[0]); sun.intensity = L.sun[1];
    ground.material.opacity = L.ground;
    for (const s of sheets) for (const mt of [s.fm, s.bm]) mt.userData.x.uPaper.value.set(...(s.isCover ? [1, 1, 1] : L.paper));
    needs = true;
  }
  setTheme(cfg.theme);

  sheets.forEach(s => { s.p = s.target = s.i < A ? 1 : 0; });
  keepNear();

  /* الكاميرا تسع الفتحةَ (‎2W × H‎) بهامشٍ للظلّ. ‏‎rect()‎ مستطيلُ الفتحة على اللوحة (بكسل CSS) */
  let frameNow = null;
  let cw = 0, ch = 0, fit = { x: 0, y: 0, w: 0, h: 0 };
  const MX = 1.06, MY = 1.1;
  /* المغلقُ ورقةٌ واحدة: الكاميرا تقترب حتى يسع الغلافُ وحده، وتبتعد مع انفتاحه حتى تسع الفتحةَ (طلبُ صاحب الموقع: «كبّر الكتب»).
     ‏‎o‎ انفتاحُ الغلاف ‎0..1‎ (تقدُّمُ ورقته)، فالعرضُ المطلوب ‎W(1+o)‎ */
  let camOpen = -1;
  function frameCam() {
    const o = sheets.length ? Math.max(0, Math.min(1, sheets[0].p)) : 1;
    if (Math.abs(o - camOpen) < 1e-4) return false;
    camOpen = o;
    const tn = Math.tan(camera.fov * Math.PI / 360);
    const dist = Math.max(H * MY / 2 / tn, W * (1 + o) * MX / 2 / tn / camera.aspect);
    camera.position.set(0, -0.04 * H, dist); camera.lookAt(0, -0.04 * H, 0); camera.updateProjectionMatrix();
    const ppu = ch / (2 * dist * tn);   // بكسلٌ لكلّ وحدة في مستوى الكتاب
    fit = { w: 2 * W * ppu, h: H * ppu, x: cw / 2 - W * ppu, y: ch / 2 - H * ppu / 2 };
    return true;
  }
  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    if (w === cw && h === ch) return;
    cw = w; ch = h;
    renderer.setSize(w, h, false); el.style.width = w + 'px'; el.style.height = h + 'px';
    camera.aspect = w / h;
    camOpen = -1; frameCam();
    /* الدقّةُ على أكبر قدرٍ تبلغه الصفحة (المغلقُ يُقرَّب) */
    const tn = Math.tan(camera.fov * Math.PI / 360), dMin = Math.max(H * MY / 2 / tn, W * MX / 2 / tn / camera.aspect);
    retex(Math.min(2048, Math.max(512, Math.ceil(W * (h / (2 * dMin * tn)) * Math.min(devicePixelRatio || 1, 2) / 256) * 256)));
    /* تغييرُ المقاس يمسح اللوحة: تُرسم الآن في الإطار نفسِه، وإلّا ظهرت فارغةً إطارًا بعد كلّ إطارٍ والقسمةُ تتحرّك (وميض) */
    if (!dead && typeof frameNow === 'function') frameNow(); else needs = true;
  }
  resize();

  // ===== الحركة =====
  let last = performance.now(), idle = false, hover = -1, raf = 0, goneAt = 0;
  const STACK = 0.0016;
  const T = { follow: 0.07, settle: 0.12, flip: 0.8, hoverLift: 0.035, fan: 0.05 };
  function frame(now) {
    raf = requestAnimationFrame(frame);
    /* نُقل الكتابُ بين الرسمات فانفصل لحظةً — ويُطفأ إن طال انفصالُه (رُفع الكتاب) */
    if (!el.isConnected) { if (!goneAt) goneAt = now; else if (now - goneAt > 6000) dispose(); return; }
    goneAt = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    let moving = false, active = null;
    for (const s of sheets) if (s.drag != null || s.anim) { if (!active || s.drag != null) active = s; }
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
        if (s.i === hover && !active) goal = s.target === 0 ? T.hoverLift : 1 - T.hoverLift;
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
      s.u.uLift1.value = (s.i + 1) * STACK;
      s.u.uFloorL.value = s.i < S - 1 ? (S - s.i - 1) * STACK : -1;
      s.u.uFloorR.value = s.i > 0 ? s.i * STACK : -1;
      const cast = s.anim != null || s.drag != null || (s.p > 0.002 && s.p < 0.998) || Math.abs(s.i + 0.5 - A) < 2;
      if (s.cast !== cast) { s.cast = cast; for (const mh of s.meshes) mh.castShadow = cast; }
    }
    /* المغلقُ يقف في الوسط: الكتابُ كلُّه ينزاح نصفَ ورقةٍ مع الغلاف (وكذا في آخره مع الغلاف الخلفيّ) */
    const pc = sheets[0].p;
    const x = W / 2 * (1 - pc);
    if (Math.abs(book.position.x - x) > 1e-5) { book.position.x = x; moving = true; }
    if (frameCam()) moving = true;
    if (moving || needs) { renderer.render(scene, camera); needs = false; }
    const wasIdle = idle; idle = !moving && !drag;
    if (idle && !wasIdle && cfg.onIdle) cfg.onIdle();
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
    const dur = Math.max(0.22, T.flip * durK * Math.sqrt(dist) * (s.isCover ? 1.15 : 1));
    const towards = (to - s.p) * v > 0 ? Math.abs(v) : 0;
    const m0 = Math.min(2, towards * dur / dist);
    s.anim = { from: s.p, to, t0: performance.now() + delay, dur: dur * 1000, ease: m0 > 0.05 ? hermite(m0) : cosE };
  }
  const turnable = dir => dir > 0 ? A < maxA : A > 0;
  /* بعد كلّ تقليبة يُنسى المرفوعُ بالتحويم: كان رقمُه يبقى على الورقة نفسِها بعد هبوطها يمينًا فترتفع هناك.
     ويُحسب من جديد مع أوّل حركةٍ للفأرة */
  const commit = () => { hover = -1; keepNear(); if (cfg.onTurn) cfg.onTurn(A); };
  function flip(dir) {
    if (!turnable(dir)) return false;
    const s = sheets[dir > 0 ? A : A - 1];
    A += dir; s.dir = dir; s.tiltT = 0; launch(s, dir > 0 ? 1 : 0, 0);
    commit();
    return true;
  }
  /* القفزُ إلى فتحةٍ بعيدة: الأوراقُ بينهما تتقلّب متتابعةً سريعة (حتى ثمانٍ)، وما وراءها يُنقل ساكنًا تحت الكومة */
  function goTo(t) {
    t = Math.max(0, Math.min(maxA, t | 0));
    if (t === A) return;
    const dir = t > A ? 1 : -1, list = [];
    for (let i = A; i !== t; i += dir) list.push(sheets[dir > 0 ? i : i - 1]);
    const far = list.length > 8 ? list.slice(0, list.length - 8) : [];
    const near = list.slice(far.length);
    A = t;
    for (const s of far) { s.anim = null; s.p = s.target = dir > 0 ? 1 : 0; }
    near.forEach((s, k) => { s.dir = dir; s.tiltT = 0; launch(s, dir > 0 ? 1 : 0, 0, k * 70, 0.8); });
    commit();
  }

  // ===== التفاعل =====
  // نصفُ الكتاب كلُّه مقبض (اليسارُ يتقدّم في الكتاب العربيّ واليمينُ يرجع) · السحبُ نسبيّ: ‎80%‎ من عرض الكتاب تقليبةٌ كاملة ·
  // ‎20%‎ أو رميةٌ سريعةٌ تُكمل · نقراتٌ متتاليةٌ تتتابع · الضغطُ المطوّلُ يقلّب تلقائيًّا ويتسارع · الورقةُ تحت المؤشّر ترتفع
  el.style.touchAction = 'pan-y';
  const at = e => {
    const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (y < fit.y || y > fit.y + fit.h) return null;
    /* المغلقُ ورقةٌ واحدةٌ في الوسط تُفتح كلُّها */
    if (A === 0) return x >= fit.x + fit.w / 4 && x <= fit.x + fit.w * 3 / 4 ? { fwd: true, yN: (y - fit.y) / fit.h - 0.5 } : null;
    if (x < fit.x || x > fit.x + fit.w) return null;
    return { fwd: x < fit.x + fit.w / 2, yN: (y - fit.y) / fit.h - 0.5 };
  };
  let drag = null, hold = null;
  const stopHold = () => { if (hold) { clearTimeout(hold.timer); hold = null; } };
  const setCursor = () => { el.style.cursor = drag ? 'grabbing' : hover >= 0 ? 'grab' : ''; };
  const onDown = e => {
    if (e.button !== 0) return;
    const g = at(e); if (!g) return;
    const dir = g.fwd ? 1 : -1;
    if (!turnable(dir)) return;
    const s = sheets[g.fwd ? A : A - 1];
    s.anim = null; s.dir = dir; s.tiltT = s.isCover ? 0 : -g.yN * 0.7 * dir;
    hover = -1;
    drag = { s, fwd: g.fwd, x0: e.clientX, y0: e.clientY, base: s.p, w: fit.w || el.clientWidth, moved: false, hist: [[performance.now(), s.p]] };
    s.drag = s.p; el.setPointerCapture(e.pointerId); setCursor();
    if (cfg.onGrab) cfg.onGrab();
    stopHold();
    hold = { n: 0, timer: setTimeout(function tick() {
      if (!drag || drag.moved) return stopHold();
      if (hold.n === 0) { drag.s.drag = null; drag.auto = true; }
      if (!flip(dir)) return stopHold();
      hold.n++; hold.timer = setTimeout(tick, Math.max(150, 420 - 45 * hold.n));
    }, 450) };
  };
  const onMove = e => {
    if (!drag) {
      if (e.pointerType !== 'mouse') return;
      const g = at(e), h = g && turnable(g.fwd ? 1 : -1) ? (g.fwd ? A : A - 1) : -1;
      if (h !== hover) { hover = h; needs = true; setCursor(); }
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
  const onLeave = () => { if (!drag && hover !== -1) { hover = -1; needs = true; setCursor(); } };
  let wheelAcc = 0, wheelT = 0;
  const onWheel = e => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault(); const now = performance.now();
    if (now - wheelT > 400) wheelAcc = 0;
    wheelT = now; wheelAcc += e.deltaX;
    if (Math.abs(wheelAcc) > 60) { flip(wheelAcc < 0 ? 1 : -1); wheelAcc = 0; wheelT = now + 250; }
  };
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('pointerleave', onLeave);
  el.addEventListener('wheel', onWheel, { passive: false });

  function dispose() {
    if (dead) return; dead = true;
    cancelAnimationFrame(raf); stopHold();
    pageTex.forEach(t => t.dispose()); pageTex.clear();
    [grain, blank, inside, outsideBack].forEach(t => t.dispose());
    for (const s of sheets) for (const mh of s.meshes) { mh.material.dispose(); mh.customDepthMaterial.dispose(); }
    geo.dispose(); ground.geometry.dispose(); ground.material.dispose();
    renderer.dispose(); renderer.forceContextLoss();
    el.remove();
  }

  return {
    el, flip, goTo, resize, setTheme, dispose, turnable,
    get A() { return A; }, get maxA() { return maxA; }, get dead() { return dead; },
    get settled() { return idle && !drag && sheets.every(s => !s.anim); },
    rect: () => fit,
    ready: () => Promise.all([...pageTex.values()].map(t => t.userData.ready)),
    /* لقطةٌ للّوحة (للشبح الذي يخرج به الكتابُ في القسمة) — تُرسم الآن فتُقرأ قبل أن يُمسح المخزن */
    snapshot(cv) { renderer.render(scene, camera); const c = cv.getContext('2d'); cv.width = el.width; cv.height = el.height; c.drawImage(el, 0, 0); },
    sheets,
  };
}
