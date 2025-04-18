import express from 'express';
import { Server } from 'http';

export async function registerRoutes(app: express.Application): Promise<Server> {
    // Create HTTP server
    const server = new Server(app);
    
    // Add basic health check route
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    return server;
}