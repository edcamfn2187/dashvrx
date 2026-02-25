
import React, { useState, useEffect, useMemo } from 'react';
import { runCustomQuery } from '../services/dataService';
import { RefreshCw, AlertCircle, BarChart2, PieChart as PieIcon, Hash, X, Settings2, GripVertical, Maximize2, Minimize2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, TrendingUp, Table as TableIcon } from 'lucide-react';
import { CustomQuery, CustomPage } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MetricCardProps {
  title: string;
  value: string | number;
  headerBgColor?: string;
  headerTextColor?: string;
  className?: string;
  valueColor?: string;
  dragHandleProps?: any;
  isRounded?: boolean;
  titleFontSize?: number;
  valueFontSize?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  headerBgColor = '#3ca2b1',
  headerTextColor = '#0a0f1e',
  valueColor = '#ffffff',
  className = '',
  dragHandleProps,
  isRounded = true,
  titleFontSize,
  valueFontSize
}) => (
  <div className={`flex flex-col border border-gray-800 ${isRounded ? 'rounded-2xl' : 'rounded-none'} overflow-hidden shadow-lg h-full w-full ${className}`}>
    <div
      className="px-3 py-1.5 font-black text-center uppercase tracking-[0.15em] flex items-center justify-center gap-2 relative cursor-default"
      style={{
        backgroundColor: headerBgColor,
        color: headerTextColor,
        fontSize: titleFontSize ? `${titleFontSize}px` : '9px'
      }}
    >
      {dragHandleProps && (
        <div {...dragHandleProps} className="absolute left-1.5 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 p-1 no-print">
          <GripVertical size={10} />
        </div>
      )}
      {title}
    </div>
    <div
      className="bg-black flex-1 flex items-center justify-center p-4 font-extrabold"
      style={{
        color: valueColor,
        fontSize: valueFontSize ? `${valueFontSize}px` : '30px'
      }}
    >
      {value}
    </div>
  </div>
);

const formatLegendText = (value: string) => value ? value.replace(/[_\-]+/g, ' ').toUpperCase() : '';

import Plot from 'react-plotly.js';

interface GadgetWidgetProps {
  gadget: CustomQuery;
  isEditing?: boolean;
  onRemove?: () => void;
  onConfig?: () => void;
  onResize?: (gridSpan: number, rowSpan: number) => void;
  dragHandleProps?: any;
  isPdfMode?: boolean;
  columns?: number;
}

export const GadgetWidget: React.FC<GadgetWidgetProps> = ({ gadget, isEditing, onRemove, onConfig, onResize, dragHandleProps }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runCustomQuery(gadget.sql);
      setData(result || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleRefresh = () => fetchData();
    window.addEventListener('dataRefreshed', handleRefresh);
    window.addEventListener('queriesUpdated', fetchData);
    return () => {
      window.removeEventListener('dataRefreshed', handleRefresh);
      window.removeEventListener('queriesUpdated', fetchData);
    };
  }, [gadget.sql, gadget.id]);

  const numericData = useMemo(() => {
    if (data.length === 0) return [];

    // Find the value key if not explicitly set
    const valKey = gadget.valueKey || (Object.keys(data[0])[1] || Object.keys(data[0])[0]);

    return data.map(d => {
      const val = d[valKey];
      const numVal = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
      return {
        ...d,
        [valKey]: isNaN(numVal) ? 0 : numVal
      };
    });
  }, [data, gadget.valueKey]);

  const renderContent = () => {
    if (loading) return <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-700 uppercase font-black animate-pulse bg-[#0d121f] rounded-2xl border border-gray-800">Streaming Data...</div>;
    if (error) return <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center bg-[#111827] rounded-2xl border border-red-900/30"><AlertCircle size={20} className="text-red-500 mb-1 opacity-50" /><span className="text-[8px] text-red-400 font-mono break-all line-clamp-2 px-2">{error}</span></div>;

    if (gadget.type === 'card') {
      const val = data.length > 0 ? Object.values(data[0])[0] : 0;
      return (
        <div className="h-full w-full relative group">
          <MetricCard
            title={gadget.name} value={String(val)}
            headerBgColor={gadget.headerBgColor} headerTextColor={gadget.headerTextColor}
            valueColor={gadget.valueColor || gadget.color || '#ffffff'} isRounded={gadget.isRounded !== false}
            dragHandleProps={isEditing ? dragHandleProps : null}
            titleFontSize={gadget.titleFontSize} valueFontSize={gadget.valueFontSize}
          />
          {isEditing && <div className="absolute top-1.5 right-1.5 flex gap-1 z-20 no-print"><button onClick={onRemove} className="p-1 bg-black/60 text-red-500 rounded-lg hover:bg-red-600 hover:text-white border border-gray-800"><X size={10} /></button></div>}
        </div>
      );
    }

    const labelKey = gadget.labelKey || Object.keys(data[0])[0];
    const valueKey = gadget.valueKey || (Object.keys(data[0])[1] || Object.keys(data[0])[0]);
    const isHorizontal = gadget.orientation === 'horizontal';
    const showLabels = gadget.showLabels !== false;
    const showLegend = gadget.showLegend !== false;
    const palette = gadget.colors && gadget.colors.length > 0 ? gadget.colors : [gadget.color || '#3ca2b1'];

    // Common Plotly Layout Options
    const commonLayout: Partial<Plotly.Layout> = {
      autosize: true,
      margin: { t: showLegend ? 40 : 10, r: 20, l: isHorizontal ? 100 : 40, b: gadget.xAxisLabelAngle !== 0 ? 80 : 30 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'ui-sans-serif, system-ui, sans-serif', size: 10, color: '#6b7280' },
      showlegend: showLegend,
      legend: { orientation: 'h', yanchor: 'bottom', y: 1.02, xanchor: 'right', x: 1, font: { size: 9, family: 'monospace' } },
      xaxis: {
        showgrid: !isHorizontal,
        gridcolor: '#1f2937',
        zeroline: false,
        tickangle: !isHorizontal ? (gadget.xAxisLabelAngle || 0) : 0,
        showticklabels: !isHorizontal,
        tickfont: { size: 9, color: '#6b7280', weight: 'bold' }
      },
      yaxis: {
        showgrid: isHorizontal,
        gridcolor: '#1f2937',
        zeroline: false,
        showticklabels: true,
        tickfont: { size: 9, color: '#6b7280', weight: 'bold' }
      }
    };

    let plotData: Plotly.Data[] = [];

    if (gadget.type === 'bar') {
      if (gadget.stackKeys && gadget.stackKeys.length > 0) {
        plotData = gadget.stackKeys.map((key, idx) => ({
          type: 'bar',
          orientation: isHorizontal ? 'h' : 'v',
          x: isHorizontal ? numericData.map(d => d[key.trim()]) : numericData.map(d => d[labelKey]),
          y: isHorizontal ? numericData.map(d => d[labelKey]) : numericData.map(d => d[key.trim()]),
          name: key.trim().toUpperCase(),
          marker: { color: palette[idx % palette.length] },
          text: showLabels ? numericData.map(d => String(d[key.trim()])) : [],
          textposition: 'outside',
          textfont: { color: gadget.valueColor || '#9ca3af', size: 9, weight: 'bold' }
        }));
        if (gadget.isStacked) commonLayout.barmode = 'stack';
      } else {
        plotData = [{
          type: 'bar',
          orientation: isHorizontal ? 'h' : 'v',
          x: isHorizontal ? numericData.map(d => d[valueKey]) : numericData.map(d => d[labelKey]),
          y: isHorizontal ? numericData.map(d => d[labelKey]) : numericData.map(d => d[valueKey]),
          name: valueKey.toUpperCase(),
          marker: { color: numericData.map((_, i) => palette[i % palette.length]) },
          text: showLabels ? numericData.map(d => String(d[valueKey])) : [],
          textposition: 'outside',
          textfont: { color: gadget.valueColor || '#9ca3af', size: 9, weight: 'bold' }
        }];
      }
    } else if (gadget.type === 'line') {
      if (gadget.stackKeys && gadget.stackKeys.length > 0) {
        plotData = gadget.stackKeys.map((key, idx) => ({
          type: 'scatter',
          mode: (showLabels ? 'lines+markers+text' : 'lines+markers') as any,
          x: numericData.map(d => d[labelKey]),
          y: numericData.map(d => d[key.trim()]),
          name: key.trim().toUpperCase(),
          line: { color: palette[idx % palette.length], width: 3 },
          marker: { size: 6, color: '#0a0f1e', line: { color: palette[idx % palette.length], width: 2 } },
          text: showLabels ? numericData.map(d => String(d[key.trim()])) : [],
          textposition: 'top center',
          textfont: { color: gadget.valueColor || '#9ca3af', size: 9, weight: 'bold' }
        }));
      } else {
        plotData = [{
          type: 'scatter',
          mode: (showLabels ? 'lines+markers+text' : 'lines+markers') as any,
          x: numericData.map(d => d[labelKey]),
          y: numericData.map(d => d[valueKey]),
          name: valueKey.toUpperCase(),
          line: { color: palette[0], width: 3 },
          marker: { size: 6, color: '#0a0f1e', line: { color: palette[0], width: 2 } },
          text: showLabels ? numericData.map(d => String(d[valueKey])) : [],
          textposition: 'top center',
          textfont: { color: gadget.valueColor || '#9ca3af', size: 9, weight: 'bold' }
        }];
      }
    } else if (gadget.type === 'pie') {
      plotData = [{
        type: 'pie',
        labels: numericData.map(d => d[labelKey]),
        values: numericData.map(d => d[valueKey]),
        textinfo: showLabels ? 'label+percent' : 'none',
        hole: 0.5,
        marker: { colors: numericData.map((_, i) => palette[i % palette.length]), line: { color: '#0a0f1e', width: 2 } },
        textfont: { color: gadget.valueColor || '#9ca3af', size: 9, weight: 'bold' }
      }];
      commonLayout.margin = { t: 20, b: 20, l: 20, r: 20 };
      if (showLegend) {
        commonLayout.legend = { orientation: 'h', yanchor: 'bottom', y: -0.1, xanchor: 'center', x: 0.5, font: { size: 9, family: 'monospace' } };
      }
    }

    return (
      <div className={`bg-[#111827] border border-gray-800 ${gadget.isRounded !== false ? 'rounded-2xl' : 'rounded-none'} overflow-hidden flex flex-col h-full w-full shadow-2xl transition-all relative`}>
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between" style={{ backgroundColor: gadget.headerBgColor || '#111827' }}>
          <div className="flex items-center gap-2 overflow-hidden">
            {isEditing && <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-cyan-400 no-print"><GripVertical size={14} /></div>}
            <h4 className="font-black uppercase tracking-[0.2em] truncate" style={{ color: gadget.headerTextColor || '#9ca3af', fontSize: gadget.titleFontSize ? `${gadget.titleFontSize}px` : '10px' }}>{gadget.name}</h4>
          </div>
          {isEditing && <div className="flex gap-1 shrink-0 no-print"><div className="flex bg-black/60 rounded-lg border border-gray-800 overflow-hidden"><button onClick={() => onResize?.(Math.max(0.5, (gadget.gridSpan || 1) - 0.5), gadget.rowSpan || 1)} className="p-1.5 text-gray-500 hover:text-white border-r border-gray-800"><ChevronLeft size={10} /></button><button onClick={() => onResize?.(Math.min(12, (gadget.gridSpan || 1) + 0.5), gadget.rowSpan || 1)} className="p-1.5 text-gray-500 hover:text-white border-r border-gray-800"><ChevronRight size={10} /></button><button onClick={() => onResize?.(gadget.gridSpan || 1, Math.max(1, (gadget.rowSpan || 1) - 1))} className="p-1.5 text-gray-500 hover:text-white border-r border-gray-800"><ChevronUp size={10} /></button><button onClick={() => onResize?.(gadget.gridSpan || 1, (gadget.rowSpan || 1) + 1)} className="p-1.5 text-gray-500 hover:text-white"><ChevronDown size={10} /></button></div><button onClick={onRemove} className="p-1.5 bg-black/60 text-red-500 rounded-lg border border-gray-800 hover:bg-red-600 hover:text-white"><X size={10} /></button></div>}
        </div>
        <div className="flex-1 p-2 w-full min-h-0 overflow-hidden">
          {data.length === 0 ? <div className="h-full flex items-center justify-center text-[9px] text-gray-700 font-bold uppercase italic">No Data Results</div> : gadget.type === 'table' ? (
            <div className="h-full w-full overflow-auto custom-scrollbar border border-gray-800/50 rounded-xl bg-black/20">
              <table className="w-full text-left text-[9px] border-collapse">
                <thead className="sticky top-0 bg-[#1f2937] z-10 shadow-sm"><tr>{Object.keys(data[0]).map(key => (<th key={key} className="px-3 py-2 border-b border-gray-800 text-gray-400 font-black uppercase tracking-widest">{key}</th>))}</tr></thead>
                <tbody>{data.slice(0, 50).map((row, i) => (<tr key={i} className="hover:bg-cyan-500/5 transition-colors border-b border-gray-800/30">{Object.values(row).map((val: any, j) => (<td key={j} className="px-3 py-2 text-gray-300 font-mono truncate max-w-[200px]">{String(val)}</td>))}</tr>))}</tbody>
              </table>
            </div>
          ) : (
            <div className="w-full h-full relative plotly-container">
              <Plot
                data={plotData}
                layout={commonLayout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
            </div>
          )}
        </div>
      </div>
    );
  };
  return <div className="h-full w-full">{renderContent()}</div>;
};

export const SortableGadget: React.FC<GadgetWidgetProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.gadget.id });
  const [currentRowHeight, setCurrentRowHeight] = useState(props.gadget.height || 220);

  useEffect(() => {
    if (props.columns) return; // Se já passou via prop, não precisa buscar no localStorage
    const findPageSettings = () => {
      const pages = JSON.parse(localStorage.getItem('custom_pages') || '[]');
      const activePageId = window.location.pathname.split('/').pop() || 'overview';
      const page = pages.find((p: any) => p.id === activePageId);
      if (page && page.rowHeight) setCurrentRowHeight(page.rowHeight);
    };
    findPageSettings();
    window.addEventListener('pagesUpdated', findPageSettings);
    return () => window.removeEventListener('pagesUpdated', findPageSettings);
  }, [props.columns]);

  const columnsCount = props.columns || 12;
  const spanValue = props.gadget.gridSpan || (props.gadget.type === 'card' ? 3 : 6);
  const rowSpan = props.gadget.rowSpan || 1;
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
    gridColumn: `span ${Math.round(spanValue * 2)} / span ${Math.round(spanValue * 2)}`,
    gridRow: `span ${rowSpan} / span ${rowSpan}`,
    height: '100%',
    minHeight: props.isPdfMode ? 0 : (props.gadget.type === 'card' ? '125px' : `${rowSpan * (props.gadget.height || currentRowHeight)}px`)
  };
  return (<div ref={setNodeRef} style={style} className={`${isDragging ? 'shadow-2xl scale-[1.01]' : ''} transition-all`}><GadgetWidget {...props} dragHandleProps={{ ...attributes, ...listeners }} /></div>);
};
