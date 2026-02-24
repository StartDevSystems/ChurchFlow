import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { TransactionType, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

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
        event: true, 
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
    const amountNum = parseFloat(amount);
    
    if (!type || !categoryId || !amount || !date || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        type,
        categoryId,
        amount: amountNum,
        date: new Date(date),
        description,
        memberId,
        eventId,
      },
      include: {
        category: true
      }
    });

    // --- Lógica de Alertas Beta ---
    try {
      const settings = await prisma.systemSettings.findUnique({ where: { id: 'system-settings' } });
      
      if (settings && settings.webhookUrl) {
        const currency = settings.currencySymbol;
        
        // 1. Alerta de Gasto Grande (>= 5000)
        if (type === 'expense' && amountNum >= 5000) {
          const msg = `⚠️ GASTO GRANDE DETECTADO\n\n📌 Concepto: ${description}\n📂 Categoría: ${newTransaction.category.name}\n💰 Monto: ${currency} ${amountNum.toLocaleString()}\n👤 Registrado por: ${session.user.email}`;
          await sendNotification(msg);
        }

        // 2. Alerta de Saldo Bajo (Solo para Caja General)
        if (!eventId) {
          const totalIncome = await prisma.transaction.aggregate({
            where: { type: 'income', eventId: null },
            _sum: { amount: true }
          });
          const totalExpense = await prisma.transaction.aggregate({
            where: { type: 'expense', eventId: null },
            _sum: { amount: true }
          });
          
          const currentBalance = (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0);
          
          if (currentBalance < settings.lowBalanceAlert) {
            const msg = `🚨 ALERTA DE SALDO BAJO\n\nEl saldo de la ${settings.generalFundName} ha bajado del límite configurado.\n\n💵 Saldo Actual: ${currency} ${currentBalance.toLocaleString()}\n📉 Límite: ${currency} ${settings.lowBalanceAlert.toLocaleString()}`;
            await sendNotification(msg);
          }
        }
      }
    } catch (notifyError) {
      console.error('Error en el proceso de notificación:', notifyError);
      // No bloqueamos la respuesta principal si fallan las notificaciones
    }

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
