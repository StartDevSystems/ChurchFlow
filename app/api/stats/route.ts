import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TransactionType } from '@prisma/client';

interface MonthlyData {
  income: number;
  expense: number;
}

interface MemberStat {
  memberName: string;
  totalIncome: number;
  totalExpense: number;
  monthly: Map<string, MonthlyData>;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        memberId: { not: null },
      },
      include: {
        member: {
          select: { name: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    const statsByMember = new Map<string, MemberStat>();

    for (const t of transactions) {
      if (!t.member) continue;

      const memberId   = t.memberId!;
      const monthKey   = format(t.date, 'MMM yyyy', { locale: es });

      if (!statsByMember.has(memberId)) {
        statsByMember.set(memberId, {
          memberName:   t.member.name,
          totalIncome:  0,
          totalExpense: 0,
          monthly:      new Map(),
        });
      }

      const memberStat = statsByMember.get(memberId)!;

      if (!memberStat.monthly.has(monthKey)) {
        memberStat.monthly.set(monthKey, { income: 0, expense: 0 });
      }

      const monthlyData = memberStat.monthly.get(monthKey)!;

      if (t.type === TransactionType.income) {
        memberStat.totalIncome  += t.amount;
        monthlyData.income      += t.amount;
      } else {
        memberStat.totalExpense += t.amount;
        monthlyData.expense     += t.amount;
      }
    }

    // Map month abbreviations → index for sorting
    const monthNameMap: Record<string, number> = {
      ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
      jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
    };

    const result = Array.from(statsByMember.entries()).map(([memberId, data]) => {
      const sortedMonthly = Array.from(data.monthly.entries()).sort((a, b) => {
        const [mA, yA] = a[0].split(' ');
        const [mB, yB] = b[0].split(' ');
        const dA = new Date(parseInt(yA), monthNameMap[mA.toLowerCase().replace('.', '')] ?? 0, 1);
        const dB = new Date(parseInt(yB), monthNameMap[mB.toLowerCase().replace('.', '')] ?? 0, 1);
        return dA.getTime() - dB.getTime();
      });

      return {
        memberId,
        memberName:       data.memberName,
        totalIncome:      data.totalIncome,
        totalExpense:     data.totalExpense,
        netBalance:       data.totalIncome - data.totalExpense,
        monthlyBreakdown: sortedMonthly.map(([month, totals]) => ({
          month,
          income:  totals.income,
          expense: totals.expense,
        })),
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('[GET /api/stats]', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}