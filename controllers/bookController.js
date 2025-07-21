const Book = require('../models/book');
const Category = require('../models/category');
const {createError } = require('../middleware/errorHandler');

/**
 * @desc    Obtener todos los libros
 * @route   GET /api/books
 * @access  Público
 * Propósito: Lista todos los libros con opciones avanzadas de filtrado, búsqueda y paginación
 */

const getBooks = async (req, res) => {
  try {
    // ... todo tu código actual de getBooks aquí ...
    const { 
    page = 1, 
    limit = 10, 
    sort = '-createdAt',
    search,
    category,
    status,
    minPrice,
    maxPrice,
    language,
    isFeatured
  } = req.query;

  // Construir filtros de búsqueda
  const filters = {};

  // Filtro de búsqueda por texto (título, autor, descripción)
  if (search) {
    filters.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Filtro por categoría
  if (category) {
    filters.category = category;
  }

  // Filtro por estado
  if (status) {
    filters.status = status;
  }

  // Filtro por rango de precios
  if (minPrice || maxPrice) {
    filters.price = {};
    if (minPrice) filters.price.$gte = parseFloat(minPrice);
    if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
  }

  // Filtro por idioma
  if (language) {
    filters.language = language;
  }

  // Filtro por libros destacados
  if (isFeatured !== undefined) {
    filters.isFeatured = isFeatured === 'true';
  }

  // Configurar paginación
  const skip = (page - 1) * limit;

  // Ejecutar consulta con paginación y población de referencias
  const [books, total] = await Promise.all([
    Book.find(filters)
      .populate('category', 'name description color') // Incluir datos de categoría
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Book.countDocuments(filters)
  ]);

  // Calcular información de paginación
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.status(200).json({
    success: true,
    message: 'Libros obtenidos exitosamente',
    data: books,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNextPage,
      hasPrevPage
    },
    filters: {
      search,
      category,
      status,
      priceRange: { min: minPrice, max: maxPrice },
      language,
      isFeatured
    }
  });
    res.status(200).json({
      success: true,
      message: 'Libros obtenidos exitosamente',
      data: books,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      },
      filters: {
        search,
        category,
        status,
        priceRange: { min: minPrice, max: maxPrice },
        language,
        isFeatured
      }
    });

  } catch (error) {
    console.error('Error en getBooks:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener libros'
    });
  }
};


/**
 * @desc    Obtener un libro por ID
 * @route   GET /api/books/:id
 * @access  Público
 * Propósito: Obtiene un libro específico con información detallada
 */

const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('category', 'name description color');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Libro obtenido exitosamente',
      data: book
    });

  } catch (error) {
    console.error('Error en getBookById:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de libro no válido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al obtener libro'
    });
  }
};


/**
 * @desc    Crear nuevo libro
 * @route   POST /api/books
 * @access  Privado (Admin)
 * Propósito: Crea un nuevo libro en la base de datos
 */


const createBook = async (req, res) => {
  try {
    // Los datos ya están validados por el middleware de validación
    const bookData = req.body;

    // Verificar que la categoría existe y está activa
    const category = await Category.findById(bookData.category);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'La categoría especificada no existe'
      });
    }
    if (!category.isActive) {
      return res.status(400).json({
        success: false,
        message: 'La categoría especificada no está activa'
      });
    }

    // Verificar si ya existe un libro con el mismo ISBN
    const existingBook = await Book.findOne({ isbn: bookData.isbn });
    if (existingBook) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un libro con este ISBN'
      });
    }

    // Crear el nuevo libro
    const book = await Book.create(bookData);

    // Obtener el libro creado con la categoría poblada
    const createdBook = await Book.findById(book._id)
      .populate('category', 'name description color');

    res.status(201).json({
      success: true,
      message: 'Libro creado exitosamente',
      data: createdBook
    });

  } catch (error) {
    // ✅ TRY/CATCH EXPLÍCITO para cumplir rúbrica
    console.error('Error en createBook:', error);
    
    // Manejar errores específicos de validación
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }))
      });
    }

    // Manejar error de ISBN duplicado
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un libro con este ISBN',
        field: 'isbn'
      });
    }

    // Manejar error de ObjectId inválido
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de categoría no válido'
      });
    }

    // Error genérico del servidor
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear libro'
    });
  }
};

/**
 * @desc    Actualizar libro
 * @route   PUT /api/books/:id
 * @access  Privado (Admin)
 * Propósito: Actualiza un libro existente
 */
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    let book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado'
      });
    }

    if (updateData.category && updateData.category !== book.category.toString()) {
      const category = await Category.findById(updateData.category);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'La categoría especificada no existe'
        });
      }
      if (!category.isActive) {
        return res.status(400).json({
          success: false,
          message: 'La categoría especificada no está activa'
        });
      }
    }

    if (updateData.isbn && updateData.isbn !== book.isbn) {
      const existingBook = await Book.findOne({ 
        isbn: updateData.isbn,
        _id: { $ne: id }
      });
      if (existingBook) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un libro con este ISBN'
        });
      }
    }

    book = await Book.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    ).populate('category', 'name description color');

    res.status(200).json({
      success: true,
      message: 'Libro actualizado exitosamente',
      data: book
    });

  } catch (error) {
    console.error('Error en updateBook:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID proporcionado no es válido'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar libro'
    });
  }
};


/**
 * @desc    Eliminar libro
 * @route   DELETE /api/books/:id
 * @access  Privado (Admin)
 * Propósito: Elimina un libro de la base de datos
 */
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado'
      });
    }

    await Book.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Libro eliminado exitosamente',
      data: { 
        id,
        title: book.title,
        author: book.author
      }
    });

  } catch (error) {
    console.error('Error en deleteBook:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID proporcionado no es válido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al eliminar libro'
    });
  }
};

/**
 * @desc    Obtener libros disponibles
 * @route   GET /api/books/available
 * @access  Público
 * Propósito: Obtiene solo los libros que están disponibles para venta
 */


const getAvailableBooks = async (req, res) => {
  try{
  const books = await Book.findAvailable();

  res.status(200).json({
    success: true,
    message: 'Libros disponibles obtenidos exitosamente',
    data: books,
    count: books.length
  });
  }catch(error){
    console.error('Error en [getAvailableBooks]:', error);
    res.status(500).json({
    success: false,
    message: 'Error interno del servidor'});
  };
}

/**
 * @desc    Obtener libros por categoría
 * @route   GET /api/books/category/:categoryId
 * @access  Público
 * Propósito: Obtiene libros de una categoría específica
 */
const getBooksByCategory = async (req, res) => {

  try{
    const { categoryId } = req.params;

  // Verificar que la categoría existe
  const category = await Category.findById(categoryId);
  if (!category) {
    throw createError('Categoría no encontrada', 404);
  }

  const books = await Book.findByCategory(categoryId);

  res.status(200).json({
    success: true,
    message: `Libros de la categoría "${category.name}" obtenidos exitosamente`,
    data: books,
    category: {
      id: category._id,
      name: category.name,
      description: category.description
    },
    count: books.length
  });
  }catch{
    console.error('Error en [getBooksByCategory]:', error);
    res.status(500).json({
    success: false,
    message: 'Error interno del servidor'});
  };
}

/**
 * @desc    Obtener libros destacados
 * @route   GET /api/books/featured
 * @access  Público
 * Propósito: Obtiene libros marcados como destacados
 */
const getFeaturedBooks = async (req, res) => {
  try{
    const books = await Book.find({ isFeatured: true })
    .populate('category', 'name description color')
    .sort({ averageRating: -1, reviewCount: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    message: 'Libros destacados obtenidos exitosamente',
    data: books,
    count: books.length
  });
  }catch{
    console.error('Error en [getFeaturedBooks]:', error);
    res.status(500).json({
    success: false,
    message: 'Error interno del servidor'});
  }
};

/**
 * @desc    Buscar libros por texto
 * @route   GET /api/books/search/:searchTerm
 * @access  Público
 * Propósito: Búsqueda avanzada de libros por texto
 */
const searchBooks = async (req, res) => {
  try{
      const { searchTerm } = req.params;
  const { category, minPrice, maxPrice, language } = req.query;

  // Construir filtros
  const filters = {
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { author: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ]
  };

  // Aplicar filtros adicionales
  if (category) filters.category = category;
  if (language) filters.language = language;
  if (minPrice || maxPrice) {
    filters.price = {};
    if (minPrice) filters.price.$gte = parseFloat(minPrice);
    if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
  }

  const books = await Book.find(filters)
    .populate('category', 'name description color')
    .sort({ title: 1 });

  res.status(200).json({
    success: true,
    message: `Resultados de búsqueda para: "${searchTerm}"`,
    data: books,
    searchTerm,
    count: books.length
  });
  }catch{
    console.error('Error en [searchBooks]:', error);
    res.status(500).json({
    success: false,
    message: 'Error interno del servidor'});
  };

}

/**
 * @desc    Actualizar stock de libro
 * @route   PATCH /api/books/:id/stock
 * @access  Privado (Admin)
 * Propósito: Actualiza el stock de un libro específico
 */
const updateBookStock = async (req, res) => {
  const { id } = req.params;
  const { quantity, operation } = req.body; // operation: 'add' | 'reduce' | 'set'

  const book = await Book.findById(id);
  if (!book) {
    throw createError('Libro no encontrado', 404);
  }

  try {
    switch (operation) {
      case 'add':
        await book.addStock(quantity);
        break;
      case 'reduce':
        await book.reduceStock(quantity);
        break;
      case 'set':
        book.stock = quantity;
        await book.save();
        break;
      default:
        throw createError('Operación no válida. Use: add, reduce, o set', 400);
    }

    // Obtener el libro actualizado
    const updatedBook = await Book.findById(id)
      .populate('category', 'name description color');

    res.status(200).json({
      success: true,
      message: `Stock ${operation === 'add' ? 'aumentado' : operation === 'reduce' ? 'reducido' : 'actualizado'} exitosamente`,
      data: updatedBook,
      stockChange: {
        operation,
        quantity,
        newStock: updatedBook.stock
      }
    });
  } catch (error) {
    throw createError(error.message, 400);
  }
};

/**
 * @desc    Obtener estadísticas de libros
 * @route   GET /api/books/stats
 * @access  Privado (Admin)
 * Propósito: Obtiene estadísticas generales de los libros
 */
const getBookStats = (async (req, res) => {
  const [
    totalBooks,
    availableBooks,
    outOfStockBooks,
    featuredBooks,
    avgPrice,
    totalValue
  ] = await Promise.all([
    Book.countDocuments({}),
    Book.countDocuments({ status: 'disponible', stock: { $gt: 0 } }),
    Book.countDocuments({ status: 'agotado' }),
    Book.countDocuments({ isFeatured: true }),
    Book.aggregate([{ $group: { _id: null, avgPrice: { $avg: '$price' } } }]),
    Book.aggregate([{ $group: { _id: null, totalValue: { $sum: { $multiply: ['$price', '$stock'] } } } }])
  ]);

  // Obtener libros más populares (por rating)
  const topRatedBooks = await Book.find({ reviewCount: { $gt: 0 } })
    .populate('category', 'name')
    .sort({ averageRating: -1, reviewCount: -1 })
    .limit(5)
    .select('title author averageRating reviewCount');

  // Distribución por categorías
  const categoryDistribution = await Book.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $unwind: '$category'
    },
    {
      $project: {
        categoryName: '$category.name',
        count: 1,
        totalValue: 1
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  res.status(200).json({
    success: true,
    message: 'Estadísticas de libros obtenidas exitosamente',
    data: {
      totals: {
        total: totalBooks,
        available: availableBooks,
        outOfStock: outOfStockBooks,
        featured: featuredBooks
      },
      financial: {
        averagePrice: avgPrice[0]?.avgPrice || 0,
        totalInventoryValue: totalValue[0]?.totalValue || 0
      },
      topRated: topRatedBooks,
      categoryDistribution
    }
  });
});

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getAvailableBooks,
  getBooksByCategory,
  getFeaturedBooks,
  searchBooks,
  updateBookStock,
  getBookStats
};