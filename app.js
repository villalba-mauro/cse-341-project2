const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();


/**
 * Importar configuración de autenticación
 */
require('./config/passport');


/**
 * Importar middleware personalizado
 */
const { errorHandler, notFound } = require('./middleware/errorHandler');

/**
 * Importar rutas
 */
const categoryRoutes = require('./routes/categoryRoutes');
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');
const { swaggerUi, specs } = require('./config/swagger');

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
    message: 'Too many requests. Please try again in 15 minutes.'
  }
});

app.use(limiter);

/**
 * CONFIGURACIÓN DE SESIONES
 * Propósito: Habilita el manejo de sesiones para autenticación
 */
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

/**
 * CONFIGURACIÓN DE PASSPORT
 * Propósito: Inicializa Passport para autenticación OAuth
 */
app.use(passport.initialize());
app.use(passport.session());

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
    message: 'Digital Library API working correctly',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta raíz con información de la API
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Digital Library API',
    version: '1.0.0',
    endpoints: {
      categories: '/api/categories',
      books: '/api/books',
      authentication: '/auth/google',
      profile: '/auth/profile',
      status: '/auth/status',
      health: '/health',
      documentation: '/api-docs'
    }
  });
});

// Rutas de la API
app.use('/api/categories', categoryRoutes);
app.use('/api/books', bookRoutes);
app.use('/auth', authRoutes)

/**
 * SWAGGER DOCUMENTATION
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Digital Library API Documentation'
}));

// Redirect /docs to /api-docs
app.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});
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