
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { Page } from './types';
import Home from './pages/Home';
import Settings from './pages/Settings';
import DynamicPage from './pages/DynamicPage';
import { fetchDashboardData, initializeDefaultPages } from './services/dataService';
import { Database, Shield } from 'lucide-react';

// Specialized Pages
import VisaoGeralPage from './pages/VisaoGeralPage';
import DadosCvesPage from './pages/DadosCvesPage';
import UpdatesAppOsPage from './pages/UpdatesAppOsPage';
import CompliancePage from './pages/CompliancePage';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<string>(Page.HOME);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fullReload = async () => {
    setLoading(true);
    await initializeDefaultPages();
    const result = await fetchDashboardData();

    // Garantia crítica: Se o resultado da API não trouxer o cliente, 
    // injetamos o que está no localStorage para não ficar vazio na Home.
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

  const isExportAll = new URLSearchParams(window.location.search).get('exportAll') === 'true';
  const isPdfMode = new URLSearchParams(window.location.search).get('isPdfMode') === 'true';

  const renderContent = (pageToRender: string) => {
    if (pageToRender === Page.HOME) return <Home key={`${Page.HOME}-${data?.client}`} data={data} isPdfMode={isPdfMode} />;
    if (pageToRender === Page.SETTINGS) return <Settings key={Page.SETTINGS} />;

    // Mapeamento de Páginas Especializadas
    if (pageToRender === 'overview' || pageToRender === 'visao-geral' || pageToRender === 'custom-1771604176722') {
      return <VisaoGeralPage key={`${pageToRender}-${data?.client}`} pageId={pageToRender} isPdfMode={isPdfMode} />;
    }
    if (pageToRender === 'cve_analysis' || pageToRender === 'dados-cves' || pageToRender === 'custom-1771604533538') {
      return <DadosCvesPage key={`${pageToRender}-${data?.client}`} pageId={pageToRender} isPdfMode={isPdfMode} />;
    }
    if (pageToRender === 'updates' || pageToRender === 'updates-app-os' || pageToRender === 'custom-1771008387205') {
      return <UpdatesAppOsPage key={`${pageToRender}-${data?.client}`} pageId={pageToRender} isPdfMode={isPdfMode} />;
    }
    if (pageToRender === 'compliance' || pageToRender === 'custom-1771605045950') {
      return <CompliancePage key={`${pageToRender}-${data?.client}`} pageId={pageToRender} isPdfMode={isPdfMode} />;
    }

    return <DynamicPage key={`${pageToRender}-${data?.client}`} pageId={pageToRender} isPdfMode={isPdfMode} />;
  };

  if (isExportAll && data) {
    const pages = JSON.parse(localStorage.getItem('custom_pages') || '[]');
    const pagesToRender = pages.length > 0 ? pages : [{ id: Page.HOME }];
    return (
      <div className="bg-[#0a0f1e] text-white min-h-screen">
        {pagesToRender.map((p: any) => (
          <div key={p.id} className="pdf-page-wrapper" style={{
            pageBreakAfter: 'always',
            width: '297mm',
            height: '209mm',
            overflow: 'hidden',
            position: 'relative'
          }}>
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
