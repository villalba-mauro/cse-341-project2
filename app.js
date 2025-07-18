const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

/**
 * Importar middleware personalizado
 */
const { errorHandler, notFound } = require('./middleware/errorHandler');

/**
 * Importar rutas
 */
const categoryRoutes = require('./routes/categoryRoutes');
const bookRoutes = require('./routes/bookRoutes');

/**
 * Crear instancia de Express
 */
const app = express();

/**
 * MIDDLEWARE DE SEGURIDAD BÁSICO
 */

// Helmet - Headers de seguridad
app.use(helmet());

// CORS - Permitir acceso desde otros dominios
app.use(cors());

// Rate Limiting SIMPLIFICADO (sin configuración personalizada problemática)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 peticiones por IP
  message: {
    success: false,
    message: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.'
  }
});

app.use(limiter);

/**
 * MIDDLEWARE DE PARSING
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * MIDDLEWARE DE LOGGING (solo en desarrollo)
 */
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

/**
 * RUTAS PRINCIPALES
 */

// Ruta de salud del servidor
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API de Biblioteca Digital funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta raíz con información de la API
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenido a la API de Biblioteca Digital',
    version: '1.0.0',
    endpoints: {
      categories: '/api/categories',
      books: '/api/books',
      health: '/health'
    }
  });
});

// Rutas de la API
app.use('/api/categories', categoryRoutes);
app.use('/api/books', bookRoutes);

/**
 * MIDDLEWARE DE MANEJO DE ERRORES
 */
app.use(notFound);
app.use(errorHandler);

/**
 * MANEJO DE PROCESOS
 */
process.on('unhandledRejection', (err, promise) => {
  console.error('Promesa rechazada no manejada:', err.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err.message);
  process.exit(1);
});

module.exports = app;