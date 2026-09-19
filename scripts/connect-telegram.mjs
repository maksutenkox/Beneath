// Operator-only setup. Never import this script into the Mini App.
const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.MINI_APP_URL || 'https://beneath-byz.pages.dev/';
if (!token) throw new Error('Set TELEGRAM_BOT_TOKEN in the local process environment.');
if (new URL(appUrl).protocol !== 'https:') throw new Error('Mini App URL must use HTTPS.');
async function call(method, body = {}) {
  let response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body), signal: AbortSignal.timeout(15000)
    });
  } catch { throw new Error(`Telegram ${method}: connection failed (credentials redacted)`); }
  const data = await response.json();
  if (!data.ok) throw new Error(`Telegram ${method}: HTTP ${response.status}`);
  return data.result;
}
try {
  const bot = await call('getMe');
  const menu_button = {type:'web_app', text:'Play BELOW PROTOCOL', web_app:{url:appUrl}};
  const accepted = await call('setChatMenuButton', {menu_button});
  const actual = await call('getChatMenuButton');
  console.log(JSON.stringify({bot:bot.username, accepted, actual}, null, 2));
  if(actual.type !== 'web_app' || actual.web_app?.url !== appUrl) {
    throw new Error('Telegram accepted the request but read-back does not match. Connection is not verified.');
  }
} catch(error) { console.error(error.message); process.exitCode=1; }
