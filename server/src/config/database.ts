import pg from 'pg';
import type { AppEnv } from './env.js';
import type { Logger } from 'pino';

const { Pool } = pg;

export interface QueryableDatabase {
  query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    values?: readonly unknown[]
  ): Promise<pg.QueryResult<T>>;
}

export type TransactionIsolationLevel = 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';

export interface TransactionOptions {
  isolationLevel?: TransactionIsolationLevel;
  readOnly?: boolean;
}

export interface DatabaseClient extends QueryableDatabase {
  withTransaction<T>(
    operation: (transaction: QueryableDatabase) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T>;
  healthCheck(): Promise<void>;
  close(): Promise<void>;
}

export function createDatabaseClient(env: AppEnv, logger: Logger): DatabaseClient {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
    ssl: env.DB_SSL ? { rejectUnauthorized: true } : false,
    application_name: 'electroobuddy-api'
  });

  pool.on('error', (error) => {
    logger.error({ err: error }, 'Unexpected PostgreSQL pool error');
  });

  return {
    query: (text, values) => pool.query(text, values as unknown[] | undefined),

    async withTransaction<T>(operation: (transaction: QueryableDatabase) => Promise<T>, options = {}) {
      const connection = await pool.connect();
      const isolationLevel = options.isolationLevel ?? 'READ COMMITTED';
      try {
        await connection.query('BEGIN');
        await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}${options.readOnly ? ' READ ONLY' : ''}`);

        const transaction: QueryableDatabase = {
          query: (text, values) => connection.query(text, values as unknown[] | undefined)
        };

        const result = await operation(transaction);
        await connection.query('COMMIT');
        return result;
      } catch (error) {
        await connection.query('ROLLBACK').catch((rollbackError) => {
          logger.error({ err: rollbackError }, 'PostgreSQL transaction rollback failed');
        });
        throw error;
      } finally {
        connection.release();
      }
    },

    async healthCheck() {
      await pool.query('SELECT 1');
    },

    async close() {
      await pool.end();
    }
  };
}
