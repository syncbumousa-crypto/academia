// «الكتاب ٢» — نموذجُ المرحلة ٠ (ROADMAP-BOOK2)
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

function patch(material, withNormal, nsign = 1) {
  material.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, material.userData.u);
    sh.vertexShader = SHEET_GLSL + sh.vertexShader;
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = sheetPoint(aSheet);`);
    if (withNormal) sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', `
      vec3 _p = sheetPoint(aSheet), _pu = sheetPoint(aSheet + vec2(0.01, 0.0)), _pv = sheetPoint(aSheet + vec2(0.0, 0.01));
      vec3 objectNormal = ${nsign < 0 ? '-' : ''}normalize(cross(_pv - _p, _pu - _p));`);
  };
  return material;
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
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);

  // الضوء: سماءٌ ناعمةٌ وشمسٌ واحدةٌ من أعلى اليسار أمامًا تُلقي ظلًّا
  scene.add(new THREE.HemisphereLight('#ffffff', '#b9c3c4', 2.1));
  const sun = new THREE.DirectionalLight('#fffaf0', 2.4);
  sun.position.set(-2.2, 1.6, 3.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -1.4, right: 1.4, top: 1.0, bottom: -1.0, near: 0.5, far: 8 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.01; sun.shadow.radius = 5;
  scene.add(sun);
  // أرضيّةٌ لا تُرى إلّا ظلَّ الكتاب عليها
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.position.z = -0.004; ground.receiveShadow = true; scene.add(ground);

  // شبكةُ الورقة: ‎aSheet‎ نسخةٌ من ‎uv‎ تبقى في مادّة العمق (لا خريطةَ فيها فلا ‎uv‎)
  const geo = new THREE.PlaneGeometry(1, 1, 56, Math.round(56 * AR));
  geo.setAttribute('aSheet', geo.attributes.uv.clone());

  const pageTex = new Map();
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
    const mk = (side, ns) => {
      const m = patch(new THREE.MeshStandardMaterial({ side, roughness: 0.88, metalness: 0, color: '#ffffff' }), true, ns);
      m.userData.u = u; return m;
    };
    // و‎BackSide‎ يقلب العموديَّ في three (‎FLIP_SIDED‎) فيُقلب مسبقًا ليبقى نحو الناظر
    const fm = mk(THREE.BackSide, -1), bm = mk(THREE.FrontSide, -1);
    const meshF = new THREE.Mesh(geo, fm), meshB = new THREE.Mesh(geo, bm);
    for (const m of [meshF, meshB]) {
      m.castShadow = m.receiveShadow = true; m.frustumCulled = false;
      const dm = patch(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide }), false);
      dm.userData.u = u; m.customDepthMaterial = dm;
      scene.add(m);
    }
    const sh = { i, u, fm, bm, p: 0, target: 0, bend: 0, tilt: 0, tiltT: 0 };
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
  let last = performance.now();
  const STACK = 0.0016;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    let moving = false;
    for (const s of sheets) {
      if (s.anim) {
        const k = Math.min(1, (now - s.anim.t0) / s.anim.dur);
        const e = s.anim.ease(k);
        s.p = s.anim.from + (s.anim.to - s.anim.from) * e;
        if (k >= 1) { s.p = s.anim.to; s.anim = null; }
        moving = true;
      } else if (s.drag == null && Math.abs(s.target - s.p) > 1e-4) {
        s.p += (s.target - s.p) * (1 - Math.exp(-dt / 0.12)); moving = true;
      } else if (s.drag == null) s.p = s.target;
      if (s.drag != null) { const d = s.drag - s.p; s.p += d * (1 - Math.exp(-dt / 0.07)); moving = true; }
      s.tilt += (s.tiltT - s.tilt) * (1 - Math.exp(-dt / 0.15));
      // الالتفافُ أقصاه في منتصف المسير، وصفرٌ حين تستقرّ
      const bend = Math.sin(s.p * Math.PI) * 2.1 * (s.dir || 1);
      s.u.uP.value = s.p; s.u.uBend.value = bend; s.u.uTilt.value = s.tilt * Math.sin(s.p * Math.PI);
      // الكومتان: الأقربُ إلى الفتحة أعلى
      s.u.uLift0.value = (nSheets - s.i) * STACK;
      s.u.uLift1.value = (s.i + 1) * STACK;
    }
    if (moving || needs) { const t0 = performance.now(); renderer.render(scene, camera); (window.__rt = window.__rt || []).push(performance.now() - t0); needs = false; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const cos = k => 0.5 - 0.5 * Math.cos(Math.PI * k);
  function flip(dir) {
    const i = dir > 0 ? A : A - 1;
    const s = sheets[i]; if (!s) return false;
    A += dir; s.dir = dir; s.target = dir > 0 ? 1 : 0; keepNear();
    s.anim = { from: s.p, to: s.target, t0: performance.now(), dur: 850 * Math.max(0.3, Math.abs(s.target - s.p)), ease: cos };
    return true;
  }

  // ===== التفاعل البدائيّ (يُكمَّل في المرحلة ١): نصفُ الكتاب مقبضٌ، والسحبُ نسبيّ =====
  const el = renderer.domElement;
  el.style.touchAction = 'pan-y'; el.style.cursor = 'grab';
  let drag = null;
  el.addEventListener('pointerdown', e => {
    const r = el.getBoundingClientRect(), x = e.clientX - r.left, yN = (e.clientY - r.top) / r.height - 0.5;
    const fwd = x < r.width / 2;   // اليسارُ يتقدّم
    const i = fwd ? A : A - 1, s = sheets[i]; if (!s) return;
    s.anim = null; s.dir = fwd ? 1 : -1; s.tiltT = -yN * 0.7 * (fwd ? 1 : -1);
    drag = { s, fwd, x0: e.clientX, base: s.p, w: r.width, moved: false };
    s.drag = s.p; el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x0; if (Math.abs(dx) > 5) drag.moved = true;
    drag.s.drag = Math.max(0, Math.min(1, drag.base + dx / (drag.w * 0.8)));
  });
  const up = () => {
    if (!drag) return; const { s, fwd, moved, base } = drag; drag = null; s.drag = null;
    const go = !moved || (fwd ? s.p - base : base - s.p) >= 0.2;
    if (go) { A += fwd ? 1 : -1; s.target = fwd ? 1 : 0; keepNear(); } else s.target = base;
    s.anim = { from: s.p, to: s.target, t0: performance.now(), dur: 850 * Math.max(0.3, Math.abs(s.target - s.p)), ease: cos };
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);

  return { flip, sheets, renderer, scene, camera, sun, get A() { return A; }, set debugP(v) { sheets[A].drag = v; } };
}
