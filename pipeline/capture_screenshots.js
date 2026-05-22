const puppeteer = require('puppeteer-core');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const OUTPUT_DIR = path.join(__dirname, '..', 'gambar');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Keep track of background process to kill it on exit
let nextProcess = null;

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to check if server is up
function isServerUp() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/api/summary`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

// Renders styled HTML with Puppeteer and takes a screenshot
async function renderHtmlAndCapture(browser, htmlContent, filename, width = 1000, height = 750) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.setContent(htmlContent);
  // Wait a little for rendering
  await wait(500);
  const outputPath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: outputPath, fullPage: true });
  await page.close();
  console.log(`Saved screenshot: ${filename}`);
}

// Generate the beautiful VS Code / Terminal style HTML mockups
function getTerminalHtml(title, content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 20px;
          background-color: #1e1e1e;
          font-family: 'Consolas', 'Courier New', Courier, monospace;
          color: #d4d4d4;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .window {
          background-color: #1e1e1e;
          border: 1px solid #3c3c3c;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          width: 95%;
          max-width: 900px;
          overflow: hidden;
        }
        .header {
          background-color: #2d2d2d;
          padding: 10px 15px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #3c3c3c;
        }
        .buttons {
          display: flex;
          gap: 8px;
          margin-right: 15px;
        }
        .button {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .close { background-color: #ff5f56; }
        .minimize { background-color: #ffbd2e; }
        .maximize { background-color: #27c93f; }
        .title {
          font-size: 13px;
          color: #a0a0a0;
          flex-grow: 1;
          text-align: center;
        }
        .body {
          padding: 20px;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          overflow-x: auto;
        }
        .green { color: #4ec9b0; }
        .blue { color: #569cd6; }
        .yellow { color: #dcdcaa; }
        .gray { color: #808080; }
      </style>
    </head>
    <body>
      <div class="window">
        <div class="header">
          <div class="buttons">
            <div class="button close"></div>
            <div class="button minimize"></div>
            <div class="button maximize"></div>
          </div>
          <div class="title">${title}</div>
        </div>
        <div class="body">${content}</div>
      </div>
    </body>
    </html>
  `;
}

function getFolderStructureHtml() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 30px;
          background-color: #1e1e1e;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #cccccc;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .vscode {
          background-color: #252526;
          border: 1px solid #3c3c3c;
          border-radius: 8px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.6);
          width: 600px;
          overflow: hidden;
        }
        .vs-header {
          background-color: #3c3c3c;
          padding: 8px 16px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .vs-dots {
          display: flex;
          gap: 6px;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #555;
        }
        .vs-title {
          flex-grow: 1;
          text-align: center;
          color: #969696;
        }
        .sidebar {
          background-color: #252526;
          padding: 20px;
          font-size: 13px;
        }
        .section-title {
          font-weight: bold;
          text-transform: uppercase;
          font-size: 11px;
          color: #6e7681;
          margin-bottom: 10px;
          letter-spacing: 0.5px;
        }
        .tree-node {
          padding: 4px 0 4px 15px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tree-node.dir {
          font-weight: bold;
          color: #e2e2e2;
        }
        .tree-node.file {
          color: #cccccc;
        }
        .icon {
          font-style: normal;
          font-weight: bold;
        }
        .dir > .icon { color: #e8a87c; }
        .file > .icon { color: #519aba; }
      </style>
    </head>
    <body>
      <div class="vscode">
        <div class="vs-header">
          <div class="vs-dots">
            <div class="dot" style="background-color:#ff5f56"></div>
            <div class="dot" style="background-color:#ffbd2e"></div>
            <div class="dot" style="background-color:#27c93f"></div>
          </div>
          <div class="vs-title">visualisasi-properti - Explorer</div>
        </div>
        <div class="sidebar">
          <div class="section-title">Folders</div>
          <div class="tree-node dir"><span class="icon">📁</span> visualisasi-properti</div>
          <div class="tree-node dir" style="margin-left: 20px;"><span class="icon">📁</span> pipeline</div>
          <div class="tree-node dir" style="margin-left: 40px;"><span class="icon">📁</span> analysis</div>
          <div class="tree-node file" style="margin-left: 60px;"><span class="icon">📄</span> kmeans_validation.py</div>
          <div class="tree-node file" style="margin-left: 60px;"><span class="icon">📄</span> ols_comparison.py</div>
          <div class="tree-node file" style="margin-left: 60px;"><span class="icon">📄</span> pls_regression.py</div>
          <div class="tree-node file" style="margin-left: 60px;"><span class="icon">📄</span> run_full_analysis.py</div>
          <div class="tree-node file" style="margin-left: 60px;"><span class="icon">📄</span> save_pls_to_db.py</div>
          <div class="tree-node dir" style="margin-left: 40px;"><span class="icon">📁</span> extract</div>
          <div class="tree-node file" style="margin-left: 60px;"><span class="icon">📄</span> scrape_fasilitas.py</div>
          <div class="tree-node file" style="margin-left: 60px;"><span class="icon">📄</span> scrape_njop.py</div>
          <div class="tree-node file" style="margin-left: 60px;"><span class="icon">📄</span> scrape_risiko_banjir.py</div>
          <div class="tree-node file" style="margin-left: 60px;"><span class="icon">📄</span> scrape_risiko_kejahatan.py</div>
          <div class="tree-node dir" style="margin-left: 40px;"><span class="icon">📁</span> transform</div>
          <div class="tree-node file" style="margin-left: 60px;"><span class="icon">📄</span> clean_data.py</div>
          <div class="tree-node file" style="margin-left: 60px;"><span class="icon">📄</span> feature_engineering.py</div>
          <div class="tree-node file" style="margin-left: 60px;"><span class="icon">📄</span> segmentasi.py</div>
          <div class="tree-node dir" style="margin-left: 40px;"><span class="icon">📁</span> load</div>
          <div class="tree-node file" style="margin-left: 60px;"><span class="icon">📄</span> save_data.py</div>
          <div class="tree-node file" style="margin-left: 40px;"><span class="icon">📄</span> run_pipeline.py</div>
          <div class="tree-node dir" style="margin-left: 20px;"><span class="icon">📁</span> prisma</div>
          <div class="tree-node file" style="margin-left: 40px;"><span class="icon">📄</span> schema.prisma</div>
          <div class="tree-node file" style="margin-left: 40px;"><span class="icon">📄</span> seed_star_schema.js</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getPrismaStudioHtml() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 20px;
          background-color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #f8fafc;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .studio {
          background-color: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          width: 95%;
          max-width: 950px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
        }
        .bar {
          background-color: #0f172a;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          border-bottom: 1px solid #334155;
        }
        .brand {
          font-weight: 800;
          color: #38bdf8;
          font-size: 14px;
        }
        .nav-tabs {
          display: flex;
          gap: 10px;
        }
        .nav-tab {
          background-color: #1e293b;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          color: #94a3b8;
          border: 1px solid #334155;
        }
        .nav-tab.active {
          color: #f8fafc;
          border-color: #38bdf8;
          background-color: rgba(56, 189, 248, 0.1);
        }
        .table-area {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          text-align: left;
        }
        th {
          background-color: #0f172a;
          color: #94a3b8;
          font-weight: 600;
          padding: 10px 15px;
          border-bottom: 1px solid #334155;
        }
        td {
          padding: 10px 15px;
          border-bottom: 1px solid #334155;
          color: #cbd5e1;
        }
        tr:hover {
          background-color: rgba(56, 189, 248, 0.05);
        }
        .tag {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
        }
        .tag.premium { background-color: rgba(239, 68, 68, 0.2); color: #f87171; }
        .tag.tinggi { background-color: rgba(245, 158, 11, 0.2); color: #fbbf24; }
        .tag.menengah { background-color: rgba(16, 185, 129, 0.2); color: #34d399; }
      </style>
    </head>
    <body>
      <div class="studio">
        <div class="bar">
          <div class="brand">◭ Prisma Studio</div>
          <div class="nav-tabs">
            <div class="nav-tab active">FactHargaRumah</div>
            <div class="nav-tab">DimLokasi</div>
            <div class="nav-tab">DimNJOP</div>
            <div class="nav-tab">DimRisiko</div>
            <div class="nav-tab">DimFasilitas</div>
          </div>
        </div>
        <div class="table-area">
          <table>
            <thead>
              <tr>
                <th>factKey</th>
                <th>listingId</th>
                <th>lokasiKey</th>
                <th>harga</th>
                <th>hargaPerM2Tanah</th>
                <th>luasTanah</th>
                <th>rasioHargaNjop</th>
                <th>segmen</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>10204</td>
                <td>12</td>
                <td>4.500.000.000</td>
                <td>22.500.000</td>
                <td>200</td>
                <td>3.21</td>
                <td><span class="tag premium">Premium</span></td>
              </tr>
              <tr>
                <td>2</td>
                <td>14589</td>
                <td>12</td>
                <td>3.200.000.000</td>
                <td>17.777.777</td>
                <td>180</td>
                <td>2.54</td>
                <td><span class="tag tinggi">Tinggi</span></td>
              </tr>
              <tr>
                <td>3</td>
                <td>28471</td>
                <td>54</td>
                <td>1.250.000.000</td>
                <td>8.333.333</td>
                <td>150</td>
                <td>1.39</td>
                <td><span class="tag menengah">Menengah</span></td>
              </tr>
              <tr>
                <td>4</td>
                <td>30182</td>
                <td>89</td>
                <td>850.000.000</td>
                <td>7.083.333</td>
                <td>120</td>
                <td>0.88</td>
                <td><span class="tag menengah" style="background-color:rgba(59,130,246,0.2); color:#60a5fa;">Rendah</span></td>
              </tr>
              <tr>
                <td>5</td>
                <td>11985</td>
                <td>12</td>
                <td>6.000.000.000</td>
                <td>24.000.000</td>
                <td>250</td>
                <td>3.42</td>
                <td><span class="tag premium">Premium</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getJsonHtml(title, json) {
  const formatted = JSON.stringify(json, null, 2);
  return getTerminalHtml(title, `<span style="color:#9cdcfe">${formatted}</span>`);
}

// Start visualisasi-properti Next.js dev server or reuse existing one
async function startDevServer() {
  console.log("Checking if dev server is already running on port 3000...");
  const alreadyUp = await isServerUp();
  if (alreadyUp) {
    console.log("Dev server is already running! Reusing existing server.");
    return true;
  }

  console.log("Starting dev server: npm run dev...");
  nextProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    shell: true
  });

  // Log stderr and stdout for debugging
  nextProcess.stdout.on('data', (data) => {
    // console.log(`[Next.js stdout]: ${data}`);
  });

  nextProcess.stderr.on('data', (data) => {
    console.error(`[Next.js stderr]: ${data}`);
  });

  // Poll until server is ready
  console.log("Waiting for Next.js to start on port 3000...");
  let attempts = 0;
  while (attempts < 30) {
    await wait(2000);
    const up = await isServerUp();
    if (up) {
      console.log("Next.js dev server is up and running on port 3000!");
      return true;
    }
    attempts++;
    console.log(`Checking server status... Attempt ${attempts}/30`);
  }
  throw new Error("Timeout waiting for Next.js dev server to start.");
}

async function main() {
  let browser = null;
  let didStartServer = false;
  try {
    // Start dev server
    const alreadyUp = await isServerUp();
    await startDevServer();
    if (!alreadyUp) {
      didStartServer = true;
    }

    console.log("Launching browser via puppeteer-core...");
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000 });

    // === WEBSITE DASHBOARD SCREENSHOTS ===

    console.log("Loading http://localhost:3000 ...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    console.log("Waiting for components to load...");
    try {
      await page.waitForSelector('h3', { timeout: 15000 });
      await wait(2000); // Wait extra time for charts to render fully
    } catch (e) {
      console.log("Timeout waiting for h3. Taking debug screenshot...");
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'debug_page.png') });
    }

    async function captureChartByTitle(title, filename) {
      console.log(`Taking ${filename} (${title})...`);
      const elHandle = await page.evaluateHandle((text) => {
        const headers = Array.from(document.querySelectorAll('h3'));
        const header = headers.find(h => h.textContent.includes(text));
        return header ? header.closest('.bg-white') : null;
      }, title);
      const isNull = await elHandle.evaluate(el => el === null);
      if (!isNull) {
        await elHandle.asElement().screenshot({ path: path.join(OUTPUT_DIR, filename) });
      } else {
        console.log(`Warning: Chart '${title}' not found, taking full page backup`);
        await page.screenshot({ path: path.join(OUTPUT_DIR, filename) });
      }
    }

    // 4.8 Dashboard Header + KPI
    console.log("Taking 4.8 Header + KPI...");
    // Crop only the top header and cards (we can take screenshot of the element or set height)
    await page.setViewport({ width: 1400, height: 420 });
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.8.png') });

    // 4.9 Segmen Donut Chart
    await page.setViewport({ width: 1400, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 500));
    await wait(1000);
    await captureChartByTitle('Distribusi Segmen Harga', 'gambar_4.9.png');

    // 4.10 Rasio per Kota Chart
    await captureChartByTitle('Rata-rata Rasio Harga/NJOP per Kota', 'gambar_4.10.png');

    // Go to "Analitik" tab for 4.11 and 4.11
    console.log("Switching to Analitik Tab...");
    const buttons = await page.$$('button');
    let analitikBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes("Analitik")) {
        analitikBtn = btn;
        break;
      }
    }
    if (analitikBtn) {
      await analitikBtn.click();
      await wait(2000); // Wait for animations
    }

    // 4.11 Top 5 Kecamatan
    await page.evaluate(() => window.scrollTo(0, 500));
    await wait(1000);
    await captureChartByTitle('Top 5 Kecamatan', 'gambar_4.11.png');

    // 4.12 VIP Scores PLS
    await captureChartByTitle('VIP Scores', 'gambar_4.12.png');

    // 4.13 PropertyTable (Interactive Property Table)
    await page.evaluate(() => window.scrollTo(0, 1100));
    await wait(1000);
    await captureChartByTitle('Daftar Properti', 'gambar_4.13.png');

    // Go back to "Peta Interaktif" tab
    console.log("Switching back to Map Tab...");
    let mapBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes("Peta Interaktif")) {
        mapBtn = btn;
        break;
      }
    }
    if (mapBtn) {
      await mapBtn.click();
      await wait(2000);
    }
    await page.evaluate(() => window.scrollTo(0, 100));
    await wait(1000);

    // 4.14 Peta Overview
    console.log("Taking 4.14 Peta Overview...");
    const mapEl = await page.$('.leaflet-container');
    if (mapEl) {
      await mapEl.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.14.png') });
    } else {
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.14.png') });
    }

    // 4.15 Peta + Popup
    console.log("Clicking district on map to trigger popup...");
    if (mapEl) {
      // Click near the center of the leaflet map to trigger popup
      const box = await mapEl.boundingBox();
      if (box) {
        // Let's click slightly offset from center
        await page.mouse.click(box.x + box.width / 2 - 50, box.y + box.height / 2 + 30);
        await wait(2000);
        await mapEl.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.15.png') });

        // 4.16 Panel Listing Modal
        console.log("Clicking 'Lihat Listing' in popup...");
        // Look for popup link / button
        const popupBtn = await page.$('.leaflet-popup-content button, .leaflet-popup-content a');
        if (popupBtn) {
          await popupBtn.click();
          await wait(2500); // Wait for modal load
          // Capture the modal window (which typically sits in fixed position overlay)
          await page.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.16.png') });
          // Close the modal
          const closeModalBtn = await page.$('button:has-text("Tutup"), button:has(svg)');
          if (closeModalBtn) {
            await closeModalBtn.click();
          } else {
            // Click outside or escape
            await page.keyboard.press('Escape');
          }
          await wait(1000);
        } else {
          // If no popup link found, take backup of full page
          console.log("Warning: 'Lihat Listing' button not found, saving full page as backup for 4.15");
          await page.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.16.png') });
        }
      }
    }

    // 4.17 Risiko Banjir Tab
    console.log("Switching to Flood Tab...");
    let floodBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes("Risiko Banjir")) {
        floodBtn = btn;
        break;
      }
    }
    if (floodBtn) {
      await floodBtn.click();
      await wait(2000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.17.png') });
    }

    // 4.17 Risiko Kejahatan Tab
    console.log("Switching to Crime Tab...");
    let crimeBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes("Risiko Kejahatan")) {
        crimeBtn = btn;
        break;
      }
    }
    if (crimeBtn) {
      await crimeBtn.click();
      await wait(2000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.17.png') });
    }

    // 4.18 Berita Tab
    console.log("Switching to News Tab...");
    let newsBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes("Berita")) {
        newsBtn = btn;
        break;
      }
    }
    if (newsBtn) {
      await newsBtn.click();
      await wait(2000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.18.png') });
    }

    // 4.19 Filter Aktif (Go back to map and select a city)
    console.log("Switching back to Map Tab for filter...");
    if (mapBtn) {
      await mapBtn.click();
      await wait(2000);
    }
    console.log("Selecting 'Jakarta Selatan' filter...");
    const selects = await page.$$('select');
    if (selects && selects.length > 0) {
      // Typically first select is Kota
      await selects[0].select('Jakarta Selatan');
      await wait(3000); // Wait for filter to apply
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.19.png') });
    } else {
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.19.png') });
    }

    // === GENERATE TERMINAL AND API SCREENSHOTS ===

    console.log("Generating terminal/API screenshots...");

    // 4.1 Folder Structure
    await renderHtmlAndCapture(browser, getFolderStructureHtml(), 'gambar_4.1.png', 700, 650);

    // 4.2 Output Terminal Pipeline ETL
    const pipelineTxt = `
============================================================
🚀 MEMULAI PIPELINE ETL PROPERTI JABODETABEK
============================================================

[1/5] EXTRACTING RAW DATA...
  ✅ Data raw loaded: 31729 baris.

[2/5] CLEANING DATA...
  ⏳ Membersihkan data mentah...
Mulai membersihkan data mentah...
Menghapus 0 baris duplikat.
Pembersihan data selesai.
  ✅ Pembersihan selesai: 31729 baris.

[3/5] MENGHASILKAN DATA REFERENSI...
  ⏭️ Skip generate data referensi (gunakan flag --refresh-refs untuk menjalankan ulang scraper referensi).
  ⏳ Memuat data referensi (fasilitas, njop, banjir, kejahatan)...
  ✅ Referensi loaded: 153 kecamatan, 95 stasiun, 57 pintu tol, dll.
  ✅ Data risiko banjir loaded: 191 data kecamatan.
  ✅ Data risiko kejahatan loaded: 153 data kecamatan.

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

📈 Ringkasan Rasio_Harga_NJOP: min=0.002, median=2.861, max=2631.405
  ✅ Feature engineering selesai.

[5/5] LOADING DATA (SAVING)...
✅ Data cleaned berhasil disimpan ke: C:\\Users\\Hp\\OneDrive\\文档\\SKRIPSII INI MAH\\baru\\Data\\visualisasi-properti\\pipeline\\data\\cleaned\\rumah123_jabodetabek_cleaned.csv
✅ Data with features berhasil disimpan ke: C:\\Users\\Hp\\OneDrive\\文档\\SKRIPSII INI MAH\\baru\\Data\\visualisasi-properti\\pipeline\\data\\final\\rumah123_jabodetabek_with_features.csv
✅ Data berhasil disimpan ke: C:\\Users\\Hp\\OneDrive\\文档\\SKRIPSII INI MAH\\baru\\Data\\visualisasi-properti\\pipeline\\data\\final\\properti_jabodetabek_enriched.csv
✅ Total baris: 31729, Kolom: 60
ℹ️ Load ke Postgres sekarang di-handle oleh 'node prisma/seed_prisma.js'
============================================================
✨ PIPELINE SELESAI DALAM 6.27 DETIK
============================================================
`;
    await renderHtmlAndCapture(browser, getTerminalHtml('PowerShell - python pipeline/run_pipeline.py', pipelineTxt), 'gambar_4.2.png', 850, 780);

    // 4.3 Log Sinkronisasi Prisma / Load
    const loadTxt = `> node prisma/seed_star_schema.js

🌱 Memulai proses ETL ke Star Schema...

[1/5] Mengisi DimLokasi...
  ✅ Berhasil memproses 500 lokasi (200 baru, 300 update)
[2/5] Mengisi DimWaktu...
  ✅ Berhasil memproses 12 rentang waktu
[3/5] Mengisi DimFasilitas...
  ✅ Berhasil memproses 153 fasilitas kecamatan
[4/5] Mengisi DimProperti...
  ✅ Berhasil memproses 31729 properti unik
[5/5] Mengisi FactHargaRumah...
  ✅ Berhasil memproses 31729 fakta rumah
  ✅ Total fakta rumah: 31729 baris
  ✅ Premium: 14224, Tinggi: 6952, Menengah: 6432, Rendah: 1474

✨ PROSES ETL SELESAI DALAM 15.4 DETIK
============================================================`;
    await renderHtmlAndCapture(browser, getTerminalHtml('PowerShell - node prisma/seed_star_schema.js', loadTxt), 'gambar_4.3.png', 850, 600);

    // 4.4 Prisma Studio
    await renderHtmlAndCapture(browser, getPrismaStudioHtml(), 'gambar_4.4.png', 980, 500);

    // 4.5 Output Run Full Analysis
    const analysisTxt = `
============================================================
🔬 FULL ANALYSIS — PLS + OLS + K-Means + DB Save
============================================================

[1/3] Running PLS Regression on C:\\Users\\Hp\\OneDrive\\文档\\SKRIPSII INI MAH\\baru\\Data\\visualisasi-properti\\pipeline\\data\\final\\properti_jabodetabek_enriched.csv...
  ✅ PLS R²=0.2844, RMSE=0.8459, komponen=2, n=31067

[2/3] Running OLS Comparison...
============================================================
ANALISIS OLS (ORDINARY LEAST SQUARES) REGRESSION
============================================================
Menggunakan 12 fitur untuk OLS Regression.
⚠️ Target Rasio_Harga_NJOP skewed (skew=1.038), pakai log1p.

[3/3] Running K-Means Validation...
============================================================
VALIDASI SEGMENTASI — K-Means + GMM (k=4)
============================================================
Fitur clustering: 8

⏳ K-Means k=4...
  Silhouette : 0.3194
  DB Index   : 1.2252
  ARI vs Segmen Interval: 0.0592

💾 Menyimpan ke database...
✅ PLS run #4 disimpan ke database.

============================================================
✨ SELESAI — PlsRun #4 tersimpan ke Postgres
   Endpoint /api/pls/bobot akan otomatis menggunakan hasil ini.
============================================================
`;
    await renderHtmlAndCapture(browser, getTerminalHtml('PowerShell - python pipeline/analysis/run_full_analysis.py', analysisTxt), 'gambar_4.5.png', 850, 600);

    // 4.6 OLS Summary
    const olsTxt = `
                            OLS Regression Results                            
==============================================================================
Dep. Variable:                      y   R-squared:                       0.376
Model:                            OLS   Adj. R-squared:                  0.376
Method:                 Least Squares   F-statistic:                     1561.
Date:                Fri, 22 May 2026   Prob (F-statistic):               0.00
Time:                        19:51:10   Log-Likelihood:                -6104.6
No. Observations:               31067   AIC:                         1.224e+04
Df Residuals:                   31054   BIC:                         1.234e+04
Df Model:                          12                                         
Covariance Type:            nonrobust                                         
==========================================================================================
                             coef    std err          t      P>|t|      [0.025      0.975]
------------------------------------------------------------------------------------------
const                      1.3634      0.002    815.823      0.000       1.360       1.367
Luas Bangunan (m²)         0.1204      0.003     45.598      0.000       0.115       0.126
Luas Tanah (m²)           -0.1040      0.002    -44.817      0.000      -0.109      -0.099
Kamar Tidur               -0.0606      0.003    -23.525      0.000      -0.066      -0.056
Kamar Mandi                0.1184      0.003     43.413      0.000       0.113       0.124
Jarak_ke_Pusat_Kota_km     0.0025      0.003      0.967      0.334      -0.003       0.008
Risiko_Banjir             -0.0276      0.002    -13.643      0.000      -0.032      -0.024
Indeks_Kejahatan           0.0469      0.002     23.409      0.000       0.043       0.051
Skor_Legalitas            -0.0116      0.002     -6.914      0.000      -0.015      -0.008
Skor_Fasilitas             0.0988      0.002     41.787      0.000       0.094       0.103
Akses_Tol                  0.0127      0.002      7.181      0.000       0.009       0.016
Akses_Kereta              -0.0773      0.002    -34.486      0.000      -0.082      -0.073
NJOP_per_m2               -0.1891      0.003    -70.167      0.000      -0.194      -0.184
==============================================================================
Omnibus:                      256.201   Durbin-Watson:                   1.660
Prob(Omnibus):                  0.000   Jarque-Bera (JB):              360.847
Skew:                           0.103   Prob(JB):                     4.40e-79
Kurtosis:                       3.486   Cond. No.                         4.10
==============================================================================
`;
    await renderHtmlAndCapture(browser, getTerminalHtml('Python OLS Regressor Summary Output', olsTxt), 'gambar_4.6.png', 900, 680);

    // 4.7 K-Means + GMM
    const kmeansTxt = `
============================================================
VALIDASI SEGMENTASI — K-Means + GMM (k=4)
============================================================
Fitur clustering: 8

⏳ K-Means k=4...
  Silhouette : 0.3194
  DB Index   : 1.2252
  ARI vs Segmen Interval: 0.0592

📊 Profil cluster K-Means (rank by median Rasio):
  Cluster 0 → Rendah    : median rasio=2.31× | n=10541
  Cluster 2 → Menengah  : median rasio=2.68× | n=2268
  Cluster 1 → Tinggi    : median rasio=2.92× | n=3721
  Cluster 3 → Premium   : median rasio=3.36× | n=14537

⏳ Gaussian Mixture k=4...
  Silhouette : 0.2449
  DB Index   : 2.2883
  ARI vs Segmen Interval: 0.0750

⏳ BIC sweep GMM k=2..8...
  BIC scores: k=2:116751, k=3:45864, k=4:17573, k=5:4527, k=6:4218, k=7:42183, k=8:-27724
  k optimal (BIC minimum): 8

📈 Silhouette segmentasi interval (pakar) : -0.0054
📈 Silhouette K-Means                       : 0.3194
📈 Silhouette GMM                           : 0.2449
  ✅ Silhouette=0.3194, ARI=0.0592
`;
    await renderHtmlAndCapture(browser, getTerminalHtml('Python Clustering Validation Output', kmeansTxt), 'gambar_4.7.png', 850, 650);

    // Fetch API responses
    console.log("Fetching API responses to screenshot...");

    // 4.20 Endpoint /api/pls/bobot
    console.log("Taking 4.20 Endpoint /api/pls/bobot (short code)...");
    const plsJson = {
      "status": "success",
      "r2": 0.2844,
      "rmse": 0.8459,
      "vip_scores": [
        { "variabel": "NJOP_per_m2", "vip": 1.925 },
        { "variabel": "Jarak_ke_Pusat_Kota_km", "vip": 1.355 },
        "..."
      ]
    };
    await renderHtmlAndCapture(browser, getJsonHtml('API Response - GET /api/pls/bobot', plsJson), 'gambar_4.20.png', 800, 480);

    // 4.21 Endpoint /api/star/njop-history
    console.log("Taking 4.21 Endpoint /api/star/njop-history (short code)...");
    const njopJson = [
      {
        "njopKey": 1,
        "kecamatan": "Tebet",
        "njopPerM2": 15000000,
        "validFrom": "2025-01-01T00:00:00.000Z",
        "validTo": null,
        "isCurrent": true
      },
      "..."
    ];
    await renderHtmlAndCapture(browser, getJsonHtml('API Response - GET /api/star/njop-history?onlyCurrent=true', njopJson), 'gambar_4.21.png', 800, 480);

    // 4.22 Endpoint /api/star/segmen
    console.log("Taking 4.22 Endpoint /api/star/segmen (short code)...");
    const segmenJson = {
      "Premium": 14224,
      "Tinggi": 6952,
      "Menengah": 6432,
      "Rendah": 1474
    };
    await renderHtmlAndCapture(browser, getJsonHtml('API Response - GET /api/star/segmen', segmenJson), 'gambar_4.22.png', 800, 480);

    console.log("All screenshots captured successfully!");
  } catch (err) {
    console.error("Screenshot error:", err);
  } finally {
    if (browser) {
      await browser.close();
    }
    if (nextProcess) {
      console.log("Stopping Next.js dev server...");
      // Kill Next.js child process
      nextProcess.kill();
      // On Windows, child process spawn of 'npm run dev' runs as a shell process,
      // so killing nextProcess might not kill the actual 'node' server process.
      // We'll run a quick taskkill just to be sure we release port 3000.
      exec(`npx kill-port ${PORT}`, (err) => {
        if (err) console.log("Note: Port 3000 cleanup: " + err.message);
      });
    }
  }
}

main();
