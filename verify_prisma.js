const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const f = await p.fasilitas.findFirst({ where: { nama: 'Grand Indonesia' } });
  console.log('Fasilitas:', f.nama, f.lat, f.lng, f.sumber);
  
  const s = await p.stasiun.findFirst({ where: { nama: 'Bogor' } });
  console.log('Stasiun:', s.nama, s.lat, s.lng, s.sumber);
  
  const g = await p.gerbangTol.findFirst({ where: { nama: 'Semanggi' } });
  console.log('GerbangTol:', g.nama, g.lat, g.lng, g.sumber);
  
  const osmF = await p.fasilitas.count({ where: { sumber: 'OpenStreetMap Nominatim' } });
  const manF = await p.fasilitas.count({ where: { sumber: 'Manual fix (Google Maps)' } });
  console.log('\nFasilitas - OSM:', osmF, '| Manual:', manF, '| Total updated:', osmF + manF);
  
  const osmS = await p.stasiun.count({ where: { sumber: 'OpenStreetMap Nominatim' } });
  const manS = await p.stasiun.count({ where: { sumber: 'Manual fix (Google Maps)' } });
  console.log('Stasiun - OSM:', osmS, '| Manual:', manS, '| Total updated:', osmS + manS);
  
  const osmG = await p.gerbangTol.count({ where: { sumber: 'OpenStreetMap Nominatim' } });
  console.log('GerbangTol - OSM:', osmG);
  
  await p.$disconnect();
})();
