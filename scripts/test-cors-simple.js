const https = require('https');

async function testCORS() {
  const apiUrl = 'https://controlata-production.up.railway.app/api/auth/login';
  const frontendUrl = 'http://admin-art24.online.swtest.ru';
  
  console.log('🧪 Тестируем CORS с вашим доменом...');
  console.log(`API: ${apiUrl}`);
  console.log(`Frontend: ${frontendUrl}`);
  console.log('---');
  
  // Тест OPTIONS запроса (preflight)
  console.log('1️⃣ Тестируем OPTIONS запрос...');
  
  const options = {
    method: 'OPTIONS',
    headers: {
      'Origin': frontendUrl,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  };
  
  try {
    const response = await makeRequest(apiUrl, options);
    console.log(`✅ OPTIONS статус: ${response.statusCode}`);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers'],
      'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials']
    };
    
    console.log('   CORS заголовки:');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      console.log(`   ${key}: ${value || 'НЕТ'}`);
    });
    
    if (corsHeaders['Access-Control-Allow-Origin'] === frontendUrl || 
        corsHeaders['Access-Control-Allow-Origin'] === '*') {
      console.log('✅ CORS настроен правильно!');
    } else {
      console.log('❌ CORS не настроен для вашего домена');
    }
    
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
    const response = await makeRequest(apiUrl, postOptions);
    console.log(`✅ POST статус: ${response.statusCode}`);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials']
    };
    
    console.log('   CORS заголовки:');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      console.log(`   ${key}: ${value || 'НЕТ'}`);
    });
    
  } catch (error) {
    console.log(`❌ POST ошибка: ${error.message}`);
  }
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
