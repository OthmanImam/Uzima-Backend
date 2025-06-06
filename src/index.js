import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import routes from './routes/index.js';
import appointmentsRouter from './controllers/appointments.controller.js';
import specs from './config/swagger.js';
import stellarRoutes from './routes/stellar.js'; // Import Stellar routes
import './cron/reminderJob.js'; // Cron job
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Initialize Sentry SDK
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Sentry request & tracing handlers
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Swagger Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Uzima API Documentation"
}));

// Routes
app.use('/api', routes);
app.use('/appointments', appointmentsRouter);
app.use('/stellar', stellarRoutes); // Use Stellar routes
app.use('/api', syncRoutes);
// Sentry debug route - for testing Sentry integration
app.get('/debug-sentry', (req, res) => {
  throw new Error('Sentry test error');
});

// Error handling
app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`API Documentation available at http://localhost:${port}/docs`);
});

export default app;
