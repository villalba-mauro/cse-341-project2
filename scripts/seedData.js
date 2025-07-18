const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/category');
const Book = require('../models/book');

console.log('🌱 Iniciando script de datos de prueba...');

// Datos de categorías
const categories = [
  {
    name: 'Ficción',
    description: 'Libros de ficción literaria contemporánea y clásica',
    color: '#007bff'
  },
  {
    name: 'Ciencia',
    description: 'Libros científicos y divulgación científica',
    color: '#28a745'
  },
  {
    name: 'Tecnología',
    description: 'Libros sobre programación, informática y nuevas tecnologías',
    color: '#17a2b8'
  }
];

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

// Función principal
const seedDatabase = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();

    // Limpiar datos existentes
    console.log('🧹 Limpiando base de datos...');
    await Book.deleteMany({});
    await Category.deleteMany({});
    console.log('✅ Base de datos limpiada');

    // Crear categorías
    console.log('📂 Creando categorías...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ ${createdCategories.length} categorías creadas exitosamente`);

    // Mostrar IDs de categorías para reference
    createdCategories.forEach(cat => {
      console.log(`   - ${cat.name}: ${cat._id}`);
    });

    // Crear datos de libros usando los IDs de las categorías creadas
    const ficcionId = createdCategories.find(cat => cat.name === 'Ficción')._id;
    const cienciaId = createdCategories.find(cat => cat.name === 'Ciencia')._id;
    const tecnologiaId = createdCategories.find(cat => cat.name === 'Tecnología')._id;

    const booksData = [
      {
        title: 'El Principito',
        author: 'Antoine de Saint-Exupéry',
        isbn: '9780156012195',
        description: 'Una hermosa fábula sobre la amistad, el amor y la pérdida de la inocencia.',
        category: ficcionId,
        publishedDate: new Date('1943-04-06'),
        publisher: 'Editorial Salamandra',
        pages: 96,
        language: 'español',
        price: 12.99,
        stock: 30,
        status: 'disponible',
        averageRating: 4.7,
        reviewCount: 950,
        isFeatured: true
      },
      {
        title: '1984',
        author: 'George Orwell',
        isbn: '9780451524935',
        description: 'Una distopía que presenta un futuro totalitario donde el Gran Hermano controla todo.',
        category: ficcionId,
        publishedDate: new Date('1949-06-08'),
        publisher: 'Secker & Warburg',
        pages: 328,
        language: 'inglés',
        price: 18.50,
        stock: 22,
        status: 'disponible',
        averageRating: 4.6,
        reviewCount: 2100,
        isFeatured: true
      },
      {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        description: 'Una guía esencial para escribir código limpio, mantenible y eficiente.',
        category: tecnologiaId,
        publishedDate: new Date('2008-08-01'),
        publisher: 'Prentice Hall',
        pages: 464,
        language: 'inglés',
        price: 45.99,
        stock: 20,
        status: 'disponible',
        averageRating: 4.7,
        reviewCount: 2500,
        isFeatured: true
      },
      {
        title: 'Una breve historia del tiempo',
        author: 'Stephen Hawking',
        isbn: '9780553380163',
        description: 'Un viaje fascinante por los conceptos más complejos de la física moderna.',
        category: cienciaId,
        publishedDate: new Date('1988-04-01'),
        publisher: 'Bantam Books',
        pages: 256,
        language: 'español',
        price: 22.00,
        stock: 18,
        status: 'disponible',
        averageRating: 4.5,
        reviewCount: 800,
        isFeatured: true
      }
    ];

    // Crear libros
    console.log('📚 Creando libros...');
    const createdBooks = await Book.insertMany(booksData);
    console.log(`✅ ${createdBooks.length} libros creados exitosamente`);

    // Mostrar estadísticas finales
    const totalCategories = await Category.countDocuments({});
    const totalBooks = await Book.countDocuments({});
    const availableBooks = await Book.countDocuments({ status: 'disponible' });

    console.log('\n📊 ESTADÍSTICAS FINALES:');
    console.log(`   📂 Total categorías: ${totalCategories}`);
    console.log(`   📚 Total libros: ${totalBooks}`);
    console.log(`   ✅ Libros disponibles: ${availableBooks}`);

    console.log('\n🎉 ¡Datos de prueba creados exitosamente!');
    console.log('💡 Ahora puedes probar la API:');
    console.log('   🔗 http://localhost:3000/api/categories');
    console.log('   🔗 http://localhost:3000/api/books');

  } catch (error) {
    console.error('❌ Error durante la creación de datos:', error.message);
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

// Agregar timeout para evitar que se cuelgue
const timeoutId = setTimeout(() => {
  console.error('⏰ Timeout: El script tardó demasiado. Cancelando...');
  process.exit(1);
}, 30000); // 30 segundos timeout

// Ejecutar el script
seedDatabase().finally(() => {
  clearTimeout(timeoutId);
});