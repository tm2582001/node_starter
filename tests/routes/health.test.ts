import assert from 'node:assert';
import { test } from 'node:test';

import buildConfig from '../../src/configurations';
import createDbPool from '../../src/db/index';
import createServer from '../../src/server';

test('Health endpoint should return 200 and ok: true', async () => {
  const config = buildConfig();
  const { db, poolConnection } = await createDbPool(config);
  const app = createServer(config, db);

  const server = app.listen(config.port);

  // Wait for server to start
  await new Promise((resolve) => {
    server.on('listening', resolve);
  });

  try {
    const response = await fetch(`http://localhost:${config.port}/health`);
    const data = (await response.json()) as { ok: boolean };

    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.ok, true);
  } finally {
    // Always cleanup
    await new Promise((resolve) => {
      server.close(() => resolve(void 0));
    });
    await poolConnection.end();
  }
});
