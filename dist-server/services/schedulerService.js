import cron from 'node-cron';
const tasks = new Map();
export function scheduleTask(name, cronExpression, task) {
    if (tasks.has(name)) {
        tasks.get(name)?.stop();
    }
    const scheduledTask = cron.schedule(cronExpression, task, {
        timezone: 'America/Sao_Paulo',
    });
    tasks.set(name, scheduledTask);
    console.log(`Task '${name}' scheduled with expression '${cronExpression}'`);
}
export function stopTask(name) {
    if (tasks.has(name)) {
        tasks.get(name)?.stop();
        tasks.delete(name);
        console.log(`Task '${name}' stopped.`);
    }
}
export function getScheduledTasks() {
    return Array.from(tasks.keys());
}
