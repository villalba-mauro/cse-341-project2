const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

/**
 * Configuración de Passport para autenticación OAuth con Google
 * Propósito: Maneja la autenticación con Google OAuth 2.0
 */

/**
 * Serialización del usuario para la sesión
 * Propósito: Determina qué datos del usuario se almacenan en la sesión
 */
passport.serializeUser((user, done) => {
  done(null, user._id);
});

/**
 * Deserialización del usuario desde la sesión
 * Propósito: Recupera el usuario completo usando el ID almacenado en la sesión
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Estrategia de Google OAuth 2.0
 * Propósito: Configura la autenticación con Google
 */
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Buscar si ya existe un usuario con este Google ID
    let user = await User.findByGoogleId(profile.id);
    
    if (user) {
      // Usuario existente - actualizar última conexión
      await user.updateLastLogin();
      return done(null, user);
    }
    
    // Verificar si existe un usuario con el mismo email (para vincular cuentas)
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Vincular cuenta existente con Google
      user.googleId = profile.id;
      user.provider = 'google';
      user.avatar = profile.photos[0].value;
      user.emailVerified = true;
      await user.updateLastLogin();
      await user.save();
      
      return done(null, user);
    }
    
    // Crear nuevo usuario
    const newUser = new User({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      avatar: profile.photos[0].value,
      provider: 'google',
      emailVerified: true,
      lastLogin: new Date()
    });
    
    await newUser.save();
    done(null, newUser);
    
  } catch (error) {
    console.error('Error en Google OAuth:', error);
    done(error, null);
  }
}));

/**
 * Middleware para verificar autenticación
 * Propósito: Verifica si el usuario está autenticado
 */
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({
    success: false,
    message: 'Acceso denegado. Debes estar autenticado para acceder a este recurso.',
    loginUrl: '/auth/google'
  });
};

/**
 * Middleware para verificar rol de administrador
 * Propósito: Verifica si el usuario tiene permisos de administrador
 */
const ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  
  res.status(403).json({
    success: false,
    message: 'Acceso denegado. Se requieren permisos de administrador.',
    userRole: req.user ? req.user.role : 'no autenticado'
  });
};

/**
 * Middleware opcional para obtener usuario si está autenticado
 * Propósito: Agrega información del usuario sin requerir autenticación
 */
const optionalAuth = (req, res, next) => {
  // Simplemente continúa sin requerir autenticación
  next();
};

/**
 * Función para verificar si el usuario es propietario del recurso
 * Propósito: Verifica si el usuario puede modificar un recurso específico
 */
const ensureOwnershipOrAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Debes estar autenticado'
    });
  }
  
  // Los administradores pueden acceder a todo
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Verificar si el usuario es propietario (implementar según sea necesario)
  // Por ahora, solo permitir a administradores modificar recursos
  return res.status(403).json({
    success: false,
    message: 'No tienes permisos para modificar este recurso'
  });
};

module.exports = {
  ensureAuthenticated,
  ensureAdmin,
  optionalAuth,
  ensureOwnershipOrAdmin
};