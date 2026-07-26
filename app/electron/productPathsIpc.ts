import { ipcMain } from 'electron';

type ProductPathsServiceLike = {
  exportSupportBundle(targetPath: string): string;
};

type RegisterProductPathsIpcHandlersOptions = {
  productPaths: ProductPathsServiceLike;
  chooseSupportBundleFile(): Promise<string | undefined>;
  openDiagnosticsDirectory(): Promise<string>;
};

export function registerProductPathsIpcHandlers({
  productPaths,
  chooseSupportBundleFile,
  openDiagnosticsDirectory,
}: RegisterProductPathsIpcHandlersOptions): void {
  ipcMain.handle('support:openDiagnosticsFolder', async () => {
    const error = await openDiagnosticsDirectory();
    return error ? { ok: false, error: 'DailyTodo could not open the diagnostics folder.' } : { ok: true };
  });

  ipcMain.handle('support:exportBundle', async () => {
    const targetPath = await chooseSupportBundleFile();
    if (!targetPath) return { ok: false };
    try {
      productPaths.exportSupportBundle(targetPath);
      return { ok: true };
    } catch {
      return { ok: false, error: 'DailyTodo could not export the support bundle.' };
    }
  });
}
