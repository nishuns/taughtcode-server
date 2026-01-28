import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TaughtCode API',
            version: '1.0.0',
            description: 'TaughtCode API Documentation',
            contact: {
                name: 'TaughtCode API Support',
                email: 'support@taughtcode.com'
            },
            license: {
                name: 'ISC',
                url: 'https://opensource.org/licenses/ISC'
            }
        },
        servers: [
            {
                url: process.env.API_BASE_URL || 'http://localhost:7001',
                description: 'Development server'
            },
            {
                url: 'https://api.taughtcode.com',
                description: 'Production server'
            }
        ],
        components: {
            schemas: {
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            example: 'Error message'
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Health',
                description: 'API health and status endpoints'
            }
        ]
    },
    apis: [
        './src/routes/*.js',
        './src/controllers/*.js'
    ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

