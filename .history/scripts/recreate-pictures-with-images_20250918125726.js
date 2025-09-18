const fs = require('fs');
const path = require('path');
const axios = require('axios');
const xml2js = require('xml2js');

// Конфигурация
const CONFIG = {
  YAML_FILE: path.join(__dirname, '../pictures/store.yml'),
  API_BASE_URL: 'https://controlata-production.up.railway.app/api',
  AUTH_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZvamtpdHQwMDAwNXFsMzdyaG9jNHRwIiwiZW1haWwiOiJhZG1pbkBjb250cm9sYXRhLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1ODE0ODc0NywiZXhwIjoxNzU4NzUzNTQ3fQ.rB4hhJXvfMwcgBFS99V_0TFElFlwW97xwtaGPyHcJNY',
  RUSSIAN_CATEGORY_ID: '761485905622',
  DEFAULT_PICTURE_SIZE_ID: 'cmfojkjym00015ql328ck55an',
  BATCH_SIZE: 10,
  DELAY_BETWEEN_BATCHES: 1000
};

// Функция для парсинга XML файла
async function parseXMLFile() {
  try {
    const fileContent = fs.readFileSync(CONFIG.YAML_FILE, 'utf8');
    const parser = new xml2js.Parser();
    const data = await parser.parseStringPromise(fileContent);
    return data;
  } catch (error) {
    console.error('Ошибка парсинга XML файла:', error);
    return null;
  }
}

// Функция для извлечения русских картин
function extractRussianPictures(data) {
  try {
    const offers = data.yml_catalog.shop[0].offers[0].offer;
    const russianPictures = offers.filter(offer => 
      offer.categoryId && offer.categoryId[0] === CONFIG.RUSSIAN_CATEGORY_ID
    );

    return russianPictures.map(offer => ({
      name: offer.name?.[0] || 'Без названия',
      vendorCode: offer.vendorCode?.[0] || '',
      picture: offer.picture?.[0] || '',
      url: offer.url?.[0] || '',
      price: parseFloat(offer.price?.[0]) || 0,
      dimensions: offer.dimensions?.[0] || '',
      categoryId: offer.categoryId?.[0] || ''
    }));
  } catch (error) {
    console.error('Ошибка извлечения картин:', error);
    return [];
  }
}

// Функция для удаления всех существующих картин
async function deleteAllPictures() {
  try {
    console.log('🗑️  Удаляем все существующие картины...');
    
    // Получаем все картины
    const response = await axios.get(`${CONFIG.API_BASE_URL}/pictures`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const pictures = response.data.pictures || [];
    console.log(`📋 Найдено ${pictures.length} картин для удаления`);

    // Удаляем каждую картину
    for (const picture of pictures) {
      try {
        await axios.delete(`${CONFIG.API_BASE_URL}/pictures/${picture.id}`, {
          headers: {
            'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`✅ Удалена: ${picture.name}`);
      } catch (error) {
        console.log(`❌ Ошибка удаления ${picture.name}:`, error.response?.data || error.message);
      }
    }

    console.log('✅ Все картины удалены\n');
  } catch (error) {
    console.error('Ошибка удаления картин:', error.response?.data || error.message);
  }
}

// Функция для создания картины
async function createPicture(picture) {
  try {
    const response = await axios.post(
      `${CONFIG.API_BASE_URL}/pictures`,
      {
        name: picture.name,
        type: 'READY_MADE',
        pictureSizeId: CONFIG.DEFAULT_PICTURE_SIZE_ID,
        price: picture.price,
        description: `Импортировано из каталога. Код: ${picture.vendorCode}`,
        notes: `URL: ${picture.url}\nРазмеры: ${picture.dimensions}`,
        imageUrl: picture.picture
      },
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Ошибка создания картины "${picture.name}":`, error.response?.data || error.message);
    return null;
  }
}

// Основная функция
async function main() {
  console.log('🚀 Начинаем пересоздание картин с изображениями...\n');

  // Удаляем все существующие картины
  await deleteAllPictures();

  // Парсим XML файл
  console.log('📖 Парсим XML файл...');
  const data = await parseXMLFile();
  if (!data) {
    console.log('❌ Не удалось распарсить XML файл');
    return;
  }

  // Извлекаем русские картины
  console.log('🔍 Извлекаем русские картины...');
  const russianPictures = extractRussianPictures(data);
  console.log(`✅ Найдено ${russianPictures.length} русских картин\n`);

  if (russianPictures.length === 0) {
    console.log('❌ Русские картины не найдены');
    return;
  }

  // Показываем первые 5 картин
  console.log('📋 Первые 5 картин для создания:');
  russianPictures.slice(0, 5).forEach((picture, index) => {
    console.log(`${index + 1}. ${picture.name} - €${picture.price}`);
  });
  console.log('...\n');

  let successCount = 0;
  let errorCount = 0;

  // Обрабатываем картины батчами
  for (let i = 0; i < russianPictures.length; i += CONFIG.BATCH_SIZE) {
    const batch = russianPictures.slice(i, i + CONFIG.BATCH_SIZE);
    const batchNumber = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(russianPictures.length / CONFIG.BATCH_SIZE);

    console.log(`📦 Обрабатываем батч ${batchNumber}/${totalBatches} (${batch.length} картин)...`);

    for (const picture of batch) {
      const result = await createPicture(picture);
      if (result) {
        console.log(`✅ ${picture.name} - создана`);
        successCount++;
      } else {
        console.log(`❌ ${picture.name} - ошибка создания`);
        errorCount++;
      }
    }

    // Задержка между батчами
    if (i + CONFIG.BATCH_SIZE < russianPictures.length) {
      console.log(`⏳ Ожидание ${CONFIG.DELAY_BETWEEN_BATCHES}ms перед следующим батчем...\n`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
    }
  }

  console.log('\n📊 Итоговая статистика:');
  console.log(`✅ Успешно создано: ${successCount}`);
  console.log(`❌ Ошибок: ${errorCount}`);
  console.log(`📈 Общий процент успеха: ${((successCount / russianPictures.length) * 100).toFixed(1)}%\n`);

  console.log('🎉 Пересоздание завершено!');
}

// Запускаем скрипт
main().catch(console.error);

