import fs from 'fs';
import path from 'path';
import { isObjectRecord } from './unknownValueGuards';

type CaptureItem = import('../shared/obsidianCompanion').CaptureItem;
type CaptureType = import('../shared/obsidianCompanion').CaptureType;

function getUniqueDestination(directory: string, fileName: string, reservedDestinations = new Set<string>()) {
  const parsed = path.parse(fileName);
  let candidate = path.join(directory, fileName);
  let index = 1;

  while (reservedDestinations.has(candidate) || fs.existsSync(candidate)) {
    candidate = path.join(directory, `${parsed.name}-${Date.now()}-${index}${parsed.ext}`);
    index += 1;
  }

  return candidate;
}

function isAlreadyExistsError(error: unknown) {
  return isObjectRecord(error) && error.code === 'EEXIST';
}

function reserveFilePath(filePath: string) {
  const descriptor = fs.openSync(filePath, 'wx');
  try {
    fs.closeSync(descriptor);
  } catch (error) {
    try {
      fs.rmSync(filePath, { force: true });
    } catch (cleanupError) {
      const closeMessage = error instanceof Error ? error.message : String(error);
      const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
      throw new Error(`${closeMessage}; reservation cleanup failed: ${cleanupMessage}`);
    }
    throw error;
  }
}

function moveToUniqueDestination(sourcePath: string, directory: string, fileName: string) {
  const reservedDestinations = new Set<string>();

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const destination = getUniqueDestination(directory, fileName, reservedDestinations);

    try {
      reserveFilePath(destination);
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        reservedDestinations.add(destination);
        continue;
      }

      throw error;
    }

    try {
      fs.renameSync(sourcePath, destination);
      return destination;
    } catch (error) {
      try {
        fs.rmSync(destination, { force: true });
      } catch (cleanupError) {
        const moveMessage = error instanceof Error ? error.message : String(error);
        const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        throw new Error(`${moveMessage}; reservation cleanup failed: ${cleanupMessage}`);
      }
      throw error;
    }
  }

  throw new Error(`Could not find a unique mobile inbox destination for ${fileName}`);
}

function normalizeCaptureType(value: unknown): CaptureType {
  return value === 'task' || value === 'work' || value === 'note' || value === 'inspiration' ? value : 'inspiration';
}

function ensureMobileInboxDirectory(directory: string, label: string) {
  try {
    if (fs.existsSync(directory)) {
      return fs.statSync(directory).isDirectory() ? null : `Mobile inbox ${label} path must be a directory: ${directory}`;
    }

    fs.mkdirSync(directory, { recursive: true });
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export function importMobileInbox(inboxPath: unknown): { ok: boolean; items: CaptureItem[]; errors: string[] } {
  if (typeof inboxPath !== 'string') {
    return { ok: false, items: [], errors: ['Mobile inbox path must be a string.'] };
  }
  if (!inboxPath || !fs.existsSync(inboxPath)) {
    return { ok: false, items: [], errors: ['Mobile inbox path does not exist.'] };
  }

  try {
    if (!fs.statSync(inboxPath).isDirectory()) {
      return { ok: false, items: [], errors: ['Mobile inbox path must be a directory.'] };
    }
  } catch (error) {
    return { ok: false, items: [], errors: [error instanceof Error ? error.message : String(error)] };
  }

  const processed = path.join(inboxPath, '_processed');
  const failed = path.join(inboxPath, '_failed');
  const setupErrors = [
    ensureMobileInboxDirectory(processed, '_processed'),
    ensureMobileInboxDirectory(failed, '_failed'),
  ].filter((error): error is string => Boolean(error));

  if (setupErrors.length > 0) {
    return { ok: false, items: [], errors: setupErrors };
  }

  const items: CaptureItem[] = [];
  const errors: string[] = [];
  let files: string[];
  try {
    files = fs
      .readdirSync(inboxPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && ['.md', '.txt', '.json'].includes(path.extname(entry.name).toLowerCase()))
      .map((entry) => entry.name);
  } catch (error) {
    return { ok: false, items: [], errors: [error instanceof Error ? error.message : String(error)] };
  }

  for (const file of files) {
    const filePath = path.join(inboxPath, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const ext = path.extname(file).toLowerCase();
      const parsed: unknown = ext === '.json' ? JSON.parse(raw) : { content: raw, type: 'inspiration', tags: [] };
      if (!isObjectRecord(parsed)) {
        throw new Error(`Mobile inbox JSON capture must be an object: ${file}`);
      }
      const content = String(parsed.content ?? (ext === '.json' ? '' : raw)).trim();

      if (!content) {
        throw new Error(`Mobile inbox capture is missing content: ${file}`);
      }

      const item: CaptureItem = {
        id: `mobile-${Date.now()}-${items.length}`,
        type: normalizeCaptureType(parsed.type),
        content,
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
        priority: parsed.priority === 'high' || parsed.priority === 'medium' || parsed.priority === 'low' ? parsed.priority : undefined,
        source: 'mobile-inbox',
        status: 'new',
        createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
        metadata: { fileName: file },
      };

      moveToUniqueDestination(filePath, processed, file);
      items.push(item);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      try {
        moveToUniqueDestination(filePath, failed, file);
      } catch (moveError) {
        errors.push(moveError instanceof Error ? moveError.message : String(moveError));
      }
    }
  }

  return { ok: errors.length === 0, items, errors };
}
