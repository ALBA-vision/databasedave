import * as fs from 'fs';
import * as path from 'path';
import { query } from '../lib/db';

export async function runMigrations() {
  console.log('\n📦 Running migrations...\n');

  // Ensure migrations table exists
  const initPath = path.join(__dirname, '000_init.sql');
  if (fs.existsSync(initPath)) {
    const initSQL = fs.readFileSync(initPath, 'utf-8');
    await query(initSQL);
  }

  // Get list of migration files
  const files = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.sql') && f !== '000_init.sql')
    .sort();

  // Get already executed migrations
  const executed = await query('SELECT name FROM public.migrations');
  const executedNames = new Set(executed.rows.map(r => r.name));

  let count = 0;

  // Run pending migrations
  for (const file of files) {
    const migrationName = file.replace('.sql', '');
    
    if (executedNames.has(migrationName)) {
      console.log(`  ⏭️  ${migrationName} (already executed)`);
      continue;
    }

    console.log(`  📦 Running ${migrationName}...`);
    
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf-8');
    
    try {
      await query(sql);
      await query(
        'INSERT INTO public.migrations (name) VALUES ($1)',
        [migrationName]
      );
      console.log(`  ✅ ${migrationName} completed`);
      count++;
    } catch (error) {
      console.error(`  ❌ ${migrationName} failed:`, error);
      throw error;
    }
  }

  if (count === 0) {
    console.log('\n✨ All migrations already up to date!');
  } else {
    console.log(`\n🎉 ${count} migration(s) completed!`);
  }
}
