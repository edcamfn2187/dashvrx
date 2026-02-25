
import React, { useEffect, useState } from 'react';
import { Terminal, Activity, Database, AlertCircle, Copy, Play, Key, ShieldCheck, Download, Trash2, Bug } from 'lucide-react';
import { logService, LogEntry } from '../services/logService';

const Diagnostics: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const refreshLogs = () => {
    setLogs(logService.getLogs());
  };

  useEffect(() => {
    refreshLogs();
    
    // Handler para novos logs
    const handleNewLog = () => refreshLogs();
    
    window.addEventListener('system_log_added', handleNewLog);
    return () => window.removeEventListener('system_log_added', handleNewLog);
  }, []);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const handleTestLog = () => {
    logService.addLog('info', 'Log de teste disparado manualmente pelo usuário.', 'Verificação do sistema de monitoramento.');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex justify-between items-center bg-[#111827] border border-gray-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-600/10 rounded-lg text-cyan-500">
            <Terminal size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tight">Console de Diagnóstico</h2>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Monitoramento de Requisições SQL</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleTestLog} 
            className="px-4 py-2 bg-purple-600/10 text-purple-400 border border-purple-600/30 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-purple-600/20 transition-all"
          >
            <Bug size={14} /> Testar Log
          </button>
          <button 
            onClick={() => logService.downloadLogs()} 
            className="px-4 py-2 bg-cyan-600/10 text-cyan-400 border border-cyan-600/30 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-cyan-600/20 transition-all"
          >
            <Download size={14} /> Baixar .log
          </button>
          <button 
            onClick={() => logService.clearLogs()} 
            className="px-4 py-2 bg-red-600/10 text-red-400 border border-red-600/30 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-red-600/20 transition-all"
          >
            <Trash2 size={14} /> Limpar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Key className="text-yellow-500" size={20} />
            <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Guia: Erro de Login (sa)</h3>
          </div>
          <p className="text-[11px] text-gray-300 mb-4 leading-relaxed">
            Se a rede conectou mas o login falhou, execute estes passos no <span className="text-white font-bold italic">SQL Management Studio</span>:
          </p>
          <ul className="text-[10px] space-y-2 text-gray-400 font-medium list-disc pl-4">
            <li>Servidor  <span className="text-white">Properties</span>  <span className="text-white">Security</span>  <span className="text-cyan-400">"SQL Server and Windows Authentication mode"</span>.</li>
            <li>Security <span className="text-white">Logins</span>  <span className="text-white">sa</span>  <span className="text-white">Properties</span>  <span className="text-white">Status</span>  <span className="text-green-500 font-bold uppercase">Enabled</span>.</li>
          </ul>
        </div>

        <div className="bg-[#111827] border border-gray-800 p-6 rounded-3xl space-y-4">
           <div className="flex items-center gap-2">
             <ShieldCheck className="text-cyan-500" size={20} />
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status da Infraestrutura</h3>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 border border-gray-800 p-3 rounded-2xl">
                 <div className="text-[8px] text-gray-600 font-bold uppercase mb-1">Bridge API</div>
                 <div className="text-xs text-green-400 font-mono flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    Ativa (Porta 3001)
                 </div>
              </div>
              <div className="bg-black/40 border border-gray-800 p-3 rounded-2xl">
                 <div className="text-[8px] text-gray-600 font-bold uppercase mb-1">Database Instance</div>
                 <div className="text-xs text-white font-mono truncate">localhost:1435</div>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-black border border-gray-800 rounded-3xl overflow-hidden flex flex-col h-[450px] shadow-2xl shadow-black/50">
        <div className="bg-gray-900/80 px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
             <span className="text-[10px] text-gray-500 font-mono ml-4 uppercase tracking-[0.2em]">System.Telemetry.Stream</span>
          </div>
          <span className="text-[9px] text-cyan-600 font-bold uppercase">{logs.length} Eventos</span>
        </div>
        <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-3 custom-scrollbar bg-[#0d1117]">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-800 opacity-50 space-y-2">
               <Activity size={40} />
               <p className="italic uppercase text-[10px] font-black tracking-widest">Nenhuma atividade detectada na ponte.</p>
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`border-l-2 pl-4 py-1 transition-all hover:bg-white/5 ${
                log.level === 'error' ? 'border-red-500/50' : 
                log.level === 'warn' ? 'border-yellow-500/50' : 
                log.level === 'success' ? 'border-green-500/50' : 'border-cyan-500/50'
              }`}>
                <div className="flex items-center gap-3 mb-0.5">
                  <span className="text-gray-600 text-[10px] font-bold">[{log.timestamp}]</span>
                  <span className={`font-black uppercase tracking-tighter ${getLevelColor(log.level)}`}>{log.level}</span>
                  <span className="text-gray-300 font-bold uppercase tracking-tight">{log.message}</span>
                </div>
                {log.details && <div className="text-[10px] text-gray-600 italic ml-0 pl-0 mt-1 max-w-4xl break-words">{log.details}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Diagnostics;
