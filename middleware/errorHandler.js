/**
 * Middleware de manejo de errores centralizado
 * Propósito: Captura y formatea todos los errores de la aplicación de manera consistente
 * Se ejecuta cuando cualquier middleware o ruta llama a next(error)
 */

/**
 * Función para formatear errores de MongoDB
 * Propósito: Convierte errores específicos de MongoDB en mensajes amigables
 */
const handleMongoError = (error) => {
  let message = 'Error de base de datos';
  let statusCode = 500;

  // Error de validación de Mongoose
  if (error.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    
    return {
      statusCode,
      message: 'Error de validación',
      errors
    };
  }

  // Error de clave duplicada (unique constraint)
  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    
    return {
      statusCode,
      message: `Ya existe un registro con ${field}: "${value}"`,
      field,
      value
    };
  }

  // Error de ObjectId inválido
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    statusCode = 400;
    return {
      statusCode,
      message: 'ID proporcionado no es válido',
      field: error.path,
      value: error.value
    };
  }

  // Error de documento no encontrado
  if (error.name === 'DocumentNotFoundError') {
    statusCode = 404;
    return {
      statusCode,
      message: 'Documento no encontrado'
    };
  }

  return {
    statusCode,
    message: error.message || message
  };
};

/**
 * Middleware principal de manejo de errores
 * Propósito: Middleware que captura todos los errores y los formatea para la respuesta
 * @param {Error} err - El error que ocurrió
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función next de Express
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error para debugging (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error completo:', err);
    console.error('Stack trace:', err.stack);
  }

  // Manejo específico de errores de MongoDB/Mongoose
  if (err.name === 'ValidationError' || err.code === 11000 || err.name === 'CastError') {
    const mongoError = handleMongoError(err);
    return res.status(mongoError.statusCode).json({
      success: false,
      message: mongoError.message,
      ...(mongoError.errors && { errors: mongoError.errors }),
      ...(mongoError.field && { field: mongoError.field }),
      ...(mongoError.value && { value: mongoError.value }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Error de JSON malformado
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'JSON malformado en el cuerpo de la petición'
    });
  }

  // Error de token JWT (para cuando implementemos autenticación)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token no válido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado'
    });
  }

  // Error personalizado con código de estado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Error genérico del servidor
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Middleware para rutas no encontradas
 * Propósito: Captura peticiones a rutas que no existen
 */
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Función para crear errores personalizados
 * Propósito: Utilidad para crear errores con código de estado específico
 * @param {string} message - Mensaje del error
 * @param {number} statusCode - Código de estado HTTP
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Wrapper para funciones async
 * Propósito: Captura errores de funciones asíncronas automáticamente
 * Evita tener que usar try-catch en cada función async
 * @param {Function} fn - Función asíncrona a envolver
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Middleware de validación de rate limiting
 * Propósito: Maneja errores específicos de rate limiting
 */
const rateLimitHandler = (req, res, next) => {
  res.status(429).json({
    success: false,
    message: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
    retryAfter: Math.round(req.rateLimit.resetTime / 1000)
  });
};

module.exports = {
  errorHandler,
  notFound,
  createError,
  asyncHandler,
  rateLimitHandler
};