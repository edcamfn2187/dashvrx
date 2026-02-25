export class LogService {
    logs = [];
    constructor() {
        console.log('LogService initialized (server-side)');
    }
    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        this.logs.push(logEntry);
        console.log(logEntry);
    }
    getLogs() {
        return this.logs;
    }
    clearLogs() {
        this.logs = [];
    }
}
export const logService = new LogService();
