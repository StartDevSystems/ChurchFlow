import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { categorySchema } from '@/lib/validations';
import { ZodError } from 'zod';
import { TransactionType } from '@prisma/client';

// GET /api/categories?type=income
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as TransactionType | null;

  try {
    const categories = await prisma.category.findMany({
      where: type ? { type } : {},
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('[CATEGORIES_GET_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/categories
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // 1. VALIDACIÓN ESTRICTA (ZOD)
    const validatedData = categorySchema.parse(body);

    // 2. TRANSACCIÓN ATÓMICA DE BASE DE DATOS
    const result = await prisma.$transaction(async (tx) => {
      // Crear la categoría
      const newCategory = await tx.category.create({
        data: {
          name: validatedData.name,
          type: validatedData.type,
        },
      });

      // Registrar auditoría obligatoria
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email || 'N/A',
          action: 'CREATE',
          entity: 'Category',
          details: `🏷️ Creó categoría: ${validatedData.name} [Tipo: ${validatedData.type}]`
        }
      });

      return newCategory;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ 
        error: 'Validation Error', 
        details: error.errors.map(e => ({ path: e.path, message: e.message })) 
      }, { status: 400 });
    }

    // Manejo específico para nombres duplicados
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'La categoría ya existe para este tipo.' }, { status: 409 });
    }

    console.error('[CATEGORY_CREATE_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
