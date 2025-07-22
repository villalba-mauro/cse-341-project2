const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Digital Library API',
      version: '1.0.0',
      description: 'Complete CRUD API for managing books and categories in a digital library',
      contact: {
        name: 'API Support',
        email: 'support@library.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://your-app.onrender.com',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        Category: {
          type: 'object',
          required: ['name', 'description'],
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId'
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'Category name'
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 200,
              description: 'Category description'
            },
            color: {
              type: 'string',
              pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
              description: 'Hexadecimal color code'
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Whether category is active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Book: {
          type: 'object',
          required: ['title', 'author', 'isbn', 'description', 'category', 'publishedDate', 'publisher', 'pages', 'language', 'price'],
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId'
            },
            title: {
              type: 'string',
              maxLength: 200,
              description: 'Book title'
            },
            author: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Book author'
            },
            isbn: {
              type: 'string',
              pattern: '^(?:\\d{9}[\\dX]|\\d{13})$',
              description: 'ISBN-10 or ISBN-13'
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 1000,
              description: 'Book description'
            },
            category: {
              type: 'string',
              description: 'Category ObjectId'
            },
            publishedDate: {
              type: 'string',
              format: 'date',
              description: 'Publication date'
            },
            publisher: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Publisher name'
            },
            pages: {
              type: 'integer',
              minimum: 1,
              maximum: 10000,
              description: 'Number of pages'
            },
            language: {
              type: 'string',
              enum: ['español', 'inglés', 'francés', 'alemán', 'italiano', 'portugués', 'otro'],
              description: 'Book language'
            },
            price: {
              type: 'number',
              minimum: 0,
              description: 'Book price'
            },
            stock: {
              type: 'integer',
              minimum: 0,
              default: 0,
              description: 'Stock quantity'
            },
            status: {
              type: 'string',
              enum: ['disponible', 'agotado', 'descontinuado', 'próximamente'],
              default: 'disponible',
              description: 'Book status'
            },
            coverImage: {
              type: 'string',
              format: 'uri',
              description: 'Cover image URL'
            },
            averageRating: {
              type: 'number',
              minimum: 0,
              maximum: 5,
              description: 'Average rating'
            },
            reviewCount: {
              type: 'integer',
              minimum: 0,
              description: 'Number of reviews'
            },
            isFeatured: {
              type: 'boolean',
              default: false,
              description: 'Whether book is featured'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js'], // Paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};