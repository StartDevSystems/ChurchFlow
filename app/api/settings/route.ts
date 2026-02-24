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
        webhookUrl: '',
        calculatorName: 'Calculadora Bendecida',
        whatsappMessageTemplate: 'Hola {nombre}! 👋 Te escribo de la Iglesia para recordarte que para el mes de {mes} faltan {monto} de tu cuota. ¡Dios te bendiga!'
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // 🛡️ Seguridad: Solo ADMIN puede modificar los ajustes
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Extraer solo los campos válidos para el modelo Settings
    const { 
      churchName, churchSubtitle, currencySymbol, logoUrl, 
      monthlyGoal, primaryColor, themeMode, reportSignatureName, 
      reportFooterText, allowPublicRegistration, generalFundName, 
      lowBalanceAlert, webhookUrl, whatsappMessageTemplate, calculatorName
    } = body;

    const settingsData = {
      churchName,
      churchSubtitle,
      currencySymbol,
      logoUrl,
      monthlyGoal: parseFloat(monthlyGoal) || 0,
      primaryColor,
      themeMode,
      reportSignatureName,
      reportFooterText,
      allowPublicRegistration: Boolean(allowPublicRegistration),
      generalFundName,
      lowBalanceAlert: parseFloat(lowBalanceAlert) || 0,
      webhookUrl,
      whatsappMessageTemplate,
      calculatorName
    };
    
    const settings = await prisma.settings.upsert({
      where: { id: 'system-settings' },
      update: settingsData,
      create: {
        id: 'system-settings',
        ...settingsData
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Settings PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
