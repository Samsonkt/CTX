/**
 * Main API Handler for Vercel
 * This is the entry point for all API routes
 */

import { Request, Response } from "express";
import handler from "../server/index";

/**
 * Handle API routes
 * This delegates to the main Express app and is used for
 * all API routes via Vercel's catch-all routing
 */
export default async function (req: Request, res: Response) {
  // Set Vercel flag to indicate serverless environment
  process.env.VERCEL = 'true';
  
  // Set production flag if not already set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }
  
  try {
    // Pass request to Express app handler
    return await handler(req, res);
  } catch (error) {
    console.error('[API Error]', error);
    
    // If headers not sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'An unexpected error occurred processing your request'
      });
    }
    return res;
  }
}