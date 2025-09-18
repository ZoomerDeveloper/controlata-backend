const { PrismaClient } = require('@prisma/client');
const pictureMaterialService = require('../src/services/pictureMaterialService');

const prisma = new PrismaClient();

async function addMaterialsToCustomPictures() {
  try {
    console.log('🔍 Ищем картины по фото без материалов...');

    // Находим все картины по фото без материалов
    const customPictures = await prisma.picture.findMany({
      where: {
        type: 'CUSTOM_PHOTO',
        materials: {
          none: {}
        }
      },
      include: {
        pictureSize: true
      }
    });

    console.log(`📊 Найдено ${customPictures.length} картин по фото без материалов`);

    if (customPictures.length === 0) {
      console.log('✅ Все картины по фото уже имеют материалы');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const picture of customPictures) {
      try {
        console.log(`🔧 Добавляем материалы для картины: ${picture.name} (${picture.id})`);
        
        await pictureMaterialService.createStandardMaterialsForPicture(
          picture.id,
          picture.pictureSizeId,
          'CUSTOM_PHOTO'
        );

        successCount++;
        console.log(`✅ Материалы добавлены для картины: ${picture.name}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Ошибка добавления материалов для картины ${picture.name}:`, error.message);
      }
    }

    console.log('\n📊 Результаты:');
    console.log(`✅ Успешно обработано: ${successCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    console.log(`📈 Всего картин: ${customPictures.length}`);

  } catch (error) {
    console.error('❌ Ошибка выполнения скрипта:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт
addMaterialsToCustomPictures();
