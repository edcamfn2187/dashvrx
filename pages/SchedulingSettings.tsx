import React, { useState, useEffect } from 'react';
import { Play, Save, Loader2, Calendar, Clock, Mail, Users, Send, Plus, Trash2, Edit3, X } from 'lucide-react';

interface ScheduleConfig {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  day: number;
  time: string;
  recipients: string;
  isEnabled: boolean;
  client: string;
}

const weekDays = [
  { value: 1, label: 'Domingo' },
  { value: 2, label: 'Segunda-feira' },
  { value: 3, label: 'Terça-feira' },
  { value: 4, label: 'Quarta-feira' },
  { value: 5, label: 'Quinta-feira' },
  { value: 6, label: 'Sexta-feira' },
  { value: 7, label: 'Sábado' },
];

const SchedulingSettings: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isTriggering, setIsTriggering] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleConfig>({
    id: '',
    frequency: 'daily',
    day: 1,
    time: '09:00',
    recipients: '',
    isEnabled: true,
    client: ''
  });

  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: '25',
    from: '',
    user: '',
    pass: '',
    secure: false
  });
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);

  useEffect(() => {
    fetch('/api/schedule')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSchedules(data);
        } else {
          setSchedules([]);
        }
      });

    fetch('/api/clients')
      .then(res => res.json())
      .then(data => setClients(data));

    fetch('/api/config/smtp_config')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setSmtpConfig(data);
        }
      })
      .catch(err => console.error('Error fetching SMTP config:', err));
  }, []);

  const handleSaveSmtp = async () => {
    setIsSavingSmtp(true);
    try {
      await fetch('/api/config/smtp_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfig),
      });
      alert('Configurações de SMTP salvas com sucesso!');
    } catch (error) {
      alert('Erro ao salvar configurações de SMTP.');
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleSaveAll = async (updatedSchedules: ScheduleConfig[]) => {
    setIsSaving(true);
    try {
      await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSchedules),
      });
      setSchedules(updatedSchedules);
      // alert('Agendamentos salvos com sucesso!');
    } catch (error) {
      alert('Erro ao salvar os agendamentos.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveForm = () => {
    if (!form.client) {
      alert('Selecione um cliente.');
      return;
    }

    let updatedSchedules;
    if (editingId) {
      updatedSchedules = schedules.map(s => s.id === editingId ? form : s);
    } else {
      updatedSchedules = [...schedules, { ...form, id: `sch-${Date.now()}` }];
    }

    handleSaveAll(updatedSchedules);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      const updatedSchedules = schedules.filter(s => s.id !== id);
      handleSaveAll(updatedSchedules);
    }
  };

  const handleEdit = (schedule: ScheduleConfig) => {
    setForm(schedule);
    setEditingId(schedule.id);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setForm({
      id: '',
      frequency: 'daily',
      day: 1,
      time: '09:00',
      recipients: '',
      isEnabled: true,
      client: clients.length > 0 ? clients[0] : ''
    });
    setEditingId(null);
    setIsEditing(true);
  };

  const handleTrigger = async (schedule: ScheduleConfig) => {
    setIsTriggering(schedule.id);
    try {
      await fetch('/api/schedule/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: schedule.id })
      });
      alert('Geração do relatório iniciada! O e-mail será enviado em breve.');
    } catch (error) {
      alert('Erro ao iniciar a geração do relatório.');
    } finally {
      setIsTriggering(null);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) return;
    setIsSendingTest(true);
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject: 'Teste de Envio de E-mail - Vicarius vRx',
          body: '<p>Este é um e-mail de teste para verificar as configurações do servidor SMTP.</p>'
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('E-mail de teste enviado com sucesso!');
      } else {
        alert(`Erro ao enviar e-mail de teste: ${data.message || 'Erro desconhecido'}`);
      }
    } catch (error: any) {
      alert(`Erro ao enviar e-mail de teste: ${error.message || 'Erro de conexão'}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-8 animate-fadeIn">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">Agendamento de Relatórios</h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Gerencie o envio automático de relatórios por e-mail.</p>
        </div>
        {!isEditing && (
          <button onClick={handleAddNew} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase shadow-xl transition-all">
            <Plus size={16} /> Novo Agendamento
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-[#111827] border border-gray-800 rounded-3xl p-8 space-y-8 shadow-2xl animate-slideDown">
          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <h4 className="text-sm font-black text-cyan-400 uppercase tracking-widest">{editingId ? 'Editar Agendamento' : 'Novo Agendamento'}</h4>
            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Users size={14} /> Cliente</label>
              <select value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none">
                <option value="">Selecione um cliente</option>
                {clients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Calendar size={14} /> Frequência</label>
              <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value as any, day: 1 })} className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none">
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Clock size={14} /> Horário</label>
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none" />
            </div>
            {form.frequency === 'weekly' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Calendar size={14} /> Dia da Semana</label>
                <select value={form.day} onChange={e => setForm({ ...form, day: parseInt(e.target.value) })} className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none">
                  {weekDays.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            )}
            {form.frequency === 'monthly' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Calendar size={14} /> Dia do Mês</label>
                <input type="number" min="1" max="31" value={form.day} onChange={e => setForm({ ...form, day: parseInt(e.target.value) })} className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Mail size={14} /> Destinatários</label>
            <textarea value={form.recipients} onChange={e => setForm({ ...form, recipients: e.target.value })} className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none h-24" placeholder="Separar e-mails por vírgula" />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-white">Status do Agendamento</label>
            <button onClick={() => setForm({ ...form, isEnabled: !form.isEnabled })} className={`px-4 py-2 rounded-full text-xs font-bold ${form.isEnabled ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
              {form.isEnabled ? 'ATIVO' : 'INATIVO'}
            </button>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-800 pt-6">
            <button onClick={() => setIsEditing(false)} className="px-6 py-2 text-xs font-black text-gray-500 uppercase">Cancelar</button>
            <button onClick={handleSaveForm} disabled={isSaving} className="px-10 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase shadow-xl transition-all flex items-center gap-2">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map(schedule => (
            <div key={schedule.id} className={`bg-[#111827] border ${schedule.isEnabled ? 'border-gray-800' : 'border-red-900/30'} rounded-3xl p-6 flex flex-col justify-between group hover:border-cyan-500/50 transition-all shadow-xl relative overflow-hidden`}>
              {!schedule.isEnabled && <div className="absolute top-0 right-0 bg-red-900/50 text-red-200 text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase">Inativo</div>}

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-500">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">{schedule.client}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">
                      {schedule.frequency === 'daily' ? 'Diário' : schedule.frequency === 'weekly' ? 'Semanal' : 'Mensal'} • {schedule.time}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail size={12} />
                    <span className="text-[10px] truncate">{schedule.recipients.split(',')[0]} {schedule.recipients.split(',').length > 1 ? `+${schedule.recipients.split(',').length - 1}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock size={12} />
                    <span className="text-[10px]">
                      {schedule.frequency === 'weekly' ? weekDays.find(d => d.value === schedule.day)?.label : schedule.frequency === 'monthly' ? `Dia ${schedule.day}` : 'Todos os dias'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-800/50">
                <button onClick={() => handleEdit(schedule)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2">
                  <Edit3 size={12} /> Editar
                </button>
                <button onClick={() => handleDelete(schedule.id)} className="p-2 bg-gray-800 hover:bg-red-900/50 text-gray-500 hover:text-red-400 rounded-lg transition-all">
                  <Trash2 size={14} />
                </button>
                <button onClick={() => handleTrigger(schedule)} disabled={isTriggering === schedule.id} className="p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-all">
                  {isTriggering === schedule.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                </button>
              </div>
            </div>
          ))}

          {schedules.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-600 border border-gray-800 border-dashed rounded-3xl">
              <Calendar size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase">Nenhum agendamento configurado</p>
              <button onClick={handleAddNew} className="mt-4 text-cyan-500 text-xs font-black uppercase hover:underline">Criar o primeiro</button>
            </div>
          )}
        </div>
      )}

      <div className="bg-[#111827] border border-gray-800 rounded-3xl p-8 space-y-6 shadow-2xl mt-12">
        <div>
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">Configurações de SMTP</h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Configure o servidor de e-mail para envio dos relatórios.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase">Servidor SMTP</label>
            <input
              type="text"
              value={smtpConfig.host}
              onChange={e => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
              placeholder="ex: smtp.gmail.com"
              className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase">Porta</label>
            <input
              type="text"
              value={smtpConfig.port}
              onChange={e => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
              placeholder="ex: 587"
              className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase">E-mail de Envio (From)</label>
            <input
              type="email"
              value={smtpConfig.from}
              onChange={e => setSmtpConfig({ ...smtpConfig, from: e.target.value })}
              placeholder="relatorios@empresa.com.br"
              className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase">Usuário (Opcional)</label>
            <input
              type="text"
              value={smtpConfig.user}
              onChange={e => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
              className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase">Senha (Opcional)</label>
            <input
              type="password"
              value={smtpConfig.pass}
              onChange={e => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
              className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-white">Usar SSL/TLS (Secure)</label>
            <button
              onClick={() => setSmtpConfig({ ...smtpConfig, secure: !smtpConfig.secure })}
              className={`w-12 h-6 rounded-full transition-all relative ${smtpConfig.secure ? 'bg-cyan-600' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${smtpConfig.secure ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
          <button
            onClick={handleSaveSmtp}
            disabled={isSavingSmtp}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase shadow-xl transition-all"
          >
            {isSavingSmtp ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Configurações
          </button>
        </div>
      </div>

      <div className="bg-[#111827] border border-gray-800 rounded-3xl p-8 space-y-6 shadow-2xl">
        <div>
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">Testar Envio de E-mail</h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Verifique se suas configurações de SMTP estão corretas.</p>
        </div>
        <div className="flex gap-4">
          <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="Digite o e-mail de destino" className="flex-1 bg-black border border-gray-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none" />
          <button onClick={handleSendTestEmail} disabled={isSendingTest} className="flex items-center gap-2 bg-purple-600/20 border border-purple-600/50 text-purple-400 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-purple-600/30 transition-all">
            {isSendingTest ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Enviar Teste
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchedulingSettings;
