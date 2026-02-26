import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDuplicatesFinal() {
  console.log('🚀 Iniciando limpieza DEFINITIVA de duplicados...');

  // 1. Obtener todas las transacciones ordenadas por creación
  const allTx = await prisma.transaction.findMany({
    orderBy: { createdAt: 'asc' }
  });

  const seen = new Set();
  const toDelete = [];

  for (const tx of allTx) {
    // Criterio de limpieza: Solo descripción (sin importar mayúsculas) y monto.
    // Ignoramos la fecha porque el importador la movió de día por el timezone.
    const cleanDesc = tx.description.trim().toLowerCase();
    const key = `${cleanDesc}|${tx.amount}`;

    if (seen.has(key)) {
      console.log(`❌ Duplicado detectado: [${tx.id}] "${tx.description}" por ${tx.amount}`);
      toDelete.push(tx.id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    console.log(`🧹 Borrando ${toDelete.length} registros basura...`);
    await prisma.transaction.deleteMany({
      where: { id: { in: toDelete } }
    });
    console.log('✅ Base de datos restaurada y limpia.');
  } else {
    console.log('✨ No se encontraron duplicados.');
  }
}

cleanDuplicatesFinal()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
