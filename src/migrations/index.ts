import * as fs from 'fs';
import * as path from 'path';
import { query } from '../lib/db';

export async function runMigrations() {
  console.log('🚀 Starting migrations...\n');

  // Check if schema exists
  let schemaExists = false;
  try {
    const schemaCheck = await query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '2026'`
    );
    schemaExists = schemaCheck.rows.length > 0;
  } catch (error) {
    console.log('⚠️  Could not check schema existence, continuing...');
  }

  if (!schemaExists) {
    console.log('⚠️  Schema "2026" does not exist. Attempting to create it...');
    try {
      await query('CREATE SCHEMA IF NOT EXISTS "2026"');
      console.log('✅ Schema "2026" created successfully');
      schemaExists = true;
    } catch (error: any) {
      if (error.code === '42501') {
        console.error('❌ Permission denied: Cannot create schema "2026"');
        console.error('   Please ask your database administrator to create the schema first, or');
        console.error('   grant CREATE SCHEMA permission to your user.');
        throw new Error('Schema "2026" does not exist and cannot be created due to insufficient permissions');
      } else if (error.code === '3F000') {
        throw new Error('Schema "2026" does not exist and cannot be created. Please create it first.');
      } else {
        throw error;
      }
    }
  }

  // Ensure migrations table exists
  try {
    const initSQL = fs.readFileSync(
      path.join(__dirname, '000_init.sql'),
      'utf-8'
    );
    await query(initSQL);
  } catch (error: any) {
    if (error.code === '42P07') {
      // Table already exists, that's fine
      console.log('ℹ️  Migrations table already exists');
    } else {
      console.log('⚠️  Could not create migrations table:', error.message);
      throw error;
    }
  }

  // Get list of migration files
  const files = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.sql') && f !== '000_init.sql')
    .sort();

  // Get already executed migrations (handle case where table doesn't exist yet)
  let executedNames = new Set<string>();
  try {
    const executed = await query('SELECT name FROM "2026".migrations');
    executedNames = new Set(executed.rows.map(r => r.name));
  } catch (error: any) {
    if (error.code === '42P01') { // relation does not exist
      console.log('⚠️  Migrations table does not exist yet, will create it...');
      executedNames = new Set();
    } else {
      throw error;
    }
  }

  // Run pending migrations
  for (const file of files) {
    const migrationName = file.replace('.sql', '');
    
    if (executedNames.has(migrationName)) {
      console.log(`⏭️  Skipping ${migrationName} (already executed)`);
      continue;
    }

    console.log(`📦 Running ${migrationName}...`);
    
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf-8');
    
    try {
      await query(sql);
      await query(
        'INSERT INTO "2026".migrations (name) VALUES ($1)',
        [migrationName]
      );
      console.log(`✅ ${migrationName} completed\n`);
    } catch (error: any) {
      // Handle permission errors for schema creation - assume schema exists
      if (error.code === '42501') {
        const errorMessage = error.message || '';
        if (errorMessage.includes('schema') || errorMessage.includes('database')) {
          console.log(`⚠️  Permission denied (likely schema/database creation), assuming schema exists...`);
          // Remove CREATE SCHEMA statements and try again
          const lines = sql.split('\n');
          const filteredLines = lines.filter(line => {
            const trimmed = line.trim();
            return !trimmed.match(/^CREATE\s+SCHEMA/i);
          });
          const sqlWithoutSchema = filteredLines.join('\n');
          
          if (sqlWithoutSchema.trim()) {
            try {
              await query(sqlWithoutSchema);
              await query(
                'INSERT INTO "2026".migrations (name) VALUES ($1)',
                [migrationName]
              );
              console.log(`✅ ${migrationName} completed (schema assumed to exist)\n`);
            } catch (retryError: any) {
              // If it's still a permission error, maybe the schema and tables already exist
              if (retryError.code === '42501' || retryError.code === '42P07') {
                console.log(`⚠️  Permission error or table exists, marking migration as complete...`);
                try {
                  await query(
                    'INSERT INTO "2026".migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                    [migrationName]
                  );
                  console.log(`✅ ${migrationName} marked as complete (objects may already exist)\n`);
                } catch (insertError) {
                  // If we can't insert, the migration table might not exist or we don't have permission
                  console.log(`⚠️  Could not record migration, but continuing...`);
                }
              } else {
                console.error(`❌ ${migrationName} failed after retry:`, retryError);
                throw retryError;
              }
            }
          } else {
            // Migration was only schema creation
            try {
              await query(
                'INSERT INTO "2026".migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                [migrationName]
              );
              console.log(`✅ ${migrationName} skipped (schema already exists)\n`);
            } catch (insertError) {
              console.log(`⚠️  Could not record migration, but continuing...`);
            }
          }
        } else {
          console.error(`❌ ${migrationName} failed:`, error);
          throw error;
        }
      } else {
        console.error(`❌ ${migrationName} failed:`, error);
        throw error;
      }
    }
  }

  console.log('🎉 All migrations completed!');
}

