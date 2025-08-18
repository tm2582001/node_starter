import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import LokiTransport from 'winston-loki';

import type { LogsConfigurationType } from './configurations.js';
import { requestContext } from './utils/request-contex.util.js';

const logLevels = {
  error: 0, // highest priority
  warning: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const requestIdFormat = winston.format((info) => {
  const store = requestContext.getStore();
  info['requestId'] = store?.requestId ?? '-';
  info['workerId'] = process.pid;
  return info;
});

const logger = winston.createLogger({
  levels: logLevels,
  level: process.env['LOG_LEVEL'] || 'debug',
});

export function addTransporter(configurations: LogsConfigurationType) {
  const consoleTransporter = new winston.transports.Console({
    format: winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.timestamp({
        format: 'YYYY-MM-DD hh:mm:ss.SSS A',
      }),
      winston.format.printf(
        ({ timestamp, level, message, logMetadata, stack, workerId }) => {
          const store = requestContext.getStore();
          const requestId = store?.requestId ?? '-';
          const worker = workerId || process.pid;

          return `${timestamp} [${level}]: [Worker:${worker}] [${requestId}] ${logMetadata || ''} ${message} ${stack || ''}`;
        },
      ),
    ),
  });

  if (configurations.terminal) {
    logger.add(consoleTransporter);
  }

  const fileRotateTransport = new DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
      requestIdFormat(),
      winston.format.errors({ stack: true }),
      winston.format.timestamp(),
      winston.format.json(),
    ),
  });

  if (configurations.dailyRotateFile) {
    logger.add(fileRotateTransport);
  }

  if (configurations.loki) {
    const lokiTransport = new LokiTransport({
      host: configurations.lokiUrl ?? '',
      labels: {
        app: configurations.lokiAppName ?? 'my-app',
        workerId: process.pid.toString(),
      },
      json: true,
      format: winston.format.combine(
        requestIdFormat(),
        winston.format.errors({ stack: true }),
        winston.format.timestamp(),
        winston.format.json(),
      ),
      onConnectionError: (err) => console.error(err),
    });

    logger.add(lokiTransport);
  }
}

export default logger;
