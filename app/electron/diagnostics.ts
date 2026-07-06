import { app, crashReporter } from 'electron';
import fs from 'fs';
import path from 'path';

export function getDiagnosticLogPath(): string {
  try {
    return path.join(app.getPath('userData'), 'diag.log');
  } catch {
    return path.join(process.env.APPDATA || process.cwd(), 'daily-todo-diag.log');
  }
}

export function createDiagLogger(logPath = getDiagnosticLogPath()): (message: string) => void {
  return (message: string) => {
    try {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`, 'utf-8');
    } catch {}
  };
}

export function startCrashDiagnostics(diag: (message: string) => void): void {
  try {
    crashReporter.start({ submitURL: '', uploadToServer: false, compress: false });
  } catch (error) {
    diag(`crashReporter.start failed: ${String(error)}`);
  }

  process.on('uncaughtException', (error) => {
    diag(`uncaughtException: ${error?.stack || String(error)}`);
  });
  process.on('unhandledRejection', (reason) => {
    diag(`unhandledRejection: ${String(reason)}`);
  });
}
