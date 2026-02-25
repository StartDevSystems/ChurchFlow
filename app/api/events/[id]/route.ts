import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/events/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error(`Error fetching event ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

// PUT /api/events/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const { name, description, startDate, endDate, status } = await request.json();

    if (!name || !startDate) {
      return NextResponse.json({ error: 'Name and Start Date are required' }, { status: 400 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || undefined,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error(`Error updating event ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// DELETE /api/events/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  // 🛡️ Seguridad: Solo ADMIN puede realizar borrados profundos
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado. Solo administradores pueden borrar eventos con historial.' }, { status: 403 });
  }

  try {
    const { id } = params;

    // 🌪️ Borrado en Cascada: Limpiamos todo lo relacionado con el evento
    // para evitar errores de integridad referencial.
    await prisma.$transaction([
      // 1. Borrar transacciones vinculadas
      prisma.transaction.deleteMany({
        where: { eventId: id },
      }),
      // 2. Borrar asistencias vinculadas
      prisma.attendance.deleteMany({
        where: { eventId: id },
      }),
      // 3. Borrar transferencias donde el evento sea origen o destino
      prisma.transfer.deleteMany({
        where: {
          OR: [
            { fromEventId: id },
            { toEventId: id }
          ]
        }
      }),
      // 4. Finalmente borrar el evento
      prisma.event.delete({
        where: { id },
      }),
    ]);

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error(`Error deleting event ${params.id}:`, error);
    return NextResponse.json({ error: 'Fallo al eliminar el evento y sus dependencias.' }, { status: 500 });
  }
}
