import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = process.env.DATABASE_URL || '';
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
    
    const url = process.env.DATABASE_URL || '';
    const match = url.match(/postgresql:\/\/(.*):.*@(.*):(\d+)\/(.*)/);
    const message = error.message || '';
    let advice = 'Revisa las credenciales.';
    
    if (message.includes('password authentication failed')) {
      advice = 'La contraseña es incorrecta. Verifica si los caracteres especiales (@@) están bien codificados como %40%40.';
    } else if (message.includes('Tenant or user not found')) {
      advice = 'El usuario debe ser postgres.kydllcrcsmovpvgrsdko para el puerto 6543.';
    } else if (message.includes('ETIMEDOUT') || message.includes('reach database host')) {
      advice = 'No se pudo llegar al servidor. Verifica que el host de la base de datos sea correcto.';
    }

    return NextResponse.json({ 
      status: '❌ Error de Conexión', 
      message: message,
      advice: advice,
      your_config: match ? {
        user: match[1],
        port: match[3],
        host: match[2]
      } : 'URL no configurada'
    }, { status: 500 });
  }
}
