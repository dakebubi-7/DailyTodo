import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const useTasksPath = join(root, 'src/hooks/useTasks.ts');
const carryoverPath = join(root, 'src/hooks/taskCarryover.ts');
const packageJsonPath = join(root, 'package.json');

assert.ok(existsSync(useTasksPath), 'useTasks should exist for native task ID verification.');
assert.ok(existsSync(carryoverPath), 'taskCarryover should exist for native task ID verification.');
assert.ok(existsSync(packageJsonPath), 'package.json should exist for native task ID verification.');

const useTasks = readFileSync(useTasksPath, 'utf8');
const carryover = readFileSync(carryoverPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

assert.doesNotMatch(useTasks, /from 'uuid'/, 'useTasks should not add uuid to the renderer startup dependency graph.');
assert.doesNotMatch(carryover, /from 'uuid'/, 'task carryover should not add uuid to the renderer startup dependency graph.');
assert.match(useTasks, /crypto\.randomUUID\(\)/, 'useTasks should create task and review IDs with the native UUID generator.');
assert.match(carryover, /crypto\.randomUUID\(\)/, 'task carryover should create inherited task IDs with the native UUID generator.');
assert.equal(packageJson.dependencies?.uuid, undefined, 'uuid should not remain as an unused production dependency.');
assert.equal(packageJson.devDependencies?.['@types/uuid'], undefined, '@types/uuid should not remain after removing uuid.');

console.log('Native task ID verification passed');
