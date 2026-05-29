/**
 * capture_panduan.js - V4: Uses evaluateHandle + ElementHandle.click()
 * This approach finds elements via DOM then clicks using Puppeteer's 
 * trusted mouse events (not DOM .click())
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'gambar-uji-program');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const save = (name) => path.join(OUTPUT_DIR, name);

function isServerUp() {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/api/summary`, (res) => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.end();
  });
}

// Find element by span text, return the closest button/label, then Puppeteer .click()
async function findAndClick(page, text, tag = 'button') {
  const handle = await page.evaluateHandle((searchText, searchTag) => {
    // Search all spans first for exact text
    const spans = document.querySelectorAll('span');
    for (const span of spans) {
      if (span.textContent.trim() === searchText) {
        const parent = span.closest(searchTag) || span.closest('button') || span.closest('label') || span.parentElement;
        if (parent) return parent;
      }
    }
    // Fallback: search tag elements for includes
    const els = document.querySelectorAll(searchTag);
    for (const el of els) {
      if (el.textContent.trim().includes(searchText)) {
        return el;
      }
    }
    return null;
  }, text, tag);

  const el = handle.asElement();
  if (el) {
    const box = await el.boundingBox();
    if (box) {
      console.log(`    Found "${text}" at (${Math.round(box.x)}, ${Math.round(box.y)}, ${Math.round(box.width)}x${Math.round(box.height)})`);
      await el.click(); // Puppeteer's trusted click!
      return true;
    } else {
      console.log(`    Found "${text}" but no bounding box (not visible)`);
    }
  }
  console.log(`    NOT FOUND: "${text}"`);
  return false;
}

async function main() {
  const up = await isServerUp();
  if (!up) { console.error('Server not running!'); process.exit(1); }

  console.log('Launching Chrome (visible)...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: ['--start-maximized', '--no-sandbox'],
    defaultViewport: { width: 1600, height: 950 },
  });

  const page = await browser.newPage();
  console.log('Loading dashboard...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 120000 });
  await wait(7000);

  // ===== 1. DASHBOARD =====
  console.log('\n--- 1. Dashboard ---');
  await page.screenshot({ path: save('8_dashboard_main.png') });

  // ===== 2. PETA OVERVIEW =====
  console.log('--- 2. Peta overview ---');
  await page.evaluate(() => {
    const m = document.querySelector('div[style*="height: 600px"]');
    if (m) m.scrollIntoView({ block: 'start' });
  });
  await wait(2000);
  await page.screenshot({ path: save('14_peta_overview.png') });

  // ===== 3. OPEN LAYERS PANEL =====
  console.log('--- 3. Open Layers panel ---');
  // Find span with text "Layers" and click its parent button
  const layersOpened = await findAndClick(page, 'Layers', 'button');
  await wait(1500);
  
  // Debug: check if layer options now exist
  const labelCount = await page.evaluate(() => {
    return document.querySelectorAll('label').length;
  });
  console.log(`    Labels in DOM after clicking Layers: ${labelCount}`);
  
  // If labels not found, try scrolling map into view again and clicking differently
  if (labelCount < 3) {
    console.log('    Retrying: finding LAYERS button via absolute positioned div...');
    const retryHandle = await page.evaluateHandle(() => {
      // The layers panel is in .absolute.top-3.right-3 div
      // Find the button inside that div
      const divs = document.querySelectorAll('div');
      for (const div of divs) {
        const style = window.getComputedStyle(div);
        if (style.position === 'absolute' && style.right === '12px' && style.top === '12px') {
          const btn = div.querySelector('button');
          if (btn) return btn;
        }
      }
      // Alternative: find by z-index
      for (const div of divs) {
        if (div.style.zIndex === '1000' || div.className.includes('z-[1000]')) {
          // Check if it's on the right side
          const rect = div.getBoundingClientRect();
          if (rect.right > 1000) { // Right side of screen
            const btn = div.querySelector('button');
            if (btn && btn.textContent.includes('Layers')) return btn;
          }
        }
      }
      return null;
    });
    const retryEl = retryHandle.asElement();
    if (retryEl) {
      console.log('    Found LAYERS button via computed style, clicking...');
      await retryEl.click();
      await wait(1500);
    }
  }
  
  await page.screenshot({ path: save('panduan_layer_control.png') });

  // ===== 4. ENABLE FACILITY LAYERS =====
  console.log('--- 4. Enable facility layers ---');
  
  // Find and click layer labels by looking inside the layer panel
  async function toggleLayer(page, layerName) {
    const handle = await page.evaluateHandle((name) => {
      const labels = document.querySelectorAll('label');
      for (const label of labels) {
        // Check all spans inside this label
        const spans = label.querySelectorAll('span');
        for (const span of spans) {
          if (span.textContent.trim() === name) {
            return label;
          }
        }
      }
      return null;
    }, layerName);
    
    const el = handle.asElement();
    if (el) {
      const box = await el.boundingBox();
      console.log(`    Layer "${layerName}": found at (${Math.round(box?.x||0)}, ${Math.round(box?.y||0)})`);
      await el.click();
      return true;
    }
    console.log(`    Layer "${layerName}": NOT FOUND`);
    return false;
  }

  await toggleLayer(page, 'Mall');
  await wait(500);
  await toggleLayer(page, 'Stasiun');
  await wait(500);
  await toggleLayer(page, 'Gerbang Tol');
  await wait(4000);
  await page.screenshot({ path: save('panduan_layers_fasilitas_aktif.png') });

  // ===== 5. FLOOD LAYER =====
  console.log('--- 5. Flood risk layer ---');
  await toggleLayer(page, 'Mall');
  await wait(300);
  await toggleLayer(page, 'Stasiun');
  await wait(300);
  await toggleLayer(page, 'Gerbang Tol');
  await wait(300);
  await toggleLayer(page, 'Risiko Banjir');
  await wait(3000);
  await page.screenshot({ path: save('panduan_layer_banjir.png') });

  // ===== 6. CRIME LAYER =====
  console.log('--- 6. Crime risk layer ---');
  await toggleLayer(page, 'Risiko Banjir');
  await wait(300);
  await toggleLayer(page, 'Risiko Kejahatan');
  await wait(3000);
  await page.screenshot({ path: save('panduan_layer_kejahatan.png') });
  // Reset
  await toggleLayer(page, 'Risiko Kejahatan');
  await wait(500);

  // ===== 7. REGION FILTER =====
  console.log('--- 7. Region filter ---');
  // Find "Semua Wilayah" button (or with current kota name)
  const regionHandle = await page.evaluateHandle(() => {
    const divs = document.querySelectorAll('div');
    for (const div of divs) {
      if (div.className.includes('z-[1000]')) {
        const rect = div.getBoundingClientRect();
        if (rect.left < 300) { // Left side = region filter
          const btn = div.querySelector('button');
          if (btn) return btn;
        }
      }
    }
    return null;
  });
  const regionEl = regionHandle.asElement();
  if (regionEl) {
    await regionEl.click();
    await wait(1000);
  }
  await page.screenshot({ path: save('panduan_filter_wilayah_peta.png') });
  
  // Select Jakarta Selatan
  console.log('    Selecting Jakarta Selatan...');
  await findAndClick(page, 'Jakarta Selatan', 'button');
  await wait(4000);
  await page.screenshot({ path: save('panduan_peta_jakarta_selatan.png') });

  // ===== 8. POPUP =====
  console.log('--- 8. Kecamatan popup ---');
  // Click a Leaflet polygon
  const polyHandle = await page.evaluateHandle(() => {
    const paths = document.querySelectorAll('.leaflet-interactive');
    return paths.length > 3 ? paths[Math.floor(paths.length / 2)] : null;
  });
  const polyEl = polyHandle.asElement();
  if (polyEl) {
    await polyEl.click();
    await wait(2000);
  }
  await page.screenshot({ path: save('15_peta_popup.png') });

  // ===== 9. LISTING MODAL =====
  console.log('--- 9. Listing modal ---');
  // Find the "Lihat Semua Listing" button/link inside popup
  const listingHandle = await page.evaluateHandle(() => {
    // Check inside leaflet popup content
    const popup = document.querySelector('.leaflet-popup-content');
    if (popup) {
      const btns = popup.querySelectorAll('button, a, span');
      for (const btn of btns) {
        if (btn.textContent.includes('Listing') || btn.textContent.includes('listing')) {
          return btn;
        }
      }
    }
    // Also check globally  
    const allBtns = document.querySelectorAll('button');
    for (const btn of allBtns) {
      if (btn.textContent.includes('Lihat Semua Listing')) return btn;
    }
    return null;
  });
  const listingEl = listingHandle.asElement();
  if (listingEl) {
    console.log('    Found listing button, clicking...');
    await listingEl.click();
    await wait(4000);
    await page.screenshot({ path: save('16_listing_modal.png') });
    // Close
    await page.keyboard.press('Escape');
    await wait(500);
  } else {
    console.log('    Listing button not found in popup');
  }

  // ===== 10. GALERI FOTO =====
  console.log('--- 10. Galeri Foto ---');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(1500);
  const galeriClicked = await findAndClick(page, 'Buka Galeri Foto', 'button');
  if (galeriClicked) {
    await wait(4000);
    await page.screenshot({ path: save('panduan_galeri_properti.png') });
    await page.keyboard.press('Escape');
    await wait(500);
  }

  // ===== 11. FILTER GLOBAL =====
  console.log('--- 11. Filter global ---');
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(500);
  const selects = await page.$$('select');
  if (selects.length > 0) {
    await selects[0].select('Jakarta Selatan');
    await wait(3000);
  }
  await page.screenshot({ path: save('19_filter_aktif.png') });
  if (selects.length > 0) {
    await selects[0].select('');
    await wait(1000);
  }

  // ===== 12-15. ANALITIK TAB =====
  console.log('--- 12. Tab Analitik ---');
  await findAndClick(page, 'Analitik', 'button');
  await wait(3000);
  await page.screenshot({ path: save('panduan_tab_analitik.png') });

  console.log('--- 13. Charts ---');
  await page.evaluate(() => window.scrollBy(0, 550));
  await wait(1500);
  await page.screenshot({ path: save('9_donut_segmen.png') });

  console.log('--- 14. Top5+VIP ---');
  await page.evaluate(() => window.scrollBy(0, 500));
  await wait(1500);
  await page.screenshot({ path: save('panduan_top5_vip.png') });

  console.log('--- 15. Table ---');
  await page.evaluate(() => window.scrollBy(0, 500));
  await wait(1500);
  await page.screenshot({ path: save('13_tabel_properti.png') });

  // ===== 16. RISIKO BANJIR =====
  console.log('--- 16. Tab Risiko Banjir ---');
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(300);
  await findAndClick(page, 'Risiko Banjir', 'button');
  await wait(3000);
  await page.screenshot({ path: save('panduan_tab_risiko_banjir.png') });
  await page.evaluate(() => window.scrollBy(0, 400));
  await wait(1000);
  await page.screenshot({ path: save('panduan_tabel_risiko_banjir.png') });

  // ===== 17. RISIKO KEJAHATAN =====
  console.log('--- 17. Tab Risiko Kejahatan ---');
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(300);
  await findAndClick(page, 'Risiko Kejahatan', 'button');
  await wait(3000);
  await page.screenshot({ path: save('17_risiko_banjir_kejahatan.png') });
  await page.evaluate(() => window.scrollBy(0, 400));
  await wait(1000);
  await page.screenshot({ path: save('panduan_tabel_risiko_kejahatan.png') });

  // ===== 18. BERITA =====
  console.log('--- 18. Tab Berita ---');
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(300);
  await findAndClick(page, 'Berita', 'button');
  await wait(3000);
  await page.screenshot({ path: save('18_panel_berita.png') });

  console.log('    Berita Kejahatan subtab...');
  await findAndClick(page, 'Berita Kejahatan', 'button');
  await wait(2000);
  await page.screenshot({ path: save('panduan_berita_kejahatan.png') });

  console.log('    Expanding article...');
  await findAndClick(page, 'Lihat Isi Berita', 'button');
  await wait(4000);
  await page.screenshot({ path: save('panduan_berita_expand.png') });

  // ===== 20. GRAFIK BAWAH PETA =====
  console.log('--- 20. Grafik bawah peta ---');
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(300);
  await findAndClick(page, 'Peta Interaktif', 'button');
  await wait(4000);
  await page.evaluate(() => window.scrollBy(0, 900));
  await wait(1500);
  await page.screenshot({ path: save('panduan_grafik_bawah_peta.png') });

  console.log('\n=== DONE ===');
  const all = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
  console.log(`Total: ${all.length} images`);
  
  await browser.close();
}

main().catch(err => { console.error('ERROR:', err); process.exit(1); });
