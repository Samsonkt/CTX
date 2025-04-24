import express, { type Request, Response } from "express";
import { registerRoutes } from "./routes";
import path from "path";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// API routes
registerRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  console.log('Serving static files from:', distPath);
  app.use(express.static(distPath));
  app.use('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handling
app.use((err: any, req: Request, res: Response) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app;
