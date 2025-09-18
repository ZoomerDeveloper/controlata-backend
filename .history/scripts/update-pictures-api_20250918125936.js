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

// Функция для обновления картины через PATCH запрос
async function updatePicture(pictureId, updateData) {
  try {
    const response = await axios.patch(`${CONFIG.API_BASE_URL}/pictures/${pictureId}`, updateData, {
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
  console.log('🚀 Начинаем обновление картин с изображениями...\n');

  // Получаем все картины
  const pictures = await getAllPictures();
  console.log(`📋 Найдено ${pictures.length} картин для обновления\n`);

  if (pictures.length === 0) {
    console.log('❌ Картины не найдены');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  // Обрабатываем каждую картину
  for (const picture of pictures) {
    // Извлекаем URL изображения из заметок
    const notes = picture.notes || '';
    const imageUrlMatch = notes.match(/Изображение: (https:\/\/[^\s]+)/);
    
    if (imageUrlMatch) {
      const imageUrl = imageUrlMatch[1];
      console.log(`🖼️  Обновляем "${picture.name}" с изображением...`);
      
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
      errorCount++;
    }
  }

  console.log('\n📊 Итоговая статистика:');
  console.log(`✅ Успешно обновлено: ${successCount}`);
  console.log(`❌ Ошибок: ${errorCount}`);
  console.log(`📈 Общий процент успеха: ${((successCount / pictures.length) * 100).toFixed(1)}%\n`);

  console.log('🎉 Обновление завершено!');
}

// Запускаем скрипт
main().catch(console.error);
