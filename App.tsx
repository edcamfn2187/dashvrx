import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

import Layout from './components/Layout';
import DynamicPage from './pages/DynamicPage';
import CompliancePage from './pages/CompliancePage';
import DadosCvesPage from './pages/DadosCvesPage';
import Home from './pages/Home';
import Settings from './pages/Settings';
import UpdatesAppOsPage from './pages/UpdatesAppOsPage';
import VisaoGeralPage from './pages/VisaoGeralPage';
import { fetchDashboardData, initializeDefaultPages } from './services/dataService';
import { Page } from './types';

type SpecializedPageComponent = React.ComponentType<{ pageId?: string; isPdfMode?: boolean }>;

const SPECIAL_PAGE_REGISTRY: Array<{ component: SpecializedPageComponent; aliases: string[] }> = [
  { component: VisaoGeralPage, aliases: ['overview', 'visao-geral', 'custom-1771604176722'] },
  { component: DadosCvesPage, aliases: ['cve_analysis', 'dados-cves', 'custom-1771604533538'] },
  { component: UpdatesAppOsPage, aliases: ['updates', 'updates-app-os', 'custom-1771008387205'] },
  { component: CompliancePage, aliases: ['compliance', 'custom-1771605045950'] }
];

const specialPagesById = new Map(
  SPECIAL_PAGE_REGISTRY.flatMap(({ component, aliases }) => aliases.map(alias => [alias, component]))
);

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<string>(Page.HOME);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fullReload = async () => {
    setLoading(true);
    await initializeDefaultPages();
    const result = await fetchDashboardData();

    const finalData = {
      ...result,
      client: result.client || localStorage.getItem('selected_client') || 'GUIDONI'
    };

    setData(finalData);
    setLoading(false);
  };

  useEffect(() => {
    fullReload();

    const handleRefresh = () => fullReload();
    const handleClientChange = () => {
      setActivePage(Page.HOME);
      fullReload();
    };

    window.addEventListener('dataRefreshed', handleRefresh);
    window.addEventListener('clientChanged', handleClientChange);

    return () => {
      window.removeEventListener('dataRefreshed', handleRefresh);
      window.removeEventListener('clientChanged', handleClientChange);
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="h-screen bg-[#0a0f1e] flex flex-col items-center justify-center space-y-6 font-sans">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-cyan-500/10 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
          <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-500/50" size={24} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-cyan-500 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Sincronizando Dados...</p>
          <p className="text-gray-600 text-[8px] uppercase tracking-widest font-bold">Plataforma CyberSecUp</p>
        </div>
      </div>
    );
  }

  const queryParams = new URLSearchParams(window.location.search);
  const isExportAll = queryParams.get('exportAll') === 'true';
  const isPdfMode = queryParams.get('isPdfMode') === 'true';

  const renderContent = (pageToRender: string) => {
    if (pageToRender === Page.HOME) return <Home key={`${Page.HOME}-${data?.client}`} data={data} isPdfMode={isPdfMode} />;
    if (pageToRender === Page.SETTINGS) return <Settings key={Page.SETTINGS} />;

    const SpecializedPage = specialPagesById.get(pageToRender);
    if (SpecializedPage) {
      return <SpecializedPage key={`${pageToRender}-${data?.client}`} pageId={pageToRender} isPdfMode={isPdfMode} />;
    }

    return <DynamicPage key={`${pageToRender}-${data?.client}`} pageId={pageToRender} isPdfMode={isPdfMode} />;
  };

  if (isExportAll && data) {
    const pages = JSON.parse(localStorage.getItem('custom_pages') || '[]');
    const pagesToRender = pages.length > 0 ? pages : [{ id: Page.HOME }];

    return (
      <div className="bg-[#0a0f1e] text-white min-h-screen">
        {pagesToRender.map((p: any) => (
          <div
            key={p.id}
            className="pdf-page-wrapper"
            style={{
              pageBreakAfter: 'always',
              width: '297mm',
              height: '209mm',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {renderContent(p.id)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Layout activePage={activePage} onPageChange={setActivePage} isLive={data?.isLive} data={data}>
      {renderContent(activePage)}
    </Layout>
  );
};

export default App;
