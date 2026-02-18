import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT /api/categories/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // First, find the current category to get its type
    const currentCategory = await prisma.category.findUnique({
      where: { id },
      select: { type: true }, // Only need the type for the check
    });

    if (!currentCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if another category with the same name and type already exists
    const existingCategoryWithSameNameAndType = await prisma.category.findFirst({
      where: {
        name,
        type: currentCategory.type,
        id: { not: id }, // Exclude the current category itself
      },
    });

    if (existingCategoryWithSameNameAndType) {
      return NextResponse.json(
        { error: 'A category with this name already exists for this type.' },
        { status: 409 } // 409 Conflict
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error(`Error updating category ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE /api/categories/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;

    // Safety check: ensure the category is not being used by any transactions
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete a category that is currently in use by ${transactionCount} transaction(s).` },
        { status: 409 } // 409 Conflict
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error(`Error deleting category ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
