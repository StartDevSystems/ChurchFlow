import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

interface Params {
  id: string;
}

// GET a single member by ID
export async function GET(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const member = await prisma.member.findUnique({
      where: { id: params.id },
      include: {
        transactions: true, // Include associated transactions
      },
    });
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 });
  }
}

// UPDATE a member by ID
export async function PUT(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { name, phone, role } = await request.json();
    const updatedMember = await prisma.member.update({
      where: { id: params.id },
      data: { name, phone, role },
    });
    return NextResponse.json(updatedMember);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// DELETE a member by ID
export async function DELETE(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    await prisma.member.delete({
      where: { id: params.id },
    });
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    // Handle cases where member has associated transactions
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete member because they have associated transactions.' },
        { status: 409 } // Conflict
      );
    }
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
