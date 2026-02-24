import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const TELEGRAM_TOKEN = '8757063778:AAE4gHF2ixD6AxZbDoHNfE4xShyYECd-bEY';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || !message.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text.toLowerCase();

    // Comando /start
    if (text === '/start') {
      await sendToTelegram(chatId, '¡Hola! 👋 Soy tu asistente de ChurchFlow. Puedes usar /saldo para ver el estado de las cuentas.');
    }
    // Comando /saldo
    else if (text === '/saldo') {
      const transactions = await prisma.transaction.findMany();
      const transfers = await prisma.transfer.findMany();

      const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      
      const balance = income - expense;

      await sendToTelegram(chatId, `📊 *ESTADO DE CUENTAS*

💰 Balance Total: RD$ ${balance.toLocaleString()}
📈 Ingresos: RD$ ${income.toLocaleString()}
📉 Gastos: RD$ ${expense.toLocaleString()}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error en Webhook de Telegram:', error);
    return NextResponse.json({ ok: true }); // Siempre responder OK a Telegram
  }
}

async function sendToTelegram(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    }),
  });
}
