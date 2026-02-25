
import React from 'react';
import { PageRow, CustomQuery } from '../types';
import { GadgetWidget } from './DashboardCards';

interface StructuredGridProps {
  layout: PageRow[];
  allQueries: CustomQuery[];
  rowHeight?: number;
  columns?: number;
  isPdfMode?: boolean;
}

const StructuredGrid: React.FC<StructuredGridProps> = ({ layout, allQueries, rowHeight = 220, columns = 12, isPdfMode = false }) => {
  const totalGridColumns = columns * 2; // Mantém precisão de 0.5

  return (
    <div className={isPdfMode ? "flex flex-col h-full gap-6" : "space-y-6"}>
      {layout.map((row) => (
        <div
          key={row.id}
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${totalGridColumns}, 1fr)`,
            minHeight: isPdfMode ? 0 : `${row.height || rowHeight}px`,
            flex: isPdfMode ? (row.height || rowHeight) : undefined,
          }}
        >
          {row.cells.map((cell) => (
            <div
              key={cell.id}
              className="flex flex-col gap-4"
              style={{
                gridColumn: `span ${Math.round((cell.gridSpan || 1) * 2)} / span ${Math.round((cell.gridSpan || 1) * 2)}`
              }}
            >
              {cell.queryIds.map((qId) => {
                const query = allQueries.find(q => q.id === qId);
                if (!query) return null;
                return (
                  <div key={qId} style={{ minHeight: isPdfMode ? 0 : `${row.height || rowHeight}px`, flex: 1 }}>
                    <GadgetWidget gadget={query} />
                  </div>
                );
              })}
              {cell.queryIds.length === 0 && (
                <div className="border border-dashed border-gray-800 rounded-2xl flex items-center justify-center text-[10px] text-gray-700 uppercase font-bold h-full" style={{ minHeight: isPdfMode ? 0 : `${row.height || rowHeight}px` }}>
                  Célula Vazia
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default StructuredGrid;
