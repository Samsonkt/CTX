// Serverless API entry point for Vercel
import { Request, Response } from 'express';
import handler from '../server/index';

export default async function (req: Request, res: Response) {
  return handler(req, res);
}