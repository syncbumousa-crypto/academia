const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const load = async () => { await p.goto('http://127.0.0.1:8741/index.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 30000 }); await p.waitForTimeout(800); };
  await load();
  if (process.argv[2] === 'norender') await p.evaluate(() => { window.__bk.renderer.render = () => {}; });
  const r = await p.evaluate(() => { const c = document.querySelector('canvas').getBoundingClientRect(); return { x: c.left, y: c.top, w: c.width, h: c.height }; });
  const A = () => p.evaluate(() => window.__bk.A);
  const settle = () => p.waitForFunction(() => window.__bk.settled, null, { timeout: 20000 });
  // drag frac of canvas width from point (fx,fy), slowly (no flick)
  async function drag(fx, fy, frac, fwd) {
    const x0 = r.x + r.w * fx, y = r.y + r.h * fy;
    await p.mouse.move(x0, y); await p.mouse.down();
    const x1 = x0 + (fwd ? 1 : -1) * r.w * 0.8 * frac;   // frac = progress (80% of width = full turn)
    await p.mouse.move(x0 + (x1 - x0) * 0.5, y, { steps: 3 }); await p.mouse.move(x1, y, { steps: 3 });
    await p.waitForTimeout(400); await p.mouse.up(); await settle();
  }
  const res = [];
  p.on("console", m => console.log("C", m.text()));
  for (const [fx, fy] of [[0.1, 0.2], [0.3, 0.5], [0.45, 0.85]]) {
    let a = await A(); await drag(fx, fy, 0.22, true); const g = (await A()) - a;   // 20% of book width (canvas ≈ book)
    a = await A(); await drag(fx, fy, 0.1, true); const n = (await A()) - a;
    res.push(`fwd@${fx},${fy}: 20%→${g} 10%→${n}`);
    a = await A(); await drag(1 - fx, fy, 0.22, false); const gb = (await A()) - a;
    res.push(`back@${1-fx},${fy}: 20%→${gb}`);
  }
  // flick: short fast drag (6%) commits
  let a = await A(); const x0 = r.x + r.w * 0.3, y = r.y + r.h * 0.5;
  await p.mouse.move(x0, y); await p.mouse.down(); await p.mouse.move(x0 + r.w * 0.06, y, { steps: 2 }); await p.mouse.up(); await settle();
  res.push('flick→' + ((await A()) - a));
  // 5 clicks in 1s
  await p.focus('canvas'); for (let i = 0; i < 6; i++) await p.keyboard.press('ArrowRight'); await settle();
  a = await A(); const t = Date.now();
  for (let i = 0; i < 5; i++) { await p.mouse.click(r.x + r.w * 0.3, r.y + r.h * 0.5); await p.waitForTimeout(150); }
  res.push(`5 clicks in ${Date.now() - t}ms → ${(await A()) - a}`); await settle();
  // keys
  a = await A(); await p.focus('canvas'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
  res.push('ArrowRight×2 → ' + ((await A()) - a)); await settle();
  // long press
  a = await A(); await p.mouse.move(r.x + r.w * 0.3, r.y + r.h * 0.5); await p.mouse.down(); await p.waitForTimeout(1600); await p.mouse.up();
  res.push('hold 1.6s → ' + ((await A()) - a)); await settle();
  // hover lift
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await settle();
  await p.mouse.move(r.x + r.w * 0.3, r.y + r.h * 0.4); await p.waitForTimeout(1500);
  res.push('hover p=' + (await p.evaluate(() => { const s = window.__bk.sheets[window.__bk.A]; return s ? s.p.toFixed(3) : '-'; })));
  await p.screenshot({ path: __dirname + '/t1-hover.png' });
  console.log(JSON.stringify(await p.evaluate(() => window.__dbg))); console.log(res.join('\n')); console.log('errors', JSON.stringify(errs)); await b.close(); })();
