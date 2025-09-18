const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const axios = require('axios');
const xml2js = require('xml2js');

// Конфигурация
const CONFIG = {
  YAML_FILE: path.join(__dirname, '../pictures/store.yml'),
  API_BASE_URL: 'https://controlata-production.up.railway.app/api',
  AUTH_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZvamtpdHQwMDAwNXFsMzdyaG9jNHRwIiwiZW1haWwiOiJhZG1pbkBjb250cm9sYXRhLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1ODE0ODc0NywiZXhwIjoxNzU4NzUzNTQ3fQ.rB4hhJXvfMwcgBFS99V_0TFElFlwW97xwtaGPyHcJNY',
  RUSSIAN_CATEGORY_ID: '761485905622',
  DEFAULT_PICTURE_SIZE_ID: 'cmfojkjym00015ql328ck55an', // 50x40 см
  BATCH_SIZE: 10,
  DELAY_BETWEEN_BATCHES: 1000 // 1 секунда
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
  if (!data || !data.yml_catalog || !data.yml_catalog.shop || !data.yml_catalog.shop[0] || !data.yml_catalog.shop[0].offers) {
    console.error('Неверная структура XML файла');
    return [];
  }

  const offers = data.yml_catalog.shop[0].offers[0].offer;
  const russianPictures = [];

  for (const offer of offers) {
    if (offer.categoryId && offer.categoryId[0] === CONFIG.RUSSIAN_CATEGORY_ID) {
      russianPictures.push({
        id: offer.$.id,
        name: offer.name[0],
        vendorCode: offer.vendorCode[0],
        picture: offer.picture[0],
        url: offer.url[0],
        price: parseFloat(offer.price[0]),
        currencyId: offer.currencyId[0],
        dimensions: offer.dimensions[0]
      });
    }
  }

  return russianPictures;
}

// Функция для создания картины через API
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
        notes: `URL: ${picture.url}\nИзображение: ${picture.picture}\nРазмеры: ${picture.dimensions}`
      },
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Ошибка создания картины "${picture.name}":`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// Функция для задержки
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Основная функция импорта
async function importPictures() {
  console.log('🚀 Начинаем импорт русских картин...\n');

  // Парсим YAML файл
  console.log('📖 Парсим YAML файл...');
  const yamlData = parseYAMLFile();
  if (!yamlData) {
    console.error('❌ Не удалось распарсить YAML файл');
    return;
  }

  // Извлекаем русские картины
  console.log('🔍 Извлекаем русские картины...');
  const russianPictures = extractRussianPictures(yamlData);
  console.log(`✅ Найдено ${russianPictures.length} русских картин\n`);

  if (russianPictures.length === 0) {
    console.log('❌ Русские картины не найдены');
    return;
  }

  // Показываем первые несколько картин для проверки
  console.log('📋 Первые 5 картин для импорта:');
  russianPictures.slice(0, 5).forEach((pic, index) => {
    console.log(`${index + 1}. ${pic.name} - €${pic.price}`);
  });
  console.log('...\n');

  // Импортируем картины батчами
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < russianPictures.length; i += CONFIG.BATCH_SIZE) {
    const batch = russianPictures.slice(i, i + CONFIG.BATCH_SIZE);
    console.log(`📦 Обрабатываем батч ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}/${Math.ceil(russianPictures.length / CONFIG.BATCH_SIZE)} (${batch.length} картин)...`);

    for (const picture of batch) {
      const result = await createPicture(picture);
      if (result.success) {
        successCount++;
        console.log(`✅ ${picture.name} - создана`);
      } else {
        errorCount++;
        errors.push({ picture: picture.name, error: result.error });
        console.log(`❌ ${picture.name} - ошибка: ${JSON.stringify(result.error)}`);
      }
    }

    // Задержка между батчами
    if (i + CONFIG.BATCH_SIZE < russianPictures.length) {
      console.log(`⏳ Ожидание ${CONFIG.DELAY_BETWEEN_BATCHES}ms перед следующим батчем...\n`);
      await delay(CONFIG.DELAY_BETWEEN_BATCHES);
    }
  }

  // Итоговая статистика
  console.log('\n📊 Итоговая статистика:');
  console.log(`✅ Успешно импортировано: ${successCount}`);
  console.log(`❌ Ошибок: ${errorCount}`);
  console.log(`📈 Общий процент успеха: ${((successCount / russianPictures.length) * 100).toFixed(1)}%`);

  if (errors.length > 0) {
    console.log('\n❌ Ошибки:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.picture}: ${JSON.stringify(error.error)}`);
    });
  }

  console.log('\n🎉 Импорт завершен!');
}

// Запускаем импорт
if (require.main === module) {
  importPictures().catch(console.error);
}

module.exports = { importPictures, extractRussianPictures, parseYAMLFile };
