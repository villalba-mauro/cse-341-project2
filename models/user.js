const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Esquema para los Usuarios
 * Propósito: Define la estructura de usuarios con autenticación OAuth y local
 */
const userSchema = new mongoose.Schema({
  // Campo 1: Email del usuario (único)
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: [true, 'Ya existe un usuario con este email'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Valida formato de email
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'El email debe tener un formato válido'
    }
  },

  // Campo 2: Nombre completo del usuario
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },

  // Campo 3: Contraseña (para autenticación local)
  password: {
    type: String,
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No incluir en consultas por defecto
  },

  // Campo 4: ID de Google OAuth
  googleId: {
    type: String,
    sparse: true // Permite que sea único pero opcional
  },

  // Campo 5: Avatar/foto del usuario
  avatar: {
    type: String,
    default: ''
  },

  // Campo 6: Rol del usuario
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Rol no válido'
    },
    default: 'user'
  },

  // Campo 7: Proveedor de autenticación
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },

  // Campo 8: Estado activo del usuario
  isActive: {
    type: Boolean,
    default: true
  },

  // Campo 9: Fecha del último login
  lastLogin: {
    type: Date,
    default: Date.now
  },

  // Campo 10: Verificación de email
  emailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true, // Agrega createdAt y updatedAt
  versionKey: false
});

/**
 * Middleware pre-save para hashear contraseñas
 * Propósito: Encripta la contraseña antes de guardarla en la base de datos
 */
userSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña fue modificada o es nueva
  if (!this.isModified('password')) return next();
  
  try {
    // Generar salt y hashear contraseña
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Método para comparar contraseñas
 * Propósito: Verifica si la contraseña proporcionada coincide con la hasheada
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Método virtual para obtener información pública del usuario
 * Propósito: Devuelve solo la información segura del usuario
 */
userSchema.virtual('publicProfile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    provider: this.provider,
    lastLogin: this.lastLogin,
    emailVerified: this.emailVerified
  };
});

/**
 * Método de instancia para actualizar último login
 * Propósito: Actualiza la fecha del último acceso del usuario
 */
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

/**
 * Método estático para buscar por email
 * Propósito: Encuentra un usuario por email incluyendo la contraseña
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email }).select('+password');
};

/**
 * Método estático para buscar por Google ID
 * Propósito: Encuentra un usuario por su ID de Google OAuth
 */
userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId });
};

// Configurar virtuales en JSON
userSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Eliminar campos sensibles al convertir a JSON
    delete ret.password;
    delete ret.googleId;
    return ret;
  }
});

module.exports = mongoose.model('user', userSchema);