const Joi = require('joi');

/**
 * Esquema de validación para Categorías
 * Propósito: Define las reglas de validación para crear/actualizar categorías
 */
const categoryValidationSchema = {
  // Para crear nueva categoría
  create: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'El nombre de la categoría es obligatorio',
        'string.min': 'El nombre debe tener al menos 2 caracteres',
        'string.max': 'El nombre no puede exceder 50 caracteres'
      }),
    
    description: Joi.string()
      .trim()
      .min(10)
      .max(200)
      .required()
      .messages({
        'string.empty': 'La descripción es obligatoria',
        'string.min': 'La descripción debe tener al menos 10 caracteres',
        'string.max': 'La descripción no puede exceder 200 caracteres'
      }),
    
    color: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .optional()
      .messages({
        'string.pattern.base': 'El color debe ser un código hexadecimal válido'
      }),
    
    isActive: Joi.boolean().optional()
  }),

  // Para actualizar categoría (todos los campos opcionales)
  update: Joi.object({
    name: Joi.string().trim().min(2).max(50).optional(),
    description: Joi.string().trim().min(10).max(200).optional(),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    isActive: Joi.boolean().optional()
  })
};

/**
 * Esquema de validación para Libros
 * Propósito: Define las reglas de validación para crear/actualizar libros
 */
const bookValidationSchema = {
  // Para crear nuevo libro
  create: Joi.object({
    title: Joi.string()
      .trim()
      .min(1)
      .max(200)
      .required()
      .messages({
        'string.empty': 'El título del libro es obligatorio',
        'string.max': 'El título no puede exceder 200 caracteres'
      }),
    
    author: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.empty': 'El autor es obligatorio',
        'string.min': 'El nombre del autor debe tener al menos 2 caracteres',
        'string.max': 'El nombre del autor no puede exceder 100 caracteres'
      }),
    
    isbn: Joi.string()
      .trim()
      .pattern(/^(?:\d{9}[\dX]|\d{13})$/)
      .required()
      .messages({
        'string.empty': 'El ISBN es obligatorio',
        'string.pattern.base': 'El ISBN debe tener formato válido (10 o 13 dígitos)'
      }),
    
    description: Joi.string()
      .trim()
      .min(10)
      .max(1000)
      .required()
      .messages({
        'string.empty': 'La descripción es obligatoria',
        'string.min': 'La descripción debe tener al menos 10 caracteres',
        'string.max': 'La descripción no puede exceder 1000 caracteres'
      }),
    
    category: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.empty': 'La categoría es obligatoria',
        'string.pattern.base': 'La categoría debe ser un ID de MongoDB válido'
      }),
    
    publishedDate: Joi.date()
      .max('now')
      .required()
      .messages({
        'date.base': 'La fecha de publicación debe ser válida',
        'date.max': 'La fecha de publicación no puede ser futura'
      }),
    
    publisher: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.empty': 'La editorial es obligatoria',
        'string.min': 'El nombre de la editorial debe tener al menos 2 caracteres',
        'string.max': 'El nombre de la editorial no puede exceder 100 caracteres'
      }),
    
    pages: Joi.number()
      .integer()
      .min(1)
      .max(10000)
      .required()
      .messages({
        'number.base': 'El número de páginas debe ser un número',
        'number.integer': 'El número de páginas debe ser un entero',
        'number.min': 'El libro debe tener al menos 1 página',
        'number.max': 'El número de páginas no puede exceder 10,000'
      }),
    
    language: Joi.string()
      .valid('español', 'inglés', 'francés', 'alemán', 'italiano', 'portugués', 'otro')
      .required()
      .messages({
        'any.only': 'Idioma no válido'
      }),
    
    price: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.base': 'El precio debe ser un número',
        'number.positive': 'El precio debe ser positivo'
      }),
    
    stock: Joi.number()
      .integer()
      .min(0)
      .optional()
      .default(0),
    
    status: Joi.string()
      .valid('disponible', 'agotado', 'descontinuado', 'próximamente')
      .optional()
      .default('disponible'),
    
    coverImage: Joi.string()
      .uri()
      .pattern(/\.(jpg|jpeg|png|gif|webp)$/i)
      .optional()
      .messages({
        'string.uri': 'La URL de la imagen debe ser válida',
        'string.pattern.base': 'La imagen debe terminar en jpg, jpeg, png, gif o webp'
      }),
    
    averageRating: Joi.number().min(0).max(5).optional(),
    reviewCount: Joi.number().integer().min(0).optional(),
    isFeatured: Joi.boolean().optional()
  }),

  // Para actualizar libro (todos los campos opcionales)
  update: Joi.object({
    title: Joi.string().trim().min(1).max(200).optional(),
    author: Joi.string().trim().min(2).max(100).optional(),
    isbn: Joi.string().trim().pattern(/^(?:\d{9}[\dX]|\d{13})$/).optional(),
    description: Joi.string().trim().min(10).max(1000).optional(),
    category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    publishedDate: Joi.date().max('now').optional(),
    publisher: Joi.string().trim().min(2).max(100).optional(),
    pages: Joi.number().integer().min(1).max(10000).optional(),
    language: Joi.string().valid('español', 'inglés', 'francés', 'alemán', 'italiano', 'portugués', 'otro').optional(),
    price: Joi.number().positive().precision(2).optional(),
    stock: Joi.number().integer().min(0).optional(),
    status: Joi.string().valid('disponible', 'agotado', 'descontinuado', 'próximamente').optional(),
    coverImage: Joi.string().uri().pattern(/\.(jpg|jpeg|png|gif|webp)$/i).optional(),
    averageRating: Joi.number().min(0).max(5).optional(),
    reviewCount: Joi.number().integer().min(0).optional(),
    isFeatured: Joi.boolean().optional()
  })
};

/**
 * Middleware de validación genérico
 * Propósito: Función que crea middleware de validación para diferentes esquemas
 * @param {Object} schema - Esquema de validación de Joi
 * @param {string} property - Propiedad del request a validar ('body', 'query', 'params')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Devuelve todos los errores, no solo el primero
      allowUnknown: false, // No permite campos no definidos en el esquema
      stripUnknown: true // Elimina campos no definidos
    });

    if (error) {
      // Formatea los errores de validación
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errorDetails
      });
    }

    // Asigna los valores validados y limpiados al request
    req[property] = value;
    next();
  };
};

/**
 * Validador específico para IDs de MongoDB
 * Propósito: Valida que un parámetro sea un ObjectId válido de MongoDB
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: `El ${paramName} proporcionado no es válido`
      });
    }
    
    next();
  };
};

/**
 * Validador para parámetros de consulta (query parameters)
 * Propósito: Valida parámetros de paginación y filtros
 */
const validateQueryParams = () => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(10),
    sort: Joi.string().optional().default('-createdAt'),
    search: Joi.string().trim().optional(),
    category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    status: Joi.string().valid('disponible', 'agotado', 'descontinuado', 'próximamente').optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    language: Joi.string().optional(),
    isFeatured: Joi.boolean().optional()
  });

  return validate(schema, 'query');
};

module.exports = {
  categoryValidationSchema,
  bookValidationSchema,
  validate,
  validateObjectId,
  validateQueryParams
};