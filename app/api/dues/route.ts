import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { TransactionType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const youngMembers = await prisma.member.findMany({
      where: {
        // No role filter, fetch all members
      },
      include: {
        transactions: {
          where: {
            type: TransactionType.income,
            category: 'Cuota', // Assuming 'Cuota' is the category for dues
          },
        },
      },
    });

    const membersWithDues = youngMembers.map((member) => {
      const totalContributed = member.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      return {
        id: member.id,
        name: member.name,
        phone: member.phone,
        role: member.role,
        totalContributed,
      };
    });

    return NextResponse.json(membersWithDues);
  } catch (error) {
    console.error('Error fetching dues data:', error);
    return NextResponse.json({ error: 'Failed to fetch dues data' }, { status: 500 });
  }
}
