import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const dbSyncConfig = process.env.DB_SYNCHRONIZE;
const shouldSynchronize = isProduction
  ? false
  : dbSyncConfig !== undefined
    ? dbSyncConfig.toLowerCase() === 'true'
    : true;
const shouldLog =
  (process.env.DB_LOGGING || '').toLowerCase() === 'true' ||
  nodeEnv === 'development';

const dbType = (process.env.DB_TYPE || 'sqlite').toLowerCase();
const postgresUrl =
  process.env.DATABASE_URL ||   process.env.DB_URL ||   process.env.POSTGRES_URL;
const sslEnabled =
  (process.env.DB_SSL || (isProduction ? 'true' : 'false')) === 'true';
const sslConfig = sslEnabled
  ? {
      ssl: { rejectUnauthorized: false },
      extra: { ssl: { rejectUnauthorized: false } },
    }
  : {};

function buildDataSourceOptions(): any {
  const baseConfig = {
    synchronize: shouldSynchronize,
    logging: shouldLog,
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
  };

  if (dbType === 'sqlite') {
    return {
      type: 'sqlite',
      database: process.env.DB_DATABASE || 'dev.db',
      ...baseConfig,
    };
  }

  if (dbType === 'postgres') {
    const poolSize = parseInt(process.env.DB_POOL_SIZE || '10', 10);
    const poolConfig = {
      extra: {
        ...((sslConfig as any).extra || {}),
        max: poolSize,
        idleTimeoutMillis: 30000,
      },
    };

    if (postgresUrl) {
      return {
        type: 'postgres',
        url: postgresUrl,
        ...baseConfig,
        ...sslConfig,
        ...poolConfig,
      };
    }

    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'motobiketours',
      ...baseConfig,
      ...sslConfig,
      ...poolConfig,
    };
  }

  if (dbType === 'mysql' || dbType === 'mariadb') {
    return {
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'motobiketours',
      ...baseConfig,
    };
  }

  // Default to SQLite
  return {
    type: 'sqlite',
    database: 'dev.db',
    ...baseConfig,
  };
}

export default new DataSource(buildDataSourceOptions());
