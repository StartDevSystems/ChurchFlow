import prisma from './prisma';

export async function sendNotification(message: string) {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'system-settings' },
    });

    if (!settings || !settings.webhookUrl) {
      console.log('Notificaciones: No hay URL configurada.');
      return;
    }

    const url = settings.webhookUrl;

    // Si es una URL de Discord
    if (url.includes('discord.com/api/webhooks')) {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });
    } 
    // Si es una URL de Telegram (suponiendo que el usuario pone: https://api.telegram.org/botTOKEN/sendMessage?chat_id=ID)
    else if (url.includes('api.telegram.org')) {
      const connector = url.includes('?') ? '&' : '?';
      const telegramUrl = `${url}${connector}text=${encodeURIComponent(message)}`;
      await fetch(telegramUrl);
    }
    // Webhook genérico
    else {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
    }

    console.log('Notificación enviada con éxito');
  } catch (error) {
    console.error('Error enviando notificación:', error);
  }
}
