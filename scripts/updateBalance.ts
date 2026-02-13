import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateBalance() {
  const totalIncomeResult = await prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      type: 'income',
    },
  });

  const totalExpenseResult = await prisma.transaction.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      type: 'expense',
    },
  });

  const totalIncome = totalIncomeResult._sum.amount ?? 0;
  const totalExpense = totalExpenseResult._sum.amount ?? 0;
  const currentBalance = totalIncome - totalExpense;

  console.log('Balance actualizado:');
  console.log(`- Ingresos Totales: $${totalIncome.toFixed(2)}`);
  console.log(`- Gastos Totales: $${totalExpense.toFixed(2)}`);
  console.log(`- Balance Actual: $${currentBalance.toFixed(2)}`);
}

updateBalance()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
