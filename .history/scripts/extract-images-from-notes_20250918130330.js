const axios = require('axios');

// Конфигурация
const CONFIG = {
  API_BASE_URL: 'https://controlata-production.up.railway.app/api',
  AUTH_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZvamtpdHQwMDAwNXFsMzdyaG9jNHRwIiwiZW1haWwiOiJhZG1pbkBjb250cm9sYXRhLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1ODE0ODc0NywiZXhwIjoxNzU4NzUzNTQ3fQ.rB4hhJXvfMwcgBFS99V_0TFElFlwW97xwtaGPyHcJNY'
};

// Функция для получения всех картин
async function getAllPictures() {
  try {
    const response = await axios.get(`${CONFIG.API_BASE_URL}/pictures`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.pictures || [];
  } catch (error) {
    console.error('Ошибка получения картин:', error.response?.data || error.message);
    return [];
  }
}

// Функция для извлечения URL изображения из заметок
function extractImageUrl(notes) {
  if (!notes) return null;
  
  // Ищем паттерн "Изображение: URL"
  const match = notes.match(/Изображение: (https:\/\/[^\s]+)/);
  return match ? match[1] : null;
}

// Функция для обновления картины через PUT запрос
async function updatePicture(pictureId, updateData) {
  try {
    const response = await axios.put(`${CONFIG.API_BASE_URL}/pictures/${pictureId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Ошибка обновления картины ${pictureId}:`, error.response?.data || error.message);
    return null;
  }
}

// Основная функция
async function main() {
  console.log('🚀 Начинаем извлечение изображений из заметок...\n');

  // Получаем все картины
  const pictures = await getAllPictures();
  console.log(`📋 Найдено ${pictures.length} картин для обработки\n`);

  if (pictures.length === 0) {
    console.log('❌ Картины не найдены');
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  let noImageCount = 0;

  // Обрабатываем каждую картину
  for (const picture of pictures) {
    // Извлекаем URL изображения из заметок
    const imageUrl = extractImageUrl(picture.notes);
    
    if (imageUrl) {
      console.log(`🖼️  Обновляем "${picture.name}" с изображением...`);
      console.log(`   URL: ${imageUrl}`);
      
      // Обновляем картину с imageUrl
      const result = await updatePicture(picture.id, { imageUrl });
      if (result) {
        console.log(`✅ ${picture.name} - обновлена`);
        successCount++;
      } else {
        console.log(`❌ ${picture.name} - ошибка обновления`);
        errorCount++;
      }
    } else {
      console.log(`⚠️  ${picture.name} - URL изображения не найден в заметках`);
      noImageCount++;
    }
  }

  console.log('\n📊 Итоговая статистика:');
  console.log(`✅ Успешно обновлено: ${successCount}`);
  console.log(`❌ Ошибок: ${errorCount}`);
  console.log(`⚠️  Без изображений: ${noImageCount}`);
  console.log(`📈 Общий процент успеха: ${((successCount / pictures.length) * 100).toFixed(1)}%\n`);

  console.log('🎉 Обработка завершена!');
}

// Запускаем скрипт
main().catch(console.error);
