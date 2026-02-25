import sql from 'mssql';
import { env } from './env';

const config: sql.config = {
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    server: env.DB_HOST,
    database: env.DB_NAME,
    port: env.DB_PORT,
    options: {
        encrypt: true,
        trustServerCertificate: false
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

export const pool = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('SQL Server connected');
        return pool;
    })
    .catch(err => {
        console.error('Database connection failed', err);
        process.exit(1);
    });