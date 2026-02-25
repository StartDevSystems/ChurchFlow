import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { TransactionType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/* ─────────────────────────────────────────────────────────
   Helper — shared query logic for both GET and POST
───────────────────────────────────────────────────────── */
async function buildReport(startDate: string, endDate: string) {
  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      category: true, // include category so frontend can show cat.name
    },
    orderBy: {
      date: 'asc',
    },
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

  return {
    transactions,
    categories,
    summary: {
      totalIncome,
      totalExpense,
      netBalance,
    },
  };
}

/* ─────────────────────────────────────────────────────────
   GET /api/transactions/report?from=YYYY-MM-DD&to=YYYY-MM-DD
   Used by: reports/page.tsx fetchReport() and generatePDF()
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

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Query params "from" and "to" are required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const report = await buildReport(from, to);
    return NextResponse.json(report);

  } catch (error) {
    console.error('[GET /api/transactions/report]', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

/* ─────────────────────────────────────────────────────────
   POST /api/transactions/report
   Body: { startDate: string, endDate: string }
   Preserved for backward compatibility
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

    const report = await buildReport(startDate, endDate);
    return NextResponse.json(report);

  } catch (error) {
    console.error('[POST /api/transactions/report]', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}