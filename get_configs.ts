
import { getConfigPool } from './server/services/dbService.js';
import sql from 'mssql';

async function main() {
    try {
        const pool = await getConfigPool();

        console.log('--- CUSTOM PAGES ---');
        const pagesRes = await pool.request()
            .input('key', sql.NVarChar, 'custom_pages')
            .query('SELECT config_value FROM DashboardConfigs WHERE config_key = @key');
        if (pagesRes.recordset.length > 0) {
            console.log(pagesRes.recordset[0].config_value);
        } else {
            console.log('No custom_pages found');
        }

        console.log('\n--- CUSTOM QUERIES ---');
        const queriesRes = await pool.request()
            .input('key', sql.NVarChar, 'custom_queries')
            .query('SELECT config_value FROM DashboardConfigs WHERE config_key = @key');
        if (queriesRes.recordset.length > 0) {
            console.log(queriesRes.recordset[0].config_value);
        } else {
            console.log('No custom_queries found');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
