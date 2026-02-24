const TOKEN = '8757063778:AAE4gHF2ixD6AxZbDoHNfE4xShyYECd-bEY';
const WEBHOOK_URL = 'https://web-iglesia.vercel.app/api/telegram'; // Asumiendo tu URL de Vercel

async function setup() {
  const url = `https://api.telegram.org/bot${TOKEN}/setWebhook?url=${WEBHOOK_URL}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log('Resultado de setWebhook:', data);
}

setup();
