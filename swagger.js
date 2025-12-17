const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { Certificate } = require('./src/models');



const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Qodebyte Academy API',
      version: '1.0.0',
      description: 'API documentation for Qodebyte Academy',
    },
    servers: [
      { url: 'https://academy.qodebyte.com/api' }
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
    CourseModules: {
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
    CourseLessons: {
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

    User: {
        type: 'object',
        properties: {
          user_id: { type: 'string', format: 'uuid' },
          full_name: { type: 'string' },
          dob: { type: 'string', format: 'date-time' },
          email: { type: 'string', format: 'email' },
          address: {type: 'string'},
          country:{type: 'string'},
          state:{type: 'string'},
          password: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          isVerified: { type: 'boolean' },
          profilePic: { type: 'string', nullable: true },
          is_social_media: { type: 'boolean' },
          ReferralSourceOptions: {type: 'string'},
          learning_mode: { type: 'string', enum: ['online','offline'], default: 'offline' },
          interested_course_ids: { type: 'array', items: { type: 'string', format: 'uuid' }, nullable: true, description: 'List of course IDs the user is interested in' },
          last_login: { type: 'string', format: 'date-time', nullable: true },
          login_success_count: { type: 'integer' },
          twoFa_enabled: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time'}
        }
    },

     Assignment: {
          type: 'object',
          properties: {
            assignment_id: { type: 'string', format: 'uuid' },
            module_id: { type: 'string', format: 'uuid' },
            instructions: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
      
         AssignmentSubmission: {
          type: 'object',
          properties: {
            submission_id: { type: 'string', format: 'uuid' },
            student_id: { type: 'string', format: 'uuid' },
            assignment_id: { type: 'string', format: 'uuid' },
            file_url: { type: 'string' },
            grade: { type: 'number', format: 'float', nullable: true },
            feedback: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

         BlacklistedToken: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' }
          }
        },

        
        Notification: {
          type: 'object',
          properties: {
            notification_id: { type: 'string', format: 'uuid' },
            student_id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            message: { type: 'string' },
            status: { type: 'string', enum: ['unread', 'read'], default: 'unread' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

         OTP: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            entity_id: { type: 'string', format: 'uuid' },
            entity_type: { type: 'string', enum: ['Admin', 'User', 'Vendor'] },
            otp: { type: 'string' },
            purpose: { type: 'string' },
            expires_at: { type: 'string', format: 'date-time' },
            attempts: { type: 'integer' }
          }
        },

          Payment: {
          type: 'object',
          properties: {
            payment_id: { type: 'string', format: 'uuid' },
            student_id: { type: 'string', format: 'uuid' },
            course_id: { type: 'string', format: 'uuid' },
            amount: { type: 'number', format: 'float' },
            payment_method: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['completed', 'part_payment', 'defaulted', 'awaiting_payment'], default: 'awaiting_payment' },
            reference: { type: 'string', nullable: true },
            installment: { type: 'boolean' },
            due_date: { type: 'string', format: 'date-time', nullable: true },
            receipt: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        Progress: {
          type: 'object',
          properties: {
            progress_id: { type: 'string', format: 'uuid' },
            student_id: { type: 'string', format: 'uuid' },
            lesson_id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['not_started', 'started', 'over_stayed', 'completed'], default: 'not_started' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

          Project: {
          type: 'object',
          properties: {
            project_id: { type: 'string', format: 'uuid' },
            module_id: { type: 'string', format: 'uuid' },
            instructions: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

          ProjectSubmission: {
          type: 'object',
          properties: {
            project_submission_id: { type: 'string', format: 'uuid' },
            student_id: { type: 'string', format: 'uuid' },
            project_id: { type: 'string', format: 'uuid' },
            file_url: { type: 'string' },
            grade: { type: 'number', format: 'float', nullable: true },
            feedback: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

          Quiz: {
          type: 'object',
          properties: {
            quiz_id: { type: 'string', format: 'uuid' },
            module_id: { type: 'string', format: 'uuid' },
            questions: { type: 'object', description: 'JSON array/object of questions' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

         QuizResult: {
          type: 'object',
          properties: {
            result_id: { type: 'string', format: 'uuid' },
            student_id: { type: 'string', format: 'uuid' },
            module_id: { type: 'string', format: 'uuid' },
            score: { type: 'number', format: 'float' },
            total_answered: { type: 'integer' },
            answers: { type: 'object', description: 'JSON of user answers' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

         StudentCourse: {
          type: 'object',
          properties: {
            student_course_id: { type: 'string', format: 'uuid' },
            student_id: { type: 'string', format: 'uuid' },
            course_id: { type: 'string', format: 'uuid' },
            payment_type: { type: 'string', nullable: true },
            payment_status: { type: 'string', enum: ['paid', 'pending', 'part_payment', 'defaulted', 'refunded'], default: 'pending' },
            unlocked_modules: { type: 'integer' },
            total_modules: {type: 'integer'},
            paid_amount: { type: 'number', format: 'float' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

         StudentModule: {
          type: 'object',
          properties: {
            student_module_id: { type: 'string', format: 'uuid' },
            student_id: { type: 'string', format: 'uuid' },
            module_id: { type: 'string', format: 'uuid' },
            completed: { type: 'boolean', default: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          description: 'Tracks module-level completion for a student'
        },

        Certificate: {
          type: 'object',
          properties: {
             certificate_id: { type: 'string', format: 'uuid' },
             student_id: { type: 'string', format: 'uuid' },
             course_id: { type: 'string', format: 'uuid' },
            module_id: { type: 'string', format: 'uuid' },
            certificate_type:  { type: 'string', enum: ['course', 'module']},
             issued_at:  { type: 'string', format: 'date-time' },
              file_url: { type: 'string' }
          }
        }
   
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
