const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');



const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Qodebyte Academy API',
      version: '1.0.0',
      description: 'API documentation for Qodebyte Academy',
    },
    servers: [
      { url: 'http://localhost:5001' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
    Course: {
      type: 'object',
      properties: {
        course_id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        short_description: { type: 'string' },
        full_description: { type: 'string' },
        price: { type: 'number', format: 'float', nullable: true },
        thumbnail: { type: 'string', nullable: true },
        level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
        language: { type: 'string', default: 'English' },
        duration: { type: 'string', nullable: true },
        vendor_id: { type: 'string', format: 'uuid', nullable: true },
        admin_id: { type: 'string', format: 'uuid', nullable: true },
        status: { type: 'string', enum: ['draft', 'pending_review', 'published', 'archived'], default: 'draft' },
        reviewed_by: { type: 'string', format: 'uuid', nullable: true },
        review_notes: { type: 'string', nullable: true },
        is_flagged: { type: 'boolean', default: false },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    CourseModule: {
      type: 'object',
      properties: {
        module_id: { type: 'string', format: 'uuid' },
        course_id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        description: { type: 'string', nullable: true },
        module_order: { type: 'integer', default: 1 },
        duration: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    CourseLesson: {
      type: 'object',
      properties: {
        lesson_id: { type: 'string', format: 'uuid' },
        module_id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        content: { type: 'string', nullable: true },
        video_url: { type: 'string', nullable: true },
        resources: { type: 'object', nullable: true, description: 'JSON object of resources' },
        duration: { type: 'string', nullable: true },
        lesson_order: { type: 'integer', default: 1 },
        is_free_preview: { type: 'boolean', default: false },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },

    Download: {
        type: 'object',
        properties: {
          download_id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          product_id: { type: 'string', format: 'uuid', nullable: true },
          course_lesson_id: { type: 'string', format: 'uuid', nullable: true },
          download_url: { type: 'string'},
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
    },


    User: {
        type: 'object',
        properties: {
          user_id: { type: 'string', format: 'uuid' },
          full_name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          country:{type: 'string'},
          state:{type: 'string'},
          password: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          isVerified: { type: 'boolean' },
          profilePic: { type: 'string', nullable: true },
          is_social_media: { type: 'boolean' },
          last_login: { type: 'string', format: 'date-time', nullable: true },
          login_success_count: { type: 'integer' },
          twoFa_enabled: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time'}
        }
    },

   
    },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
