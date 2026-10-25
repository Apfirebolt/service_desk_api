import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import connectDB from './config/db.js';

import userRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

// --- Swagger Configuration ---
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Service Desk Management API',
      version: '1.0.0',
      description: 'API documentation for the MEVN Service Desk Management application',
    },
    servers: [
      {
        url: process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.VERCEL_URL ? 'Production Server' : 'Development Server',
      },
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
  },
  apis: ['./routes/*.ts'], // Updated to target TypeScript route files
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Mount Swagger UI route
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// -----------------------------

const __dirname = path.resolve();

// Serve static assets (CSS, JS, images) from the templates folder
app.use(express.static(path.join(__dirname, 'templates')));

app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/complaints', complaintRoutes);

// Serve templates/index.html at the root endpoint
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'templates/index.html'));
});

app.use(notFound);
app.use(errorHandler);

// Only listen locally if not running in a serverless environment like Vercel
if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 5000;
  const HOST = '0.0.0.0'; // Ensures it listens on both IPv4 and IPv6/local interfaces
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

// Export app for serverless deployments (e.g., Vercel)
export default app;