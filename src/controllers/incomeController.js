const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllIncomes = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'date', 
      sortOrder = 'desc',
      category,
      startDate,
      endDate,
      search 
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(category && { category }),
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [incomes, total] = await Promise.all([
      prisma.income.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true
            }
          }
        }
      }),
      prisma.income.count({ where })
    ]);

    res.json({
      incomes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all incomes error:', error);
    res.status(500).json({
      error: 'Ошибка при получении доходов'
    });
  }
};

const getIncomeById = async (req, res) => {
  try {
    const { id } = req.params;

    const income = await prisma.income.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerEmail: true
          }
        }
      }
    });

    if (!income || income.userId !== req.user.id) {
      return res.status(404).json({
        error: 'Доход не найден'
      });
    }

    res.json({ income });
  } catch (error) {
    console.error('Get income by id error:', error);
    res.status(500).json({
      error: 'Ошибка при получении дохода'
    });
  }
};

const createIncome = async (req, res) => {
  try {
    const {
      orderId,
      amount,
      description,
      category,
      date,
      notes
    } = req.body;

    const income = await prisma.income.create({
      data: {
        orderId: orderId || null,
        amount: parseFloat(amount),
        description,
        category,
        date: date ? new Date(date) : new Date(),
        notes,
        userId: req.user.id
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Доход успешно создан',
      income
    });
  } catch (error) {
    console.error('Create income error:', error);
    res.status(500).json({
      error: 'Ошибка при создании дохода'
    });
  }
};

const updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      description,
      category,
      date,
      notes
    } = req.body;

    // Проверяем, что доход принадлежит пользователю
    const existingIncome = await prisma.income.findUnique({
      where: { id }
    });

    if (!existingIncome || existingIncome.userId !== req.user.id) {
      return res.status(404).json({
        error: 'Доход не найден'
      });
    }

    const income = await prisma.income.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(notes !== undefined && { notes })
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true
          }
        }
      }
    });

    res.json({
      message: 'Доход успешно обновлен',
      income
    });
  } catch (error) {
    console.error('Update income error:', error);
    res.status(500).json({
      error: 'Ошибка при обновлении дохода'
    });
  }
};

const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, что доход принадлежит пользователю
    const existingIncome = await prisma.income.findUnique({
      where: { id }
    });

    if (!existingIncome || existingIncome.userId !== req.user.id) {
      return res.status(404).json({
        error: 'Доход не найден'
      });
    }

    await prisma.income.delete({
      where: { id }
    });

    res.json({
      message: 'Доход успешно удален'
    });
  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({
      error: 'Ошибка при удалении дохода'
    });
  }
};

const getIncomeStats = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    const where = {
      userId: req.user.id,
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    // Общая статистика
    const totalStats = await prisma.income.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true },
      _avg: { amount: true }
    });

    // Статистика по категориям
    const categoryStats = await prisma.income.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: { id: true }
    });

    // Статистика по периодам
    let periodStats = [];
    if (groupBy === 'month') {
      periodStats = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', date) as period,
          SUM(amount) as total_amount,
          COUNT(*) as count
        FROM incomes 
        WHERE "userId" = ${req.user.id}
        ${startDate ? prisma.$queryRaw`AND date >= ${new Date(startDate)}` : prisma.$queryRaw``}
        ${endDate ? prisma.$queryRaw`AND date <= ${new Date(endDate)}` : prisma.$queryRaw``}
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY period DESC
      `;
    } else if (groupBy === 'day') {
      periodStats = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', date) as period,
          SUM(amount) as total_amount,
          COUNT(*) as count
        FROM incomes 
        WHERE "userId" = ${req.user.id}
        ${startDate ? prisma.$queryRaw`AND date >= ${new Date(startDate)}` : prisma.$queryRaw``}
        ${endDate ? prisma.$queryRaw`AND date <= ${new Date(endDate)}` : prisma.$queryRaw``}
        GROUP BY DATE_TRUNC('day', date)
        ORDER BY period DESC
        LIMIT 30
      `;
    }

    res.json({
      total: {
        amount: totalStats._sum.amount || 0,
        count: totalStats._count.id || 0,
        average: totalStats._avg.amount || 0
      },
      byCategory: categoryStats,
      byPeriod: periodStats
    });
  } catch (error) {
    console.error('Get income stats error:', error);
    res.status(500).json({
      error: 'Ошибка при получении статистики доходов'
    });
  }
};

module.exports = {
  getAllIncomes,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeStats
};
