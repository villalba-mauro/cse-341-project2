const mongoose = require('mongoose');

/**
 * Esquema para los Libros
 * Propósito: Define la estructura completa de un libro en la biblioteca
 * Este modelo cumple el requisito de tener 7 o más campos
 */
const bookSchema = new mongoose.Schema({
  // Campo 1: Título del libro
  title: {
    type: String,
    required: [true, 'El título del libro es obligatorio'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres'],
    index: true // Índice para búsquedas rápidas
  },

  // Campo 2: Autor del libro
  author: {
    type: String,
    required: [true, 'El autor es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre del autor no puede exceder 100 caracteres'],
    index: true
  },

  // Campo 3: ISBN (International Standard Book Number)
  isbn: {
    type: String,
    required: [true, 'El ISBN es obligatorio'],
    unique: [true, 'Ya existe un libro con este ISBN'],
    validate: {
      validator: function(v) {
        // Valida formato ISBN-10 o ISBN-13
        return /^(?:\d{9}[\dX]|\d{13})$/.test(v.replace(/-/g, ''));
      },
      message: 'El ISBN debe tener formato válido (10 o 13 dígitos)'
    }
  },

  // Campo 4: Descripción del libro
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },

  // Campo 5: Categoría (referencia a Category)
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',
    required: [true, 'La categoría es obligatoria'],
    index: true
  },

  // Campo 6: Fecha de publicación
  publishedDate: {
    type: Date,
    required: [true, 'La fecha de publicación es obligatoria'],
    validate: {
      validator: function(v) {
        // No puede ser una fecha futura
        return v <= new Date();
      },
      message: 'La fecha de publicación no puede ser futura'
    }
  },

  // Campo 7: Editorial
  publisher: {
    type: String,
    required: [true, 'La editorial es obligatoria'],
    trim: true,
    maxlength: [100, 'El nombre de la editorial no puede exceder 100 caracteres']
  },

  // Campo 8: Número de páginas
  pages: {
    type: Number,
    required: [true, 'El número de páginas es obligatorio'],
    min: [1, 'El libro debe tener al menos 1 página'],
    max: [10000, 'El número de páginas no puede exceder 10,000']
  },

  // Campo 9: Idioma del libro
  language: {
    type: String,
    required: [true, 'El idioma es obligatorio'],
    enum: {
      values: ['español', 'inglés', 'francés', 'alemán', 'italiano', 'portugués', 'otro'],
      message: 'Idioma no válido'
    },
    default: 'español'
  },

  // Campo 10: Precio
  price: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo'],
    set: function(v) {
      // Redondea a 2 decimales
      return Math.round(v * 100) / 100;
    }
  },

  // Campo 11: Stock disponible
  stock: {
    type: Number,
    required: [true, 'El stock es obligatorio'],
    min: [0, 'El stock no puede ser negativo'],
    default: 0
  },

  // Campo 12: Estado d0el libro
  status: {
    type: String,
    enum: {
      values: ['disponible', 'agotado', 'descontinuado', 'próximamente'],
      message: 'Estado no válido'
    },
    default: 'disponible'
  },

  // Campo 13: URL de la imagen de portada
  coverImage: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Campo opcional
        // Valida que sea una URL válida
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'La URL de la imagen debe ser válida y terminar en jpg, jpeg, png, gif o webp'
    }
  },

  // Campo 14: Rating promedio
  averageRating: {
    type: Number,
    min: [0, 'El rating no puede ser menor a 0'],
    max: [5, 'El rating no puede ser mayor a 5'],
    default: 0,
    set: function(v) {
      return Math.round(v * 10) / 10; // Redondea a 1 decimal
    }
  },

  // Campo 15: Número de reseñas
  reviewCount: {
    type: Number,
    min: [0, 'El número de reseñas no puede ser negativo'],
    default: 0
  },

  // Campo 16: Si está destacado o no
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  // Opciones del schema
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  versionKey: false,
  // Configuración para búsquedas de texto
  indexes: [
    { title: 'text', author: 'text', description: 'text' }
  ]
});

/**
 * Middleware pre-save
 * Propósito: Se ejecuta antes de guardar, para validaciones adicionales y formateo
 */
bookSchema.pre('save', function(next) {
  // Capitaliza la primera letra del título
  if (this.isModified('title')) {
    this.title = this.title.charAt(0).toUpperCase() + this.title.slice(1);
  }
  
  // Capitaliza nombre del autor
  if (this.isModified('author')) {
    this.author = this.author.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Actualiza el estado basado en el stock
  if (this.isModified('stock')) {
    if (this.stock === 0 && this.status === 'disponible') {
      this.status = 'agotado';
    } else if (this.stock > 0 && this.status === 'agotado') {
      this.status = 'disponible';
    }
  }

  next();
});

/**
 * Método virtual para calcular si está en stock
 * Propósito: Propiedad calculada que indica si el libro está disponible
 */
bookSchema.virtual('inStock').get(function() {
  return this.stock > 0 && this.status === 'disponible';
});

/**
 * Método virtual para formatear precio
 * Propósito: Devuelve el precio formateado con símbolo de moneda
 */
bookSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});

/**
 * Método estático para buscar libros disponibles
 * Propósito: Encuentra todos los libros que están en stock y disponibles
 */
bookSchema.statics.findAvailable = function() {
  return this.find({ 
    status: 'disponible', 
    stock: { $gt: 0 } 
  }).populate('category');
};

/**
 * Método estático para buscar por categoría
 * Propósito: Encuentra libros de una categoría específica
 */
bookSchema.statics.findByCategory = function(categoryId) {
  return this.find({ category: categoryId }).populate('category');
};

/**
 * Método de instancia para reducir stock
 * Propósito: Reduce el stock cuando se vende un libro
 */
bookSchema.methods.reduceStock = function(quantity = 1) {
  if (this.stock >= quantity) {
    this.stock -= quantity;
    return this.save();
  } else {
    throw new Error('Stock insuficiente');
  }
};

/**
 * Método de instancia para agregar stock
 * Propósito: Aumenta el stock cuando llegan nuevos libros
 */
bookSchema.methods.addStock = function(quantity = 1) {
  this.stock += quantity;
  return this.save();
};

// Asegurar que los virtuales se incluyan en JSON
bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('book', bookSchema);