
import React, { useState, useEffect } from 'react';
import { CustomPage, CustomQuery } from '../types';
import { SortableGadget } from '../components/DashboardCards';
import StructuredGrid from '../components/StructuredGrid';
import * as LucideIcons from 'lucide-react';
import { Database, Edit2, Check, Plus, Search, Layout, Hash, BarChart2, PieChart as PieIcon, ShieldAlert } from 'lucide-react';
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

interface DynamicPageProps {
  pageId: string;
  isPdfMode?: boolean;
  config?: CustomPage | null;
  allQueries?: CustomQuery[];
}

const DynamicPage: React.FC<DynamicPageProps> = ({ pageId, isPdfMode = false, config, allQueries: allQueriesProvided }) => {
  const [page, setPage] = useState<CustomPage | null>(null);
  const [allQueries, setAllQueries] = useState<CustomQuery[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadData = () => {
    if (config !== undefined) {
      setPage(config);
    } else {
      const pages = JSON.parse(localStorage.getItem('custom_pages') || '[]');
      const currentPage = pages.find((p: CustomPage) => p.id === pageId);
      setPage(currentPage || null);
    }

    if (allQueriesProvided !== undefined) {
      setAllQueries(allQueriesProvided);
    } else {
      const queries = JSON.parse(localStorage.getItem('custom_queries') || '[]');
      setAllQueries(queries);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('pagesUpdated', loadData);
    window.addEventListener('queriesUpdated', loadData);
    return () => {
      window.removeEventListener('pagesUpdated', loadData);
      window.removeEventListener('queriesUpdated', loadData);
    };
  }, [pageId]);

  const savePageLayout = (updatedQueryIds: string[]) => {
    const pages = JSON.parse(localStorage.getItem('custom_pages') || '[]');
    const updatedPages = pages.map((p: CustomPage) =>
      p.id === pageId ? { ...p, queryIds: updatedQueryIds } : p
    );
    localStorage.setItem('custom_pages', JSON.stringify(updatedPages));
    setPage({ ...page!, queryIds: updatedQueryIds });
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

  const addGadgetToPage = (queryId: string) => {
    if (!page) return;
    const updated = [...page.queryIds, queryId];
    savePageLayout(updated);
  };

  const updateGadgetSize = (queryId: string, gridSpan: number, rowSpan: number) => {
    const updatedQueries = allQueries.map(q =>
      q.id === queryId ? { ...q, gridSpan, rowSpan } : q
    );
    localStorage.setItem('custom_queries', JSON.stringify(updatedQueries));
    setAllQueries(updatedQueries);
    window.dispatchEvent(new Event('queriesUpdated'));
  };

  if (!page) return <div className="p-8 text-center text-gray-500 uppercase font-black text-xs">Carregando...</div>;

  const IconComponent = (LucideIcons as any)[page.icon] || ShieldAlert;

  const pageQueries = page.queryIds
    .map(id => allQueries.find(q => q.id === id))
    .filter((q): q is CustomQuery => !!q);

  const availableQueries = allQueries.filter(q => !page.queryIds.includes(q.id) && q.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gap: '1.5rem',
    gridTemplateColumns: isPdfMode
      ? `repeat(${page.columns || 12}, 1fr)`
      : `repeat(${(page.columns || 12) * 2}, 1fr)`,
    gridAutoRows: `${page.rowHeight || 220}px`,
    gridAutoFlow: 'row dense',
    // Removed flex property; wrapper handles flex layout in PDF mode
  };

  return (
    <div
      className={`animate-fadeIn relative ${isPdfMode ? 'flex flex-col p-10 box-border w-full h-full' : 'space-y-6 pb-24 mx-auto w-full'}`}
      style={{
        width: '100%',
        maxWidth: isPdfMode ? '100%' : `${page.containerWidth || 1600}px`,
        height: page.containerHeight && !isPdfMode ? `${page.containerHeight}px` : 'auto',
        overflowY: page.containerHeight && !isPdfMode ? 'auto' : 'visible'
      }}
    >
      {/* Header Modelo Solicitado - Botão de edição removido */}
      <div className={`flex justify-between items-center bg-[#111827]/50 p-4 rounded-3xl border border-gray-800 shadow-xl ${isPdfMode ? '' : 'no-print'}`}>
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
        <div className="bg-[#111827] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl animate-slideDown space-y-4 no-print">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <Plus size={14} /> Biblioteca de Gadgets
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={12} />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-xl py-1.5 pl-9 pr-3 text-[10px] text-gray-300 outline-none focus:border-cyan-500 font-bold"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-40 overflow-y-auto p-1 custom-scrollbar">
            {availableQueries.map(q => (
              <button
                key={q.id}
                onClick={() => addGadgetToPage(q.id)}
                className="flex flex-col items-center gap-2 p-3 bg-black/40 border border-gray-800 rounded-2xl hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-center group"
              >
                <div className="p-2 bg-gray-900 rounded-lg group-hover:text-cyan-400">
                  {q.type === 'card' ? <Hash size={16} /> : q.type === 'bar' ? <BarChart2 size={16} /> : <PieIcon size={16} />}
                </div>
                <span className="text-[9px] font-black text-gray-500 uppercase truncate w-full">{q.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {page.layout && page.layout.length > 0 ? (
        <StructuredGrid layout={page.layout} allQueries={allQueries} rowHeight={page.rowHeight} columns={page.columns} isPdfMode={isPdfMode} />
      ) : pageQueries.length === 0 ? (
        <div className="bg-[#111827]/40 border border-gray-800 border-dashed rounded-[40px] py-32 text-center text-gray-600 flex flex-col items-center justify-center space-y-6">
          <Database size={64} className="mx-auto mb-6 opacity-5" />
          <p className="text-[11px] font-black uppercase tracking-[0.3em] mb-6 text-gray-500">Esta página ainda não possui gadgets</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={page.queryIds} strategy={rectSortingStrategy}>
            <div style={gridStyles}>
              {pageQueries.map(query => (
                <SortableGadget
                  key={query.id}
                  gadget={query}
                  isEditing={isEditing}
                  isPdfMode={isPdfMode}
                  onRemove={() => {
                    const updatedIds = page.queryIds.filter(id => id !== query.id);
                    savePageLayout(updatedIds);
                  }}
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

export default DynamicPage;
