
import React, { useState, useEffect } from 'react';
import { Database, Table as TableIcon, Search, RefreshCw, AlertCircle, List, Eye } from 'lucide-react';
import { fetchTableList, fetchTableData } from '../services/dataService';

const DatabaseExplorer: React.FC = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<{name: string, schema: string} | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setLoading(true);
    const tableNames = await fetchTableList();
    setTables(tableNames);
    setLoading(false);
  };

  const handleSelectTable = async (tableName: string, schema: string) => {
    setSelectedTable({ name: tableName, schema });
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTableData(tableName, schema);
      setTableData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTables = tables.filter(t => t.TABLE_NAME.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-220px)] gap-6 animate-fadeIn">
      {/* Sidebar: Lista de Tabelas */}
      <div className="w-80 bg-[#111827] border border-gray-800 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 bg-[#1f2937]/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
              <Database size={14} /> Tabelas & Views
            </h3>
            <button onClick={loadTables} className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-500 hover:text-white">
              <RefreshCw size={14} className={loading && !selectedTable ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={12} />
            <input 
              type="text" 
              placeholder="Buscar tabela/view..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-lg py-2 pl-8 pr-4 text-[11px] text-gray-300 focus:border-cyan-500 outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredTables.map(table => (
            <button
              key={`${table.TABLE_SCHEMA}.${table.TABLE_NAME}`}
              onClick={() => handleSelectTable(table.TABLE_NAME, table.TABLE_SCHEMA)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                selectedTable?.name === table.TABLE_NAME && selectedTable?.schema === table.TABLE_SCHEMA
                  ? 'bg-cyan-600/10 border border-cyan-600/30 text-cyan-400' 
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border border-transparent'
              }`}
            >
              {table.TABLE_TYPE === 'VIEW' ? <Eye size={14} className="text-purple-400" /> : <TableIcon size={14} className={selectedTable?.name === table.TABLE_NAME ? 'text-cyan-400' : 'text-gray-600'} />}
              <div className="flex flex-col truncate">
                <span className="text-[11px] font-medium truncate">{table.TABLE_NAME}</span>
                <span className="text-[8px] text-gray-600 font-bold uppercase">{table.TABLE_SCHEMA} • {table.TABLE_TYPE === 'VIEW' ? 'View/Viewer' : 'Base Table'}</span>
              </div>
            </button>
          ))}
          {filteredTables.length === 0 && (
            <div className="p-4 text-center text-[10px] text-gray-600 italic">Nenhuma tabela ou view encontrada.</div>
          )}
        </div>
      </div>

      {/* Main Content: Visualizador de Dados */}
      <div className="flex-1 bg-[#111827] border border-gray-800 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {!selectedTable ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600 space-y-4">
            <List size={48} className="opacity-20" />
            <p className="text-sm font-medium uppercase tracking-widest opacity-40">Selecione uma tabela ou view para visualizar os dados</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-800 bg-[#1f2937]/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  {tables.find(t => t.TABLE_NAME === selectedTable.name && t.TABLE_SCHEMA === selectedTable.schema)?.TABLE_TYPE === 'VIEW' ? <Eye className="text-purple-400" size={18} /> : <TableIcon className="text-cyan-500" size={18} />}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-tight">{selectedTable.schema}.{selectedTable.name}</h2>
                  <p className="text-[10px] text-gray-500">Visualizando dados reais da instância selecionada</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {loading && <div className="text-[10px] text-cyan-500 animate-pulse font-bold uppercase">Carregando...</div>}
                <div className="text-[10px] bg-black px-2 py-1 rounded border border-gray-800 text-gray-500">
                  Registros: {tableData.length}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar bg-black/20">
              {error ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <AlertCircle size={40} className="text-red-500 mb-4 opacity-50" />
                  <p className="text-red-400 font-bold uppercase text-xs mb-2">Erro ao carregar dados</p>
                  <p className="text-gray-500 text-[10px] max-w-md">{error}</p>
                </div>
              ) : tableData.length > 0 ? (
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead className="sticky top-0 bg-[#1f2937] z-10 shadow-md">
                    <tr>
                      {Object.keys(tableData[0]).map(col => (
                        <th key={col} className="px-4 py-3 border-b border-gray-800 text-gray-400 font-black uppercase tracking-widest whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {tableData.map((row, i) => (
                      <tr key={i} className="hover:bg-cyan-500/5 transition-colors group">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-4 py-3 text-gray-300 font-mono whitespace-nowrap group-hover:text-white">
                            {val === null ? <span className="text-gray-700 italic">null</span> : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : !loading && (
                <div className="h-full flex items-center justify-center text-gray-600 italic text-xs uppercase tracking-widest">
                  Tabela vazia ou sem dados para exibir.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
};

export default DatabaseExplorer;
