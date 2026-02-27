/**
 * Job Monitoring Service
 * Tracks execution of scheduled background jobs
 */

import { Pool } from 'pg';

export type JobType =
  | 'strategy_execution'
  | 'order_status_check'
  | 'position_sync'
  | 'price_update'
  | 'portfolio_snapshot'
  | 'alert_price_check'
  | 'analytics_calculation';

export type ExecutionStatus = 'started' | 'completed' | 'failed';
export type JobStatus = 'enabled' | 'disabled' | 'error';

export interface JobExecution {
  id: string;
  jobType: JobType;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export class JobMonitoringService {
  constructor(private pool: Pool) {}

  /**
   * Log the start of a job execution
   */
  async logJobStart(jobType: JobType, metadata?: Record<string, any>): Promise<string> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO job_executions (job_type, status, metadata)
         VALUES ($1, 'started', $2)
         RETURNING id`,
        [jobType, metadata ? JSON.stringify(metadata) : null]
      );

      const executionId = result.rows[0].id;
      console.log(`Job started: ${jobType} (execution_id: ${executionId})`);
      return executionId;
    } finally {
      client.release();
    }
  }

  /**
   * Log successful completion of a job
   */
  async logJobComplete(
    executionId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Update execution record
      const execResult = await client.query(
        `UPDATE job_executions
         SET status = 'completed',
             completed_at = NOW(),
             duration_ms = ROUND(EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000)::INTEGER,
             metadata = COALESCE($2::jsonb, metadata)
         WHERE id = $1
         RETURNING job_type, duration_ms`,
        [executionId, metadata ? JSON.stringify(metadata) : null]
      );

      if (execResult.rows.length === 0) {
        throw new Error(`Execution ${executionId} not found`);
      }

      const { job_type, duration_ms } = execResult.rows[0];

      // Update scheduled job stats
      await client.query(
        `UPDATE scheduled_jobs
         SET last_execution_at = NOW(),
             last_execution_status = 'enabled',
             last_execution_error = NULL,
             execution_count = execution_count + 1,
             average_duration_ms = CASE
               WHEN average_duration_ms IS NULL THEN $2::INTEGER
               ELSE ROUND(average_duration_ms * 0.8 + $2::INTEGER * 0.2)::INTEGER
             END,
             updated_at = NOW()
         WHERE job_type = $1`,
        [job_type, duration_ms]
      );

      await client.query('COMMIT');
      console.log(`Job completed: ${job_type} (${duration_ms}ms)`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Log job failure
   */
  async logJobError(executionId: string, error: Error): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Update execution record
      const execResult = await client.query(
        `UPDATE job_executions
         SET status = 'failed',
             completed_at = NOW(),
             duration_ms = ROUND(EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000)::INTEGER,
             error_message = $2
         WHERE id = $1
         RETURNING job_type`,
        [executionId, error.message]
      );

      if (execResult.rows.length === 0) {
        throw new Error(`Execution ${executionId} not found`);
      }

      const { job_type } = execResult.rows[0];

      // Update scheduled job stats
      await client.query(
        `UPDATE scheduled_jobs
         SET last_execution_at = NOW(),
             last_execution_status = 'error',
             last_execution_error = $2,
             failure_count = failure_count + 1,
             updated_at = NOW()
         WHERE job_type = $1`,
        [job_type, error.message]
      );

      await client.query('COMMIT');
      console.error(`Job failed: ${job_type} - ${error.message}`);

      // TODO: Send alert to admins if failure rate is high
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Check if a job should run (is it enabled and not errored?)
   */
  async shouldJobRun(jobType: JobType): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT enabled, last_execution_status, failure_count
         FROM scheduled_jobs
         WHERE job_type = $1`,
        [jobType]
      );

      if (result.rows.length === 0) {
        console.warn(`Job ${jobType} not found in scheduled_jobs table`);
        return true; // Default to running if not configured
      }

      const { enabled, last_execution_status, failure_count } = result.rows[0];

      // Don't run if disabled
      if (!enabled) {
        console.log(`Job ${jobType} is disabled`);
        return false;
      }

      // Don't run if too many consecutive failures (circuit breaker)
      if (failure_count > 10) {
        console.error(`Job ${jobType} has too many failures (${failure_count}), skipping`);
        return false;
      }

      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Get recent execution history for a job
   */
  async getJobHistory(jobType: JobType, limit: number = 10): Promise<JobExecution[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
           id,
           job_type AS "jobType",
           status,
           started_at AS "startedAt",
           completed_at AS "completedAt",
           duration_ms AS "durationMs",
           error_message AS "errorMessage",
           metadata
         FROM job_executions
         WHERE job_type = $1
         ORDER BY started_at DESC
         LIMIT $2`,
        [jobType, limit]
      );

      return result.rows.map(row => ({
        ...row,
        metadata: row.metadata || undefined,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get stats for all scheduled jobs
   */
  async getJobStats(): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
           job_type AS "jobType",
           schedule_expression AS "scheduleExpression",
           enabled,
           last_execution_at AS "lastExecutionAt",
           last_execution_status AS "lastExecutionStatus",
           last_execution_error AS "lastExecutionError",
           execution_count AS "executionCount",
           failure_count AS "failureCount",
           average_duration_ms AS "averageDurationMs"
         FROM scheduled_jobs
         ORDER BY job_type`
      );

      return result.rows;
    } finally {
      client.release();
    }
  }
}
