import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { memberId } = await request.json();

    // 1. Verificar si el miembro existe
    const member = await prisma.member.findUnique({
      where: { id: memberId }
    });

    if (!member) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });

    // 2. Registrar asistencia
    const attendance = await prisma.attendance.create({
      data: {
        memberId
      },
      include: {
        member: true
      }
    });

    // 3. Auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || 'N/A',
        action: 'CREATE',
        entity: 'Attendance',
        details: `Registró asistencia de: ${member.name}`
      }
    });

    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }
}
