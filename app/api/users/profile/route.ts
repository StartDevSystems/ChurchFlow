import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from 'bcryptjs';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { image, password, firstName, lastName } = await request.json();
    const updateData: any = {};

    if (image !== undefined) updateData.image = image;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    
    if (password) {
      if (password.length < 4) {
        return NextResponse.json({ error: 'La contraseña es muy corta' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Buscamos por ID (si existe en la sesión) o por Email (respaldo)
    const userId = (session.user as any).id;
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'Email de sesión no encontrado' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: userId ? { id: userId } : { email: userEmail },
      data: updateData
    });

    console.log(`Perfil actualizado para: ${userEmail}`);
    return NextResponse.json({ success: true, user: { email: updatedUser.email, firstName: updatedUser.firstName } });

  } catch (error: any) {
    console.error('Error crítico en Perfil:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    }, { status: 500 });
  }
}
