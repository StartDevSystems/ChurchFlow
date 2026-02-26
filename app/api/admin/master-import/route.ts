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
    const { members, transactions } = await req.json();
    const batchId = `SYNC-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

    const results = await prisma.$transaction(async (tx) => {
      let membersCreated: string[] = [];
      let txCreated: string[] = [];

      // 1. Procesar Miembros
      if (members && members.length > 0) {
        for (const m of members) {
          // Si tiene ID_SISTEMA, es uno que ya bajó del sistema, lo ignoramos para no duplicar
          if (m.id && m.id.length > 3) continue;

          const existing = await tx.member.findFirst({ where: { phone: m.phone } });
          if (!existing) {
            const newMem = await tx.member.create({
              data: {
                name: m.name,
                phone: m.phone,
                role: m.role || 'Joven',
                birthDate: m.bday ? new Date(m.bday) : null
              }
            });
            membersCreated.push(newMem.id);
          }
        }
      }

      // 2. Procesar Transacciones
      if (transactions && transactions.length > 0) {
        const categories = await tx.category.findMany();
        const events = await tx.event.findMany();

        for (const t of transactions) {
          // Si tiene ID_SISTEMA, lo ignoramos
          if (t.id && t.id.length > 3) continue;

          const txDate = new Date(t.date);
          const startOfDay = new Date(txDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(txDate);
          endOfDay.setHours(23, 59, 59, 999);

          const existingTx = await tx.transaction.findFirst({
            where: {
              description: { equals: t.desc, mode: 'insensitive' },
              amount: t.amount,
              date: { gte: startOfDay, lte: endOfDay }
            }
          });

          if (!existingTx) {
            let cat = categories.find(c => c.name.toLowerCase() === t.cat?.toLowerCase());
            if (!cat) {
              cat = await tx.category.create({
                data: { name: t.cat || 'OTROS', type: t.type === 'INGRESO' ? 'income' : 'expense' }
              });
              categories.push(cat);
            }

            const event = events.find(e => e.name.toLowerCase() === t.event?.toLowerCase());

            const newTx = await tx.transaction.create({
              data: {
                amount: t.amount,
                type: t.type === 'INGRESO' ? 'income' : 'expense',
                description: t.desc,
                date: txDate,
                categoryId: cat.id,
                eventId: event?.id || null
              }
            });
            txCreated.push(newTx.id);
          }
        }
      }

      // 3. Registrar en Auditoría para poder deshacer
      if (membersCreated.length > 0 || txCreated.length > 0) {
        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            userEmail: session.user.email!,
            action: 'SYNC',
            entity: 'Batch',
            details: `Sincronización de Libro Maestro: ${membersCreated.length} miembros, ${txCreated.length} transacciones.`,
            batchId: batchId,
            metadata: {
              memIds: membersCreated,
              txIds: txCreated
            }
          }
        });
      }

      return { membersCount: membersCreated.length, txCount: txCreated.length, batchId };
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error en Master Import:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
