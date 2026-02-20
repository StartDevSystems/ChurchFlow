import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const prisma = new PrismaClient();
  try {
    // Intentamos una operación simple
    await prisma.$connect();
    const userCount = await prisma.user.count();
    return NextResponse.json({ 
      status: '✅ Conexión Exitosa', 
      users: userCount,
      db_url: process.env.DATABASE_URL?.split('@')[1] // Solo mostramos el host por seguridad
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: '❌ Error de Conexión', 
      message: error.message,
      code: error.code,
      meta: error.meta
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
