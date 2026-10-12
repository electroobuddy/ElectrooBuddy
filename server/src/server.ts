import { createServer } from 'node:http';
import { createApp } from './app.js';
import { createDatabaseClient } from './config/database.js';
import { loadEnv } from './config/env.js';
import { createLogger } from './config/logger.js';

const env = loadEnv();
const logger = createLogger(env);
const database = createDatabaseClient(env, logger);
const app = createApp({ env, logger, database });
const server = createServer(app);

server.listen(env.PORT, env.HOST, () => {
  logger.info({ host: env.HOST, port: env.PORT, apiPrefix: env.API_PREFIX }, 'ElectrooBuddy API listening');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Graceful shutdown started');
  server.close(async (serverError) => {
    try {
      await database.close();
      if (serverError) throw serverError;
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Graceful shutdown failed');
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.fatal('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  void shutdown('uncaughtException');
});
