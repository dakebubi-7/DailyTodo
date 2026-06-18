# Quick Capture Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first-version quick capture workflow that parses lightweight inline task syntax and previews it in the existing add-task input.

**Architecture:** Add a pure shared parser in `app/shared/quickCapture.ts`, verify it with a `tsx` script, then integrate it into `app/src/components/AddTaskInput.tsx`. The UI remains inside the existing add-task flow and maps only supported fields into the existing `Task` model.

**Tech Stack:** Electron, React, TypeScript, `tsx` verification scripts, existing CSS in `app/src/styles/globals.css`.

---

## File Structure

- Create `app/shared/quickCapture.ts`: pure parser and task field mapping helpers.
- Create `app/scripts/verify-quick-capture.ts`: parser behavior verifier using Node assertions.
- Modify `app/src/components/AddTaskInput.tsx`: parse input live, show preview, validate empty parsed title, submit parsed fields.
- Modify `app/src/styles/globals.css`: small preview/error styles matching existing add-task styling.
- Create `app/scripts/verify-quick-capture-ui.ts`: static UI structure verifier.
- Modify `app/package.json`: add `verify:quick-capture` and `verify:quick-capture-ui` scripts.

---

### Task 1: Parser Verification

**Files:**
- Create: `app/scripts/verify-quick-capture.ts`
- Later create: `app/shared/quickCapture.ts`

- [ ] **Step 1: Write the failing parser verifier**

Create `app/scripts/verify-quick-capture.ts`:

```ts
import assert from 'node:assert/strict';
import { parseQuickCapture } from '../shared/quickCapture';

const first = parseQuickCapture('明天 写周报 !高 #工作');
assert.equal(first.title, '写周报');
assert.equal(first.dateIntent?.kind, 'tomorrow');
assert.equal(first.priority, 'high');
assert.equal(first.sourceLabel, '工作');
assert.deepEqual(first.tags, []);
assert.deepEqual(first.warnings, []);

const second = parseQuickCapture('今天 整理 DailyTodo !中');
assert.equal(second.title, '整理 DailyTodo');
assert.equal(second.dateIntent?.kind, 'today');
assert.equal(second.priority, 'medium');
assert.equal(second.sourceLabel, undefined);

const third = parseQuickCapture('写点东西 !高 !低');
assert.equal(third.title, '写点东西');
assert.equal(third.priority, 'low');
assert.deepEqual(third.warnings, []);

const fourth = parseQuickCapture('#工作 !高');
assert.equal(fourth.title, '');
assert.equal(fourth.priority, 'high');
assert.equal(fourth.sourceLabel, '工作');
assert.deepEqual(fourth.warnings, ['请输入任务内容']);

const fifth = parseQuickCapture('周五 20:00 复盘 @AI');
assert.equal(fifth.title, '复盘');
assert.equal(fifth.dateIntent?.kind, 'weekday');
assert.equal(fifth.dateIntent?.weekday, 5);
assert.equal(fifth.timeIntent, '20:00');
assert.deepEqual(fifth.tags, ['AI']);

console.log('verify-quick-capture passed');
```

- [ ] **Step 2: Run verifier and confirm RED**

Run from `app/`:

```bash
npm exec tsx scripts/verify-quick-capture.ts
```

Expected: FAIL because `../shared/quickCapture` does not exist.

---

### Task 2: Shared Parser

**Files:**
- Create: `app/shared/quickCapture.ts`
- Test: `app/scripts/verify-quick-capture.ts`

- [ ] **Step 1: Implement minimal parser**

Create `app/shared/quickCapture.ts`:

```ts
export type QuickCapturePriority = 'high' | 'medium' | 'low';

export type QuickCaptureDateIntent =
  | { kind: 'today'; label: '今天' }
  | { kind: 'tomorrow'; label: '明天' }
  | { kind: 'day-after-tomorrow'; label: '后天' }
  | { kind: 'weekday'; label: string; weekday: number };

export interface QuickCaptureResult {
  raw: string;
  title: string;
  priority?: QuickCapturePriority;
  sourceLabel?: string;
  tags: string[];
  dateIntent?: QuickCaptureDateIntent;
  timeIntent?: string;
  warnings: string[];
}

const PRIORITY_TOKENS: Record<string, QuickCapturePriority> = {
  '!高': 'high',
  '!中': 'medium',
  '!低': 'low',
};

const WEEKDAY_TOKENS: Record<string, number> = {
  周一: 1,
  周二: 2,
  周三: 3,
  周四: 4,
  周五: 5,
  周六: 6,
  周日: 0,
  周天: 0,
};

function parseDateIntent(token: string): QuickCaptureDateIntent | undefined {
  if (token === '今天') return { kind: 'today', label: '今天' };
  if (token === '明天') return { kind: 'tomorrow', label: '明天' };
  if (token === '后天') return { kind: 'day-after-tomorrow', label: '后天' };
  if (token in WEEKDAY_TOKENS) {
    return { kind: 'weekday', label: token, weekday: WEEKDAY_TOKENS[token] };
  }
  return undefined;
}

function isTimeToken(token: string) {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(token) || /^([01]?\d|2[0-3])点$/.test(token);
}

export function parseQuickCapture(input: string): QuickCaptureResult {
  const raw = input;
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  const titleTokens: string[] = [];
  const tags: string[] = [];
  let priority: QuickCapturePriority | undefined;
  let sourceLabel: string | undefined;
  let dateIntent: QuickCaptureDateIntent | undefined;
  let timeIntent: string | undefined;

  for (const token of tokens) {
    if (token in PRIORITY_TOKENS) {
      priority = PRIORITY_TOKENS[token];
      continue;
    }

    if (token.startsWith('#') && token.length > 1) {
      const label = token.slice(1);
      if (!sourceLabel) sourceLabel = label;
      else tags.push(label);
      continue;
    }

    if (token.startsWith('@') && token.length > 1) {
      tags.push(token.slice(1));
      continue;
    }

    const parsedDateIntent = parseDateIntent(token);
    if (parsedDateIntent) {
      dateIntent = parsedDateIntent;
      continue;
    }

    if (isTimeToken(token)) {
      timeIntent = token;
      continue;
    }

    titleTokens.push(token);
  }

  const title = titleTokens.join(' ').trim();
  const warnings = title ? [] : ['请输入任务内容'];

  return {
    raw,
    title,
    priority,
    sourceLabel,
    tags,
    dateIntent,
    timeIntent,
    warnings,
  };
}
```

- [ ] **Step 2: Run parser verifier and confirm GREEN**

Run from `app/`:

```bash
npm exec tsx scripts/verify-quick-capture.ts
```

Expected: PASS with `verify-quick-capture passed`.

---

### Task 3: Add Package Scripts

**Files:**
- Modify: `app/package.json`
- Test: `npm run verify:quick-capture`

- [ ] **Step 1: Add quick capture verifier script**

In `app/package.json`, add this script near other `verify:*` scripts:

```json
"verify:quick-capture": "tsx scripts/verify-quick-capture.ts"
```

- [ ] **Step 2: Run script alias**

Run from `app/`:

```bash
npm run verify:quick-capture
```

Expected: PASS with `verify-quick-capture passed`.

---

### Task 4: UI Integration

**Files:**
- Modify: `app/src/components/AddTaskInput.tsx`
- Modify: `app/src/styles/globals.css`
- Test: `app/scripts/verify-quick-capture-ui.ts`

- [ ] **Step 1: Write failing UI structure verifier**

Create `app/scripts/verify-quick-capture-ui.ts`:

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const component = readFileSync(join(process.cwd(), 'src/components/AddTaskInput.tsx'), 'utf8');
const styles = readFileSync(join(process.cwd(), 'src/styles/globals.css'), 'utf8');

assert.match(component, /parseQuickCapture/);
assert.match(component, /quick-capture-preview/);
assert.match(component, /quick-capture-error/);
assert.match(component, /parsed\.title/);
assert.match(component, /parsed\.priority/);
assert.match(component, /parsed\.sourceLabel/);
assert.match(styles, /\.quick-capture-preview/);
assert.match(styles, /\.quick-capture-error/);

console.log('verify-quick-capture-ui passed');
```

- [ ] **Step 2: Run UI verifier and confirm RED**

Run from `app/`:

```bash
npm exec tsx scripts/verify-quick-capture-ui.ts
```

Expected: FAIL because UI has not been wired yet.

- [ ] **Step 3: Wire parser into AddTaskInput**

Modify `app/src/components/AddTaskInput.tsx`:

```ts
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { parseQuickCapture } from '../../shared/quickCapture';
import { Task, TaskSource } from '../types/task';
import { PriorityPicker } from './PriorityPicker';
```

Inside `AddTaskInput`, after state declarations:

```ts
  const parsed = useMemo(() => parseQuickCapture(text), [text]);
  const effectivePriority = parsed.priority || priority;
  const effectiveSource: TaskSource = parsed.sourceLabel === '外部' ? 'external' : source;
  const showQuickCapturePreview = Boolean(text.trim());
  const showQuickCaptureError = showQuickCapturePreview && !parsed.title;
```

Update `handleSubmit`:

```ts
  const handleSubmit = () => {
    const nextText = parsed.title || text.trim();
    if (!nextText || showQuickCaptureError) return;

    onAdd(nextText, effectivePriority, effectiveSource);
    setText('');
    setPriority('medium');
    setSource('personal');
  };
```

Update `PriorityPicker` value:

```tsx
        <PriorityPicker value={effectivePriority} onChange={setPriority} title="选择新任务优先级" />
```

Add preview after `.add-task-inner`:

```tsx
      {showQuickCapturePreview && (
        <div className="quick-capture-preview" aria-live="polite">
          {showQuickCaptureError ? (
            <span className="quick-capture-error">请输入任务内容</span>
          ) : (
            <>
              <span>任务：{parsed.title}</span>
              {parsed.dateIntent && <span>日期：{parsed.dateIntent.label}</span>}
              <span>优先级：{effectivePriority === 'high' ? '高' : effectivePriority === 'medium' ? '中' : '低'}</span>
              {parsed.sourceLabel && <span>来源：{parsed.sourceLabel}</span>}
              {parsed.tags.length > 0 && <span>标签：{parsed.tags.join('、')}</span>}
              {parsed.timeIntent && <span>时间：{parsed.timeIntent}</span>}
            </>
          )}
        </div>
      )}
```

- [ ] **Step 4: Add preview styles**

Add to `app/src/styles/globals.css` near add-task styles:

```css
.quick-capture-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 4px 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.quick-capture-preview span {
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 3px 8px;
  background: var(--surface-soft);
}

.quick-capture-error {
  color: var(--danger-text);
  border-color: var(--danger-border) !important;
  background: var(--danger-soft) !important;
}
```

If these CSS variables do not exist, use nearby existing semantic variables from `globals.css` instead of raw colors.

- [ ] **Step 5: Run UI verifier and confirm GREEN**

Run from `app/`:

```bash
npm exec tsx scripts/verify-quick-capture-ui.ts
```

Expected: PASS with `verify-quick-capture-ui passed`.

---

### Task 5: Final Verification

**Files:**
- Modify: `app/package.json`
- Test: parser, UI verifier, task interaction verifier, typecheck

- [ ] **Step 1: Add UI verifier script**

In `app/package.json`, add:

```json
"verify:quick-capture-ui": "tsx scripts/verify-quick-capture-ui.ts"
```

- [ ] **Step 2: Run focused verification**

Run from `app/`:

```bash
npm run verify:quick-capture
npm run verify:quick-capture-ui
npm run verify:task-list-interactions
npm run typecheck
```

Expected: all commands PASS.

- [ ] **Step 3: Commit if requested**

Do not commit unless the user explicitly asks. If committing later, use:

```bash
git add docs/superpowers/specs/2026-06-17-quick-capture-center-design.md docs/superpowers/plans/2026-06-17-quick-capture-center.md app/shared/quickCapture.ts app/scripts/verify-quick-capture.ts app/scripts/verify-quick-capture-ui.ts app/src/components/AddTaskInput.tsx app/src/styles/globals.css app/package.json
git commit -m "feat(tasks): add quick capture input parsing"
```
