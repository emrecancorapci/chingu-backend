export const swaggerJSDocOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chingu Task Manager API',
      version: '1.0.0',
    },
  },
  apis: ['./modules/**/routes.js'], // files containing annotations as above
};