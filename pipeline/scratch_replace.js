const fs = require('fs');
let code = fs.readFileSync('pipeline/capture_screenshots.js', 'utf-8');

// Replace 4.7 to 4.16 sequentially backwards to avoid collision
code = code.replace(/gambar_4\.16\.png/g, 'gambar_4.17.png');
code = code.replace(/4\.16 /g, '4.17 ');

code = code.replace(/gambar_4\.15\.png/g, 'gambar_4.16.png');
code = code.replace(/4\.15 /g, '4.16 ');

code = code.replace(/gambar_4\.14\.png/g, 'gambar_4.15.png');
code = code.replace(/4\.14 /g, '4.15 ');

code = code.replace(/gambar_4\.13\.png/g, 'gambar_4.14.png');
code = code.replace(/4\.13 /g, '4.14 ');

code = code.replace(/gambar_4\.12\.png/g, 'gambar_4.13.png');
code = code.replace(/4\.12 /g, '4.13 ');

code = code.replace(/gambar_4\.11\.png/g, 'gambar_4.12.png');
code = code.replace(/4\.11 /g, '4.12 ');

code = code.replace(/gambar_4\.10\.png/g, 'gambar_4.11.png');
code = code.replace(/4\.10 /g, '4.11 ');

code = code.replace(/gambar_4\.9\.png/g, 'gambar_4.10.png');
code = code.replace(/4\.9 /g, '4.10 ');

code = code.replace(/gambar_4\.8\.png/g, 'gambar_4.9.png');
code = code.replace(/4\.8 /g, '4.9 ');

code = code.replace(/gambar_4\.7\.png/g, 'gambar_4.8.png');
code = code.replace(/4\.7 /g, '4.8 ');

code = code.replace(/gambar_4\.6\.png/g, 'gambar_4.7.png');
code = code.replace(/4\.6 /g, '4.7 ');

code = code.replace(/gambar_4\.5\.png/g, 'gambar_4.6.png');
code = code.replace(/4\.5 /g, '4.6 ');

code = code.replace(/gambar_4\.4\.png/g, 'gambar_4.5.png');
code = code.replace(/4\.4 /g, '4.5 ');

code = code.replace(/gambar_4\.3\.png/g, 'gambar_4.4.png');
code = code.replace(/4\.3 Prisma/g, '4.4 Prisma');

// Insert 4.3 new load log
const loadLogInsert = `    // 4.3 Log Sinkronisasi Prisma / Load
    const loadTxt = \`> node prisma/seed_star_schema.js

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
============================================================\`;
    await renderHtmlAndCapture(browser, getTerminalHtml('PowerShell - node prisma/seed_star_schema.js', loadTxt), 'gambar_4.3.png', 850, 600);

`;

code = code.replace('    // 4.4 Prisma Studio', loadLogInsert + '    // 4.4 Prisma Studio');

fs.writeFileSync('pipeline/capture_screenshots.js', code);
console.log('Successfully updated capture_screenshots.js');
