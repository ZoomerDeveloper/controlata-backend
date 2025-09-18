const axios = require('axios');

// Конфигурация
const CONFIG = {
  API_BASE_URL: 'https://controlata-production.up.railway.app/api',
  AUTH_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZvamtpdHQwMDAwNXFsMzdyaG9jNHRwIiwiZW1haWwiOiJhZG1pbkBjb250cm9sYXRhLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1ODE0ODc0NywiZXhwIjoxNzU4NzUzNTQ3fQ.rB4hhJXvfMwcgBFS99V_0TFElFlwW97xwtaGPyHcJNY'
};

// Функция для тестирования API склада
async function testWarehouseAPI() {
  console.log('🧪 Тестируем API склада...\n');

  try {
    // Тест 1: Получить статистику склада
    console.log('1️⃣ Тестируем получение статистики склада...');
    const statsResponse = await axios.get(`${CONFIG.API_BASE_URL}/warehouse/stats`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Статистика склада:', statsResponse.data);
  } catch (error) {
    console.log('❌ Ошибка получения статистики:', error.response?.data || error.message);
  }

  try {
    // Тест 2: Получить материалы с остатками
    console.log('\n2️⃣ Тестируем получение материалов с остатками...');
    const materialsResponse = await axios.get(`${CONFIG.API_BASE_URL}/warehouse/materials`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Материалы с остатками:', materialsResponse.data);
  } catch (error) {
    console.log('❌ Ошибка получения материалов:', error.response?.data || error.message);
  }

  try {
    // Тест 3: Получить материалы с низким остатком
    console.log('\n3️⃣ Тестируем получение материалов с низким остатком...');
    const lowStockResponse = await axios.get(`${CONFIG.API_BASE_URL}/warehouse/materials/low-stock`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Материалы с низким остатком:', lowStockResponse.data);
  } catch (error) {
    console.log('❌ Ошибка получения материалов с низким остатком:', error.response?.data || error.message);
  }

  try {
    // Тест 4: Получить все движения материалов
    console.log('\n4️⃣ Тестируем получение всех движений материалов...');
    const movementsResponse = await axios.get(`${CONFIG.API_BASE_URL}/warehouse/movements`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Движения материалов:', movementsResponse.data);
  } catch (error) {
    console.log('❌ Ошибка получения движений:', error.response?.data || error.message);
  }

  console.log('\n🎉 Тестирование API склада завершено!');
}

// Запускаем тест
testWarehouseAPI().catch(console.error);
