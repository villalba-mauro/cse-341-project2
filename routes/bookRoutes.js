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
 * @swagger
 * tags:
 *   name: Books
 *   description: Book management endpoints
 */

/**
 * RUTAS ESPECIALES (deben ir antes que las rutas con parámetros)
 * Propósito: Estas rutas tienen paths específicos que podrían confundirse con IDs
 */

/**
 * @swagger
 * /api/books/available:
 *   get:
 *     summary: Get only available books
 *     tags: [Books]
 *     description: Retrieves books that are in stock and available for sale
 *     responses:
 *       200:
 *         description: List of available books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Libros disponibles obtenidos exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 count:
 *                   type: integer
 *                   example: 15
 *       500:
 *         description: Server error
 */
router.get('/available', getAvailableBooks);

/**
 * @swagger
 * /api/books/featured:
 *   get:
 *     summary: Get featured books
 *     tags: [Books]
 *     description: Retrieves books marked as featured, ordered by rating
 *     responses:
 *       200:
 *         description: List of featured books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 count:
 *                   type: integer
 */
router.get('/featured', getFeaturedBooks);

/**
 * @swagger
 * /api/books/stats:
 *   get:
 *     summary: Get book statistics
 *     tags: [Books]
 *     description: Dashboard with financial metrics and inventory statistics
 *     responses:
 *       200:
 *         description: Book statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totals:
 *                       type: object
 *                     financial:
 *                       type: object
 *                     topRated:
 *                       type: array
 *                     categoryDistribution:
 *                       type: array
 */
router.get('/stats', getBookStats);

/**
 * RUTAS DE BÚSQUEDA
 * Propósito: Búsquedas especializadas de libros
 */

/**
 * @swagger
 * /api/books/search/{searchTerm}:
 *   get:
 *     summary: Search books by term
 *     tags: [Books]
 *     description: Advanced search by title, author and description
 *     parameters:
 *       - in: path
 *         name: searchTerm
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search term
 *         example: "Jobs"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by language
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 searchTerm:
 *                   type: string
 *                 count:
 *                   type: integer
 *       400:
 *         description: Invalid search term
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
 * @swagger
 * /api/books/category/{categoryId}:
 *   get:
 *     summary: Get books by category
 *     tags: [Books]
 *     description: Filters books of a specific category
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Category MongoDB ObjectId
 *         example: "60b4f1e5b6d4a4001f4e4e4e"
 *     responses:
 *       200:
 *         description: Books from the specified category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 category:
 *                   type: object
 *                 count:
 *                   type: integer
 *       400:
 *         description: Invalid category ID
 *       404:
 *         description: Category not found
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
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books with advanced filters and pagination
 *     tags: [Books]
 *     description: Paginated list of books with multiple filtering options
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "-createdAt"
 *         description: Sort criteria
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, author, description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [disponible, agotado, descontinuado, próximamente]
 *         description: Filter by book status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by language
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filter featured books
 *     responses:
 *       200:
 *         description: List of books retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Libros obtenidos exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *                 filters:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/', 
  validateQueryParams(), // Valida todos los parámetros de consulta
  getBooks
);

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     description: Creates a new book in the inventory with 16+ fields
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - isbn
 *               - description
 *               - category
 *               - publishedDate
 *               - publisher
 *               - pages
 *               - language
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Steve Jobs Biography"
 *                 description: "Book title"
 *               author:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Walter Isaacson"
 *                 description: "Book author"
 *               isbn:
 *                 type: string
 *                 pattern: '^(?:\\d{9}[\\dX]|\\d{13})$'
 *                 example: "9781451648539"
 *                 description: "ISBN-10 or ISBN-13"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 example: "The definitive biography of Apple's co-founder and technology visionary"
 *                 description: "Book description"
 *               category:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *                 example: "60b4f1e5b6d4a4001f4e4e4e"
 *                 description: "Category MongoDB ObjectId"
 *               publishedDate:
 *                 type: string
 *                 format: date
 *                 example: "2011-10-24"
 *                 description: "Publication date"
 *               publisher:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Simon & Schuster"
 *                 description: "Publisher name"
 *               pages:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10000
 *                 example: 656
 *                 description: "Number of pages"
 *               language:
 *                 type: string
 *                 enum: [español, inglés, francés, alemán, italiano, portugués, otro]
 *                 example: "inglés"
 *                 description: "Book language"
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 29.99
 *                 description: "Book price"
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 example: 15
 *                 description: "Stock quantity (optional)"
 *               status:
 *                 type: string
 *                 enum: [disponible, agotado, descontinuado, próximamente]
 *                 example: "disponible"
 *                 description: "Book status (optional)"
 *               coverImage:
 *                 type: string
 *                 format: uri
 *                 description: "Cover image URL (optional)"
 *               averageRating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *                 description: "Average rating (optional)"
 *               reviewCount:
 *                 type: integer
 *                 minimum: 0
 *                 description: "Number of reviews (optional)"
 *               isFeatured:
 *                 type: boolean
 *                 example: false
 *                 description: "Whether book is featured (optional)"
 *           example:
 *             title: "Steve Jobs Biography"
 *             author: "Walter Isaacson"
 *             isbn: "9781451648539"
 *             description: "The definitive biography of Apple's co-founder and technology visionary"
 *             category: "PUT_VALID_CATEGORY_ID_HERE"
 *             publishedDate: "2011-10-24"
 *             publisher: "Simon & Schuster"
 *             pages: 656
 *             language: "inglés"
 *             price: 29.99
 *             stock: 15
 *     responses:
 *       201:
 *         description: Book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Libro creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Book'
 *       400:
 *         description: Validation error or invalid category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   success: false
 *                   message: "Error de validación"
 *                   errors:
 *                     - field: "isbn"
 *                       message: "El ISBN debe tener formato válido"
 *               invalid_category:
 *                 summary: Invalid category
 *                 value:
 *                   success: false
 *                   message: "La categoría especificada no existe"
 *       409:
 *         description: ISBN already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Ya existe un libro con este ISBN"
 *       500:
 *         description: Internal server error
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
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get book by ID
 *     tags: [Books]
 *     description: Retrieves detailed information of a specific book
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Book MongoDB ObjectId
 *         example: "60b4f1e5b6d4a4001f4e4e4e"
 *     responses:
 *       200:
 *         description: Book retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Libro obtenido exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Book'
 *       400:
 *         description: Invalid book ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "ID de libro no válido"
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Libro no encontrado"
 *       500:
 *         description: Server error
 */
router.get('/:id', 
  validateObjectId('id'),
  getBookById
);

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     summary: Update a book
 *     tags: [Books]
 *     description: Updates any field of a book
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Book MongoDB ObjectId
 *         example: "60b4f1e5b6d4a4001f4e4e4e"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Book Title"
 *               author:
 *                 type: string
 *                 example: "Updated Author"
 *               price:
 *                 type: number
 *                 example: 24.99
 *                 description: "Updated price"
 *               stock:
 *                 type: integer
 *                 example: 25
 *                 description: "Updated stock quantity"
 *               status:
 *                 type: string
 *                 enum: [disponible, agotado, descontinuado, próximamente]
 *                 example: "disponible"
 *                 description: "Updated status"
 *               isFeatured:
 *                 type: boolean
 *                 example: true
 *                 description: "Whether book is featured"
 *           example:
 *             price: 24.99
 *             stock: 25
 *             status: "disponible"
 *             isFeatured: true
 *     responses:
 *       200:
 *         description: Book updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Libro actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Book'
 *       400:
 *         description: Invalid ID or validation error
 *       404:
 *         description: Book not found
 *       409:
 *         description: ISBN already exists
 *       500:
 *         description: Server error
 */
router.put('/:id', 
  validateObjectId('id'),
  validate(bookValidationSchema.update),
  updateBook
);

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Books]
 *     description: Completely removes a book from the inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Book MongoDB ObjectId
 *         example: "60b4f1e5b6d4a4001f4e4e4e"
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Libro eliminado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     author:
 *                       type: string
 *       400:
 *         description: Invalid book ID
 *       404:
 *         description: Book not found
 *       500:
 *         description: Server error
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
 * @swagger
 * /api/books/{id}/stock:
 *   patch:
 *     summary: Update book stock
 *     tags: [Books]
 *     description: Specific inventory management (add, reduce, set stock)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - operation
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 10
 *                 description: "Quantity to add, reduce, or set"
 *               operation:
 *                 type: string
 *                 enum: [add, reduce, set]
 *                 example: "add"
 *                 description: "Stock operation type"
 *           example:
 *             quantity: 10
 *             operation: "add"
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Book'
 *                 stockChange:
 *                   type: object
 *                   properties:
 *                     operation:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     newStock:
 *                       type: integer
 *       400:
 *         description: Invalid data or operation
 *       404:
 *         description: Book not found
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