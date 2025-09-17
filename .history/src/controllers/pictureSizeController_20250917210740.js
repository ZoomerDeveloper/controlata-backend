const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllPictureSizes = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [pictureSizes, total] = await Promise.all([
      prisma.pictureSize.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        where: {
          isActive: true
        }
      }),
      prisma.pictureSize.count({
        where: {
          isActive: true
        }
      })
    ]);

    res.json({
      pictureSizes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all picture sizes error:', error);
    res.status(500).json({
      error: 'Ошибка при получении размеров картин'
    });
  }
};

const getPictureSizeById = async (req, res) => {
  try {
    const { id } = req.params;

    const pictureSize = await prisma.pictureSize.findUnique({
      where: { id },
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
        materials: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: true
          }
        }
      }
    });

    if (!pictureSize) {
      return res.status(404).json({
        error: 'Размер картины не найден'
      });
    }

    res.json({ pictureSize });
  } catch (error) {
    console.error('Get picture size by id error:', error);
    res.status(500).json({
      error: 'Ошибка при получении размера картины'
    });
  }
};

const createPictureSize = async (req, res) => {
  try {
    const { name, width, height, description } = req.body;

    // Проверяем, существует ли размер с таким именем
    const existingSize = await prisma.pictureSize.findUnique({
      where: { name }
    });

    if (existingSize) {
      return res.status(400).json({
        error: 'Размер картины с таким именем уже существует'
      });
    }

    const pictureSize = await prisma.pictureSize.create({
      data: {
        name,
        width: parseFloat(width),
        height: parseFloat(height),
        description
      }
    });

    res.status(201).json({
      message: 'Размер картины успешно создан',
      pictureSize
    });
  } catch (error) {
    console.error('Create picture size error:', error);
    res.status(500).json({
      error: 'Ошибка при создании размера картины'
    });
  }
};

const updatePictureSize = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, width, height, description, isActive } = req.body;

    // Проверяем, существует ли размер
    const existingSize = await prisma.pictureSize.findUnique({
      where: { id }
    });

    if (!existingSize) {
      return res.status(404).json({
        error: 'Размер картины не найден'
      });
    }

    // Проверяем уникальность имени (если изменилось)
    if (name && name !== existingSize.name) {
      const duplicateSize = await prisma.pictureSize.findUnique({
        where: { name }
      });

      if (duplicateSize) {
        return res.status(400).json({
          error: 'Размер картины с таким именем уже существует'
        });
      }
    }

    const pictureSize = await prisma.pictureSize.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(width && { width: parseFloat(width) }),
        ...(height && { height: parseFloat(height) }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      message: 'Размер картины успешно обновлен',
      pictureSize
    });
  } catch (error) {
    console.error('Update picture size error:', error);
    res.status(500).json({
      error: 'Ошибка при обновлении размера картины'
    });
  }
};

const deletePictureSize = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, используется ли размер в картинах
    const picturesCount = await prisma.picture.count({
      where: { pictureSizeId: id }
    });

    if (picturesCount > 0) {
      return res.status(400).json({
        error: 'Нельзя удалить размер картины, который используется в картинах'
      });
    }

    // Проверяем, используется ли размер в материалах
    const materialsCount = await prisma.material.count({
      where: { pictureSizeId: id }
    });

    if (materialsCount > 0) {
      return res.status(400).json({
        error: 'Нельзя удалить размер картины, который используется в материалах'
      });
    }

    await prisma.pictureSize.delete({
      where: { id }
    });

    res.json({
      message: 'Размер картины успешно удален'
    });
  } catch (error) {
    console.error('Delete picture size error:', error);
    res.status(500).json({
      error: 'Ошибка при удалении размера картины'
    });
  }
};

module.exports = {
  getAllPictureSizes,
  getPictureSizeById,
  createPictureSize,
  updatePictureSize,
  deletePictureSize
};
