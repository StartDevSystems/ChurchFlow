import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'Michaelcs1093@gmail.com';
  const newPassword = '123456';
  
  console.log('🔐 Intentando resetear contraseña para: ' + email);

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { email: email },
      data: { password: hashedPassword },
    });

    console.log('✅ ¡Contraseña actualizada con éxito!');
    console.log('📧 Usuario: ' + email);
    console.log('🔑 Nueva contraseña: ' + newPassword);
    
  } catch (error) {
    console.error('❌ Error al actualizar la contraseña:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
