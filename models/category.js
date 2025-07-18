const mongoose = require('mongoose');

/**
 * Esquema para las Categorías de libros
 * Propósito: Define la estructura de datos para categorías en MongoDB
 * Esta es una colección más simple que servirá para clasificar los libros
 */
const categorySchema = new mongoose.Schema({
  // Nombre de la categoría (ej: "Ficción", "Ciencia", "Historia")
  name: {
    type: String,
    required: [true, 'El nombre de la categoría es obligatorio'],
    unique: [true, 'Ya existe una categoría con ese nombre'],
    trim: true, // Elimina espacios al inicio y final
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },

  // Descripción de la categoría
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
    maxlength: [200, 'La descripción no puede exceder 200 caracteres']
  },

  // Color hexadecimal para la interfaz (opcional)
  color: {
    type: String,
    default: '#007bff',
    validate: {
      validator: function(v) {
        // Valida que sea un color hexadecimal válido
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'El color debe ser un código hexadecimal válido'
    }
  },

  // Estado activo/inactivo
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  // Opciones del schema
  timestamps: true, // Agrega automáticamente createdAt y updatedAt
  versionKey: false // Elimina el campo __v
});

/**
 * Middleware pre-save
 * Propósito: Se ejecuta antes de guardar un documento
 * Convierte el nombre a formato título (primera letra mayúscula)
 */
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
  }
  next();
});

/**
 * Método virtual para obtener el conteo de libros
 * Propósito: Permite obtener cuántos libros tiene esta categoría
 * (Se implementará cuando tengamos el modelo de libros)
 */
categorySchema.virtual('bookCount', {
  ref: 'book', // Hace referencia al modelo Book
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Asegurar que los virtuales se incluyan cuando convirtamos a JSON
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

/**
 * Método estático para buscar categorías activas
 * Propósito: Método personalizado para obtener solo categorías activas
 */
categorySchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

/**
 * Método de instancia para desactivar categoría
 * Propósito: Método para marcar una categoría como inactiva en lugar de eliminarla
 */
categorySchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('category', categorySchema);