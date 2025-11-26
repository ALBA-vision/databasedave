import prompts from 'prompts';
import chalk from 'chalk';
import { environments, Environment } from '../config';
import { createConnection, closeConnection } from '../lib/db';
import { runMigrations } from '../migrations';

async function main() {
  console.log(chalk.bold('\n🔐 Database Dave - Migration Runner\n'));

  // Step 1: Select environment
  const envResponse = await prompts({
    type: 'select',
    name: 'env',
    message: 'Select environment',
    choices: [
      { title: chalk.green('dev') + ' - Development', value: 'dev' },
      { title: chalk.yellow('stage') + ' - Staging', value: 'stage' },
      { title: chalk.red('prod') + ' - Production', value: 'prod' },
    ],
  });

  if (!envResponse.env) {
    console.log('\n❌ Cancelled\n');
    process.exit(0);
  }

  const env = envResponse.env as Environment;
  const config = environments[env];

  // Step 2: Confirmation for stage/prod
  if (env !== 'dev') {
    const color = env === 'prod' ? chalk.red : chalk.yellow;
    console.log(color(`\n⚠️  You are about to run migrations on ${config.name.toUpperCase()}\n`));

    const confirmResponse = await prompts({
      type: 'text',
      name: 'confirm',
      message: `Type "${env}" to confirm`,
    });

    if (confirmResponse.confirm !== env) {
      console.log('\n❌ Confirmation failed. Aborting.\n');
      process.exit(0);
    }
  }

  // Step 3: Enter password
  const passwordResponse = await prompts({
    type: 'password',
    name: 'password',
    message: `Enter password for ${config.user}`,
  });

  if (!passwordResponse.password) {
    console.log('\n❌ No password provided. Aborting.\n');
    process.exit(0);
  }

  // Step 4: Connect and run migrations
  const envColor = env === 'prod' ? chalk.red : env === 'stage' ? chalk.yellow : chalk.green;
  console.log(envColor(`\n🔌 Connecting to ${config.database} as ${config.user}...`));

  try {
    createConnection(env, passwordResponse.password);

    // Test connection
    const { getPool } = await import('../lib/db');
    const client = await getPool().connect();
    client.release();
    
    console.log(envColor(`✅ Connected to ${config.database}\n`));

    await runMigrations();

  } catch (error: any) {
    console.error(chalk.red('\n❌ Connection failed:'), error.message, error);
    process.exit(1);
  } finally {
    await closeConnection();
  }

  console.log('');
}

main();
