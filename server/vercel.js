// This file is used by Vercel to run the Express app in a serverless environment
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupApp } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create Express app
const app = express();

// Setup the app (routes, middleware, etc.)
setupApp(app);

// In serverless environments, we export the app directly
export default app;