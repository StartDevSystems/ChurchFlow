import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Datos inválidos o contraseña muy corta' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email!,
        action: 'UPDATE',
        entity: 'User',
        details: `Reset de contraseña forzado para el usuario ID: ${userId}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al resetear clave:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
