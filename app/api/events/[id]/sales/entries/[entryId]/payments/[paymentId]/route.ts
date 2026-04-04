import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

function computeStatus(amountPaid: number, totalOwed: number): string {
  if (totalOwed <= 0) return 'PAGADO';
  if (amountPaid >= totalOwed) return 'PAGADO';
  if (amountPaid > 0) return 'PARCIAL';
  return 'PENDIENTE';
}

export async function DELETE(req: Request, { params }: { params: { id: string; entryId: string; paymentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Eliminar el pago
      await tx.payment.delete({
        where: { id: params.paymentId },
      });

      // 2. Recalcular totalPaid
      const allPayments = await tx.payment.findMany({
        where: { saleEntryId: params.entryId },
      });
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

      // 3. Obtener totalOwed
      const entry = await tx.saleEntry.findUnique({
        where: { id: params.entryId },
        include: { items: { include: { saleProduct: true } } },
      });

      if (!entry) throw new Error('Entrada no encontrada');

      const totalOwed = entry.items.reduce((sum, item) => sum + item.quantity * item.saleProduct.price, 0);
      const paymentStatus = computeStatus(totalPaid, totalOwed);

      // 4. Actualizar la entrada
      await tx.saleEntry.update({
        where: { id: params.entryId },
        data: {
          amountPaid: totalPaid,
          paymentStatus,
        },
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[DELETE /api/events/[id]/sales/entries/[entryId]/payments/[paymentId]]', error);
    return NextResponse.json({ error: error.message || 'Error eliminando pago' }, { status: 500 });
  }
}
