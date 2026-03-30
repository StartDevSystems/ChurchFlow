import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function computeStatus(paid: number, owed: number): string {
  if (owed <= 0) return 'PAGADO';
  if (paid >= owed) return 'PAGADO';
  if (paid > 0) return 'PARCIAL';
  return 'PENDIENTE';
}

async function seed() {
  console.log('Buscando evento "Venta de Mani"...');

  // Find the Mani event (try different name variations)
  let event = await prisma.event.findFirst({
    where: { name: { contains: 'Man', mode: 'insensitive' }, type: 'VENTA' },
  });

  if (!event) {
    event = await prisma.event.findFirst({
      where: { type: 'VENTA' },
    });
  }

  if (!event) {
    console.error('No se encontro un evento tipo VENTA. Creando uno...');
    event = await prisma.event.create({
      data: {
        name: 'Venta de Mani',
        type: 'VENTA',
        investment: 15000,
        salesGoal: 30000,
        startDate: new Date('2026-03-14'),
        status: 'ACTIVO',
      },
    });
    console.log(`Evento creado: ${event.id}`);
  } else {
    console.log(`Evento encontrado: ${event.name} (${event.id})`);
  }

  // Check if products already exist
  const existingProducts = await prisma.saleProduct.findMany({ where: { eventId: event.id } });
  if (existingProducts.length > 0) {
    console.log('Ya existen productos. Eliminando datos anteriores para re-seed...');
    await prisma.$transaction([
      prisma.saleEntryItem.deleteMany({ where: { saleEntry: { eventId: event.id } } }),
      prisma.saleEntry.deleteMany({ where: { eventId: event.id } }),
      prisma.saleProduct.deleteMany({ where: { eventId: event.id } }),
    ]);
  }

  // Create products
  console.log('Creando productos...');
  const paquete = await prisma.saleProduct.create({
    data: { eventId: event.id, name: 'Paquete', price: 1600, unitDescription: '8 fundas', sortOrder: 0 },
  });
  const funda = await prisma.saleProduct.create({
    data: { eventId: event.id, name: 'Funda', price: 200, unitDescription: null, sortOrder: 1 },
  });
  console.log(`Paquete: ${paquete.id}, Funda: ${funda.id}`);

  // All 52 clients from the PDF
  const clients: { name: string; paquetes: number; fundas: number; paid: number; date: string; comment: string }[] = [
    { name: 'Santa', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-14', comment: 'Se le dio en la convencion de damas' },
    { name: 'Maite', paquetes: 0, fundas: 1, paid: 0, date: '2026-03-14', comment: 'Se le dio en la convencion de damas' },
    { name: 'Mildre Luna', paquetes: 1, fundas: 0, paid: 1000, date: '2026-03-14', comment: 'Le dimos un paquete de 8 para vender. Pago 800 Marte 17/03/2026' },
    { name: 'Samuel Briceno', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Juan', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'David', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Eliezer Brito', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Juan Rosario', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Julio Torre', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Ruth', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Emil', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Ruddy Hernandez', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Flor Maria', paquetes: 0, fundas: 1, paid: 100, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Pablo', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Eduar', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Jaquelin', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Esa Jaquelin, no es la de Hilario. Es un morenita, cabello negro. me confirmo Sherry' },
    { name: 'Sulemi', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Gabriel Alcala', paquetes: 0, fundas: 4, paid: 800, date: '2026-03-15', comment: '' },
    { name: 'Marisol', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: '' },
    { name: 'Daniela Jimenez', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-17', comment: '' },
    { name: 'Yeuris', paquetes: 0, fundas: 2, paid: 400, date: '2026-03-17', comment: '' },
    { name: 'Abrahan Martinez', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-18', comment: '' },
    { name: 'Rodolfo', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Se le dio en el culto del domingo.' },
    { name: 'Cristina de Bueno', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Se le dio en el culto del domingo.' },
    { name: 'Dolores', paquetes: 0, fundas: 1, paid: 0, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Josefina Fortuna', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Esposo de Ingrid "Manuel"', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Sherry', paquetes: 2, fundas: 1, paid: 3200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo. Le entregamos otro paquete de mani el Miercoles 18/03' },
    { name: 'Esdra Martinez', paquetes: 0, fundas: 1, paid: 0, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Jaquelin Hilario', paquetes: 0, fundas: 1, paid: 0, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Jeremy Martinez "El mello"', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'La comay', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Rafael Hilario', paquetes: 0, fundas: 1, paid: 0, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Rafael Ortiz', paquetes: 1, fundas: 0, paid: 1600, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Agustin Berbere', paquetes: 0, fundas: 1, paid: 0, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Altagracia', paquetes: 1, fundas: 0, paid: 0, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Marisol (2)', paquetes: 0, fundas: 1, paid: 0, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Alcadio', paquetes: 0, fundas: 1, paid: 0, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Rafael Mieses', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Luixander Blanco', paquetes: 0, fundas: 1, paid: 0, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Josefina', paquetes: 0, fundas: 3, paid: 0, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Milena', paquetes: 0, fundas: 1, paid: 0, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Ramon de Liselot', paquetes: 0, fundas: 1, paid: 0, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Juan (Nuevo Creyente)', paquetes: 0, fundas: 1, paid: 0, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Venta en Convencion de Damas', paquetes: 1, fundas: 0, paid: 1600, date: '2026-03-14', comment: 'Estos mani los vendimos en la Convencion de damas.' },
    { name: 'Silverio', paquetes: 0, fundas: 6, paid: 0, date: '2026-03-17', comment: '' },
    { name: 'Angela Diaz', paquetes: 1, fundas: 0, paid: 0, date: '2026-03-18', comment: '' },
    { name: 'Jose Maria', paquetes: 1, fundas: 4, paid: 1800, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo.' },
    { name: 'Rode Briceno', paquetes: 0, fundas: 9, paid: 1800, date: '2026-03-15', comment: 'Entregado en la iglesia ese domingo. Le entregamos 1 Mani el Miercoles 18/03' },
    { name: 'Yanibel', paquetes: 2, fundas: 3, paid: 2200, date: '2026-03-16', comment: 'Gabriel le entrego un paquete de Mani.' },
    { name: 'Debora', paquetes: 0, fundas: 1, paid: 200, date: '2026-03-17', comment: 'Debe solo 50 Pesos' },
    { name: 'Luisin', paquetes: 0, fundas: 3, paid: 0, date: '', comment: '' },
  ];

  console.log(`Insertando ${clients.length} clientes...`);

  for (const c of clients) {
    const totalOwed = c.paquetes * 1600 + c.fundas * 200;
    const status = computeStatus(c.paid, totalOwed);

    const items: { saleProductId: string; quantity: number }[] = [];
    if (c.paquetes > 0) items.push({ saleProductId: paquete.id, quantity: c.paquetes });
    if (c.fundas > 0) items.push({ saleProductId: funda.id, quantity: c.fundas });

    await prisma.saleEntry.create({
      data: {
        eventId: event.id,
        clientName: c.name,
        deliveryDate: c.date ? new Date(c.date) : null,
        amountPaid: c.paid,
        paymentStatus: status,
        comment: c.comment || null,
        items: { create: items },
      },
    });
  }

  // Summary
  const totalOwed = clients.reduce((s, c) => s + c.paquetes * 1600 + c.fundas * 200, 0);
  const totalPaid = clients.reduce((s, c) => s + c.paid, 0);
  const pagados = clients.filter(c => computeStatus(c.paid, c.paquetes * 1600 + c.fundas * 200) === 'PAGADO').length;
  const parciales = clients.filter(c => computeStatus(c.paid, c.paquetes * 1600 + c.fundas * 200) === 'PARCIAL').length;
  const pendientes = clients.filter(c => computeStatus(c.paid, c.paquetes * 1600 + c.fundas * 200) === 'PENDIENTE').length;

  console.log('\n=== RESUMEN ===');
  console.log(`Clientes: ${clients.length}`);
  console.log(`Total a cobrar: RD$${totalOwed.toLocaleString()}`);
  console.log(`Cobrado: RD$${totalPaid.toLocaleString()}`);
  console.log(`Pendiente: RD$${(totalOwed - totalPaid).toLocaleString()}`);
  console.log(`Pagados: ${pagados} | Parciales: ${parciales} | Pendientes: ${pendientes}`);
  console.log('\nSeed completado!');
}

seed()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
