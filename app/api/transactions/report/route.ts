import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { TransactionType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/* ─────────────────────────────────────────────────────────
   Helper — shared query logic for both GET and POST
───────────────────────────────────────────────────────── */
async function buildReport(
  startDate: string,
  endDate: string,
  categoryId?: string | null,
  type?: string | null,
) {
  const where: any = {
    date: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
  };

  if (categoryId) where.categoryId = categoryId;
  if (type === 'income' || type === 'expense') where.type = type as TransactionType;

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { date: 'asc' },
  });

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.income)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.expense)
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Category breakdown
  const categoryMap: Record<string, { name: string; total: number; type: string }> = {};
  for (const t of transactions) {
    const key = t.category?.name ?? 'Sin categoría';
    if (!categoryMap[key]) {
      categoryMap[key] = { name: key, total: 0, type: t.type };
    }
    categoryMap[key].total += t.amount;
  }
  const categories = Object.values(categoryMap);

  // Monthly trend data (group by YYYY-MM)
  const trendMap: Record<string, { month: string; income: number; expense: number }> = {};
  for (const t of transactions) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    if (!trendMap[key]) trendMap[key] = { month: key, income: 0, expense: 0 };
    if (t.type === TransactionType.income) trendMap[key].income += t.amount;
    else trendMap[key].expense += t.amount;
  }
  const trend = Object.values(trendMap).sort((a, b) => a.month.localeCompare(b.month));

  // Caja del período (transactions without event in this range)
  const cajaTransactions = transactions.filter(t => !t.eventId);
  const cajaIncome = cajaTransactions.filter(t => t.type === TransactionType.income).reduce((a, t) => a + t.amount, 0);
  const cajaExpense = cajaTransactions.filter(t => t.type === TransactionType.expense).reduce((a, t) => a + t.amount, 0);

  // Desglose por categoría SOLO de caja (para el mensaje de WhatsApp)
  const cajaCatMap: Record<string, { name: string; total: number; type: string }> = {};
  for (const t of cajaTransactions) {
    const key = `${t.category?.name ?? 'Sin categoría'}-${t.type}`;
    if (!cajaCatMap[key]) {
      cajaCatMap[key] = { name: t.category?.name ?? 'Sin categoría', total: 0, type: t.type };
    }
    cajaCatMap[key].total += t.amount;
  }
  const cajaCategories = Object.values(cajaCatMap);

  // Transferencias del período (para que la matemática cuadre en el reporte)
  const periodTransfers = await prisma.transfer.findMany({
    where: {
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
  });
  const periodCajaTransfers = periodTransfers.reduce((acc, tr) => {
    if (!tr.fromEventId) return acc - tr.amount; // sale de caja
    if (!tr.toEventId) return acc + tr.amount;   // entra a caja
    return acc;
  }, 0);

  // Saldo REAL de caja (histórico: todas las transacciones + transferencias)
  const allCajaTx = await prisma.transaction.findMany({ where: { eventId: null } });
  const allCajaIncome = allCajaTx.filter(t => t.type === TransactionType.income).reduce((a, t) => a + t.amount, 0);
  const allCajaExpense = allCajaTx.filter(t => t.type === TransactionType.expense).reduce((a, t) => a + t.amount, 0);
  const allTransfers = await prisma.transfer.findMany();
  const netCajaTransfers = allTransfers.reduce((acc, tr) => {
    if (!tr.fromEventId) return acc - tr.amount; // sale de caja
    if (!tr.toEventId) return acc + tr.amount;   // entra a caja
    return acc;
  }, 0);
  const cajaRealBalance = allCajaIncome - allCajaExpense + netCajaTransfers;

  // Activities breakdown (events with transactions in this period)
  const eventIds = Array.from(new Set(transactions.filter(t => t.eventId).map(t => t.eventId!)));
  const eventsData = eventIds.length > 0
    ? await prisma.event.findMany({ where: { id: { in: eventIds } } })
    : [];

  const activities = eventsData.map(ev => {
    const evTx = transactions.filter(t => t.eventId === ev.id);
    const income = evTx.filter(t => t.type === TransactionType.income).reduce((a, t) => a + t.amount, 0);
    const expense = evTx.filter(t => t.type === TransactionType.expense).reduce((a, t) => a + t.amount, 0);
    return {
      id: ev.id,
      name: ev.name,
      type: ev.type,       // EVENTO | VENTA
      status: ev.status,   // ACTIVO | FINALIZADO
      startDate: ev.startDate,
      endDate: ev.endDate,
      investment: ev.investment,
      salesGoal: ev.salesGoal,
      income,
      expense,
      profit: income - expense,
      txCount: evTx.length,
    };
  });

  return {
    transactions,
    categories,
    trend,
    activities,
    caja: { income: cajaIncome, expense: cajaExpense, transfers: periodCajaTransfers, balance: cajaRealBalance, categories: cajaCategories },
    summary: { totalIncome, totalExpense, netBalance },
  };
}

/* ─────────────────────────────────────────────────────────
   Previous period comparison helper
───────────────────────────────────────────────────────── */
async function buildPreviousPeriodSummary(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1); // day before current start
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  const transactions = await prisma.transaction.findMany({
    where: {
      date: { gte: prevStart, lte: prevEnd },
    },
  });

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.income)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.expense)
    .reduce((acc, t) => acc + t.amount, 0);

  return { totalIncome, totalExpense, netBalance: totalIncome - totalExpense };
}

/* ─────────────────────────────────────────────────────────
   GET /api/transactions/report?from=&to=&categoryId=&type=
───────────────────────────────────────────────────────── */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to   = searchParams.get('to');
    const categoryId = searchParams.get('categoryId');
    const type = searchParams.get('type');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Query params "from" and "to" are required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const [report, previousSummary] = await Promise.all([
      buildReport(from, to, categoryId, type),
      buildPreviousPeriodSummary(from, to),
    ]);

    return NextResponse.json({ ...report, previousSummary });

  } catch (error) {
    console.error('[GET /api/transactions/report]', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

/* ─────────────────────────────────────────────────────────
   POST /api/transactions/report
   Body: { startDate, endDate }
───────────────────────────────────────────────────────── */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required in the request body' },
        { status: 400 }
      );
    }

    const [report, previousSummary] = await Promise.all([
      buildReport(startDate, endDate),
      buildPreviousPeriodSummary(startDate, endDate),
    ]);

    return NextResponse.json({ ...report, previousSummary });

  } catch (error) {
    console.error('[POST /api/transactions/report]', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
