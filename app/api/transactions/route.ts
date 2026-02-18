import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { TransactionType, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const eventId = searchParams.get('eventId');

  try {
    const whereClause: Prisma.TransactionWhereInput = {};

    if (eventId) {
      if (eventId === 'none' || eventId === 'null') {
        whereClause.eventId = null;
      } else {
        whereClause.eventId = eventId;
      }
    }

    if (type) {
      whereClause.type = type as TransactionType;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc',
      },
      include: {
        member: true,
        category: true,
        event: true, // ← línea agregada
      },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, categoryId, amount, date, description, memberId, eventId } = await request.json();
    
    if (!type || !categoryId || !amount || !date || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        type,
        categoryId,
        amount: parseFloat(amount),
        date: new Date(date),
        description,
        memberId,
        eventId,
      },
    });
    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}