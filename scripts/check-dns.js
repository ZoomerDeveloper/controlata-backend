const dns = require('dns');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

async function checkDomain(domain) {
  console.log(`🔍 Проверяем домен: ${domain}`);
  
  try {
    // Проверяем A записи
    const addresses = await resolve4(domain);
    console.log(`✅ A записи найдены: ${addresses.join(', ')}`);
    
    // Проверяем, что IP соответствует SpaceWeb
    const spacewebIPs = ['77.222.61.179', '77.222.61.180', '77.222.61.181'];
    const isSpaceweb = addresses.some(ip => spacewebIPs.includes(ip));
    
    if (isSpaceweb) {
      console.log('✅ Домен указывает на SpaceWeb');
    } else {
      console.log('⚠️ Домен не указывает на SpaceWeb');
    }
    
  } catch (error) {
    console.log(`❌ Ошибка DNS: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Возможные причины:');
      console.log('   - Домен не настроен');
      console.log('   - DNS еще не обновился');
      console.log('   - Неправильное имя домена');
    }
  }
  
  try {
    // Проверяем CNAME записи
    const cnames = await resolveCname(domain);
    console.log(`📋 CNAME записи: ${cnames.join(', ')}`);
  } catch (error) {
    // CNAME может не существовать, это нормально
  }
}

async function main() {
  const domains = [
    'admin-art24.online',
    'art24.online',
    'www.art24.online',
    'art24.spaceweb.ru'
  ];
  
  console.log('🌐 Проверяем DNS записи...\n');
  
  for (const domain of domains) {
    await checkDomain(domain);
    console.log('---');
  }
  
  console.log('\n💡 Рекомендации:');
  console.log('1. Проверьте в панели SpaceWeb, какой домен настроен');
  console.log('2. Убедитесь, что DNS записи обновились (может занять до 24 часов)');
  console.log('3. Попробуйте использовать поддомен spaceweb.ru');
}

main().catch(console.error);
