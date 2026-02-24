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
    const { type, categoryId, amount, date, description, memberId, eventId } = await request.json();
    
    // Obtener datos antes del cambio para la auditoría
    const oldTx = await prisma.transaction.findUnique({ where: { id: params.id } });

    const updatedTransaction = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        type: type as TransactionType,
        categoryId,
        amount: parseFloat(amount),
        date: new Date(date),
        description,
        memberId: memberId || null,
        eventId: eventId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || 'N/A',
        action: 'UPDATE',
        entity: 'Transaction',
        details: `Editó transacción: "${oldTx?.description}" (${oldTx?.amount}) -> "${description}" (${amount})`
      }
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
    const oldTx = await prisma.transaction.findUnique({ where: { id: params.id } });

    await prisma.transaction.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || 'N/A',
        action: 'DELETE',
        entity: 'Transaction',
        details: `Eliminó transacción: "${oldTx?.description}" por RD$ ${oldTx?.amount}`
      }
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
