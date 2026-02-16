/**
 * Lambda function to run database migrations
 * This runs in the VPC and can access the private RDS instance
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

interface DatabaseSecret {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}

export const handler = async (event: any) => {
  console.log('Starting database migration...');

  const secretArn = process.env.DATABASE_SECRET_ARN;
  const dbHost = process.env.DATABASE_HOST;

  if (!secretArn || !dbHost) {
    throw new Error('Missing required environment variables');
  }

  // Get database credentials from Secrets Manager
  const secretsClient = new SecretsManagerClient({});
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
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema...');
    await client.query(schema);

    console.log('Migration completed successfully!');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Migration completed successfully' })
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
};
