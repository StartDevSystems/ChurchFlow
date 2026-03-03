import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eventSchema } from '@/lib/validations';
import { ZodError } from 'zod';

// GET /api/events
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const events = await prisma.event.findMany({
      orderBy: { startDate: 'desc' },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('[EVENTS_GET_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/events
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // 1. VALIDACIÓN ESTRICTA (ZOD)
    const validatedData = eventSchema.parse(body);

    // 2. TRANSACCIÓN ATÓMICA DE BASE DE DATOS
    const result = await prisma.$transaction(async (tx) => {
      // Crear el evento
      const newEvent = await tx.event.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          status: validatedData.status,
        },
      });

      // Registrar auditoría obligatoria
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email || 'N/A',
          action: 'CREATE',
          entity: 'Event',
          details: `📅 Creó evento: ${validatedData.name} [Inicio: ${validatedData.startDate.toLocaleDateString()}]`
        }
      });

      return newEvent;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ 
        error: 'Validation Error', 
        details: error.errors.map(e => ({ path: e.path, message: e.message })) 
      }, { status: 400 });
    }

    console.error('[EVENT_CREATE_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
