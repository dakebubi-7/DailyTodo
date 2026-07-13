import fs from 'fs';
import path from 'path';

type SyncPlan = import('../shared/obsidianCompanion').SyncPlan;

export { importMobileInbox } from './obsidianCompanionMobileInbox';
export {
  buildSyncPlan,
  getDateKey,
  getTimeKey,
  matchesRule,
  renderTemplate,
} from './obsidianCompanionPlanning';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function insertIntoSection(existing: string, section: string | undefined, content: string) {
  if (!section) return `${existing.trimEnd()}\n${content}\n`;

  const headingMatch = section.match(/^(#{1,6})\s+(.+)$/);
  if (!headingMatch) {
    return `${existing.trimEnd()}\n\n${section}\n${content}\n`;
  }

  const headingLevel = headingMatch[1].length;
  const headingPattern = new RegExp(`^${escapeRegExp(section)}\\s*$`, 'm');
  const match = headingPattern.exec(existing);

  if (!match) {
    return `${existing.trimEnd()}\n\n${section}\n${content}\n`;
  }

  const afterHeading = match.index + match[0].length;
  const rest = existing.slice(afterHeading);
  const nextHeadingPattern = new RegExp(`\\n#{1,${headingLevel}}\\s+`, 'm');
  const nextHeadingMatch = nextHeadingPattern.exec(rest);
  const insertAt = nextHeadingMatch ? afterHeading + nextHeadingMatch.index : existing.length;
  const before = existing.slice(0, insertAt).trimEnd();
  const after = existing.slice(insertAt);

  return before + '\n' + content + (after.startsWith('\n') ? after : '\n' + after);
}

function replaceManagedBlock(existing: string, ruleId: string, content: string) {
  const start = `<!-- DAILYTODO:START ${ruleId} -->`;
  const end = `<!-- DAILYTODO:END ${ruleId} -->`;
  const block = `${start}\n${content}\n${end}`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  return pattern.test(existing) ? existing.replace(pattern, block) : `${existing.trimEnd()}\n\n${block}\n`;
}

function isPathInsideRoot(rootPath: string, filePath: string) {
  const root = path.resolve(rootPath);
  const resolved = path.resolve(filePath);
  const relative = path.relative(root, resolved);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export function writeSyncPlan(plan: SyncPlan) {
  if (!plan.ok) return { ok: false, errors: plan.errors };

  const errors: string[] = [];
  if (!plan.vaultPath) {
    return { ok: false, errors: ['Sync plan vault path is missing.'] };
  }

  const pathErrors = plan.changes.flatMap((change) => {
    if (!isPathInsideRoot(plan.vaultPath!, change.filePath)) {
      return [`Sync plan change escapes the selected vault: ${change.filePath}`];
    }

    if (fs.existsSync(change.filePath) && !fs.statSync(change.filePath).isFile()) {
      return [`Sync plan target must be a file: ${change.filePath}`];
    }

    return [];
  });

  if (pathErrors.length > 0) {
    return { ok: false, errors: pathErrors };
  }

  for (const change of plan.changes) {
    try {
      if (!isPathInsideRoot(plan.vaultPath, change.filePath)) {
        throw new Error(`Sync plan change escapes the selected vault: ${change.filePath}`);
      }
      if (fs.existsSync(change.filePath) && !fs.statSync(change.filePath).isFile()) {
        throw new Error(`Sync plan target must be a file: ${change.filePath}`);
      }
      fs.mkdirSync(path.dirname(change.filePath), { recursive: true });
      const existing = fs.existsSync(change.filePath) ? fs.readFileSync(change.filePath, 'utf-8') : '';
      const next =
        change.mode === 'managed-block'
          ? replaceManagedBlock(existing, change.ruleId, change.content)
          : insertIntoSection(existing, change.section, change.content);
      if (next !== existing) {
        fs.writeFileSync(change.filePath, next, 'utf-8');
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return { ok: errors.length === 0, errors };
}
