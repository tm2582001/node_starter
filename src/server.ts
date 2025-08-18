import type { Request, Response } from 'express';
import express from 'express';
import client from 'prom-client';

import morganMiddleware from './middlewares/morgan.middleware.js';
import { requestIdMiddleware } from './middlewares/request-id.middleware.js';
import v1 from './routes/v1/index.js';

const createServer = () => {
  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics({ register: client.register });

  const app = express();
  app
    .disable('x-powered-by')
    .use(requestIdMiddleware)
    .use(morganMiddleware)
    .use(express.urlencoded({ extended: true }))
    .use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get('/metrics', async (_req: Request, res: Response) => {
    res.setHeader('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics();
    res.send(metrics);
  });

  app.use('/api/v1', v1);

  //   app.use(errorHandler);

  return app;
};

export default createServer;
