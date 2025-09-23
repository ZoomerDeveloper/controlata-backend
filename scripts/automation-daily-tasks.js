const { PrismaClient } = require('@prisma/client');
const notificationService = require('../src/services/notificationService');
const autoCostRecalculationService = require('../src/services/autoCostRecalculationService');
const pricingService = require('../src/services/pricingService');

const prisma = new PrismaClient();

async function runDailyAutomationTasks() {
  try {
    console.log('🚀 Запуск ежедневных автоматических задач...');
    console.log('⏰ Время:', new Date().toISOString());

    const results = {
      timestamp: new Date().toISOString(),
      tasks: {}
    };

    // 1. Проверка низких остатков материалов
    console.log('\n📦 1. Проверка низких остатков материалов...');
    try {
      const stockCheck = await notificationService.checkLowStockMaterials();
      results.tasks.stockCheck = {
        success: true,
        ...stockCheck
      };
      console.log(`✅ Проверка остатков завершена: ${stockCheck.criticalCount} критических, ${stockCheck.warningCount} предупреждений`);
    } catch (error) {
      console.error('❌ Ошибка проверки остатков:', error.message);
      results.tasks.stockCheck = {
        success: false,
        error: error.message
      };
    }

    // 2. Пересчет себестоимости картин
    console.log('\n💰 2. Пересчет себестоимости картин...');
    try {
      const costRecalculation = await autoCostRecalculationService.recalculateAllCosts({
        updatePrices: false // Только пересчет себестоимости, без изменения цен
      });
      results.tasks.costRecalculation = {
        success: true,
        ...costRecalculation
      };
      console.log(`✅ Пересчет себестоимости завершен: ${costRecalculation.updated} картин обновлено`);
    } catch (error) {
      console.error('❌ Ошибка пересчета себестоимости:', error.message);
      results.tasks.costRecalculation = {
        success: false,
        error: error.message
      };
    }

    // 3. Анализ ценообразования
    console.log('\n📊 3. Анализ ценообразования...');
    try {
      const pricingStats = await pricingService.getPricingStats();
      const recommendations = await pricingService.getRecommendedPricingSettings();
      results.tasks.pricingAnalysis = {
        success: true,
        stats: pricingStats,
        recommendations
      };
      console.log(`✅ Анализ ценообразования завершен: средняя наценка ${pricingStats.averageMargin}%`);
    } catch (error) {
      console.error('❌ Ошибка анализа ценообразования:', error.message);
      results.tasks.pricingAnalysis = {
        success: false,
        error: error.message
      };
    }

    // 4. Очистка старых уведомлений
    console.log('\n🧹 4. Очистка старых уведомлений...');
    try {
      const cleanupResult = await notificationService.cleanupOldNotifications();
      results.tasks.cleanup = {
        success: true,
        deletedCount: cleanupResult
      };
      console.log(`✅ Очистка завершена: удалено ${cleanupResult} старых уведомлений`);
    } catch (error) {
      console.error('❌ Ошибка очистки уведомлений:', error.message);
      results.tasks.cleanup = {
        success: false,
        error: error.message
      };
    }

    // 5. Проверка просроченных заказов
    console.log('\n⏰ 5. Проверка просроченных заказов...');
    try {
      const overdueOrders = await checkOverdueOrders();
      results.tasks.overdueCheck = {
        success: true,
        ...overdueOrders
      };
      console.log(`✅ Проверка просроченных заказов завершена: ${overdueOrders.count} просроченных заказов`);
    } catch (error) {
      console.error('❌ Ошибка проверки просроченных заказов:', error.message);
      results.tasks.overdueCheck = {
        success: false,
        error: error.message
      };
    }

    // 6. Генерация ежедневного отчета
    console.log('\n📈 6. Генерация ежедневного отчета...');
    try {
      const dailyReport = await generateDailyReport();
      results.tasks.dailyReport = {
        success: true,
        ...dailyReport
      };
      console.log(`✅ Ежедневный отчет сгенерирован: ${dailyReport.ordersCount} заказов, ${dailyReport.revenue}€ выручка`);
    } catch (error) {
      console.error('❌ Ошибка генерации ежедневного отчета:', error.message);
      results.tasks.dailyReport = {
        success: false,
        error: error.message
      };
    }

    // Сохраняем результаты
    console.log('\n💾 Сохранение результатов...');
    await saveAutomationResults(results);

    console.log('\n🎉 Все ежедневные задачи выполнены!');
    console.log('📊 Результаты:', JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('❌ Критическая ошибка в ежедневных задачах:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Проверяет просроченные заказы
 */
async function checkOverdueOrders() {
  const today = new Date();
  const overdueOrders = await prisma.order.findMany({
    where: {
      dueDate: {
        lt: today
      },
      status: {
        in: ['PENDING', 'IN_PROGRESS']
      }
    },
    include: {
      pictures: true
    }
  });

  // Создаем уведомления для просроченных заказов
  for (const order of overdueOrders) {
    await notificationService.saveNotification({
      type: 'ORDER_OVERDUE',
      severity: 'WARNING',
      title: 'Просроченный заказ',
      message: `Заказ ${order.orderNumber} просрочен на ${Math.ceil((today - order.dueDate) / (1000 * 60 * 60 * 24))} дней`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        dueDate: order.dueDate,
        daysOverdue: Math.ceil((today - order.dueDate) / (1000 * 60 * 60 * 24))
      }
    });
  }

  return {
    count: overdueOrders.length,
    orders: overdueOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      dueDate: order.dueDate,
      status: order.status
    }))
  };
}

/**
 * Генерирует ежедневный отчет
 */
async function generateDailyReport() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // Статистика заказов за день
  const ordersStats = await prisma.order.aggregate({
    where: {
      orderDate: {
        gte: startOfDay,
        lt: endOfDay
      }
    },
    _count: true,
    _sum: {
      totalPrice: true
    }
  });

  // Статистика доходов за день
  const incomeStats = await prisma.income.aggregate({
    where: {
      date: {
        gte: startOfDay,
        lt: endOfDay
      }
    },
    _count: true,
    _sum: {
      amount: true
    }
  });

  // Статистика расходов за день
  const expenseStats = await prisma.expense.aggregate({
    where: {
      date: {
        gte: startOfDay,
        lt: endOfDay
      }
    },
    _count: true,
    _sum: {
      amount: true
    }
  });

  return {
    date: startOfDay.toISOString().split('T')[0],
    ordersCount: ordersStats._count,
    ordersRevenue: ordersStats._sum.totalPrice || 0,
    incomeCount: incomeStats._count,
    incomeAmount: incomeStats._sum.amount || 0,
    expenseCount: expenseStats._count,
    expenseAmount: expenseStats._sum.amount || 0,
    netProfit: (incomeStats._sum.amount || 0) - (expenseStats._sum.amount || 0),
    revenue: ordersStats._sum.totalPrice || 0
  };
}

/**
 * Сохраняет результаты автоматизации
 */
async function saveAutomationResults(results) {
  try {
    await prisma.automationLog.create({
      data: {
        type: 'DAILY_TASKS',
        status: 'COMPLETED',
        data: results,
        message: 'Ежедневные автоматические задачи выполнены'
      }
    });
  } catch (error) {
    console.error('Ошибка сохранения результатов автоматизации:', error.message);
  }
}

// Запускаем скрипт
runDailyAutomationTasks();
