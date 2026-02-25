
import React, { useState, useEffect } from 'react';
import { Page, CustomPage } from '../types';
import { Settings, RefreshCcw, Layout as LayoutIcon, Users, Download } from 'lucide-react';
import ISHLogo from './ISHLogo';
import * as LucideIcons from 'lucide-react';

// Importando apenas o essencial
import Home from '../pages/Home';
import DynamicPage from '../pages/DynamicPage';
import VisaoGeralPage from '../pages/VisaoGeralPage';
import DadosCvesPage from '../pages/DadosCvesPage';
import UpdatesAppOsPage from '../pages/UpdatesAppOsPage';
import CompliancePage from '../pages/CompliancePage';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onPageChange: (page: string) => void;
  isLive?: boolean;
  data?: any;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, onPageChange, isLive = false, data }) => {
  const PDF_PAGE_WIDTH_PX = 1920;
  const PDF_PAGE_HEIGHT_PX = 1080;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>(() => {
    return localStorage.getItem('selected_client') || 'ISH-MSS-LAB';
  });

  const loadData = () => {
    const savedPages = localStorage.getItem('custom_pages');
    if (savedPages) setCustomPages(JSON.parse(savedPages));

    const savedClients = localStorage.getItem('client_list');
    if (savedClients) setClients(JSON.parse(savedClients));
    else setClients(['ISH-MSS-LAB', 'ISH-MSS-PROD']);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pagesUpdated', loadData);
    window.addEventListener('clientsUpdated', loadData);
    return () => {
      window.removeEventListener('pagesUpdated', loadData);
      window.removeEventListener('clientsUpdated', loadData);
    };
  }, []);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClient = e.target.value;
    setSelectedClient(newClient);
    localStorage.setItem('selected_client', newClient);
    window.dispatchEvent(new CustomEvent('clientChanged', { detail: { client: newClient } }));
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent('dataRefreshed'));
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-db-name': localStorage.getItem('selected_client') || 'GUIDONI'
        },
        body: JSON.stringify({
          client: selectedClient,
          pages: customPages
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar PDF no servidor');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatorio_vRx_${selectedClient}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Erro ao exportar PDF. Verifique os logs do servidor.");
    } finally {
      setIsExporting(false);
    }
  };

  const getIcon = (name: string, fallback: React.ReactNode) => {
    const Icon = (LucideIcons as any)[name];
    return Icon ? <Icon size={18} /> : fallback;
  };

  const normalizePageKey = (value?: string) => {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <div className="flex h-screen bg-[#0a0f1e] overflow-hidden font-sans text-gray-300">
      <aside className="w-64 bg-[#111827] border-r border-gray-800 flex flex-col no-print">
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="text-xl font-bold tracking-tight">
            <span className="text-white">Cyber</span>
            <span className="text-[#22c55e]">SecUp</span>
          </div>
          <ISHLogo size="md" />
          <div className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-[0.2em]">Bridge System</div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          {customPages.map(p => (
            <button
              key={p.id}
              onClick={() => onPageChange(p.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${activePage === p.id
                ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-600/20'
                : 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-300'
                }`}
            >
              <span className={activePage === p.id ? 'text-cyan-400' : 'text-gray-600'}>
                {getIcon(p.icon, <LayoutIcon size={18} />)}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">{p.name}</span>
            </button>
          ))}

          <div className="pt-4 border-t border-gray-800/50 mt-4">
            <button
              onClick={() => onPageChange(Page.SETTINGS)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activePage === Page.SETTINGS ? 'bg-purple-600/10 text-purple-400 border border-purple-600/20' : 'text-gray-500 hover:bg-gray-800/50'
                }`}
            >
              <Settings size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Configurações</span>
            </button>
          </div>
        </nav>

        <div className="p-4 bg-black/20 border-t border-gray-800/50">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className={`text-[9px] font-black uppercase ${isLive ? 'text-green-500' : 'text-red-500'}`}>
                {isLive ? 'Online' : 'Offline'}
              </span>
            </div>
            <button onClick={handleRefresh} className="p-2 text-gray-500 hover:text-cyan-400">
              <RefreshCcw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          <select value={selectedClient} onChange={handleClientChange} className="w-full bg-black/60 border border-gray-700 text-white text-[10px] font-bold py-2 px-3 rounded-lg outline-none uppercase">
            {clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            id="export-pdf-btn"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="w-full mt-3 bg-cyan-800/50 text-cyan-400 text-[10px] font-bold py-2.5 px-3 rounded-lg hover:bg-cyan-700/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all border border-cyan-800"
          >
            {isExporting ? (
              <>
                <RefreshCcw size={14} className="animate-spin" />
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Exportar Relatório PDF</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#0a0f1e] relative">
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative no-print">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
