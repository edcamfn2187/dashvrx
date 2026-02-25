
import React, { useState, useEffect } from 'react';
import {
  Upload, Trash2, RefreshCcw, Image as ImageIcon, CheckCircle, Table as TableIcon, Terminal,
  Settings as SettingsIcon, Database, Plus, Play, Save, X, Layout as LayoutIcon,
  Edit3, BarChart2, PieChart as PieIcon, Hash, AlignLeft, AlignCenter, Layers,
  Palette, Square, Folder, ChevronDown, ChevronRight, List, CloudUpload,
  Maximize2, Grid, Layers as LayersIcon, ToggleLeft, ToggleRight, Check,
  TrendingUp, Search, Maximize, Type, GripVertical, FileText, FileDown, Loader2, Users, Calendar
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import ISHLogo from '../components/ISHLogo';
import DatabaseExplorer from './DatabaseExplorer';
import Diagnostics from './Diagnostics';
import SchedulingSettings from './SchedulingSettings';
import { CustomQuery, CustomPage, Page, PageRow, LayoutCell, SettingsTab } from '../types';
import { runCustomQuery, saveConfigToDb, fetchConfigFromDb, createLocalPageTemplate, deleteLocalPageTemplate } from '../services/dataService';
import { GadgetWidget } from '../components/DashboardCards';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const AVAILABLE_ICONS = ['LayoutDashboard', 'ShieldAlert', 'Info', 'ArrowBigUpDash', 'Database', 'Home', 'Shield', 'Activity', 'BarChart3', 'Zap', 'Lock', 'Server'];

// Componente para item de página ordenável
const SortablePageItem: React.FC<{ page: CustomPage, onEdit: any, onDelete: any }> = ({ page, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const Icon = (LucideIcons as any)[page.icon] || LayoutIcon;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-[#111827] border border-gray-800 rounded-3xl p-5 flex items-center justify-between group hover:border-purple-500/50 transition-all shadow-lg ${isDragging ? 'border-purple-500' : ''}`}>
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="p-1 text-gray-700 hover:text-gray-400 cursor-grab active:cursor-grabbing no-print">
          <GripVertical size={18} />
        </div>
        <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
          <Icon size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white uppercase">{page.name}</h4>
          <p className="text-[9px] text-gray-600 font-bold uppercase">{page.layout?.length || 0} Linhas Definidas • ID: {page.id}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onEdit(page)} className="p-2 text-gray-500 hover:text-cyan-400 transition-colors"><Edit3 size={16} /></button>
        <button onClick={() => onDelete(page.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
      </div>
    </div>
  );
};

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('queries');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [queries, setQueries] = useState<CustomQuery[]>([]);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [newClientName, setNewClientName] = useState('');

  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [isAddingQuery, setIsAddingQuery] = useState(false);
  const [editingGadgetId, setEditingGadgetId] = useState<string | null>(null);
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [searchTermQueries, setSearchTermQueries] = useState('');

  const [stackKeysInput, setStackKeysInput] = useState('');

  const [gadgetForm, setGadgetForm] = useState<Partial<CustomQuery> & { assignedPageIds: string[] }>({
    name: '', sql: '', type: 'card', orientation: 'vertical', color: '#ffffff', colors: ['#3ca2b1'], headerBgColor: '#111827', headerTextColor: '#3ca2b1', valueColor: '#ffffff', labelKey: '', valueKey: '', isRounded: true, isStacked: false, stackKeys: [], assignedPageIds: [], gridSpan: 3, rowSpan: 1, height: 220, showLabels: true, showLegend: true, titleFontSize: 10, valueFontSize: 30, xAxisLabelAngle: 0, barSize: 20
  });

  const [pageForm, setPageForm] = useState<Partial<CustomPage>>({
    name: '', icon: 'Layout', queryIds: [], columns: 12, rowHeight: 220, containerWidth: 1600, containerHeight: 900
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const savedLogo = localStorage.getItem('custom_app_logo');
    if (savedLogo) setLogoPreview(savedLogo);
    loadData();
  }, []);

  const loadData = async () => {
    let dbQueries = await fetchConfigFromDb('custom_queries');
    let dbPages = await fetchConfigFromDb('custom_pages');
    let dbClients = await fetchConfigFromDb('client_list');

    const localQueries = JSON.parse(localStorage.getItem('custom_queries') || '[]');
    const localPages = JSON.parse(localStorage.getItem('custom_pages') || '[]');
    const localClients = JSON.parse(localStorage.getItem('client_list') || '["GUIDONI", "LOCAL_INSTANCE"]');

    const finalQueries = dbQueries || localQueries;
    const finalPages = dbPages || localPages;
    const finalClients = dbClients || localClients;

    setQueries(finalQueries);
    setCustomPages(finalPages);
    setClients(finalClients);

    if (finalPages.length > 0 && !selectedPageId) setSelectedPageId(finalPages[0].id);
  };

  const forceSyncToDb = async () => {
    setIsSyncing(true);
    try {
      await saveConfigToDb('custom_queries', queries);
      await saveConfigToDb('custom_pages', customPages);
      await saveConfigToDb('client_list', clients);
      alert('✅ Sincronização concluída!');
    } catch (err: any) {
      alert('❌ Erro: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveQueries = async (updated: CustomQuery[]) => {
    setQueries(updated);
    localStorage.setItem('custom_queries', JSON.stringify(updated));
    try { await saveConfigToDb('custom_queries', updated); } catch (e) { }
    window.dispatchEvent(new Event('queriesUpdated'));
  };

  const savePages = async (updated: CustomPage[]) => {
    setCustomPages(updated);
    localStorage.setItem('custom_pages', JSON.stringify(updated));
    try { await saveConfigToDb('custom_pages', updated); } catch (e) { }
    window.dispatchEvent(new Event('pagesUpdated'));
  };

  const saveClients = async (updated: string[]) => {
    setClients(updated);
    localStorage.setItem('client_list', JSON.stringify(updated));
    try { await saveConfigToDb('client_list', updated); } catch (e) { }
    window.dispatchEvent(new Event('clientsUpdated'));
  };

  const handleAddClient = () => {
    const name = newClientName.trim().toUpperCase();
    if (!name) return;
    if (clients.includes(name)) {
      alert('Este cliente já existe.');
      return;
    }
    const updated = [...clients, name];
    saveClients(updated);
    setNewClientName('');
  };

  const handleDeleteClient = (name: string) => {
    if (confirm(`Excluir o cliente ${name}?`)) {
      const updated = clients.filter(c => c !== name);
      saveClients(updated);
    }
  };

  const handleDragEndPages = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = customPages.findIndex(p => p.id === active.id);
      const newIndex = customPages.findIndex(p => p.id === over?.id);
      const newOrder = arrayMove(customPages, oldIndex, newIndex) as CustomPage[];
      savePages(newOrder);
    }
  };

  const handleUpdatePageGrid = (pageId: string, updates: Partial<CustomPage>) => {
    const updated = customPages.map(p => p.id === pageId ? { ...p, ...updates } : p);
    savePages(updated);
  };

  const handleSavePage = async () => {
    if (!pageForm.name) {
      alert("Por favor, informe o nome da página.");
      return;
    }

    const generatedId = editingPageId || `custom-${Date.now()}`;
    let updatedPages;

    const generatedFileName = pageForm.name!
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .toLowerCase();

    if (editingPageId) {
      updatedPages = customPages.map(p => p.id === editingPageId ? { ...p, name: pageForm.name!, icon: pageForm.icon!, fileName: generatedFileName } : p);
    } else {

      const newPage: CustomPage = {
        id: generatedId,
        name: pageForm.name!,
        icon: pageForm.icon || 'Layout',
        queryIds: [],
        columns: 12,
        rowHeight: 220,
        layout: [],
        fileName: generatedFileName
      };
      updatedPages = [...customPages, newPage];

      await createLocalPageTemplate(generatedId, pageForm.name!);
    }

    savePages(updatedPages);
    setIsAddingPage(false);
    setEditingPageId(null);
  };

  const handleDeletePage = async (id: string) => {
    if (confirm('Deseja realmente excluir esta página?')) {
      const pageToDelete = customPages.find(x => x.id === id);
      const updated = customPages.filter(x => x.id !== id);

      // Attempt to physically remove the page file if fileName exists
      if (pageToDelete && pageToDelete.fileName) {
        await deleteLocalPageTemplate(pageToDelete.fileName);
      }

      savePages(updated);
    }
  };

  const handleAddGadget = () => {
    if (!gadgetForm.name || !gadgetForm.sql) return;

    let targetGadgetId = editingGadgetId || `q-${Date.now()}`;
    let updatedQueries;

    const { assignedPageIds, ...gadgetClean } = gadgetForm;
    const cleanedStackKeys = stackKeysInput.split(',').map(k => k.trim()).filter(k => k !== '');

    const finalGadget: CustomQuery = {
      ...(gadgetClean as CustomQuery),
      id: targetGadgetId,
      stackKeys: cleanedStackKeys,
      gridSpan: Number(gadgetClean.gridSpan) || 3,
      rowSpan: Number(gadgetClean.rowSpan) || 1,
      height: Number(gadgetClean.height) || 220,
      titleFontSize: Number(gadgetClean.titleFontSize) || 10,
      valueFontSize: Number(gadgetClean.valueFontSize) || 30,
      xAxisLabelAngle: Number(gadgetClean.xAxisLabelAngle) || 0,
      barSize: gadgetClean.barSize ? Number(gadgetClean.barSize) : undefined
    };

    if (editingGadgetId) {
      updatedQueries = queries.map(q => q.id === editingGadgetId ? finalGadget : q);
    } else {
      updatedQueries = [...queries, finalGadget];
    }

    saveQueries(updatedQueries);

    const updatedPages = customPages.map(page => {
      const shouldHaveGadget = assignedPageIds.includes(page.id);
      const currentlyHasGadget = page.queryIds.includes(targetGadgetId);

      if (shouldHaveGadget && !currentlyHasGadget) {
        return { ...page, queryIds: [...page.queryIds, targetGadgetId] };
      } else if (!shouldHaveGadget && currentlyHasGadget) {
        return { ...page, queryIds: page.queryIds.filter(id => id !== targetGadgetId) };
      }
      return page;
    });

    savePages(updatedPages);
    setIsAddingQuery(false);
    setEditingGadgetId(null);
  };

  const handleEditGadget = (gadget: CustomQuery) => {
    const assignedIds = customPages.filter(p => p.queryIds.includes(gadget.id)).map(p => p.id);
    setGadgetForm({
      ...gadget,
      assignedPageIds: assignedIds,
      gridSpan: gadget.gridSpan || 3,
      rowSpan: gadget.rowSpan || 1,
      height: gadget.height || 220,
      titleFontSize: gadget.titleFontSize || 10,
      valueFontSize: gadget.valueFontSize || 30,
      xAxisLabelAngle: gadget.xAxisLabelAngle || 0,
      barSize: gadget.barSize || 20
    });
    setStackKeysInput(gadget.stackKeys?.join(',') || '');
    setEditingGadgetId(gadget.id);
    setIsAddingQuery(true);
  };

  const addColorToPalette = () => {
    const updated = [...(gadgetForm.colors || []), '#3ca2b1'];
    setGadgetForm({ ...gadgetForm, colors: updated });
  };

  const removePaletteColor = (index: number) => {
    const updated = (gadgetForm.colors || []).filter((_, i) => i !== index);
    setGadgetForm({ ...gadgetForm, colors: updated });
  };

  const addRowToPage = (pageId: string) => {
    const page = customPages.find(p => p.id === pageId);
    if (!page) return;

    const initialCellCount = 3;
    const defaultSpan = 4;

    const newRow: PageRow = {
      id: `row-${Date.now()}`,
      columnCount: initialCellCount,
      height: page.rowHeight || 220,
      cells: Array.from({ length: initialCellCount }).map((_, i) => ({
        id: `cell-${Date.now()}-${i}`,
        queryIds: [],
        gridSpan: defaultSpan
      }))
    };
    const updatedLayout = [...(page.layout || []), newRow];
    handleUpdatePageGrid(pageId, { layout: updatedLayout });
  };

  const removeRowFromPage = (pageId: string, rowId: string) => {
    const page = customPages.find(p => p.id === pageId);
    if (!page) return;
    const updatedLayout = page.layout?.filter(r => r.id !== rowId) || [];
    handleUpdatePageGrid(pageId, { layout: updatedLayout });
  };

  const updateRowColumns = (pageId: string, rowId: string, count: number) => {
    const page = customPages.find(p => p.id === pageId);
    if (!page || !page.layout) return;
    const updatedLayout = page.layout.map(r => {
      if (r.id === rowId) {
        const newSpan = Math.max(0.5, Math.floor(12 / count));
        const newCells = Array.from({ length: count }).map((_, i) => {
          if (r.cells[i]) return r.cells[i];
          return { id: `cell-${Date.now()}-${i}`, queryIds: [], gridSpan: newSpan };
        });
        return { ...r, columnCount: count, cells: newCells };
      }
      return r;
    });
    handleUpdatePageGrid(pageId, { layout: updatedLayout });
  };

  const updateCellSpan = (pageId: string, rowId: string, cellId: string, span: number) => {
    const page = customPages.find(p => p.id === pageId);
    if (!page || !page.layout) return;
    const updatedLayout = page.layout.map(r => {
      if (r.id === rowId) {
        const updatedCells = r.cells.map(c => c.id === cellId ? { ...c, gridSpan: span } : c);
        return { ...r, cells: updatedCells };
      }
      return r;
    });
    handleUpdatePageGrid(pageId, { layout: updatedLayout });
  };

  const updateRowHeight = (pageId: string, rowId: string, height: number) => {
    const page = customPages.find(p => p.id === pageId);
    if (!page || !page.layout) return;
    const updatedLayout = page.layout.map(r => {
      if (r.id === rowId) {
        return { ...r, height };
      }
      return r;
    });
    handleUpdatePageGrid(pageId, { layout: updatedLayout });
  };

  const toggleGadgetInCell = (pageId: string, rowId: string, cellId: string, queryId: string) => {
    const page = customPages.find(p => p.id === pageId);
    if (!page || !page.layout) return;
    const updatedLayout = page.layout.map(r => {
      if (r.id === rowId) {
        const updatedCells = r.cells.map(c => {
          if (c.id === cellId) {
            const exists = c.queryIds.includes(queryId);
            const newQueryIds = exists ? c.queryIds.filter(id => id !== queryId) : [...c.queryIds, queryId];
            return { ...c, queryIds: newQueryIds };
          }
          return c;
        });
        return { ...r, cells: updatedCells };
      }
      return r;
    });
    handleUpdatePageGrid(pageId, { layout: updatedLayout });
  };

  const tabs = [
    { id: 'general', label: 'Estilo', icon: <SettingsIcon size={16} /> },
    { id: 'clients', label: 'Clientes', icon: <Users size={16} /> },
    { id: 'queries', label: 'Gadgets SQL', icon: <BarChart2 size={16} /> },
    { id: 'pages', label: 'Páginas', icon: <LayoutIcon size={16} /> },
    { id: 'builder', label: 'Grade', icon: <LayersIcon size={16} /> },
    { id: 'scheduling', label: 'Agendamento', icon: <Calendar size={16} /> },
    { id: 'database', label: 'Tabelas', icon: <TableIcon size={16} /> },
    { id: 'diagnostics', label: 'Logs', icon: <Terminal size={16} /> },
  ];

  const filteredQueries = queries.filter(q =>
    q.name.toLowerCase().includes(searchTermQueries.toLowerCase()) ||
    q.sql.toLowerCase().includes(searchTermQueries.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn max-w-[1800px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-gray-800 w-fit overflow-x-auto max-w-full">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as SettingsTab)} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-600/30' : 'text-gray-500 hover:text-gray-300'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <button onClick={forceSyncToDb} disabled={isSyncing} className="flex items-center gap-2 bg-green-600/10 border border-green-600/50 text-green-400 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-green-600/20 transition-all shadow-lg">
          {isSyncing ? <RefreshCcw size={14} className="animate-spin" /> : <CloudUpload size={14} />} Sincronizar Tudo
        </button>
      </div>

      {activeTab === 'clients' && (
        <div className="max-w-4xl space-y-8 animate-fadeIn">
          <div className="bg-[#111827] border border-gray-800 rounded-3xl p-8 space-y-8 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Gestão de Clientes / Bancos</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">O nome do cliente deve corresponder exatamente ao nome do Banco de Dados no SQL Server</p>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input
                  type="text"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddClient()}
                  placeholder="Nome do Banco (Ex: GUIDONI_V2)"
                  className="w-full bg-black border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-cyan-500 outline-none uppercase font-mono"
                />
              </div>
              <button
                onClick={handleAddClient}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase shadow-xl transition-all flex items-center gap-2"
              >
                <Plus size={18} /> Criar Cliente
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map(client => (
                <div key={client} className="bg-black/40 border border-gray-800 rounded-2xl p-5 flex items-center justify-between group hover:border-cyan-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-500">
                      <Database size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-widest">{client}</h4>
                      <p className="text-[9px] text-gray-600 font-bold uppercase">Database Mapping Active</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteClient(client)}
                    className="p-2 text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'queries' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Biblioteca de Gadgets SQL</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Configure o visual e o SQL de cada componente</p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              {!isAddingQuery && (
                <>
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                    <input
                      type="text"
                      placeholder="Buscar componente..."
                      value={searchTermQueries}
                      onChange={e => setSearchTermQueries(e.target.value)}
                      className="w-full bg-black border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-[11px] text-gray-300 outline-none focus:border-cyan-500 font-bold transition-all"
                    />
                  </div>
                  <button onClick={() => {
                    setEditingGadgetId(null);
                    setGadgetForm({ name: '', sql: '', type: 'card', orientation: 'vertical', color: '#ffffff', colors: ['#3ca2b1'], headerBgColor: '#111827', headerTextColor: '#3ca2b1', valueColor: '#ffffff', labelKey: '', valueKey: '', isRounded: true, isStacked: false, stackKeys: [], assignedPageIds: [], gridSpan: 3, rowSpan: 1, height: 220, showLabels: true, showLegend: true, titleFontSize: 10, valueFontSize: 30, xAxisLabelAngle: 0, barSize: 20 });
                    setStackKeysInput('');
                    setIsAddingQuery(true);
                  }} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg transition-all whitespace-nowrap">
                    <Plus size={16} /> Novo Gadget
                  </button>
                </>
              )}
            </div>
          </div>

          {isAddingQuery && (
            <div className="bg-[#111827] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl animate-slideDown space-y-8">
              <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                <h4 className="text-sm font-black text-cyan-400 uppercase tracking-widest">{editingGadgetId ? 'Editar Componente' : 'Criar Novo Componente'}</h4>
                <button onClick={() => setIsAddingQuery(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase">Nome do Gadget</label>
                      <input type="text" value={gadgetForm.name} onChange={e => setGadgetForm({ ...gadgetForm, name: e.target.value })} className="w-full bg-black border border-gray-800 rounded-xl p-3 text-xs text-white focus:border-cyan-500 outline-none" placeholder="Ex: Total de Alertas" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase">Tipo de Gráfico / Viewer</label>
                      <div className="flex flex-wrap gap-2">
                        {['card', 'bar', 'pie', 'line', 'table'].map(t => (
                          <button key={t} onClick={() => setGadgetForm({ ...gadgetForm, type: t as any })} className={`px-4 py-2.5 rounded-xl border transition-all text-[10px] font-black uppercase flex items-center justify-center gap-2 ${gadgetForm.type === t ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-black border-gray-800 text-gray-600'}`}>
                            {t === 'card' ? <Hash size={14} /> : t === 'bar' ? <BarChart2 size={14} /> : t === 'pie' ? <PieIcon size={14} /> : t === 'line' ? <TrendingUp size={14} /> : <TableIcon size={14} />} {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase">Consulta SQL / View</label>
                    <textarea value={gadgetForm.sql} onChange={e => setGadgetForm({ ...gadgetForm, sql: e.target.value })} className="w-full bg-black border border-gray-800 rounded-xl p-4 text-xs font-mono text-cyan-500 h-32 outline-none focus:border-cyan-500" placeholder="SELECT count(*) as value FROM logs" />
                  </div>

                  {(gadgetForm.type === 'bar' || gadgetForm.type === 'line') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase block">Modo de Exibição (Séries)</label>
                        <div className="flex gap-2">
                          <button onClick={() => setGadgetForm({ ...gadgetForm, isStacked: false })} className={`flex-1 py-2 rounded-xl border text-[9px] font-black uppercase flex items-center justify-center gap-2 ${!gadgetForm.isStacked ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-black border-gray-800 text-gray-600'}`}>
                            <BarChart2 size={12} /> Agrupado
                          </button>
                          {gadgetForm.type === 'bar' && (
                            <button onClick={() => setGadgetForm({ ...gadgetForm, isStacked: true })} className={`flex-1 py-2 rounded-xl border text-[9px] font-black uppercase flex items-center justify-center gap-2 ${gadgetForm.isStacked ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-black border-gray-800 text-gray-600'}`}>
                              <Layers size={12} /> Empilhado
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase block">Colunas da Série (separadas por vírgula)</label>
                        <input
                          type="text"
                          value={stackKeysInput}
                          onChange={e => setStackKeysInput(e.target.value)}
                          className="w-full bg-black border border-gray-800 rounded-xl p-2.5 text-xs text-cyan-400 font-mono focus:border-cyan-500 outline-none"
                          placeholder="Ex: critical,high,medium,low"
                        />
                        <p className="text-[8px] text-gray-600 uppercase italic">Se vazio, usará a segunda coluna da query</p>
                      </div>
                    </div>
                  )}



                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Type size={12} className="text-cyan-500" />
                        <label className="text-[9px] font-black text-gray-500 uppercase">Fonte Título</label>
                      </div>
                      <input
                        type="number"
                        value={gadgetForm.titleFontSize}
                        onChange={e => setGadgetForm({ ...gadgetForm, titleFontSize: Number(e.target.value) })}
                        className="w-full bg-black border border-gray-800 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500"
                        placeholder="Default: 10"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Type size={12} className="text-cyan-500" />
                        <label className="text-[9px] font-black text-gray-500 uppercase">Fonte Dados</label>
                      </div>
                      <input
                        type="number"
                        value={gadgetForm.valueFontSize}
                        onChange={e => setGadgetForm({ ...gadgetForm, valueFontSize: Number(e.target.value) })}
                        className="w-full bg-black border border-gray-800 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500"
                        placeholder="Default: 30"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlignLeft size={12} className="text-cyan-500" />
                        <label className="text-[9px] font-black text-gray-500 uppercase">Inclinação X</label>
                      </div>
                      <input
                        type="number"
                        value={gadgetForm.xAxisLabelAngle}
                        onChange={e => setGadgetForm({ ...gadgetForm, xAxisLabelAngle: Number(e.target.value) })}
                        className="w-full bg-black border border-gray-800 rounded-xl p-3 text-xs text-cyan-400 outline-none focus:border-cyan-500"
                        placeholder="Graus"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Maximize size={12} className="text-cyan-500" />
                        <label className="text-[9px] font-black text-gray-500 uppercase">Largura Barra</label>
                      </div>
                      <input
                        type="number"
                        value={gadgetForm.barSize}
                        onChange={e => setGadgetForm({ ...gadgetForm, barSize: Number(e.target.value) })}
                        className="w-full bg-black border border-gray-800 rounded-xl p-3 text-xs text-cyan-400 outline-none focus:border-cyan-500"
                        placeholder="px"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-800">
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Esquema de Cores</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-gray-600 uppercase">Fundo Cabeçalho</label>
                          <input type="color" value={gadgetForm.headerBgColor} onChange={e => setGadgetForm({ ...gadgetForm, headerBgColor: e.target.value })} className="w-full h-10 rounded-lg bg-black border border-gray-800 p-1 cursor-pointer" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-gray-600 uppercase">Texto Cabeçalho</label>
                          <input type="color" value={gadgetForm.headerTextColor} onChange={e => setGadgetForm({ ...gadgetForm, headerTextColor: e.target.value })} className="w-full h-10 rounded-lg bg-black border border-gray-800 p-1 cursor-pointer" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-gray-600 uppercase">Cor do Valor</label>
                          <input type="color" value={gadgetForm.valueColor} onChange={e => setGadgetForm({ ...gadgetForm, valueColor: e.target.value })} className="w-full h-10 rounded-lg bg-black border border-gray-800 p-1 cursor-pointer" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-gray-600 uppercase">Cantos Arredondados?</label>
                          <button onClick={() => setGadgetForm({ ...gadgetForm, isRounded: !gadgetForm.isRounded })} className={`w-full h-10 rounded-lg border flex items-center justify-center transition-all ${gadgetForm.isRounded ? 'border-cyan-500 text-cyan-500' : 'border-gray-800 text-gray-600'}`}>
                            {gadgetForm.isRounded ? <CheckCircle size={16} /> : <Square size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opções de Exibição</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-gray-600 uppercase">Exibir Rótulos</label>
                          <button
                            onClick={() => setGadgetForm({ ...gadgetForm, showLabels: !gadgetForm.showLabels })}
                            className={`w-full h-10 rounded-lg border flex items-center justify-center transition-all ${gadgetForm.showLabels ? 'bg-cyan-500/10 border-cyan-500 text-cyan-500' : 'bg-black border-gray-800 text-gray-600'}`}
                          >
                            {gadgetForm.showLabels ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-gray-600 uppercase">Exibir Legenda</label>
                          <button
                            onClick={() => setGadgetForm({ ...gadgetForm, showLegend: !gadgetForm.showLegend })}
                            className={`w-full h-10 rounded-lg border flex items-center justify-center transition-all ${gadgetForm.showLegend ? 'bg-cyan-500/10 border-cyan-500 text-cyan-500' : 'bg-black border-gray-800 text-gray-600'}`}
                          >
                            {gadgetForm.showLegend ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                        </div>
                      </div>

                      {gadgetForm.type !== 'card' && gadgetForm.type !== 'table' && (
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between items-center">
                            <h5 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Paleta do Gráfico</h5>
                            <button onClick={addColorToPalette} className="text-[9px] font-black text-cyan-500 uppercase">+ Add Cor</button>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {gadgetForm.colors?.map((c, i) => (
                              <div key={i} className="relative group">
                                <input type="color" value={c} onChange={e => {
                                  const updated = [...(gadgetForm.colors || [])];
                                  updated[i] = e.target.value;
                                  setGadgetForm({ ...gadgetForm, colors: updated });
                                }} className="w-full h-8 rounded bg-black border border-gray-800 p-0.5 cursor-pointer" />
                                <button onClick={() => removePaletteColor(i)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={8} /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-gray-800">
                    <label className="text-[9px] font-black text-gray-500 uppercase">Vincular às Páginas</label>
                    <div className="flex flex-wrap gap-2">
                      {customPages.map(p => (
                        <button key={p.id} onClick={() => {
                          const current = gadgetForm.assignedPageIds;
                          const updated = current.includes(p.id) ? current.filter(id => id !== p.id) : [...current, p.id];
                          setGadgetForm({ ...gadgetForm, assignedPageIds: updated });
                        }} className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${gadgetForm.assignedPageIds.includes(p.id) ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-black border-gray-800 text-gray-600'}`}>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-black/50 border border-gray-800 rounded-[32px] p-6 flex flex-col items-center justify-center relative min-h-[400px]">
                  <span className="absolute top-4 left-6 text-[8px] font-black text-gray-600 uppercase tracking-widest">Preview em Tempo Real</span>
                  <div className="w-full h-full flex items-center justify-center">
                    <GadgetWidget gadget={{ ...gadgetForm, id: 'preview', stackKeys: stackKeysInput.split(',').map(k => k.trim()).filter(k => k !== '') } as CustomQuery} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-800 pt-6">
                <button onClick={() => setIsAddingQuery(false)} className="px-6 py-2 text-xs font-black text-gray-500 uppercase">Cancelar</button>
                <button onClick={handleAddGadget} className="px-10 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase shadow-xl transition-all">Salvar Componente</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQueries.map(q => (
              <div key={q.id} className="bg-[#111827] border border-gray-800 rounded-3xl p-5 flex flex-col group hover:border-cyan-500/50 transition-all shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-800 rounded-xl group-hover:text-cyan-400">
                      {q.type === 'card' ? <Hash size={18} /> : q.type === 'bar' ? <BarChart2 size={18} /> : q.type === 'pie' ? <PieIcon size={18} /> : q.type === 'line' ? <TrendingUp size={18} /> : <TableIcon size={18} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase truncate max-w-[150px]">{q.name}</h4>
                      <span className="text-[9px] text-gray-600 font-black uppercase">{q.type} • W:{q.gridSpan} H:{q.rowSpan}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditGadget(q)} className="p-1.5 text-gray-600 hover:text-cyan-400 transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => saveQueries(queries.filter(x => x.id !== q.id))} className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="text-[9px] text-cyan-500/70 font-mono line-clamp-2 uppercase italic bg-black/40 rounded-2xl p-3 mb-4">{q.sql}</div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {q.colors?.slice(0, 4).map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-black shadow-sm" style={{ backgroundColor: c }}></div>
                    ))}
                  </div>
                  <span className="text-[8px] text-gray-600 font-black uppercase">Paleta • {q.isStacked ? 'Empilhado' : 'Agrupado'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'builder' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Construtor de Grade Avançado</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Crie o esqueleto da página linha por linha (Grade 12 Colunas • Passo 0.5)</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <select
                value={selectedPageId}
                onChange={e => setSelectedPageId(e.target.value)}
                className="bg-black border border-gray-800 text-cyan-400 text-xs font-bold px-4 py-2 rounded-lg outline-none focus:border-cyan-500"
              >
                {customPages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button
                onClick={() => addRowToPage(selectedPageId)}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg"
              >
                <Plus size={16} /> Adicionar Linha
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {customPages.find(p => p.id === selectedPageId)?.layout?.map((row, rowIndex) => (
              <div key={row.id} className="bg-[#111827] border border-gray-800 rounded-3xl p-6 relative group animate-slideDown">
                <div className="absolute -top-3 -left-3 bg-cyan-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">LINHA {rowIndex + 1}</div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Qtd Células</label>
                      <input
                        type="number" min="1" max="12"
                        value={row.columnCount}
                        onChange={e => updateRowColumns(selectedPageId, row.id, parseInt(e.target.value))}
                        className="bg-black border border-gray-800 text-cyan-400 font-black text-sm px-3 py-1.5 rounded-lg w-20 outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Altura (px)</label>
                      <input
                        type="number" min="50" step="10"
                        value={row.height || 220}
                        onChange={e => updateRowHeight(selectedPageId, row.id, parseInt(e.target.value))}
                        className="bg-black border border-gray-800 text-cyan-400 font-black text-sm px-3 py-1.5 rounded-lg w-24 outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <button onClick={() => removeRowFromPage(selectedPageId, row.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>

                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: `repeat(24, 1fr)` }}
                >
                  {row.cells.map((cell, cellIndex) => (
                    <div
                      key={cell.id}
                      className="bg-black/40 border border-gray-800 rounded-2xl p-4 space-y-4 min-h-[150px] flex flex-col"
                      style={{ gridColumn: `span ${Math.round((cell.gridSpan || 1) * 2)}` }}
                    >
                      <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-gray-600 uppercase whitespace-nowrap">Col {cellIndex + 1}</span>
                          <div className="flex items-center bg-black/60 rounded px-1.5 py-0.5 border border-gray-800">
                            <label className="text-[8px] font-black text-gray-500 uppercase mr-1.5">W (0.5-12):</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="12"
                              value={cell.gridSpan || 1}
                              onChange={e => updateCellSpan(selectedPageId, row.id, cell.id, parseFloat(e.target.value))}
                              className="bg-transparent text-cyan-400 font-black text-[10px] w-10 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        {cell.queryIds.map(qId => (
                          <div key={qId} className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2 flex items-center justify-between group/gadget">
                            <span className="text-[9px] font-bold text-cyan-400 uppercase truncate max-w-full">
                              {queries.find(q => q.id === qId)?.name}
                            </span>
                            <button onClick={() => toggleGadgetInCell(selectedPageId, row.id, cell.id, qId)} className="text-gray-600 hover:text-red-500 opacity-0 group/gadget hover:opacity-100 transition-all shrink-0 ml-1"><X size={12} /></button>
                          </div>
                        ))}
                        {cell.queryIds.length === 0 && <div className="text-[8px] text-gray-700 italic text-center py-4">Vazio</div>}
                      </div>

                      <div className="pt-2 border-t border-gray-800">
                        <select
                          className="w-full bg-black/60 border border-gray-700 text-[9px] font-bold text-gray-500 px-2 py-1.5 rounded outline-none focus:text-cyan-400"
                          onChange={e => {
                            if (e.target.value) {
                              toggleGadgetInCell(selectedPageId, row.id, cell.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="">+ Add Gadget</option>
                          {queries.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="max-w-4xl space-y-8 animate-fadeIn">
          <div className="bg-[#111827] border border-gray-800 rounded-3xl p-8 space-y-8 shadow-2xl">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight border-b border-gray-800 pb-4">Identidade Visual</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Logo do Relatório</label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-3xl p-8 hover:bg-cyan-500/5 transition-all group cursor-pointer relative">
                  <Upload size={32} className="text-gray-600 group-hover:text-cyan-400 mb-2" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Importar Logo</span>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (re) => {
                        localStorage.setItem('custom_app_logo', re.target?.result as string);
                        window.dispatchEvent(new Event('logoUpdated'));
                        loadData();
                      };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
              </div>
              <div className="bg-black/40 rounded-3xl border border-gray-800 p-6 flex flex-col items-center justify-center gap-4">
                <ISHLogo size="lg" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="max-w-5xl space-y-8 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Gerenciador de Páginas</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Crie novas seções e organize a ordem de navegação</p>
            </div>
            <button
              onClick={() => {
                setEditingPageId(null);
                setPageForm({ name: '', icon: 'Layout', queryIds: [] });
                setIsAddingPage(true);
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all"
            >
              <Plus size={16} /> Nova Página
            </button>
          </div>

          {isAddingPage && (
            <div className="bg-[#111827] border border-purple-500/30 rounded-3xl p-8 shadow-2xl animate-slideDown space-y-6">
              <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                <h4 className="text-sm font-black text-purple-400 uppercase tracking-widest">
                  {editingPageId ? 'Editar Detalhes da Página' : 'Configurar Nova Página'}
                </h4>
                <button onClick={() => setIsAddingPage(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase">Nome de Exibição</label>
                    <input
                      type="text"
                      value={pageForm.name}
                      onChange={e => setPageForm({ ...pageForm, name: e.target.value })}
                      className="w-full bg-black border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-purple-500 outline-none"
                      placeholder="Ex: Análise de Rede"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase">Ícone de Navegação</label>
                    <div className="grid grid-cols-6 gap-2">
                      {AVAILABLE_ICONS.map(iconName => {
                        const Icon = (LucideIcons as any)[iconName] || LayoutIcon;
                        return (
                          <button
                            key={iconName}
                            onClick={() => setPageForm({ ...pageForm, icon: iconName })}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-center ${pageForm.icon === iconName ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-black border-gray-800 text-gray-600 hover:border-gray-600'}`}
                          >
                            <Icon size={20} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-800">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase">Colunas (1-24)</label>
                      <input
                        type="number"
                        value={pageForm.columns}
                        onChange={e => setPageForm({ ...pageForm, columns: parseInt(e.target.value) })}
                        className="w-full bg-black border border-gray-800 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase">Altura Linha (px)</label>
                      <input
                        type="number"
                        value={pageForm.rowHeight}
                        onChange={e => setPageForm({ ...pageForm, rowHeight: parseInt(e.target.value) })}
                        className="w-full bg-black border border-gray-800 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase">Largura Total (px)</label>
                      <input
                        type="number"
                        value={pageForm.containerWidth}
                        onChange={e => setPageForm({ ...pageForm, containerWidth: parseInt(e.target.value) })}
                        className="w-full bg-black border border-gray-800 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase">Altura Total (px)</label>
                      <input
                        type="number"
                        value={pageForm.containerHeight || ''}
                        onChange={e => setPageForm({ ...pageForm, containerHeight: parseInt(e.target.value) || undefined })}
                        className="w-full bg-black border border-gray-800 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 rounded-3xl border border-gray-800 p-6 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="p-5 bg-purple-500/10 rounded-2xl text-purple-500 shadow-xl shadow-purple-900/10 mb-2">
                    {React.createElement((LucideIcons as any)[pageForm.icon || 'Layout'] || LayoutIcon, { size: 48 })}
                  </div>
                  <h5 className="text-xl font-bold text-white uppercase">{pageForm.name || 'Nova Página'}</h5>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-800 pt-6">
                <button onClick={() => setIsAddingPage(false)} className="px-6 py-2 text-xs font-black text-gray-500 uppercase">Cancelar</button>
                <button
                  onClick={handleSavePage}
                  className="px-10 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase shadow-xl transition-all"
                >
                  Salvar Página
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-4 mb-2">Arraste para reordenar</div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndPages}>
              <SortableContext items={customPages.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {customPages.map(page => (
                    <SortablePageItem
                      key={page.id}
                      page={page}
                      onEdit={(p: CustomPage) => {
                        setEditingPageId(p.id);
                        setPageForm(p);
                        setIsAddingPage(true);
                      }}
                      onDelete={handleDeletePage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}

      {activeTab === 'database' && <DatabaseExplorer />}
      {activeTab === 'diagnostics' && <Diagnostics />}
      {activeTab === 'scheduling' && <SchedulingSettings />}
    </div>
  );
};

export default Settings;
