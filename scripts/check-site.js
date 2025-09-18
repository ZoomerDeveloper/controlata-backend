const https = require('https');
const http = require('http');

async function checkSite(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      console.log(`✅ ${url} - Статус: ${res.statusCode}`);
      console.log(`   Заголовки: ${JSON.stringify(res.headers, null, 2)}`);
      resolve({ success: true, status: res.statusCode });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${url} - Ошибка: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(10000, () => {
      console.log(`⏰ ${url} - Таймаут`);
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function main() {
  const urls = [
    'http://77.222.61.179',
    'https://77.222.61.179',
    'http://admin-art24.online',
    'https://admin-art24.online',
    'http://art24.spaceweb.ru',
    'https://art24.spaceweb.ru'
  ];
  
  console.log('🌐 Проверяем доступность сайта...\n');
  
  for (const url of urls) {
    await checkSite(url);
    console.log('---');
  }
  
  console.log('\n💡 Рекомендации:');
  console.log('1. Если IP работает - проблема в DNS');
  console.log('2. Если IP не работает - проблема в настройках SpaceWeb');
  console.log('3. Настройте домен в панели SpaceWeb');
}

main().catch(console.error);
