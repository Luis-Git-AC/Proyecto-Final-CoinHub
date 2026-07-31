import 'dotenv/config';
import { randomUUID } from 'crypto';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import connectDB from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { generateOpenApiDocument } from './config/openapi.js';
import { csrfHeaderGuard } from './middleware/csrf.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './API/routes/authRoutes.js';
import postRoutes from './API/routes/postsRoutes.js';
import commentRoutes from './API/routes/commentsRoutes.js';
import resourceRoutes from './API/routes/resourcesRoutes.js';
import userRoutes from './API/routes/usersRoutes.js';
import portfolioRoutes from './API/routes/portfolioRoutes.js';
import newsRoutes from './API/routes/newsRoutes.js';

const app = express();
const { PORT, FRONTEND_URLS, NODE_ENV } = env;

connectDB();

app.use(helmet());

app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const existing = req.headers['x-request-id'];
      const id = typeof existing === 'string' ? existing : randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    autoLogging: { ignore: (req) => req.url === '/api/health' },
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Inténtalo más tarde.' },
});

// Límite general para el resto de la API (los endpoints de auth ya tienen
// arriba un límite propio, más estricto, contra fuerza bruta/credential stuffing).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Inténtalo más tarde.' },
});

const allowedOrigins = FRONTEND_URLS.split(',').map(url => url.trim()).filter(Boolean);

const isDev = NODE_ENV !== 'production';

const isAllowedDevOrigin = (origin: string): boolean => {
  if (!isDev) return false;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
};

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (isAllowedDevOrigin(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', apiLimiter);
app.use('/api', csrfHeaderGuard);

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/news', newsRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'CryptoHub API - Backend funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      posts: '/api/posts',
      comments: '/api/comments',
      resources: '/api/resources',
      portfolio: '/api/portfolio',
    },
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

const openApiDocument = generateOpenApiDocument();
app.get('/api-docs.json', (_req: Request, res: Response) => res.json(openApiDocument));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌍 Entorno: ${NODE_ENV}`);
  console.log(`🏥 Health check en http://localhost:${PORT}/api/health`);
});
