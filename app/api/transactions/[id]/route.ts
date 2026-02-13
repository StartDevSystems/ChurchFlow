import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TransactionType } from '@prisma/client'; // Import TransactionType

interface Params {
  id: string;
}

// GET a single transaction by ID
export async function GET(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
    });
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}

// UPDATE a transaction by ID
export async function PUT(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { type, category, amount, date, description, memberId } = await request.json();
    const updatedTransaction = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        type: type as TransactionType, // Cast type to TransactionType
        category,
        amount: parseFloat(amount),
        date: new Date(date),
        description,
        memberId: memberId || null,
      },
    });
    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

// DELETE a transaction by ID
export async function DELETE(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    await prisma.transaction.delete({
      where: { id: params.id },
    });
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
