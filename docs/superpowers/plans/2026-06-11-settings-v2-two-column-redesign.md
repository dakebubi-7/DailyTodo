# Settings v2 Two-Column Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild DailyTodo settings into a theme-following two-column overlay with seven tabs, repaired AI account management, and the old Obsidian Companion panel decomposed into Sync/Developer settings.

**Architecture:** Keep settings inside the existing React renderer so it inherits personalization CSS variables in real time. Add one Electron IPC to temporarily widen the main window while the settings overlay is open, then split the large `SettingsPanel.tsx` into a sidebar plus focused tab components. Preserve existing storage keys where possible, but remove Mobile Inbox and make `obsidianTemplates.obsidianPath` the single user-facing vault path.

**Tech Stack:** Electron 34, React 18, TypeScript 5, electron-vite, `tsx` verification scripts, Node `assert`.

---

## File Structure

### New files

- `app/scripts/verify-settings-v2-ai-account.ts`
  - Verifies old AI section references are removed, `AiAccountZone` uses flat i18n, and new profiles use `maxTokens`.
- `app/scripts/verify-settings-v2-window-mode.ts`
  - Verifies `window:setSettingsMode` IPC, preload API, vite type, and `App.tsx` open/close calls.
- `app/scripts/verify-settings-v2-layout.ts`
  - Verifies two-column overlay, seven nav tabs, sidebar groups, and CSS token mappings.
- `app/scripts/verify-settings-v2-tabs.ts`
  - Verifies the user-facing tab contents: appearance, sync accordion, templates, AI timers/manual generation, schedule, general.
- `app/scripts/verify-settings-v2-companion.ts`
  - Verifies Companion panel rendering/import/mobile inbox are removed and Developer tab owns rules/templates/preview.
- `app/scripts/verify-settings-v2-i18n.ts`
  - Verifies all new v2 settings and Developer/Companion strings exist in zh and en.
- `app/src/components/SettingsSidebar.tsx`
  - Renders fixed 168px grouped navigation: 常用 / 系统 / 高级.
- `app/src/components/settings/AppearanceTab.tsx`
  - Appearance/personalization controls.
- `app/src/components/settings/SyncTab.tsx`
  - Vault selection, delete-sync toggles, and five path accordions.
- `app/src/components/settings/TemplatesTab.tsx`
  - Five template link rows and block-name previews.
- `app/src/components/settings/AiReviewTab.tsx`
  - AI account zone, four timer toggles, and manual generation grid.
- `app/src/components/settings/ScheduleTab.tsx`
  - Rollover and clear-completed controls.
- `app/src/components/settings/GeneralTab.tsx`
  - Language and window behavior controls.
- `app/src/components/settings/DeveloperTab.tsx`
  - Former Companion rules/templates/preview UI, fully localized.

### Modified files

- `app/src/components/SettingsPanel.tsx`
  - Becomes layout shell and shared lightweight controls only. Deletes old `AiReviewSection` and old one-page sections.
- `app/src/App.tsx`
  - Calls `window.electronAPI.setSettingsMode(true/false)` when settings opens/closes. Stops rendering `ObsidianCompanionPanel`. Passes companion developer data into `DeveloperTab` through `SettingsPanel`.
- `app/electron/main.ts`
  - Adds `window:setSettingsMode` handler. Removes `companion:importMobileInbox`. Keeps preview/write Companion IPC.
- `app/electron/preload.ts`
  - Exposes `setSettingsMode`. Removes `importMobileInbox`.
- `app/src/vite-env.d.ts`
  - Adds `setSettingsMode(open: boolean)`. Removes `importMobileInbox`.
- `app/src/store/taskStore.ts`
  - Removes `importMobileInbox` export and API wrapper.
- `app/shared/obsidianCompanion.ts`
  - Removes `mobileInboxPath` from `CompanionSettings`. Keeps `CaptureSource` compatibility unless all call sites are verified safe to narrow.
- `app/shared/obsidianCompanionDefaults.ts`
  - Removes `mobileInboxPath` default.
- `app/electron/obsidianCompanion.ts`
  - Removes `importMobileInbox` function and related filesystem import code.
- `app/src/i18n.ts`
  - Adds v2 tab/group labels, field labels, Developer/Companion strings, and missing AI account labels in both zh/en.
- `app/src/styles/globals.css`
  - Adds v2 token mapping and two-column/settings component CSS.
- `app/package.json`
  - Adds `verify:settings-v2-*` scripts and optionally chains them in a new `verify:settings-v2` script.

---

## Implementation Tasks

### Task 1: Repair AI account management first

**Files:**
- Create: `app/scripts/verify-settings-v2-ai-account.ts`
- Modify: `app/src/components/SettingsPanel.tsx`
- Modify: `app/package.json`

- [ ] **Step 1: Write the failing verification script**

Create `app/scripts/verify-settings-v2-ai-account.ts`:

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd().endsWith('app') ? process.cwd() : join(process.cwd(), 'app');
const settingsPanel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const aiSettings = readFileSync(join(root, 'shared/aiReview/aiReviewSettings.ts'), 'utf8');

assert.match(aiSettings, /export interface AiProfile[\s\S]*maxTokens\?: number;/, 'AiProfile must use maxTokens');
assert.doesNotMatch(settingsPanel, /function AiReviewSection\s*\(/, 'old AiReviewSection must be deleted');
assert.doesNotMatch(settingsPanel, /weeklyDir|monthlyDir|externalWeeklyDir|externalMonthlyDir|weeklyPrompt|monthlyPrompt|externalWeeklyPrompt|externalMonthlyPrompt|backfillDays/, 'SettingsPanel must not reference removed AiReviewSettings fields');
assert.doesNotMatch(settingsPanel, /outputTokens\s*:/, 'new AI profiles must not use outputTokens');
assert.match(settingsPanel, /maxTokens\s*:\s*(DEFAULT_MAX_TOKENS|8192|4000)/, 'new AI profiles must set maxTokens');
assert.doesNotMatch(settingsPanel, /text=\{\{\s*settings:\s*\{\s*aiReview:/, 'AiAccountManager must receive flat AiReviewText, not nested shell text');
assert.match(settingsPanel, /<AiAccountManager[\s\S]*text=\{text\}/, 'AiAccountZone must pass flat text={text} to AiAccountManager');

console.log('settings v2 AI account verification passed');
```

- [ ] **Step 2: Add the npm script**

Modify `app/package.json` scripts:

```json
"verify:settings-v2-ai-account": "tsx scripts/verify-settings-v2-ai-account.ts"
```

- [ ] **Step 3: Run the verification and confirm it fails for the current broken state**

Run:

```bash
npm --prefix app run verify:settings-v2-ai-account
```

Expected: FAIL because `SettingsPanel.tsx` still has `function AiReviewSection` and `outputTokens`.

- [ ] **Step 4: Delete the old AI review section**

In `app/src/components/SettingsPanel.tsx`, remove the entire `function AiReviewSection(...) { ... }` component. Keep these still-used helpers if they are outside that component and referenced by later code:

```ts
type AiReviewText = ReturnType<typeof getShellText>['settings']['aiReview'];
type TemplateSourcesText = ReturnType<typeof getShellText>['settings']['templateSources'];
function defaultReportPeriods(now: Date): { week: string; month: string } { /* existing body */ }
function getWeekDateFromKey(weekKey: string): string { /* existing body */ }
function getMonthDateFromKey(monthKey: string): string { /* existing body */ }
```

If any of those helpers are only used by the deleted component after Task 4 is complete, delete the unused imports and helpers in the typecheck cleanup step.

- [ ] **Step 5: Fix `AiAccountZone` profile creation**

In `app/src/components/SettingsPanel.tsx`, change the new profile object inside `AiAccountZone` from:

```ts
const newP = { id: newId, name: text.accountNewName ?? '新账号', apiKey: '', provider: 'openai' as any, baseUrl: '', model: '', timeoutSeconds: 60, outputTokens: 4000, note: '' };
```

to:

```ts
const newP: AiProfile = {
  id: newId,
  name: text.accountNewName ?? '新账号',
  provider: 'auto',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  timeoutSeconds: 90,
  maxTokens: 8192,
  note: '',
};
```

- [ ] **Step 6: Fix `AiAccountZone` text shape**

Inside `AiAccountZone`, ensure the account manager call is exactly this shape:

```tsx
<AiAccountManager
  text={text}
  settings={settings}
  onSettingsChange={setSettings}
  onClose={() => setOpen(false)}
/>
```

Do not pass `{ settings: { aiReview: text } }`.

- [ ] **Step 7: Run verification and typecheck**

Run:

```bash
npm --prefix app run verify:settings-v2-ai-account
npm --prefix app run typecheck
```

Expected: both PASS. If typecheck reports unused imports from the deleted component, remove those imports from `SettingsPanel.tsx`.

- [ ] **Step 8: Commit**

```bash
git add app/scripts/verify-settings-v2-ai-account.ts app/src/components/SettingsPanel.tsx app/package.json
git commit -m "fix(settings): repair AI account management"
```

---

### Task 2: Add settings window widen/shrink IPC

**Files:**
- Create: `app/scripts/verify-settings-v2-window-mode.ts`
- Modify: `app/electron/main.ts`
- Modify: `app/electron/preload.ts`
- Modify: `app/src/vite-env.d.ts`
- Modify: `app/src/App.tsx`
- Modify: `app/package.json`

- [ ] **Step 1: Write the failing verification script**

Create `app/scripts/verify-settings-v2-window-mode.ts`:

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd().endsWith('app') ? process.cwd() : join(process.cwd(), 'app');
const main = readFileSync(join(root, 'electron/main.ts'), 'utf8');
const preload = readFileSync(join(root, 'electron/preload.ts'), 'utf8');
const viteEnv = readFileSync(join(root, 'src/vite-env.d.ts'), 'utf8');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');

assert.match(main, /const SETTINGS_WINDOW_WIDTH\s*=\s*720/, 'main must define SETTINGS_WINDOW_WIDTH = 720');
assert.match(main, /ipcMain\.handle\('window:setSettingsMode'/, 'main must register window:setSettingsMode IPC');
assert.match(main, /setMinimumSize\(settingsWidth/, 'open settings mode must set temporary minimum width');
assert.match(main, /setMinimumSize\(RESET_WINDOW_WIDTH/, 'close settings mode must restore compact minimum width');
assert.match(main, /workArea\.width - 40/, 'settings width must be clamped to work area');
assert.match(preload, /setSettingsMode:\s*\(open: boolean\)\s*=>\s*ipcRenderer\.invoke\('window:setSettingsMode', open\)/, 'preload must expose setSettingsMode');
assert.match(viteEnv, /setSettingsMode:\s*\(open: boolean\)\s*=>\s*Promise<.*>/, 'vite-env must type setSettingsMode');
assert.match(app, /setSettingsMode\?\.\(settingsOpen\)/, 'App must call setSettingsMode when settingsOpen changes');

console.log('settings v2 window mode verification passed');
```

- [ ] **Step 2: Add the npm script**

Modify `app/package.json` scripts:

```json
"verify:settings-v2-window-mode": "tsx scripts/verify-settings-v2-window-mode.ts"
```

- [ ] **Step 3: Run verification and confirm it fails**

Run:

```bash
npm --prefix app run verify:settings-v2-window-mode
```

Expected: FAIL because `window:setSettingsMode` does not exist yet.

- [ ] **Step 4: Implement IPC in main process**

In `app/electron/main.ts`, near `RESET_WINDOW_WIDTH`, add:

```ts
const SETTINGS_WINDOW_WIDTH = 720;
let prevSettingsModeWidth = RESET_WINDOW_WIDTH;
```

Near other `window:*` IPC handlers, add:

```ts
ipcMain.handle('window:setSettingsMode', (_event, open: boolean) => {
  if (!mainWindow || mainWindow.isDestroyed()) return { ok: false };
  const win = mainWindow;
  const display = screen.getDisplayMatching(win.getBounds());
  const workArea = display.workArea;

  if (open) {
    const current = win.getBounds();
    prevSettingsModeWidth = current.width > 0 ? current.width : RESET_WINDOW_WIDTH;
    const settingsWidth = Math.min(SETTINGS_WINDOW_WIDTH, Math.max(RESET_WINDOW_WIDTH, workArea.width - 40));
    win.setMinimumSize(settingsWidth, Math.max(320, current.height));
    const next = { ...current, width: settingsWidth };
    if (next.x + next.width > workArea.x + workArea.width) {
      next.x = Math.max(workArea.x, workArea.x + workArea.width - next.width - 30);
    }
    win.setBounds(next);
    return { ok: true, width: settingsWidth };
  }

  const current = win.getBounds();
  const restoredWidth = Math.max(RESET_WINDOW_WIDTH, prevSettingsModeWidth || RESET_WINDOW_WIDTH);
  win.setMinimumSize(RESET_WINDOW_WIDTH, Math.max(320, current.height));
  const next = { ...current, width: restoredWidth };
  if (next.x + next.width > workArea.x + workArea.width) {
    next.x = Math.max(workArea.x, workArea.x + workArea.width - next.width - 30);
  }
  win.setBounds(next);
  return { ok: true, width: restoredWidth };
});
```

- [ ] **Step 5: Expose IPC in preload and types**

In `app/electron/preload.ts`, add to `electronAPI`:

```ts
setSettingsMode: (open: boolean) => ipcRenderer.invoke('window:setSettingsMode', open),
```

In `app/src/vite-env.d.ts`, add:

```ts
setSettingsMode: (open: boolean) => Promise<{ ok: boolean; width?: number }>;
```

- [ ] **Step 6: Call IPC from `App.tsx`**

In `app/src/App.tsx`, add an effect near other top-level effects:

```tsx
useEffect(() => {
  void window.electronAPI?.setSettingsMode?.(settingsOpen);
}, [settingsOpen]);
```

Keep the existing `settingsOpen` boolean and `SettingsPanel` rendering.

- [ ] **Step 7: Run verification and typecheck**

Run:

```bash
npm --prefix app run verify:settings-v2-window-mode
npm --prefix app run typecheck
```

Expected: both PASS.

- [ ] **Step 8: Commit**

```bash
git add app/scripts/verify-settings-v2-window-mode.ts app/electron/main.ts app/electron/preload.ts app/src/vite-env.d.ts app/src/App.tsx app/package.json
git commit -m "feat(settings): add settings window mode"
```

---

### Task 3: Build two-column settings shell and sidebar

**Files:**
- Create: `app/scripts/verify-settings-v2-layout.ts`
- Create: `app/src/components/SettingsSidebar.tsx`
- Modify: `app/src/components/SettingsPanel.tsx`
- Modify: `app/src/i18n.ts`
- Modify: `app/src/styles/globals.css`
- Modify: `app/package.json`

- [ ] **Step 1: Write the failing verification script**

Create `app/scripts/verify-settings-v2-layout.ts`:

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd().endsWith('app') ? process.cwd() : join(process.cwd(), 'app');
const sidebar = readFileSync(join(root, 'src/components/SettingsSidebar.tsx'), 'utf8');
const panel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const css = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
const i18n = readFileSync(join(root, 'src/i18n.ts'), 'utf8');

for (const key of ['appearance', 'sync', 'templates', 'aiReview', 'schedule', 'general', 'developer']) {
  assert.match(sidebar + panel, new RegExp(`['\"]${key}['\"]`), `missing tab key ${key}`);
}
for (const group of ['common', 'system', 'advanced']) {
  assert.match(i18n, new RegExp(`${group}:`), `missing sidebar group ${group}`);
}
assert.match(sidebar, /width.*168|settings-sidebar/, 'sidebar component must render fixed settings sidebar');
assert.match(panel, /settings-v2-overlay/, 'SettingsPanel must render v2 overlay root');
assert.match(panel, /settings-v2-shell/, 'SettingsPanel must render v2 two-column shell');
assert.match(css, /--color-background-primary:/, 'CSS must define v2 primary background token');
assert.match(css, /--color-background-secondary:/, 'CSS must define v2 secondary background token');
assert.match(css, /\.settings-v2-sidebar/, 'CSS must style sidebar');
assert.match(css, /\.settings-v2-content/, 'CSS must style scroll content');
assert.match(css, /\.settings-field-row/, 'CSS must style field rows');
assert.match(css, /\.settings-sub-row/, 'CSS must style sub rows');

console.log('settings v2 layout verification passed');
```

- [ ] **Step 2: Add the npm script**

Modify `app/package.json` scripts:

```json
"verify:settings-v2-layout": "tsx scripts/verify-settings-v2-layout.ts"
```

- [ ] **Step 3: Run verification and confirm it fails**

Run:

```bash
npm --prefix app run verify:settings-v2-layout
```

Expected: FAIL because the sidebar and v2 shell do not exist.

- [ ] **Step 4: Add sidebar i18n keys**

In `app/src/i18n.ts`, add this under both `zh.settings` and `en.settings`.

Chinese:

```ts
settingsV2: {
  title: '设置',
  groups: { common: '常用', system: '系统', advanced: '高级' },
  tabs: {
    appearance: { title: '外观', description: '主题、字体、圆角、配色。' },
    sync: { title: '同步', description: 'Obsidian Vault、删除同步、5 条路径。' },
    templates: { title: '模板', description: '日报、个人周/月报、对外周/月报。' },
    aiReview: { title: 'AI 复盘', description: '账号、定时生成、手动生成。' },
    schedule: { title: '日程', description: '每日切换、自动结转、清理已完成。' },
    general: { title: '通用', description: '语言、窗口行为。' },
    developer: { title: '开发者', description: 'Obsidian 规则、底层模板、同步预览。' },
  },
}
```

English:

```ts
settingsV2: {
  title: 'Settings',
  groups: { common: 'Common', system: 'System', advanced: 'Advanced' },
  tabs: {
    appearance: { title: 'Appearance', description: 'Theme, font, radius, and colors.' },
    sync: { title: 'Sync', description: 'Obsidian vault, deletion sync, and five paths.' },
    templates: { title: 'Templates', description: 'Daily, personal reports, and external reports.' },
    aiReview: { title: 'AI Review', description: 'Accounts, timers, and manual generation.' },
    schedule: { title: 'Schedule', description: 'Daily rollover, auto carry, and cleanup.' },
    general: { title: 'General', description: 'Language and window behavior.' },
    developer: { title: 'Developer', description: 'Obsidian rules, low-level templates, and sync preview.' },
  },
}
```

- [ ] **Step 5: Create `SettingsSidebar.tsx`**

Create `app/src/components/SettingsSidebar.tsx`:

```tsx
import { ReactNode } from 'react';
import { getShellText } from '../i18n';

export type SettingsV2Tab = 'appearance' | 'sync' | 'templates' | 'aiReview' | 'schedule' | 'general' | 'developer';

type SettingsV2Text = ReturnType<typeof getShellText>['settings']['settingsV2'];

type SidebarItem = { key: SettingsV2Tab; icon: ReactNode };

const GROUPS: Array<{ key: keyof SettingsV2Text['groups']; items: SidebarItem[] }> = [
  { key: 'common', items: [
    { key: 'appearance', icon: '🎨' },
    { key: 'sync', icon: '🔄' },
    { key: 'templates', icon: '📄' },
    { key: 'aiReview', icon: '🤖' },
  ] },
  { key: 'system', items: [
    { key: 'schedule', icon: '📅' },
    { key: 'general', icon: '⚙️' },
  ] },
  { key: 'advanced', items: [
    { key: 'developer', icon: '</>' },
  ] },
];

export function SettingsSidebar({
  active,
  text,
  onSelect,
}: {
  active: SettingsV2Tab;
  text: SettingsV2Text;
  onSelect: (tab: SettingsV2Tab) => void;
}) {
  return (
    <nav className="settings-v2-sidebar" aria-label={text.title}>
      {GROUPS.map((group) => (
        <section key={group.key} className="settings-v2-sidebar-group">
          <h3>{text.groups[group.key]}</h3>
          {group.items.map((item) => {
            const tab = text.tabs[item.key];
            return (
              <button
                key={item.key}
                type="button"
                className={`settings-v2-nav-item ${active === item.key ? 'is-active' : ''}`}
                onClick={() => onSelect(item.key)}
              >
                <span className="settings-v2-nav-icon">{item.icon}</span>
                <span>
                  <strong>{tab.title}</strong>
                  <small>{tab.description}</small>
                </span>
              </button>
            );
          })}
        </section>
      ))}
    </nav>
  );
}
```

- [ ] **Step 6: Convert `SettingsPanel` root to v2 shell**

In `app/src/components/SettingsPanel.tsx`:

1. Import the sidebar:

```ts
import { SettingsSidebar, SettingsV2Tab } from './SettingsSidebar';
```

2. Replace old section state types with:

```ts
const [activeTab, setActiveTab] = useState<SettingsV2Tab>('appearance');
```

3. Ensure the component returns this outer structure when `isOpen` is true:

```tsx
<motion.div className="settings-v2-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
  <div className="settings-v2-shell">
    <header className="settings-v2-header">
      <strong>{text.settingsV2.title}</strong>
      <button type="button" onClick={onClose} aria-label={text.close}>×</button>
    </header>
    <div className="settings-v2-body">
      <SettingsSidebar active={activeTab} text={text.settingsV2} onSelect={setActiveTab} />
      <main className="settings-v2-content">
        <section className="settings-v2-section-card">
          <h2>{text.settingsV2.tabs[activeTab].title}</h2>
          <p>{text.settingsV2.tabs[activeTab].description}</p>
        </section>
      </main>
    </div>
  </div>
</motion.div>
```

Keep existing props intact; later tasks will move content into tab components.

- [ ] **Step 7: Add v2 CSS tokens and shell styles**

In `app/src/styles/globals.css`, add:

```css
:root {
  --color-background-primary: var(--personal-surface, rgba(255, 255, 255, 0.96));
  --color-background-secondary: var(--personal-surface-muted, rgba(248, 248, 250, 0.96));
  --color-text-primary: var(--personal-text, #1f2937);
  --color-text-secondary: var(--personal-text-muted, #6b7280);
  --color-text-tertiary: var(--personal-text-faint, #9ca3af);
  --color-border-secondary: var(--personal-border, rgba(39, 39, 42, 0.18));
  --color-border-tertiary: var(--personal-border-faint, rgba(39, 39, 42, 0.1));
}

.dark {
  --color-background-primary: var(--personal-surface, rgba(15, 23, 42, 0.97));
  --color-background-secondary: var(--personal-surface-muted, rgba(20, 28, 48, 0.97));
  --color-text-primary: var(--personal-text, #e5e7eb);
  --color-text-secondary: var(--personal-text-muted, #9ca3af);
  --color-text-tertiary: var(--personal-text-faint, #6b7280);
  --color-border-secondary: var(--personal-border, rgba(148, 163, 184, 0.22));
  --color-border-tertiary: var(--personal-border-faint, rgba(148, 163, 184, 0.12));
}

.settings-v2-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: var(--color-background-primary);
  color: var(--color-text-primary);
}

.settings-v2-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.settings-v2-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 0 14px;
  border-bottom: 0.5px solid var(--color-border-tertiary);
  background: var(--color-background-primary);
}

.settings-v2-body {
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
  min-height: 0;
  flex: 1;
}

.settings-v2-sidebar {
  width: 168px;
  overflow-y: auto;
  padding: 12px 8px;
  border-right: 0.5px solid var(--color-border-tertiary);
  background: var(--color-background-secondary);
}

.settings-v2-sidebar-group + .settings-v2-sidebar-group {
  margin-top: 14px;
}

.settings-v2-sidebar-group h3 {
  margin: 0 0 6px;
  padding: 0 8px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.settings-v2-nav-item {
  position: relative;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: center;
  width: 100%;
  min-height: 36px;
  padding: 5px 8px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--color-text-secondary);
  text-align: left;
}

.settings-v2-nav-item.is-active {
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  font-weight: 500;
}

.settings-v2-nav-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 2px;
  border-radius: 2px;
  background: var(--color-text-primary);
}

.settings-v2-nav-icon {
  font-size: 13px;
}

.settings-v2-nav-item strong,
.settings-v2-nav-item small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-v2-nav-item strong {
  font-size: 13px;
}

.settings-v2-nav-item small {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.settings-v2-content {
  overflow-y: auto;
  padding: 14px;
}

.settings-v2-section-card {
  margin-bottom: 12px;
  border: 0.5px solid var(--color-border-tertiary);
  border-radius: 14px;
  background: var(--color-background-primary);
}

.settings-v2-section-card h2,
.settings-v2-section-card p {
  margin: 0;
  padding: 12px 14px;
}

.settings-field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  padding: 9px 0;
  border-bottom: 0.5px solid var(--color-border-tertiary);
  gap: 12px;
}

.settings-field-row:last-child {
  border-bottom: 0;
}

.settings-sub-row {
  margin-left: 8px;
  padding-left: 12px;
  border-left: 2px solid var(--color-border-tertiary);
}
```

- [ ] **Step 8: Run verification and typecheck**

Run:

```bash
npm --prefix app run verify:settings-v2-layout
npm --prefix app run typecheck
```

Expected: both PASS.

- [ ] **Step 9: Commit**

```bash
git add app/scripts/verify-settings-v2-layout.ts app/src/components/SettingsSidebar.tsx app/src/components/SettingsPanel.tsx app/src/i18n.ts app/src/styles/globals.css app/package.json
git commit -m "feat(settings): add two-column settings shell"
```

---

### Task 4: Split user-facing tabs into focused components

**Files:**
- Create: `app/scripts/verify-settings-v2-tabs.ts`
- Create: `app/src/components/settings/AppearanceTab.tsx`
- Create: `app/src/components/settings/SyncTab.tsx`
- Create: `app/src/components/settings/TemplatesTab.tsx`
- Create: `app/src/components/settings/AiReviewTab.tsx`
- Create: `app/src/components/settings/ScheduleTab.tsx`
- Create: `app/src/components/settings/GeneralTab.tsx`
- Modify: `app/src/components/SettingsPanel.tsx`
- Modify: `app/src/i18n.ts`
- Modify: `app/src/styles/globals.css`
- Modify: `app/package.json`

- [ ] **Step 1: Write the failing verification script**

Create `app/scripts/verify-settings-v2-tabs.ts`:

```ts
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd().endsWith('app') ? process.cwd() : join(process.cwd(), 'app');
const files = [
  'AppearanceTab.tsx',
  'SyncTab.tsx',
  'TemplatesTab.tsx',
  'AiReviewTab.tsx',
  'ScheduleTab.tsx',
  'GeneralTab.tsx',
];
for (const file of files) {
  assert.equal(existsSync(join(root, 'src/components/settings', file)), true, `${file} must exist`);
}
const sync = readFileSync(join(root, 'src/components/settings/SyncTab.tsx'), 'utf8');
const templates = readFileSync(join(root, 'src/components/settings/TemplatesTab.tsx'), 'utf8');
const ai = readFileSync(join(root, 'src/components/settings/AiReviewTab.tsx'), 'utf8');
const schedule = readFileSync(join(root, 'src/components/settings/ScheduleTab.tsx'), 'utf8');
const general = readFileSync(join(root, 'src/components/settings/GeneralTab.tsx'), 'utf8');
const panel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');

for (const key of ['dailyPath', 'weeklyPath', 'monthlyPath', 'externalWeeklyPath', 'externalMonthlyPath']) {
  assert.match(sync, new RegExp(key), `SyncTab must edit ${key}`);
}
assert.match(sync, /settings-path-accordion/, 'SyncTab must use path accordion UI');
for (const kind of ['daily', 'personalWeekly', 'personalMonthly', 'externalWeekly', 'externalMonthly']) {
  assert.match(templates, new RegExp(kind), `TemplatesTab must include ${kind}`);
}
assert.match(templates, /onEditTemplate/, 'TemplatesTab must call onEditTemplate');
for (const key of ['weeklyTimerEnabled', 'monthlyTimerEnabled', 'externalWeeklyTimerEnabled', 'externalMonthlyTimerEnabled']) {
  assert.match(ai, new RegExp(key), `AiReviewTab must include ${key}`);
}
assert.match(ai, /generateExternal\('weekly'\)|onGenerateExternalWeekly/, 'AiReviewTab must include external weekly manual generation');
assert.match(ai, /regenerate.*today|onRegenerateToday|runForDate/, 'AiReviewTab must include regenerate today action');
assert.match(schedule, /rolloverTime|autoCarryUnfinished|onClearCompleted/, 'ScheduleTab must include rollover and clear completed');
assert.match(general, /language|setWindowMode|AutoStartToggle|always/i, 'GeneralTab must include language and window controls');
assert.match(panel, /<AppearanceTab/, 'SettingsPanel must render AppearanceTab');
assert.match(panel, /<SyncTab/, 'SettingsPanel must render SyncTab');
assert.match(panel, /<TemplatesTab/, 'SettingsPanel must render TemplatesTab');
assert.match(panel, /<AiReviewTab/, 'SettingsPanel must render AiReviewTab');
assert.match(panel, /<ScheduleTab/, 'SettingsPanel must render ScheduleTab');
assert.match(panel, /<GeneralTab/, 'SettingsPanel must render GeneralTab');

console.log('settings v2 tabs verification passed');
```

- [ ] **Step 2: Add the npm script**

Modify `app/package.json` scripts:

```json
"verify:settings-v2-tabs": "tsx scripts/verify-settings-v2-tabs.ts"
```

- [ ] **Step 3: Run verification and confirm it fails**

Run:

```bash
npm --prefix app run verify:settings-v2-tabs
```

Expected: FAIL because tab files do not exist.

- [ ] **Step 4: Create `AppearanceTab.tsx`**

Move the existing theme card, range, color, and opacity controls out of `SettingsPanel.tsx` into `app/src/components/settings/AppearanceTab.tsx`. Export:

```tsx
export function AppearanceTab({
  settings,
  text,
  onApplyTheme,
  onChange,
}: {
  settings: PersonalizationSettings;
  text: ReturnType<typeof getShellText>['settings'];
  onApplyTheme: (preset: ThemePreset) => void;
  onChange: (settings: PersonalizationSettings) => void;
}) {
  return (
    <div className="settings-v2-tab-stack">
      {/* existing theme cards */}
      {/* existing global font/radius controls */}
      {/* existing color controls */}
      {/* existing opacity accordion */}
    </div>
  );
}
```

Reuse existing `RangeControl`, `OpacityAreaControl`, `opacityValue`, and `getThemeRecommendation` by either moving them into this file or keeping them exported from `SettingsPanel.tsx`. Prefer moving if only Appearance uses them.

- [ ] **Step 5: Create `SyncTab.tsx`**

Create `app/src/components/settings/SyncTab.tsx` with this interface and behavior:

```tsx
export function SyncTab({
  text,
  obsidianTemplates,
  obsidianPath,
  syncPreview,
  onChange,
  onChooseObsidian,
  onPreviewSync,
}: {
  text: ReturnType<typeof getShellText>['settings'];
  obsidianTemplates: ObsidianTemplateSettings;
  obsidianPath: string;
  syncPreview: SyncPreview | null;
  onChange: (settings: ObsidianTemplateSettings) => void;
  onChooseObsidian: () => void;
  onPreviewSync: () => void;
}) {
  const pathRows = [
    ['dailyPath', '日报路径'],
    ['weeklyPath', '个人周报路径'],
    ['monthlyPath', '个人月报路径'],
    ['externalWeeklyPath', '对外周报路径'],
    ['externalMonthlyPath', '对外月报路径'],
  ] as const;
  return (
    <div className="settings-v2-tab-stack">
      {/* Vault row + choose button */}
      {/* syncDeletedReviewsToObsidian toggle */}
      {/* confirmBeforeDeletingReview toggle */}
      <section className="settings-v2-section-card settings-path-accordion">
        {pathRows.map(([key, label]) => (
          <details key={key} open={key === 'dailyPath'}>
            <summary>{label}<small>{obsidianTemplates[key]}</small></summary>
            <input value={obsidianTemplates[key]} onChange={(event) => onChange({ ...obsidianTemplates, [key]: event.target.value })} />
          </details>
        ))}
      </section>
      {/* preview button and preview status */}
    </div>
  );
}
```

Use existing Chinese labels from `text` where available; add missing i18n in Step 10.

- [ ] **Step 6: Create `TemplatesTab.tsx`**

Create `app/src/components/settings/TemplatesTab.tsx`:

```tsx
import { ObsidianTemplateSettings } from '../../../shared/appSettings';
import { DailyTemplate, ReportTemplate } from '../../../shared/aiReview/sectionConfig';

type TemplateKind = 'daily' | 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly';

function previewDaily(template?: DailyTemplate): string {
  const fixed = template?.fixedBlocks?.map((b) => b.displayName) ?? ['今日工作', '灵感随笔', '每日任务'];
  const custom = template?.customBlocks?.map((b) => b.name) ?? [];
  return [...fixed, ...custom].slice(0, 4).join(' · ') + ([...fixed, ...custom].length > 4 ? ' · …' : '');
}

function previewReport(template?: ReportTemplate): string {
  const names = template?.customBlocks?.map((b) => b.name) ?? [];
  return names.length ? names.slice(0, 4).join(' · ') + (names.length > 4 ? ' · …' : '') : '默认模板';
}

export function TemplatesTab({
  obsidianTemplates,
  onEditTemplate,
}: {
  obsidianTemplates: ObsidianTemplateSettings;
  onEditTemplate?: (kind: TemplateKind) => void;
}) {
  const rows: Array<{ kind: TemplateKind; label: string; preview: string; group: 'personal' | 'external' }> = [
    { kind: 'daily', label: '日报模板', preview: previewDaily(obsidianTemplates.dailyTemplate), group: 'personal' },
    { kind: 'personalWeekly', label: '个人周报模板', preview: previewReport(obsidianTemplates.weeklyTemplate), group: 'personal' },
    { kind: 'personalMonthly', label: '个人月报模板', preview: previewReport(obsidianTemplates.monthlyTemplate), group: 'personal' },
    { kind: 'externalWeekly', label: '对外周报模板', preview: previewReport(obsidianTemplates.externalWeeklyTemplate), group: 'external' },
    { kind: 'externalMonthly', label: '对外月报模板', preview: previewReport(obsidianTemplates.externalMonthlyTemplate), group: 'external' },
  ];
  return (
    <div className="settings-v2-tab-stack">
      {(['personal', 'external'] as const).map((group) => (
        <section key={group} className="settings-v2-section-card">
          <h2>{group === 'personal' ? '个人' : '对外'}</h2>
          {rows.filter((row) => row.group === group).map((row) => (
            <div key={row.kind} className="settings-field-row">
              <span><strong>{row.label}</strong><small>{row.preview}</small></span>
              <button type="button" className="settings-link-button" onClick={() => onEditTemplate?.(row.kind)}>编辑 →</button>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Create `AiReviewTab.tsx`**

Move `AiAccountZone` or export it from `SettingsPanel.tsx`, then create `app/src/components/settings/AiReviewTab.tsx`:

```tsx
export function AiReviewTab({
  text,
  settings,
  onSettingsChange,
  selectedDate,
  tasks,
}: {
  text: ReturnType<typeof getShellText>['settings']['aiReview'];
  settings: AiReviewSettings;
  onSettingsChange: (settings: AiReviewSettings) => void;
  selectedDate: string;
  tasks: Task[];
}) {
  return (
    <div className="settings-v2-tab-stack">
      {/* Account section: current model/account + manage accounts */}
      {/* Personal automatic generation: weeklyTimerEnabled/monthlyTimerEnabled, sub-row hidden when off */}
      {/* External automatic generation: externalWeeklyTimerEnabled/externalMonthlyTimerEnabled, sub-row hidden when off */}
      {/* Manual generation grid: generate weekly/monthly/external weekly/external monthly/regenerate today */}
    </div>
  );
}
```

Manual buttons should call the existing bridge methods:

```ts
void window.electronAPI?.aiReview?.generateWeekly(selectedDate, tasks);
void window.electronAPI?.aiReview?.generateMonthly(selectedDate, tasks);
void window.electronAPI?.aiReview?.generateExternal('weekly', selectedDate);
void window.electronAPI?.aiReview?.generateExternal('monthly', selectedDate);
void window.electronAPI?.aiReview?.runForDate(selectedDate, tasks);
```

- [ ] **Step 8: Create `ScheduleTab.tsx` and `GeneralTab.tsx`**

Create `ScheduleTab` with rollover and cleanup props:

```tsx
export function ScheduleTab({ appSettings, selectedDate, completedCount, onAppSettingsChange, onClearCompleted }: {
  appSettings: AppBehaviorSettings;
  selectedDate: string;
  completedCount: number;
  onAppSettingsChange: (settings: AppBehaviorSettings) => void;
  onClearCompleted: () => void;
}) {
  return (
    <div className="settings-v2-tab-stack">
      {/* rolloverTime input */}
      {/* autoCarryUnfinished toggle */}
      {/* clear completed full-width button */}
    </div>
  );
}
```

Create `GeneralTab` with language and window controls:

```tsx
export function GeneralTab({ appSettings, onAppSettingsChange }: {
  appSettings: AppBehaviorSettings;
  onAppSettingsChange: (settings: AppBehaviorSettings) => void;
}) {
  return (
    <div className="settings-v2-tab-stack">
      {/* language select */}
      {/* always on top toggle using window.electronAPI.getAlwaysOnTop/toggleAlwaysOnTop */}
      {/* AutoStartToggle */}
      {/* minimize to tray if that setting exists in AppBehaviorSettings */}
    </div>
  );
}
```

Move `AutoStartToggle` into `GeneralTab.tsx` if only used there.

- [ ] **Step 9: Wire tab rendering in `SettingsPanel.tsx`**

Replace placeholder content with:

```tsx
{activeTab === 'appearance' && <AppearanceTab settings={settings} text={text} onApplyTheme={onApplyTheme} onChange={onChange} />}
{activeTab === 'sync' && <SyncTab text={text} obsidianTemplates={obsidianTemplates} obsidianPath={obsidianPath} syncPreview={syncPreview} onChange={onObsidianTemplatesChange} onChooseObsidian={onChooseObsidian} onPreviewSync={onPreviewSync} />}
{activeTab === 'templates' && <TemplatesTab obsidianTemplates={obsidianTemplates} onEditTemplate={onEditTemplate} />}
{activeTab === 'aiReview' && <AiReviewTab text={text.aiReview} settings={aiReviewSettings} onSettingsChange={setAiReviewSettings} selectedDate={selectedDate} tasks={tasks} />}
{activeTab === 'schedule' && <ScheduleTab appSettings={appSettings} selectedDate={selectedDate} completedCount={completedCount} onAppSettingsChange={onAppSettingsChange} onClearCompleted={onClearCompleted} />}
{activeTab === 'general' && <GeneralTab appSettings={appSettings} onAppSettingsChange={onAppSettingsChange} />}
```

If `SettingsPanel` currently owns `aiReviewSettings` state internally, keep that state and pass it to `AiReviewTab`. If `App.tsx` already owns it, pass through props instead. Do not create a second source of truth.

- [ ] **Step 10: Add tab CSS and missing labels**

Add CSS:

```css
.settings-v2-tab-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-link-button {
  border: 0;
  background: transparent;
  color: var(--personal-accent, #3c3489);
  font-size: 13px;
  cursor: pointer;
}

.settings-path-accordion details {
  border-bottom: 0.5px solid var(--color-border-tertiary);
}

.settings-path-accordion details:last-child {
  border-bottom: 0;
}

.settings-path-accordion summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  min-height: 42px;
  padding: 9px 0;
  cursor: pointer;
}

.settings-manual-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.settings-manual-grid .is-wide {
  grid-column: 1 / -1;
}
```

Add missing i18n labels only when a tab needs them. Keep zh/en shapes identical.

- [ ] **Step 11: Run verification and typecheck**

Run:

```bash
npm --prefix app run verify:settings-v2-tabs
npm --prefix app run typecheck
```

Expected: both PASS.

- [ ] **Step 12: Commit**

```bash
git add app/scripts/verify-settings-v2-tabs.ts app/src/components/SettingsPanel.tsx app/src/components/settings app/src/i18n.ts app/src/styles/globals.css app/package.json
git commit -m "feat(settings): split settings into v2 tabs"
```

---

### Task 5: Decompose Companion and remove Mobile Inbox

**Files:**
- Create: `app/scripts/verify-settings-v2-companion.ts`
- Create/Modify: `app/src/components/settings/DeveloperTab.tsx`
- Modify: `app/src/components/SettingsPanel.tsx`
- Modify: `app/src/App.tsx`
- Modify: `app/electron/main.ts`
- Modify: `app/electron/preload.ts`
- Modify: `app/src/vite-env.d.ts`
- Modify: `app/src/store/taskStore.ts`
- Modify: `app/shared/obsidianCompanion.ts`
- Modify: `app/shared/obsidianCompanionDefaults.ts`
- Modify: `app/electron/obsidianCompanion.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Write the failing verification script**

Create `app/scripts/verify-settings-v2-companion.ts`:

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd().endsWith('app') ? process.cwd() : join(process.cwd(), 'app');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const main = readFileSync(join(root, 'electron/main.ts'), 'utf8');
const preload = readFileSync(join(root, 'electron/preload.ts'), 'utf8');
const viteEnv = readFileSync(join(root, 'src/vite-env.d.ts'), 'utf8');
const store = readFileSync(join(root, 'src/store/taskStore.ts'), 'utf8');
const companion = readFileSync(join(root, 'shared/obsidianCompanion.ts'), 'utf8');
const defaults = readFileSync(join(root, 'shared/obsidianCompanionDefaults.ts'), 'utf8');
const electronCompanion = readFileSync(join(root, 'electron/obsidianCompanion.ts'), 'utf8');
const developer = readFileSync(join(root, 'src/components/settings/DeveloperTab.tsx'), 'utf8');
const panel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');

assert.doesNotMatch(app, /<ObsidianCompanionPanel/, 'App must not render ObsidianCompanionPanel');
assert.doesNotMatch(app, /from '\.\/components\/ObsidianCompanionPanel'/, 'App must not import ObsidianCompanionPanel');
for (const source of [main, preload, viteEnv, store, companion, defaults, electronCompanion]) {
  assert.doesNotMatch(source, /importMobileInbox|mobileInboxPath|companion:importMobileInbox/, 'Mobile Inbox API/field must be removed');
}
assert.match(main, /companion:previewSync/, 'preview sync IPC must remain');
assert.match(main, /companion:writeSync/, 'write sync IPC must remain');
assert.match(developer, /companionSettings\.rules/, 'DeveloperTab must edit companion rules');
assert.match(developer, /companionSettings\.templates/, 'DeveloperTab must edit companion templates');
assert.match(developer, /previewCompanionSync/, 'DeveloperTab must provide preview sync');
assert.match(developer, /writeCompanionSync/, 'DeveloperTab must provide write sync');
assert.match(panel, /<DeveloperTab/, 'SettingsPanel must render DeveloperTab');

console.log('settings v2 companion verification passed');
```

- [ ] **Step 2: Add the npm script**

Modify `app/package.json` scripts:

```json
"verify:settings-v2-companion": "tsx scripts/verify-settings-v2-companion.ts"
```

- [ ] **Step 3: Run verification and confirm it fails**

Run:

```bash
npm --prefix app run verify:settings-v2-companion
```

Expected: FAIL because `App.tsx` still renders `ObsidianCompanionPanel` and Mobile Inbox still exists.

- [ ] **Step 4: Create `DeveloperTab.tsx`**

Create `app/src/components/settings/DeveloperTab.tsx`:

```tsx
import { useState } from 'react';
import { CompanionSettings, CaptureItem, SyncPlan } from '../../../shared/obsidianCompanion';

export function DeveloperTab({
  companionSettings,
  captureItems,
  onCompanionSettingsChange,
}: {
  companionSettings: CompanionSettings;
  captureItems: CaptureItem[];
  onCompanionSettingsChange: (settings: CompanionSettings) => void;
}) {
  const [plan, setPlan] = useState<SyncPlan | null>(null);
  const [status, setStatus] = useState('');

  const preview = async () => {
    const next = await window.electronAPI.previewCompanionSync(companionSettings, captureItems);
    setPlan(next);
    setStatus(next.ok ? '预览完成' : next.errors.join('\n'));
  };

  const write = async () => {
    const result = await window.electronAPI.writeCompanionSync(companionSettings, captureItems);
    setStatus(result.ok ? '同步完成' : result.errors.join('\n'));
  };

  return (
    <div className="settings-v2-tab-stack">
      <section className="settings-v2-section-card">
        <h2>工具</h2>
        <div className="settings-manual-grid">
          <button type="button">重置模板草稿</button>
          <button type="button">代码结构说明</button>
        </div>
      </section>

      <section className="settings-v2-section-card">
        <h2>Obsidian 同步规则</h2>
        {companionSettings.rules.map((rule) => (
          <details key={rule.id}>
            <summary>{rule.name}<small>目标 · 区块 · 模式 · 优先级</small></summary>
            <label className="settings-field-row"><span>启用</span><input type="checkbox" checked={rule.enabled} onChange={(event) => onCompanionSettingsChange({ ...companionSettings, rules: companionSettings.rules.map((item) => item.id === rule.id ? { ...item, enabled: event.target.checked } : item) })} /></label>
            <label className="settings-field-row"><span>目标文件</span><input value={rule.write.target} onChange={(event) => onCompanionSettingsChange({ ...companionSettings, rules: companionSettings.rules.map((item) => item.id === rule.id ? { ...item, write: { ...item.write, target: event.target.value } } : item) })} /></label>
            <label className="settings-field-row"><span>区块标题</span><input value={rule.write.section ?? ''} onChange={(event) => onCompanionSettingsChange({ ...companionSettings, rules: companionSettings.rules.map((item) => item.id === rule.id ? { ...item, write: { ...item.write, section: event.target.value } } : item) })} /></label>
          </details>
        ))}
      </section>

      <section className="settings-v2-section-card">
        <h2>底层模板变量</h2>
        {companionSettings.templates.map((template) => (
          <label key={template.id} className="settings-field-row">
            <span><strong>{template.name}</strong><small>{template.id}</small></span>
            <textarea value={template.body} onChange={(event) => onCompanionSettingsChange({ ...companionSettings, templates: companionSettings.templates.map((item) => item.id === template.id ? { ...item, body: event.target.value } : item) })} />
          </label>
        ))}
      </section>

      <section className="settings-v2-section-card">
        <h2>同步预览</h2>
        <div className="settings-manual-grid">
          <button type="button" onClick={preview}>预览同步</button>
          <button type="button" onClick={write}>立即同步</button>
        </div>
        {status && <p>{status}</p>}
        {plan && <p>{plan.changes.length} 个变更，{plan.unmatchedItems.length} 个未匹配项目。</p>}
      </section>
    </div>
  );
}
```

This is the minimal working version. Task 6 will replace hardcoded labels with i18n.

- [ ] **Step 5: Wire Developer tab through `SettingsPanel.tsx`**

Add props to `SettingsPanelProps`:

```ts
companionSettings: CompanionSettings;
captureItems: CaptureItem[];
onCompanionSettingsChange: (settings: CompanionSettings) => void;
```

Import types:

```ts
import type { CompanionSettings, CaptureItem } from '../../shared/obsidianCompanion';
import { DeveloperTab } from './settings/DeveloperTab';
```

Render:

```tsx
{activeTab === 'developer' && (
  <DeveloperTab
    companionSettings={companionSettings}
    captureItems={captureItems}
    onCompanionSettingsChange={onCompanionSettingsChange}
  />
)}
```

- [ ] **Step 6: Stop rendering the old Companion panel in `App.tsx`**

Remove:

```ts
import { ObsidianCompanionPanel } from './components/ObsidianCompanionPanel';
```

Remove the `<ObsidianCompanionPanel ... />` JSX block.

Pass companion data to `SettingsPanel`:

```tsx
<SettingsPanel
  ...existingProps
  companionSettings={companionSettings}
  captureItems={getCurrentCaptureItems()}
  onCompanionSettingsChange={updateCompanionSettings}
/>
```

Change `onOpenCompanionSettings` handling to select the Developer tab if that callback still exists, or remove the prop entirely if no caller remains.

- [ ] **Step 7: Remove Mobile Inbox from shared and Electron code**

In `app/shared/obsidianCompanion.ts`, remove from `CompanionSettings`:

```ts
mobileInboxPath: string;
```

In `app/shared/obsidianCompanionDefaults.ts`, remove:

```ts
mobileInboxPath: '',
```

In `app/electron/obsidianCompanion.ts`, delete:

```ts
export function importMobileInbox(...) { ... }
```

and any imports used only by it.

In `app/electron/main.ts`, remove `importMobileInbox` from imports and delete:

```ts
ipcMain.handle('companion:importMobileInbox', ...)
```

In `app/electron/preload.ts`, remove:

```ts
importMobileInbox: (inboxPath: string) => ipcRenderer.invoke('companion:importMobileInbox', inboxPath),
```

In `app/src/vite-env.d.ts`, remove the `importMobileInbox` API type.

In `app/src/store/taskStore.ts`, remove the `importMobileInbox` wrapper/export.

- [ ] **Step 8: Remove old App mobile inbox handlers**

In `app/src/App.tsx`, remove imports and functions only used by Mobile Inbox:

```ts
importMobileInbox
handleImportMobileInbox
```

Also remove references to `companionSettings.mobileInboxPath`.

- [ ] **Step 9: Run verification and typecheck**

Run:

```bash
npm --prefix app run verify:settings-v2-companion
npm --prefix app run typecheck
```

Expected: both PASS.

- [ ] **Step 10: Commit**

```bash
git add app/scripts/verify-settings-v2-companion.ts app/src/components/settings/DeveloperTab.tsx app/src/components/SettingsPanel.tsx app/src/App.tsx app/electron/main.ts app/electron/preload.ts app/src/vite-env.d.ts app/src/store/taskStore.ts app/shared/obsidianCompanion.ts app/shared/obsidianCompanionDefaults.ts app/electron/obsidianCompanion.ts app/package.json
git commit -m "feat(settings): move companion tools to developer tab"
```

---

### Task 6: Localize all v2 settings and Developer strings

**Files:**
- Create: `app/scripts/verify-settings-v2-i18n.ts`
- Modify: `app/src/i18n.ts`
- Modify: `app/src/components/settings/DeveloperTab.tsx`
- Modify: `app/src/components/settings/SyncTab.tsx`
- Modify: `app/src/components/settings/TemplatesTab.tsx`
- Modify: `app/src/components/settings/AiReviewTab.tsx`
- Modify: `app/src/components/settings/ScheduleTab.tsx`
- Modify: `app/src/components/settings/GeneralTab.tsx`
- Modify: `app/package.json`

- [ ] **Step 1: Write the failing verification script**

Create `app/scripts/verify-settings-v2-i18n.ts`:

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd().endsWith('app') ? process.cwd() : join(process.cwd(), 'app');
const i18n = readFileSync(join(root, 'src/i18n.ts'), 'utf8');
const files = [
  'DeveloperTab.tsx',
  'SyncTab.tsx',
  'TemplatesTab.tsx',
  'AiReviewTab.tsx',
  'ScheduleTab.tsx',
  'GeneralTab.tsx',
].map((file) => readFileSync(join(root, 'src/components/settings', file), 'utf8'));

const requiredKeys = [
  'settingsV2', 'groups', 'tabs', 'appearance', 'sync', 'templates', 'aiReview', 'schedule', 'general', 'developer',
  'developerTools', 'obsidianRules', 'lowLevelTemplates', 'syncPreview', 'previewSync', 'writeSync',
  'vaultPath', 'chooseVault', 'dailyPath', 'weeklyPath', 'monthlyPath', 'externalWeeklyPath', 'externalMonthlyPath',
  'personalTemplates', 'externalTemplates', 'editTemplate', 'manualGenerate', 'regenerateToday',
];
for (const key of requiredKeys) {
  assert.match(i18n, new RegExp(`${key}:`), `missing i18n key ${key}`);
}
for (const source of files) {
  assert.doesNotMatch(source, />重置模板草稿<|>代码结构说明<|>Obsidian 同步规则<|>底层模板变量<|>预览同步<|>立即同步</, 'settings tab files must not hardcode Chinese labels');
  assert.doesNotMatch(source, />Preview sync<|>Sync now</, 'settings tab files must not hardcode English labels');
}

console.log('settings v2 i18n verification passed');
```

- [ ] **Step 2: Add the npm script**

Modify `app/package.json` scripts:

```json
"verify:settings-v2-i18n": "tsx scripts/verify-settings-v2-i18n.ts"
```

- [ ] **Step 3: Run verification and confirm it fails**

Run:

```bash
npm --prefix app run verify:settings-v2-i18n
```

Expected: FAIL because `DeveloperTab` still has hardcoded labels.

- [ ] **Step 4: Add complete i18n keys**

In `app/src/i18n.ts`, under `settings.settingsV2`, add matching zh/en nested keys:

Chinese:

```ts
sections: {
  obsidian: 'Obsidian',
  paths: '路径设置',
  personalTemplates: '个人',
  externalTemplates: '对外',
  account: '账号',
  personalAuto: '个人自动生成',
  externalAuto: '对外自动生成',
  manualGenerate: '手动生成',
  dailySwitch: '每日切换',
  cleanup: '清理已完成',
  language: '语言',
  window: '窗口',
  developerTools: '工具',
  obsidianRules: 'Obsidian 同步规则',
  lowLevelTemplates: '底层模板变量',
  syncPreview: '同步预览',
},
fields: {
  vaultPath: 'Vault 路径',
  chooseVault: '选择 Vault',
  syncDeletedReviews: '同步删除的完成记录',
  confirmBeforeDeletingReview: '删除前确认',
  dailyPath: '日报路径',
  weeklyPath: '个人周报路径',
  monthlyPath: '个人月报路径',
  externalWeeklyPath: '对外周报路径',
  externalMonthlyPath: '对外月报路径',
  editTemplate: '编辑 →',
  weeklyTimer: '个人周报自动生成',
  monthlyTimer: '个人月报自动生成',
  externalWeeklyTimer: '对外周报自动生成',
  externalMonthlyTimer: '对外月报自动生成',
  generateWeekly: '生成个人周报',
  generateMonthly: '生成个人月报',
  generateExternalWeekly: '生成对外周报',
  generateExternalMonthly: '生成对外月报',
  regenerateToday: '重新生成今日日报',
  rolloverTime: 'Rollover time',
  autoCarryUnfinished: '自动结转未完成任务',
  clearCompleted: '清理已完成',
  language: 'Language',
  alwaysOnTop: '置顶显示',
  autoStart: '开机自启动',
  minimizeToTray: '关闭时最小化到托盘',
  resetTemplateDrafts: '重置模板草稿',
  codeStructure: '代码结构说明',
  ruleTarget: '目标文件',
  ruleSection: '区块标题',
  ruleMode: '模式',
  rulePriority: '优先级',
  ruleAfterMatch: '匹配后',
  previewSync: '预览同步',
  writeSync: '立即同步',
},
status: {
  previewDone: '预览完成',
  syncDone: '同步完成',
  unmatchedItems: '个未匹配项目',
  changedItems: '个变更',
}
```

English: mirror the same keys with English values.

- [ ] **Step 5: Replace hardcoded labels in tab files**

Pass `text.settingsV2` into every tab that needs labels. Example for `DeveloperTab`:

```tsx
type SettingsV2Text = ReturnType<typeof getShellText>['settings']['settingsV2'];

export function DeveloperTab({ text, companionSettings, captureItems, onCompanionSettingsChange }: {
  text: SettingsV2Text;
  companionSettings: CompanionSettings;
  captureItems: CaptureItem[];
  onCompanionSettingsChange: (settings: CompanionSettings) => void;
}) {
  return <h2>{text.sections.obsidianRules}</h2>;
}
```

Apply the same pattern to Sync/Templates/AI/Schedule/General so labels come from i18n instead of inline Chinese/English.

- [ ] **Step 6: Run verification, typecheck, and i18n smoke check**

Run:

```bash
npm --prefix app run verify:settings-v2-i18n
npm --prefix app run typecheck
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add app/scripts/verify-settings-v2-i18n.ts app/src/i18n.ts app/src/components/settings app/src/components/SettingsPanel.tsx app/package.json
git commit -m "feat(settings): localize v2 settings"
```

---

### Task 7: Vault path single-source migration

**Files:**
- Modify: `app/scripts/verify-settings-v2-companion.ts`
- Modify: `app/src/App.tsx`
- Modify: `app/src/components/settings/SyncTab.tsx`
- Modify: `app/src/components/settings/DeveloperTab.tsx`
- Modify: `app/shared/obsidianCompanionDefaults.ts`

- [ ] **Step 1: Extend verification for vault merge**

In `app/scripts/verify-settings-v2-companion.ts`, add:

```ts
assert.match(app, /vaultPath:\s*obsidianTemplates\.obsidianPath|obsidianPath:\s*companionSettings\.vaultPath/, 'App must migrate/merge companion vaultPath with obsidianTemplates.obsidianPath');
assert.match(app, /setCompanionSettings[\s\S]*vaultPath/, 'App must sync obsidian vault path back into companionSettings for preview/write');
```

- [ ] **Step 2: Run verification and confirm it fails if merge is missing**

Run:

```bash
npm --prefix app run verify:settings-v2-companion
```

Expected: FAIL unless Task 5 already implemented the merge.

- [ ] **Step 3: Migrate Companion vault to Obsidian path on load**

In `app/src/App.tsx`, after both `obsidianTemplates` and `companionSettings` are loaded, add an effect:

```tsx
useEffect(() => {
  if (!obsidianTemplates.obsidianPath && companionSettings.vaultPath) {
    const nextTemplates = { ...obsidianTemplates, obsidianPath: companionSettings.vaultPath };
    setObsidianTemplatesState(nextTemplates);
    void window.electronAPI?.setObsidianTemplateSettings(nextTemplates);
  }
}, [obsidianTemplates, companionSettings.vaultPath]);
```

Use the actual local setter names in `App.tsx`; do not create duplicate state.

- [ ] **Step 4: Sync Obsidian path writes back to Companion settings**

Where `App.tsx` handles Obsidian path selection or `onObsidianTemplatesChange`, ensure every write to `obsidianTemplates.obsidianPath` also updates Companion:

```ts
const syncVaultPathToCompanion = async (vaultPath: string) => {
  const nextCompanion = { ...companionSettings, vaultPath };
  setCompanionSettingsState(nextCompanion);
  await window.electronAPI?.setCompanionSettings(nextCompanion);
};
```

When the user chooses a vault:

```ts
const vaultPath = await window.electronAPI.chooseObsidianPath();
if (vaultPath) {
  const nextTemplates = { ...obsidianTemplates, obsidianPath: vaultPath };
  await updateObsidianTemplates(nextTemplates);
  await syncVaultPathToCompanion(vaultPath);
}
```

Use existing helper names if they already exist.

- [ ] **Step 5: Ensure Developer preview/write receives vault path**

When passing `companionSettings` to `DeveloperTab`, pass a merged value:

```tsx
const developerCompanionSettings = {
  ...companionSettings,
  vaultPath: obsidianTemplates.obsidianPath || companionSettings.vaultPath,
};
```

Then:

```tsx
<SettingsPanel
  ...existingProps
  companionSettings={developerCompanionSettings}
/>
```

- [ ] **Step 6: Run verification and typecheck**

Run:

```bash
npm --prefix app run verify:settings-v2-companion
npm --prefix app run typecheck
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add app/scripts/verify-settings-v2-companion.ts app/src/App.tsx app/src/components/settings/SyncTab.tsx app/src/components/settings/DeveloperTab.tsx app/shared/obsidianCompanionDefaults.ts
git commit -m "fix(settings): unify Obsidian vault path"
```

---

### Task 8: Final verification, cleanup, and dev-app manual test

**Files:**
- Modify: `app/package.json`
- Modify: any files needed to fix verification/typecheck issues.

- [ ] **Step 1: Add aggregate verify script**

Modify `app/package.json` scripts:

```json
"verify:settings-v2": "npm run verify:settings-v2-ai-account && npm run verify:settings-v2-window-mode && npm run verify:settings-v2-layout && npm run verify:settings-v2-tabs && npm run verify:settings-v2-companion && npm run verify:settings-v2-i18n"
```

- [ ] **Step 2: Run all v2 verification scripts**

Run:

```bash
npm --prefix app run verify:settings-v2
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm --prefix app run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run existing focused regressions**

Run:

```bash
npm --prefix app run verify:template-hub-rewrite
npm --prefix app run verify:ai-settings
npm --prefix app run verify:profile-ops
npm --prefix app run verify:companion
npm --prefix app run verify:settings-sync
```

Expected: all PASS. If `verify:companion` fails because it still expects Mobile Inbox, update `app/electron/obsidianCompanion.verify.ts` to remove Mobile Inbox expectations and keep preview/write assertions.

- [ ] **Step 5: Launch the app for manual UI verification**

Run:

```bash
npm --prefix app run dev
```

Manual checks:

1. Open settings: main window widens to about 720px.
2. Close settings: main window returns to previous width.
3. Change theme in 外观: settings overlay colors update immediately.
4. Sidebar shows 常用 / 系统 / 高级 and seven tabs.
5. 同步 tab: Vault button works; five path accordions edit the correct fields.
6. 模板 tab: all five `编辑 →` links open the template editor.
7. AI 复盘 tab: account manager opens in Chinese; new account saves `maxTokens`; four timer toggles hide/show sub-rows; manual buttons are separate.
8. 日程 tab: rollover and clear-completed controls work.
9. 通用 tab: language/window settings work.
10. 开发者 tab: rules/templates/preview are Chinese; Mobile Inbox is gone.

- [ ] **Step 6: Fix any manual issues and rerun checks**

After fixes, rerun:

```bash
npm --prefix app run verify:settings-v2
npm --prefix app run typecheck
```

Expected: both PASS.

- [ ] **Step 7: Commit final cleanup**

```bash
git add app/package.json app/electron/obsidianCompanion.verify.ts app/src app/electron app/shared app/scripts
git commit -m "test(settings): verify settings v2 redesign"
```

---

## Self-Review Notes

### Spec coverage

- Window strategy: Task 2 adds `window:setSettingsMode`, 720px width, min-width changes, work-area clamping, and App open/close calls.
- Theme following: Task 3 adds CSS token mappings referencing existing personalization variables; Task 8 manually verifies live theme changes.
- Two-column layout: Task 3 creates the overlay shell, fixed sidebar, sticky header, and field/sub-row CSS.
- Seven tabs: Task 3 creates navigation; Task 4 implements user-facing tabs; Task 5 implements Developer tab.
- AI account repair: Task 1 deletes `AiReviewSection`, fixes `text={text}`, and changes `outputTokens` to `maxTokens`.
- Companion decomposition: Task 5 removes old panel rendering and Mobile Inbox; Developer tab receives Rules/Templates/Preview.
- Vault merge: Task 7 makes `obsidianTemplates.obsidianPath` the user-facing source and mirrors to Companion for preview/write.
- i18n: Task 6 adds zh/en keys and removes hardcoded labels from v2 tab files.
- Verification: Every task has a focused `tsx` verification script plus typecheck; Task 8 runs aggregate and manual app checks.

### Placeholder scan

No `TBD`, `TODO`, `implement later`, or empty “write tests” steps remain. Some migration steps intentionally say “use existing helper names if already present” because `App.tsx` already has local state/helper names that must be preserved rather than duplicated; the required code shape and behavior are specified.

### Type consistency

- AI profile uses `maxTokens`, matching `app/shared/aiReview/aiReviewSettings.ts`.
- Settings tabs use `SettingsV2Tab = 'appearance' | 'sync' | 'templates' | 'aiReview' | 'schedule' | 'general' | 'developer'` consistently.
- Companion still uses `CompanionSettings.rules/templates` and preview/write APIs; only `mobileInboxPath/importMobileInbox` is removed.
- External report manual generation uses existing `generateExternal('weekly' | 'monthly', selectedDate)` API.
