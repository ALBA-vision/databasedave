import { Pool } from 'pg';
import { environments, Environment } from '../config';

let pool: Pool | null = null;

export function createConnection(env: Environment, password: string): Pool {
  const config = environments[env];
  
  pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: password,
    ssl: { rejectUnauthorized: false },
  });

  return pool;
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not connected. Call createConnection first.');
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const p = getPool();
  const client = await p.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
