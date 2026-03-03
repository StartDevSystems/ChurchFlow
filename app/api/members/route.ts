import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { memberSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const status = searchParams.get('status');

  try {
    const members = await prisma.member.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(members);
  } catch (error) {
    console.error('[MEMBERS_GET_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // 1. VALIDACIÓN ESTRICTA (ZOD)
    const validatedData = memberSchema.parse({
      ...body,
      monthlyDue: parseFloat(body.monthlyDue || 0)
    });

    // 2. TRANSACCIÓN ATÓMICA DE BASE DE DATOS
    const result = await prisma.$transaction(async (tx) => {
      // Crear el miembro
      const newMember = await tx.member.create({
        data: {
          name: validatedData.name,
          phone: validatedData.phone,
          email: validatedData.email,
          role: validatedData.role,
          position: validatedData.position,
          status: validatedData.status,
          monthlyDue: validatedData.monthlyDue,
          birthDate: validatedData.birthDate,
        },
      });

      // Registrar auditoría de forma obligatoria
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email || 'N/A',
          action: 'CREATE',
          entity: 'Member',
          details: `👤 Registró miembro: ${validatedData.name} [Status: ${validatedData.status}]`
        }
      });

      return newMember;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ 
        error: 'Validation Error', 
        details: error.issues.map(e => ({ path: e.path, message: e.message })) 
      }, { status: 400 });
    }

    console.error('[MEMBER_CREATE_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
