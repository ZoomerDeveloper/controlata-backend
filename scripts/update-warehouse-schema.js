const { PrismaClient } = require('@prisma/client');

// Используем DATABASE_PUBLIC_URL для Railway
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_PUBLIC_URL || 'postgresql://postgres:password@localhost:5432/controlata_db'
    }
  }
});

async function updateWarehouseSchema() {
  try {
    console.log('🔄 Обновляем схему базы данных для системы склада...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Проверяем, есть ли enum MovementType
    const movementTypeExists = await prisma.$queryRaw`
      SELECT 1 FROM pg_type WHERE typname = 'MovementType'
    `;
    
    if (movementTypeExists.length === 0) {
      console.log('🔧 Создаем enum MovementType...');
      await prisma.$executeRaw`
        CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
      `;
      console.log('✅ Enum MovementType создан');
    } else {
      console.log('✅ Enum MovementType уже существует');
    }
    
    // Проверяем, есть ли таблица material_movements
    const movementsTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'material_movements'
    `;
    
    if (movementsTable.length === 0) {
      console.log('🔧 Создаем таблицу material_movements...');
      
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
    
    // Проверяем, есть ли таблица stocks
    const stocksTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'stocks'
    `;
    
    if (stocksTable.length === 0) {
      console.log('🔧 Создаем таблицу stocks...');
      
      await prisma.$executeRaw`
        CREATE TABLE "stocks" (
          "id" TEXT NOT NULL,
          "materialId" TEXT NOT NULL,
          "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "minLevel" DOUBLE PRECISION,
          "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "stocks_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "stocks_materialId_key" UNIQUE ("materialId")
        );
      `;
      
      // Добавляем внешний ключ
      await prisma.$executeRaw`
        ALTER TABLE "stocks" 
        ADD CONSTRAINT "stocks_materialId_fkey" 
        FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
      
      console.log('✅ Таблица stocks создана');
    } else {
      console.log('✅ Таблица stocks уже существует');
    }
    
    // Проверяем, есть ли таблица material_purchases
    const purchasesTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'material_purchases'
    `;
    
    if (purchasesTable.length === 0) {
      console.log('🔧 Создаем таблицу material_purchases...');
      
      await prisma.$executeRaw`
        CREATE TABLE "material_purchases" (
          "id" TEXT NOT NULL,
          "materialId" TEXT NOT NULL,
          "quantity" DOUBLE PRECISION NOT NULL,
          "unitPrice" DOUBLE PRECISION NOT NULL,
          "totalPrice" DOUBLE PRECISION NOT NULL,
          "supplier" TEXT,
          "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "material_purchases_pkey" PRIMARY KEY ("id")
        );
      `;
      
      // Добавляем внешний ключ
      await prisma.$executeRaw`
        ALTER TABLE "material_purchases" 
        ADD CONSTRAINT "material_purchases_materialId_fkey" 
        FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
      
      console.log('✅ Таблица material_purchases создана');
    } else {
      console.log('✅ Таблица material_purchases уже существует');
    }
    
    // Создаем начальные остатки для существующих материалов
    console.log('🔧 Создаем начальные остатки для существующих материалов...');
    
    const materials = await prisma.material.findMany({
      where: { isActive: true }
    });
    
    for (const material of materials) {
      const existingStock = await prisma.stock.findUnique({
        where: { materialId: material.id }
      });
      
      if (!existingStock) {
        await prisma.stock.create({
          data: {
            materialId: material.id,
            quantity: 0,
            minLevel: 10 // Устанавливаем минимальный уровень по умолчанию
          }
        });
        console.log(`✅ Создан остаток для материала: ${material.name}`);
      }
    }
    
    console.log('🎉 Схема базы данных для системы склада успешно обновлена!');
    
  } catch (error) {
    console.error('❌ Ошибка обновления схемы базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateWarehouseSchema();
