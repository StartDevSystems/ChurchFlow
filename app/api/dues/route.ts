import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { TransactionType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ── GET /api/dues?type=local|sede&month=YYYY-MM|year=YYYY ──────────────────
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'local'; // 'local' | 'sede'
    const monthParam = searchParams.get('month');      // YYYY-MM  (solo local)
    const yearParam  = searchParams.get('year');       // YYYY     (solo sede)

    const settings = await prisma.settings.findFirst();

    let dateStart: Date;
    let dateEnd:   Date;
    let categoryName: string;
    let defaultDue: number;

    if (type === 'sede') {
      // Anual
      const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
      dateStart = new Date(year, 0, 1);
      dateEnd   = new Date(year, 11, 31, 23, 59, 59, 999);
      categoryName = 'Cuota Sede';
      defaultDue   = (settings as any)?.defaultAnnualSedeDue ?? 120;
    } else {
      // Mensual (default)
      if (monthParam) {
        const [year, month] = monthParam.split('-').map(Number);
        dateStart = new Date(year, month - 1, 1);
        dateEnd   = new Date(year, month, 0, 23, 59, 59, 999);
      } else {
        const now = new Date();
        dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
      categoryName = 'Cuota Local';
      defaultDue   = (settings as any)?.defaultMonthlyDue ?? 200;
    }

    const members = await prisma.member.findMany({
      where: { status: 'ACTIVO' },
      include: {
        transactions: {
          where: {
            type: TransactionType.income,
            category: { name: categoryName },
            date: { gte: dateStart, lte: dateEnd },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const membersWithDues = members.map((member) => {
      const totalContributed = member.transactions.reduce((sum, t) => sum + t.amount, 0);
      const due = type === 'sede'
        ? ((member as any).annualSedeDue > 0 ? (member as any).annualSedeDue : defaultDue)
        : (member.monthlyDue > 0 ? member.monthlyDue : defaultDue);
      return {
        id: member.id,
        name: member.name,
        phone: member.phone,
        role: member.role,
        due,
        totalContributed,
        missing: Math.max(0, due - totalContributed),
        isComplete: totalContributed >= due,
      };
    });

    return NextResponse.json({ members: membersWithDues, defaultDue });
  } catch (error) {
    console.error('Error fetching dues data:', error);
    return NextResponse.json({ error: 'Failed to fetch dues data' }, { status: 500 });
  }
}

// ── POST /api/dues — bulk assign due o registrar pago ─────────────────────
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { action, type } = body; // action: 'assign' | 'payment' | 'markAllPaid'

    // ── 1. Asignar meta en bulk ──────────────────────────────────────────
    if (action === 'assign') {
      const { amount, memberIds } = body;
      if (typeof amount !== 'number' || amount < 0)
        return NextResponse.json({ error: 'Monto invalido' }, { status: 400 });

      const field = type === 'sede' ? 'annualSedeDue' : 'monthlyDue';
      const settingsField = type === 'sede' ? 'defaultAnnualSedeDue' : 'defaultMonthlyDue';

      if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
        await prisma.member.updateMany({
          where: { id: { in: memberIds } },
          data: { [field]: amount },
        });
      } else {
        if (type === 'sede') {
          await prisma.$executeRaw`UPDATE "Settings" SET "defaultAnnualSedeDue" = ${amount} WHERE "id" = 'system-settings'`;
        } else {
          await prisma.$executeRaw`UPDATE "Settings" SET "defaultMonthlyDue" = ${amount} WHERE "id" = 'system-settings'`;
        }
        await prisma.member.updateMany({ data: { [field]: amount } });
      }
      return NextResponse.json({ ok: true });
    }

    // ── 2. Registrar pago individual ─────────────────────────────────────
    if (action === 'payment') {
      const { memberId, amount, date } = body;
      if (!memberId || typeof amount !== 'number' || amount <= 0)
        return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });

      const categoryName = type === 'sede' ? 'Cuota Sede' : 'Cuota Local';
      const category = await prisma.category.findFirst({
        where: { name: categoryName, type: 'income' },
      });
      if (!category)
        return NextResponse.json({ error: `Categoría "${categoryName}" no encontrada` }, { status: 404 });

      await prisma.transaction.create({
        data: {
          amount,
          type: TransactionType.income,
          categoryId: category.id,
          memberId,
          date: date ? new Date(date) : new Date(),
          description: `Pago ${categoryName}`,
        },
      });
      return NextResponse.json({ ok: true });
    }

    // ── 3. Marcar todos como pagados ─────────────────────────────────────
    if (action === 'markAllPaid') {
      const { members: pendingMembers, date } = body;
      // pendingMembers: [{ id, missing }]
      if (!Array.isArray(pendingMembers) || pendingMembers.length === 0)
        return NextResponse.json({ error: 'Sin miembros pendientes' }, { status: 400 });

      const categoryName = type === 'sede' ? 'Cuota Sede' : 'Cuota Local';
      const category = await prisma.category.findFirst({
        where: { name: categoryName, type: 'income' },
      });
      if (!category)
        return NextResponse.json({ error: `Categoría "${categoryName}" no encontrada` }, { status: 404 });

      const txDate = date ? new Date(date) : new Date();
      await prisma.transaction.createMany({
        data: pendingMembers.map((m: { id: string; missing: number }) => ({
          amount: m.missing,
          type: TransactionType.income,
          categoryId: category.id,
          memberId: m.id,
          date: txDate,
          description: `Pago ${categoryName}`,
        })),
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error) {
    console.error('Error en POST /api/dues:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ── PATCH /api/dues — actualizar meta individual de un miembro ─────────────
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { memberId, amount, type } = await request.json();
    if (!memberId || typeof amount !== 'number' || amount < 0)
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });

    const field = type === 'sede' ? 'annualSedeDue' : 'monthlyDue';
    await prisma.member.update({
      where: { id: memberId },
      data: { [field]: amount },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error en PATCH /api/dues:', error);
    return NextResponse.json({ error: 'Error actualizando meta' }, { status: 500 });
  }
}