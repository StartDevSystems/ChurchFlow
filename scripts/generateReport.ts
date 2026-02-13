import { PrismaClient, TransactionType } from '@prisma/client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function generateReport() {
  // 1. Define reports directory
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // 2. Fetch data for the current month
  const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'asc',
    }
  });

  // 3. Process data
  const totalIncome = transactions
    .filter((t) => t.type === TransactionType.income)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === TransactionType.expense)
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // 4. Generate PDF
  const doc = new jsPDF();
  const today = format(new Date(), 'dd/MM/yyyy');
  const month = format(new Date(), 'MMMM yyyy', { locale: require('date-fns/locale/es') });

  doc.text(`Reporte Mensual de Transacciones - ${month}`, 14, 16);
  doc.setFontSize(10);
  doc.text(`Generado el: ${today}`, 14, 24);
  doc.setFontSize(12);
  doc.text(`Resumen Financiero`, 14, 36);
  doc.setFontSize(10);
  doc.text(`- Ingresos Totales: $${totalIncome.toFixed(2)}`, 14, 44);
  doc.text(`- Gastos Totales: $${totalExpense.toFixed(2)}`, 14, 50);
  doc.text(`- Balance: $${balance.toFixed(2)}`, 14, 56);

  (doc as any).autoTable({
    startY: 64,
    head: [['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto']],
    body: transactions.map(t => [
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.description,
      t.category,
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      `$${t.amount.toFixed(2)}`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74] },
  });

  // 5. Save PDF to reports directory
  const reportPath = path.join(reportsDir, `reporte_${format(new Date(), 'yyyy-MM')}.pdf`);
  doc.save(reportPath);
  
  console.log(`Reporte generado exitosamente en: ${reportPath}`);
}

generateReport()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
