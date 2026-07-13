import type { Task } from '../types/task';
import { isObjectRecord } from '../../shared/unknownValueGuards';

export type TaskMenuActionPayload = {
  taskId: string;
  updates: Partial<Task> & {
    __action?: 'edit' | 'delete' | 'addSubtask';
    text?: string;
  };
};

export type EditRequest = { id: string; nonce: number };

export type ParsedTaskMenuAction =
  | { kind: 'noop' }
  | { kind: 'addSubtask'; taskId: string; text: string }
  | { kind: 'delete'; taskId: string }
  | { kind: 'edit'; taskId: string }
  | { kind: 'update'; taskId: string; updates: Partial<Task> };

function isTaskMenuActionPayload(payload: unknown): payload is TaskMenuActionPayload {
  if (!isObjectRecord(payload)) return false;
  const record = payload;
  const updates = record.updates;
  return Boolean(
    typeof record.taskId === 'string' && record.taskId.trim() &&
    isObjectRecord(updates)
  );
}

export function parseTaskMenuAction(payload: unknown): ParsedTaskMenuAction {
  if (!isTaskMenuActionPayload(payload)) {
    return { kind: 'noop' };
  }

  const { taskId, updates } = payload;
  const action = updates.__action;

  if (action === 'addSubtask') {
    return { kind: 'addSubtask', taskId, text: String(updates.text || '') };
  }

  if (action === 'delete') {
    return { kind: 'delete', taskId };
  }

  if (action === 'edit') {
    return { kind: 'edit', taskId };
  }

  return { kind: 'update', taskId, updates };
}


export type TaskMenuActionHandlers = {
  addSubtask: (taskId: string, text: string) => void;
  deleteTask: (taskId: string) => void;
  setEditRequest: (updater: (prev: EditRequest | null) => EditRequest) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
};

export function applyParsedTaskMenuAction(
  action: ParsedTaskMenuAction,
  handlers: TaskMenuActionHandlers,
): void {
  if (action.kind === 'noop') {
    return;
  }

  if (action.kind === 'addSubtask') {
    handlers.addSubtask(action.taskId, action.text);
    return;
  }

  if (action.kind === 'delete') {
    handlers.deleteTask(action.taskId);
    return;
  }

  if (action.kind === 'edit') {
    handlers.setEditRequest((prev) => createEditRequest(prev, action.taskId));
    return;
  }

  handlers.updateTask(action.taskId, action.updates);
}

export function createEditRequest(prev: EditRequest | null, taskId: string): EditRequest {
  return { id: taskId, nonce: (prev?.nonce || 0) + 1 };
}


export type TaskMenuElectronApi = {
  onTaskMenuAction?: (handler: (payload: unknown) => void) => (() => void) | undefined;
};

export function registerTaskMenuActionListener(
  electronAPI: TaskMenuElectronApi | undefined,
  handlers: TaskMenuActionHandlers,
): (() => void) | undefined {
  return electronAPI?.onTaskMenuAction?.((payload) => {
    applyParsedTaskMenuAction(parseTaskMenuAction(payload), handlers);
  });
}
