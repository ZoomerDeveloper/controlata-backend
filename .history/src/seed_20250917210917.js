const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Создаем администратора
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@controlata.com' },
    update: {},
    create: {
      email: 'admin@controlata.com',
      password: hashedPassword,
      name: 'Администратор',
      role: 'ADMIN'
    }
  });

  console.log('✅ Администратор создан:', admin.email);

  // Создаем размеры картин
  const pictureSizes = [
    {
      name: 'A4',
      width: 21.0,
      height: 29.7,
      description: 'Стандартный размер A4'
    },
    {
      name: 'A3',
      width: 29.7,
      height: 42.0,
      description: 'Стандартный размер A3'
    },
    {
      name: '30x40',
      width: 30.0,
      height: 40.0,
      description: 'Популярный размер для картин'
    },
    {
      name: '40x50',
      width: 40.0,
      height: 50.0,
      description: 'Большой размер для детальных картин'
    }
  ];

  for (const size of pictureSizes) {
    const pictureSize = await prisma.pictureSize.upsert({
      where: { name: size.name },
      update: {},
      create: size
    });
    console.log('✅ Размер картины создан:', pictureSize.name);
  }

  // Создаем базовые материалы
  const materials = [
    {
      name: 'Холст A4',
      description: 'Холст для картин размера A4',
      unit: 'шт',
      category: 'CANVAS',
      pictureSizeId: (await prisma.pictureSize.findUnique({ where: { name: 'A4' } })).id
    },
    {
      name: 'Холст A3',
      description: 'Холст для картин размера A3',
      unit: 'шт',
      category: 'CANVAS',
      pictureSizeId: (await prisma.pictureSize.findUnique({ where: { name: 'A3' } })).id
    },
    {
      name: 'Краска акриловая белая',
      description: 'Белая акриловая краска',
      unit: 'мл',
      category: 'PAINT'
    },
    {
      name: 'Краска акриловая черная',
      description: 'Черная акриловая краска',
      unit: 'мл',
      category: 'PAINT'
    },
    {
      name: 'Кисть тонкая',
      description: 'Тонкая кисть для детальной работы',
      unit: 'шт',
      category: 'BRUSH'
    },
    {
      name: 'Кисть средняя',
      description: 'Средняя кисть для закрашивания',
      unit: 'шт',
      category: 'BRUSH'
    },
    {
      name: 'Рамка деревянная A4',
      description: 'Деревянная рамка для A4',
      unit: 'шт',
      category: 'FRAME',
      pictureSizeId: (await prisma.pictureSize.findUnique({ where: { name: 'A4' } })).id
    },
    {
      name: 'Номера для картин',
      description: 'Номера для нанесения на картины',
      unit: 'шт',
      category: 'NUMBER'
    },
    {
      name: 'Упаковочная пленка',
      description: 'Пленка для упаковки готовых картин',
      unit: 'м',
      category: 'PACKAGING'
    }
  ];

  for (const material of materials) {
    const createdMaterial = await prisma.material.upsert({
      where: { name: material.name },
      update: {},
      create: material
    });
    console.log('✅ Материал создан:', createdMaterial.name);

    // Создаем складской остаток для материала
    await prisma.stock.upsert({
      where: { materialId: createdMaterial.id },
      update: {},
      create: {
        materialId: createdMaterial.id,
        quantity: 0,
        minLevel: 10
      }
    });
  }

  console.log('🎉 База данных успешно заполнена!');
  console.log('📧 Логин администратора: admin@controlata.com');
  console.log('🔑 Пароль: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
