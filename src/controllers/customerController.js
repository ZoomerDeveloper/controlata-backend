const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const getAllCustomers = async (req, res) => {
  try {
    const { search, isActive, limit = 50, offset = 0 } = req.query;

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        orders: {
          include: {
            pictures: {
              include: {
                pictureSize: true
              }
            }
          },
          orderBy: {
            orderDate: 'desc'
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Добавляем статистику по клиентам
    const customersWithStats = customers.map(customer => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalPrice, 0);
      const lastOrderDate = customer.orders.length > 0 ? customer.orders[0].orderDate : null;
      
      return {
        ...customer,
        stats: {
          totalSpent,
          orderCount: customer._count.orders,
          lastOrderDate
        }
      };
    });

    res.json({ customers: customersWithStats });
  } catch (error) {
    logger.error('Get all customers error:', error);
    res.status(500).json({
      error: 'Ошибка при получении клиентов'
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            pictures: {
              include: {
                pictureSize: true
              }
            }
          },
          orderBy: {
            orderDate: 'desc'
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Клиент не найден'
      });
    }

    // Добавляем статистику
    const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const lastOrderDate = customer.orders.length > 0 ? customer.orders[0].orderDate : null;

    res.json({
      customer: {
        ...customer,
        stats: {
          totalSpent,
          orderCount: customer._count.orders,
          lastOrderDate
        }
      }
    });
  } catch (error) {
    logger.error('Get customer by id error:', error);
    res.status(500).json({
      error: 'Ошибка при получении клиента'
    });
  }
};

const createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      notes
    } = req.body;

    // Валидация обязательных полей
    if (!name || !phone) {
      return res.status(400).json({
        error: 'Имя и телефон обязательны для заполнения'
      });
    }

    // Проверяем, не существует ли уже клиент с таким телефоном
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: phone,
        isActive: true
      }
    });

    if (existingCustomer) {
      return res.status(400).json({
        error: 'Клиент с таким номером телефона уже существует'
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        city,
        postalCode,
        country,
        notes
      }
    });

    res.status(201).json({
      message: 'Клиент успешно создан',
      customer
    });
  } catch (error) {
    logger.error('Create customer error:', error);
    res.status(500).json({
      error: 'Ошибка при создании клиента'
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      notes,
      isActive
    } = req.body;

    // Валидация обязательных полей
    if (name !== undefined && !name) {
      return res.status(400).json({
        error: 'Имя не может быть пустым'
      });
    }

    if (phone !== undefined && !phone) {
      return res.status(400).json({
        error: 'Телефон не может быть пустым'
      });
    }

    // Проверяем, не существует ли уже другой клиент с таким телефоном
    if (phone) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          phone: phone,
          isActive: true,
          id: { not: id }
        }
      });

      if (existingCustomer) {
        return res.status(400).json({
          error: 'Клиент с таким номером телефона уже существует'
        });
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
        ...(country !== undefined && { country }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      message: 'Клиент успешно обновлен',
      customer
    });
  } catch (error) {
    logger.error('Update customer error:', error);
    res.status(500).json({
      error: 'Ошибка при обновлении клиента'
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, есть ли связанные заказы
    const ordersCount = await prisma.order.count({
      where: { customerId: id }
    });

    if (ordersCount > 0) {
      return res.status(400).json({
        error: 'Нельзя удалить клиента с привязанными заказами. Сначала удалите или переназначьте заказы.'
      });
    }

    await prisma.customer.delete({
      where: { id }
    });

    res.json({
      message: 'Клиент успешно удален'
    });
  } catch (error) {
    logger.error('Delete customer error:', error);
    res.status(500).json({
      error: 'Ошибка при удалении клиента'
    });
  }
};

const getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await prisma.customer.count({
      where: { isActive: true }
    });

    const customersWithOrders = await prisma.customer.count({
      where: {
        isActive: true,
        orders: {
          some: {}
        }
      }
    });

    const topCustomers = await prisma.customer.findMany({
      where: { isActive: true },
      include: {
        orders: true,
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: {
        orders: {
          _count: 'desc'
        }
      },
      take: 10
    });

    const customersWithStats = topCustomers.map(customer => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalPrice, 0);
      return {
        id: customer.id,
        name: customer.name,
        orderCount: customer._count.orders,
        totalSpent
      };
    });

    res.json({
      stats: {
        totalCustomers,
        customersWithOrders,
        topCustomers: customersWithStats
      }
    });
  } catch (error) {
    logger.error('Get customer stats error:', error);
    res.status(500).json({
      error: 'Ошибка при получении статистики клиентов'
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats
};
