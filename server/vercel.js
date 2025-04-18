// This file is used by Vercel to run the Express app in a serverless environment
import express from 'express';
import { setupApp } from './index.js';
import { registerRoutes } from './routes.js';

// Create Express app instance
const app = express();

// Set up middleware
await setupApp(app);

// Register API routes
registerRoutes(app);

// In serverless environments, we export the app
export default app;