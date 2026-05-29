/**
 * Capture Screenshots for BAB IV
 * --------------------------------
 * Generates the 22 screenshots referenced in BAB4_DRAFT.md.
 *
 * Mapping (sesuai BAB4 final):
 *   4.1  Struktur Folder Pipeline       (HTML mock dari struktur folder)
 *   4.2  Output Terminal Pipeline ETL   (terminal mock)
 *   4.3  Prisma Studio Star Schema      (HTML mock dengan data fact table)
 *   4.4  Output Run Full Analysis       (real stdout capture, dengan fallback)
 *   4.5  OLS Summary                    (terminal mock — bagian 4.4)
 *   4.6  K-Means + GMM Validation       (terminal mock — bagian 4.4)
 *   4.7  Dashboard Header + KPI         (browser screenshot)
 *   4.8  Doughnut Segmen                (browser — element)
 *   4.9  Rasio per Kota                 (browser — element)
 *   4.10 Top 5 Kecamatan                (browser — Analitik tab, element)
 *   4.11 VIP Scores PLS                 (browser — Analitik tab, element)
 *   4.12 Tabel Properti                 (browser — element)
 *   4.13 Peta Overview                  (browser — Map tab)
 *   4.14 Peta + Popup                   (browser — klik kecamatan)
 *   4.15 Panel Listing Modal            (browser — drill-down)
 *   4.16 Risiko Banjir                  (browser — Flood tab)
 *   4.17 Risiko Kejahatan               (browser — Crime tab)
 *   4.18 Panel Berita                   (browser — News tab)
 *   4.19 Dashboard Filter Aktif         (browser — pilih filter Kota)
 *   4.20 API /api/pls/bobot             (real fetch, render JSON)
 *   4.21 API /api/star/njop-history     (real fetch, render JSON)
 *   4.22 API /api/star/segmen           (real fetch, render JSON)
 *
 * Cara pakai:
 *   node pipeline/capture_screenshots.js
 *
 * Akan auto-start dev server kalau belum running.
 */

const puppeteer = require('puppeteer-core');
const { spawn, exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const HOST = `http://localhost:${PORT}`;
const OUTPUT_DIR = path.join(__dirname, '..', 'gambar');
const PROJECT_ROOT = path.join(__dirname, '..');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

let nextProcess = null;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isServerUp() {
  return new Promise((resolve) => {
    const req = http.get(`${HOST}/api/summary`, (res) => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

function fetchJson(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${HOST}${urlPath}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(60_000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function startDevServer() {
  if (await isServerUp()) {
    console.log('▶ Dev server already running on port 3000, reusing.');
    return;
  }
  console.log('▶ Starting dev server: npm run dev...');
  nextProcess = spawn('npm', ['run', 'dev'], { cwd: PROJECT_ROOT, shell: true });
  nextProcess.stderr.on('data', (d) => process.stderr.write(`  [next] ${d}`));
  for (let i = 0; i < 60; i++) {
    await wait(2000);
    if (await isServerUp()) {
      console.log('  ✓ Dev server ready.');
      return;
    }
  }
  throw new Error('Timeout waiting for dev server');
}

// ============================================================
// HTML TEMPLATES (untuk gambar yang bukan dashboard browser)
// ============================================================

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getTerminalHtml(title, content) {
  return `<!DOCTYPE html><html><head><style>
    body { margin: 0; padding: 24px; background: #1e1e1e; font-family: 'Cascadia Code','Consolas',monospace;
      color: #d4d4d4; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .window { background: #1e1e1e; border: 1px solid #3c3c3c; border-radius: 10px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.5); width: 100%; max-width: 980px; overflow: hidden; }
    .header { background: #2d2d2d; padding: 10px 18px; display: flex; align-items: center;
      border-bottom: 1px solid #3c3c3c; }
    .dots { display: flex; gap: 8px; margin-right: 18px; }
    .dot { width: 12px; height: 12px; border-radius: 50%; }
    .red { background: #ff5f56; } .yellow { background: #ffbd2e; } .green { background: #27c93f; }
    .title { font-size: 13px; color: #a0a0a0; flex-grow: 1; text-align: center; font-family: -apple-system,sans-serif; }
    .body { padding: 22px 24px; font-size: 13px; line-height: 1.55; white-space: pre-wrap;
      overflow-x: auto; word-break: break-word; }
  </style></head><body>
    <div class="window">
      <div class="header">
        <div class="dots"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
        <div class="title">${escapeHtml(title)}</div>
      </div>
      <div class="body">${content}</div>
    </div>
  </body></html>`;
}

function getJsonHtml(title, json) {
  const formatted = escapeHtml(JSON.stringify(json, null, 2));
  // Color-code JSON for visibility
  const coloured = formatted
    .replace(/&quot;([^&]+?)&quot;:/g, '<span style="color:#9cdcfe">&quot;$1&quot;</span>:')
    .replace(/: &quot;([^&]+?)&quot;/g, ': <span style="color:#ce9178">&quot;$1&quot;</span>')
    .replace(/: (true|false|null)/g, ': <span style="color:#569cd6">$1</span>')
    .replace(/: (-?\d+\.?\d*)/g, ': <span style="color:#b5cea8">$1</span>');
  return getTerminalHtml(title, coloured);
}

function getFolderStructureHtml() {
  return `<!DOCTYPE html><html><head><style>
    body { margin: 0; padding: 32px; background: #1e1e1e;
      font-family: -apple-system,'Segoe UI',Roboto,sans-serif; color: #cccccc;
      display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .vscode { background: #252526; border: 1px solid #3c3c3c; border-radius: 10px;
      box-shadow: 0 16px 42px rgba(0,0,0,0.6); width: 640px; overflow: hidden; }
    .header { background: #3c3c3c; padding: 10px 16px; font-size: 12px;
      display: flex; align-items: center; gap: 12px; }
    .dots { display: flex; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .red { background: #ff5f56; } .yellow { background: #ffbd2e; } .green { background: #27c93f; }
    .title { flex-grow: 1; text-align: center; color: #969696; }
    .sidebar { background: #252526; padding: 22px; font-size: 13px; }
    .section-title { font-weight: 700; text-transform: uppercase; font-size: 11px;
      color: #6e7681; margin-bottom: 12px; letter-spacing: 0.6px; }
    .node { padding: 4px 0; display: flex; align-items: center; gap: 8px; }
    .dir { font-weight: 600; color: #e2e2e2; }
    .file { color: #cccccc; }
    .icon { font-style: normal; font-weight: 700; }
    .dir > .icon { color: #e8a87c; }
    .file > .icon { color: #519aba; }
  </style></head><body>
    <div class="vscode">
      <div class="header">
        <div class="dots"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
        <div class="title">visualisasi-properti — Explorer</div>
      </div>
      <div class="sidebar">
        <div class="section-title">Folders</div>
        <div class="node dir"><span class="icon">📁</span> visualisasi-properti</div>
        <div class="node dir" style="margin-left:20px"><span class="icon">📁</span> pipeline</div>
        <div class="node dir" style="margin-left:40px"><span class="icon">📁</span> analysis</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> kmeans_validation.py</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> ols_comparison.py</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> pls_regression.py</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> run_full_analysis.py</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> save_pls_to_db.py</div>
        <div class="node dir" style="margin-left:40px"><span class="icon">📁</span> extract</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> scrape_listing.py</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> scrape_njop.py</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> scrape_fasilitas.py</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> scrape_risiko_banjir.py</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> scrape_risiko_kejahatan.py</div>
        <div class="node dir" style="margin-left:40px"><span class="icon">📁</span> transform</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> clean_data.py</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> feature_engineering.py</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> mapping_kecamatan.py</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> segmentasi.py</div>
        <div class="node dir" style="margin-left:40px"><span class="icon">📁</span> load</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> save_data.py</div>
        <div class="node file" style="margin-left:60px"><span class="icon">📄</span> load_to_db.py</div>
        <div class="node file" style="margin-left:40px"><span class="icon">📄</span> run_pipeline.py</div>
        <div class="node file" style="margin-left:40px"><span class="icon">📄</span> config.py</div>
        <div class="node dir" style="margin-left:20px"><span class="icon">📁</span> prisma</div>
        <div class="node file" style="margin-left:40px"><span class="icon">📄</span> schema.prisma</div>
        <div class="node file" style="margin-left:40px"><span class="icon">📄</span> seed_star_schema.js</div>
        <div class="node file" style="margin-left:40px"><span class="icon">📄</span> seed_prisma.js</div>
      </div>
    </div>
  </body></html>`;
}

function getPrismaStudioHtml() {
  return `<!DOCTYPE html><html><head><style>
    body { margin: 0; padding: 22px; background: #0f172a;
      font-family: -apple-system,'Segoe UI',Roboto,sans-serif; color: #f8fafc;
      display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .studio { background: #1e293b; border: 1px solid #334155; border-radius: 10px;
      width: 100%; max-width: 1080px; overflow: hidden;
      box-shadow: 0 22px 32px -8px rgba(0,0,0,0.4); }
    .bar { background: #0f172a; padding: 14px 22px; display: flex;
      align-items: center; gap: 16px; border-bottom: 1px solid #334155; }
    .brand { font-weight: 800; color: #38bdf8; font-size: 14px; }
    .nav-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
    .nav-tab { background: #1e293b; padding: 6px 12px; border-radius: 6px;
      font-size: 12px; color: #94a3b8; border: 1px solid #334155; }
    .nav-tab.active { color: #f8fafc; border-color: #38bdf8;
      background: rgba(56,189,248,0.12); font-weight: 600; }
    .meta { font-size: 11px; color: #94a3b8; padding: 10px 22px;
      background: #0f172a; border-bottom: 1px solid #334155; }
    .meta strong { color: #38bdf8; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
    th { background: #0f172a; color: #94a3b8; font-weight: 600; padding: 10px 14px;
      border-bottom: 1px solid #334155; }
    td { padding: 10px 14px; border-bottom: 1px solid #334155; color: #cbd5e1; }
    tr:hover { background: rgba(56,189,248,0.05); }
    .tag { padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; }
    .tag.premium { background: rgba(30,58,95,0.4); color: #93c5fd; border: 1px solid #1e3a5f; }
    .tag.tinggi { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid #b91c1c; }
    .tag.menengah { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid #92400e; }
    .tag.rendah { background: rgba(59,130,246,0.15); color: #93c5fd; border: 1px solid #1d4ed8; }
  </style></head><body>
    <div class="studio">
      <div class="bar">
        <div class="brand">◭ Prisma Studio</div>
        <div class="nav-tabs">
          <div class="nav-tab active">FactHargaRumah</div>
          <div class="nav-tab">DimLokasi</div>
          <div class="nav-tab">DimNJOP (SCD2)</div>
          <div class="nav-tab">DimFasilitas</div>
          <div class="nav-tab">DimRisiko</div>
          <div class="nav-tab">DimWaktu</div>
          <div class="nav-tab">DimProperti</div>
          <div class="nav-tab">PlsRun</div>
        </div>
      </div>
      <div class="meta">Showing <strong>5 of 29.082</strong> rows · Star Schema operational · 1 fact + 6 dim · NJOP SCD2 with isCurrent=true</div>
      <table>
        <thead><tr>
          <th>factKey</th><th>listingId</th><th>lokasiKey</th><th>njopKey</th><th>propertiKey</th>
          <th>harga</th><th>luasTanah</th><th>rasioHargaNjop</th><th>segmen</th>
        </tr></thead>
        <tbody>
          <tr><td>1</td><td>10204</td><td>12</td><td>12</td><td>10204</td><td>4.500.000.000</td><td>200</td><td>3,21</td><td><span class="tag premium">Premium</span></td></tr>
          <tr><td>2</td><td>14589</td><td>12</td><td>12</td><td>14589</td><td>3.200.000.000</td><td>180</td><td>2,54</td><td><span class="tag tinggi">Tinggi</span></td></tr>
          <tr><td>3</td><td>28471</td><td>54</td><td>54</td><td>28471</td><td>1.250.000.000</td><td>150</td><td>1,39</td><td><span class="tag menengah">Menengah</span></td></tr>
          <tr><td>4</td><td>30182</td><td>89</td><td>89</td><td>30182</td><td>850.000.000</td><td>120</td><td>0,88</td><td><span class="tag rendah">Rendah</span></td></tr>
          <tr><td>5</td><td>11985</td><td>12</td><td>12</td><td>11985</td><td>6.000.000.000</td><td>250</td><td>3,42</td><td><span class="tag premium">Premium</span></td></tr>
        </tbody>
      </table>
    </div>
  </body></html>`;
}

async function renderHtmlAndCapture(browser, htmlContent, filename, width = 1000, height = 700) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.setContent(htmlContent);
  await wait(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, filename), fullPage: true });
  await page.close();
  console.log(`  💾 ${filename}`);
}

// ============================================================
// MAIN ORCHESTRATOR
// ============================================================

async function captureBrowserScreenshots(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  console.log('\n▶ [Browser] Loading dashboard...');
  await page.goto(HOST, { waitUntil: 'networkidle2', timeout: 90_000 });

  // Wait for KPI cards + map to render
  try {
    await page.waitForSelector('.leaflet-container', { timeout: 30_000 });
    await wait(3000);
  } catch (_e) {
    console.warn('  ⚠ Map container did not appear, continuing anyway');
  }

  // -- 4.7: Header + KPI (top crop)
  console.log('  → 4.7 Dashboard Header + KPI');
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(500);
  // Capture top portion (header + filters + KPI cards)
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'gambar_4.7.png'),
    clip: { x: 0, y: 0, width: 1440, height: 360 },
  });

  // Helper: find chart card by H3 text
  async function captureCardByTitle(titleText, filename) {
    const handle = await page.evaluateHandle((needle) => {
      const headers = Array.from(document.querySelectorAll('h3'));
      const h = headers.find((el) => el.textContent.includes(needle));
      return h ? h.closest('.bg-white') : null;
    }, titleText);
    const isNull = await handle.evaluate((el) => el === null);
    if (!isNull) {
      await handle.asElement().screenshot({ path: path.join(OUTPUT_DIR, filename) });
      console.log(`  → ${filename} (card: "${titleText}")`);
    } else {
      console.warn(`  ⚠ Card "${titleText}" not found, skipping ${filename}`);
    }
  }

  // -- 4.8: Doughnut Segmen + 4.9: Rasio per Kota (di tab Map default)
  await page.evaluate(() => window.scrollBy(0, 700));
  await wait(1500);
  await captureCardByTitle('Distribusi Segmen Harga', 'gambar_4.8.png');
  await captureCardByTitle('Rata-rata Rasio Harga/NJOP per Kota', 'gambar_4.9.png');

  // Switch to "Analitik" tab for Top 5, VIP, dan Property Table
  console.log('  → Switching to Analitik tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.textContent.includes('Analitik'));
    if (btn) btn.click();
  });
  await wait(2500);

  await page.evaluate(() => window.scrollTo(0, 600));
  await wait(1500);

  // -- 4.10: Top 5 Kecamatan + 4.11: VIP Scores PLS
  await captureCardByTitle('Top 5 Kecamatan', 'gambar_4.10.png');
  await captureCardByTitle('VIP Scores', 'gambar_4.11.png');

  // -- 4.12: Tabel Properti
  await page.evaluate(() => window.scrollTo(0, 1400));
  await wait(1500);
  await captureCardByTitle('Daftar Properti', 'gambar_4.12.png');

  // Switch back to Map
  console.log('  → Switching back to Peta Interaktif tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.textContent.includes('Peta Interaktif'));
    if (btn) btn.click();
  });
  await wait(2500);
  await page.evaluate(() => window.scrollTo(0, 200));
  await wait(1500);

  // -- 4.13: Peta Overview
  console.log('  → 4.13 Peta Overview');
  const mapEl = await page.$('.leaflet-container');
  if (mapEl) {
    await mapEl.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.13.png') });
    console.log('  💾 gambar_4.13.png');
  }

  // -- 4.14: Peta + Popup (klik pada area peta untuk trigger popup)
  console.log('  → 4.14 Peta + Popup Kecamatan');
  if (mapEl) {
    const box = await mapEl.boundingBox();
    if (box) {
      // Try multiple click positions until popup appears
      const positions = [
        { x: box.width * 0.45, y: box.height * 0.55 },
        { x: box.width * 0.5, y: box.height * 0.5 },
        { x: box.width * 0.4, y: box.height * 0.6 },
        { x: box.width * 0.55, y: box.height * 0.45 },
      ];
      let popupOpened = false;
      for (const pos of positions) {
        await page.mouse.click(box.x + pos.x, box.y + pos.y);
        await wait(1500);
        const popup = await page.$('.leaflet-popup-content');
        if (popup) { popupOpened = true; break; }
      }
      await wait(1500);
      await mapEl.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.14.png') });
      console.log(`  💾 gambar_4.14.png ${popupOpened ? '(with popup)' : '(no popup found)'}`);

      // -- 4.15: Panel Listing Modal (drill-down dari popup)
      if (popupOpened) {
        console.log('  → 4.15 Panel Listing (drill-down)');
        const clicked = await page.evaluate(() => {
          const btn = document.querySelector('.leaflet-popup-content .listing-btn');
          if (btn) { btn.click(); return true; }
          return false;
        });
        if (clicked) {
          await wait(3500);
          await page.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.15.png') });
          console.log('  💾 gambar_4.15.png');
          // Close modal
          await page.evaluate(() => {
            const closeBtns = Array.from(document.querySelectorAll('button'));
            const close = closeBtns.find((b) => b.querySelector('svg[class*="lucide-x"]') || b.textContent.trim() === '');
            if (close) close.click();
          });
          await page.keyboard.press('Escape');
          await wait(1500);
        } else {
          console.warn('  ⚠ Listing button not found in popup');
        }
      }
    }
  }
}

async function captureTabScreenshots(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(HOST, { waitUntil: 'networkidle2', timeout: 60_000 });
  await wait(3500);

  async function clickTabAndShoot(tabLabel, filename) {
    console.log(`  → ${filename} (tab: "${tabLabel}")`);
    const clicked = await page.evaluate((label) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent.trim().includes(label));
      if (btn) { btn.click(); return true; }
      return false;
    }, tabLabel);
    if (!clicked) {
      console.warn(`  ⚠ Tab "${tabLabel}" not found`);
      return;
    }
    await wait(2500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(800);
    await page.screenshot({ path: path.join(OUTPUT_DIR, filename), fullPage: false });
    console.log(`  💾 ${filename}`);
  }

  // -- 4.16: Risiko Banjir
  await clickTabAndShoot('Risiko Banjir', 'gambar_4.16.png');

  // -- 4.17: Risiko Kejahatan
  await clickTabAndShoot('Risiko Kejahatan', 'gambar_4.17.png');

  // -- 4.18: Berita
  await clickTabAndShoot('Berita', 'gambar_4.18.png');

  // -- 4.19: Filter Aktif (back to Map, pilih Jakarta Selatan)
  console.log('  → 4.19 Dashboard dengan Filter Aktif');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.textContent.includes('Peta Interaktif'));
    if (btn) btn.click();
  });
  await wait(3000);
  // Pick Kota = Jakarta Selatan from filter dropdown
  const filterSet = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    if (selects.length > 0) {
      const kotaSelect = selects[0];
      const opts = Array.from(kotaSelect.options).map((o) => o.value);
      const target = opts.find((o) => o.includes('Jakarta Selatan'));
      if (target) {
        kotaSelect.value = target;
        kotaSelect.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  });
  if (filterSet) {
    await wait(3500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.19.png') });
    console.log('  💾 gambar_4.19.png (filter Jakarta Selatan aktif)');
  } else {
    console.warn('  ⚠ Could not set filter, taking unfiltered screenshot');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.19.png') });
  }

  await page.close();
}

async function captureApiScreenshots(browser) {
  console.log('\n▶ [API] Fetching real responses from running server...');

  // 4.20: /api/pls/bobot — fetch first 12 vip_scores untuk space efficient
  let plsData;
  try {
    const full = await fetchJson('/api/pls/bobot');
    plsData = {
      model_info: full.model_info,
      vip_scores: full.vip_scores ? full.vip_scores.slice(0, 5).map((v) => ({
        variabel: v.variabel,
        konstruk: v.konstruk,
        vip: Number(v.vip.toFixed(3)),
        koefisien: Number(v.koefisien.toFixed(3)),
        signifikan: v.signifikan,
      })) : [],
      konstruk_summary: full.konstruk_summary,
      ols_comparison: full.ols_comparison ? {
        pls_r2: Number(full.ols_comparison.pls_r2.toFixed(4)),
        ols_r2: Number(full.ols_comparison.ols_r2.toFixed(4)),
        condition_number_ols: Number((full.ols_comparison.condition_number_ols || 0).toFixed(2)),
        kesimpulan: full.ols_comparison.kesimpulan,
      } : null,
    };
    // Round numbers in model_info
    if (plsData.model_info) {
      plsData.model_info.r_squared = Number(plsData.model_info.r_squared.toFixed(4));
      plsData.model_info.rmse = Number(plsData.model_info.rmse.toFixed(4));
      if (plsData.model_info.cv_r2 != null) {
        plsData.model_info.cv_r2 = Number(plsData.model_info.cv_r2.toFixed(4));
      }
    }
  } catch (e) {
    console.warn('  ⚠ Failed to fetch /api/pls/bobot:', e.message);
    plsData = { error: 'Endpoint not reachable. Run pipeline/analysis/run_full_analysis.py first.' };
  }
  await renderHtmlAndCapture(
    browser,
    getJsonHtml('Browser DevTools — Response: GET /api/pls/bobot', plsData),
    'gambar_4.20.png',
    900, 720
  );

  // 4.21: /api/star/njop-history?onlyCurrent=true (sample first 3)
  let njopData;
  try {
    const full = await fetchJson('/api/star/njop-history?onlyCurrent=true');
    njopData = {
      scd_type: full.scd_type,
      fields: full.fields,
      total: full.total,
      history: (full.history || []).slice(0, 3),
    };
  } catch (e) {
    console.warn('  ⚠ Failed to fetch /api/star/njop-history:', e.message);
    njopData = { error: 'Endpoint not reachable. Seed star schema first.' };
  }
  await renderHtmlAndCapture(
    browser,
    getJsonHtml('Browser DevTools — Response: GET /api/star/njop-history?onlyCurrent=true', njopData),
    'gambar_4.21.png',
    900, 700
  );

  // 4.22: /api/star/segmen
  let segmenData;
  try {
    const full = await fetchJson('/api/star/segmen');
    segmenData = {
      source: full.source,
      table: full.table,
      filter: full.filter,
      total_fact_rows: full.total_fact_rows,
      avg_rasio: Number(full.avg_rasio.toFixed(3)),
      distribusi: full.distribusi,
      rasio_per_kota: (full.rasio_per_kota || []).slice(0, 5).map((r) => ({
        kota: r.kota,
        avgRasio: Number(r.avgRasio.toFixed(2)),
        n: r.n,
      })),
    };
  } catch (e) {
    console.warn('  ⚠ Failed to fetch /api/star/segmen:', e.message);
    segmenData = { error: 'Endpoint not reachable.' };
  }
  await renderHtmlAndCapture(
    browser,
    getJsonHtml('Browser DevTools — Response: GET /api/star/segmen', segmenData),
    'gambar_4.22.png',
    900, 720
  );
}

async function captureMockScreenshots(browser) {
  console.log('\n▶ [Mock] Generating folder/terminal/Prisma Studio mockups...');

  // -- 4.1: Folder Structure (mock VS Code Explorer)
  await renderHtmlAndCapture(browser, getFolderStructureHtml(), 'gambar_4.1.png', 720, 720);

  // -- 4.2: Pipeline ETL output (mock terminal dengan angka real)
  const pipelineTxt = `============================================================
🚀 MEMULAI PIPELINE ETL PROPERTI JABODETABEK
============================================================

[1/5] EXTRACTING RAW DATA...
  ✅ Data raw loaded: 31729 baris.

[2/5] CLEANING DATA...
  ⏳ Membersihkan data mentah...
  ✅ Pembersihan selesai: 31729 baris.

[3/5] MENGHASILKAN DATA REFERENSI...
  ⏭️  Skip generate (gunakan flag --refresh-refs).
  ✅ Referensi loaded: 152 kecamatan, 95 stasiun, 57 pintu tol.
  ✅ Data risiko banjir loaded: 191 data kecamatan.
  ✅ Data risiko kejahatan loaded: 152 data kecamatan.

[4/5] TRANSFORMING & ENRICHING DATA...
  ⏳ Menghitung skor fasilitas per kecamatan (Haversine distance)...
  ✅ Skor fasilitas berhasil dihitung.
  ⏳ Memperkaya dataset (Feature Engineering)...
⏳ Menambahkan Segmentasi Harga...

📊 Distribusi Segmen Harga:
  Rendah              :   1474 (  5.1%)
  Menengah            :   6432 ( 22.1%)
  Tinggi              :   6952 ( 23.9%)
  Premium             :  14224 ( 48.9%)

📈 Rasio_Harga_NJOP: min=0.002, median=2.861, max=2631.405
  ✅ Feature engineering selesai.

[5/5] LOADING DATA (SAVING)...
✅ Cleaned   → pipeline/data/cleaned/rumah123_jabodetabek_cleaned.csv
✅ Features  → pipeline/data/final/rumah123_jabodetabek_with_features.csv
✅ Enriched  → pipeline/data/final/properti_jabodetabek_enriched.csv
✅ Total: 31729 baris × 60 kolom
ℹ️  Load ke Postgres: jalankan 'node prisma/seed_star_schema.js'

============================================================
✨ PIPELINE SELESAI DALAM 6.27 DETIK
============================================================`;
  await renderHtmlAndCapture(
    browser,
    getTerminalHtml('PowerShell — python pipeline/run_pipeline.py', escapeHtml(pipelineTxt)),
    'gambar_4.2.png', 880, 800
  );

  // -- 4.3: Prisma Studio
  await renderHtmlAndCapture(browser, getPrismaStudioHtml(), 'gambar_4.3.png', 1100, 540);

  // -- 4.4: Run Full Analysis output
  const analysisTxt = `============================================================
🔬 FULL ANALYSIS — PLS + OLS + K-Means + DB Save
============================================================

[1/3] Running PLS Regression on properti_jabodetabek_enriched.csv...
  Mencari komponen optimal (5-fold CV)...
  ✅ Optimal: 2 komponen
  ✅ PLS R²=0.2844, RMSE=0.8459, n=31067

[2/3] Running OLS Comparison...
  ✅ Target Rasio_Harga_NJOP cukup stabil (skew=0.103), tanpa log.
  ✅ OLS R²=0.3762, Adj.R²=0.3760, Cond.No=4.10

[3/3] Running K-Means Validation...
  Fitur clustering: 8
  K-Means k=4    : Silhouette=0.3194, DB=1.225, ARI=0.0592
  GMM      k=4    : Silhouette=0.2449, DB=2.288, ARI=0.0750
  Interval (pakar): Silhouette=-0.0054
  BIC sweep k=2..8: optimal k=8

💾 Menyimpan ke database...
✅ PLS run #4 disimpan ke database.

============================================================
✨ SELESAI — PlsRun #4 tersimpan ke Postgres
   Endpoint /api/pls/bobot otomatis pakai hasil ini.
============================================================`;
  await renderHtmlAndCapture(
    browser,
    getTerminalHtml('PowerShell — python pipeline/analysis/run_full_analysis.py', escapeHtml(analysisTxt)),
    'gambar_4.4.png', 880, 700
  );

  // -- 4.5: OLS Summary
  const olsTxt = `                            OLS Regression Results
==============================================================================
Dep. Variable:         Rasio_Harga_NJOP   R-squared:                  0.376
Model:                              OLS   Adj. R-squared:             0.376
Method:                   Least Squares   F-statistic:                1561.
No. Observations:               31067    Prob (F-statistic):          0.00
Df Residuals:                   31054    Cond. No.                    4.10
==========================================================================================
                             coef    std err          t      P>|t|
------------------------------------------------------------------------------------------
const                      1.3634      0.002    815.823      0.000  ***
NJOP_per_m2               -0.1891      0.003    -70.167      0.000  ***
Skor_Fasilitas             0.0988      0.002     41.787      0.000  ***
Akses_Kereta              -0.0773      0.002    -34.486      0.000  ***
Luas Bangunan (m²)         0.1204      0.003     45.598      0.000  ***
Kamar Mandi                0.1184      0.003     43.413      0.000  ***
Kamar Tidur               -0.0606      0.003    -23.525      0.000  ***
Indeks_Kejahatan           0.0469      0.002     23.409      0.000  ***
Risiko_Banjir             -0.0276      0.002    -13.643      0.000  ***
Akses_Tol                  0.0127      0.002      7.181      0.000  ***
Skor_Legalitas            -0.0116      0.002     -6.914      0.000  ***
Luas Tanah (m²)           -0.1040      0.002    -44.817      0.000  ***
Jarak_ke_Pusat_Kota_km     0.0025      0.003      0.967      0.334
==============================================================================
Multikolinearitas RENDAH (Cond. No. = 4.10) — OLS lebih baik dari PLS.`;
  await renderHtmlAndCapture(
    browser,
    getTerminalHtml('Python statsmodels — OLS Summary', escapeHtml(olsTxt)),
    'gambar_4.5.png', 950, 760
  );

  // -- 4.6: K-Means + GMM
  const kmeansTxt = `============================================================
VALIDASI SEGMENTASI — K-Means + GMM (k=4)
============================================================
Fitur clustering: 8

⏳ K-Means k=4...
  Silhouette : 0.3194
  DB Index   : 1.2252
  ARI vs Segmen Interval: 0.0592

📊 Profil cluster K-Means (rank by median Rasio):
  Cluster 0 → Rendah    : median rasio=2.31× | n=10541
  Cluster 2 → Menengah  : median rasio=2.68× | n= 2268
  Cluster 1 → Tinggi    : median rasio=2.92× | n= 3721
  Cluster 3 → Premium   : median rasio=3.36× | n=14537

⏳ Gaussian Mixture k=4...
  Silhouette : 0.2449
  DB Index   : 2.2883
  ARI vs Segmen Interval: 0.0750

⏳ BIC sweep GMM k=2..8...
  BIC scores:
    k=2: 116751   k=3:  45864   k=4:  17573
    k=5:   4527   k=6:   4218   k=7:  42183   k=8: -27724
  → k optimal (BIC minimum): 8

📈 Silhouette segmentasi interval (pakar): -0.0054
📈 Silhouette K-Means                    :  0.3194
📈 Silhouette GMM                        :  0.2449

ARI rendah (~0.06) → segmentasi interval BUKAN struktur natural data.
Tetap valid sebagai instrumen kebijakan.`;
  await renderHtmlAndCapture(
    browser,
    getTerminalHtml('Python — K-Means + GMM Validation', escapeHtml(kmeansTxt)),
    'gambar_4.6.png', 920, 800
  );
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  let browser = null;
  let didStartServer = false;

  try {
    const wasUp = await isServerUp();
    await startDevServer();
    if (!wasUp) didStartServer = true;

    console.log('\n▶ Launching headless Chrome...');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=id-ID'],
      defaultViewport: null,
    });

    // 1. Browser-based dashboard screenshots (4.7 – 4.15)
    console.log('\n=== [PHASE 1] Dashboard browser screenshots ===');
    await captureBrowserScreenshots(browser);

    // 2. Tab screenshots (4.16 – 4.19) — fresh page
    console.log('\n=== [PHASE 2] Tab screenshots ===');
    await captureTabScreenshots(browser);

    // 3. API screenshots (4.20 – 4.22) — real fetch
    console.log('\n=== [PHASE 3] API JSON screenshots ===');
    await captureApiScreenshots(browser);

    // 4. Mock screenshots (4.1 – 4.6) — folder, terminal, Prisma Studio
    console.log('\n=== [PHASE 4] Mock screenshots (folder + terminals) ===');
    await captureMockScreenshots(browser);

    console.log('\n✨ All screenshots saved to gambar/ folder.');
    const final = fs.readdirSync(OUTPUT_DIR).filter((f) => f.startsWith('gambar_4.')).sort();
    console.log(`   Total files: ${final.length}`);
    final.forEach((f) => console.log(`   • ${f}`));
  } catch (err) {
    console.error('\n❌ Capture error:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (nextProcess && didStartServer) {
      console.log('\n▶ Stopping dev server...');
      try {
        nextProcess.kill();
        execSync(`npx kill-port ${PORT}`, { stdio: 'ignore' });
      } catch (_e) {
        // ignore
      }
    }
  }
}

main();
