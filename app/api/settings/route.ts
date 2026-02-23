import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'system-settings' },
    });

    if (!settings) {
      return NextResponse.json({
        churchName: 'Finanzas Jóvenes',
        churchSubtitle: 'Iglesia Central',
        currencySymbol: 'RD$',
        logoUrl: '/logo de los jovenes.jpeg',
        monthlyGoal: 0,
        primaryColor: '#e85d26',
        themeMode: 'system',
        reportSignatureName: '',
        reportFooterText: 'Dios les bendiga.',
        allowPublicRegistration: true,
        generalFundName: 'Caja General',
        lowBalanceAlert: 1000,
        webhookUrl: ''
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // 🛡️ Seguridad: Solo ADMIN puede modificar los ajustes
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    const settings = await prisma.settings.upsert({
      where: { id: 'system-settings' },
      update: {
        ...body,
        monthlyGoal: parseFloat(body.monthlyGoal) || 0,
        lowBalanceAlert: parseFloat(body.lowBalanceAlert) || 0,
      },
      create: {
        id: 'system-settings',
        ...body,
        monthlyGoal: parseFloat(body.monthlyGoal) || 0,
        lowBalanceAlert: parseFloat(body.lowBalanceAlert) || 0,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Settings PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
