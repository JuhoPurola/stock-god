#!/usr/bin/env node
/**
 * Script to run seed-prices.sql directly against the database
 */
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function main() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('ERROR: DATABASE_URL environment variable not set');
        process.exit(1);
    }
    console.log('📊 Loading sample price data...\n');
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../../../../scripts/seed-prices.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    // Connect to database
    const client = new Client({ connectionString: dbUrl });
    try {
        await client.connect();
        console.log('✅ Connected to database\n');
        console.log('⏳ Generating price data... (this may take a minute)');
        await client.query(sql);
        console.log('\n✅ Price data generation complete!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
    finally {
        await client.end();
    }
}
main();
//# sourceMappingURL=run-seed-prices.js.map