import cron from 'node-cron';

const tasks = new Map<string, ReturnType<typeof cron.schedule>>();

export function scheduleTask(name: string, cronExpression: string, task: () => void) {
  if (tasks.has(name)) {
    tasks.get(name)?.stop();
  }

  const scheduledTask = cron.schedule(cronExpression, task, {

    timezone: 'America/Sao_Paulo',
  });

  tasks.set(name, scheduledTask);
  console.log(`Task '${name}' scheduled with expression '${cronExpression}'`);
}

export function stopTask(name: string) {
  if (tasks.has(name)) {
    tasks.get(name)?.stop();
    tasks.delete(name);
    console.log(`Task '${name}' stopped.`);
  }
}

export function getScheduledTasks() {
  return Array.from(tasks.keys());
}
