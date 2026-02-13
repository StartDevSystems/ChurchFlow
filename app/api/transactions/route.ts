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

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    const transactions = await prisma.transaction.findMany({
      where: type ? { type: type as TransactionType } : {},
      orderBy: {
        date: 'desc',
      },
      include: {
        member: true,
      },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, category, amount, date, description, memberId } = await request.json();
    
    // Basic validation
    if (!type || !category || !amount || !date || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        type,
        category,
        amount: parseFloat(amount),
        date: new Date(date),
        description,
        memberId,
      },
    });
    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
