/**
 * Scheduler-specific configuration and helpers
 * Bridges the gap between scheduled handlers and existing architecture
 */

import { Pool } from 'pg';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { getPool } from './database.js';

// Get database pool (async initialization)
export async function getDatabasePool(): Promise<Pool> {
  return getPool();
}

// Create and export secrets manager client
export function getSecretsManagerClient(): SecretsManagerClient {
  return new SecretsManagerClient({
    region: process.env.AWS_REGION || 'eu-west-1',
  });
}
