import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api', 
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'LMS Workforce API',
        version: '1.0',
        description: 'API documentation for the Learning Management System',
        contact: {
          name: 'Dev Team',
        },
      },
      tags: [
        { name: 'Mobile - Auth', description: 'Authentication and Registration endpoints to establish sessions.' },
        { name: 'Mobile - Dashboard', description: 'Primary data endpoints loaded upon successful login.' },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
    },
  });
  return spec;
};