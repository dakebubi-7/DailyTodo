import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';
import { createAppStateAccessors } from '../electron/appStateAccessors';
import { createDefaultAiReviewSettings } from '../shared/aiReview/aiReviewSettings';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/appStateAccessors.ts');
const vaultAccessorsPath = join(root, 'electron/obsidianVaultAccessors.ts');
const mainPath = join(root, 'electron/main.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron app state accessors module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const vaultAccessors = readFileSync(vaultAccessorsPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function createAppStateAccessors\b/, 'App state accessors module should export createAppStateAccessors.');
assert.match(helper, /type CreateAppStateAccessorsOptions\b/, 'App state accessors module should define explicit creation dependencies.');
assert.match(helper, /const AI_REVIEW_SECTIONS_KEY = 'aiReviewSections'/, 'App state accessors module should own the AI review sections store key.');

for (const symbol of [
  'normalizeCompanionSettings',
  'normalizeAppSettings',
  'normalizeObsidianTemplateSettings',
  'normalizeAiReviewSettings',
  'normalizeSections',
  'resolveActiveProfile',
  'callChatCompletion',
]) {
  const pattern = new RegExp(`\\b${symbol}\\b`);
  assert.match(helper, pattern, `App state accessors module should own ${symbol} wiring.`);
}

for (const fn of [
  'getCompanionSettings',
  'setCompanionSettings',
  'getAppSettings',
  'setAppSettings',
  'getObsidianTemplateSettings',
  'setObsidianTemplateSettings',
  'getAiReviewSettings',
  'setAiReviewSettings',
  'getReviewSections',
  'setReviewSections',
  'buildDailySourceRules',
  'getDailySourceRules',
  'getLlmCaller',
]) {
  const pattern = new RegExp(`function ${fn}\\b`);
  assert.match(helper, pattern, `App state accessors module should define ${fn}.`);
}

assert.match(helper, /from '\.\/obsidianVaultAccessors'/, 'App state accessors should compose focused Vault accessors.');
assert.match(helper, /createObsidianVaultAccessors\(\{[\s\S]*store,[\s\S]*isDevelopmentBuild,[\s\S]*devObsidianPath,[\s\S]*zh,[\s\S]*\}\)/, 'App state accessors should supply shared dependencies to the Vault accessors.');
for (const fn of ['getDefaultVaultPath', 'getVaultPath', 'getVaultStatus']) {
  const pattern = new RegExp(`function ${fn}\\b`);
  assert.match(vaultAccessors, pattern, `Focused Vault accessors should define ${fn}.`);
  assert.doesNotMatch(helper, pattern, `App state accessors should not retain ${fn} inline.`);
}

assert.match(helper, /return \{[\s\S]*getDefaultVaultPath,[\s\S]*getLlmCaller,[\s\S]*\}/, 'App state accessors module should return the full accessor set.');

const aiReviewSettings = createDefaultAiReviewSettings();
let aiReviewSettingsWrites = 0;
const aiReviewSettingsAccessors = createAppStateAccessors({
  store: {
    get: (key: string) => (key === 'aiReviewSettings' ? aiReviewSettings : undefined),
    set: (key: string) => {
      if (key === 'aiReviewSettings') aiReviewSettingsWrites += 1;
    },
  },
  isDevelopmentBuild: () => false,
  devObsidianPath: '',
  zh: (text) => text,
});
aiReviewSettingsAccessors.setAiReviewSettings(aiReviewSettings);
assert.equal(
  aiReviewSettingsWrites,
  0,
  'setAiReviewSettings should skip redundant store writes when normalized values are unchanged.',
);

for (const [key, setterName] of [
  ['obsidianCompanionSettings', 'setCompanionSettings'],
  ['appSettings', 'setAppSettings'],
  ['obsidianTemplateSettings', 'setObsidianTemplateSettings'],
  ['aiReviewSections', 'setReviewSections'],
] as const) {
  let writes = 0;
  let storedValue: unknown;
  const accessors = createAppStateAccessors({
    store: {
      get: (storedKey: string) => (storedKey === key ? storedValue : undefined),
      set: (storedKey: string, value: unknown) => {
        if (storedKey === key) {
          writes += 1;
          storedValue = value;
        }
      },
    },
    isDevelopmentBuild: () => false,
    devObsidianPath: '',
    zh: (text) => text,
  });
  const value = accessors[setterName === 'setCompanionSettings' ? 'getCompanionSettings'
    : setterName === 'setAppSettings' ? 'getAppSettings'
      : setterName === 'setObsidianTemplateSettings' ? 'getObsidianTemplateSettings' : 'getReviewSections']();
  storedValue = value;
  accessors[setterName](value as never);
  assert.equal(writes, 0, `${setterName} should skip redundant normalized store writes.`);
}

const fileBackedVaultRoot = mkdtempSync(join(tmpdir(), 'dailytodo-file-backed-vault-'));
const fileBackedVaultPath = join(fileBackedVaultRoot, 'not-a-vault-directory');
writeFileSync(fileBackedVaultPath, 'not a directory', 'utf8');
const fileBackedVaultAccessors = createAppStateAccessors({
  store: {
    get: (key: string) => (key === 'obsidianVaultPath' ? fileBackedVaultPath : undefined),
    set: () => {},
  },
  isDevelopmentBuild: () => false,
  devObsidianPath: '',
  zh: (text) => `directory required: ${text}`,
});
const fileBackedVaultStatus = fileBackedVaultAccessors.getVaultStatus();
assert.equal(fileBackedVaultStatus.ok, false, 'Vault status should reject paths that point to files.');
assert.match(
  fileBackedVaultStatus.reason ?? '',
  /directory|folder/i,
  'file-backed vault status should explain that a folder/directory is required.',
);

const malformedStoredVaultAccessors = createAppStateAccessors({
  store: {
    get: (key: string) => (key === 'obsidianVaultPath' ? { path: fileBackedVaultPath } : undefined),
    set: () => {},
  },
  isDevelopmentBuild: () => false,
  devObsidianPath: '',
  zh: (text) => text,
});
let malformedStoredVaultThrew = false;
let malformedStoredVaultStatus: ReturnType<typeof malformedStoredVaultAccessors.getVaultStatus> | undefined;
try {
  malformedStoredVaultStatus = malformedStoredVaultAccessors.getVaultStatus();
} catch {
  malformedStoredVaultThrew = true;
}
assert.equal(
  malformedStoredVaultThrew,
  false,
  'Vault status should not throw when the stored Obsidian path is malformed/non-string.',
);
assert.equal(
  malformedStoredVaultAccessors.getVaultPath(),
  '',
  'Malformed stored Obsidian paths should not be returned as active vault paths.',
);
assert.equal(
  malformedStoredVaultStatus?.ok,
  false,
  'Malformed stored Obsidian paths should be treated as no usable vault path.',
);

const malformedCompanionAccessors = createAppStateAccessors({
  store: {
    get: (key: string) => {
      if (key === 'obsidianCompanionSettings') {
        return {
          vaultPath: 123,
          mobileInboxPath: { path: 'bad' },
          presetId: null,
          syncMode: 'bad-mode',
          previewBeforeWrite: 'yes',
          rules: 'not-rules',
          templates: null,
        };
      }
      return undefined;
    },
    set: () => {},
  },
  isDevelopmentBuild: () => false,
  devObsidianPath: '',
  zh: (text) => text,
});
const malformedCompanionSettings = malformedCompanionAccessors.getCompanionSettings();
assert.equal(
  typeof malformedCompanionSettings.vaultPath,
  'string',
  'Malformed Companion vault paths should be normalized to a string.',
);
assert.equal(
  typeof malformedCompanionSettings.mobileInboxPath,
  'string',
  'Malformed Companion mobile inbox paths should be normalized to a string.',
);
assert.equal(
  malformedCompanionSettings.syncMode,
  'manual',
  'Malformed Companion sync modes should fall back to the default manual mode.',
);
assert.equal(
  malformedCompanionSettings.previewBeforeWrite,
  true,
  'Malformed Companion preview flags should fall back to the default boolean value.',
);
assert.equal(
  Array.isArray(malformedCompanionSettings.rules),
  true,
  'Malformed Companion rules should fall back to the default rules array.',
);
assert.equal(
  Array.isArray(malformedCompanionSettings.templates),
  true,
  'Malformed Companion templates should fall back to the default templates array.',
);

let malformedCompanionPersistedValue: unknown;
const malformedCompanionSetterAccessors = createAppStateAccessors({
  store: {
    get: () => undefined,
    set: (key: string, value: unknown) => {
      if (key === 'obsidianCompanionSettings') malformedCompanionPersistedValue = value;
    },
  },
  isDevelopmentBuild: () => false,
  devObsidianPath: '',
  zh: (text) => text,
});
malformedCompanionSetterAccessors.setCompanionSettings({
  vaultPath: 456,
  mobileInboxPath: ['bad'],
  presetId: undefined,
  syncMode: 'bad-mode',
  previewBeforeWrite: 'no',
  rules: 'bad-rules',
  templates: 'bad-templates',
} as never);
assert.equal(
  typeof (malformedCompanionPersistedValue as any)?.vaultPath,
  'string',
  'setCompanionSettings should persist a normalized string vaultPath for malformed input.',
);
assert.equal(
  typeof (malformedCompanionPersistedValue as any)?.mobileInboxPath,
  'string',
  'setCompanionSettings should persist a normalized string mobileInboxPath for malformed input.',
);
assert.equal(
  (malformedCompanionPersistedValue as any)?.syncMode,
  'manual',
  'setCompanionSettings should persist the default sync mode for malformed input.',
);
assert.equal(
  (malformedCompanionPersistedValue as any)?.previewBeforeWrite,
  true,
  'setCompanionSettings should persist the default preview flag for malformed input.',
);
assert.equal(
  Array.isArray((malformedCompanionPersistedValue as any)?.rules),
  true,
  'setCompanionSettings should persist a rules array for malformed input.',
);
assert.equal(
  Array.isArray((malformedCompanionPersistedValue as any)?.templates),
  true,
  'setCompanionSettings should persist a templates array for malformed input.',
);

const malformedCompanionArrayElementsAccessors = createAppStateAccessors({
  store: {
    get: (key: string) => {
      if (key === 'obsidianCompanionSettings') {
        return {
          vaultPath: '',
          mobileInboxPath: '',
          presetId: 'minimal-daily-notes',
          syncMode: 'manual',
          previewBeforeWrite: true,
          rules: [{ id: 123, write: null }],
          templates: [{ id: 456, body: null }],
        };
      }
      return undefined;
    },
    set: () => {},
  },
  isDevelopmentBuild: () => false,
  devObsidianPath: '',
  zh: (text) => text,
});
const malformedCompanionArrayElementSettings = malformedCompanionArrayElementsAccessors.getCompanionSettings();
assert.equal(
  malformedCompanionArrayElementSettings.rules.every((rule) =>
    typeof rule.id === 'string' &&
    typeof rule.name === 'string' &&
    typeof rule.enabled === 'boolean' &&
    typeof rule.priority === 'number' &&
    Boolean(rule.when && typeof rule.when === 'object') &&
    Boolean(rule.write && typeof rule.write.target === 'string' && typeof rule.write.templateId === 'string')
  ),
  true,
  'Malformed Companion rule elements should fall back to valid default rule objects.',
);
assert.equal(
  malformedCompanionArrayElementSettings.templates.every((template) =>
    typeof template.id === 'string' && typeof template.name === 'string' && typeof template.body === 'string'
  ),
  true,
  'Malformed Companion template elements should fall back to valid default template objects.',
);

const malformedCompanionRuleConditionAccessors = createAppStateAccessors({
  store: {
    get: (key: string) => {
      if (key === 'obsidianCompanionSettings') {
        return {
          vaultPath: '',
          mobileInboxPath: '',
          presetId: 'minimal-daily-notes',
          syncMode: 'manual',
          previewBeforeWrite: true,
          rules: [{
            id: 'bad-condition-rule',
            name: 'Bad condition rule',
            enabled: true,
            priority: 1,
            when: { tagsAny: [123], tagsAll: ['ok'], containsAny: ['note'] },
            write: { target: 'Inbox.md', templateId: 'daily-inspiration-line', mode: 'append' },
            afterMatch: 'continue',
          }],
          templates: [{ id: 'daily-inspiration-line', name: 'Line', body: '{{content}}' }],
        };
      }
      return undefined;
    },
    set: () => {},
  },
  isDevelopmentBuild: () => false,
  devObsidianPath: '',
  zh: (text) => text,
});
const malformedCompanionRuleConditionSettings = malformedCompanionRuleConditionAccessors.getCompanionSettings();
assert.equal(
  malformedCompanionRuleConditionSettings.rules.every((rule) =>
    !Array.isArray(rule.when.tagsAny) || rule.when.tagsAny.every((tag) => typeof tag === 'string')
  ),
  true,
  'Malformed Companion rule condition tag arrays should fall back before reaching matchesRule.',
);

assert.match(main, /from '\.\/appStateAccessors'/, 'main should import the app state accessors helper.');
assert.match(main, /from '\.\/appEnvironment'/, 'main should import the app environment helper that now owns the dev vault path.');
assert.match(main, /const \{[\s\S]*getDefaultVaultPath,[\s\S]*getLlmCaller,[\s\S]*\} = createAppStateAccessors\(\{/, 'main should create and destructure app state accessors from the helper.');
assert.match(main, /createAppStateAccessors\(\{[\s\S]*store,[\s\S]*isDevelopmentBuild,[\s\S]*devObsidianPath,[\s\S]*zh,[\s\S]*\}\)/, 'main should pass store, build mode, the shared dev vault path, and localization to the app state accessors helper.');

for (const fn of [
  'getDefaultVaultPath',
  'getVaultPath',
  'getVaultStatus',
  'getCompanionSettings',
  'setCompanionSettings',
  'getAppSettings',
  'setAppSettings',
  'getObsidianTemplateSettings',
  'setObsidianTemplateSettings',
  'getAiReviewSettings',
  'setAiReviewSettings',
  'getReviewSections',
  'setReviewSections',
  'buildDailySourceRules',
  'getDailySourceRules',
  'getLlmCaller',
]) {
  const pattern = new RegExp(`function ${fn}\\b`);
  assert.doesNotMatch(main, pattern, `main should not keep ${fn} inline after app state accessor extraction.`);
}

assert.doesNotMatch(main, /const AI_REVIEW_SECTIONS_KEY = 'aiReviewSections'/, 'main should not own the AI review sections store key after accessor extraction.');

for (const symbol of [
  'normalizeCompanionSettings',
  'normalizeAppSettings',
  'normalizeObsidianTemplateSettings',
  'normalizeAiReviewSettings',
  'normalizeSections',
  'resolveActiveProfile',
  'callChatCompletion',
]) {
  const pattern = new RegExp(`\\b${symbol}\\b`);
  assert.doesNotMatch(main, pattern, `main should not keep direct ${symbol} wiring after accessor extraction.`);
}

assert.equal(
  scripts['verify:electron-app-state-accessors-module'],
  'tsx scripts/verify-electron-app-state-accessors-module.ts',
  'package.json should expose the focused app state accessors verifier.',
);
assertCleanupCoreIncludes('verify:electron-app-state-accessors-module', 'cleanup-core should include the focused app state accessors verifier.');

console.log('electron app state accessors module verification passed');
