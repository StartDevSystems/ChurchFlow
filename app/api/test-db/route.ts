import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Evita errores durante el build

export async function GET() {
  try {
    const url = process.env.DATABASE_URL || '';
    // Extraer partes de la URL para debug (sin contraseña)
    const match = url.match(/postgresql:\/\/(.*):.*@(.*):(\d+)\/(.*)/);
    const debugInfo = match ? {
      user: match[1],
      host: match[2],
      port: match[3],
      db: match[4]?.split('?')[0],
      hasPgbouncer: url.includes('pgbouncer=true')
    } : 'URL con formato inválido';

    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      status: '✅ Conexión Exitosa', 
      users: userCount,
      connection_debug: debugInfo,
      message: 'La base de datos está respondiendo correctamente.'
    });
  } catch (error: any) {
    console.error('Test-DB Error:', error);
    
    const message = error.message || '';
    let advice = 'Revisa las credenciales.';
    
    if (message.includes('FATAL: password authentication failed')) {
      advice = 'La contraseña es incorrecta. Verifica si los caracteres especiales (@@) están bien codificados como %40%40.';
    } else if (message.includes('FATAL: Tenant or user not found')) {
      advice = 'El usuario debe ser postgres.kydllcrcsmovpvgrsdko para el puerto 6543.';
    } else if (message.includes('ETIMEDOUT') || message.includes('reach database host')) {
      advice = 'No se pudo llegar al servidor. Verifica que el host de la base de datos sea correcto.';
    }
}
