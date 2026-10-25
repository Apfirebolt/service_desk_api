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
  apis: ['./routes/*.ts'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Mount Swagger UI route
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// -----------------------------

const __dirname = path.resolve();

app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/complaints', complaintRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/client/build')));

  app.use((req: Request, res: Response, next: NextFunction): void => {
    const error: Error & { status?: number } = new Error('Not Found');
    error.status = 404;

    res.status(200).sendFile(path.join(__dirname + '/client/build/index.html'));
    next(error);
  });
} else {
  app.get('/', (req: Request, res: Response) => {
    res.send('API is running....');
  });
}

app.use(notFound);
app.use(errorHandler);

// Only listen locally if not running in a serverless environment like Vercel
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in development mode on port ${PORT}`);
    console.log(`Swagger Docs available at http://localhost:${PORT}/api/docs`);
  });
}

// Export app for serverless deployments (e.g., Vercel)
export default app;