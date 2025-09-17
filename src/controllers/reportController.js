const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const generateProfitLossReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    const where = {
      userId: req.user.id,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    };

    // Доходы
    const incomes = await prisma.income.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0);

    // Расходы
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Расходы по категориям
    const expensesByCategory = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {});

    // Прибыль
    const profit = totalIncomes - totalExpenses;
    const profitMargin = totalIncomes > 0 ? (profit / totalIncomes) * 100 : 0;

    const reportData = {
      period: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      summary: {
        totalIncomes,
        totalExpenses,
        profit,
        profitMargin: Math.round(profitMargin * 100) / 100
      },
      incomes: {
        total: totalIncomes,
        items: incomes
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
        items: expenses
      }
    };

    // Сохраняем отчет
    const report = await prisma.report.create({
      data: {
        name: `P&L Report ${startDate} - ${endDate}`,
        type: 'PROFIT_LOSS',
        periodStart: new Date(startDate),
        periodEnd: new Date(endDate),
        data: reportData,
        userId: req.user.id
      }
    });

    res.json({
      message: 'Отчет P&L успешно создан',
      report: {
        id: report.id,
        name: report.name,
        type: report.type,
        period: reportData.period,
        summary: reportData.summary
      },
      data: reportData
    });
  } catch (error) {
    console.error('Generate P&L report error:', error);
    res.status(500).json({
      error: 'Ошибка при создании отчета P&L'
    });
  }
};

const generateCashFlowReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    const where = {
      userId: req.user.id,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    };

    // Доходы по месяцам
    const monthlyIncomes = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(amount) as total_amount,
        COUNT(*) as count
      FROM incomes 
      WHERE "userId" = ${req.user.id}
      AND date >= ${new Date(startDate)}
      AND date <= ${new Date(endDate)}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `;

    // Расходы по месяцам
    const monthlyExpenses = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(amount) as total_amount,
        COUNT(*) as count
      FROM expenses 
      WHERE "userId" = ${req.user.id}
      AND date >= ${new Date(startDate)}
      AND date <= ${new Date(endDate)}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
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

    const reportData = {
      period: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      summary: {
        totalIncomes: totalIncomes._sum.amount || 0,
        totalExpenses: totalExpenses._sum.amount || 0,
        netCashFlow: (totalIncomes._sum.amount || 0) - (totalExpenses._sum.amount || 0)
      },
      monthlyIncomes,
      monthlyExpenses
    };

    // Сохраняем отчет
    const report = await prisma.report.create({
      data: {
        name: `Cash Flow Report ${startDate} - ${endDate}`,
        type: 'CASH_FLOW',
        periodStart: new Date(startDate),
        periodEnd: new Date(endDate),
        data: reportData,
        userId: req.user.id
      }
    });

    res.json({
      message: 'Отчет движения денег успешно создан',
      report: {
        id: report.id,
        name: report.name,
        type: report.type,
        period: reportData.period,
        summary: reportData.summary
      },
      data: reportData
    });
  } catch (error) {
    console.error('Generate cash flow report error:', error);
    res.status(500).json({
      error: 'Ошибка при создании отчета движения денег'
    });
  }
};

const generateProductAnalysisReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    const where = {
      order: {
        userId: req.user.id,
        orderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
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

    // Топ-10 самых прибыльных картин
    const topPictures = await prisma.picture.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
        costPrice: true,
        workHours: true,
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            orderDate: true
          }
        },
        pictureSize: {
          select: {
            name: true,
            width: true,
            height: true
          }
        }
      },
      orderBy: {
        price: 'desc'
      },
      take: 10
    });

    // Расчет прибыли для каждой картины
    const picturesWithProfit = topPictures.map(picture => ({
      ...picture,
      profit: (picture.price || 0) - (picture.costPrice || 0),
      margin: picture.price > 0 ? ((picture.price - (picture.costPrice || 0)) / picture.price) * 100 : 0
    }));

    const reportData = {
      period: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      bySize: picturesBySize,
      byType: picturesByType,
      topPictures: picturesWithProfit
    };

    // Сохраняем отчет
    const report = await prisma.report.create({
      data: {
        name: `Product Analysis Report ${startDate} - ${endDate}`,
        type: 'PRODUCT_ANALYSIS',
        periodStart: new Date(startDate),
        periodEnd: new Date(endDate),
        data: reportData,
        userId: req.user.id
      }
    });

    res.json({
      message: 'Отчет анализа продуктов успешно создан',
      report: {
        id: report.id,
        name: report.name,
        type: report.type,
        period: reportData.period
      },
      data: reportData
    });
  } catch (error) {
    console.error('Generate product analysis report error:', error);
    res.status(500).json({
      error: 'Ошибка при создании отчета анализа продуктов'
    });
  }
};

const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(type && { type })
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        skip,
        take: parseInt(limit),
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          type: true,
          periodStart: true,
          periodEnd: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.report.count({ where })
    ]);

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({
      error: 'Ошибка при получении отчетов'
    });
  }
};

const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report || report.userId !== req.user.id) {
      return res.status(404).json({
        error: 'Отчет не найден'
      });
    }

    res.json({ report });
  } catch (error) {
    console.error('Get report by id error:', error);
    res.status(500).json({
      error: 'Ошибка при получении отчета'
    });
  }
};

const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, что отчет принадлежит пользователю
    const existingReport = await prisma.report.findUnique({
      where: { id }
    });

    if (!existingReport || existingReport.userId !== req.user.id) {
      return res.status(404).json({
        error: 'Отчет не найден'
      });
    }

    await prisma.report.delete({
      where: { id }
    });

    res.json({
      message: 'Отчет успешно удален'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      error: 'Ошибка при удалении отчета'
    });
  }
};

module.exports = {
  generateProfitLossReport,
  generateCashFlowReport,
  generateProductAnalysisReport,
  getAllReports,
  getReportById,
  deleteReport
};
