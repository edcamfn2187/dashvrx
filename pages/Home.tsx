
import React, { useState } from 'react';
import { Home as HomeIcon, Lock, ChevronDown, ChevronRight, FileText, Calendar } from 'lucide-react';
import ISHLogo from '../components/ISHLogo';

interface HomeProps {
  data: any;
  isPdfMode?: boolean;
}

const Home: React.FC<HomeProps> = ({ data, isPdfMode = false }) => {
  const [isDeclOpen, setIsDeclOpen] = useState(true);

  if (!data) return null;

  // Fallback visual caso o cliente não esteja preenchido
  const clientName = data.client || "CLIENTE NÃO DEFINIDO";

  return (
    <div className={`animate-fadeIn ${isPdfMode ? 'h-full p-8 box-border flex flex-col justify-between overflow-hidden' : 'space-y-8 max-w-[1600px] mx-auto w-full'}`}>
      {/* Header Section - Logo and Title */}
      <div className={`flex justify-between items-start ${isPdfMode ? 'mb-6' : 'mb-12'}`}>
        <ISHLogo size="lg" className="rounded-3xl shadow-xl" />
        <div className="text-right">
          <h1 className="text-3xl font-bold text-white tracking-tight">Relatório Mensal - Vicarius vRx</h1>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Análise de Segurança - MSS Application Security</p>
        </div>
      </div>

      <div className={`space-y-2 ${isPdfMode ? 'mt-4' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-500">
            <HomeIcon size={24} />
          </div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Informações do Documento</h2>
        </div>
        <div className="gradient-bar w-full h-[2px] rounded-full mt-1"></div>
      </div>

      {/* Metadata Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-3 ${isPdfMode ? 'gap-6 mt-4' : 'gap-12 mt-8'}`}>
        {/* Column 1: Informações */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-cyan-400 border-b border-gray-800 pb-2">
            <FileText size={20} />
            <h3 className="text-lg font-bold">Informações</h3>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Cliente Solicitante</span>
              <span className="text-lg font-bold text-white uppercase break-all">{clientName}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Período de Análise</span>
              <span className="text-lg font-bold text-cyan-500 uppercase">{data.month}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Versão do Documento</span>
              <span className="text-sm font-mono text-gray-400">{data.version}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Metadados */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-cyan-400 border-b border-gray-800 pb-2">
            <Calendar size={20} />
            <h3 className="text-lg font-bold">Metadados</h3>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Data de Emissão</span>
              <span className="text-sm font-bold text-white">{data.generationDate}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Responsável Operacional</span>
              <span className="text-sm font-bold text-white uppercase">{data.owner}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Classificação</span>
              <span className="text-xs font-bold text-white uppercase bg-gray-800 w-fit px-2 py-1 rounded">{data.classification}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Confidencialidade */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-cyan-400 border-b border-gray-800 pb-2">
            <Lock size={20} />
            <h3 className="text-lg font-bold">Confidencialidade</h3>
          </div>
          <div className="bg-cyan-500/5 border border-cyan-500/10 p-5 rounded-3xl space-y-3">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Este documento contém informações sensíveis de infraestrutura e vulnerabilidades exclusivas da unidade <span className="font-bold text-white">[{clientName}]</span>.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-cyan-500 font-bold uppercase tracking-tighter">
              <Lock size={12} /> Protegido por ISO 27001
            </div>
          </div>
        </div>
      </div>

      {/* Full Confidentiality Accordion Section */}
      <div className="mt-12 border border-gray-800 bg-[#111827]/20 rounded-3xl overflow-hidden">
        <button
          onClick={() => setIsDeclOpen(!isDeclOpen)}
          className="w-full flex items-center gap-2 p-3 hover:bg-gray-800/30 transition-colors"
        >
          {isDeclOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
            <span role="img" aria-label="doc">📔</span> Declaração Completa de Confidencialidade
          </span>
        </button>

        {isDeclOpen && (
          <div className="p-4 pt-0 animate-slideDown">
            <div className={`bg-[#0f172a] border border-cyan-900/30 ${isPdfMode ? 'p-5 space-y-3' : 'p-8 space-y-5'} rounded-3xl border-l-4 border-l-cyan-500`}>
              <h4 className={`text-cyan-400 font-bold ${isPdfMode ? 'text-xs' : 'text-sm'}`}>Este documento é de propriedade exclusiva da {clientName}.</h4>
              <div className={`space-y-2 ${isPdfMode ? 'text-[9px]' : 'text-[11px]'} text-cyan-100/70 leading-relaxed font-medium`}>
                <p>
                  É vedada a sua divulgação ou cópia, parcial ou total, por quaisquer meios ou métodos, sem a prévia autorização por escrita da {clientName}.
                </p>
                <p>
                  Com relação à metodologia de trabalho e ao formato deste documento, o conteúdo não poderá ser utilizado ou revelado por quaisquer meios ou métodos para terceiros, principalmente em se tratando de empresas concorrentes da ISH Tecnologia, sem prévia autorização por escrito da ISH Tecnologia.
                </p>
                <p>
                  Nomes de empresas e serviços referidos neste documento podem ser marcas registradas, reconhecidas mediante esta declaração.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
