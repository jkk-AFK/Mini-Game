import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { json, urlencoded } from 'express';
import { collectDefaultMetrics, register } from 'prom-client';
import { router as authRouter } from './routes/auth.js';
import { router as userRouter } from './routes/users.js';
import { router as gameRouter } from './routes/games.js';
import { router as scoreRouter } from './routes/scores.js';
import { router as adminRouter } from './routes/admin.js';
import { errorHandler } from './middleware/error-handler.js';
import { configurePassport } from './config/passport.js';

export function buildApp() {
  const app = express();

  configurePassport();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? '*',
      credentials: true,
    }),
  );
  app.use(morgan('dev'));
  app.use(cookieParser());
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use(passport.initialize());

  if (!register.getSingleMetric('process_cpu_user_seconds_total')) {
    collectDefaultMetrics();
  }

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/metrics', async (_req, res, next) => {
    try {
      res.setHeader('Content-Type', register.contentType);
      res.send(await register.metrics());
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/games', gameRouter);
  app.use('/api/v1/scores', scoreRouter);
  app.use('/api/v1/admin', adminRouter);

  app.use(errorHandler);

  return app;
}
