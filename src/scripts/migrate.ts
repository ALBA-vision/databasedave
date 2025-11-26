import { runMigrations } from '../migrations';
import { pool } from '../lib/db';

async function main() {
  try {
    await runMigrations();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

