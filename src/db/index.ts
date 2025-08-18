import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

import type { ConfigurationType } from '../configurations.js';

const createDbPool = async (configuration: ConfigurationType) => {
  const poolConnection = mysql.createPool({
    host: configuration.database.host,
    user: configuration.database.username,
    password: configuration.database.password,
    database: configuration.tenant,
    connectionLimit: configuration.database.connectionLimit,
  });

  try {
    // Try to get a connection from the pool
    const conn = await poolConnection.getConnection();
    await conn.ping(); // optional, ensures DB is reachable
    conn.release();
  } catch (err) {
    // Important: close the pool so we don't leak sockets
    await poolConnection.end();
    throw new Error(`Database connection failed: ${(err as Error).message}`);
  }

  const db = drizzle({ client: poolConnection });

  return db;
};

export default createDbPool;
