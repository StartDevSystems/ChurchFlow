import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { TransactionType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month'); // YYYY-MM format

    // Parse month range
    let monthStart: Date;
    let monthEnd: Date;
    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number);
      monthStart = new Date(year, month - 1, 1);
      monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Get default due from settings
    const settings = await prisma.settings.findFirst();
    const defaultDue = (settings as any)?.defaultMonthlyDue ?? 200;

    const members = await prisma.member.findMany({
      where: { status: 'ACTIVO' },
      include: {
        transactions: {
          where: {
            type: TransactionType.income,
            category: { name: 'Cuota' },
            date: { gte: monthStart, lte: monthEnd },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const membersWithDues = members.map((member) => {
      const totalContributed = member.transactions.reduce((sum, t) => sum + t.amount, 0);
      const monthlyDue = member.monthlyDue > 0 ? member.monthlyDue : defaultDue;
      return {
        id: member.id,
        name: member.name,
        phone: member.phone,
        role: member.role,
        monthlyDue,
        totalContributed,
        missing: Math.max(0, monthlyDue - totalContributed),
        isComplete: totalContributed >= monthlyDue,
      };
    });

    return NextResponse.json({ members: membersWithDues, defaultDue });
  } catch (error) {
    console.error('Error fetching dues data:', error);
    return NextResponse.json({ error: 'Failed to fetch dues data' }, { status: 500 });
  }
}

// POST /api/dues — bulk assign monthly due to all members
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { amount, memberIds } = await request.json();
    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json({ error: 'Monto invalido' }, { status: 400 });
    }

    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      // Assign to specific members
      await prisma.member.updateMany({
        where: { id: { in: memberIds } },
        data: { monthlyDue: amount },
      });
    } else {
      // Update the default in settings via raw SQL (safe from client regeneration issues)
      await prisma.$executeRaw`UPDATE "Settings" SET "defaultMonthlyDue" = ${amount} WHERE "id" = 'system-settings'`;
      // Update ALL members to the new amount
      await prisma.member.updateMany({
        data: { monthlyDue: amount },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating dues:', error);
    return NextResponse.json({ error: 'Error actualizando cuotas' }, { status: 500 });
  }
}
