
import { logService } from './logService.js';
import { CustomPage, Page, CustomQuery } from '../types.js';

import { DEFAULT_CLIENT, API_BASE, CONFIG_API_BASE } from '../constants';

const getSelectedDb = () => typeof window !== 'undefined' ? localStorage.getItem('selected_client') || DEFAULT_CLIENT : DEFAULT_CLIENT;

export const fetchConfigFromDb = async (key: string) => {
  try {
    const response = await fetch(`${CONFIG_API_BASE}/${key}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    return null;
  }
};

export const saveConfigToDb = async (key: string, data: any) => {
  try {
    const response = await fetch(`${CONFIG_API_BASE}/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const success = response.ok;
    if (success) {
      logService.addLog('success', `Configuração [${key}] salva no Banco de Dados`);
    }
    return success;
  } catch (err) {
    logService.addLog('error', `Falha ao salvar configuração [${key}]`, String(err));
    return false;
  }
};

export const initializeDefaultGadgets = async () => {
  let queries = await fetchConfigFromDb('custom_queries');

  const defaultQueries: CustomQuery[] = [
    { id: 'q-assets', name: 'Total de Ativos', sql: 'SELECT COUNT(*) as value FROM endpoint', type: 'card', color: '#ffffff', headerBgColor: '#0ea5e9', gridSpan: 3, rowSpan: 1 },
    { id: 'q-vulns', name: 'Vulnerabilidades', sql: 'SELECT SUM(cvecount) as value FROM endpoint', type: 'card', color: '#ef4444', headerBgColor: '#dc2626', gridSpan: 3, rowSpan: 1 },
    { id: 'q-risk', name: 'Score de Risco', sql: 'SELECT 85 as value', type: 'card', color: '#eab308', headerBgColor: '#ca8a04', gridSpan: 3, rowSpan: 1 },
    { id: 'q-compliance', name: '% Compliance', sql: 'SELECT 92 as value', type: 'card', color: '#22c55e', headerBgColor: '#16a34a', gridSpan: 3, rowSpan: 1 },
    { id: 'q-connectivity', name: 'Status Conectividade', sql: "SELECT CASE WHEN endpointalive = 1 THEN 'Online' ELSE 'Offline' END as name, COUNT(*) as value FROM endpoint GROUP BY endpointalive", type: 'pie', colors: ['#22c55e', '#ef4444'], gridSpan: 4, rowSpan: 1.2 },
    { id: 'q-os', name: 'Sistemas Operacionais', sql: 'SELECT operatingsystem as name, COUNT(*) as value FROM endpoint GROUP BY operatingsystem', type: 'bar', orientation: 'horizontal', colors: ['#0ea5e9', '#38bdf8', '#7dd3fc'], gridSpan: 8, rowSpan: 1.2 },
    { id: 'q-cve-product-severity', name: 'Severidade por Ativo', sql: 'SELECT TOP 10 endpointname as name, critical, high, medium, low FROM endpoint ORDER BY critical DESC', type: 'bar', isStacked: true, stackKeys: ['critical', 'high', 'medium', 'low'], colors: ['#dc2626', '#f97316', '#eab308', '#0ea5e9'], gridSpan: 12, rowSpan: 1.5 },
    { id: 'q-pending-patches', name: 'Patches Pendentes', sql: 'SELECT 152 as value', type: 'card', color: '#38bdf8', headerBgColor: '#0369a1', gridSpan: 3, rowSpan: 1 },
    { id: 'q-softwares-update', name: 'Softwares que requerem Update', sql: 'SELECT TOP 10 endpointname as App, cvecount as Vulnerabilidades FROM endpoint ORDER BY cvecount DESC', type: 'table', gridSpan: 12, rowSpan: 1.5 }
  ];

  if (!queries || !Array.isArray(queries) || queries.length === 0) {
    queries = defaultQueries;
    await saveConfigToDb('custom_queries', queries);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('custom_queries', JSON.stringify(queries));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('queriesUpdated'));
  }
};

export const initializeDefaultPages = async () => {
  await initializeDefaultGadgets();
  let pages = await fetchConfigFromDb('custom_pages');
  let clients = await fetchConfigFromDb('client_list');

  const defaultPages: CustomPage[] = [
    { id: Page.HOME, name: 'Capa', icon: 'Home', queryIds: [] }
  ];

  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    pages = defaultPages;
    await saveConfigToDb('custom_pages', pages);
  }

  if (!clients || !Array.isArray(clients) || clients.length === 0) {
    clients = ['GUIDONI', 'LOCAL_INSTANCE'];
    await saveConfigToDb('client_list', clients);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('custom_pages', JSON.stringify(pages));
    localStorage.setItem('client_list', JSON.stringify(clients));
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pagesUpdated'));
    window.dispatchEvent(new Event('clientsUpdated'));
  }
};

export const fetchDashboardData = async () => {
  const currentClient = getSelectedDb();
  try {
    const response = await fetch(`${API_BASE}/dashboard`, {
      headers: { 'x-db-name': currentClient }
    });

    if (!response.ok) throw new Error('API Offline');

    const data = await response.json();
    return {
      ...data,
      client: data.client || currentClient, // Garante que o cliente venha da API ou do header enviado
      isLive: true,
      month: new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase(),
      generationDate: new Date().toLocaleDateString(),
      version: "4.0.1 Stable",
      owner: "MSS Application Security",
      classification: "CONFIDENCIAL"
    };
  } catch (err: unknown) {
    return {
      client: currentClient,
      isLive: false,
      month: new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase(),
      generationDate: new Date().toLocaleDateString(),
      version: "1.0.0",
      owner: "MSS Application Security",
      classification: "CONFIDENCIAL"
    };
  }
};

export const runCustomQuery = async (sql: string) => {
  try {
    const response = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-db-name': getSelectedDb()
      },
      body: JSON.stringify({ query: sql })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro na bridge');
    }
    const result = await response.json();
    return result.data;
  } catch (err: unknown) {
    throw err;
  }
};

export const fetchTableList = async () => {
  try {
    const response = await fetch(`${API_BASE}/tables`, {
      headers: { 'x-db-name': getSelectedDb() }
    });
    return await response.json();
  } catch (err: unknown) {
    return [];
  }
};

export const fetchTableData = async (tableName: string, schema: string = 'dbo') => {
  try {
    const response = await fetch(`${API_BASE}/tables/${tableName}?schema=${schema}`, {
      headers: { 'x-db-name': getSelectedDb() }
    });
    return await response.json();
  } catch (err) {
    throw err;
  }
};


export const createLocalPageTemplate = async (pageId: string, pageName: string) => {
  try {
    const response = await fetch(`${API_BASE}/pages/template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId, pageName })
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (err) {
    return null;
  }
};

export const deleteLocalPageTemplate = async (fileName: string) => {
  try {
    const response = await fetch(`${API_BASE}/pages/template/${fileName}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
};
