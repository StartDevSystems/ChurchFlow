import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const events = await prisma.event.findMany({ 
    include: { transactions: true } 
  });
  const transactions = await prisma.transaction.findMany({ 
    include: { category: true } 
  });
  const members = await prisma.member.findMany();
  const transfers = await prisma.transfer.findMany();

  // Calcular balances básicos
  let cajaIngresos = 0;
  let cajaGastos = 0;
  
  transactions.forEach(t => {
      if (!t.eventId) {
          if (t.type === 'income') cajaIngresos += t.amount;
          else cajaGastos += t.amount;
      }
  });

  const netCajaTransfers = transfers.reduce((acc, tr) => { 
      if (!tr.fromEventId) return acc - tr.amount; 
      if (!tr.toEventId) return acc + tr.amount; 
      return acc; 
  }, 0);

  console.log(JSON.stringify({
    resumen: {
      totalMiembros: members.length,
      totalEventos: events.length,
      totalTransacciones: transactions.length,
      totalTransferencias: transfers.length,
    },
    cajaGeneral: {
        ingresos: cajaIngresos,
        gastos: cajaGastos,
        balancePorTransferencias: netCajaTransfers,
        balanceNeto: cajaIngresos - cajaGastos + netCajaTransfers
    },
    eventos: events.map(e => {
        const evTx = transactions.filter(t => t.eventId === e.id);
        const in_ = evTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const out_ = evTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const netTr = transfers.reduce((acc, tr) => { 
            if (tr.fromEventId === e.id) return acc - tr.amount; 
            if (tr.toEventId === e.id) return acc + tr.amount; 
            return acc; 
        }, 0);
        
        return { 
            nombre: e.name, 
            estado: e.status, 
            ingresos: in_,
            gastos: out_,
            balanceNeto: (in_ - out_) + netTr,
            transaccionesCount: evTx.length
        }
    })
  }, null, 2));
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); })