import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saleProductSchema } from '@/lib/validations';

export async function PUT(req: Request, { params }: { params: { id: string; productId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  try {
    const product = await prisma.saleProduct.findFirst({
      where: { id: params.productId, eventId: params.id },
    });
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    const body = await req.json();
    const parsed = saleProductSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const updated = await prisma.saleProduct.update({
      where: { id: params.productId },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PUT /api/events/[id]/sales/products/[productId]]', error);
    return NextResponse.json({ error: 'Error actualizando producto' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string; productId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  try {
    const product = await prisma.saleProduct.findFirst({
      where: { id: params.productId, eventId: params.id },
    });
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    await prisma.saleProduct.delete({ where: { id: params.productId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/events/[id]/sales/products/[productId]]', error);
    return NextResponse.json({ error: 'Error eliminando producto' }, { status: 500 });
  }
}
