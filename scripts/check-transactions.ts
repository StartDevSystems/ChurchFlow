import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' }
  });

  console.log('--- LISTADO DE TRANSACCIONES ---');
  transactions.forEach(t => {
    console.log(`ID: ${t.id} | Tipo: ${t.type} | Monto: ${t.amount} | Desc: ${t.description} | EventoID: ${t.eventId}`);
  });
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); })