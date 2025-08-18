if (process.env['NODE_ENV'] !== 'production') {
  await import('dotenv').then((dotenv) => dotenv.config());
}

import buildConfig from './configurations.js';
import createDbPool from './db/index.js';
import { addTransporter } from './logger.js';
import createServer from './server.js';

const configurations = buildConfig();

const db = await createDbPool(configurations);

const server = createServer(configurations, db);
addTransporter(configurations.logs);

server.listen(configurations.port, () => {
  console.log(`listening on port ${configurations.port}`);
});
