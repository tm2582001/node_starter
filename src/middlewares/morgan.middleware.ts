import type { IncomingMessage, ServerResponse } from 'node:http';

import morgan from 'morgan';
import type { FormatFn } from 'morgan';

import logger from '../logger.js';
import reqResponseTime from '../utils/metrics/req-res-time.util.js';
import totalReqCounter from '../utils/metrics/total-req-counter.util.js';

const logFormat = morgan.compile(
  ':method :url :status :res[content-length] - :response-time ms',
);

const formatFunction: FormatFn = (
  tokens,
  req: IncomingMessage,
  res: ServerResponse,
): string => {
  reqResponseTime
    .labels({
      method: tokens['method']?.(req, res) ?? '-',
      route: tokens['url']?.(req, res) ?? '-',
      statusCode: tokens['status']?.(req, res) ?? '-',
    })
    .observe(parseInt(tokens['response-time']?.(req, res) ?? '-1'));

  totalReqCounter.inc();

  const base = logFormat(tokens, req, res) as string;

  return base;
};

const morganMiddleware = morgan(formatFunction, {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
});

export default morganMiddleware;
