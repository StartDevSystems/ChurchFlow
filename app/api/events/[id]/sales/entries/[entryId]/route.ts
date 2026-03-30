import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saleEntrySchema } from '@/lib/validations';

function computeStatus(amountPaid: number, totalOwed: number): string {
  if (totalOwed <= 0) return 'PAGADO';
  if (amountPaid >= totalOwed) return 'PAGADO';
  if (amountPaid > 0) return 'PARCIAL';
  return 'PENDIENTE';
}

export async function PUT(req: Request, { params }: { params: { id: string; entryId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = saleEntrySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { items, ...entryData } = parsed.data;

    const productIds = items.map(i => i.saleProductId);
    const products = await prisma.saleProduct.findMany({
      where: { id: { in: productIds }, eventId: params.id },
    });
    const priceMap = new Map(products.map(p => [p.id, p.price]));

    const totalOwed = items.reduce((sum, item) => {
      return sum + item.quantity * (priceMap.get(item.saleProductId) ?? 0);
    }, 0);

    const paymentStatus = computeStatus(entryData.amountPaid, totalOwed);

    const entry = await prisma.$transaction(async (tx) => {
      // Delete old items, recreate
      await tx.saleEntryItem.deleteMany({ where: { saleEntryId: params.entryId } });

      const updated = await tx.saleEntry.update({
        where: { id: params.entryId },
        data: {
          ...entryData,
          paymentStatus,
          items: {
            create: items.filter(i => i.quantity > 0).map(i => ({
              saleProductId: i.saleProductId,
              quantity: i.quantity,
            })),
          },
        },
        include: { items: { include: { saleProduct: true } } },
      });
      return updated;
    });

    return NextResponse.json({ ...entry, totalOwed, totalPending: totalOwed - entry.amountPaid });
  } catch (error) {
    console.error('[PUT /api/events/[id]/sales/entries/[entryId]]', error);
    return NextResponse.json({ error: 'Error actualizando entrada' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string; entryId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  try {
    await prisma.saleEntry.delete({ where: { id: params.entryId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/events/[id]/sales/entries/[entryId]]', error);
    return NextResponse.json({ error: 'Error eliminando entrada' }, { status: 500 });
  }
}
