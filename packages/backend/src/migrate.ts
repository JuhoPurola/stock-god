/**
 * Database migration Lambda handler
 * Executes schema.sql to initialize the database
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import schemaSQL from './schema.sql';
import seedSQL from '../../../scripts/seed.sql';
import seedPricesSQL from '../../../scripts/seed-prices.sql';

interface DatabaseSecret {
  username: string;
  password: string;
}

interface MigrationEvent {
  action?: 'migrate' | 'seed' | 'status' | 'reset' | 'seed-prices' | 'setup-test';
}

export const handler = async (event: MigrationEvent = {}) => {
  console.log('Migration Lambda invoked', { action: event.action || 'migrate' });

  const secretArn = process.env.DATABASE_SECRET_ARN;
  const dbHost = process.env.DATABASE_HOST;

  if (!secretArn || !dbHost) {
    throw new Error('Missing required environment variables: DATABASE_SECRET_ARN, DATABASE_HOST');
  }

  // Get database credentials from Secrets Manager
  console.log('Fetching database credentials from Secrets Manager...');
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
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const action = event.action || 'migrate';

    if (action === 'status') {
      // Check if tables exist
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      console.log('Database tables:', result.rows.map(r => r.table_name));

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Database status check complete',
          tables: result.rows.map(r => r.table_name),
          count: result.rows.length,
        }),
      };
    }

    if (action === 'reset') {
      // Drop all tables and types, then recreate
      console.log('Resetting database...');

      // Drop all tables
      await client.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
      console.log('Dropped and recreated public schema');

      // Use imported schema
      const schema = schemaSQL || getEmbeddedSchema();
      console.log(`Schema loaded (${schema.length} bytes)`);

      console.log('Executing schema...');
      await client.query(schema);
      console.log('Schema executed successfully!');

      const result = await client.query(`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `);

      const tableCount = parseInt(result.rows[0].table_count);
      console.log(`Created ${tableCount} tables`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Database reset and migration completed successfully',
          tables_created: tableCount,
        }),
      };
    }

    if (action === 'migrate') {
      // Use imported schema
      console.log('Loading schema...');
      const schema = schemaSQL || getEmbeddedSchema();
      console.log(`Schema loaded (${schema.length} bytes)`);

      console.log('Executing schema...');
      await client.query(schema);

      console.log('Schema executed successfully!');

      // Verify tables were created
      const result = await client.query(`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `);

      const tableCount = parseInt(result.rows[0].table_count);
      console.log(`Created ${tableCount} tables`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Migration completed successfully',
          tables_created: tableCount,
        }),
      };
    }

    if (action === 'seed') {
      console.log('Seeding database...');

      const seedData = seedSQL;
      if (!seedData) {
        throw new Error('Seed file not found');
      }

      console.log(`Seed data loaded (${seedData.length} bytes)`);
      await client.query(seedData);

      // Count stocks
      const result = await client.query('SELECT COUNT(*) FROM stocks');
      const stockCount = parseInt(result.rows[0].count);

      console.log(`Database seeded successfully! ${stockCount} stocks in database`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Seed data inserted successfully',
          stocks_count: stockCount,
        }),
      };
    }

    if (action === 'seed-prices') {
      console.log('Generating sample price data...');

      const pricesSQL = seedPricesSQL;
      if (!pricesSQL) {
        throw new Error('Price seed file not found');
      }

      console.log(`Executing price seed SQL (${pricesSQL.length} bytes)`);
      await client.query(pricesSQL);

      // Get summary
      const result = await client.query(`
        SELECT
          COUNT(DISTINCT symbol) as symbols_with_data,
          COUNT(*) as total_price_records,
          MIN(date) as earliest_date,
          MAX(date) as latest_date
        FROM stock_prices
      `);

      const summary = result.rows[0];
      console.log(`Sample price data generated successfully!`);
      console.log(`- Symbols: ${summary.symbols_with_data}`);
      console.log(`- Total records: ${summary.total_price_records}`);
      console.log(`- Date range: ${summary.earliest_date} to ${summary.latest_date}`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Sample price data generated successfully',
          symbols_with_data: parseInt(summary.symbols_with_data),
          total_price_records: parseInt(summary.total_price_records),
          earliest_date: summary.earliest_date,
          latest_date: summary.latest_date,
        }),
      };
    }

    if (action === 'setup-test') {
      console.log('Setting up test data for backtesting...');

      // Create test user
      await client.query(`
        INSERT INTO users (id, email, name, created_at, updated_at)
        VALUES ('test-user-1', 'test@example.com', 'Test User', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
      `);

      // Create test portfolio
      await client.query(`
        INSERT INTO portfolios (id, user_id, name, description, cash_balance, trading_mode, created_at, updated_at)
        VALUES ('test-portfolio-1', 'test-user-1', 'Test Momentum Portfolio', 'For backtest testing', 100000, 'paper', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
      `);

      // Create test strategy with RSI and MACD factors
      const factors = [
        {
          name: 'RSI',
          type: 'technical',
          weight: 0.5,
          enabled: true,
          params: { period: 14, overbought: 70, oversold: 30 }
        },
        {
          name: 'MACD',
          type: 'technical',
          weight: 0.5,
          enabled: true,
          params: { fast: 12, slow: 26, signal: 9 }
        }
      ];

      const riskManagement = {
        maxPositionSize: 0.2,
        maxPositions: 5,
        stopLossPercent: 0.05,
        takeProfitPercent: 0.15
      };

      const stockUniverse = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];

      await client.query(`
        INSERT INTO strategies (id, portfolio_id, name, description, factors, risk_management, stock_universe, enabled, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          factors = $5::jsonb,
          risk_management = $6::jsonb,
          stock_universe = $7,
          updated_at = NOW()
      `, [
        'test-strategy-1',
        'test-portfolio-1',
        'Momentum Test Strategy',
        'RSI and MACD momentum strategy for testing',
        JSON.stringify(factors),
        JSON.stringify(riskManagement),
        stockUniverse,
        true
      ]);

      // Verify
      const result = await client.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE id = 'test-user-1') as users,
          (SELECT COUNT(*) FROM portfolios WHERE id = 'test-portfolio-1') as portfolios,
          (SELECT COUNT(*) FROM strategies WHERE id = 'test-strategy-1') as strategies
      `);

      console.log('Test data setup complete!');
      console.log('- User ID: test-user-1');
      console.log('- Portfolio ID: test-portfolio-1');
      console.log('- Strategy ID: test-strategy-1');

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Test data setup complete',
          user_id: 'test-user-1',
          portfolio_id: 'test-portfolio-1',
          strategy_id: 'test-strategy-1',
          verification: result.rows[0]
        }),
      };
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
};

function getEmbeddedSchema(): string {
  // Fallback embedded schema if file bundling fails
  return `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Portfolios
CREATE TYPE trading_mode AS ENUM ('paper', 'live');

CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    cash_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    trading_mode trading_mode NOT NULL DEFAULT 'paper',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);

-- Insert demo user if not exists
INSERT INTO users (id, email, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@example.com', 'Demo User')
ON CONFLICT (id) DO NOTHING;

-- Basic tables created
SELECT 'Schema initialized' as status;
  `;
}
