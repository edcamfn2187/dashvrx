export class LogService {
  private logs: string[] = [];

  constructor() {
    console.log('LogService initialized (server-side)');
  }

  log(message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }

  getLogs(): string[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logService = new LogService();
