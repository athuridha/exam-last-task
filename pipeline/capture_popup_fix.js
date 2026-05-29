/**
 * Capture fix khusus untuk gambar_4.14 (peta + popup) dan gambar_4.15 (modal listing).
 *
 * Strategi:
 *   1. Load dashboard, tunggu peta render
 *   2. Akses Leaflet map instance dari window, cari first GeoJSON polygon layer
 *      yang punya popup, lalu programmatically buka popup di centroid-nya
 *   3. Screenshot map dengan popup terbuka → 4.14
 *   4. Click "Lihat Semua Listing" → screenshot modal → 4.15
 *
 * Cara pakai (asumsi dev server sudah running di :3000):
 *   node pipeline/capture_popup_fix.js
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const HOST = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'gambar');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function isUp() {
  return new Promise((resolve) => {
    const req = http.get(`${HOST}/api/summary`, (res) => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  if (!(await isUp())) {
    console.error('❌ Dev server tidak running di :3000. Jalankan `npm run dev` dulu di terminal lain.');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  console.log('▶ Loading dashboard...');
  await page.goto(HOST, { waitUntil: 'networkidle2', timeout: 90_000 });
  await page.waitForSelector('.leaflet-container', { timeout: 30_000 });
  await wait(4000);

  // === 4.14: Peta dengan popup terbuka ===
  console.log('▶ Opening popup programmatically via Leaflet API...');
  const popupOpened = await page.evaluate(() => {
    // Find Leaflet map instance from DOM
    const containers = Array.from(document.querySelectorAll('.leaflet-container'));
    if (containers.length === 0) return { ok: false, reason: 'no container' };
    const container = containers[0];
    // Leaflet stores _leaflet_id reference; map instance is at container._leaflet_map
    // (atau via L.DomUtil pada versi modern)
    const map = container._leaflet_map ||
                (window.L && window.L.DomEvent && container._leaflet_id !== undefined
                  ? null : null);
    if (!map) {
      // Fallback: scan global registry for map (Leaflet's L.Map._instances tidak ada di public API)
      // Tapi map biasanya bisa diakses lewat container properties
      // Kita coba scan elemen DOM
      return { ok: false, reason: 'cannot access map instance' };
    }
    // Iterate all layers
    let opened = false;
    map.eachLayer((layer) => {
      if (opened) return;
      if (layer.getBounds && layer.getPopup && layer.getPopup()) {
        const center = layer.getBounds().getCenter();
        layer.openPopup(center);
        opened = true;
      }
    });
    return { ok: opened, reason: opened ? 'popup opened' : 'no layer with popup found' };
  });

  let success = false;
  if (popupOpened.ok) {
    success = true;
  } else {
    console.warn(`  ⚠ ${popupOpened.reason}. Trying click-based approach...`);
    // Fallback: scan klik pada banyak posisi sampai popup muncul
    const mapEl = await page.$('.leaflet-container');
    const box = await mapEl.boundingBox();
    if (box) {
      // Try center + radial offsets
      const positions = [];
      for (let r = 0; r < 4; r++) {
        for (let theta = 0; theta < 8; theta++) {
          const angle = (theta * Math.PI * 2) / 8;
          const radius = 50 + r * 80;
          positions.push({
            x: box.width / 2 + radius * Math.cos(angle),
            y: box.height / 2 + radius * Math.sin(angle),
          });
        }
      }
      for (const pos of positions) {
        await page.mouse.click(box.x + pos.x, box.y + pos.y);
        await wait(800);
        const popup = await page.$('.leaflet-popup-content');
        if (popup) { success = true; break; }
      }
    }
  }
  await wait(1500);

  // Capture map (with popup if open)
  const mapEl = await page.$('.leaflet-container');
  await mapEl.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.14.png') });
  console.log(`  💾 gambar_4.14.png ${success ? '(dengan popup)' : '(tanpa popup — fallback)'}`);

  // === 4.15: Panel Listing Modal ===
  if (success) {
    console.log('▶ Clicking "Lihat Semua Listing" button...');
    const clicked = await page.evaluate(() => {
      const btn = document.querySelector('.leaflet-popup-content .listing-btn');
      if (btn) { btn.click(); return true; }
      // Coba selector lain
      const allBtns = Array.from(document.querySelectorAll('.leaflet-popup-content button, .leaflet-popup-content a'));
      const lihat = allBtns.find((b) => /lihat.*listing/i.test(b.textContent));
      if (lihat) { lihat.click(); return true; }
      return false;
    });
    if (clicked) {
      await wait(4500);  // Wait for modal to load listings
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'gambar_4.15.png') });
      console.log('  💾 gambar_4.15.png (modal listing terbuka)');
    } else {
      console.warn('  ⚠ Listing button not found in popup');
    }
  } else {
    console.warn('  ⚠ Skipping 4.15 because popup did not open');
  }

  await browser.close();
  console.log('\n✨ Done.');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
