// This file is used by Vercel to run the Express app in a serverless environment
const express = require('express');
const { setupApp } = require('./index');
const { registerRoutes } = require('./routes');

// Create Express app instance
const app = express();

// Set up middleware
setupApp(app);

// Register API routes
registerRoutes(app);

// In serverless environments, we export the app directly
module.exports = app;