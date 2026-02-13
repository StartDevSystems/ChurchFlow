import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password with salt rounds

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "USER", // Default role for new registrations
      },
    });

    // Don't return the hashed password in the response
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('Error during user registration:', error);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
