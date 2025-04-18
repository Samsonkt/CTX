<<<<<<< HEAD
// Serverless API entry point for Vercel
import { Request, Response } from 'express';
import handler from '../server/index';

export default async function (req: Request, res: Response) {
  return handler(req, res);
=======
// Example serverless API endpoint for Vercel
export default function handler(req, res) {
  res.status(200).json({ message: "API is working!" });
>>>>>>> 2f0d1f0ecab4bf72f122ee9bc0ff7a0e0756936b
}