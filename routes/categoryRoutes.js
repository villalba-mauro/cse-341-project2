const express = require('express');
const router = express.Router();

// Importar controladores
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getActiveCategories,
  toggleCategoryStatus,
  getCategoryStats
} = require('../controllers/categoryController');

// Importar middleware de validación
const {
  categoryValidationSchema,
  validate,
  validateObjectId,
  validateQueryParams
} = require('../middleware/validation');

/**
 * RUTAS ESPECIALES (deben ir antes que las rutas con parámetros)
 * Propósito: Estas rutas tienen paths específicos que podrían confundirse con IDs
 */

/**
 * @route   GET /api/categories/active
 * @desc    Obtener solo categorías activas
 * @access  Público
 * Propósito: Endpoint específico para obtener categorías que están habilitadas
 */
router.get('/active', getActiveCategories);

/**
 * @route   GET /api/categories/stats
 * @desc    Obtener estadísticas de categorías
 * @access  Privado (Admin) - Por ahora público para testing
 * Propósito: Dashboard con métricas y estadísticas de las categorías
 */
router.get('/stats', getCategoryStats);

/**
 * RUTAS PRINCIPALES CRUD
 * Propósito: Operaciones básicas Create, Read, Update, Delete
 */

/**
 * @route   GET /api/categories
 * @desc    Obtener todas las categorías con filtros y paginación
 * @access  Público
 * Propósito: Lista paginada de categorías con opciones de búsqueda
 * Query params: page, limit, search, isActive
 */
router.get('/', 
  validateQueryParams(), // Valida parámetros de consulta
  getCategories
);

/**
 * @route   POST /api/categories
 * @desc    Crear nueva categoría
 * @access  Privado (Admin) - Por ahora público para testing
 * Propósito: Crear una nueva categoría de libros
 * Body: { name, description, color?, isActive? }
 */
router.post('/', 
  validate(categoryValidationSchema.create), // Valida datos de entrada
  createCategory
);

/**
 * RUTAS CON PARÁMETROS ID
 * Propósito: Operaciones sobre categorías específicas
 */

/**
 * @route   GET /api/categories/:id
 * @desc    Obtener categoría por ID
 * @access  Público
 * Propósito: Obtiene información detallada de una categoría específica
 */
router.get('/:id', 
  validateObjectId('id'), // Valida que el ID sea un ObjectId válido
  getCategoryById
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Actualizar categoría completa
 * @access  Privado (Admin) - Por ahora público para testing
 * Propósito: Actualiza todos los campos de una categoría
 * Body: { name?, description?, color?, isActive? }
 */
router.put('/:id', 
  validateObjectId('id'),
  validate(categoryValidationSchema.update),
  updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Eliminar categoría
 * @access  Privado (Admin) - Por ahora público para testing
 * Propósito: Elimina una categoría (soft delete si tiene libros asociados)
 */
router.delete('/:id', 
  validateObjectId('id'),
  deleteCategory
);

/**
 * RUTAS ESPECIALES CON ID
 * Propósito: Operaciones específicas sobre categorías individuales
 */

/**
 * @route   PATCH /api/categories/:id/toggle-status
 * @desc    Activar/Desactivar categoría
 * @access  Privado (Admin) - Por ahora público para testing
 * Propósito: Cambia el estado activo/inactivo de una categoría
 */
router.patch('/:id/toggle-status', 
  validateObjectId('id'),
  toggleCategoryStatus
);

/**
 * MIDDLEWARE DE MANEJO DE ERRORES ESPECÍFICO PARA CATEGORÍAS
 * Propósito: Captura errores específicos de las rutas de categorías
 */
router.use((error, req, res, next) => {
  // Log específico para errores de categorías
  if (process.env.NODE_ENV === 'development') {
    console.error('Error en rutas de categorías:', error.message);
  }
  
  // Pasar el error al middleware global de manejo de errores
  next(error);
});

module.exports = router;