const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = join(__dirname, '..');
async function main() {
  const content = readFileSync(join(root, 'extension/content.js'), 'utf8');
  const start = content.indexOf('  let warning;');
  const end = content.indexOf('\n  function send(');
  if (start < 0 || end < start) throw new Error('Warning renderer changed; update extraction.');
  // Embed the actual renderer verbatim, including its closed shadow root and CSS.
  const warning = content.slice(start, end);
  const html = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ClipGuard — clipboard mismatch demonstration</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#faf7f2;color:#32251c;font:18px/1.6 system-ui,sans-serif}
header{padding:25px 64px;border-bottom:1px solid #e5dacb;display:flex;align-items:center;gap:14px;font-size:24px;font-weight:700}
.mark{font-size:30px;color:#752300}header small{font-size:13px;font-weight:500;letter-spacing:2px;margin-left:18px;color:#786754}
main{max-width:920px;margin:76px auto 0}h1{font-size:44px;line-height:1.15;letter-spacing:-1.5px;margin:0 0 16px}
.intro{color:#756653;max-width:660px;margin-bottom:35px}.panel{background:#fff;border:1px solid #e5dacb;border-radius:16px;padding:30px 34px;box-shadow:0 8px 32px #32251c08}
.label{font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:700;color:#786754}code{display:block;margin:10px 0 24px;font:19px/1.5 ui-monospace,monospace;color:#493a2b}
label{display:block;margin-bottom:10px;font-weight:650}input{width:100%;padding:16px;border:2px solid #cba781;border-radius:8px;font:19px ui-monospace,monospace;color:#32251c;background:#fffcf7}
.note{font-size:15px;color:#786754;margin:18px 0 0}footer{margin-top:27px;display:flex;gap:30px;font-size:14px;color:#786754}
</style>
<header><span class="mark" aria-hidden="true">▣</span> ClipGuard <small>CLIPBOARD PROTECTION</small></header>
<main><h1>A different link. A timely warning.</h1>
<p class="intro">ClipGuard warns when pasted text differs from a copy or cut it observed within the last two minutes.</p>
<section class="panel" aria-label="Example webpage form">
<div class="label">Example · copied from a webpage moments ago</div>
<code>https://example.com/invoice/1042</code>
<label for="link">Pasted invoice link</label>
<input id="link" value="https://example.net/invoice/1042" spellcheck="false">
<p class="note">The paste stays in your field. Check it before you use it.</p>
</section>
<footer><span>Free · No accounts</span><span>Local comparison · No network calls</span><span>Demonstration with example links</span></footer>
</main><script>
// Warning renderer copied verbatim from extension/content.js by generate-demo.js.
(() => {
${warning}
  showWarning();
})();
</script></html>`;
  mkdirSync(join(root, 'demo'), { recursive: true });
  writeFileSync(join(root, 'demo/demo.html'), html);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(join(root, 'demo/demo.html')).href);
    await page.screenshot({ path: join(root, 'demo/screenshot.png') });
    // Small promotional tile required by the Chrome listing form.
    await page.setViewportSize({ width: 440, height: 280 });
    const icon = readFileSync(join(root, 'extension/icons/icon-128.png')).toString('base64');
    await page.setContent(`<html><body style="margin:0;background:#faf7f2;color:#752300;font-family:system-ui,sans-serif;display:grid;place-content:center;text-align:center;height:280px"><img alt="" src="data:image/png;base64,${icon}" style="width:96px;height:96px;margin:auto"><h1 style="font-size:36px;margin:8px 0">ClipGuard</h1><p style="margin:0;color:#665342;font-size:17px">Notice when pasted text changes.</p></body></html>`);
    await page.locator('img').evaluate(img => img.decode());
    await page.screenshot({ path: join(root, 'store/promo-440x280.png') });
  } finally { await browser.close(); }
  console.log('Generated demo/demo.html, demo/screenshot.png (1280 x 800), store/promo-440x280.png');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
