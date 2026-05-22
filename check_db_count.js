const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const listingsCount = await prisma.listing.count();
    const factCount = await prisma.factHargaRumah.count();
    const locationsCount = await prisma.dimLokasi.count();
    const njopCount = await prisma.dimNJOP.count();
    const plsRunCount = await prisma.plsRun.count();
    
    console.log({
      listingsCount,
      factCount,
      locationsCount,
      njopCount,
      plsRunCount
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
