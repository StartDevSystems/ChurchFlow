import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado. Solo administradores pueden borrar movimientos financieros.' }, { status: 403 });
  }

  try {
    const { id } = params;

    // Buscar la transferencia antes de borrarla para la auditoría
    const oldTransfer = await prisma.transfer.findUnique({
      where: { id }
    });

    if (!oldTransfer) {
      return NextResponse.json({ error: 'Transferencia no encontrada' }, { status: 404 });
    }

    await prisma.transfer.delete({
      where: { id },
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || 'N/A',
        action: 'DELETE',
        entity: 'Transfer',
        details: `Eliminó transferencia: "${oldTransfer.description}" por RD$ ${oldTransfer.amount}`
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting transfer ${params.id}:`, error);
    return NextResponse.json({ error: 'Fallo al eliminar la transferencia.' }, { status: 500 });
  }
}
