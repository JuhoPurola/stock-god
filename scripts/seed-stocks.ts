/**
 * Seed stocks data to the database
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

interface DatabaseSecret {
  username: string;
  password: string;
  host: string;
}

async function seedStocks() {
  // Get environment variables
  const secretArn = process.env.DATABASE_SECRET_ARN;
  const dbHost = process.env.DATABASE_HOST;

  if (!secretArn || !dbHost) {
    console.error('Missing environment variables:');
    console.error('  DATABASE_SECRET_ARN:', secretArn ? 'set' : 'NOT SET');
    console.error('  DATABASE_HOST:', dbHost ? 'set' : 'NOT SET');
    throw new Error('Missing required environment variables');
  }

  console.log('Fetching database credentials from Secrets Manager...');
  const secretsClient = new SecretsManagerClient({ region: 'eu-west-1' });
  const secretResponse = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretArn })
  );

  const secret: DatabaseSecret = JSON.parse(secretResponse.SecretString!);

  // Connect to database
  const client = new Client({
    host: dbHost,
    port: 5432,
    user: secret.username,
    password: secret.password,
    database: 'stock_picker',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read seed SQL file
    const seedPath = path.join(__dirname, 'seed-stocks.sql');
    const seedData = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing seed script...');
    await client.query(seedData);

    // Count stocks
    const result = await client.query('SELECT COUNT(*) FROM stocks');
    const stockCount = parseInt(result.rows[0].count);

    console.log(`✓ Successfully seeded stocks!`);
    console.log(`  Total stocks in database: ${stockCount}`);

  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedStocks()
  .then(() => {
    console.log('Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
