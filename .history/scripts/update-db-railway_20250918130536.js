const { PrismaClient } = require('@prisma/client');

// Используем DATABASE_PUBLIC_URL для Railway
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_PUBLIC_URL || 'postgresql://postgres:password@localhost:5432/controlata_db'
    }
  }
});

async function updateDatabase() {
  try {
    console.log('🔄 Обновляем базу данных...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Проверяем, есть ли поле imageUrl в таблице pictures
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pictures' AND column_name = 'imageUrl'
    `;
    
    if (result.length === 0) {
      console.log('🔧 Добавляем поле imageUrl в таблицу pictures...');
      
      // Добавляем поле imageUrl
      await prisma.$executeRaw`
        ALTER TABLE pictures ADD COLUMN "imageUrl" TEXT;
      `;
      
      console.log('✅ Поле imageUrl добавлено');
    } else {
      console.log('✅ Поле imageUrl уже существует');
    }
    
    // Проверяем, что поле добавлено
    const checkResult = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pictures' AND column_name = 'imageUrl'
    `;
    
    console.log('📋 Результат проверки:', checkResult);
    
    console.log('🎉 База данных успешно обновлена!');
    
  } catch (error) {
    console.error('❌ Ошибка обновления базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDatabase();
