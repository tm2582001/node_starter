import cluster from 'node:cluster';
import { Server } from 'node:http';
import { cpus } from 'node:os';
import process from 'node:process';

if (process.env['NODE_ENV'] !== 'production') {
  await import('dotenv').then((dotenv) => dotenv.config());
}

import buildConfig from './configurations.js';
import createDbPool from './db/index.js';
import { addTransporter } from './logger.js';
import createServer from './server.js';

// Shared server startup logic
async function startServer(processType: 'single' | 'worker') {
  const db = await createDbPool(configurations);
  const app = createServer(configurations, db);
  addTransporter(configurations.logs);
  

  const server = app.listen(configurations.port, () => {
    const message =
      processType === 'single'
        ? `Server listening on port ${configurations.port}`
        : `Worker ${process.pid} listening on port ${configurations.port}`;
    console.log(message);
  });

  return server;
}

// Shared graceful shutdown logic
function setupGracefulShutdown(
  server: Server | null,
  processType: 'single' | 'worker' | 'primary',
) {
  const shutdownHandler = (signal: string) => {
    const processName =
      processType === 'single'
        ? 'Process'
        : processType === 'worker'
          ? `Worker ${process.pid}`
          : 'Primary';

    console.log(`${processName} received ${signal}, shutting down gracefully`);

    if (processType === 'primary') {
      // Shutdown all workers
      for (const id in cluster.workers) {
        cluster.workers[id]?.kill('SIGTERM');
      }
    } else {
      // Shutdown server
      server?.close(() => {
        console.log(
          processType === 'single'
            ? 'Server closed'
            : `Worker ${process.pid} closed server`,
        );
        process.exit(0);
      });
    }
  };

  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
}

const configurations = buildConfig();
const maxCPUs = cpus().length;
const requestedWorkers = configurations.workers;
const numCPUs =
  requestedWorkers <= 0 ? maxCPUs : Math.min(requestedWorkers, maxCPUs);

// Single process mode - no clustering overhead
if (numCPUs === 1) {
  console.log(`Single process mode: Process ${process.pid} starting...`);
  const server = await startServer('single');
  setupGracefulShutdown(server, 'single');
}
// Cluster mode - primary process
else if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Show configuration warnings/info
  if (requestedWorkers > maxCPUs) {
    console.log(
      `⚠️  Warning: Requested ${requestedWorkers} workers, but only ${maxCPUs} CPU cores available.`,
    );
    console.log(`   Limiting to ${numCPUs} workers for optimal performance.`);
  }

  if (requestedWorkers <= 0) {
    console.log(
      `💡 Using all ${maxCPUs} CPU cores (workers: ${requestedWorkers})`,
    );
  }

  console.log(`Forking ${numCPUs} workers...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Restart crashed workers
  cluster.on('exit', (worker, code, signal) => {
    console.log(
      `Worker ${worker.process.pid} died (${signal || code}). Restarting...`,
    );
    cluster.fork();
  });

  setupGracefulShutdown(null, 'primary');
}
// Cluster mode - worker process
else {
  const server = await startServer('worker');
  setupGracefulShutdown(server, 'worker');
}
