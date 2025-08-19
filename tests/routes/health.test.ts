import assert from 'node:assert';
import { test } from 'node:test';

import buildConfig from '../../src/configurations.js';
import createDbPool from '../../src/db/index.js';
import createServer from '../../src/server.js';

test('Health endpoint should return 200 and ok: true', async () => {
  const config = buildConfig();
  const db = await createDbPool(config);
  const app = createServer(config, db);

  const server = app.listen(config.port, async () => {
    try {
      const response = await fetch(`http://localhost:${config.port}/health`);
      const data = (await response.json()) as { ok: boolean };

      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.ok, true);

      server.close();
    } catch (error) {
      server.close();
      throw error;
    }
  });
});
