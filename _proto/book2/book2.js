// «الكتاب ٢» — نموذجُ المراحل ٠–٢ (ROADMAP-BOOK2)
// ورقةٌ تلتفّ حول أسطوانةٍ خطُّها مائلٌ بحسب موضع الإمساك، تحت ضوءٍ اتّجاهيٍّ يُلقي ظلًّا.
// كتابٌ عربيّ: الأوراقُ غيرُ المقلَّبة يسارًا، والتقليبُ يرفع اليسرى ويطويها إلى اليمين.
// شيفرةٌ مكتوبةٌ لهذا المشروع — الطريقةُ مستلهَمةٌ من OpenZine ولا يُنقل منه شيء.
import * as THREE from './node_modules/three/build/three.module.min.js';

const SHEET_GLSL = /* glsl */`
uniform float uP;        // تقدّمُ التقليب ‎0..1‎
uniform float uBend;     // زاويةُ الالتفاف الكلّيّة (راديان)
uniform float uTilt;     // ميلُ خطّ الالتفاف (راديان)
uniform float uLift0;    // ارتفاعُ الورقة في كومة اليسار
uniform float uLift1;    // ارتفاعُها في كومة اليمين
uniform vec2  uSize;     // عرضُ الورقة وقامتُها
attribute vec2 aSheet;   // ‎(u, v)‎ في ‎0..1‎ — ‎u‎ من الكعب إلى الحرف
const float PI = 3.14159265;

// موضعُ نقطةٍ من الورقة. ‎u‎ يبتعد عن الكعب، ‎v‎ رأسيّ.
vec3 sheetPoint(vec2 s) {
  float W = uSize.x, H = uSize.y;
  float u = s.x * W, v = (s.y - 0.5) * H;
  // محورا الالتفاف: ‎a‎ عموديٌّ على خطّه، ‎b‎ على امتداده
  float c = cos(uTilt), sn = sin(uTilt);
  float a = u * c + v * sn, b = -u * sn + v * c;
  // يبدأ الالتفافُ بعد ثلثِ الورقة، ونصفُ قطره يُحسب من الزاوية الكلّيّة على ما بعده
  float a0 = 0.12 * W, span = W - a0;
  float t = max(0.0, a - a0);
  float ang = uBend * t / span;
  float ap = a0 + (abs(uBend) < 1e-4 ? t : span / uBend * sin(ang));
  float zc = abs(uBend) < 1e-4 ? 0.0 : span / uBend * (1.0 - cos(ang));
  if (a < a0) ap = a;
  // العودةُ إلى محاور الورقة المسطّحة
  float x = ap * c - b * sn, y = ap * sn + b * c;
  // دورانُ الورقة كلِّها حول الكعب: ‎0‎ يسارًا، ‎π‎ يمينًا. والالتفافُ نحو جهة المسير
  float th = uP * PI;
  vec2 eu = vec2(-cos(th), sin(th));     // اتّجاهُ الورقة (‎x, z‎)
  vec2 en = vec2(sin(th), cos(th));      // عموديُّها نحو المسير
  vec2 xz = x * eu + zc * en;
  float lift = mix(uLift0, uLift1, smoothstep(0.0, 1.0, uP));
  // الورقُ لا يستلقي مسطّحًا عند الكعب: ينتفخ قليلًا قربه
  float bulge = 0.012 * W * sin(clamp(s.x / 0.18, 0.0, 1.0) * PI * 0.5) * (1.0 - 0.6 * s.x);
  return vec3(xz.x, y, xz.y + lift + bulge * (1.0 - sin(th)));
}
`;

/* الورق (المرحلة ٢): حُبيباتٌ وأليافٌ من نسيجٍ نولّده، وشفوفٌ يُري ظهرَ الصفحة معكوسًا بقدرٍ ضئيل،
   والحبرُ أخشنُ من الورق فلا يلمع، ولونُ الورق يميل إلى العاج قليلًا */
const PAPER_GLSL = /* glsl */`
varying vec2 vSheet;
uniform sampler2D uThru; uniform float uThruFlip; uniform float uThruAmt;
uniform sampler2D uGrain; uniform vec2 uGrainRep; uniform vec3 uPaper;
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
  diffuseColor.rgb *= uPaper * (0.955 + 0.07 * gr);
`;
function patch(material, withNormal, nsign = 1, paper = false) {
  material.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, material.userData.u, material.userData.x || {});
    sh.vertexShader = SHEET_GLSL + 'varying vec2 vSheet;\n' + sh.vertexShader;
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = sheetPoint(aSheet); vSheet = aSheet;`);
    if (paper) {
      sh.fragmentShader = PAPER_GLSL + sh.fragmentShader
        .replace('#include <map_fragment>', PAPER_FRAG)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(1.0, roughnessFactor, smoothstep(0.25, 0.85, inkL));');
    }
    if (withNormal) sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', `
      vec3 _p = sheetPoint(aSheet), _pu = sheetPoint(aSheet + vec2(0.01, 0.0)), _pv = sheetPoint(aSheet + vec2(0.0, 0.01));
      vec3 objectNormal = ${nsign < 0 ? '-' : ''}normalize(cross(_pv - _p, _pu - _p));`);
  };
  return material;
}

function grainTexture(THREE_) {
  const N = 256, d = new Uint8Array(N * N * 4);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const lat = (n) => { const g = new Float32Array(n * n); for (let i = 0; i < g.length; i++) g[i] = rnd(); return g; };
  const oct = [[8, .35], [32, .3], [128, .35]].map(([n, w]) => ({ n, w, g: lat(n) }));
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
  // أليافٌ قصيرةٌ فاتحة
  for (let k = 0; k < 420; k++) {
    let x = rnd() * N, y = rnd() * N; const a = rnd() * Math.PI, L = 4 + rnd() * 10, dv = (rnd() - 0.3) * 0.25;
    for (let t = 0; t < L; t++) { const i = ((Math.floor(y) + N) % N) * N + ((Math.floor(x) + N) % N); v[i] += dv; x += Math.cos(a); y += Math.sin(a); }
  }
  for (let i = 0; i < N * N; i++) { const c = Math.max(0, Math.min(255, v[i] * 255)); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = c; d[i * 4 + 3] = 255; }
  const t = new THREE_.DataTexture(d, N, N); t.wrapS = t.wrapT = THREE_.RepeatWrapping;
  t.magFilter = THREE_.LinearFilter; t.minFilter = THREE_.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

export async function mountBook2(host, pdfUrl, opts = {}) {
  const L = window.pdfjsLib;
  L.GlobalWorkerOptions.workerSrc = './pdfjs/pdf.worker.min.js';
  const doc = await L.getDocument(pdfUrl).promise;
  const p1 = (await doc.getPage(1)).getViewport({ scale: 1 });
  const AR = p1.height / p1.width;
  const W = 1, H = AR;
  const nSheets = Math.ceil(doc.numPages / 2);

  let needs = true;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;   // يحترم ‎radius‎ فتلين حافّةُ الظلّ
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);

  // الضوء: سماءٌ ناعمةٌ تحمل أكثرَ الإنارة، وشمسٌ أماميّةٌ عاليةٌ قليلًا إلى اليسار — فالظلُّ قصيرٌ خفيفٌ ليّنُ الحافّة
  // والجلدُ الداكن: ضوءٌ أخفت وأرضيّةٌ أعمقُ ظلًّا، والورقُ يبقى ورقًا (أخفتَ قليلًا لا رماديًّا)
  const dark = opts.theme === 'dark';
  const LIGHT = dark ? { sky: ['#f2efe8', '#8a8f96', 2.05], sun: ['#fff4e2', 0.7], ground: 0.42, paper: [0.9, 0.885, 0.85] }
                     : { sky: ['#ffffff', '#d5d9db', 2.3], sun: ['#fffaf0', 1.1], ground: 0.12, paper: [1.0, 0.985, 0.955] };
  // السماءُ تواجه الصفحةَ (لا الأعلى كما هو أصلُها في three) فتُنير الورقَ كلَّه بالتساوي، والظلُّ يأخذ حصّةَ الشمس وحدَها
  const sky = new THREE.HemisphereLight(...LIGHT.sky); sky.position.set(0, 0.35, 1); scene.add(sky);
  const sun = new THREE.DirectionalLight(...LIGHT.sun);
  sun.position.set(-1.3, 1.5, 4.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -1.4, right: 1.4, top: 1.0, bottom: -1.0, near: 0.5, far: 8 });
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.012; sun.shadow.radius = 12;
  scene.add(sun);
  // أرضيّةٌ لا تُرى إلّا ظلَّ الكتاب عليها
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: LIGHT.ground }));
  ground.position.z = -0.004; ground.receiveShadow = true; scene.add(ground);

  // شبكةُ الورقة: ‎aSheet‎ نسخةٌ من ‎uv‎ تبقى في مادّة العمق (لا خريطةَ فيها فلا ‎uv‎)
  const geo = new THREE.PlaneGeometry(1, 1, 56, Math.round(56 * AR));
  geo.setAttribute('aSheet', geo.attributes.uv.clone());

  const pageTex = new Map();
  const grain = grainTexture(THREE);
  const blank = new THREE.DataTexture(new Uint8Array([246, 241, 230, 255]), 1, 1); blank.needsUpdate = true; blank.colorSpace = THREE.SRGBColorSpace;
  /* دقّةُ الصفحة على قدّ ظهورها: عرضُ الصفحة على الشاشة × كثافةُ البكسل، مقرّبًا إلى ‎256‎ — لا ‎2048‎ لكلّ صفحة */
  const texW = Math.min(2048, renderer.capabilities.maxTextureSize,
    Math.max(512, Math.ceil(host.clientWidth * 0.5 * Math.min(devicePixelRatio, 2) / 256) * 256));
  function texFor(n) {
    if (n < 1 || n > doc.numPages) return blank;
    if (pageTex.has(n)) return pageTex.get(n);
    const tex = new THREE.Texture();
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
    pageTex.set(n, tex);
    doc.getPage(n).then(pg => {
      const v1 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: texW / v1.width });
      const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
      const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
      return pg.render({ canvasContext: cx, viewport: vp }).promise.then(() => { tex.image = cv; tex.needsUpdate = true; needs = true; });
    });
    return tex;
  }

  const sheets = [];
  for (let i = 0; i < nSheets; i++) {
    const u = { uP: { value: 0 }, uBend: { value: 0 }, uTilt: { value: 0 }, uLift0: { value: 0 }, uLift1: { value: 0 }, uSize: { value: new THREE.Vector2(W, H) } };
    // الوجهُ يُرى يسارًا (الكعبُ على حافّته اليمنى) فتُقلب الصورةُ أفقيًّا، والظهرُ يُرى يمينًا كما هو
    // ‏‎u‎ يتّجه إلى ‎−x‎ ساكنًا فينقلب ترتيبُ رؤوس المثلّثات: الوجهُ الذي يُرى أوّلًا هو «الخلفيّ» عند three.
    // فالوجهُ مادّتُه ‎BackSide‎ والظهرُ ‎FrontSide‎ بعموديٍّ معكوس
    const mk = (side, ns, flipThru) => {
      const m = patch(new THREE.MeshStandardMaterial({ side, roughness: 0.86, metalness: 0, color: '#ffffff' }), true, ns, true);
      m.userData.u = u;
      m.userData.x = { uThru: { value: blank }, uThruFlip: { value: flipThru }, uThruAmt: { value: 0.07 },
        uGrain: { value: grain }, uGrainRep: { value: new THREE.Vector2(3, 3 * AR) }, uPaper: { value: new THREE.Vector3(...LIGHT.paper) } };
      return m;
    };
    // و‎BackSide‎ يقلب العموديَّ في three (‎FLIP_SIDED‎) فيُقلب مسبقًا ليبقى نحو الناظر
    // الشفوف: الوجهُ يُري ظهرَه عند النقطة نفسِها (‎aSheet‎ كما هي)، والظهرُ يُري وجهَه (معكوسًا كخريطة الوجه)
    const fm = mk(THREE.BackSide, -1, 0), bm = mk(THREE.FrontSide, -1, 1);
    const meshF = new THREE.Mesh(geo, fm), meshB = new THREE.Mesh(geo, bm);
    for (const m of [meshF, meshB]) {
      m.castShadow = m.receiveShadow = true; m.frustumCulled = false;
      const dm = patch(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide }), false);
      dm.userData.u = u; m.customDepthMaterial = dm;
      scene.add(m);
    }
    const sh = { i, u, fm, bm, meshes: [meshF, meshB], p: 0, target: 0, bend: 0, tilt: 0, tiltT: 0 };
    sh.setMaps = () => {
      const f = texFor(2 * i + 1), b = texFor(2 * i + 2);
      if (fm.map !== f) { fm.map = f; fm.needsUpdate = true; }
      if (bm.map !== b) { bm.map = b; bm.needsUpdate = true; }
    };
    sheets.push(sh);
  }
  // ‏‎uv‎ المرآة للوجه: نعكس ‎aSheet.x‎ في الخريطة لا في الهندسة — ‎uvTransform‎ يكفي
  for (const s of sheets) s.fm.onBeforeCompile = (orig => sh => { orig(sh); sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vec2(1.0 - aSheet.x, aSheet.y);\n#endif'); })(s.fm.onBeforeCompile);
  for (const s of sheets) s.bm.onBeforeCompile = (orig => sh => { orig(sh); sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = aSheet;\n#endif'); })(s.bm.onBeforeCompile);

  let A = opts.spread || 0;   // عددُ الأوراق المقلَّبة
  /* لا تُبقى إلّا صورُ الأوراق القريبة (المفتوحةُ وورقتان من كلّ جهة) — والبعيدةُ ورقٌ أبيضُ لا تراه العين تحت الكومة */
  const NEAR = 2;
  function keepNear() {
    const want = new Set();
    sheets.forEach(s => { const near = s.i >= A - NEAR - 1 && s.i <= A + NEAR; if (near) { want.add(2 * s.i + 1); want.add(2 * s.i + 2); } });
    sheets.forEach(s => {
      const near = s.i >= A - NEAR - 1 && s.i <= A + NEAR;
      const f = near ? texFor(2 * s.i + 1) : blank, b = near ? texFor(2 * s.i + 2) : blank;
      if (s.fm.map !== f) { s.fm.map = f; s.fm.needsUpdate = true; }
      if (s.bm.map !== b) { s.bm.map = b; s.bm.needsUpdate = true; }
      s.fm.userData.x.uThru.value = b; s.bm.userData.x.uThru.value = f;
    });
    pageTex.forEach((t, n) => { if (!want.has(n)) { t.dispose(); pageTex.delete(n); } });
  }
  sheets.forEach(s => { s.p = s.target = s.i < A ? 1 : 0; });
  keepNear();
  await Promise.all([...pageTex.values()].map(t => new Promise(r => { const k = () => t.image ? r() : setTimeout(k, 30); k(); })));
  renderer.compile(scene, camera); pageTex.forEach(t => renderer.initTexture(t));

  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
    camera.aspect = w / h;
    // يسع الفتحةَ (‎2W × H‎) بهامش
    const fitH = H * 1.12, fitW = 2 * W * 1.08;
    const dist = Math.max(fitH / 2 / Math.tan(camera.fov * Math.PI / 360), fitW / 2 / Math.tan(camera.fov * Math.PI / 360) / camera.aspect);
    camera.position.set(0, -0.06 * H, dist); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
    needs = true;
  }
  new ResizeObserver(resize).observe(host);

  // ===== الحركة =====
  // كلُّ ورقةٍ لها تقدّمٌ ‎p‎ وهدف. ثلاثةُ أحوال: سحبٌ (تتبع اليدَ بنعومة)، أو حركةٌ مرسومة (‎anim‎: نقرٌ أو إفلات)،
  // أو سكونٌ يقترب من هدفه أُسّيًّا (ومنه ارتفاعُ الورقة عند التحويم)
  let last = performance.now();
  const STACK = 0.0016;
  const T = { follow: 0.07, settle: 0.12, flip: 0.8, hoverLift: 0.035, fan: 0.05 };
  let idle = false;
  let hover = -1;   // الورقةُ التي تحت المؤشّر
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    let moving = false;
    // الورقةُ النشِطة (تُسحب أو تتقلّب) — جاراتُها في الكومة تنفرج قليلًا معها
    let active = null;
    for (const s of sheets) if (s.drag != null || s.anim) { if (!active || s.drag != null) active = s; }
    for (const s of sheets) {
      if (s.anim) {
        const k = Math.min(1, (now - s.anim.t0) / s.anim.dur);
        s.p = s.anim.from + (s.anim.to - s.anim.from) * s.anim.ease(k);
        if (k >= 1) { s.p = s.anim.to; s.anim = null; }
        moving = true;
      } else if (s.drag != null) {
        s.p += (s.drag - s.p) * (1 - Math.exp(-dt / T.follow)); moving = true;
      } else {
        let goal = s.target;
        if (s.i === hover) goal = s.target === 0 ? T.hoverLift : 1 - T.hoverLift;
        // انفراجُ الكومة: الورقتان تحت النشِطة ترتفعان معها بقدرٍ يتناقص
        if (active && active !== s) {
          const d = s.target === 0 ? s.i - active.i : active.i - s.i;
          if (d >= 1 && d <= 2) {
            const lift = (s.target === 0 ? active.p : 1 - active.p) * T.fan / d;
            goal = s.target === 0 ? Math.max(goal, Math.min(lift, active.p - 0.02)) : Math.min(goal, Math.max(1 - lift, active.p + 0.02));
          }
        }
        if (Math.abs(goal - s.p) > 1e-4) { s.p += (goal - s.p) * (1 - Math.exp(-dt / T.settle)); moving = true; } else s.p = goal;
      }
      s.tilt += (s.tiltT - s.tilt) * (1 - Math.exp(-dt / 0.15));
      // الالتفافُ أقصاه في منتصف المسير، وصفرٌ حين تستقرّ
      const bend = Math.sin(s.p * Math.PI) * 2.1 * (s.dir || 1);
      s.u.uP.value = s.p; s.u.uBend.value = bend; s.u.uTilt.value = s.tilt * Math.sin(s.p * Math.PI);
      s.u.uLift0.value = (nSheets - s.i) * STACK;
      s.u.uLift1.value = (s.i + 1) * STACK;
      // لا تُلقي ظلًّا إلّا الورقةُ المتحرّكةُ والأوراقُ الثلاثُ حول الفتحة — الكومةُ الساكنةُ مسطّحةٌ لا ظلَّ لها على نفسها
      const cast = s.anim != null || s.drag != null || (s.p > 0.002 && s.p < 0.998) || Math.abs(s.i + 0.5 - A) < 2;
      if (s.cast !== cast) { s.cast = cast; for (const m of s.meshes) m.castShadow = cast; }
    }
    idle = !moving;
    if (moving || needs) { renderer.render(scene, camera); needs = false; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const cosE = k => 0.5 - 0.5 * Math.cos(Math.PI * k);
  /* الإفلاتُ يحمل سرعةَ اليد: منحنى ‎Hermite‎ يبدأ بميلٍ = السرعة × المدّة، وينتهي ساكنًا */
  const hermite = m0 => k => { const k2 = k * k, k3 = k2 * k; return (k3 - 2 * k2 + k) * m0 + (3 * k2 - 2 * k3); };
  function launch(s, to, v) {
    const dist = Math.abs(to - s.p);
    if (dist < 1e-4) { s.p = to; s.anim = null; return; }
    const dur = Math.max(0.22, T.flip * Math.sqrt(dist));
    const towards = (to - s.p) * v > 0 ? Math.abs(v) : 0;
    const m0 = Math.min(2, towards * dur / dist);
    s.target = to;
    s.anim = { from: s.p, to, t0: performance.now(), dur: dur * 1000, ease: m0 > 0.05 ? hermite(m0) : cosE };
  }
  function turnable(dir) { return dir > 0 ? A < nSheets : A > 0; }
  function flip(dir) {
    if (!turnable(dir)) return false;
    const s = sheets[dir > 0 ? A : A - 1];
    A += dir; s.dir = dir; keepNear();
    launch(s, dir > 0 ? 1 : 0, 0);
    return true;
  }

  // ===== التفاعل (المرحلة ١) =====
  // نصفُ الكتاب كلُّه مقبض (اليسارُ يتقدّم في الكتاب العربيّ واليمينُ يرجع) · السحبُ نسبيّ: ‎80%‎ من عرض الكتاب تقليبةٌ كاملة ·
  // ‎20%‎ أو رميةٌ سريعةٌ تُكمل · نقراتٌ متتاليةٌ تتتابع · الضغطُ المطوّلُ يقلّب تلقائيًّا ويتسارع · الورقةُ تحت المؤشّر ترتفع
  const el = renderer.domElement;
  el.style.touchAction = 'pan-y'; el.style.cursor = 'grab';
  el.tabIndex = 0;
  const side = e => { const r = el.getBoundingClientRect(); return { r, fwd: e.clientX - r.left < r.width / 2, yN: (e.clientY - r.top) / r.height - 0.5 }; };
  let drag = null, hold = null;
  const stopHold = () => { if (hold) { clearTimeout(hold.timer); hold = null; } };
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const { r, fwd, yN } = side(e);
    if (!turnable(fwd ? 1 : -1)) return;
    const s = sheets[fwd ? A : A - 1];
    s.anim = null; s.dir = fwd ? 1 : -1; s.tiltT = -yN * 0.7 * (fwd ? 1 : -1);
    hover = -1;
    drag = { s, fwd, x0: e.clientX, y0: e.clientY, base: s.p, w: r.width, moved: false, hist: [[performance.now(), s.p]] };
    s.drag = s.p; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing';
    // الضغطُ المطوّل بلا حركة: يقلّب ورقةً بعد ورقة، والفاصلُ يقصر حتى ‎150ms‎
    stopHold();
    hold = { n: 0, dir: fwd ? 1 : -1, timer: setTimeout(function tick() {
      if (!drag || drag.moved) return stopHold();
      if (hold.n === 0) { drag.s.drag = null; drag.auto = true; }
      if (!flip(hold.dir)) return stopHold();
      hold.n++; hold.timer = setTimeout(tick, Math.max(150, 420 - 45 * hold.n));
    }, 450) };
  });
  el.addEventListener('pointermove', e => {
    if (!drag) {
      const { fwd } = side(e), h = turnable(fwd ? 1 : -1) ? (fwd ? A : A - 1) : -1;
      if (h !== hover) { hover = h; needs = true; }
      return;
    }
    if (drag.auto) return;
    const dx = e.clientX - drag.x0;
    if (!drag.moved && Math.hypot(dx, e.clientY - drag.y0) > 5) { drag.moved = true; stopHold(); }
    drag.s.drag = Math.max(0, Math.min(1, drag.base + dx / (drag.w * 0.8)));
    const now = performance.now(); drag.hist.push([now, drag.s.drag]);
    while (drag.hist.length > 2 && now - drag.hist[0][0] > 90) drag.hist.shift();
  });
  const up = () => {
    if (!drag) return;
    const { s, fwd, moved, base, hist, auto } = drag; drag = null; stopHold(); el.style.cursor = 'grab';
    if (auto) return;
    const hand = s.drag; s.drag = null;
    // السرعة (تقدّمٌ في الثانية) من آخر ‎90ms‎
    // إن توقّفت اليدُ قبل الإفلات فلا سرعة
    const tu = performance.now(); hist.push([tu, hand]);
    while (hist.length > 2 && tu - hist[0][0] > 90) hist.shift();
    const [t0, p0] = hist[0], [t1, p1] = hist[hist.length - 1];
    const v = t1 > t0 ? (p1 - p0) / ((t1 - t0) / 1000) : 0;
    const gone = fwd ? hand - base : base - hand, flick = fwd ? v > 1.6 : v < -1.6;
    const go = !moved || gone >= 0.2 || flick;
    if (go) { A += fwd ? 1 : -1; keepNear(); launch(s, fwd ? 1 : 0, v); }
    else launch(s, base, v);
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', () => { if (!drag && hover !== -1) { hover = -1; needs = true; } });
  // لوحةُ المفاتيح والعجلة: السهمُ الأيسرُ يتقدّم (الكتابُ عربيّ)
  el.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); flip(1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); flip(-1); }
  });
  let wheelAcc = 0, wheelT = 0;
  el.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault(); const now = performance.now();
    if (now - wheelT > 400) wheelAcc = 0;
    wheelT = now; wheelAcc += e.deltaX;
    if (Math.abs(wheelAcc) > 60) { flip(wheelAcc < 0 ? 1 : -1); wheelAcc = 0; wheelT = now + 250; }
  }, { passive: false });

  return { flip, sheets, renderer, scene, camera, sun, get A() { return A; }, get settled() { return idle && !drag && sheets.every(s => !s.anim); } };
}
