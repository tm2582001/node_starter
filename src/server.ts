import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import client from 'prom-client';

import type { ConfigurationType } from './configurations.js';
import morganMiddleware from './middlewares/morgan.middleware.js';
import { requestIdMiddleware } from './middlewares/request-id.middleware.js';
import metrics from './routes/metrics.route.js';
import v1 from './routes/v1/index.js';

const createServer = (config: ConfigurationType) => {
  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics({ register: client.register });

  const app = express();
  app
    .disable('x-powered-by')
    .use((req: Request, _res: Response, next: NextFunction) => {
      req.config = config;

      return next();
    })
    .use(requestIdMiddleware)
    .use(morganMiddleware)
    .use(express.urlencoded({ extended: true }))
    .use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get('/metrics', metrics);

  app.use('/api/v1', v1);

  //   app.use(errorHandler);

  return app;
};

export default createServer;
