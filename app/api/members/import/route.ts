import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { members } = await request.json();

    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: 'No se enviaron miembros válidos' }, { status: 400 });
    }

    // Insertar en lote
    const createdMembers = await prisma.member.createMany({
      data: members.map((m: any) => ({
        name: m.Nombre,
        phone: m.Telefono?.toString() || '',
        role: m.Rol || 'Joven',
        monthlyDue: parseFloat(m.Cuota) || 0,
        birthDate: m.Cumpleanos ? new Date(m.Cumpleanos) : null
      }))
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || 'N/A',
        action: 'CREATE',
        entity: 'Member',
        details: `Importación masiva: se registraron ${createdMembers.count} miembros nuevos.`
      }
    });

    return NextResponse.json({ success: true, count: createdMembers.count });
  } catch (error) {
    console.error('Error en importación:', error);
    return NextResponse.json({ error: 'Fallo al procesar el archivo' }, { status: 500 });
  }
}
