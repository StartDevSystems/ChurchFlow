import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const members = await prisma.member.findMany({
      where: {
        birthDate: { not: null }
      }
    });

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const birthdays = members.filter(m => {
      if (!m.birthDate) return false;
      const bDate = new Date(m.birthDate);
      
      // Crear una fecha de cumpleaños para este año
      const thisYearBirthday = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate());
      
      // Si el cumple ya pasó este año, probar con el próximo año (para finales de diciembre)
      const nextBirthday = thisYearBirthday < today 
        ? new Date(today.getFullYear() + 1, bDate.getMonth(), bDate.getDate())
        : thisYearBirthday;

      return nextBirthday <= thirtyDaysFromNow;
    }).map(m => {
      // Usamos el string original para evitar el desfase de zona horaria de JS
      const birthDateStr = m.birthDate!.toISOString().split('T')[0];
      const [, month, day] = birthDateStr.split('-').map(Number);
      
      return {
        id: m.id,
        name: m.name,
        day: day,
        month: month,
        isToday: day === today.getDate() && (month - 1) === today.getMonth()
      };
    }).sort((a, b) => {
      // Ordenar por cercanía (este mes primero, luego el siguiente)
      if (a.month === b.month) return a.day - b.day;
      return a.month - b.month;
    });

    return NextResponse.json(birthdays);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch birthdays' }, { status: 500 });
  }
}
