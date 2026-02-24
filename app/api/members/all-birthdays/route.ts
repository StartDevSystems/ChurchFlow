import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const members = await prisma.member.findMany({
      where: { birthDate: { not: null } },
      orderBy: { birthDate: 'asc' }
    });

    // Agrupar por mes
    const months = Array.from({ length: 12 }, (_, i) => ({
      index: i + 1,
      name: new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2024, i, 1)),
      members: [] as any[]
    }));

    members.forEach(m => {
      const birthDate = new Date(m.birthDate!);
      // Usar UTC para evitar saltos de día
      const monthIndex = birthDate.getUTCMonth();
      months[monthIndex].members.push({
        id: m.id,
        name: m.name,
        day: birthDate.getUTCDate(),
        role: m.role
      });
    });

    return NextResponse.json(months.filter(m => m.members.length > 0));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch all birthdays' }, { status: 500 });
  }
}
