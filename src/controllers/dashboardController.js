const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getDashboardStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Определяем период
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const userId = req.user.id;

    // Общая статистика заказов
    const ordersStats = await prisma.order.aggregate({
      where: {
        userId,
        orderDate: { gte: startDate }
      },
      _count: { id: true },
      _sum: { totalPrice: true }
    });

    // Статистика по статусам заказов
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: {
        userId,
        orderDate: { gte: startDate }
      },
      _count: { id: true },
      _sum: { totalPrice: true }
    });

    // Общая статистика картин
    const picturesStats = await prisma.picture.aggregate({
      where: {
        order: {
          userId,
          orderDate: { gte: startDate }
        }
      },
      _count: { id: true },
      _sum: { 
        price: true,
        costPrice: true 
      }
    });

    // Статистика по типам картин
    const picturesByType = await prisma.picture.groupBy({
      by: ['type'],
      where: {
        order: {
          userId,
          orderDate: { gte: startDate }
        }
      },
      _count: { id: true },
      _sum: { 
        price: true,
        costPrice: true 
      }
    });

    // Общая статистика доходов
    const incomesStats = await prisma.income.aggregate({
      where: {
        userId,
        date: { gte: startDate }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Общая статистика расходов
    const expensesStats = await prisma.expense.aggregate({
      where: {
        userId,
        date: { gte: startDate }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Статистика расходов по категориям
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        userId,
        date: { gte: startDate }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Расчет прибыли
    const totalRevenue = incomesStats._sum.amount || 0;
    const totalExpenses = expensesStats._sum.amount || 0;
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // Топ-5 клиентов по заказам
    const topCustomers = await prisma.order.groupBy({
      by: ['customerName'],
      where: {
        userId,
        orderDate: { gte: startDate },
        customerName: { not: null }
      },
      _count: { id: true },
      _sum: { totalPrice: true },
      orderBy: {
        _sum: {
          totalPrice: 'desc'
        }
      },
      take: 5
    });

    // Последние заказы
    const recentOrders = await prisma.order.findMany({
      where: {
        userId,
        orderDate: { gte: startDate }
      },
      include: {
        pictures: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            price: true
          }
        },
        _count: {
          select: {
            pictures: true
          }
        }
      },
      orderBy: { orderDate: 'desc' },
      take: 5
    });

    // Материалы с низким остатком
    const lowStockMaterials = await prisma.stock.findMany({
      where: {
        AND: [
          { minLevel: { not: null } },
          { quantity: { lte: prisma.stock.fields.minLevel } }
        ]
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: true
          }
        }
      }
    });

    res.json({
      period: {
        startDate,
        endDate: now,
        type: period
      },
      orders: {
        total: ordersStats._count.id || 0,
        revenue: ordersStats._sum.totalPrice || 0,
        byStatus: ordersByStatus
      },
      pictures: {
        total: picturesStats._count.id || 0,
        revenue: picturesStats._sum.price || 0,
        cost: picturesStats._sum.costPrice || 0,
        profit: (picturesStats._sum.price || 0) - (picturesStats._sum.costPrice || 0),
        byType: picturesByType
      },
      finances: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        expensesByCategory
      },
      analytics: {
        topCustomers,
        recentOrders,
        lowStockMaterials: lowStockMaterials.map(item => ({
          id: item.material.id,
          name: item.material.name,
          unit: item.material.unit,
          category: item.material.category,
          currentStock: item.quantity,
          minLevel: item.minLevel
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      error: 'Ошибка при получении статистики дашборда'
    });
  }
};

const getFinancialOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    // Доходы по месяцам
    const monthlyIncomes = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(amount) as total_amount,
        COUNT(*) as count
      FROM incomes 
      WHERE "userId" = ${req.user.id}
      ${startDate ? prisma.$queryRaw`AND date >= ${new Date(startDate)}` : prisma.$queryRaw``}
      ${endDate ? prisma.$queryRaw`AND date <= ${new Date(endDate)}` : prisma.$queryRaw``}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
      LIMIT 12
    `;

    // Расходы по месяцам
    const monthlyExpenses = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(amount) as total_amount,
        COUNT(*) as count
      FROM expenses 
      WHERE "userId" = ${req.user.id}
      ${startDate ? prisma.$queryRaw`AND date >= ${new Date(startDate)}` : prisma.$queryRaw``}
      ${endDate ? prisma.$queryRaw`AND date <= ${new Date(endDate)}` : prisma.$queryRaw``}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
      LIMIT 12
    `;

    // Общая статистика
    const [totalIncomes, totalExpenses] = await Promise.all([
      prisma.income.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true }
      })
    ]);

    const totalRevenue = totalIncomes._sum.amount || 0;
    const totalExpensesAmount = totalExpenses._sum.amount || 0;
    const netProfit = totalRevenue - totalExpensesAmount;

    res.json({
      overview: {
        totalRevenue,
        totalExpenses: totalExpensesAmount,
        netProfit,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      },
      monthlyIncomes,
      monthlyExpenses
    });
  } catch (error) {
    console.error('Get financial overview error:', error);
    res.status(500).json({
      error: 'Ошибка при получении финансового обзора'
    });
  }
};

const getProductAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {
      order: {
        userId: req.user.id,
        ...(startDate && endDate && {
          orderDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      }
    };

    // Статистика по размерам картин
    const picturesBySize = await prisma.picture.groupBy({
      by: ['pictureSizeId'],
      where,
      _count: { id: true },
      _sum: { 
        price: true,
        costPrice: true 
      },
      include: {
        pictureSize: {
          select: {
            name: true,
            width: true,
            height: true
          }
        }
      }
    });

    // Статистика по типам картин
    const picturesByType = await prisma.picture.groupBy({
      by: ['type'],
      where,
      _count: { id: true },
      _sum: { 
        price: true,
        costPrice: true 
      }
    });

    // Топ-5 самых прибыльных картин
    const topProfitablePictures = await prisma.picture.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
        costPrice: true,
        order: {
          select: {
            orderNumber: true,
            customerName: true
          }
        },
        pictureSize: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        price: 'desc'
      },
      take: 5
    });

    // Расчет прибыли для каждой картины
    const picturesWithProfit = topProfitablePictures.map(picture => ({
      ...picture,
      profit: (picture.price || 0) - (picture.costPrice || 0),
      margin: picture.price > 0 ? ((picture.price - (picture.costPrice || 0)) / picture.price) * 100 : 0
    }));

    res.json({
      bySize: picturesBySize,
      byType: picturesByType,
      topProfitable: picturesWithProfit
    });
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({
      error: 'Ошибка при получении аналитики продуктов'
    });
  }
};

module.exports = {
  getDashboardStats,
  getFinancialOverview,
  getProductAnalytics
};
