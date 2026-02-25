import { scheduleTask, stopTask, getScheduledTasks } from '../services/schedulerService.js';
import { sendEmail, getEmailTemplate } from '../services/emailService.js';
import { generatePdfFromUrl, generatePdfFromPages } from '../services/pdfService.js';
import fs from 'fs';
import path from 'path';
import { getConfigPool, getClientPool } from '../server/services/dbService.js';
import sql from 'mssql';
console.log('--- API Handlers Loaded ---');
let scheduleConfigs = [];
const getCronExpression = (config) => {
    const [hour, minute] = config.time.split(':');
    switch (config.frequency) {
        case 'daily':
            return `${minute} ${hour} * * *`;
        case 'weekly':
            return `${minute} ${hour} * * ${config.day}`;
        case 'monthly':
            return `${minute} ${hour} ${config.day} * *`;
        default:
            return `${minute} ${hour} * * *`;
    }
};
const executeScheduledReport = async (config) => {
    console.log(`Executing scheduled report for client: ${config.client}...`);
    try {
        const pdfUrl = `http://localhost:3000/?client=${encodeURIComponent(config.client)}`;
        const pdfPath = await generatePdfFromUrl(pdfUrl);
        // Get previous month string
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        const monthStr = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        const template = getEmailTemplate({
            formato_relatorio: 'PDF',
            periodo_mes_anterior_str: monthStr,
            nome_relatorio: `Relatorio_vRx_${config.client}_${new Date().toISOString().split('T')[0]}.pdf`,
            data_geracao: new Date().toLocaleString('pt-BR')
        });
        await sendEmail({
            to: config.recipients,
            subject: template.subject,
            html: template.body,
            attachments: [
                {
                    filename: `Relatorio_vRx_${config.client}_${new Date().toISOString().split('T')[0]}.pdf`,
                    path: pdfPath,
                    contentType: 'application/pdf',
                },
            ],
        });
        fs.unlinkSync(pdfPath); // Clean up the generated PDF
    }
    catch (error) {
        console.error('Error executing scheduled report:', error);
    }
};
// --- API Endpoints --- 
export const postCreatePageTemplate = async (req, res) => {
    const { pageId, pageName } = req.body;
    if (!pageId || !pageName) {
        return res.status(400).json({ error: 'pageId e pageName são obrigatórios.' });
    }
    try {
        const normalized = pageName
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, ' ')
            .trim()
            .split(' ')
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join('');
        const componentName = `${normalized || 'Custom'}Page`;
        const filePath = path.join(process.cwd(), 'pages', `${componentName}.tsx`);
        if (!fs.existsSync(filePath)) {
            const fileContent = `import React from 'react';
import DynamicPage from './DynamicPage';

interface ${componentName}Props {
  pageId?: string;
  isPdfMode?: boolean;
}

const ${componentName}: React.FC<${componentName}Props> = ({ pageId = '${pageId}', isPdfMode = false }) => {
  return <DynamicPage pageId={pageId} isPdfMode={isPdfMode} />;
};

export default ${componentName};
`;
            fs.writeFileSync(filePath, fileContent, 'utf-8');
        }
        return res.json({ success: true, file: `pages/${componentName}.tsx` });
    }
    catch (error) {
        return res.status(500).json({ error: 'Falha ao criar arquivo local da página.', details: error.message });
    }
};
export const deletePageTemplate = async (req, res) => {
    const { fileName } = req.params;
    if (!fileName) {
        return res.status(400).json({ error: 'fileName é obrigatório.' });
    }
    try {
        const filePath = path.join(process.cwd(), 'pages', `${fileName}.tsx`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return res.json({ success: true, message: `Arquivo ${fileName}.tsx removido com sucesso.` });
        }
        else {
            return res.status(404).json({ error: `Arquivo ${fileName}.tsx não encontrado.` });
        }
    }
    catch (error) {
        return res.status(500).json({ error: 'Falha ao remover arquivo local da página.', details: error.message });
    }
};
export const getSchedule = (req, res) => {
    res.json(scheduleConfigs);
};
export const postSchedule = async (req, res) => {
    const configs = req.body;
    scheduleConfigs = configs;
    // Stop all existing tasks
    const existingTasks = getScheduledTasks();
    existingTasks.forEach(taskId => stopTask(taskId));
    // Schedule new tasks
    scheduleConfigs.forEach(config => {
        if (config.isEnabled) {
            scheduleTask(`report-${config.id}`, getCronExpression(config), () => executeScheduledReport(config));
        }
    });
    // Save to DB
    try {
        const pool = await getConfigPool();
        const value = JSON.stringify(scheduleConfigs);
        await pool.request()
            .input('key', sql.NVarChar, 'schedule_configs')
            .input('value', sql.NVarChar, value)
            .query(`
            IF EXISTS (SELECT 1 FROM DashboardConfigs WHERE config_key = @key)
                UPDATE DashboardConfigs SET config_value = @value, updated_at = GETDATE() WHERE config_key = @key
            ELSE
                INSERT INTO DashboardConfigs (config_key, config_value) VALUES (@key, @value)
        `);
        res.json({ message: 'Schedules updated and saved successfully.' });
    }
    catch (error) {
        console.error('Failed to save schedules to DB:', error);
        res.status(500).json({ message: 'Schedules updated in memory but failed to save to DB.' });
    }
};
export const triggerSchedule = async (req, res) => {
    const { id } = req.body;
    let config;
    if (id) {
        config = scheduleConfigs.find(c => c.id === id);
    }
    else {
        // Fallback to first enabled if no ID provided
        config = scheduleConfigs.find(c => c.isEnabled);
    }
    if (!config) {
        return res.status(404).json({ message: 'Schedule not found or no enabled schedule available.' });
    }
    try {
        await executeScheduledReport(config);
        res.json({ message: 'Report generation triggered successfully.' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to trigger report generation.' });
    }
};
export const getConfig = async (req, res) => {
    const key = req.params.key;
    try {
        if (key === 'custom_pages') {
            const filePath = path.join(process.cwd(), 'pages', 'custom_pages.json');
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                return res.json(JSON.parse(fileContent));
            }
            else {
                return res.json([]);
            }
        }
        const pool = await getConfigPool();
        const result = await pool.request()
            .input('key', sql.NVarChar, key)
            .query('SELECT config_value FROM DashboardConfigs WHERE config_key = @key');
        if (result.recordset.length > 0)
            res.json(JSON.parse(result.recordset[0].config_value));
        else
            res.status(404).json({ error: 'Configuração não encontrada' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar config', details: err.message });
    }
};
export const postConfig = async (req, res) => {
    const key = req.params.key;
    const value = JSON.stringify(req.body, null, 2); // format for readability
    try {
        if (key === 'custom_pages') {
            const filePath = path.join(process.cwd(), 'pages', 'custom_pages.json');
            fs.writeFileSync(filePath, value, 'utf-8');
            return res.json({ success: true });
        }
        const pool = await getConfigPool();
        await pool.request()
            .input('key', sql.NVarChar, key)
            .input('value', sql.NVarChar, JSON.stringify(req.body)) // compact for DB
            .query(`
            IF EXISTS (SELECT 1 FROM DashboardConfigs WHERE config_key = @key)
                UPDATE DashboardConfigs SET config_value = @value, updated_at = GETDATE() WHERE config_key = @key
            ELSE
                INSERT INTO DashboardConfigs (config_key, config_value) VALUES (@key, @value)
        `);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao salvar config no banco central', details: err.message });
    }
};
export const getClients = async (req, res) => {
    try {
        const pool = await getConfigPool();
        const result = await pool.request()
            .input('key', sql.NVarChar, 'client_list')
            .query('SELECT config_value FROM DashboardConfigs WHERE config_key = @key');
        if (result.recordset.length > 0) {
            res.json(JSON.parse(result.recordset[0].config_value));
        }
        else {
            res.json(['GUIDONI', 'LOCAL_INSTANCE']); // Default
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch clients.' });
    }
};
export const testEmail = async (req, res) => {
    const { to, subject, body } = req.body;
    try {
        await sendEmail({
            to,
            subject,
            html: body,
            attachments: [],
        });
        res.json({ message: 'Test email sent successfully.' });
    }
    catch (error) {
        console.error('Test email failed:', error);
        res.status(500).json({ message: error.message || 'Failed to send test email.' });
    }
};
export const getDashboard = async (req, res) => {
    try {
        const dbName = req.headers['x-db-name'];
        const pool = await getClientPool(dbName);
        const tableCheck = await pool.request().query("SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'endpoint'");
        if (tableCheck.recordset.length === 0) {
            return res.json({
                databaseName: dbName || 'GUIDONI',
                client: dbName || 'GUIDONI',
                onlineOffline: [],
                uptimeInsights: [],
                warning: 'Tabela [endpoint] não encontrada.'
            });
        }
        const connectivityResult = await pool.request().query(`
            SELECT CASE WHEN endpointalive = 1 THEN 'Online' ELSE 'Offline' END as name, COUNT(*) as value
            FROM endpoint GROUP BY endpointalive
        `);
        const uptimeResult = await pool.request().query(`
            SELECT TOP 5 endpointname as name, DATEDIFF(day, lastscan, GETDATE()) as days 
            FROM endpoint ORDER BY lastscan ASC
        `);
        res.json({
            databaseName: dbName || 'GUIDONI',
            client: dbName || 'GUIDONI',
            onlineOffline: connectivityResult.recordset,
            uptimeInsights: uptimeResult.recordset
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar dados do dashboard', details: err.message });
    }
};
export const getTables = async (req, res) => {
    try {
        const dbName = req.headers['x-db-name'];
        const pool = await getClientPool(dbName);
        const result = await pool.request().query(`
            SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW') 
            ORDER BY TABLE_SCHEMA, TABLE_NAME
        `);
        res.json(result.recordset);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao listar tabelas', details: err.message });
    }
};
export const getTableData = async (req, res) => {
    let { tableName } = req.params;
    const schema = req.query.schema || 'dbo';
    try {
        const dbName = req.headers['x-db-name'];
        // Basic sanitization: avoid special characters except alphanumeric, underscores, and dashes
        const sanitizedTable = String(tableName).replace(/[^a-zA-Z0-9_-]/g, '');
        const sanitizedSchema = String(schema).replace(/[^a-zA-Z0-9_-]/g, '');
        const pool = await getClientPool(dbName);
        const qualifiedName = `[${sanitizedSchema}].[${sanitizedTable}]`;
        const result = await pool.request().query(`SELECT TOP 100 * FROM ${qualifiedName}`);
        res.json(result.recordset);
    }
    catch (err) {
        res.status(500).json({ error: `Erro ao ler dados da tabela ${tableName}`, details: err.message });
    }
};
export const postQuery = async (req, res) => {
    const { query: sqlQuery } = req.body;
    const dbName = req.headers['x-db-name'];
    if (!sqlQuery) {
        return res.status(400).json({ error: 'Query não fornecida.' });
    }
    try {
        const pool = await getClientPool(dbName);
        const result = await pool.request().query(sqlQuery);
        res.json({ data: result.recordset });
    }
    catch (err) {
        console.error('Query execution failed:', err);
        res.status(500).json({ error: 'Erro ao executar consulta SQL', details: err.message });
    }
};
export const exportPdf = async (req, res) => {
    const { client, pages } = req.body;
    if (!client || !pages || !Array.isArray(pages) || pages.some(p => !p.id)) {
        return res.status(400).json({ error: 'Client and valid pages with valid id are required.' });
    }
    try {
        const pdfPath = await generatePdfFromPages(client, pages);
        res.download(pdfPath, path.basename(pdfPath), (err) => {
            if (err) {
                console.error('Error sending PDF file:', err);
            }
            // Cleanup after sending: Windows locks files briefly after express stream finishes
            setTimeout(() => {
                try {
                    if (fs.existsSync(pdfPath)) {
                        fs.unlinkSync(pdfPath);
                        console.log(`Cleaned up temporary PDF: ${pdfPath}`);
                    }
                }
                catch (e) {
                    console.error(`Could not cleanup PDF ${pdfPath}:`, e.message);
                }
            }, 10000);
        });
    }
    catch (error) {
        console.error('PDF export failed:', error);
        res.status(500).json({ error: 'Erro ao gerar PDF', details: error.message });
    }
};
// Load schedules from DB on startup
const loadSchedules = async () => {
    try {
        const pool = await getConfigPool();
        const result = await pool.request()
            .input('key', sql.NVarChar, 'schedule_configs')
            .query('SELECT config_value FROM DashboardConfigs WHERE config_key = @key');
        if (result.recordset.length > 0) {
            scheduleConfigs = JSON.parse(result.recordset[0].config_value);
            console.log(`Loaded ${scheduleConfigs.length} schedules from DB.`);
            // Schedule tasks
            scheduleConfigs.forEach(config => {
                if (config.isEnabled) {
                    scheduleTask(`report-${config.id}`, getCronExpression(config), () => executeScheduledReport(config));
                }
            });
        }
    }
    catch (error) {
        console.error('Failed to load schedules from DB:', error);
    }
};
loadSchedules();
