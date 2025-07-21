const Category = require('../models/category');
const { createError } = require('../middleware/errorHandler');

/**
 * @desc    Obtener todas las categorías
 * @route   GET /api/categories
 * @access  Público
 */
const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    
    const filters = {};
    
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [categories, total] = await Promise.all([
      Category.find(filters)
        .populate('bookCount')
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Category.countDocuments(filters)
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      message: 'Categorías obtenidas exitosamente',
      data: categories,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error en getCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
    });
  }
};

/**
 * @desc    Obtener una categoría por ID
 * @route   GET /api/categories/:id
 * @access  Público
 */
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('bookCount');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Categoría obtenida exitosamente',
      data: category
    });

  } catch (error) {
    console.error('Error en getCategoryById:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría no válido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría'
    });
  }
};

/**
 * @desc    Crear nueva categoría
 * @route   POST /api/categories
 * @access  Público
 */
const createCategory = async (req, res) => {
  try {
    const categoryData = req.body;

    const existingCategory = await Category.findOne({
      name: { $regex: `^${categoryData.name}$`, $options: 'i' }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    const category = await Category.create(categoryData);

    const createdCategory = await Category.findById(category._id)
      .populate('bookCount');

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: createdCategory
    });

  } catch (error) {
    console.error('Error en createCategory:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear categoría'
    });
  }
};

/**
 * @desc    Actualizar categoría
 * @route   PUT /api/categories/:id
 * @access  Público
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    let category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: `^${updateData.name}$`, $options: 'i' },
        _id: { $ne: id }
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre'
        });
      }
    }

    category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    ).populate('bookCount');

    res.status(200).json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: category
    });

  } catch (error) {
    console.error('Error en updateCategory:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría no válido'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría'
    });
  }
};

/**
 * @desc    Eliminar categoría
 * @route   DELETE /api/categories/:id
 * @access  Público
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const Book = require('../models/book');
    const booksCount = await Book.countDocuments({ category: id });

    if (booksCount > 0) {
      category.isActive = false;
      await category.save();
      
      res.status(200).json({
        success: true,
        message: `Categoría desactivada (tiene ${booksCount} libros asociados)`,
        data: { 
          id: category._id,
          name: category.name,
          isActive: category.isActive,
          booksCount 
        }
      });
    } else {
      await Category.findByIdAndDelete(id);
      
      res.status(200).json({
        success: true,
        message: 'Categoría eliminada exitosamente',
        data: { id }
      });
    }

  } catch (error) {
    console.error('Error en deleteCategory:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría no válido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría'
    });
  }
};

/**
 * @desc    Obtener categorías activas
 * @route   GET /api/categories/active
 * @access  Público
 */
const getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.findActive();

    res.status(200).json({
      success: true,
      message: 'Categorías activas obtenidas exitosamente',
      data: categories,
      count: categories.length
    });

  } catch (error) {
    console.error('Error en getActiveCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías activas'
    });
  }
};

/**
 * @desc    Activar/Desactivar categoría
 * @route   PATCH /api/categories/:id/toggle-status
 * @access  Público
 */
const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      success: true,
      message: `Categoría ${category.isActive ? 'activada' : 'desactivada'} exitosamente`,
      data: {
        id: category._id,
        name: category.name,
        isActive: category.isActive
      }
    });

  } catch (error) {
    console.error('Error en toggleCategoryStatus:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría no válido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de categoría'
    });
  }
};

/**
 * @desc    Obtener estadísticas de categorías
 * @route   GET /api/categories/stats
 * @access  Público
 */
const getCategoryStats = async (req, res) => {
  try {
    const [
      totalCategories,
      activeCategories,
      inactiveCategories
    ] = await Promise.all([
      Category.countDocuments({}),
      Category.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: false })
    ]);

    const categoriesWithBookCount = await Category.aggregate([
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: 'category',
          as: 'books'
        }
      },
      {
        $addFields: {
          bookCount: { $size: '$books' }
        }
      },
      {
        $sort: { bookCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          name: 1,
          bookCount: 1,
          isActive: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Estadísticas de categorías obtenidas exitosamente',
      data: {
        totals: {
          total: totalCategories,
          active: activeCategories,
          inactive: inactiveCategories
        },
        topCategories: categoriesWithBookCount
      }
    });

  } catch (error) {
    console.error('Error en getCategoryStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de categorías'
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getActiveCategories,
  toggleCategoryStatus,
  getCategoryStats
};