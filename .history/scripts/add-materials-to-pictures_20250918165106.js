const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMaterialsToPictures() {
  try {
    console.log('Добавляем материалы к готовым картинам...');

    // Получаем все готовые картины
    const readyMadePictures = await prisma.picture.findMany({
      where: { type: 'READY_MADE' },
      include: {
        pictureSize: true
      }
    });

    console.log(`Найдено ${readyMadePictures.length} готовых картин`);

    // Получаем материалы
    const materials = await prisma.material.findMany();
    console.log(`Найдено ${materials.length} материалов`);

    for (const picture of readyMadePictures) {
      console.log(`\nОбрабатываем картину: ${picture.name}`);

      // Определяем размер картины и добавляем соответствующие материалы
      let canvasMaterial, frameMaterial;
      
      if (picture.pictureSize?.name === 'small' || picture.name.includes('20x30')) {
        canvasMaterial = materials.find(m => m.name === 'Холст 20x30');
        frameMaterial = materials.find(m => m.name === 'Рамка 20x30');
      } else if (picture.pictureSize?.name === 'medium' || picture.name.includes('30x40')) {
        canvasMaterial = materials.find(m => m.name === 'Холст 30x40');
        frameMaterial = materials.find(m => m.name === 'Рамка 30x40');
      } else if (picture.pictureSize?.name === 'large' || picture.name.includes('40x50')) {
        canvasMaterial = materials.find(m => m.name === 'Холст 40x50');
        frameMaterial = materials.find(m => m.name === 'Рамка 40x50');
      } else {
        // По умолчанию средний размер
        canvasMaterial = materials.find(m => m.name === 'Холст 30x40');
        frameMaterial = materials.find(m => m.name === 'Рамка 30x40');
      }

      const paintMaterial = materials.find(m => m.name === 'Краски акриловые');
      const brushMaterial = materials.find(m => m.name === 'Кисти');

      // Добавляем материалы к картине
      const pictureMaterials = [
        { materialId: canvasMaterial?.id, quantity: 1 },
        { materialId: frameMaterial?.id, quantity: 1 },
        { materialId: paintMaterial?.id, quantity: 1 },
        { materialId: brushMaterial?.id, quantity: 1 }
      ].filter(pm => pm.materialId); // Убираем undefined

      for (const pm of pictureMaterials) {
        await prisma.pictureMaterial.create({
          data: {
            pictureId: picture.id,
            materialId: pm.materialId,
            quantity: pm.quantity
          }
        });
        console.log(`  ✅ Добавлен материал: ${materials.find(m => m.id === pm.materialId)?.name}`);
      }
    }

    console.log('\n🎉 Материалы добавлены ко всем готовым картинам!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMaterialsToPictures();
