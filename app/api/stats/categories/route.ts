import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const categories = await prisma.category.findMany({
      include: {
        transactions: true,
      },
    });

    const breakdown = categories
      .map(cat => ({
        name:  cat.name,
        type:  cat.type,   // 'income' | 'expense'
        value: cat.transactions.reduce((sum, t) => sum + t.amount, 0),
      }))
      .filter(c => c.value > 0);

    return NextResponse.json(breakdown);

  } catch (error) {
    console.error('[GET /api/stats/categories]', error);
    return NextResponse.json({ error: 'Failed to fetch category stats' }, { status: 500 });
  }
}