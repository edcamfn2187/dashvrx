import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();
const baseConfig = {
    user: process.env.SQL_USER || 'sa',
    password: process.env.SQL_PASSWORD || 'mudar@123',
    server: process.env.SQL_SERVER || (process.env.NODE_ENV === 'production' ? 'host.docker.internal' : 'localhost'),
    port: parseInt(process.env.SQL_PORT || '1433'),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 30000
    }
};
const clientPools = new Map();
let configPool = null;
export const getConfigPool = async () => {
    if (configPool)
        return configPool;
    const dbName = process.env.SQL_CONFIG_DATABASE || 'config_cybersecup';
    const config = { ...baseConfig, database: dbName };
    const pool = new sql.ConnectionPool(config);
    configPool = pool.connect().then(async (p) => {
        console.log('\x1b[35m%s\x1b[0m', `⚙️ Bridge: Conectado ao banco de CONFIGURAÇÕES [${dbName}]`);
        return p;
    }).catch(err => {
        console.error(`❌ Erro no banco de CONFIG: ${err.message}`);
        configPool = null;
        throw err;
    });
    return configPool;
};
export const getClientPool = async (dbName) => {
    const database = dbName || process.env.SQL_DATABASE || 'GUIDONI';
    if (clientPools.has(database))
        return clientPools.get(database);
    const config = { ...baseConfig, database };
    const pool = new sql.ConnectionPool(config);
    const poolPromise = pool.connect().then(p => {
        console.log('\x1b[36m%s\x1b[0m', `🔌 Bridge: Conectado ao banco de DADOS [${database}]`);
        return p;
    }).catch(err => {
        console.error(`❌ Falha no banco [${database}]: ${err.message}`);
        clientPools.delete(database);
        throw err;
    });
    clientPools.set(database, poolPromise);
    return poolPromise;
};
