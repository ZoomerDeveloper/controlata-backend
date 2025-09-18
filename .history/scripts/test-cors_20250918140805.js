const https = require('https');

async function testCORS() {
  const apiUrl = 'https://controlata-production.up.railway.app/api/auth/login';
  const frontendUrl = 'http://admin-art24.online.swtest.ru';
  
  console.log('🧪 Тестируем CORS...');
  console.log(`API: ${apiUrl}`);
  console.log(`Frontend: ${frontendUrl}`);
  console.log('---');
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': frontendUrl,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  };
  
  // Тест OPTIONS запроса (preflight)
  console.log('1️⃣ Тестируем OPTIONS запрос (preflight)...');
  
  const preflightOptions = {
    method: 'OPTIONS',
    headers: {
      'Origin': frontendUrl,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  };
  
  try {
    const preflightResponse = await makeRequest(apiUrl, preflightOptions);
    console.log(`✅ OPTIONS статус: ${preflightResponse.statusCode}`);
    console.log(`   CORS заголовки:`, {
      'Access-Control-Allow-Origin': preflightResponse.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': preflightResponse.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': preflightResponse.headers['access-control-allow-headers'],
      'Access-Control-Allow-Credentials': preflightResponse.headers['access-control-allow-credentials']
    });
  } catch (error) {
    console.log(`❌ OPTIONS ошибка: ${error.message}`);
  }
  
  console.log('---');
  
  // Тест POST запроса
  console.log('2️⃣ Тестируем POST запрос...');
  
  const postOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': frontendUrl
    }
  };
  
  try {
    const postResponse = await makeRequest(apiUrl, postOptions);
    console.log(`✅ POST статус: ${postResponse.statusCode}`);
    console.log(`   CORS заголовки:`, {
      'Access-Control-Allow-Origin': postResponse.headers['access-control-allow-origin'],
      'Access-Control-Allow-Credentials': postResponse.headers['access-control-allow-credentials']
    });
  } catch (error) {
    console.log(`❌ POST ошибка: ${error.message}`);
  }
  
  console.log('---');
  console.log('💡 Если CORS работает, фронтенд должен подключаться к API');
}

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      resolve(res);
    });
    
    req.on('error', reject);
    req.end();
  });
}

testCORS().catch(console.error);
