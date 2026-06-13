# Personalization Glass Opacity and Radius Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework DailyTodo Personalization so radius is global, opacity is area-based with theme recommendations, transparent surfaces use frosted glass, review buttons only appear when review records exist, and minimum radius has no square corner shadow artifact.

**Architecture:** Keep the existing Electron + React + TypeScript settings flow and local Electron Store persistence. Extend the existing personalization model rather than replacing it: old opacity fields keep their current meanings where possible, while new fields add the missing Input, Dialog, and Settings Panel areas. CSS variables remain the bridge between React state and visual surfaces.

**Tech Stack:** Electron Vite, React, TypeScript, CSS variables, Electron Store, tsx verification scripts.

---

## File structure

- Modify `app/src/types/personalization.ts`
  - Add explicit seven-area opacity metadata.
  - Add new persisted fields: `inputOpacity`, `dialogOpacity`, `settingsPanelOpacity`.
  - Update defaults and theme override extraction.
- Modify `app/src/types/themePresets.ts`
  - Add recommended values for all seven areas in each visible theme preset.
  - Keep theme matching focused on stable style fields so user opacity overrides do not break selected theme identity.
- Modify `app/src/App.tsx`
  - Clamp and expose the seven area opacity variables.
  - Keep old CSS variables as aliases where existing CSS still consumes them.
  - Add new variables for input, dialog, settings panel, and glass intensity.
- Modify `app/src/components/SettingsPanel.tsx`
  - Remove separate theme opacity edit pages from the Personalization path.
  - Move corner radius into the same global section as font size.
  - Add read-only selected-theme recommendation chips.
  - Add collapsed seven-area fine-tuning controls, each with a reset-to-recommendation button.
- Modify `app/src/components/TaskItem.tsx`
  - Main task and subtask review buttons render only when `hasTaskReview(...)` is true.
  - Remove empty-review button state from this component path.
- Modify `app/src/styles/globals.css`
  - Add reusable glass surface treatment using opacity CSS variables and backdrop blur.
  - Wire app shell, top bar, task cards, inputs, dialogs, menus, and settings panel to the new variables.
  - Tighten clipping/radius alignment for the app viewport, shell, scroll layer, and theme backgrounds.
- Modify `app/src/i18n.ts`
  - Add labels for Global appearance, Opacity recommendations, Area fine tuning, seven area names, and reset-to-recommendation actions.
- Modify `app/scripts/verify-ux-polish.ts`
  - Add string-level guards for the new settings structure, review-button visibility rule, and glass/radius CSS hooks.

---

### Task 1: Extend personalization opacity model

**Files:**
- Modify: `app/src/types/personalization.ts`

- [ ] **Step 1: Replace the opacity field section in `PersonalizationSettings`**

Use these fields so the seven UI areas are explicit while old stored settings still load correctly through `DEFAULT_PERSONALIZATION` merging.

```ts
export interface PersonalizationSettings {
  windowOpacity: number;
  panelOpacity: number;
  blurStrength: number;
  radius: number;
  accentColor: string;
  secondaryColor: string;
  layoutDensity: LayoutDensity;
  texture: boolean;
  animations: boolean;
  themeId?: string; // 记录用户选择的主题 ID，即使参数被修改也保持主题样式
  topOpacity?: number;              // 顶栏按钮与顶部区域
  cardOpacity?: number;             // 任务卡片
  controlOpacity?: number;          // 旧版控件透明度，作为输入框默认兼容值
  menuOpacity?: number;             // 菜单
  inputOpacity?: number;            // 输入框和编辑器
  dialogOpacity?: number;           // 弹窗
  settingsPanelOpacity?: number;    // 设置面板
  alwaysOnTop?: boolean;            // 窗口置顶
  fontScale?: number;               // 全局字体缩放（百分比，100 = 默认）
}
```

- [ ] **Step 2: Replace opacity key definitions with seven-area metadata**

Put this below the interface. The `settingKey` values are the persisted properties; the labels are used by SettingsPanel.

```ts
export const OPACITY_AREAS = [
  { key: 'home', settingKey: 'windowOpacity', labelZh: '主页背景', labelEn: 'Home background' },
  { key: 'card', settingKey: 'cardOpacity', labelZh: '任务卡', labelEn: 'Task card' },
  { key: 'input', settingKey: 'inputOpacity', labelZh: '输入框', labelEn: 'Input' },
  { key: 'top', settingKey: 'topOpacity', labelZh: '顶栏按钮', labelEn: 'Top-bar buttons' },
  { key: 'dialog', settingKey: 'dialogOpacity', labelZh: '弹窗', labelEn: 'Dialogs' },
  { key: 'menu', settingKey: 'menuOpacity', labelZh: '菜单', labelEn: 'Menus' },
  { key: 'settings', settingKey: 'settingsPanelOpacity', labelZh: '设置面板', labelEn: 'Settings panel' },
] as const;

export type OpacityAreaKey = (typeof OPACITY_AREAS)[number]['key'];
export type OpacityKey = (typeof OPACITY_AREAS)[number]['settingKey'];
```

- [ ] **Step 3: Keep `ThemeOpacityOverride` and `extractOpacityOverride` aligned with the new key list**

Replace the old `OPACITY_KEYS` loop with this code.

```ts
export const OPACITY_KEYS = OPACITY_AREAS.map((area) => area.settingKey);

/** 单个主题的透明度覆盖值（仅保存被定义过的字段）。 */
export type ThemeOpacityOverride = Partial<Pick<PersonalizationSettings, OpacityKey>>;

/** 从一份完整设置中提取已定义的透明度字段。 */
export function extractOpacityOverride(settings: PersonalizationSettings): ThemeOpacityOverride {
  const override: ThemeOpacityOverride = {};
  for (const key of OPACITY_KEYS) {
    const value = settings[key];
    if (typeof value === 'number') {
      override[key] = value;
    }
  }
  return override;
}
```

- [ ] **Step 4: Update `DEFAULT_PERSONALIZATION` with the missing area defaults**

Keep the existing values and add these fields near the other opacity defaults.

```ts
export const DEFAULT_PERSONALIZATION: PersonalizationSettings = {
  windowOpacity: 70,
  panelOpacity: 60,
  blurStrength: 24,
  radius: 28,
  accentColor: '#2C2C2E',
  secondaryColor: '#8E8E93',
  layoutDensity: 'comfortable',
  texture: false,
  animations: true,
  themeId: undefined,
  topOpacity: 90,
  cardOpacity: 86,
  controlOpacity: 90,
  menuOpacity: 96,
  inputOpacity: 90,
  dialogOpacity: 94,
  settingsPanelOpacity: 92,
  fontScale: 100,
};
```

- [ ] **Step 5: Run the TypeScript check for this file**

Run from `app/`:

```bash
npm run typecheck
```

Expected: it may fail because other files still reference the old opacity model; no syntax errors should point at `src/types/personalization.ts`.

---

### Task 2: Fill theme recommendations for all seven opacity areas

**Files:**
- Modify: `app/src/types/themePresets.ts`

- [ ] **Step 1: Add missing opacity values to `minimal` preset**

Update the `minimal.settings` object to include all seven persisted area values.

```ts
settings: {
  windowOpacity: 70,
  panelOpacity: 60,
  blurStrength: 24,
  radius: 28,
  accentColor: '#2C2C2E',
  secondaryColor: '#8E8E93',
  layoutDensity: 'comfortable',
  texture: false,
  animations: true,
  themeId: 'minimal',
  topOpacity: 88,
  cardOpacity: 82,
  controlOpacity: 88,
  menuOpacity: 94,
  inputOpacity: 86,
  dialogOpacity: 94,
  settingsPanelOpacity: 92,
},
```

- [ ] **Step 2: Add missing opacity values to `neumorphism` preset**

Update the existing values and add the new fields.

```ts
settings: {
  windowOpacity: 95,
  panelOpacity: 95,
  blurStrength: 6,
  radius: 20,
  accentColor: '#8B9DC3',
  secondaryColor: '#DFE4EC',
  layoutDensity: 'balanced',
  texture: false,
  animations: true,
  themeId: 'neumorphism',
  topOpacity: 95,
  cardOpacity: 95,
  controlOpacity: 95,
  menuOpacity: 98,
  inputOpacity: 96,
  dialogOpacity: 98,
  settingsPanelOpacity: 96,
},
```

- [ ] **Step 3: Add missing opacity values to `invisible` preset**

Use slightly higher dialog/menu settings so floating surfaces remain readable.

```ts
settings: {
  windowOpacity: 32,
  panelOpacity: 30,
  blurStrength: 14,
  radius: 18,
  accentColor: '#9CA3AF',
  secondaryColor: '#C0C4CC',
  layoutDensity: 'comfortable',
  texture: false,
  animations: true,
  themeId: 'invisible',
  topOpacity: 40,
  cardOpacity: 38,
  controlOpacity: 46,
  menuOpacity: 88,
  inputOpacity: 48,
  dialogOpacity: 90,
  settingsPanelOpacity: 84,
},
```

- [ ] **Step 4: Add missing opacity values to `watercolor` preset**

Keep the softer watercolor recommendation while making inputs readable.

```ts
settings: {
  windowOpacity: 85,
  panelOpacity: 80,
  blurStrength: 16,
  radius: 24,
  accentColor: '#4a6fa5',
  secondaryColor: '#7fa3c9',
  layoutDensity: 'comfortable',
  texture: true,
  animations: true,
  themeId: 'watercolor',
  topOpacity: 80,
  cardOpacity: 75,
  controlOpacity: 72,
  menuOpacity: 90,
  inputOpacity: 72,
  dialogOpacity: 92,
  settingsPanelOpacity: 88,
},
```

- [ ] **Step 5: Add complete opacity values to hidden legacy presets**

For `forest`, add:

```ts
topOpacity: 86,
cardOpacity: 82,
controlOpacity: 84,
menuOpacity: 92,
inputOpacity: 86,
dialogOpacity: 94,
settingsPanelOpacity: 90,
```

For `morandi`, add:

```ts
topOpacity: 88,
cardOpacity: 84,
controlOpacity: 86,
menuOpacity: 94,
inputOpacity: 86,
dialogOpacity: 94,
settingsPanelOpacity: 90,
```

- [ ] **Step 6: Leave `matchThemePreset` opacity-insensitive**

Confirm `matchThemePreset` does not compare `topOpacity`, `cardOpacity`, `controlOpacity`, `menuOpacity`, `inputOpacity`, `dialogOpacity`, or `settingsPanelOpacity`. This preserves the selected theme card after users fine-tune opacity.

- [ ] **Step 7: Run typecheck**

Run from `app/`:

```bash
npm run typecheck
```

Expected: any failures should be from not-yet-updated consuming files, not malformed preset objects.

---

### Task 3: Expose seven opacity CSS variables in App

**Files:**
- Modify: `app/src/App.tsx`

- [ ] **Step 1: Replace the opacity clamp block**

In the block near `const activeThemeClass`, replace the existing opacity constants with this block.

```ts
const windowOpacity = clamp(personalization.windowOpacity / 100, 0, 1);
const panelOpacity = clamp(personalization.panelOpacity / 100, 0, 1);
const topOpacity = clamp((personalization.topOpacity ?? personalization.panelOpacity) / 100, 0, 1);
const cardOpacity = clamp((personalization.cardOpacity ?? personalization.panelOpacity) / 100, 0, 1);
const inputOpacity = clamp((personalization.inputOpacity ?? personalization.controlOpacity ?? personalization.panelOpacity) / 100, 0, 1);
const dialogOpacity = clamp((personalization.dialogOpacity ?? personalization.menuOpacity ?? 94) / 100, 0, 1);
const menuOpacity = clamp((personalization.menuOpacity ?? 96) / 100, 0, 1);
const settingsPanelOpacity = clamp((personalization.settingsPanelOpacity ?? personalization.menuOpacity ?? 92) / 100, 0, 1);
const blurStrength = clamp(personalization.blurStrength, 0, 48);
const shellRadius = clamp(personalization.radius, 4, 36);
const cardRadius = clamp(personalization.radius - 4, 4, 28);
const controlRadius = clamp(personalization.radius - 8, 4, 24);
const glassSaturation = clamp(1.08 + (1 - Math.min(windowOpacity, panelOpacity)) * 0.32, 1.08, 1.4);
```

- [ ] **Step 2: Extend the root `style` variable object**

Inside the `.app-viewport` style object, keep existing variables and add these values.

```tsx
'--personal-accent': personalization.accentColor,
'--personal-secondary': personalization.secondaryColor,
'--window-opacity': windowOpacity,
'--panel-opacity': panelOpacity,
'--top-opacity': topOpacity,
'--card-opacity': cardOpacity,
'--control-opacity': inputOpacity,
'--input-opacity': inputOpacity,
'--dialog-opacity': dialogOpacity,
'--menu-opacity': menuOpacity,
'--settings-panel-opacity': settingsPanelOpacity,
'--readable-surface-opacity': clamp(Math.max(cardOpacity, inputOpacity) + 0.12, 0.62, 0.98),
'--blur-strength': `${blurStrength}px`,
'--glass-saturation': glassSaturation,
'--shell-radius': `${shellRadius}px`,
'--card-radius': `${cardRadius}px`,
'--control-radius': `${controlRadius}px`,
```

- [ ] **Step 3: Run typecheck**

Run from `app/`:

```bash
npm run typecheck
```

Expected: no errors in `App.tsx`; settings panel may still fail until later tasks update imports and field names.

---

### Task 4: Rework Personalization settings UI

**Files:**
- Modify: `app/src/components/SettingsPanel.tsx`
- Modify: `app/src/i18n.ts`

- [ ] **Step 1: Update imports**

Change the personalization import to include the opacity metadata.

```ts
import { OPACITY_AREAS, OpacityKey, PersonalizationSettings } from '../types/personalization';
```

- [ ] **Step 2: Remove theme edit sections from `SettingsSection`**

Replace the current union type with this shorter union.

```ts
type SettingsSection = 'root' | 'personalization' | 'obsidian' | 'rollover' | 'ai-review' | 'general' | 'developer' | 'window';
```

- [ ] **Step 3: Add helper functions above `SettingsPanel`**

Place these helpers after `AI_PRESETS` or near the other small helper functions.

```ts
function getThemeRecommendation(settings: PersonalizationSettings) {
  const preset = THEME_PRESETS.find((item) => item.id === settings.themeId) || THEME_PRESETS.find((item) => item.id === 'minimal');
  return preset?.settings || settings;
}

function opacityValue(settings: PersonalizationSettings, key: OpacityKey) {
  return settings[key] ?? settings.controlOpacity ?? settings.panelOpacity;
}
```

- [ ] **Step 4: Add a reset-aware opacity control component**

Put this below `RangeControl`. It reuses existing CSS classes plus one reset button.

```tsx
function OpacityAreaControl({
  label,
  hint,
  value,
  recommended,
  onChange,
  onReset,
}: {
  label: string;
  hint: string;
  value: number;
  recommended: number;
  onChange: (value: number) => void;
  onReset: () => void;
}) {
  return (
    <label className="settings-control settings-opacity-area-control">
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <div className="settings-range-row">
        <input
          type="range"
          min={20}
          max={100}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <b>{value}%</b>
        <button type="button" className="settings-mini-reset" onClick={onReset}>
          {recommended}%
        </button>
      </div>
    </label>
  );
}
```

- [ ] **Step 5: Add i18n strings for Personalization headings**

In the Chinese `settings` object in `app/src/i18n.ts`, add these keys near the existing `previewTask/windowOpacity/radius` keys.

```ts
globalAppearance: '全局外观',
globalAppearanceHint: '字体和圆角会应用到所有主题。',
opacityRecommendations: '透明度建议',
opacityRecommendationsHint: '当前主题推荐值，可在下方高级微调中覆盖。',
areaFineTuning: '区域透明度微调',
areaFineTuningHint: '透明区域会使用磨砂玻璃效果，而不是直接淡化内容。',
resetToRecommendation: '恢复建议值',
opacityAreaHints: {
  home: '影响主页底层背景和整体融入感。',
  card: '影响任务卡片的玻璃底色。',
  input: '影响新增任务、搜索和文本编辑输入区域。',
  top: '影响标题栏下方的顶部按钮和切换控件。',
  dialog: '影响完成情况、复盘等弹窗。',
  menu: '影响右键菜单和浮层菜单。',
  settings: '影响设置面板本身。',
},
```

In the English `settings` object, add the matching keys.

```ts
globalAppearance: 'Global appearance',
globalAppearanceHint: 'Font size and radius apply to every theme.',
opacityRecommendations: 'Opacity recommendations',
opacityRecommendationsHint: 'Suggested values for the selected theme. Fine tuning below overrides them.',
areaFineTuning: 'Area fine tuning',
areaFineTuningHint: 'Transparent areas use frosted glass instead of fading content.',
resetToRecommendation: 'Reset to recommendation',
opacityAreaHints: {
  home: 'Controls the home background and overall desktop blending.',
  card: 'Controls the glass surface behind task cards.',
  input: 'Controls add-task, search, and text editing inputs.',
  top: 'Controls top-bar buttons and toggles.',
  dialog: 'Controls completion and review dialogs.',
  menu: 'Controls context menus and floating menus.',
  settings: 'Controls the Settings panel surface.',
},
```

- [ ] **Step 6: Replace active theme edit button with no-op removal**

In the theme preset card rendering, remove the nested active `theme-preset-edit` button entirely. The active card should only show its visual active state; opacity editing happens below in Personalization.

- [ ] **Step 7: Replace the Personalization font section with Global appearance**

Replace the existing `字体大小` section with this section. It groups font size and corner radius.

```tsx
<section className="settings-section">
  <h3>{text.globalAppearance}</h3>
  <p className="settings-section-hint">{text.globalAppearanceHint}</p>
  <div className="settings-grid">
    <RangeControl
      label={appSettings.language === 'zh-CN' ? '全局字体' : 'Global Font'}
      hint={appSettings.language === 'zh-CN' ? '整体放大或缩小文字，100 为默认' : 'Scale all text, 100 = default'}
      value={settings.fontScale ?? 100}
      min={80}
      max={130}
      unit="%"
      onChange={(value) => updatePersonalization('fontScale', value)}
    />
    <RangeControl
      label={text.radius}
      hint={appSettings.language === 'zh-CN' ? '应用外框、卡片、输入框和弹窗共用这一组圆角' : 'Shared by the app shell, cards, inputs, and dialogs'}
      value={settings.radius}
      min={4}
      max={36}
      unit="px"
      onChange={(value) => updatePersonalization('radius', value)}
    />
  </div>
</section>
```

- [ ] **Step 8: Add selected-theme opacity recommendations**

Immediately after Global appearance, add this block.

```tsx
<section className="settings-section">
  <h3>{text.opacityRecommendations}</h3>
  <p className="settings-section-hint">{text.opacityRecommendationsHint}</p>
  <div className="settings-recommendation-grid">
    {OPACITY_AREAS.map((area) => {
      const recommendation = getThemeRecommendation(settings);
      const label = appSettings.language === 'zh-CN' ? area.labelZh : area.labelEn;
      return (
        <span key={area.key} className="settings-recommendation-chip">
          <strong>{label}</strong>
          <b>{opacityValue(recommendation, area.settingKey)}%</b>
        </span>
      );
    })}
  </div>
</section>
```

- [ ] **Step 9: Add collapsed seven-area fine tuning**

Place this after recommendations.

```tsx
<Collapsible title={text.areaFineTuning}>
  <p className="settings-section-hint">{text.areaFineTuningHint}</p>
  <div className="settings-grid">
    {OPACITY_AREAS.map((area) => {
      const recommendation = getThemeRecommendation(settings);
      const label = appSettings.language === 'zh-CN' ? area.labelZh : area.labelEn;
      const hints = text.opacityAreaHints as Record<string, string>;
      const recommended = opacityValue(recommendation, area.settingKey);
      return (
        <OpacityAreaControl
          key={area.key}
          label={label}
          hint={hints[area.key]}
          value={opacityValue(settings, area.settingKey)}
          recommended={recommended}
          onChange={(value) => updatePersonalization(area.settingKey, value)}
          onReset={() => updatePersonalization(area.settingKey, recommended)}
        />
      );
    })}
  </div>
</Collapsible>
```

- [ ] **Step 10: Remove old theme-specific opacity pages**

Delete the conditional render blocks for:

```tsx
section === 'theme-minimal'
section === 'theme-neumorphism'
section === 'theme-watercolor'
section === 'theme-invisible'
```

No UI path should call `setSection('theme-minimal')`, `setSection('theme-neumorphism')`, `setSection('theme-watercolor')`, or `setSection('theme-invisible')` after this step.

- [ ] **Step 11: Run typecheck**

Run from `app/`:

```bash
npm run typecheck
```

Expected: PASS for `SettingsPanel.tsx` and `i18n.ts`. If the `text.opacityAreaHints` type is too narrow, use the explicit cast shown above.

---

### Task 5: Make review buttons show only when review records exist

**Files:**
- Modify: `app/src/components/TaskItem.tsx`

- [ ] **Step 1: Change main task review visibility**

Replace:

```ts
const hasReviewAction = Boolean(task.completed || hasTaskReview(task));
```

with:

```ts
const hasReviewAction = hasTaskReview(task);
```

- [ ] **Step 2: Simplify main task review button label**

Replace the main review action render block with:

```tsx
{hasReviewAction && (
  <ReviewActionButton
    hasReview
    label="查看完成情况"
    onClick={onViewReview}
  />
)}
```

- [ ] **Step 3: Render subtask review button only when a review exists**

Inside `renderSubtaskTree`, add this constant after `hasChildren`.

```ts
const hasReview = hasTaskReview(subtask);
```

Replace the existing unconditional `task-subtask-review` button with this conditional block.

```tsx
{hasReview && (
  <button
    type="button"
    className="task-subtask-review task-subtask-review-active"
    onClick={() => onViewSubtaskReview(subtask)}
    aria-label="查看子任务完成情况"
    title="查看子任务完成情况"
  >
    <ReviewIcon hasReview />
  </button>
)}
```

- [ ] **Step 4: Remove empty review styling from `ReviewActionButton`**

Replace the button class line with:

```tsx
className="task-icon-action task-review-action task-review-action-visible"
```

The `hasReview` prop can stay because `ReviewIcon` still accepts it, but it is always true for this button path.

- [ ] **Step 5: Run typecheck**

Run from `app/`:

```bash
npm run typecheck
```

Expected: PASS for `TaskItem.tsx`.

---

### Task 6: Add frosted-glass CSS and align rounded clipping

**Files:**
- Modify: `app/src/styles/globals.css`

- [ ] **Step 1: Add shared glass variable defaults**

Near the existing root or app viewport styles, add fallback variables.

```css
.app-viewport {
  --input-opacity: var(--control-opacity);
  --dialog-opacity: var(--menu-opacity);
  --settings-panel-opacity: var(--menu-opacity);
  --glass-saturation: 1.18;
  --control-radius: max(4px, calc(var(--shell-radius) - 8px));
}
```

If `.app-viewport` already exists, merge these declarations into that rule instead of creating a duplicate rule far away.

- [ ] **Step 2: Tighten viewport and shell clipping**

Ensure these declarations are present in the existing `.app-viewport` and `.app-shell` rules.

```css
.app-viewport {
  overflow: hidden;
  background: transparent;
  clip-path: inset(0 round var(--shell-radius));
}

.app-shell {
  border-radius: var(--shell-radius);
  clip-path: inset(0 round var(--shell-radius));
  overflow: hidden;
  isolation: isolate;
  background-clip: padding-box;
}
```

- [ ] **Step 3: Add a reusable glass treatment block**

Place this near other shared surface styles.

```css
.app-shell,
.app-top,
.task-card,
.add-task-container,
.daily-work-panel,
.daily-work-textarea,
.task-edit-input,
.settings-panel,
.completion-dialog,
.review-dialog,
.tm-popup,
.task-menu-popup {
  backdrop-filter: blur(var(--blur-strength)) saturate(var(--glass-saturation));
  -webkit-backdrop-filter: blur(var(--blur-strength)) saturate(var(--glass-saturation));
  background-clip: padding-box;
}
```

If the dialog classes differ in the file, use the actual wrapper classes already present for `TaskCompletionDialog` and `TaskReviewDialog`, but keep both dialogs covered.

- [ ] **Step 4: Wire area opacity variables to key surfaces**

Update or add these declarations in the relevant existing class rules.

```css
.app-shell {
  background: rgba(255, 255, 255, var(--window-opacity));
}

.app-top {
  background: rgba(255, 255, 255, var(--top-opacity));
}

.task-card {
  background: rgba(255, 255, 255, var(--card-opacity));
  border-radius: var(--card-radius);
}

.add-task-container,
.daily-work-panel,
.daily-work-textarea,
.task-edit-input,
.task-list-search input {
  background: rgba(255, 255, 255, var(--input-opacity));
  border-radius: var(--control-radius);
}

.settings-panel {
  background: rgba(255, 255, 255, var(--settings-panel-opacity));
  border-radius: var(--card-radius);
}

.tm-popup,
.task-menu-popup,
.task-submenu,
.settings-floating-menu {
  background: rgba(255, 255, 255, var(--menu-opacity));
}
```

Use only selectors that exist in `globals.css`; if `settings-floating-menu` is not present, skip that selector and keep the existing menu selectors.

- [ ] **Step 5: Add dark theme equivalents**

Add or merge these dark rules so glass surfaces keep readable tint in dark mode.

```css
.dark .app-shell {
  background: rgba(15, 23, 42, var(--window-opacity));
}

.dark .app-top {
  background: rgba(15, 23, 42, var(--top-opacity));
}

.dark .task-card {
  background: rgba(24, 24, 27, var(--card-opacity));
}

.dark .add-task-container,
.dark .daily-work-panel,
.dark .daily-work-textarea,
.dark .task-edit-input,
.dark .task-list-search input {
  background: rgba(24, 24, 27, var(--input-opacity));
}

.dark .settings-panel {
  background: rgba(24, 24, 27, var(--settings-panel-opacity));
}

.dark .tm-popup,
.dark .task-menu-popup,
.dark .task-submenu,
.dark .settings-floating-menu {
  background: rgba(24, 24, 27, var(--menu-opacity));
}
```

Again, only keep selectors that exist.

- [ ] **Step 6: Add settings UI styles for recommendations and reset buttons**

Add these classes near the other settings styles.

```css
.settings-section-hint {
  margin: -0.25rem 0 0.75rem;
  color: rgba(82, 82, 91, 0.72);
  font-size: 0.78rem;
  line-height: 1.45;
}

.settings-recommendation-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.settings-recommendation-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid rgba(39, 39, 42, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.46);
  padding: 0.55rem 0.65rem;
}

.settings-recommendation-chip strong {
  font-size: 0.78rem;
  font-weight: 650;
}

.settings-recommendation-chip b,
.settings-mini-reset {
  font-size: 0.74rem;
  font-weight: 700;
}

.settings-mini-reset {
  min-width: 2.75rem;
  border: 1px solid rgba(39, 39, 42, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.64);
  color: #27272a;
  padding: 0.2rem 0.45rem;
  cursor: pointer;
}

.settings-mini-reset:hover {
  background: rgba(255, 255, 255, 0.86);
}

.settings-opacity-area-control .settings-range-row {
  grid-template-columns: minmax(0, 1fr) auto auto;
}

.dark .settings-section-hint {
  color: rgba(228, 228, 231, 0.68);
}

.dark .settings-recommendation-chip,
.dark .settings-mini-reset {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(24, 24, 27, 0.5);
  color: #f4f4f5;
}
```

- [ ] **Step 7: Remove or neutralize square full-window visual layers**

Search in `globals.css` for full-window selectors that use `position: fixed`, `inset: 0`, `box-shadow`, or theme background overlays. For any selector drawing a full-window surface outside `.app-shell`, either move the visual effect into `.app-shell` or add:

```css
border-radius: var(--shell-radius);
clip-path: inset(0 round var(--shell-radius));
overflow: hidden;
```

The existing pseudo-element suppression must remain:

```css
.app-viewport::before,
.app-viewport::after,
.app-shell::before,
.app-shell::after {
  display: none;
  content: none;
}
```

- [ ] **Step 8: Run UX verification after CSS edits**

Run from `app/`:

```bash
npm run verify:ux-polish
```

Expected: existing assertions pass. New assertions are added in Task 7.

---

### Task 7: Add verification guards

**Files:**
- Modify: `app/scripts/verify-ux-polish.ts`

- [ ] **Step 1: Import new model files into the verification script**

Add these reads near the existing file reads.

```ts
const personalization = readFileSync(join(root, 'src/types/personalization.ts'), 'utf8');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');
```

- [ ] **Step 2: Add assertions for seven opacity areas**

Append these assertions before the final `console.log`.

```ts
assert(personalization.includes('OPACITY_AREAS'), 'Personalization should define area-based opacity metadata.');
assert(personalization.includes('inputOpacity'), 'Personalization should persist input opacity separately.');
assert(personalization.includes('dialogOpacity'), 'Personalization should persist dialog opacity separately.');
assert(personalization.includes('settingsPanelOpacity'), 'Personalization should persist settings panel opacity separately.');
assert(app.includes('--input-opacity'), 'App should expose an input opacity CSS variable.');
assert(app.includes('--dialog-opacity'), 'App should expose a dialog opacity CSS variable.');
assert(app.includes('--settings-panel-opacity'), 'App should expose a settings panel opacity CSS variable.');
```

- [ ] **Step 3: Add assertions for SettingsPanel restructuring**

Append these assertions.

```ts
assert(settingsPanel.includes('text.globalAppearance'), 'Personalization should group font size and radius under Global appearance.');
assert(settingsPanel.includes('text.opacityRecommendations'), 'Personalization should show theme opacity recommendations.');
assert(settingsPanel.includes('text.areaFineTuning'), 'Personalization should expose collapsed area fine tuning.');
assert(settingsPanel.includes('OPACITY_AREAS.map'), 'SettingsPanel should render all opacity areas from shared metadata.');
assert(!settingsPanel.includes("setSection(`theme-${preset.id}`),"), 'Theme cards should no longer open separate opacity pages.');
```

- [ ] **Step 4: Add assertions for review button visibility**

Append these assertions.

```ts
assert(taskItem.includes('const hasReviewAction = hasTaskReview(task);'), 'Main task review action should only show when a review exists.');
assert(taskItem.includes('{hasReview && (') && taskItem.includes('task-subtask-review task-subtask-review-active'), 'Subtask review action should only render when a review exists.');
assert(!taskItem.includes('补写子任务完成情况'), 'Subtask rows should not expose an empty review button.');
```

- [ ] **Step 5: Add assertions for glass and clipping**

Append these assertions.

```ts
assert(globalsCss.includes('saturate(var(--glass-saturation))'), 'Transparent surfaces should use frosted glass saturation with blur.');
assert(globalsCss.includes('--settings-panel-opacity'), 'Settings panel opacity should be controlled by its own CSS variable.');
assert(globalsCss.includes('--input-opacity'), 'Input opacity should be controlled by its own CSS variable.');
assert(globalsCss.includes('isolation: isolate'), 'App shell should isolate layered glass surfaces inside rounded clipping.');
assert(globalsCss.includes('clip-path: inset(0 round var(--shell-radius))'), 'Rounded shell clipping should remain enforced.');
```

- [ ] **Step 6: Run verification**

Run from `app/`:

```bash
npm run verify:ux-polish
```

Expected: `UX polish verification passed`.

---

### Task 8: Full validation and manual UI check

**Files:**
- Validate only, no source edits unless a failure is found.

- [ ] **Step 1: Run typecheck**

Run from `app/`:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 2: Run UX polish verification**

Run from `app/`:

```bash
npm run verify:ux-polish
```

Expected: `UX polish verification passed`.

- [ ] **Step 3: Run context menu verification**

Run from `app/`:

```bash
npm run verify:context-menu
```

Expected: the context menu verification script exits successfully.

- [ ] **Step 4: Start the Electron dev app**

Run from `app/`:

```bash
npm run dev
```

Expected: DailyTodo launches in Electron.

- [ ] **Step 5: Manually verify corner radius**

In the app:

1. Open Settings → Personalization.
2. Set Global appearance → Corner radius to `4px`.
3. Return to the home task view.
4. Inspect all four corners.

Expected: no square transparent shadow or straight-edged overlay remains visible. The window edge and inner background clip together.

- [ ] **Step 6: Manually verify task and subtask review buttons**

In the app:

1. Add a main task and a subtask.
2. Confirm the new subtask row has no completion-review button.
3. Mark the subtask complete without review.
4. Confirm the subtask still has no completion-review button.
5. Complete or edit a task/subtask with a review record.
6. Confirm the review button appears only after the record exists and opens the existing review UI.

Expected: no main task or subtask exposes `补写完成情况` / empty review action from the task row.

- [ ] **Step 7: Manually verify Personalization structure**

In Settings → Personalization:

1. Confirm theme cards still select Minimal, Neumorphism, Watercolor, and Invisible.
2. Confirm Font size and Corner radius are grouped under Global appearance.
3. Confirm Opacity recommendations are visible for the active theme.
4. Expand Area fine tuning.
5. Confirm the seven controls are present: Home background, Task card, Input, Top-bar buttons, Dialogs, Menus, Settings panel.
6. Adjust each slider and confirm the corresponding UI area changes.
7. Click each recommendation pill/reset button and confirm the value returns to the theme recommendation.

Expected: transparent areas become glassy/blurred and text remains readable; controls are not split into separate theme pages.

- [ ] **Step 8: Stop the dev server cleanly**

Use the terminal interrupt for the running `npm run dev` process.

Expected: Electron and Vite dev processes stop without leaving a hung app window.

---

## Self-review checklist

- Spec goal: minimum-radius square corner artifact is covered by Task 6 and Task 8.
- Spec goal: subtask completion-review button visibility is covered by Task 5 and Task 8.
- Spec goal: corner radius moved to global font-size area is covered by Task 4.
- Spec goal: theme opacity recommendations are covered by Task 2 and Task 4.
- Spec goal: seven adjustable UI areas are covered by Task 1, Task 3, Task 4, and Task 6.
- Spec goal: frosted glass behavior is covered by Task 3 and Task 6.
- Verification is covered by Task 7 and Task 8.

