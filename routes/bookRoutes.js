const express = require('express');
const router = express.Router();

// Importar controladores
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getAvailableBooks,
  getBooksByCategory,
  getFeaturedBooks,
  searchBooks,
  updateBookStock,
  getBookStats
} = require('../controllers/bookController');

// Importar middleware de validación
const {
  bookValidationSchema,
  validate,
  validateObjectId,
  validateQueryParams
} = require('../middleware/validation');

const Joi = require('joi');

/**
 * RUTAS ESPECIALES (deben ir antes que las rutas con parámetros)
 * Propósito: Estas rutas tienen paths específicos que podrían confundirse con IDs
 */

/**
 * @route   GET /api/books/available
 * @desc    Obtener solo libros disponibles
 * @access  Público
 * Propósito: Endpoint para obtener libros que están en stock y disponibles para venta
 */
router.get('/available', getAvailableBooks);

/**
 * @route   GET /api/books/featured
 * @desc    Obtener libros destacados
 * @access  Público
 * Propósito: Obtiene libros marcados como destacados, ordenados por rating
 */
router.get('/featured', getFeaturedBooks);

/**
 * @route   GET /api/books/stats
 * @desc    Obtener estadísticas de libros
 * @access  Privado (Admin) - Por ahora público para testing
 * Propósito: Dashboard con métricas financieras y estadísticas del inventario
 */
router.get('/stats', getBookStats);

/**
 * RUTAS DE BÚSQUEDA
 * Propósito: Búsquedas especializadas de libros
 */

/**
 * @route   GET /api/books/search/:searchTerm
 * @desc    Buscar libros por término de búsqueda
 * @access  Público
 * Propósito: Búsqueda avanzada por título, autor y descripción
 * Query params: category, minPrice, maxPrice, language
 */
router.get('/search/:searchTerm', 
  // Validar parámetros de búsqueda
  (req, res, next) => {
    const schema = Joi.object({
      searchTerm: Joi.string().trim().min(1).max(100).required()
    });
    
    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Término de búsqueda no válido',
        error: error.details[0].message
      });
    }
    next();
  },
  searchBooks
);

/**
 * @route   GET /api/books/category/:categoryId
 * @desc    Obtener libros por categoría
 * @access  Público
 * Propósito: Filtra libros de una categoría específica
 */
router.get('/category/:categoryId', 
  validateObjectId('categoryId'),
  getBooksByCategory
);

/**
 * RUTAS PRINCIPALES CRUD
 * Propósito: Operaciones básicas Create, Read, Update, Delete
 */

/**
 * @route   GET /api/books
 * @desc    Obtener todos los libros con filtros avanzados y paginación
 * @access  Público
 * Propósito: Lista paginada de libros con múltiples opciones de filtrado
 * Query params: page, limit, sort, search, category, status, minPrice, maxPrice, language, isFeatured
 */
router.get('/', 
  validateQueryParams(), // Valida todos los parámetros de consulta
  getBooks
);

/**
 * @route   POST /api/books
 * @desc    Crear nuevo libro
 * @access  Privado (Admin) - Por ahora público para testing
 * Propósito: Crear un nuevo libro en el inventario
 * Body: { title, author, isbn, description, category, publishedDate, publisher, pages, language, price, stock?, status?, coverImage?, averageRating?, reviewCount?, isFeatured? }
 */
router.post('/', 
  validate(bookValidationSchema.create), // Valida todos los campos requeridos
  createBook
);

/**
 * RUTAS CON PARÁMETROS ID
 * Propósito: Operaciones sobre libros específicos
 */

/**
 * @route   GET /api/books/:id
 * @desc    Obtener libro por ID
 * @access  Público
 * Propósito: Obtiene información detallada de un libro específico
 */
router.get('/:id', 
  validateObjectId('id'),
  getBookById
);

/**
 * @route   PUT /api/books/:id
 * @desc    Actualizar libro completo
 * @access  Privado (Admin) - Por ahora público para testing
 * Propósito: Actualiza cualquier campo de un libro
 * Body: Cualquier campo del esquema de libro (todos opcionales)
 */
router.put('/:id', 
  validateObjectId('id'),
  validate(bookValidationSchema.update),
  updateBook
);

/**
 * @route   DELETE /api/books/:id
 * @desc    Eliminar libro
 * @access  Privado (Admin) - Por ahora público para testing
 * Propósito: Elimina completamente un libro del inventario
 */
router.delete('/:id', 
  validateObjectId('id'),
  deleteBook
);

/**
 * RUTAS ESPECIALES CON ID
 * Propósito: Operaciones específicas sobre libros individuales
 */

/**
 * @route   PATCH /api/books/:id/stock
 * @desc    Actualizar stock de libro
 * @access  Privado (Admin) - Por ahora público para testing
 * Propósito: Gestión específica del inventario (agregar, reducir, establecer stock)
 * Body: { quantity: number, operation: 'add' | 'reduce' | 'set' }
 */
router.patch('/:id/stock', 
  validateObjectId('id'),
  // Validación específica para operaciones de stock
  (req, res, next) => {
    const schema = Joi.object({
      quantity: Joi.number()
        .integer()
        .min(0)
        .required()
        .messages({
          'number.base': 'La cantidad debe ser un número',
          'number.integer': 'La cantidad debe ser un número entero',
          'number.min': 'La cantidad no puede ser negativa'
        }),
      
      operation: Joi.string()
        .valid('add', 'reduce', 'set')
        .required()
        .messages({
          'any.only': 'La operación debe ser: add, reduce, o set'
        })
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error en los datos de stock',
        error: error.details[0].message
      });
    }
    next();
  },
  updateBookStock
);

/**
 * MIDDLEWARE DE VALIDACIÓN PERSONALIZADA
 * Propósito: Validaciones adicionales específicas para libros
 */

/**
 * Middleware para validar fechas de publicación
 * Propósito: Asegura que las fechas sean coherentes
 */
const validatePublishedDate = (req, res, next) => {
  if (req.body.publishedDate) {
    const publishedDate = new Date(req.body.publishedDate);
    const now = new Date();
    
    if (publishedDate > now) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de publicación no puede ser futura'
      });
    }
  }
  next();
};

/**
 * Middleware para validar consistencia de stock y estado
 * Propósito: Mantiene coherencia entre stock y estado del libro
 */
const validateStockConsistency = (req, res, next) => {
  const { stock, status } = req.body;
  
  // Si se establece stock en 0, el estado debería ser 'agotado'
  if (stock === 0 && status && status !== 'agotado') {
    return res.status(400).json({
      success: false,
      message: 'Si el stock es 0, el estado debe ser "agotado"'
    });
  }
  
  // Si se establece estado como 'disponible', debe haber stock
  if (status === 'disponible' && stock !== undefined && stock === 0) {
    return res.status(400).json({
      success: false,
      message: 'No se puede marcar como disponible un libro sin stock'
    });
  }
  
  next();
};

// Aplicar middleware de validación adicional a rutas de creación y actualización
router.use('/', validatePublishedDate);
router.use(['/', '/:id'], validateStockConsistency);

/**
 * MIDDLEWARE DE MANEJO DE ERRORES ESPECÍFICO PARA LIBROS
 * Propósito: Captura errores específicos de las rutas de libros
 */
router.use((error, req, res, next) => {
  // Log específico para errores de libros
  if (process.env.NODE_ENV === 'development') {
    console.error('Error en rutas de libros:', error.message);
  }
  
  // Manejo específico de errores de ISBN duplicado
  if (error.code === 11000 && error.keyPattern && error.keyPattern.isbn) {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un libro con este ISBN',
      field: 'isbn',
      value: error.keyValue.isbn
    });
  }
  
  // Pasar el error al middleware global de manejo de errores
  next(error);
});

module.exports = router;