import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  try {
    const members = await prisma.member.findMany({
      where: role ? { role } : {}, // Filter by role if provided
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, phone, role } = await request.json();
    const newMember = await prisma.member.create({
      data: {
        name,
        phone,
        role, // If role is not provided, the default value from the schema will be used
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email || 'N/A',
        action: 'CREATE',
        entity: 'Member',
        details: `Registró al nuevo miembro: ${name} (${role})`
      }
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error); // Log the full error
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}
