import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { TransactionType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required in the request body' }, { status: 400 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const totalIncome = transactions
      .filter((t) => t.type === TransactionType.income)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === TransactionType.expense)
      .reduce((acc, t) => acc + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    return NextResponse.json({
      transactions,
      totalIncome,
      totalExpenses,
      balance,
    });
    
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
