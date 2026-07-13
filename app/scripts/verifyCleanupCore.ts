import assert from 'node:assert/strict';
import { cleanupCoreCommands } from './verify-cleanup-core';

export function readCleanupCoreCommands(): string[] {
  return cleanupCoreCommands;
}

export function assertCleanupCoreIncludes(command: string, message: string): void {
  assert.ok(readCleanupCoreCommands().includes(command), message);
}
