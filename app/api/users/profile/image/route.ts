import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ image: null });

  try {
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { image: true }
    });
    return NextResponse.json({ image: user?.image || null });
  } catch (error) {
    return NextResponse.json({ image: null });
  }
}
