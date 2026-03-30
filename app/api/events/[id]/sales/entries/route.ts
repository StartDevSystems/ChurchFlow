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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const where: any = { eventId: params.id };
  if (status) where.paymentStatus = status;

  const entries = await prisma.saleEntry.findMany({
    where,
    include: { items: { include: { saleProduct: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const enriched = entries.map(e => {
    const totalOwed = e.items.reduce((sum, item) => sum + item.quantity * item.saleProduct.price, 0);
    return { ...e, totalOwed, totalPending: totalOwed - e.amountPaid };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  try {
    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });

    const body = await req.json();
    const parsed = saleEntrySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { items, ...entryData } = parsed.data;

    // Get product prices to compute total owed
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
      const created = await tx.saleEntry.create({
        data: {
          ...entryData,
          eventId: params.id,
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
      return created;
    });

    return NextResponse.json({ ...entry, totalOwed, totalPending: totalOwed - entry.amountPaid }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/events/[id]/sales/entries]', error);
    return NextResponse.json({ error: 'Error creando entrada' }, { status: 500 });
  }
}
