import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { paymentSchema } from '@/lib/validations';

function computeStatus(amountPaid: number, totalOwed: number): string {
  if (totalOwed <= 0) return 'PAGADO';
  if (amountPaid >= totalOwed) return 'PAGADO';
  if (amountPaid > 0) return 'PARCIAL';
  return 'PENDIENTE';
}

export async function GET(req: Request, { params }: { params: { id: string; entryId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  try {
    const payments = await prisma.payment.findMany({
      where: { saleEntryId: params.entryId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error('[GET /api/events/[id]/sales/entries/[entryId]/payments]', error);
    return NextResponse.json({ error: 'Error obteniendo pagos' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string; entryId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { amount, note } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el pago
      const payment = await tx.payment.create({
        data: {
          saleEntryId: params.entryId,
          amount,
          note,
        },
      });

      // 2. Obtener todos los pagos de esta entrada para sumar el total
      const allPayments = await tx.payment.findMany({
        where: { saleEntryId: params.entryId },
      });
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

      // 3. Obtener la entrada con sus items y productos para calcular totalOwed
      const entry = await tx.saleEntry.findUnique({
        where: { id: params.entryId },
        include: { items: { include: { saleProduct: true } } },
      });

      if (!entry) throw new Error('Entrada no encontrada');

      const totalOwed = entry.items.reduce((sum, item) => sum + item.quantity * item.saleProduct.price, 0);
      const paymentStatus = computeStatus(totalPaid, totalOwed);

      // 4. Actualizar la entrada
      const updatedEntry = await tx.saleEntry.update({
        where: { id: params.entryId },
        data: {
          amountPaid: totalPaid,
          paymentStatus,
        },
      });

      return { payment, updatedEntry };
    });

    return NextResponse.json(result.payment, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/events/[id]/sales/entries/[entryId]/payments]', error);
    return NextResponse.json({ error: error.message || 'Error registrando pago' }, { status: 500 });
  }
}
