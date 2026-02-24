import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const data = {
      transactions: await prisma.transaction.findMany(),
      members: await prisma.member.findMany(),
      events: await prisma.event.findMany(),
      categories: await prisma.category.findMany(),
      transfers: await prisma.transfer.findMany(),
      settings: await prisma.settings.findMany(),
      backupDate: new Date().toISOString()
    };

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Backup failed' }, { status: 500 });
  }
}
