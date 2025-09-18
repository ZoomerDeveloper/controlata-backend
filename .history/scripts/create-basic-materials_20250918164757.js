const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createBasicMaterials() {
  try {
    console.log('Создаем базовые материалы...');

    // Создаем базовые материалы
    const materials = [
      { name: 'Холст 20x30', description: 'Холст для маленьких картин', unit: 'шт', category: 'CANVAS' },
      { name: 'Холст 30x40', description: 'Холст для средних картин', unit: 'шт', category: 'CANVAS' },
      { name: 'Холст 40x50', description: 'Холст для больших картин', unit: 'шт', category: 'CANVAS' },
      { name: 'Краски акриловые', description: 'Набор акриловых красок', unit: 'набор', category: 'PAINT' },
      { name: 'Кисти', description: 'Набор кистей для рисования', unit: 'набор', category: 'BRUSH' },
      { name: 'Рамка 20x30', description: 'Рамка для маленьких картин', unit: 'шт', category: 'FRAME' },
      { name: 'Рамка 30x40', description: 'Рамка для средних картин', unit: 'шт', category: 'FRAME' },
      { name: 'Рамка 40x50', description: 'Рамка для больших картин', unit: 'шт', category: 'FRAME' }
    ];

    for (const material of materials) {
      const created = await prisma.material.create({
        data: material
      });
      console.log('✅ Создан материал:', created.name);
    }

    console.log('🎉 Все базовые материалы созданы!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBasicMaterials();
