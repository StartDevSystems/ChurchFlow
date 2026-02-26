import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDates() {
  const transactions = await prisma.transaction.findMany();
  transactions.forEach(t => {
    console.log(`ID: ${t.id} | Desc: ${t.description} | Date: ${t.date.toISOString()} | Amount: ${t.amount}`);
  });
}

debugDates()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); })