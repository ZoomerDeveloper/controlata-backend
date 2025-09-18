const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPictureSizes() {
  try {
    console.log('🔍 Проверяем размеры картин в базе данных...');
    
    const pictureSizes = await prisma.pictureSize.findMany({
      select: {
        id: true,
        name: true,
        width: true,
        height: true,
        isActive: true
      }
    });
    
    console.log(`📊 Найдено размеров картин: ${pictureSizes.length}`);
    
    if (pictureSizes.length === 0) {
      console.log('❌ Размеры картин не найдены! Создаем базовые размеры...');
      
      const basicSizes = [
        { name: '20x30 см', width: 20, height: 30, price: 15.00, isActive: true },
        { name: '30x40 см', width: 30, height: 40, price: 25.00, isActive: true },
        { name: '40x50 см', width: 40, height: 50, price: 35.00, isActive: true },
        { name: '50x70 см', width: 50, height: 70, price: 50.00, isActive: true }
      ];
      
      for (const size of basicSizes) {
        const created = await prisma.pictureSize.create({
          data: size
        });
        console.log(`✅ Создан размер: ${created.name} (ID: ${created.id})`);
      }
    } else {
      console.log('📋 Список размеров картин:');
      pictureSizes.forEach(size => {
        console.log(`  - ${size.name} (${size.width}x${size.height} см) - €${size.price} [ID: ${size.id}]`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPictureSizes();
