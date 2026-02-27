/**
 * Database migration Lambda handler
 * Executes schema.sql to initialize the database
 */
interface MigrationEvent {
    action?: 'migrate' | 'seed' | 'status' | 'reset' | 'seed-prices' | 'setup-test';
}
export declare const handler: (event?: MigrationEvent) => Promise<{
    statusCode: number;
    body: string;
}>;
export {};
//# sourceMappingURL=migrate.d.ts.map