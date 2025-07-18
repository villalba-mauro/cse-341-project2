/**
 * Servidor principal de la API de Biblioteca Digital
 */

const app = require('./app');
const { connectDB, handleConnectionEvents } = require('./config/database');

/**
 * Configuración del puerto
 */
const PORT = process.env.PORT || 3000;

/**
 * Función principal para iniciar la aplicación
 */
const startServer = async () => {
  try {
    // Configurar eventos de conexión a la base de datos
    handleConnectionEvents();
    
    // Conectar a MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    
    // Iniciar el servidor HTTP
    const server = app.listen(PORT, () => {
      console.log('🚀 Servidor iniciado exitosamente');
      console.log(`📡 Servidor corriendo en puerto ${PORT}`);
      console.log(`🌐 URL local: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Categorías: http://localhost:${PORT}/api/categories`);
      console.log(`📖 API Libros: http://localhost:${PORT}/api/books`);
      console.log(`📝 Modo: ${process.env.NODE_ENV || 'development'}`);
      console.log('────────────────────────────────────────');
    });

    /**
     * Función para cerrar el servidor elegantemente
     */
    const gracefulShutdown = (signal) => {
      console.log(`\n⚠️  Señal ${signal} Received. Closing beginning...`);
      
      server.close((err) => {
        if (err) {
          console.error('❌ Error closing server:', err.message);
          process.exit(1);
        }
        
        console.log('✅ HTTP server successfully closed');
        console.log('🔄 Closing database connections...');
        
        process.exit(0);
      });
      
      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⏰ Timeout. Forcing closure....');
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales de terminación del sistema
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return server;
    
  } catch (error) {
    console.error('❌ Error starting the server:');
    console.error(error.message);
    console.error('🔄 Retrying in 5 seconds...');
    
    // Reintentar conexión después de 5 segundos
    setTimeout(() => {
      console.log('🔄 Retrying connection...');
      startServer();
    }, 5000);
  }
};

/**
 * Manejo de errores globales no capturados
 */
process.on('unhandledRejection', (err, promise) => {
  console.error('🚨 Promise rejected not handled:');
  console.error('Error:', err.message);
  
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', err.stack);
  }
  
  // En producción, cerrar la aplicación; en desarrollo, solo advertir
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Closing server due to rejected promise...');
    process.exit(1);
  } else {
    console.log('⚠️ Continuing in development mode...');
  }
});

/**
 * Manejo de excepciones no capturadas
 */
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught exception:');
  console.error('Error:', err.message);
  
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', err.stack);
  }
  
  console.log('🔄 Closing application...');
  process.exit(1);
});

/**
 * Función para verificar variables de entorno críticas
 */
const checkEnvironmentVariables = () => {
  const requiredEnvVars = ['MONGODB_URI'];
  const missingVars = [];
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('💡 Make sure you create a .env file with all the necessary variables');
    process.exit(1);
  }
  
  console.log('✅ Verified environment variables');
};

/**
 * Función principal de inicialización
 */
const initialize = async () => {
  console.log('🚀 API DIGITAL LIBRARY');
  console.log('📚 Library management system');
  console.log('────────────────────────────────────────');
  
  // Verificar variables de entorno
  checkEnvironmentVariables();
  
  // Iniciar el servidor
  await startServer();
};

// Solo ejecutar si este archivo es el principal
if (require.main === module) {
  initialize().catch(error => {
    console.error('❌ Fatal error initializing application:');
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = app;