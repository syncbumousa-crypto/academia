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
/* ===== خطّةُ الجودة · المرحلة ٢: التصغيرُ يفضّل النسخةَ الأحدّ =====
   الصورةُ ‎1.5×‎ الصفحةِ المعروضة (المرحلة ١)، فكان كرتُ الشاشة يخلط مستواها الأصليَّ بنسخةٍ نصفيّةٍ أنعم (‎mipmaps‎، المستوى ≈ ‎0.58‎).
   انحيازُ ‎−0.75‎ يُبقي الساكنةَ على المستوى الأصليّ وحده، والمائلةُ في التقليب تنزل إلى النسخ المصغّرة بقدرٍ أقلّ فلا تتلألأ.
   بالقياس على لوحة الكتاب (طاقةُ الحوافّ في سطرٍ مكبّر): ‎2181 → 2934‎ (‎+35%‎)، وصورةٌ على قدر الصفحة بالضبط كانت أنعم (‎2006‎) */
const PAPER_FRAG = /* glsl */`
#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv, -0.75 );
  diffuseColor *= sampledDiffuseColor;
#endif
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
/* بياناتُه تُحسب مرّةً وتُعاد لكلّ كتاب (كانت ربعَ زمن بناء الكتاب) — والنسيجُ نفسُه لكلّ محرّكٍ لأنّه يُفرَّغ معه */
let GRAIN = null;
function grainTexture(THREE) {
  const N = 128;   /* بلاطةٌ أصغرُ تتكرّر ضعفين (‎uGrainRep‎): الحُبيبةُ نفسُها بربع الحساب */
  if (GRAIN) return grainTex(THREE, GRAIN, N);
  const d = new Uint8Array(N * N * 4);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const oct = [[4, .35], [16, .3], [64, .35]].map(([n, w]) => { const g = new Float32Array(n * n); for (let i = 0; i < g.length; i++) g[i] = rnd(); return { n, w, g }; });
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
  for (let k = 0; k < 105; k++) {
    let x = rnd() * N, y = rnd() * N; const a = rnd() * Math.PI, L = 2 + rnd() * 5, dv = (rnd() - 0.3) * 0.25;
    for (let t = 0; t < L; t++) { const i = ((Math.floor(y) + N) % N) * N + ((Math.floor(x) + N) % N); v[i] += dv; x += Math.cos(a); y += Math.sin(a); }
  }
  for (let i = 0; i < N * N; i++) { const c = Math.max(0, Math.min(255, v[i] * 255)); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = c; d[i * 4 + 3] = 255; }
  GRAIN = d;
  return grainTex(THREE, d, N);
}
function grainTex(THREE, d, N) {
  const t = new THREE.DataTexture(d, N, N); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

const LIGHTS = {
  /* الورقُ بلون الملفّ نفسِه في الأوضاع الثلاثة (طلبُ صاحب الموقع): لا صبغةَ كريميّةً ولا شمسَ دافئة — الفرقُ عن الصفحات المتتالية الظلُّ ثلاثيُّ الأبعاد وحده */
  light: { sky: ['#ffffff', '#d5d9db', 2.3], sun: ['#ffffff', 1.1], ground: 0.12, paper: [1, 1, 1] },
  dark: { sky: ['#ffffff', '#8a8f96', 2.3], sun: ['#ffffff', 1.1], ground: 0.42, paper: [1, 1, 1] },
};

/**
 * cfg: { n, ar (عرض/قامة الصفحة), A, maxA, theme, cover (لون), tex(k, w) ⇒ Promise<canvas|null> (k: رقمُ صفحة أو 'cover'),
 *        onTurn(A) بعد كلّ تغيّرٍ مُلتزَم, onIdle() حين يسكن }
 */
/* (ROADMAP-BOOK-ONE-TWO · المرحلة ١) البناءُ خطواتٌ تفصل بينها ‎yield‎: ‏‎createBook2‎ يمضي فيها كلِّها دفعةً واحدة كما كان،
   و‎createBook2Async‎ يُعطي الإطارَ بين كلّ خطوةٍ وأختها (‎gate‎) — فلا تتجمّد الصفحةُ ‎100–200ms‎ في إطارٍ واحد */
function* book2Steps(THREE, host, cfg) {
  const AR = 1 / cfg.ar, W = 1, H = AR;
  /* ‏‎cfg.one‎: صفحةٌ واحدةٌ أمامك — كلُّ صفحةٍ ورقةٌ وحدها (ظهرُها ورقٌ يشفّ عن وجهها كالمطبوع على وجهٍ واحد)،
     والمقلَّبةُ تُطوى حول الكعب إلى ما وراء الكتاب. ‏‎A‎ فيه رقمُ الصفحة الظاهرة (‎0‎ الغلاف) */
  const ONE = !!cfg.one;
  /* (ROADMAP-BOOK-ONE-TWO · المرحلة ٠) علاماتُ زمنٍ في البناء — لا تعمل إلّا والتشخيصُ مطلوب (‎cfg.diag‎) */
  const DG = typeof cfg.diag === 'function' ? cfg.diag : null, dg0 = DG ? performance.now() : 0, dg = n => { if (DG) DG(n, Math.round(performance.now() - dg0)); };
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
  /* لا يُسأل المشغّلُ عن أخطاء المظلّلات بعد بنائها: السؤالُ يُوقف الصفحةَ حتى ينتهي البناء (نصفُ زمن أوّل رسمة) — والمظلّلاتُ ثابتةٌ مجرَّبة */
  renderer.debug.checkShaderErrors = false;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  dg('renderer');
  yield;
  const el = renderer.domElement;
  el.className = 'bk2-gl';
  host.appendChild(el);
  /* ===== فقدُ سياق الرسم (ROADMAP-BOOK-SWITCH · المرحلة ٦) =====
     الجوالُ (وكرتُ الشاشة الضعيف) يُسقط السياقَ حين تضيق ذاكرتُه، فكان الكتابُ يسودّ ولا يعود. ‏‎three‎ يمنع الإسقاطَ النهائيّ
     (‎preventDefault‎) ويُعيد بناءَ حاله عند الاستعادة، وصورُه وبرامجُه تُرفع وتُترجم من جديد في أوّل رسمة — فهنا: لا رسمَ في
     أثناء الفقد، وإعادةُ الرسم عند الاستعادة، ويُخبَر صاحبُ الكتاب في الحالين (‎cfg.onLost‎) ليضع مكانَه معايناتِ الصفحات أو يبنيه */
  let lost = false;
  /* (المسلخ) المحرّكُ المُطفأُ يفقد سياقَه عمدًا (‎renderer.dispose‎) — ذلك ليس فقدًا يُبلَّغ عنه: لا يُغطّى كتابٌ حيٌّ بسببه */
  el.addEventListener('webglcontextlost', () => { lost = true; if (dead) return; try { cfg.onLost && cfg.onLost(true); } catch (e) {} }, false);
  el.addEventListener('webglcontextrestored', () => { lost = false; needs = true; if (dead) return; try { cfg.onLost && cfg.onLost(false); } catch (e) {} }, false);
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
  const grain = grainTexture(THREE); dg('grain');
  yield;
  /* لونٌ واحدٌ صورةً بكسلٍ واحد — بقيم sRGB نفسِها (كانت تُكتب خطّيّةً ثمّ تُفكّ sRGB فيغمق اللونُ مرّتين: باطنُ الغلاف بدا أسود) */
  const solid = hex => { const h = new THREE.Color(hex).getHexString(); const t = new THREE.DataTexture(new Uint8Array([0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).concat(255)), 1, 1); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t; };
  const blank = solid('#ffffff');   /* الصفحةُ الخاليةُ بيضاءُ كورق الملفّ (كانت بيجًا، وتسري بيجيّتُها في وجه الصفحة من «ما خلفها») */
  /* ظاهرُ الغلاف الخلفيّ بلون الغلاف أغمقَ قليلًا */
  const coverC = new THREE.Color(cfg.cover || '#2c5e65');   /* لونُ اللوحين والكعب (تحويلُ sRGB يجري عند القراءة) */
  /* باطنُ الغلاف بلونه الخارجيّ نفسِه (طلبُ صاحب الموقع) — صار يُرى بلونه بعد إصلاح ‎solid‎ (كان يغمق مرّتين فبدا أسود) */
  const inside = solid('#' + new THREE.Color(cfg.cover || '#2c5e65').getHexString());
  const outsideBack = solid('#' + new THREE.Color(cfg.cover || '#2c5e65').multiplyScalar(0.85).getHexString());

  /* (الدقّةُ الأولى من مقاس المساحة الآن — قبل أن تُطلب الصورُ — بحساب ‎resize‎ نفسِه: لا تُرسم بغيرها ثمّ تُعاد) */
  const TEX_HEAD = 1.5;
  /* بكسلٌ لكلّ وحدة حين يُسَع الكتابُ (عرضُه ‎span‎) في ‎w×h‎ — وللموقع أن يحسبه (‎cfg.frame.fit‎، مثلًا ليتجنّب أيقونتي الزاويتين) */
  function fitS(w, h, span) {
    const fr = cfg.frame, m = fr ? fr.m : 1.04;
    return fr && fr.fit ? fr.fit(w, h, span, H, host) : Math.min(h / (H * m), w / (span * m));
  }
  /* ===== سقفُ دقّة الصورة حسب الجهاز (ROADMAP-BOOK-SWITCH · المرحلة ٣) =====
     كان ‎2048‎ لكلّ جهاز. فيُنزل إلى ما يحتمله كرتُ الشاشة (‎MAX_TEXTURE_SIZE‎)، وإلى ‎1536‎ في الجوال والجهاز قليل الذاكرة
     (‎≤ 4GB‎) — وفي الحاسوب يبقى ‎2048‎ كما كان فلا تتغيّر الدقّةُ التي تُرى */
  const TEX_CAP = (() => {
    let cap = 2048;
    try { cap = Math.min(cap, renderer.capabilities.maxTextureSize || cap); } catch (e) {}
    let low = false;
    try { low = (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820) || (navigator.deviceMemory && navigator.deviceMemory <= 4); } catch (e) {}
    return low ? Math.min(cap, 1536) : cap;
  })();
  let texW = (() => {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return 1024;
    const ppu = fitS(w, h, ONE ? W : 2 * W);
    return Math.min(TEX_CAP, Math.max(256, Math.ceil(W * ppu * Math.min(devicePixelRatio || 1, 2) * TEX_HEAD / 32) * 32));
  })();
  const pageTex = new Map();
  /* ===== رفعُ الصور بميزانية (ROADMAP-BOOK-SWITCH · المرحلة ٢) =====
     كانت كلُّ صورةٍ تجهز تُرفع إلى كرت الشاشة في الإطار نفسِه (‎needsUpdate‎) — ‎17‎ صورةً (‎~900×1300‎ بتصغيراتها) في ثوانٍ
     قليلة بعد التبديل، فيتراكم عملُ كرت الشاشة في إطارٍ واحد: قيس ‎418–583ms‎ بلا سطرِ كود. فالآن تدخل طابورًا، ويُرفع منه
     **صورةٌ واحدة في كلّ إطار** — الظاهرةُ على الفتحة أوّلًا. والوعدُ ‎ready‎ لا يُوفى إلّا بعد رفعها، فلا يُكشف الكتابُ بصفحةٍ بيضاء */
  const upList = [];   /* [صورة، لوحة، يُوفى] */
  function upQ(t, cv) {
    return new Promise(res => {
      const i = upList.findIndex(x => x[0] === t);
      if (i >= 0) { upList[i][2](); upList.splice(i, 1); }
      upList.push([t, cv, res]); needs = true;
    });
  }
  function upSeen(t) {   /* على الفتحة الآن (وجهُ الورقة التي قبلها أو ظهرُ التي بعدها) */
    for (const s of sheets) if (Math.abs(s.i + 0.5 - A) < 1.5 && (s.fm.map === t || s.bm.map === t)) return true;
    return false;
  }
  function upPump() {
    if (!upList.length || dead) return false;
    let bi = 0; for (let i = 0; i < upList.length; i++) if (upSeen(upList[i][0])) { bi = i; break; }
    const [t, cv, res] = upList.splice(bi, 1)[0];
    /* مقاسٌ آخر: مخزنُ الصورة في البطاقة ثابتُ المقاس، فيُحرَّر ليُبنى بالجديد (وإلّا بقيت القديمةُ ملصقةً في زاويتها) */
    if (t.image && (t.image.width !== cv.width || t.image.height !== cv.height)) t.dispose();
    t.image = cv; t.needsUpdate = true; needs = true; res();
    return true;
  }
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
      return upQ(tex, cv);
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
        uGrain: { value: grain }, uGrainRep: { value: new THREE.Vector2(6, 6 * AR) }, uGrainAmt: { value: isCover ? 0.04 : 0.07 },
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
  dg('sheets');
  yield;
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
  function retex(w, force) {
    if (!force && Math.abs(w - texW) / texW < 0.3) return;
    texW = w;
    /* الصورةُ القديمةُ تبقى حتى تجهز الجديدة — لا تسودّ الصفحاتُ وهي تُرسم من جديد */
    pageTex.forEach((t, k) => Promise.resolve(cfg.tex(k, w)).then(cv => {
      if (dead || !cv || pageTex.get(k) !== t) return;
      return upQ(t, cv);   /* (والمقاسُ الآخرُ يُحرَّر في الطابور قبل رفعه) */
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
  /* على الطاولة الظلُّ شريطٌ بسُمكٍ واحدٍ على حافّتَي الكتاب اليسرى والعليا (طلبُ صاحب الموقع) — الشمسُ من يمين الناظر وأمامه
     فيقع ظلُّها هناك، والاتّجاهُ معرَّفٌ في إطار الشاشة ثمّ يُدار بدوران الكاميرا (‎AZ‎) */
  const ZR = new THREE.Vector3(0, 0, 1);
  /* إعداداتُ ظلّ الطاولة كلُّها في مكانٍ واحد (‏‎cfg.shadow‎ أو ‎setShadow‎ يغيّرها) — بإطار الشاشة: ‏‎x‎ يمينٌ و‎y‎ أعلى:
     ‏‎sunX/sunY/sunZ‎ اتّجاهُ الشمس (يقع الظلُّ عكسه، و‎sunZ‎ أعلى ⇐ أقرب) · ‏‎offX/offY‎ إزاحةُ الظلّ الناعم ·
     (ظلٌّ واحدٌ على الطاولة — طلبُ صاحب الموقع: المُلقى عتمتُه ‎0‎ فلا يبقى إلّا الناعم) ·
     ‏‎margin‎ عرضُه حول الكتاب · ‏‎blur‎ نعومةُ حافّته · ‏‎softDark/softLight‎ و‎castDark/castLight‎ عتمةُ الناعم والمُلقى · ‏‎edge‎ حدّةُ المُلقى */
  const SHD = Object.assign({ sunX: 2.4, sunY: -2.4, sunZ: 3.6, offX: -0.125, offY: 0.045, margin: 0.155, blur: 0.05,
    softDark: 0.21, softLight: 0.24, castDark: 0, castLight: 0, edge: 4 }, cfg.shadow || {});
  const SUN0 = new THREE.Vector3(-1.3, 1.5, 4.2), SUN1 = new THREE.Vector3(), BLOB = new THREE.Vector3();
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0, depthWrite: false }));
  blob.renderOrder = -1; scene.add(blob);
  /* الظلُّ الناعم بشكل الكتاب نفسِه: قلبُه بمقاسه وهامشُه متساوٍ من الجهات كلّها (فالشريطُ بسُمكٍ واحد يسارًا وأعلى) */
  function blobTex() {
    SUN1.set(SHD.sunX, SHD.sunY, SHD.sunZ).applyAxisAngle(ZR, -0.96);
    BLOB.set(SHD.offX, SHD.offY, 0).applyAxisAngle(ZR, -0.96);
    const BM = SHD.margin * W, bw = W * (1 + OV) + 2 * BM, bh = H * (1 + OV) + 2 * BM, ppu = 256 / bw;
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = Math.round(bh * ppu);
    const c = cv.getContext('2d'); c.filter = `blur(${Math.max(0, BM * SHD.blur * ppu).toFixed(1)}px)`; c.fillStyle = '#000';
    const m = BM * 0.55 * ppu; c.fillRect(m, m, cv.width - 2 * m, cv.height - 2 * m);
    if (blob.material.map) blob.material.map.dispose();
    blob.material.map = new THREE.CanvasTexture(cv); blob.material.needsUpdate = true; blob.scale.set(bw, bh, 1);
  }
  function tableLight(e) {
    if (Math.abs(e - tlK) < 1e-5) return; tlK = e;
    if (!blob.material.map) blobTex();
    blob.visible = e < 1;
    blob.material.opacity = (curTheme === 'dark' ? SHD.softDark : SHD.softLight) * (1 - e) * (1 - e);
    blob.position.set(BLOB.x, BLOB.y, GZ + 0.0004);
    sun.position.copy(SUN1).lerp(SUN0, e);
    const L = LIGHTS[curTheme];
    ground.material.opacity = L.ground + ((curTheme === 'dark' ? SHD.castDark : SHD.castLight) - L.ground) * (1 - e);
    /* ظلُّ الشمس المائلة على الطاولة حادٌّ قليلًا (التنعيمُ الواسع يرسمه نسخًا متراكبةً: خطوط) — النعومةُ من الظلّ الناعم تحته */
    sun.shadow.radius = SHD.edge + (12 - SHD.edge) * e;
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
  const edgeH = edgeTex(false), edgeV = edgeTex(true); dg('edges');
  yield;
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
  let caseK = -1, caseShown = null;
  /* ‏‎e‎ مقدارُ القراءة ‎0..1‎ (بعد المنحنى): الغلافُ يصغر إلى مقاس الأوراق وسُمكها الحقيقيّ، ويُسلَّم إليها في ‎e = 1‎ */
  function updCase(e) {
    const show = e < 1 || !!ta;
    const sh = 1 - e;
    /* بحالةٍ محفوظة لا بظهور الجسم: كان يبدأ ظاهرًا فلا يتبدّل أوّلَ مرّة، فتبقى أوراقُ القراءة (والغلافُ بصورته) مرسومةً داخله —
       لا تُرى والكتابُ مغلق، وتبرز حين ينفتح الغطاءُ في التقليب أو قبل أوّل فتحٍ للقراءة */
    if (caseShown !== show) {
      caseShown = show; caseG.visible = show;
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

  /* ===== التقليبُ على الطاولة: المجلدُ يستدعي تحديداته (كالكونسبت) =====
     الغلافُ ينفتح ‎~30°‎ والكتابُ مكانه، وتتقلّب الصفحاتُ من الكتلة إلى تحت الغلاف مروحةً، وتقف لحظةً عند كلّ صفحةٍ فيها
     تحديد (‏‎onStop‎ يُعطى مواضعَ زواياه على الشاشة فيطير منها)، ثمّ ينطبق الغلافُ والأوراقُ معًا على اللوح السفليّ.
     هيكلٌ منفصلٌ يُبنى عند أوّل استعمال: غطاءٌ بمفصلٍ عند الكعب، وقاعدةٌ (الكعبُ واللوحُ السفليّ)، وكومةٌ تحت الغطاء،
     وثماني أوراقٍ طائرة — وما سواها لا يُرسم (خفيفٌ ولو كان الكتابُ مئاتِ الصفحات) */
  yield;
  const RF = { open: 130, hold: 120, sweep: 1180, ivMin: 18, ivMax: 75, dwell: 170, leaf: 260, close: 260, angle: 1.05, leaves: 8 };
  let rf = null, rig = null;
  const paperM = new THREE.MeshStandardMaterial({ color: '#efe8d6', roughness: 0.95 });
  function genericPage() {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = Math.round(256 * H / W);
    const c = cv.getContext('2d'); c.fillStyle = '#ffffff'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = 'rgba(70,64,52,.28)';
    for (let y = cv.height * 0.12, i = 0; y < cv.height * 0.9; y += cv.height * 0.034, i++) c.fillRect(cv.width * (0.12 + (i % 5 === 4 ? 0.3 : 0)), y, cv.width * (0.76 - (i % 5 === 4 ? 0.3 : 0)), cv.height * 0.009);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function buildRig() {
    const zt = TH + BT, zb = -BT, ex = { depth: HB - 2 * BV, bevelEnabled: true, bevelThickness: BV, bevelSize: BV * 0.6, bevelSegments: 3, curveSegments: 24 };
    const extr = shp => { const g = new THREE.ExtrudeGeometry(shp, ex); g.rotateX(Math.PI / 2); g.translate(0, (HB - 2 * BV) / 2, 0); return g; };
    /* القاعدة: الكعبُ واللوحُ السفليّ (مفتوحةٌ من فوق) */
    const sb = new THREE.Shape();
    sb.moveTo(0, zt); sb.absellipse(0, (zt + zb) / 2, SPB, (zt - zb) / 2, Math.PI / 2, -Math.PI / 2, true);
    sb.lineTo(-WB, zb); sb.lineTo(-WB, 0); sb.lineTo(XI, 0); sb.lineTo(XI, TH); sb.lineTo(0, TH); sb.closePath();
    const base = new THREE.Mesh(extr(sb), boardM); base.castShadow = base.receiveShadow = true;
    /* الغطاء: اللوحُ العلويّ، مفصلُه عند الكعب ‎(0, TH)‎ — في مجموعةٍ أصلُها المفصل فيُدار حولها */
    const sl = new THREE.Shape(); sl.moveTo(-WB, TH); sl.lineTo(0, TH); sl.lineTo(0, zt); sl.lineTo(-WB, zt); sl.closePath();
    const lidG = new THREE.Group(); lidG.position.set(0, 0, TH);
    const lid = new THREE.Mesh(extr(sl), boardM); lid.position.z = -TH; lid.castShadow = lid.receiveShadow = true; lidG.add(lid);
    const artL = new THREE.Mesh(art.geometry, artM); artL.position.set(art.position.x, 0, art.position.z - TH); lidG.add(artL);
    /* الكومةُ تحت الغطاء: شكلُها من منحنيات صفحاتها نفسِها (‏‎pileGeom‎) — رأسُها وذيلُها حوافُّ ورق، وما سواهما ورق */
    const pile = new THREE.Mesh(new THREE.BufferGeometry(), [block.material[2], paperM]);
    pile.castShadow = pile.receiveShadow = true;
    /* الصفحةُ العليا على الكتلة (تتبدّل مع التقليب) */
    const topM = new THREE.MeshStandardMaterial({ roughness: 0.9 });
    const topP = new THREE.Mesh(new THREE.PlaneGeometry(W, H), topM); topP.position.x = -W / 2; topP.receiveShadow = true;
    /* الأوراقُ الطائرة: شريطٌ ينحني بطول عرضه (يُحسب كلَّ إطار) */
    const SEG = 20, leaves = [];
    for (let i = 0; i < RF.leaves; i++) {
      const g = new THREE.BufferGeometry(), pos = new Float32Array((SEG + 1) * 2 * 3), uv = new Float32Array((SEG + 1) * 2 * 2), idx = [];
      for (let j = 0; j <= SEG; j++) { uv.set([1 - j / SEG, 1, 1 - j / SEG, 0], j * 4); if (j < SEG) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
      /* لا تُلقي ظلًّا: ظلُّها الحادُّ على الصفحات تحتها كان يبدو أنصافَ صفحات */
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide })); m.visible = false; m.castShadow = false;
      leaves.push({ m, busy: false });
    }
    const grp = new THREE.Group(); grp.add(base, lidG, topP, pile); for (const l of leaves) grp.add(l.m);
    grp.visible = false; caseG.add(grp);
    rig = { grp, base, lidG, lid, artL, pile, pileKey: '', topP, topM, leaves, SEG, generic: genericPage(), tex: new Map() };
  }
  /* ===== منحنى الصفحة (نموذجٌ واحدٌ لكلّ صفحات الكتاب) =====
     الصفحةُ مربوطةٌ بجدار الكعب الداخليّ ‎(XI, TH − δ)‎ — ‏‎δ‎ عمقُ ربطها من أعلى الكعب (الأولى أعلاه والأخيرةُ أسفله) — وتُقلَّب
     بزاوية ‎θ‎ حول مفصل الغلاف ‎(XI, TH)‎. في إطارٍ يدور بـ‎θ‎ حول المفصل: ‏‎U‎ على طول الصفحة و‎N‎ عمقُها تحت خطّ الغلاف؛ تبدأ من
     ربطها (عمقُه ‎δ cosθ‎) وتنحني في ثنية الكعب (‏‎GUT‎) إلى عمقها في الكومة ‎δ‎ فتستوي. ‏‎θ = 0‎ صفحةٌ مستويةٌ على الكتلة على ارتفاع
     ربطها، و‎θ = a‎ صفحةٌ تحت الغلاف. الكتلةُ والكومةُ والأوراقُ الطائرةُ كلُّها من هذا المنحنى، فهي على ترتيبها عند الكعب */
  const GUT = 0.2 * W, WP = W + XI;
  const easeOut = k => 1 - Math.pow(1 - k, 3), easeIn = k => k * k * k;
  /* ‏‎curl‎ انحناءُ الورقة وهي تُقلَّب: حرفُها يتأخّر نحو الكتلة — عمقٌ إضافيٌّ يكبر مع البعد عن الكعب (مقدارُه ‎curl·W‎ عند الحرف) */
  function pageCurve(delta, th, out, curl = 0) {
    const ux = -Math.cos(th), uz = Math.sin(th), nx = -Math.sin(th), nz = -Math.cos(th);
    const U0 = -delta * Math.sin(th), N0 = delta * Math.cos(th), SEG = rig.SEG;
    for (let j = 0; j <= SEG; j++) {
      const U = U0 + WP * j / SEG, k = Math.min(1, (U - U0) / GUT), f = j / SEG;
      const N = N0 + (delta - N0) * k * k * (3 - 2 * k) + curl * W * f * f;
      out[j * 2] = XI + U * ux + N * nx; out[j * 2 + 1] = TH + U * uz + N * nz;
    }
    return out;
  }
  function setLeaf(l, delta, th, curl) {
    l.pts = pageCurve(delta, th, l.pts || new Float64Array((rig.SEG + 1) * 2), curl);
    const pos = l.m.geometry.attributes.position;
    for (let j = 0; j <= rig.SEG; j++) { const x = l.pts[j * 2], z = l.pts[j * 2 + 1]; pos.setXYZ(j * 2, x, H / 2, z); pos.setXYZ(j * 2 + 1, x, -H / 2, z); }
    pos.needsUpdate = true; l.m.geometry.computeVertexNormals(); l.m.geometry.computeBoundingSphere();
  }
  /* موضعُ نقطةٍ من الورقة الطائرة على الشاشة (‏‎fx, fy‎ كسرٌ من صورة الصفحة: من يسارها ومن أعلاها) — بانحنائها نفسِه */
  function leafPoint(l, fx, fy) {
    const u = Math.min(rig.SEG - 1e-6, (1 - fx) * rig.SEG), j = Math.floor(u), f = u - j, P = l.pts;
    const v = new THREE.Vector3(P[j * 2] + (P[j * 2 + 2] - P[j * 2]) * f, H / 2 - fy * H, P[j * 2 + 1] + (P[j * 2 + 3] - P[j * 2 + 1]) * f + 0.0004);
    caseG.updateMatrixWorld(); v.applyMatrix4(caseG.matrixWorld).project(camera);
    return [(v.x + 1) / 2 * cw, (1 - v.y) / 2 * ch];
  }
  /* الكومة: بين منحنى أولى المقلَّبة (تحت الغلاف) وآخرِها، ‏‎a‎ زاويتُها — تُبنى من جديد حين تتغيّر وحدَها */
  const ptsA = new Float64Array(2 * 21), ptsB = new Float64Array(2 * 21);
  function pileGeom(pileT, a) {
    const key = pileT.toFixed(5) + '|' + a.toFixed(4); if (key === rig.pileKey) return; rig.pileKey = key;
    pageCurve(0.0006, a, ptsA); pageCurve(pileT, a, ptsB);
    const shp = new THREE.Shape(), S2 = rig.SEG;
    shp.moveTo(ptsA[0], ptsA[1]);
    for (let j = 1; j <= S2; j++) shp.lineTo(ptsA[j * 2], ptsA[j * 2 + 1]);
    for (let j = S2; j >= 0; j--) shp.lineTo(ptsB[j * 2], ptsB[j * 2 + 1]);
    shp.closePath();
    const g = new THREE.ExtrudeGeometry(shp, { depth: H, bevelEnabled: false, curveSegments: 1 });
    g.rotateX(Math.PI / 2); g.translate(0, H / 2, 0);
    rig.pile.geometry.dispose(); rig.pile.geometry = g;
  }
  /* تقدُّمُ ورقة ‎i‎ في طيرانها: ورقةُ التحديد تقف عند ‎PEEK‎ (مرفوعةً مائلةً نحو الناظر فيُقرأ وجهُها) مدّةَ ‎dwell‎ */
  const PEEK = 0.36;
  function leafS(i, e) {
    const loc = e - rf.at[i], L = RF.leaf;
    if (!rf.stops.has(rf.n0 + i)) return loc / L;
    if (loc < PEEK * L) return loc / L;
    if (loc < PEEK * L + RF.dwell) return PEEK;
    return (loc - RF.dwell) / L;
  }
  function riffle(o) {
    if (dead || rf || tv !== 0 || ta || !cfg.rest) return Promise.resolve(false);
    if (!rig) buildRig();
    const n0 = 1 + SK, n1 = cfg.n, n = Math.max(1, n1 - n0 + 1), stops = new Set((o.stops || []).filter(k => k >= n0 && k <= n1));
    /* صورُ صفحات التحديد بالدقّة الحقيقيّة قبل البدء، والبقيّةُ صفحةٌ عامّة */
    const need = [...stops].filter(k => !rig.tex.has(k));
    return Promise.all(need.map(k => Promise.resolve(cfg.tex(k, 768)).then(cv => {
      if (!cv) return; const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; rig.tex.set(k, t);
    }).catch(() => {}))).then(() => new Promise(res => {
      if (dead) return res(false);
      const iv = Math.max(RF.ivMin, Math.min(RF.ivMax, RF.sweep / n)), at = [];
      let t = RF.open + RF.hold;
      for (let k = n0; k <= n1; k++) { at.push(t); t += iv + (stops.has(k) ? RF.dwell : 0); }
      rf = { t0: performance.now(), n0, n1, n, at, stops, onStop: o.onStop, res, stopped: new Set(), end: t + RF.leaf, closeAt: t + RF.leaf + 40 };
      hover = -1; setGrab(''); tHovT = 0; setCursor();
      caseMesh.visible = false; art.visible = false; rig.grp.visible = true;
      for (const l of rig.leaves) { l.busy = false; l.m.visible = false; }
      rig.pile.visible = false; rig.pileKey = '';
      needs = true;
    }));
  }
  const texOf = k => rig.tex.get(k) || rig.generic;
  function rfTick(now) {
    const e = now - rf.t0, R = rig;
    /* الغطاء: ينفتح سريعًا ويهدأ، ويبقى، ثمّ ينطبق والصفحاتُ معه — حول مفصله الحقيقيّ أعلى الكعب */
    let a = RF.angle * easeOut(Math.min(1, e / RF.open));
    if (e > rf.closeAt) a = RF.angle * (1 - easeIn(Math.min(1, (e - rf.closeAt) / RF.close)));
    R.lidG.rotation.y = a;
    let launched = 0, landed = 0;
    for (let i = 0; i < rf.n; i++) { if (e >= rf.at[i]) launched++; if (leafS(i, e) >= 1) landed++; }
    const hb = TH * (1 - launched / rf.n), pileT = TH * landed / rf.n;
    block.scale.z = Math.max(1e-4, hb / TH); block.position.z = hb / 2; block.visible = hb > 1e-4;
    R.pile.visible = landed > 0; if (landed > 0) pileGeom(pileT, a);
    /* الصفحةُ العليا: التي تُقلَّب بعدُ (أو لا شيء إن انتهت) */
    const topK = rf.n0 + launched;
    R.topP.visible = topK <= rf.n1; R.topP.position.z = hb + 0.0006;
    if (R.topP.visible && R.topM.map !== texOf(topK)) { R.topM.map = texOf(topK); R.topM.needsUpdate = true; }
    /* الأوراقُ الطائرة: كلٌّ على عمق ربطها، تُقلَّب من الكتلة (‏‎θ = 0‎) إلى تحت الغلاف (‏‎θ = a‎) */
    for (const l of R.leaves) l.busy = false;
    /* الطائرةُ بترتيبها (الأسبقُ أعلى) — وانحناءُ كلٍّ محدودٌ بنصف الفُرجة بينها وبين التي تحتها (أو الكتلة) فلا يمسّها */
    const fly = [];
    for (let i = 0; i < rf.n && fly.length < R.leaves.length; i++) { const s = leafS(i, e); if (s >= 0 && s < 1) fly.push({ i, s, th: a * easeOut(s) }); }
    let li = 0;
    for (let q = 0; q < fly.length; q++) {
      const { i, s, th } = fly[q], below = q + 1 < fly.length ? fly[q + 1].th : 0;
      const l = R.leaves[li++], k = rf.n0 + i;
      l.busy = true; l.m.visible = true;
      if (l.m.material.map !== texOf(k)) { l.m.material.map = texOf(k); l.m.material.needsUpdate = true; }
      const curl = Math.min(0.09 * Math.sin(Math.PI * s), 0.5 * Math.max(0, th - below));
      setLeaf(l, TH * (i + 0.5) / rf.n, th, curl);
      /* ورقةُ التحديد وقفت مرفوعة: تُعطى زواياه منها فيطير */
      if (rf.stops.has(k) && s === PEEK && !rf.stopped.has(k)) {
        rf.stopped.add(k);
        if (rf.onStop) try { rf.onStop(k, (fl, fr, ft, fb) => [leafPoint(l, fl, ft), leafPoint(l, fr, ft), leafPoint(l, fr, fb), leafPoint(l, fl, fb)]); } catch (er) {}
      }
    }
    for (const l of R.leaves) if (!l.busy) l.m.visible = false;
    if (e >= rf.closeAt + RF.close + 60) rfEnd();
  }
  function rfEnd() {
    if (!rf) return;
    const res = rf.res; rf = null;
    rig.grp.visible = false; caseMesh.visible = true; art.visible = true;
    block.scale.z = 1; block.position.z = TH / 2; block.visible = true;
    rig.lidG.rotation.y = 0;
    needs = true; res(true);
  }
  /* الكاميرا تسع الفتحةَ (‎2W × H‎) بهامشٍ للظلّ. ‏‎rect()‎ مستطيلُ الفتحة على اللوحة (بكسل CSS) */
  yield;
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
    let dist = ch / (2 * tn * fitS(cw, vh, span));
    /* مستوى القرب والبعد يلفّان الكتابَ وحده (ورقةٌ تقف نحو الكاميرا تبلغ عرضَها، والمطويّةُ وراءه كذلك): دقّةُ العمق
       تتوزّع على ما بينهما. كانا ‎0.1 · 20‎ فتقاربت الأوراقُ المتراصّة عند بطاقات العمق الخشنة (‎16bit‎ في هواتفَ كثيرة)
       فغلبت الورقةُ التي تحتُ التي فوقها */
    camera.near = Math.max(0.1, dist - W * 1.35); camera.far = dist + W * 1.6;
    camera.position.set(cx, -LIFT * H, dist); camera.lookAt(cx, -LIFT * H, 0);
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
    }
    camera.updateProjectionMatrix();
    const ppu = ch / (2 * dist * tn);   // بكسلٌ لكلّ وحدة في مستوى الكتاب
    fit = mo ? { w: span * ppu, h: H * ppu, x: cw / 2 - span / 2 * ppu, y: ch / 2 - H * ppu / 2 }
      : ONE ? { w: W * ppu, h: H * ppu, x: cw / 2 + (-W / 2 - cx) * ppu, y: ch / 2 - H * ppu / 2 }
      : { w: 2 * W * ppu, h: H * ppu, x: cw / 2 - W * ppu, y: ch / 2 - H * ppu / 2 };
    return true;
  }
  let rsN = 0, rtWant = 0, rtT = 0;
  function resize() {
    if (mo && mo.box) return;   /* التبدُّلُ جارٍ: لا تُعاد اللوحةُ كلَّ إطار (ثقيلٌ ويمسحها) — تُقاس بعده */
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    if (w === cw && h === ch) return;
    cw = w; ch = h; rsN++;
    renderer.setSize(w, h, false); el.style.width = w + 'px'; el.style.height = h + 'px';
    camera.aspect = w / h;
    camOpen = -1; frameCam();
    /* ===== خطّةُ الجودة · المرحلة ١: دقّةُ الصورة من الصفحة المعروضة فعلًا =====
       كانت على أكبر قدرٍ تبلغه الصفحةُ مقرَّبةً لأعلى بخطوات ‎256‎ (فتختلف نسبتُها بين مساحةٍ وأخرى). فالآن عرضُ الصفحة الساكنة في
       وضعها (صفحةٌ أو صفحتان) × دقّةُ اللوحة × ‎1.5‎ (هامشٌ يجعل التصغيرَ حادًّا مع المرحلة ٢ — بالقياس أحدُّ من الصورة بقدر الصفحة
       بالضبط)، بخطوات ‎32‎. وهذا قرابةُ مقاسها السابق فلا تزيد الذاكرة */
    const pr = renderer.getPixelRatio(), span = ONE ? W : 2 * W, ppu = fitS(w, h, span);
    rtWant = Math.min(TEX_CAP, Math.max(256, Math.ceil(W * ppu * pr * TEX_HEAD / 32) * 32));
    /* ===== المرحلة ٣: تُعاد الصورُ حين تكبر الصفحةُ (أكثر من ‎5%‎) أو تصغر كثيرًا (دون ‎60%‎) — بعد أن يستقرّ المقاس =====
       (كانت لا تُعاد إلّا بتغيّرٍ يجاوز ‎30%‎، فتبقى ممدودةً إن كبرت المساحة أقلَّ منه) */
    if (!pageTex.size) texW = rtWant;
    else { clearTimeout(rtT); rtT = setTimeout(() => { if (!dead && (rtWant > texW * 1.05 || rtWant < texW * .6)) retex(rtWant, true); }, 220); }
    /* تغييرُ المقاس يمسح اللوحة: تُرسم الآن في الإطار نفسِه، وإلّا ظهرت فارغةً إطارًا بعد كلّ إطارٍ والقسمةُ تتحرّك (وميض) */
    if (!dead && typeof frameNow === 'function') frameNow(); else needs = true;
  }
  resize();

  /* ‏‎kHid‎: النصفُ الباقي مخفيٌّ في أثناء الانفتاح — نسخةُ الصفحة الطائرةُ تقوم مقامَه حتى تستقرّ عليه */
  let kHid = false, after = null;
  function keptVis(v) {
    kHid = !v;
    for (const s of sheets) { const f = mo && (mo.side === 'L' ? s.i < A : s.i >= A); for (const mh of s.meshes) mh.visible = v || !!f; }
    needs = true;
  }
  // ===== الحركة =====
  let last = performance.now(), idle = false, hover = -1, raf = 0, goneAt = 0;
  const T = { follow: 0.07, settle: 0.12, flip: 0.8, hoverLift: 0.035, fan: 0.05 };
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!compiled || lost) { last = now; return; }   /* (والسياقُ مفقودٌ: لا رسمَ ولا رفعَ حتى يُستعاد — المرحلة ٦) */
    /* نُقل الكتابُ بين الرسمات فانفصل لحظةً — ويُطفأ إن طال انفصالُه (رُفع الكتاب) */
    if (!el.isConnected) { if (!goneAt) goneAt = now; else if (now - goneAt > 6000) dispose(); return; }
    goneAt = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    let moving = false, active = null;
    if (mo && mo.a) {
      const q = Math.min(1, Math.max(0, (now - mo.a.t0) / mo.a.dur));
      const e = mo.a.ease ? mo.a.ease(q) : cosE(q);
      mo.k = mo.a.from + (mo.a.to - mo.a.from) * e; moving = true;
      if (mo.box) mo.vh = mo.box.h0 + (mo.box.h1 - mo.box.h0) * e;
      if (q >= 1) {
        const r = mo.a.res; mo.k = mo.a.to; mo.a = null;
        if (mo.k === 0) { mo = null; el.style.top = el.style.marginTop = ''; resize(); if (kHid) keptVis(true); }   /* (الباقي يعود في الإطار نفسِه الذي ينتهي فيه) */
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
    if (tAfter && sheets[0].target === 0 && sheets[0].p === 0 && !sheets[0].anim) { const q = tAfter === 2; tAfter = false; table(0, 1, q ? 560 : 0); }
    const hv = tv < 1 ? tHovT : 0;
    if (Math.abs(hv - tHov) > 1e-4) { tHov += (hv - tHov) * (1 - Math.exp(-dt / 0.12)); moving = true; } else tHov = hv;
    const z = (tRise * 0.07 + tHov * 0.016) * W + BT * (1 - smooth(tv));   /* اللوحُ الخلفيّ على الطاولة لا تحتها */
    tableLight(smooth(tv));
    if (Math.abs(book.position.z - z) > 1e-6) { book.position.z = z; moving = true; }
    updCase(smooth(tv));
    if (rf) { rfTick(now); moving = true; }
    if (frameCam()) moving = true;
    if (upPump()) moving = true;   /* (صورةٌ واحدةٌ من الطابور في هذا الإطار — المرحلة ٢) */
    if (moving || needs) { renderer.render(scene, camera); needs = false; }
    if (after) after();   /* (ما يتبع الكتابَ على الشاشة يُوضع بعد رسمه، في الإطار نفسِه) */
    const wasIdle = idle; idle = !moving && !drag;
    if (idle && !wasIdle && cfg.onIdle) cfg.onIdle();
    if (!idle && wasIdle && cfg.onBusy) cfg.onBusy();
  }
  /* ===== المظلّلاتُ تُبنى في الخلفية قبل أوّل رسمة (‎compileAsync‎) =====
     أوّلُ رسمةٍ كانت تبني كلَّ مظلّلٍ وتنتظره فتُجمّد الصفحة (~نصف ثانيةٍ في جهازٍ متوسّط). فتُبنى الآن والهيكلُ ما زال فوق الكتاب،
     وكلُّ ما في المشهد ظاهرٌ لحظةَ الطلب (أوراقُ القراءة المخفيّة والغلاف) فيُبنى مظلّلُه معه، ثمّ يعود كما كان */
  dg('scene');
  yield;
  let compiled = !renderer.compileAsync;
  const compileP = compiled ? Promise.resolve() : (() => {
    const hid = []; scene.traverse(o => { if (!o.visible) { hid.push(o); o.visible = true; } });
    let p; try { p = renderer.compileAsync(scene, camera); } catch (e) { p = Promise.resolve(); }
    for (const o of hid) o.visible = false;
    return Promise.resolve(p).catch(() => {}).then(() => { compiled = true; needs = true; });
  })();
  dg('compileAsync');
  raf = requestAnimationFrame(frame);
  frameNow = () => { if (el.isConnected && compiled) { renderer.render(scene, camera); needs = false; } else needs = true; };

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
  function table(to, goal = 1, dur = 0) {
    if (dead || rf || (ta ? ta.to === to : tv === to)) return;
    /* لا يبقى لونُ نصف التقليب ولا مؤشّرُه من قبل (الطاولةُ لا تُقلَّب) */
    tHovT = 0; hover = -1; setGrab(''); setCursor();
    if (cfg.onBusy && idle) cfg.onBusy();
    ta = { from: tv, to, t0: performance.now(), dur: dur || (to ? 1150 : 900), goal: Math.max(1, goal | 0) };
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
  function goTo(t, durK = 0.8, step = 70) {
    t = Math.max(0, Math.min(maxA, t | 0));
    if (tv < 1 && !ta) { if (t > 0) table(1, t); return; }
    if (mo || t === A) return;
    const dir = t > A ? 1 : -1, list = [];
    for (let i = A; i !== t; i += dir) list.push(sheets[dir > 0 ? i : i - 1]);
    const far = list.length > 8 ? list.slice(0, list.length - 8) : [];
    const near = list.slice(far.length);
    A = t;
    for (const s of far) { s.anim = null; s.p = s.target = dir > 0 ? 1 : 0; }
    near.forEach((s, k) => { s.dir = dir; s.tiltT = 0; launch(s, dir > 0 ? 1 : 0, 0, k * step, durK); });
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
  /* و‎cfg.zoneSkipAt(x, y)‎: مواضعُ يسمّيها الموقعُ بالمسافة لا بالعنصر (زاويةُ الأيقونة والقوس — صندوقُهما يمرّر الماوسَ إلى المساحة) */
  const skip = e => (e.target !== el && !!(e.target.closest && e.target.closest(SKIP))) || !!(cfg.zoneSkipAt && cfg.zoneSkipAt(e.clientX, e.clientY));
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
  /* ‏‎cfg.cursor(kind, side, n)‎ (طلبُ صاحب الموقع): مؤشرُ اليد البكسليّ وسهمُه لجهة السحب — ‏‎side‎ ‏‎l‎ طرفُ اليسار (يُسحب لليمين)
     و‎r‎ اليمين؛ ‏‎kind‎ ‏‎open‎ والمؤشرُ على المقبض، ‏‎grab‎ في السحب. والسهمُ ينبض ما دام المؤشرُ على المقبض: تُبدَّل صورُه (‎n‎) كلَّ ‎110ms‎ */
  let curT = 0, curI = 0;
  /* ‏‎tblOn‎: المؤشرُ في المساحة والكتابُ على الطاولة — يدُ التقليب نفسُها وسهمُها ينبض، والنقرُ في أيّ موضعٍ يفتحه (طلبُ صاحب الموقع) */
  let tblOn = false;
  const setCursor = () => {
    const side = drag ? (drag.fwd ? 'l' : 'r') : tblOn ? 'l' : (grab === 'l' || grab === 'r' ? grab : null);
    const c = cfg.cursor && side ? cfg.cursor(drag ? 'grab' : 'open', side, drag ? 0 : curI) : '';
    zone.style.cursor = c || (drag ? 'grabbing' : grab ? 'grab' : tblOn ? 'pointer' : '');
    const anim = !!(c && !drag && !dead);
    if (anim && !curT) curT = setInterval(() => { curI++; setCursor(); }, 110);
    else if (!anim && curT) { clearInterval(curT); curT = 0; curI = 0; }
  };
  const onDown = e => {
    if (e.button !== 0) return;
    /* نصٌّ محدَّدٌ في الصفحة: النقرةُ تُلغي التحديد ولا تقلّب */
    const sel = window.getSelection && window.getSelection();
    if (sel && !sel.isCollapsed && host.contains(sel.anchorNode)) { sel.removeAllRanges(); return; }
    if (skip(e)) return;
    /* على الطاولة: الكتابُ نفسُه يُنقر فيرتفع وينفتح */
    if (tv < 1 || ta || rf) { if (!ta && !rf) { tblOn = false; setCursor(); table(1); } return; }
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
      if (tv < 1 || ta || rf) {
        const on = !ta && !rf && !skip(e);
        if (hover !== -1 || grab) { hover = -1; setGrab(''); }
        tHovT = on ? 1 : 0; needs = true;
        if (on !== tblOn) { tblOn = on; setCursor(); }
        return;
      }
      if (tblOn) { tblOn = false; setCursor(); }
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
  const onLeave = () => {
    if (tHovT) { tHovT = 0; needs = true; } if (tblOn) { tblOn = false; setCursor(); } if (!drag && (hover !== -1 || grab)) { hover = -1; setGrab(''); needs = true; setCursor(); } };
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

  /* ‏‎keep‎: (للتحوّل إلى الصفحات المتتالية) يُطفأ كلُّ شيءٍ إلّا اللوحةَ نفسَها — تبقى على آخر إطارٍ رُسم فتذوب في مكانها بدل لقطةٍ
     تُنسخ منها (النسخُ من ‎WebGL‎ يقرأ من كرت الشاشة فيتأخّر التحوّلُ كلُّه) — ويُعاد ما يُتمّ الإطفاءَ حين تنتهي */
  function dispose(keep) {
    if (curT) { clearInterval(curT); curT = 0; }
    if (dead) return;
    if (rf) { const res = rf.res; rf = null; res(false); }   /* تقليبٌ جارٍ: يُعلَم صاحبُه أنّه انتهى */
    dead = true;
    upList.forEach(x => x[2]()); upList.length = 0;   /* (لا يبقى منتظرٌ لصورةٍ لن تُرفع — المرحلة ٢) */
    cancelAnimationFrame(raf); stopHold();
    for (const [t, f] of evs) zone.removeEventListener(t, f);
    setGrab('');
    if (zone !== el) zone.style.cursor = zone.style.touchAction = '';
    pageTex.forEach(t => t.dispose()); pageTex.clear();
    [grain, blank, inside, outsideBack].forEach(t => t.dispose());
    /* الطاولة: الظلُّ والغلافُ الصلب */
    if (blob.material.map) blob.material.map.dispose();
    blob.material.dispose(); blob.geometry.dispose();
    caseG.traverse(o => { if (o.isMesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); } });
    edgeH.dispose(); edgeV.dispose(); paperM.dispose();
    if (rig) { rig.grp.traverse(o => { if (o.isMesh && o.geometry !== art.geometry) { o.geometry.dispose(); if (o.material !== boardM && o.material !== artM && !Array.isArray(o.material)) o.material.dispose(); } }); rig.generic.dispose(); rig.tex.forEach(t => t.dispose()); }
    for (const s of sheets) for (const mh of s.meshes) { mh.material.dispose(); mh.customDepthMaterial.dispose(); }
    geo.dispose(); ground.geometry.dispose(); ground.material.dispose();
    renderer.dispose();
    if (keep) return () => { try { renderer.forceContextLoss(); } catch (e) {} el.remove(); };
    renderer.forceContextLoss();
    el.remove();
  }

  return {
    el, flip, goTo, resize, setTheme, dispose, turnable, setZone, one: ONE,
    /* يغيّر إعدادات ظلّ الطاولة ويُعاد رسمُه (أداةُ الضبط) */
    setShadow(o) { Object.assign(SHD, o || {}); blobTex(); tlK = -1; tableLight(smooth(tv)); needs = true; },
    /* يرفعه من الطاولة ويفتحه (‎open‎) أو يُغلقه وينزله إليها (‎rest‎) */
    open() { if (tv < 1 || ta) table(1); },
    /* (لاستدعاء التحديدات) يُفتح على فتحةٍ بعينها — يعود القارئُ إلى حيث كان — ويُعرف متى سكن على الطاولة فيُقلَّب */
    openAt(g) { if (tv < 1 || ta) table(1, g); },
    /* (للتحوّل من الصفحات المتتالية) تُطلب صورُ الصفحات من جديد بدقّتها — بعد أن بُني الكتابُ بنسخٍ جاهزةٍ قريبة الدقّة */
    refreshTex() { retex(texW, true); },
    get resting() { return tv === 0 && !ta && !rf; },
    /* ‏‎quick‎ (طلبُ صاحب الموقع: استدعاءُ المجلد): ينطبق في حركةٍ واحدةٍ أسرع وينزل إلى الطاولة أسرع */
    rest(quick) { if (!cfg.rest) return; if (A > 0) { tAfter = quick ? 2 : true; if (quick) goTo(0, 0.42, 22); else goTo(0); } else table(0, 1, quick ? 560 : 0); },
    get onTable() { return tv < 1 || !!ta; },
    /* التقليبُ على الطاولة (المجلدُ يستدعي تحديداته) — وإنهاؤه فورًا */
    riffle, riffleEnd() { if (rf) rfEnd(); }, get riffling() { return !!rf; },
    /* يطوي نصفَ الفتحة (‎to = 1‎) أو يفتحه (‎0‎) في ‎dur‎ ميلي ثانية — ويَعِد بانتهائه */
    /* ‏‎box = { h0, h1 }‎ قامةُ المساحة قبل التبدُّل وبعده (تتغيّر بالمدّة والمنحنى نفسَيهما): اللوحةُ تُكبَّر مرّةً إلى أطولهما
       وتتوسّط المساحة، والكتابُ يُحجَّم داخلها — فلا تُعاد اللوحةُ ولا صورُها في كلّ إطار */
    /* (للتحوّل من الصفحات المتتالية) المطويُّ الساكنُ يُوضع على درجةٍ من طيّه (‎0..1‎) — ليكمل من حيث بلغت نسخةٌ تسبقه */
    setFold(k) { if (mo && !mo.a) { mo.k = Math.max(0, Math.min(1, k)); needs = true; } },
    /* ‏‎ease(q)‎ (اختياريّ): منحنى التقدّم بدل ‎cosE‎ — يتبع به ساعةَ حركةٍ بدأت قبله */
    morph(side, to, dur = 700, box, ease) {
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
      return new Promise(res => { mo.a = { from: mo.k, to: to ? 1 : 0, t0: performance.now(), dur: Math.max(1, dur), res, ease: typeof ease === 'function' ? ease : null }; });
    },
    /* صفحةٌ تغيّر ما يُرسم عليها (تحديداتٌ وأرقام): تُطلب صورتُها من جديد إن كانت محمَّلة */
    refreshPage(k) {
      const t = pageTex.get(k); if (!t) return Promise.resolve();
      return Promise.resolve(cfg.tex(k, texW)).then(cv => {
        if (dead || !cv) return;
        return upQ(t, cv);
      }).catch(() => {});
    },
    /* كلُّ الأوراق مستقرّةٌ تمامًا في كومتها (لا مرفوعةَ بتحويمٍ ولا مُمسَكة): الصفحةُ مسطّحةٌ فتنطبق عليها طبقةُ النصّ */
    get lost() { return lost; },
    get flat() { return !mo && tv === 1 && !ta && !drag && sheets.every(s => !s.anim && s.drag == null && (s.p === 0 || s.p === 1)); },
    get A() { return A; }, get maxA() { return maxA; }, get dead() { return dead; },
    get folding() { return !!mo; },
    get texW() { return texW; },   /* (للقياس: دقّةُ صور الصفحات) */
    get resizes() { return rsN; },   /* (للقياس: كم مرّةً أُعيد مقاسُ اللوحة) */
    /* يُخفي النصفَ الباقيَ (صفحةَ القارئ وكومتَها) ما دام التبدُّل — ويعود وحده في آخر إطارٍ منه */
    hideKept(h) { if (!dead) keptVis(!(h && mo)); },
    /* يُنادى بعد كلّ إطارٍ يرسمه (أو ‎null‎) */
    set afterFrame(f) { after = typeof f === 'function' ? f : null; },
    get settled() { return !mo && tv === 1 && !ta && idle && !drag && sheets.every(s => !s.anim); },
    rect: () => fit,
    /* الصفحاتُ الساكنةُ الظاهرة ومستطيلاتُها على اللوحة (بكسل CSS) — تُسقَط زواياها من موضعها الحقيقيّ (فوق كومتها) بالكاميرا نفسِها،
       فتنطبق عليها طبقةُ النصّ. ‏‎k‎ رقمُ الصفحة في الملفّ */
    pageRects() {
      /* (في التبدُّل يُعطي الصفحةَ الباقيةَ وحدها — مطويًّا وفي أثناء انفتاحه: التحوّلُ من الصفحات المتتالية يلاحقها) */
      if (A === 0) return [];
      const v = new THREE.Vector3(), out = [];
      /* (المطويُّ مُزاحٌ نصفَ ورقة: تُحسب إزاحتُه هنا لا ممّا رُسم — قد يُسأل قبل أوّل إطار) */
      /* (طلبُ صاحب الموقع: «الصفحة تروح يسار ثم ترجع للنص») موضعُ الكتاب بالقاعدة نفسِها التي تضعه بها حلقةُ الرسم — لا ممّا وُضع
         آخرَ مرّة: الحلقةُ لا تمضي حتى تُبنى المظلّلات، والصفحةُ الواحدةُ إلى حينها على ‎x = 0‎ لا على ‎W/2‎ — فكان يُعطي موضعَها
         مُزاحًا نصفَ صفحةٍ إلى اليسار، فتتّجه إليه الصفحةُ الطائرةُ ثمّ تعود (ويُحفظ مقاسًا للمرّة القادمة) */
      const bx = mo ? (mo.side === 'L' ? 1 : -1) * W / 2 * mo.k : ONE ? W / 2 : W / 2 * (1 - sheets[0].p);
      const proj = (x, y, z) => { v.set(x + bx, y, z).project(camera); return [(v.x + 1) / 2 * cw, (1 - v.y) / 2 * ch]; };
      const face = (vk, x0, x1, z) => {
        if (!(vk >= 1 && vk <= N)) return;
        const k = vk + SK;
        const [ax, ay] = proj(x0, H / 2, z), [bx, by] = proj(x1, -H / 2, z);
        out.push({ k, x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay) });
      };
      if (ONE) { if (A < S - 1) face(A, -W, 0, (S - A) * STACK); }
      else {
        if (A < S - 1 && (!mo || mo.side === 'L')) face(2 * A - 1, -W, 0, (S - A) * STACK);
        if (!mo || mo.side === 'R') face(2 * (A - 1), 0, W, A * STACK);
      }
      return out;
    },
    ready: () => Promise.all([compileP, ...[...pageTex.values()].map(t => t.userData.ready)]),
    /* (للتحوّل من الصفحات المتتالية) ينتظر صفحاتٍ بعينها لا كلَّ ما طُلب — ما حول موضع القارئ */
    readyFor: ks => Promise.all([compileP, ...ks.map(k => pageTex.get(k)).filter(Boolean).map(t => t.userData.ready)]),
    /* لقطةٌ للّوحة (للشبح الذي يخرج به الكتابُ في القسمة) — تُرسم الآن فتُقرأ قبل أن يُمسح المخزن */
    snapshot(cv) { renderer.render(scene, camera); const c = cv.getContext('2d'); cv.width = el.width; cv.height = el.height; c.drawImage(el, 0, 0); },
    sheets,
  };
}

export function createBook2(THREE, host, cfg) {
  const it = book2Steps(THREE, host, cfg);
  for (;;) { const r = it.next(); if (r.done) return r.value; }
}
/* ‏‎gate(next)‎: يستدعي ‎next‎ بعد أن يُرسم إطار — فكلُّ خطوةٍ في مهمّةٍ وحدها */
export function createBook2Async(THREE, host, cfg, gate) {
  const it = book2Steps(THREE, host, cfg);
  return new Promise((res, rej) => {
    const step = () => { let r; try { r = it.next(); } catch (e) { rej(e); return; } if (r.done) res(r.value); else gate(step); };
    gate(step);
  });
}
