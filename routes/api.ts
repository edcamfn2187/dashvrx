import { Router } from 'express';
import { getSchedule, postSchedule, triggerSchedule, getClients, testEmail, getConfig, postConfig, getDashboard, getTables, getTableData, postQuery, postCreatePageTemplate, deletePageTemplate, exportPdf } from '../server/apiHandlers.js';

const router = Router();
console.log('--- API Router Loaded ---');

// --- API Endpoints ---

router.get('/schedule', getSchedule);
router.post('/schedule', postSchedule);
router.post('/schedule/trigger', triggerSchedule);
router.get('/clients', getClients);
router.post('/test-email', testEmail);
router.get('/config/:key', getConfig);
router.post('/config/:key', postConfig);
router.get('/dashboard', getDashboard);
router.get('/tables', getTables);
router.get('/tables/:tableName', getTableData);
router.post('/query', postQuery);
router.post('/export-pdf', exportPdf);
router.post('/pages/template', postCreatePageTemplate);
router.delete('/pages/template/:fileName', deletePageTemplate);

export default router;
