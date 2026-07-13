import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function triggerObsidianOverviewUpdate(getVaultPath: () => string | undefined, filePath: string) {
  try {
    const vaultPath = getVaultPath();
    if (!vaultPath) return;
    const scriptPath = path.join(vaultPath, 'tools', 'update_daily_overview.py');
    if (!fs.existsSync(scriptPath)) return;
    const resolvedScriptPath = path.resolve(scriptPath);
    const resolvedVaultPath = path.resolve(vaultPath);
    if (
      resolvedScriptPath !== path.join(resolvedVaultPath, 'tools', 'update_daily_overview.py')
      || !resolvedScriptPath.startsWith(`${resolvedVaultPath}${path.sep}`)
    ) {
      return;
    }
    spawnSync('python', [scriptPath, '--from-hook'], {
      input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: filePath } }),
      cwd: vaultPath,
      encoding: 'utf-8',
      timeout: 10000,
      windowsHide: true,
    });
  } catch {
    // silent failure
  }
}
