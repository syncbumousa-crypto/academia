const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const th of ['light', 'dark']) {
  const p = await b.newPage({ viewport: { width: 1100, height: 760 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 300)); });
  await p.goto('http://127.0.0.1:8741/index.html' + (th === 'dark' ? '?dark' : '')); await p.waitForFunction(() => window.__ready, null, { timeout: 60000 }); await p.waitForTimeout(3000);
  await p.screenshot({ path: __dirname + `/t2-${th}-rest.png` });
  for (const q of [0.3]) {
    await p.evaluate(q => { const bk = window.__bk, s = bk.sheets[bk.A]; s.drag = q; s.dir = 1; s.tiltT = 0.18; }, q);
    await p.waitForTimeout(6000);
    await p.screenshot({ path: __dirname + `/t2-${th}-${q}.png` });
  }
  console.log(th, JSON.stringify(errs.slice(0, 4))); await p.close(); }
  await b.close(); })();
