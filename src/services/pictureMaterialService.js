const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Создает стандартные материалы для картины на основе размера
 * @param {string} pictureId - ID картины
 * @param {string} pictureSizeId - ID размера картины
 * @param {string} pictureType - Тип картины (READY_MADE, CUSTOM_PHOTO)
 * @returns {Promise<void>}
 */
const createStandardMaterialsForPicture = async (pictureId, pictureSizeId, pictureType = 'CUSTOM_PHOTO') => {
  try {
    logger.info('Creating standard materials for picture', { 
      pictureId, 
      pictureSizeId, 
      pictureType 
    });

    // Получаем размер картины
    const pictureSize = await prisma.pictureSize.findUnique({
      where: { id: pictureSizeId }
    });

    if (!pictureSize) {
      throw new Error(`PictureSize with ID ${pictureSizeId} not found`);
    }

    // Получаем базовые материалы
    const materials = await prisma.material.findMany({
      where: {
        isActive: true
      }
    });

    if (materials.length === 0) {
      logger.warn('No active materials found in database');
      return;
    }

    // Создаем материалы для картины на основе размера
    const materialsToCreate = [];

    // Холст - рассчитываем площадь в см²
    const canvasArea = (pictureSize.width * pictureSize.height) / 10000; // переводим в м²
    const canvasQuantity = Math.ceil(canvasArea * 1.1); // добавляем 10% запаса

    // Рамка - периметр в см
    const framePerimeter = 2 * (pictureSize.width + pictureSize.height);
    const frameQuantity = Math.ceil(framePerimeter / 100); // переводим в метры

    // Краски - базовая формула на основе площади
    const paintQuantity = Math.ceil(canvasArea * 0.5); // мл краски на см²

    // Кисти - стандартный набор
    const brushQuantity = 3; // 3 кисти разного размера

    // Находим материалы по категориям
    const canvasMaterial = materials.find(m => m.category === 'CANVAS');
    const frameMaterial = materials.find(m => m.category === 'FRAME');
    const paintMaterial = materials.find(m => m.category === 'PAINT');
    const brushMaterial = materials.find(m => m.category === 'BRUSH');

    // Добавляем холст
    if (canvasMaterial) {
      materialsToCreate.push({
        pictureId,
        materialId: canvasMaterial.id,
        quantity: canvasQuantity
      });
    }

    // Добавляем рамку
    if (frameMaterial) {
      materialsToCreate.push({
        pictureId,
        materialId: frameMaterial.id,
        quantity: frameQuantity
      });
    }

    // Добавляем краски
    if (paintMaterial) {
      materialsToCreate.push({
        pictureId,
        materialId: paintMaterial.id,
        quantity: paintQuantity
      });
    }

    // Добавляем кисти
    if (brushMaterial) {
      materialsToCreate.push({
        pictureId,
        materialId: brushMaterial.id,
        quantity: brushQuantity
      });
    }

    // Создаем связи материалов с картиной
    if (materialsToCreate.length > 0) {
      await prisma.pictureMaterial.createMany({
        data: materialsToCreate
      });

      logger.info('Standard materials created for picture', {
        pictureId,
        materialsCount: materialsToCreate.length,
        materials: materialsToCreate.map(m => ({
          materialId: m.materialId,
          quantity: m.quantity
        }))
      });
    } else {
      logger.warn('No materials to create for picture', { pictureId });
    }

  } catch (error) {
    logger.error('Error creating standard materials for picture', {
      pictureId,
      pictureSizeId,
      pictureType,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Обновляет материалы для картины на основе размера
 * @param {string} pictureId - ID картины
 * @param {string} pictureSizeId - ID размера картины
 * @returns {Promise<void>}
 */
const updateMaterialsForPicture = async (pictureId, pictureSizeId) => {
  try {
    logger.info('Updating materials for picture', { pictureId, pictureSizeId });

    // Удаляем существующие материалы
    await prisma.pictureMaterial.deleteMany({
      where: { pictureId }
    });

    // Создаем новые материалы
    await createStandardMaterialsForPicture(pictureId, pictureSizeId, 'CUSTOM_PHOTO');

  } catch (error) {
    logger.error('Error updating materials for picture', {
      pictureId,
      pictureSizeId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  createStandardMaterialsForPicture,
  updateMaterialsForPicture
};
