/**
 * API Handler for Vercel Serverless Functions
 * This file is the entry point for Vercel API requests.
 */

import { Request, Response } from "express";
import handler from "../server/index";

/**
 * Serverless function handler for Vercel
 * This delegates to the main Express app
 */
export default async function(req: Request, res: Response) {
  // Set Vercel flag to indicate serverless environment
  process.env.VERCEL = 'true';
  
  // Set production flag if not already set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  // Log incoming request in production for debugging
  if (process.env.DEBUG === 'true') {
    console.log(`[Vercel API] ${req.method} ${req.url}`);
  }

  try {
    // Pass request to Express app handler
    return await handler(req, res);
  } catch (error) {
    console.error('[Vercel API Error]', error);
    
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