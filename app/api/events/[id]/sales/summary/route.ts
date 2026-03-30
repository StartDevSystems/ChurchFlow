import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  try {
    const entries = await prisma.saleEntry.findMany({
      where: { eventId: params.id },
      include: { items: { include: { saleProduct: true } } },
    });

    let totalOwed = 0;
    let totalPaid = 0;
    const countByStatus: Record<string, number> = { PENDIENTE: 0, PARCIAL: 0, PAGADO: 0 };

    for (const entry of entries) {
      const entryOwed = entry.items.reduce((sum, item) => sum + item.quantity * item.saleProduct.price, 0);
      totalOwed += entryOwed;
      totalPaid += entry.amountPaid;
      countByStatus[entry.paymentStatus] = (countByStatus[entry.paymentStatus] ?? 0) + 1;
    }

    return NextResponse.json({
      totalOwed,
      totalPaid,
      totalPending: totalOwed - totalPaid,
      totalClients: entries.length,
      countByStatus,
      progressPercent: totalOwed > 0 ? Math.round((totalPaid / totalOwed) * 100) : 0,
    });
  } catch (error) {
    console.error('[GET /api/events/[id]/sales/summary]', error);
    return NextResponse.json({ error: 'Error obteniendo resumen' }, { status: 500 });
  }
}
