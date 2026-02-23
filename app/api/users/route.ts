import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, permissions: true },
      orderBy: { email: 'asc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, role, permissions, password } = await request.json();
    
    // Si se está editando a sí mismo, no permitir quitarse ADMIN
    if (id === session.user.id && role && role !== 'ADMIN') {
      return NextResponse.json({ error: 'No puedes quitarte el rol de administrador a ti mismo' }, { status: 400 });
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    
    // Si se envía contraseña, hay que encriptarla antes de guardar
    if (password) {
      if (password.length < 4) {
        return NextResponse.json({ error: 'La contraseña es muy corta' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, message: 'Usuario actualizado con éxito' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (id === session.user.id) {
      return NextResponse.json({ error: 'No puedes borrar tu propio usuario' }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
