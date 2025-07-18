console.log('🌱 Iniciando script de prueba...');

const mongoose = require('mongoose');
require('dotenv').config();

console.log('📦 Modulos cargados');

// Conectar a MongoDB
async function testConnection() {
  try {
    console.log('🔄 Intentando conectar a MongoDB...');
    console.log('URI:', process.env.MONGODB_URI ? 'Definida' : 'NO DEFINIDA');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB exitosamente');
    
    // Cerrar conexión inmediatamente
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    console.log('🎉 Prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testConnection();