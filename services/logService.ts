
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: string;
}

class LogService {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private storageKey = 'cybersec_system_logs';

  constructor() {
    // Recupera logs da sessão anterior se existirem
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const saved = sessionStorage.getItem(this.storageKey);
      if (saved) {
        try {
          this.logs = JSON.parse(saved);
        } catch (e) {
          this.logs = [];
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    }
  }

  addLog(level: LogEntry['level'], message: string, details?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details
    };
    
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) this.logs.pop();
    
    this.saveToStorage();
    
    // Dispara evento global
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('system_log_added', { detail: entry }));
    }
    
    // Log no console para desenvolvedores
    const styles = {
      success: 'color: #4ade80; font-weight: bold',
      error: 'color: #f87171; font-weight: bold',
      warn: 'color: #fbbf24; font-weight: bold',
      info: 'color: #22d3ee; font-weight: bold'
    };
    
    console.log(`%c[${entry.timestamp}] [${level.toUpperCase()}] ${message}`, styles[level], details || '');
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(this.storageKey);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('system_log_added'));
    }
  }

  downloadLogs() {
    const content = this.logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message} ${l.details || ''}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_logs_${new Date().toISOString()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const logService = new LogService();
