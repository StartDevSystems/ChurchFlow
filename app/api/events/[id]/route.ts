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
    const body = await request.json();
    const { name, description, type, startDate, endDate, status } = body;

    // Si viene el status solo o con otras cosas, lo procesamos de forma flexible
    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (name) dataToUpdate.name = name;
    if (type) dataToUpdate.type = type;
    if (description !== undefined) dataToUpdate.description = description;
    if (startDate) dataToUpdate.startDate = new Date(startDate);
    if (endDate !== undefined) dataToUpdate.endDate = endDate ? new Date(endDate) : null;

    // Si es solo cambio de status, no validamos name/startDate
    if (Object.keys(body).length === 1 && status) {
      const updatedEvent = await prisma.event.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json(updatedEvent);
    }

    // Validación normal para edición completa manual
    if (!name || !startDate) {
      if (!status) return NextResponse.json({ error: 'Name and Start Date are required' }, { status: 400 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name,
        description,
        type: type || undefined,
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
      // 1. Borrar items de entradas de venta
      prisma.saleEntryItem.deleteMany({
        where: { saleEntry: { eventId: id } },
      }),
      // 2. Borrar entradas de venta
      prisma.saleEntry.deleteMany({
        where: { eventId: id },
      }),
      // 3. Borrar productos de venta
      prisma.saleProduct.deleteMany({
        where: { eventId: id },
      }),
      // 4. Borrar transacciones vinculadas
      prisma.transaction.deleteMany({
        where: { eventId: id },
      }),
      // 5. Borrar asistencias vinculadas
      prisma.attendance.deleteMany({
        where: { eventId: id },
      }),
      // 6. Borrar transferencias donde el evento sea origen o destino
      prisma.transfer.deleteMany({
        where: {
          OR: [
            { fromEventId: id },
            { toEventId: id }
          ]
        }
      }),
      // 7. Finalmente borrar el evento
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
