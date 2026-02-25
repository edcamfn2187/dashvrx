import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import dotenv from 'dotenv';
import authRoutes from './auth/auth.routes';
import { authenticate } from './auth/auth.middleware';

dotenv.config();

const app = express();

/**
 * Validate environment variables
 */
const envSchema = z.object({
  PORT: z.string().default('3000'),
  FRONTEND_URL: z.string().url(),
  NODE_ENV: z.string().default('development'),
  DOWNLOAD_DIR: z.string().default('downloads')
});

const env = envSchema.parse(process.env);

/**
 * =========================
 * SECURITY MIDDLEWARES
 * =========================
 */
app.use(helmet());

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
}));

app.use(express.json({ limit: '10kb' }));

/**
 * =========================
 * ROUTES
 * =========================
 */

app.use('/api/auth', authRoutes);

app.get('/api/protected', authenticate, (req, res) => {
  res.json({ message: 'Protected route accessed' });
});

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});

app.post('/api/users', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = userSchema.parse(req.body);
    return res.status(201).json({ data: validated });
  } catch (error) {
    next(error);
  }
});

app.get('/api/download/:filename', (req: Request, res: Response, next: NextFunction) => {
  try {
    const filename = req.params.filename;

    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const downloadDir = path.resolve(env.DOWNLOAD_DIR);
    const filePath = path.join(downloadDir, filename);

    if (!filePath.startsWith(downloadDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    return res.download(filePath);
  } catch (error) {
    next(error);
  }
});

/**
 * =========================
 * 404 HANDLER
 * =========================
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

/**
 * =========================
 * GLOBAL ERROR HANDLER
 * =========================
 */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (env.NODE_ENV === 'production') {
    return res.status(400).json({ error: 'Request failed' });
  }

  return res.status(400).json({
    error: err.message,
    stack: err.stack
  });
});

/**
 * =========================
 * START SERVER
 * =========================
 */
if (env.NODE_ENV !== 'test') {
  app.listen(parseInt(env.PORT), () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

export { app };