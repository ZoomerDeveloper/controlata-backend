const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMaterialsToStock() {
  try {
    console.log('Добавляем материалы на склад...');

    // Получаем все материалы
    const materials = await prisma.material.findMany();
    console.log(`Найдено ${materials.length} материалов`);

    for (const material of materials) {
      // Добавляем материал на склад (100 единиц каждого)
      const quantity = 100;
      
      // Создаем или обновляем остаток
      await prisma.stock.upsert({
        where: { materialId: material.id },
        update: {
          quantity: quantity,
          lastUpdated: new Date()
        },
        create: {
          materialId: material.id,
          quantity: quantity,
          minLevel: 10 // Минимальный уровень для заказа
        }
      });

      // Создаем запись о поступлении
      await prisma.materialMovement.create({
        data: {
          materialId: material.id,
          stockId: (await prisma.stock.findUnique({ where: { materialId: material.id } })).id,
          type: 'IN',
          quantity: quantity,
          reason: 'Начальное поступление материалов',
          referenceType: 'MANUAL',
          notes: 'Автоматическое добавление базовых материалов на склад'
        }
      });

      console.log(`✅ Добавлено на склад: ${material.name} - ${quantity} ${material.unit}`);
    }

    console.log('\n🎉 Все материалы добавлены на склад!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMaterialsToStock();
