const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllExpenses = async (req, res) => {
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

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        where
      }),
      prisma.expense.count({ where })
    ]);

    res.json({
      expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all expenses error:', error);
    res.status(500).json({
      error: 'Ошибка при получении расходов'
    });
  }
};

const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!expense || expense.userId !== req.user.id) {
      return res.status(404).json({
        error: 'Расход не найден'
      });
    }

    res.json({ expense });
  } catch (error) {
    console.error('Get expense by id error:', error);
    res.status(500).json({
      error: 'Ошибка при получении расхода'
    });
  }
};

const createExpense = async (req, res) => {
  try {
    const {
      amount,
      description,
      category,
      date,
      notes,
      receipt
    } = req.body;

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        category,
        date: date ? new Date(date) : new Date(),
        notes,
        receipt,
        userId: req.user.id
      }
    });

    res.status(201).json({
      message: 'Расход успешно создан',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      error: 'Ошибка при создании расхода'
    });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      description,
      category,
      date,
      notes,
      receipt
    } = req.body;

    // Проверяем, что расход принадлежит пользователю
    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!existingExpense || existingExpense.userId !== req.user.id) {
      return res.status(404).json({
        error: 'Расход не найден'
      });
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(notes !== undefined && { notes }),
        ...(receipt !== undefined && { receipt })
      }
    });

    res.json({
      message: 'Расход успешно обновлен',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      error: 'Ошибка при обновлении расхода'
    });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, что расход принадлежит пользователю
    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!existingExpense || existingExpense.userId !== req.user.id) {
      return res.status(404).json({
        error: 'Расход не найден'
      });
    }

    await prisma.expense.delete({
      where: { id }
    });

    res.json({
      message: 'Расход успешно удален'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      error: 'Ошибка при удалении расхода'
    });
  }
};

const getExpenseStats = async (req, res) => {
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
    const totalStats = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true },
      _avg: { amount: true }
    });

    // Статистика по категориям
    const categoryStats = await prisma.expense.groupBy({
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
        FROM expenses 
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
        FROM expenses 
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
    console.error('Get expense stats error:', error);
    res.status(500).json({
      error: 'Ошибка при получении статистики расходов'
    });
  }
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats
};
