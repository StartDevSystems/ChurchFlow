import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saleProductSchema } from '@/lib/validations';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  const products = await prisma.saleProduct.findMany({
    where: { eventId: params.id },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(products);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  try {
    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    if (event.type !== 'VENTA') return NextResponse.json({ error: 'Solo eventos tipo VENTA' }, { status: 400 });

    const body = await req.json();
    const parsed = saleProductSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const product = await prisma.saleProduct.create({
      data: { ...parsed.data, eventId: params.id },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('[POST /api/events/[id]/sales/products]', error);
    return NextResponse.json({ error: 'Error creando producto' }, { status: 500 });
  }
}
