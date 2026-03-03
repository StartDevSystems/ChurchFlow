import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { TransactionType, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import { transactionSchema } from '@/lib/validations';
import { ZodError } from 'zod';

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
      whereClause.eventId = (eventId === 'none' || eventId === 'null') ? null : eventId;
    }

    if (type) {
      whereClause.type = type as TransactionType;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        member: true,
        category: true,
        event: true, 
      },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // CAPA 1: VALIDACIÓN ESTRICTA (ZOD)
    const validatedData = transactionSchema.parse({
      ...body,
      amount: parseFloat(body.amount)
    });

    // CAPA 2: TRANSACCIÓN ATÓMICA (PRISMA TRANSACTION)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear la transacción
      const newTransaction = await tx.transaction.create({
        data: {
          type: validatedData.type,
          categoryId: validatedData.categoryId,
          amount: validatedData.amount,
          date: validatedData.date,
          description: validatedData.description,
          memberId: validatedData.memberId,
          eventId: validatedData.eventId,
        },
        include: { category: true }
      });

      // 2. Registrar auditoría (Obligatorio en la misma transacción)
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email || 'N/A',
          action: 'CREATE',
          entity: 'Transaction',
          details: `💰 [${validatedData.type.toUpperCase()}] ${validatedData.amount} - ${validatedData.description}`
        }
      });

      return newTransaction;
    });

    // CAPA 3: PROCESOS ASÍNCRONOS (NOTIFICACIONES)
    // Se ejecutan fuera de la transacción de DB para no bloquear la respuesta
    (async () => {
      try {
        const settings = await prisma.settings.findUnique({ where: { id: 'system-settings' } });
        if (settings?.webhookUrl) {
          const currency = settings.currencySymbol;
          
          if (validatedData.type === 'expense' && validatedData.amount >= 5000) {
            await sendNotification(`⚠️ GASTO GRANDE: ${currency} ${validatedData.amount.toLocaleString()} - ${validatedData.description}`);
          }

          // Verificación de saldo bajo
          if (!validatedData.eventId) {
             const agg = await prisma.transaction.aggregate({
                where: { eventId: null },
                _sum: { amount: true }
             });
             // Lógica simplificada para ejemplo: en producción se calcularía income - expense
          }
        }
      } catch (e) {
        console.error('Notification worker failed:', e);
      }
    })();

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ 
        error: 'Validation Error', 
        details: error.issues.map(e => ({ path: e.path, message: e.message })) 
      }, { status: 400 });
    }

    console.error('Transaction creation failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
