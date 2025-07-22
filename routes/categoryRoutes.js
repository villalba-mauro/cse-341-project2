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
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management endpoints
 */

/**
 * RUTAS ESPECIALES (deben ir antes que las rutas con parámetros)
 * Propósito: Estas rutas tienen paths específicos que podrían confundirse con IDs
 */

/**
 * @swagger
 * /api/categories/active:
 *   get:
 *     summary: Get only active categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of active categories
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
 *                     $ref: '#/components/schemas/Category'
 *                 count:
 *                   type: integer
 */
router.get('/active', getActiveCategories);

/**
 * @swagger
 * /api/categories/stats:
 *   get:
 *     summary: Get category statistics
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category statistics
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
 *                     topCategories:
 *                       type: array
 */
router.get('/stats', getCategoryStats);

/**
 * RUTAS PRINCIPALES CRUD
 * Propósito: Operaciones básicas Create, Read, Update, Delete
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories with filters and pagination
 *     tags: [Categories]
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
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or description
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
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
 *                   example: "Categorías obtenidas exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', 
  validateQueryParams(), // Valida parámetros de consulta
  getCategories
);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Biography"
 *                 description: "Category name (2-50 characters)"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 200
 *                 example: "Biographical books and memoirs of famous personalities"
 *                 description: "Category description (10-200 characters)"
 *               color:
 *                 type: string
 *                 pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
 *                 example: "#ff6b35"
 *                 description: "Hexadecimal color code (optional)"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *                 description: "Whether category is active (optional, defaults to true)"
 *     responses:
 *       201:
 *         description: Category created successfully
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
 *                   example: "Categoría creada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Error de validación"
 *               errors:
 *                 - field: "name"
 *                   message: "El nombre debe tener al menos 2 caracteres"
 *       409:
 *         description: Category already exists
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
 *                   example: "Ya existe una categoría con ese nombre"
 *       500:
 *         description: Internal server error
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
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the category
 *         example: "60b4f1e5b6d4a4001f4e4e4e"
 *     responses:
 *       200:
 *         description: Category retrieved successfully
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
 *                   example: "Categoría obtenida exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid category ID
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
 *                   example: "ID de categoría no válido"
 *       404:
 *         description: Category not found
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
 *                   example: "Categoría no encontrada"
 *       500:
 *         description: Server error
 */
router.get('/:id', 
  validateObjectId('id'), // Valida que el ID sea un ObjectId válido
  getCategoryById
);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the category
 *         example: "60b4f1e5b6d4a4001f4e4e4e"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Updated Biography"
 *                 description: "Updated category name"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 200
 *                 example: "Updated description for biographical books, memoirs and autobiographies"
 *                 description: "Updated category description"
 *               color:
 *                 type: string
 *                 pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
 *                 example: "#28a745"
 *                 description: "Updated hexadecimal color code"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *                 description: "Updated active status"
 *           example:
 *             description: "Updated description for biographical books, memoirs and autobiographies"
 *             color: "#28a745"
 *     responses:
 *       200:
 *         description: Category updated successfully
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
 *                   example: "Categoría actualizada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid ID or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Category not found
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
 *                   example: "Categoría no encontrada"
 *       409:
 *         description: Category name already exists
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
 *                   example: "Ya existe una categoría con ese nombre"
 *       500:
 *         description: Server error
 */
router.put('/:id', 
  validateObjectId('id'),
  validate(categoryValidationSchema.update),
  updateCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     description: Deletes a category. If the category has associated books, it will be deactivated instead of deleted.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the category
 *         example: "60b4f1e5b6d4a4001f4e4e4e"
 *     responses:
 *       200:
 *         description: Category deleted or deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Categoría eliminada exitosamente"
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Categoría desactivada (tiene 5 libros asociados)"
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                           example: false
 *                         booksCount:
 *                           type: integer
 *       400:
 *         description: Invalid category ID
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
 *                   example: "ID de categoría no válido"
 *       404:
 *         description: Category not found
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
 *                   example: "Categoría no encontrada"
 *       500:
 *         description: Server error
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
 * @swagger
 * /api/categories/{id}/toggle-status:
 *   patch:
 *     summary: Toggle category active status
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category status toggled successfully
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
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Category not found
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