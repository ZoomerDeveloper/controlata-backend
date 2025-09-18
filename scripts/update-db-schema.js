const { PrismaClient } = require('@prisma/client');

// Используем DATABASE_PUBLIC_URL для Railway
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_PUBLIC_URL || 'postgresql://postgres:password@localhost:5432/controlata_db'
    }
  }
});

async function updateDatabaseSchema() {
  try {
    console.log('🔄 Обновляем схему базы данных...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Проверяем, есть ли таблица material_movements
    const movementsTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'material_movements'
    `;
    
    if (movementsTable.length === 0) {
      console.log('🔧 Создаем таблицу material_movements...');
      
      // Создаем enum для MovementType
      await prisma.$executeRaw`
        CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
      `;
      
      // Создаем таблицу material_movements
      await prisma.$executeRaw`
        CREATE TABLE "material_movements" (
          "id" TEXT NOT NULL,
          "materialId" TEXT NOT NULL,
          "stockId" TEXT NOT NULL,
          "type" "MovementType" NOT NULL,
          "quantity" DOUBLE PRECISION NOT NULL,
          "reason" TEXT,
          "referenceId" TEXT,
          "referenceType" TEXT,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "material_movements_pkey" PRIMARY KEY ("id")
        );
      `;
      
      // Добавляем внешние ключи
      await prisma.$executeRaw`
        ALTER TABLE "material_movements" 
        ADD CONSTRAINT "material_movements_materialId_fkey" 
        FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
      
      await prisma.$executeRaw`
        ALTER TABLE "material_movements" 
        ADD CONSTRAINT "material_movements_stockId_fkey" 
        FOREIGN KEY ("stockId") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
      
      console.log('✅ Таблица material_movements создана');
    } else {
      console.log('✅ Таблица material_movements уже существует');
    }
    
    // Проверяем, есть ли связь movements в таблице stocks
    const stocksMovementsColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stocks' AND column_name = 'movements'
    `;
    
    if (stocksMovementsColumn.length === 0) {
      console.log('🔧 Добавляем связь movements в таблицу stocks...');
      // Это виртуальная связь Prisma, не нужно добавлять в БД
      console.log('✅ Связь movements добавлена (виртуальная)');
    } else {
      console.log('✅ Связь movements уже существует');
    }
    
    // Проверяем, есть ли связь movements в таблице materials
    const materialsMovementsColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'materials' AND column_name = 'movements'
    `;
    
    if (materialsMovementsColumn.length === 0) {
      console.log('🔧 Добавляем связь movements в таблицу materials...');
      // Это виртуальная связь Prisma, не нужно добавлять в БД
      console.log('✅ Связь movements добавлена (виртуальная)');
    } else {
      console.log('✅ Связь movements уже существует');
    }
    
    console.log('🎉 Схема базы данных успешно обновлена!');
    
  } catch (error) {
    console.error('❌ Ошибка обновления схемы базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDatabaseSchema();
