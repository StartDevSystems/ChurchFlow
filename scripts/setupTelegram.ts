import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const webhookUrl = 'https://api.telegram.org/bot8757063778:AAE4gHF2ixD6AxZbDoHNfE4xShyYECd-bEY/sendMessage?chat_id=1283618680';
  
  const settings = await prisma.settings.upsert({
    where: { id: 'system-settings' },
    update: { webhookUrl },
    create: { 
      id: 'system-settings',
      webhookUrl,
      churchName: 'Finanzas Jóvenes',
      churchSubtitle: 'Iglesia Central'
    }
  });

  console.log('✅ Webhook de Telegram configurado con éxito.');
  console.log('URL:', settings.webhookUrl);
}

main()
  .catch((e) => {
    console.error('❌ Error configurando el webhook:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
