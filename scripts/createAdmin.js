const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');

console.log('👨‍💼 Iniciando script para crear usuario administrador...');

// Función para conectar a MongoDB
const connectDB = async () => {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB exitosamente');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

// Función principal para crear administrador
const createAdmin = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();

    // Verificar si ya existe un administrador
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('👨‍💼 Ya existe un usuario administrador:');
      console.log(`   - Nombre: ${existingAdmin.name}`);
      console.log(`   - Email: ${existingAdmin.email}`);
      console.log(`   - Proveedor: ${existingAdmin.provider}`);
      console.log('💡 Si necesitas crear otro admin, hazlo manualmente en la base de datos');
      return;
    }

    // Datos del administrador (usando OAuth con Google)
    // Nota: Este admin será promovido cuando se autentique por primera vez con Google
    console.log('📝 Información importante:');
    console.log('Este script no crea directamente un admin con contraseña.');
    console.log('En su lugar, debes:');
    console.log('1. Autenticarte con Google OAuth en la aplicación');
    console.log('2. Luego ejecutar el script de promoción a admin');
    console.log('');
    console.log('O crear manualmente en MongoDB un usuario admin con estos datos:');
    
    const adminData = {
      name: 'Administrador del Sistema',
      email: 'admin@library.com', // Cambia por tu email real
      role: 'admin',
      provider: 'google',
      isActive: true,
      emailVerified: true,
      lastLogin: new Date()
    };

    console.log('👨‍💼 Datos del administrador sugerido:');
    console.log(`   - Nombre: ${adminData.name}`);
    console.log(`   - Email: ${adminData.email}`);
    console.log(`   - Rol: ${adminData.role}`);
    console.log(`   - Proveedor: ${adminData.provider}`);
    
    console.log('\n💡 INSTRUCCIONES PARA CREAR ADMIN:');
    console.log('1. Ve a tu aplicación y autentica con Google OAuth');
    console.log('2. Anota tu email de Google');
    console.log('3. En MongoDB Compass, busca tu usuario en la colección "users"');
    console.log('4. Cambia el campo "role" de "user" a "admin"');
    console.log('5. Guarda los cambios');
    console.log('\nO ejecuta este comando en MongoDB shell:');
    console.log(`db.users.updateOne({email: "TU_EMAIL_DE_GOOGLE"}, {$set: {role: "admin"}})`);

  } catch (error) {
    console.error('❌ Error durante la creación del administrador:', error.message);
    if (error.errors) {
      console.error('Detalles del error:', error.errors);
    }
  } finally {
    // Cerrar conexión
    try {
      await mongoose.connection.close();
      console.log('🔌 Conexión a MongoDB cerrada');
    } catch (closeError) {
      console.error('Error al cerrar conexión:', closeError.message);
    }
    process.exit(0);
  }
};

// Función alternativa para promover un usuario existente a admin
const promoteToAdmin = async (email) => {
  try {
    await connectDB();
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ No se encontró usuario con email: ${email}`);
      return;
    }
    
    if (user.role === 'admin') {
      console.log(`👨‍💼 El usuario ${email} ya es administrador`);
      return;
    }
    
    user.role = 'admin';
    await user.save();
    
    console.log(`✅ Usuario ${email} promovido a administrador exitosamente`);
    console.log(`   - Nombre: ${user.name}`);
    console.log(`   - Rol: ${user.role}`);
    
  } catch (error) {
    console.error('❌ Error al promover usuario:', error.message);
  }
};

// Verificar argumentos de línea de comandos
const args = process.argv.slice(2);
if (args.length > 0) {
  const email = args[0];
  console.log(`📧 Promoviendo usuario con email: ${email}`);
  promoteToAdmin(email).finally(() => {
    mongoose.connection.close();
    process.exit(0);
  });
} else {
  // Ejecutar script normal
  createAdmin();
}