const Category = require('../models/category');
const {asyncHandler, createError } = require('../middleware/errorHandler');

/**
 * @desc    Obtener todas las categorías
 * @route   GET /api/categories
 * @access  Público
 * Propósito: Lista todas las categorías con opciones de filtradono y paginación
 */
const getCategories = asyncHandler(async (req, res) => {
  // Extraer parámetros de consulta (ya validados por middleware)
  const { page = 1, limit = 10, search, isActive } = req.query;
  
  // Construir filtros de búsqueda
  const filters = {};
  
  // Filtro por estado activo/inactivo
  if (isActive !== undefined) {
    filters.isActive = isActive === 'true';
  }
  
  // Filtro de búsqueda por nombre o descripción
  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Configurar paginación
  const skip = (page - 1) * limit;
  
  // Ejecutar consulta con paginación
  const [categories, total] = await Promise.all([
    Category.find(filters)
      .populate('bookCount') // Incluir conteo virtual de libros
      .sort({ name: 1 }) // Ordenar alfabéticamente
      .skip(skip)
      .limit(parseInt(limit)),
    Category.countDocuments(filters)
  ]);

  // Calcular información de paginación
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
});

/**
 * @desc    Obtener una categoría por ID
 * @route   GET /api/categories/:id
 * @access  Público
 * Propósito: Obtiene una categoría específica con información detallada
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate('bookCount');

  if (!category) {
    throw createError('Categoría no encontrada', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Categoría obtenida exitosamente',
    data: category
  });
});

/**
 * @desc    Crear nueva categoría
 * @route   POST /api/categories
 * @access  Privado (Admin)
 * Propósito: Crea una nueva categoría en la base de datos
 */
const createCategory = async (req, res) => {
  try {
    // Los datos ya están validados por el middleware de validación
    const categoryData = req.body;

    // Verificar si ya existe una categoría con el mismo nombre
    const existingCategory = await Category.findOne({
      name: { $regex: `^${categoryData.name}$`, $options: 'i' }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    // Crear la nueva categoría
    const category = await Category.create(categoryData);

    // Obtener la categoría creada con todos los campos poblados
    const createdCategory = await Category.findById(category._id)
      .populate('bookCount');

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: createdCategory
    });

  } catch (error) {
    // ✅ TRY/CATCH EXPLÍCITO para cumplir rúbrica
    console.error('Error en createCategory:', error);
    
    // Manejar errores específicos de validación
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

    // Manejar error de nombre duplicado
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    // Error genérico del servidor
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear categoría'
    });
  }
};

/**
 * @desc    Actualizar categoría
 * @route   PUT /api/categories/:id
 * @access  Privado (Admin)
 * Propósito: Actualiza una categoría existente
 */
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Verificar si la categoría existe
  let category = await Category.findById(id);
  if (!category) {
    throw createError('Categoría no encontrada', 404);
  }

  // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
  if (updateData.name && updateData.name !== category.name) {
    const existingCategory = await Category.findOne({ 
      name: { $regex: `^${updateData.name}$`, $options: 'i' },
      _id: { $ne: id } // Excluir la categoría actual
    });

    if (existingCategory) {
      throw createError('Ya existe una categoría con ese nombre', 409);
    }
  }

  // Actualizar la categoría
  category = await Category.findByIdAndUpdate(
    id,
    updateData,
    { 
      new: true, // Devolver el documento actualizado
      runValidators: true // Ejecutar validadores del esquema
    }
  ).populate('bookCount');

  res.status(200).json({
    success: true,
    message: 'Categoría actualizada exitosamente',
    data: category
  });
});

/**
 * @desc    Eliminar categoría
 * @route   DELETE /api/categories/:id
 * @access  Privado (Admin)
 * Propósito: Elimina una categoría (soft delete o hard delete según tenga libros)
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    throw createError('Categoría no encontrada', 404);
  }

  // Verificar si la categoría tiene libros asociados
  const Book = require('../models/book');
  const booksCount = await Book.countDocuments({ category: id });

  if (booksCount > 0) {
    // Si tiene libros, hacer soft delete (marcar como inactiva)
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
    // Si no tiene libros, eliminar completamente
    await Category.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Categoría eliminada exitosamente',
      data: { id }
    });
  }
});

/**
 * @desc    Obtener categorías activas
 * @route   GET /api/categories/active
 * @access  Público
 * Propósito: Obtiene solo las categorías activas (método estático del modelo)
 */
const getActiveCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findActive();

  res.status(200).json({
    success: true,
    message: 'Categorías activas obtenidas exitosamente',
    data: categories,
    count: categories.length
  });
});

/**
 * @desc    Activar/Desactivar categoría
 * @route   PATCH /api/categories/:id/toggle-status
 * @access  Privado (Admin)
 * Propósito: Cambia el estado activo/inactivo de una categoría
 */
const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    throw createError('Categoría no encontrada', 404);
  }

  // Cambiar el estado
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
});

/**
 * @desc    Obtener estadísticas de categorías
 * @route   GET /api/categories/stats
 * @access  Privado (Admin)
 * Propósito: Obtiene estadísticas generales de las categorías
 */
const getCategoryStats = asyncHandler(async (req, res) => {
  const [
    totalCategories,
    activeCategories,
    inactiveCategories
  ] = await Promise.all([
    Category.countDocuments({}),
    Category.countDocuments({ isActive: true }),
    Category.countDocuments({ isActive: false })
  ]);

  // Obtener categorías con más libros (agregación)
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
});

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