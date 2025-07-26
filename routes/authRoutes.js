const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/user');
const { ensureAuthenticated } = require('../config/passport');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId
 *         name:
 *           type: string
 *           example: "Juan Pérez"
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           example: "juan@example.com"
 *           description: User's email address
 *         avatar:
 *           type: string
 *           format: uri
 *           description: User's profile picture URL
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: "user"
 *           description: User's role in the system
 *         provider:
 *           type: string
 *           enum: [local, google]
 *           example: "google"
 *           description: Authentication provider
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         emailVerified:
 *           type: boolean
 *           example: true
 *           description: Whether email is verified
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     GoogleOAuth:
 *       type: oauth2
 *       flows:
 *         authorizationCode:
 *           authorizationUrl: /auth/google
 *           tokenUrl: /auth/google/callback
 *           scopes:
 *             profile: Access to user profile
 *             email: Access to user email
 */

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     description: Redirects user to Google OAuth consent screen
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *               example: "https://accounts.google.com/oauth/authorize?..."
 */
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback endpoint
 *     tags: [Authentication]
 *     description: Handles the callback from Google OAuth and completes authentication
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for security
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Autenticación exitosa"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error en la autenticación"
 */
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/auth/login/failure' 
  }),
  async (req, res) => {
    try {
      // Autenticación exitosa
      res.status(200).json({
        success: true,
        message: 'Autenticación exitosa',
        user: req.user.publicProfile,
        redirectUrl: '/api-docs' // Redirigir a la documentación
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error interno durante la autenticación',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     description: Logs out the authenticated user and destroys the session
 *     security:
 *       - GoogleOAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sesión cerrada exitosamente"
 *       500:
 *         description: Server error during logout
 */
router.post('/logout', (req, res) => {
  try {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error al cerrar sesión',
          error: err.message
        });
      }
      
      // Destruir la sesión
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error al destruir la sesión',
            error: err.message
          });
        }
        
        res.status(200).json({
          success: true,
          message: 'Sesión cerrada exitosamente'
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno durante el logout',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     description: Returns the profile of the currently authenticated user
 *     security:
 *       - GoogleOAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Perfil de usuario obtenido exitosamente"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Acceso denegado. Debes estar autenticado."
 */
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    // Obtener información actualizada del usuario
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Perfil de usuario obtenido exitosamente',
      user: user.publicProfile
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el perfil',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /auth/status:
 *   get:
 *     summary: Check authentication status
 *     tags: [Authentication]
 *     description: Returns whether the user is currently authenticated
 *     responses:
 *       200:
 *         description: Authentication status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 isAuthenticated:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: null
 *                 loginUrl:
 *                   type: string
 *                   example: "/auth/google"
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    isAuthenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? req.user.publicProfile : null,
    loginUrl: '/auth/google'
  });
});

/**
 * @swagger
 * /auth/login/failure:
 *   get:
 *     summary: Handle authentication failure
 *     tags: [Authentication]
 *     description: Endpoint called when authentication fails
 *     responses:
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error en la autenticación con Google"
 */
router.get('/login/failure', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Error en la autenticación con Google',
    error: 'Authentication failed',
    loginUrl: '/auth/google'
  });
});

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Authentication]
 *     description: Returns a list of all users - requires admin role
 *     security:
 *       - GoogleOAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get('/users', ensureAuthenticated, async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador.'
      });
    }
    
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments({})
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    res.status(200).json({
      success: true,
      message: 'Usuarios obtenidos exitosamente',
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
});

module.exports = router;