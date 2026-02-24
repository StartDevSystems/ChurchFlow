import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

interface Params {
  id: string;
}

// GET a single member by ID
export async function GET(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const member = await prisma.member.findUnique({
      where: { id: params.id },
      include: {
        transactions: true,
        attendances: true,
      },
    });

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    // Calcular Estadísticas "Pro"
    const totalContributed = member.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const attendanceCount = member.attendances.length;
    const last30DaysAttendance = member.attendances.filter(a => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(a.date) > thirtyDaysAgo;
    }).length;

    // Calcular Rango Personalizado
    let rank = member.role === 'Directiva' ? 'LÍDER' : 'JOVEN';
    if (totalContributed > 5000) rank += ' ★'; // Estrella para los más colaboradores

    return NextResponse.json({
      ...member,
      stats: {
        totalContributed,
        attendanceCount,
        loyaltyScore: Math.round(Math.min(100, (last30DaysAttendance / 4) * 100)), 
        rank: rank
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 });
  }
}

// UPDATE a member by ID
export async function PUT(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    
    // Validar fecha de forma segura
    let validatedBirthDate = null;
    if (body.birthDate && body.birthDate !== "") {
      const d = new Date(body.birthDate);
      if (!isNaN(d.getTime())) {
        validatedBirthDate = d;
      }
    }

    const updatedMember = await prisma.member.update({
      where: { id: params.id },
      data: { 
        name: body.name, 
        phone: body.phone, 
        role: body.role,
        email: body.email || null,
        image: body.image || null,
        position: body.position || 'Miembro',
        status: body.status || 'ACTIVO',
        birthDate: validatedBirthDate,
        monthlyDue: parseFloat(body.monthlyDue) || 0
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email || 'N/A',
          action: 'UPDATE',
          entity: 'Member',
          details: `Actualizó ficha Pro de: ${body.name}`
        }
      });
    } catch (auditError) {
      console.error("Error guardando auditoría (no bloqueante):", auditError);
    }

    return NextResponse.json(updatedMember);
  } catch (error: any) {
    console.error("❌ ERROR CRÍTICO EN API MEMBERS:", error.message);
    return NextResponse.json({ error: error.message || 'Failed to update member' }, { status: 500 });
  }
}

// DELETE a member by ID
export async function DELETE(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    await prisma.member.delete({
      where: { id: params.id },
    });
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    // Handle cases where member has associated transactions
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete member because they have associated transactions.' },
        { status: 409 } // Conflict
      );
    }
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
