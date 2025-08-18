if (process.env['NODE_ENV'] !== 'production') {
  await import('dotenv').then((dotenv) => dotenv.config());
}

import buildConfig from './configurations.js';
import { addTransporter } from './logger.js';
import createServer from './server.js';

const server = createServer();

const configurations = buildConfig();

addTransporter(configurations.logs);

server.listen(configurations.port, () => {
  console.log(`listening on port ${configurations.port}`);
});
