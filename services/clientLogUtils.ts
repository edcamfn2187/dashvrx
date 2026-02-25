import { LogEntry } from './logService.js';

export const downloadLogs = (logs: LogEntry[]) => {
  const text = logs
    .map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message} ${l.details || ''}`)
    .join('\n');
  
  if (typeof document !== 'undefined') {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cybersec_logs_${new Date().toISOString().split('T')[0]}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
