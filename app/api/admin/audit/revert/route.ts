import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { auditId } = await req.json();

    const log = await prisma.auditLog.findUnique({
      where: { id: auditId }
    });

    if (!log || log.action !== 'SYNC') {
      return NextResponse.json({ error: 'Registro de sincronización no encontrado' }, { status: 404 });
    }

    const metadata = log.metadata as any;
    const txIds = metadata?.txIds || [];
    const memIds = metadata?.memIds || [];

    await prisma.$transaction(async (tx) => {
      // 1. Borrar transacciones creadas en este lote
      if (txIds.length > 0) {
        await tx.transaction.deleteMany({
          where: { id: { in: txIds } }
        });
      }

      // 2. Borrar miembros creados en este lote
      if (memIds.length > 0) {
        await tx.member.deleteMany({
          where: { id: { in: memIds } }
        });
      }

      // 3. Marcar el log como revertido o borrarlo
      await tx.auditLog.delete({
        where: { id: auditId }
      });
    });

    return NextResponse.json({ success: true, deletedTx: txIds.length, deletedMem: memIds.length });
  } catch (error: any) {
    console.error("Error al revertir sincronización:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
