import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'income',
        category: 'Cuota',
        memberId: { not: null },
      },
      include: {
        member: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Process transactions to group by member and then by month
    const statsByMember = new Map<string, { memberName: string; totalContribution: number; monthly: Map<string, number> }>();

    for (const t of transactions) {
      if (!t.member) continue;

      const memberId = t.memberId!;
      const monthKey = format(t.date, 'MMM yyyy', { locale: es });

      if (!statsByMember.has(memberId)) {
        statsByMember.set(memberId, {
          memberName: t.member.name,
          totalContribution: 0,
          monthly: new Map(),
        });
      }

      const memberStat = statsByMember.get(memberId)!;
      memberStat.totalContribution += t.amount;
      memberStat.monthly.set(monthKey, (memberStat.monthly.get(monthKey) || 0) + t.amount);
    }
    
    // Convert the Maps to a serializable array of objects
    const result = Array.from(statsByMember.entries()).map(([memberId, data]) => {
      // Sort monthly contributions chronologically
      const monthNameMap: { [key: string]: number } = {
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
      };
      
      const sortedMonthly = Array.from(data.monthly.entries()).sort((a, b) => {
        const [monthA, yearA] = a[0].split(' ');
        const [monthB, yearB] = b[0].split(' ');
        const dateA = new Date(parseInt(yearA), monthNameMap[monthA.toLowerCase().replace('.','')], 1);
        const dateB = new Date(parseInt(yearB), monthNameMap[monthB.toLowerCase().replace('.','')], 1);
        return dateA.getTime() - dateB.getTime();
      });

      return {
        memberId,
        memberName: data.memberName,
        totalContribution: data.totalContribution,
        monthlyContributions: sortedMonthly.map(([month, total]) => ({ month, total })),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
