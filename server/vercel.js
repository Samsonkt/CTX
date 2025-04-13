import express from 'express';
import { setupApp } from './index';
import { registerRoutes } from './routes';

// Create Express app instance
const app = express();

// Set up middleware
setupApp(app);

// Register API routes
registerRoutes(app);

// Export the app for Vercel serverless
export default app;
