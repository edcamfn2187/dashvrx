
import React, { useState, useEffect } from 'react';
import { CustomPage, CustomQuery } from '../types';
import { SortableGadget } from '../components/DashboardCards';
import StructuredGrid from '../components/StructuredGrid';
import * as LucideIcons from 'lucide-react';
import { 
  ShieldCheck, Edit2, Check, Plus, Search, 
  LayoutDashboard, BarChart2, Hash, PieChart as PieIcon,
  Maximize2, Settings2, Trash2, ShieldAlert
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';

const TemplatePage: React.FC<{ data?: any, pageName?: string }> = ({ data, pageName = "Nova Página" }) => {
  const [page, setPage] = useState<CustomPage | null>(null);
  const [allQueries, setAllQueries] = useState<CustomQuery[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadData = () => {
    const pages = JSON.parse(localStorage.getItem('custom_pages') || '[]');
    const currentPage = pages.find((p: any) => p.name === pageName || p.id === pageName.toLowerCase().replace(/\s+/g, '_'));
    setPage(currentPage || null);
    const queries = JSON.parse(localStorage.getItem('custom_queries') || '[]');
    setAllQueries(queries);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pagesUpdated', loadData);
    window.addEventListener('queriesUpdated', loadData);
    return () => {
      window.removeEventListener('pagesUpdated', loadData);
      window.removeEventListener('queriesUpdated', loadData);
    };
  }, [pageName]);

  const savePageLayout = (updatedQueryIds: string[]) => {
    if (!page) return;
    const pages = JSON.parse(localStorage.getItem('custom_pages') || '[]');
    const updatedPages = pages.map((p: any) => 
      p.id === page.id ? { ...p, queryIds: updatedQueryIds } : p
    );
    localStorage.setItem('custom_pages', JSON.stringify(updatedPages));
    setPage({ ...page, queryIds: updatedQueryIds });
    window.dispatchEvent(new Event('pagesUpdated'));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && page) {
      const oldIndex = page.queryIds.indexOf(active.id as string);
      const newIndex = page.queryIds.indexOf(over?.id as string);
      const newOrder = arrayMove(page.queryIds, oldIndex, newIndex) as string[];
      savePageLayout(newOrder);
    }
  };

  const updateGadgetSize = (queryId: string, gridSpan: number, rowSpan: number) => {
    const updatedQueries = allQueries.map(q => 
      q.id === queryId ? { ...q, gridSpan, rowSpan } : q
    );
    localStorage.setItem('custom_queries', JSON.stringify(updatedQueries));
    setAllQueries(updatedQueries);
    window.dispatchEvent(new Event('queriesUpdated'));
  };

  const addGadgetToPage = (queryId: string) => {
    if (!page) return;
    const updated = [...page.queryIds, queryId];
    savePageLayout(updated);
  };

  if (!page) return <div className="p-20 text-center animate-pulse text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Inicializando Módulo...</div>;

  const IconComponent = (LucideIcons as any)[page.icon] || ShieldAlert;
  const pageQueries = page.queryIds.map(id => allQueries.find(q => q.id === id)).filter((q): q is CustomQuery => !!q);
  const availableQueries = allQueries.filter(q => !page.queryIds.includes(q.id) && q.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const gridStyles = {
    display: 'grid',
    gap: '1.5rem',
    gridTemplateColumns: `repeat(${page.columns || 12}, 1fr)`,
    gridAutoRows: `${page.rowHeight || 220}px`,
    gridFlow: 'row dense'
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Header Padronizado - Botão de edição removido */}
      <div className="flex justify-between items-center bg-[#111827]/50 p-4 rounded-3xl border border-gray-800 shadow-xl no-print">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-600/10 border border-cyan-600/30 rounded-2xl text-cyan-400">
            <IconComponent size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight uppercase leading-none mb-1">{page.name}</h2>
          </div>
        </div>
        
        <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] border border-gray-800 px-4 py-2 rounded-xl">Report vRx</span>
      </div>

      {isEditing && (
        <div className="bg-[#111827]/80 border border-cyan-500/30 rounded-[32px] p-6 shadow-2xl animate-slideDown space-y-4 no-print backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
               Catálogo de Componentes SQL
            </h3>
            <div className="relative w-80">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14}/>
               <input 
                type="text" 
                placeholder="Pesquisar gadgets..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-[10px] text-gray-300 outline-none focus:border-cyan-500 font-bold transition-all"
               />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-56 overflow-y-auto p-1 custom-scrollbar">
            {availableQueries.map(q => (
              <button key={q.id} onClick={() => addGadgetToPage(q.id)} className="flex flex-col items-center gap-3 p-5 bg-black/40 border border-gray-800 rounded-2xl hover:border-cyan-500 hover:bg-cyan-500/5 transition-all text-center group active:scale-95">
                <div className="p-3 bg-gray-800 rounded-xl group-hover:text-cyan-400">
                  {q.type === 'card' ? <Hash size={20}/> : q.type === 'bar' ? <BarChart2 size={20}/> : <PieIcon size={20}/>}
                </div>
                <span className="text-[9px] font-black text-gray-500 uppercase truncate w-full tracking-wider">{q.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {page.layout && page.layout.length > 0 ? (
        <StructuredGrid layout={page.layout} allQueries={allQueries} rowHeight={page.rowHeight} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={page.queryIds} strategy={rectSortingStrategy}>
            <div style={gridStyles}>
              {pageQueries.map(query => (
                <SortableGadget 
                  key={query.id} 
                  gadget={query} 
                  isEditing={isEditing} 
                  onRemove={() => savePageLayout(page.queryIds.filter(id => id !== query.id))}
                  onResize={(w, r) => updateGadgetSize(query.id, w, r)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default TemplatePage;
