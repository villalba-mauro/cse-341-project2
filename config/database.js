const mongoose = require('mongoose');

/**
 * Función para conectar a MongoDB
 * Propósito: Establece la conexión con la base de datos MongoDB usando Mongoose
 */
const connectDB = async () => {
  try {
    // Intenta conectar a MongoDB usando la URI del archivo .env
    // Nota: useNewUrlParser y useUnifiedTopology son deprecated en versiones nuevas
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    // Si la conexión es exitosa, muestra el host conectado
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    // Si hay error, lo muestra y termina el proceso
    console.error(`Error de conexión a MongoDB: ${error.message}`);
    process.exit(1); // Termina la aplicación con código de error
  }
};

/**
 * Función para manejar eventos de la conexión
 * Propósito: Configurar listeners para eventos de la base de datos
 */
const handleConnectionEvents = () => {
  // Evento cuando se conecta exitosamente
  mongoose.connection.on('connected', () => {
    console.log('Mongoose conectado a MongoDB');
  });

  // Evento cuando hay error en la conexión
  mongoose.connection.on('error', (err) => {
    console.log('Error en la conexión de Mongoose:', err);
  });

  // Evento cuando se desconecta
  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose desconectado');
  });

  // Cierra la conexión cuando la aplicación termina
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Conexión de Mongoose cerrada por terminación de la aplicación');
    process.exit(0);
  });
};

module.exports = { connectDB, handleConnectionEvents };