import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TransactionType } from '@prisma/client';

// Define the structure for monthly breakdown
interface MonthlyData {
  income: number;
  expense: number;
}

// Define the main structure for each member's stats
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
    // 1. Fetch ALL transactions linked to a member, not just income
    const transactions = await prisma.transaction.findMany({
      where: {
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

    // 2. Process transactions to group by member and then by month, separating income and expense
    const statsByMember = new Map<string, MemberStat>();

    for (const t of transactions) {
      if (!t.member) continue;

      const memberId = t.memberId!;
      const monthKey = format(t.date, 'MMM yyyy', { locale: es });

      // Initialize member stat if not present
      if (!statsByMember.has(memberId)) {
        statsByMember.set(memberId, {
          memberName: t.member.name,
          totalIncome: 0,
          totalExpense: 0,
          monthly: new Map(),
        });
      }
      const memberStat = statsByMember.get(memberId)!;

      // Initialize monthly data if not present
      if (!memberStat.monthly.has(monthKey)) {
        memberStat.monthly.set(monthKey, { income: 0, expense: 0 });
      }
      const monthlyData = memberStat.monthly.get(monthKey)!;
      
      // Update totals based on transaction type
      if (t.type === TransactionType.income) {
        memberStat.totalIncome += t.amount;
        monthlyData.income += t.amount;
      } else {
        memberStat.totalExpense += t.amount;
        monthlyData.expense += t.amount;
      }
    }
    
    // 3. Convert the Maps to a serializable array for the JSON response
    const result = Array.from(statsByMember.entries()).map(([memberId, data]) => {
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
        totalIncome: data.totalIncome,
        totalExpense: data.totalExpense,
        netBalance: data.totalIncome - data.totalExpense,
        monthlyBreakdown: sortedMonthly.map(([month, totals]) => ({ 
          month, 
          income: totals.income,
          expense: totals.expense 
        })),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
