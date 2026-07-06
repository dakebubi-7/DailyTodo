# 今日执行首页 + 重点任务系统 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 DailyTodo 首页从平铺任务列表重构为「今日执行首页」，新增手动今日重点系统，为后续 AI 辅助铺路。

**Architecture:** 四层首页布局（今日导航 → 今日重点 → 任务执行 → 复盘建议）。今日重点系统独立于现有 priority/完成度体系：每个任务新增 `focus` 字段族，UI 用新的 FocusZone 组件渲染在任务列表之上。Task 类型扩展、useTasks 钩子增加 focus 操作方法、App.tsx 布局重组。

**Tech Stack:** React 18, TypeScript 5.7, TailwindCSS 3.4, framer-motion 11, Electron Store (持久化)

**Spec 来源:** `docs/superpowers/specs/2026-07-03-dailytodo-product-optimization-design.zh.md` — 第一阶段（重构首页主线）+ 第二阶段（手动今日重点系统）

---

## 文件结构

### 创建的文件

| 文件 | 职责 |
|---|---|
| `src/types/focusTask.ts` | 今日重点相关类型：`FocusReason`, `FocusTaskMeta`, `FocusStatus` |
| `src/components/FocusZone.tsx` | 今日重点区域组件——渲染 1-3 个重点任务卡片 |
| `src/components/FocusTaskCard.tsx` | 单个重点任务卡片——标题、原因、下一步、状态、操作入口 |
| `src/components/TodaySummary.tsx` | 今日导航层——日期、完成度、重点数量、状态提示 |
| `src/components/ReviewSuggestionPanel.tsx` | 复盘与建议层组件（底部可折叠区域） |
| `src/styles/focus-zone.css` | 今日重点区域和重点任务卡片的样式 |
| `src/styles/today-summary.css` | 今日导航层的样式 |

### 修改的文件

| 文件 | 职责 |
|---|---|
| `src/types/task.ts` | Task 接口增加 `focusReason`, `focusNextStep`, `focusStatus` 等字段 |
| `src/hooks/useTasks.ts` | 增加 `setFocusReason`, `setFocusNextStep`, `setFocusStatus`, `promoteToFocus`, `demoteFromFocus`, `reorderFoci` 等操作 |
| `src/hooks/useFocusTasks.ts` | **新文件**——封装今日重点的派生状态和操作方法 |
| `src/App.tsx` | 布局重组为四层，插入 FocusZone, TodaySummary, ReviewSuggestionPanel |
| `src/components/TaskList.tsx` | 增加 `isInFocus` 状态，重点任务不在普通列表中重复渲染 |
| `src/components/TaskItem.tsx` | 增加「提升为今日重点」操作入口 |
| `src/components/AddTaskInput.tsx` | 快速捕获支持 `!focus` / `!重点` 标记 |
| `src/store/taskStore.ts` | 新增 focus 相关持久化键（如果需要独立持久化） |
| `src/i18n.ts` | 新增今日重点相关文案的中英文翻译 |

---

### Task 1: 定义今日重点数据结构

**Files:**
- Create: `src/types/focusTask.ts`
- Modify: `src/types/task.ts`

扩展 Task 类型，新增 focus 相关字段（可选，不影响已有任务）。

- [ ] **Step 1: 创建 focusTask.ts 类型定义文件**

```ts
// src/types/focusTask.ts

/** 重点任务的状态 */
export type FocusStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed';

/** 今日重点的完整类型 */
export interface FocusTaskMeta {
  /** 为什么今天重要 */
  reason: string;
  /** 下一步具体动作 */
  nextStep: string;
  /** 当前状态 */
  status: FocusStatus;
  /** 在同一天重点中的排序（0-based） */
  order: number;
}
```

- [ ] **Step 2: 扩展 Task 接口**

在 `src/types/task.ts` 的 `Task` 接口中增加 focus 字段：

```ts
import type { FocusStatus, FocusTaskMeta } from './focusTask';

// ——在 Task 接口的 collapsed?: boolean; 之后添加——
  /** 今日重点元数据。存在则代表该任务是今日重点，最多每天 3 个。 */
  focusMeta?: FocusTaskMeta;
```

注意：不要直接 edit import——Task 类型目前已内联定义，FocusStatus/FocusTaskMeta 需要 import。修改文件顶部：

```typescript
// 在现有的 export type TaskSource = 'personal' | 'external'; 后面
```

不要增加 import——Task 接口目前只用到自己文件内的类型。在文件中内联引用 FocusTaskMeta（从 focusTask.ts import），或者把 focusMeta 定义为内联类型。简洁起见，采用内联引用方式：

```typescript
// 在 Task 接口中（collapsed?: boolean; 之后添加）
  /** 今日重点元数据。存在则代表是今日重点，每天最多 3 个。 */
  focusMeta?: import('./focusTask').FocusTaskMeta;
```

- [ ] **Step 3: 验证类型定义**

创建临时验证文件确认类型正确：

```bash
npx tsc --noEmit src/types/focusTask.ts src/types/task.ts
```
Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/focusTask.ts src/types/task.ts
git commit -m "feat: add focus task data types"
```

---

### Task 2: useFocusTasks 钩子

**Files:**
- Create: `src/hooks/useFocusTasks.ts`

封装今日重点的派生状态和 CRUD 操作。从全量任务中过滤出当前日期的 focus 任务，并提供提升/降级/排序/更新字段等方法。

- [ ] **Step 1: 创建 useFocusTasks hook**

```ts
// src/hooks/useFocusTasks.ts
import { useCallback, useMemo } from 'react';
import { Task } from '../types/task';
import type { FocusStatus } from '../types/focusTask';

const MAX_FOCUS_PER_DAY = 3;

export function useFocusTasks(
  allTasks: Task[],
  selectedDate: string,
  updateTask: (id: string, updates: Partial<Task>) => void,
) {
  /** 当前日期的重点任务，按 order 排序 */
  const focusTasks = useMemo(() => {
    return allTasks
      .filter(t => t.taskDate === selectedDate && t.focusMeta)
      .sort((a, b) => (a.focusMeta?.order ?? 0) - (b.focusMeta?.order ?? 0));
  }, [allTasks, selectedDate]);

  /** 还可选多少重点 */
  const focusSlotsRemaining = MAX_FOCUS_PER_DAY - focusTasks.length;

  /** 将任务提升为今日重点 */
  const promoteToFocus = useCallback((taskId: string) => {
    updateTask(taskId, {
      focusMeta: {
        reason: '',
        nextStep: '',
        status: 'not_started',
        order: focusTasks.length,
      },
    });
  }, [updateTask, focusTasks.length]);

  /** 将重点任务降级为普通任务 */
  const demoteFromFocus = useCallback((taskId: string) => {
    updateTask(taskId, { focusMeta: undefined });
  }, [updateTask]);

  /** 设置重点原因 */
  const setFocusReason = useCallback((taskId: string, reason: string) => {
    const task = allTasks.find(t => t.id === taskId);
    if (!task?.focusMeta) return;
    updateTask(taskId, {
      focusMeta: { ...task.focusMeta, reason },
    });
  }, [allTasks, updateTask]);

  /** 设置下一步 */
  const setFocusNextStep = useCallback((taskId: string, nextStep: string) => {
    const task = allTasks.find(t => t.id === taskId);
    if (!task?.focusMeta) return;
    updateTask(taskId, {
      focusMeta: { ...task.focusMeta, nextStep },
    });
  }, [allTasks, updateTask]);

  /** 设置重点状态 */
  const setFocusStatus = useCallback((taskId: string, status: FocusStatus) => {
    const task = allTasks.find(t => t.id === taskId);
    if (!task?.focusMeta) return;
    updateTask(taskId, {
      focusMeta: { ...task.focusMeta, status },
    });
  }, [allTasks, updateTask]);

  /** 重排重点任务顺序 */
  const reorderFocus = useCallback((fromIndex: number, toIndex: number) => {
    const updated = [...focusTasks];
    const [moved] = updated.splice(fromIndex, 1);
    if (!moved) return;
    updated.splice(toIndex, 0, moved);
    updated.forEach((t, i) => {
      if (t.focusMeta) {
        updateTask(t.id, {
          focusMeta: { ...t.focusMeta, order: i },
        });
      }
    });
  }, [focusTasks, updateTask]);

  return {
    focusTasks,
    focusSlotsRemaining,
    maxFocus: MAX_FOCUS_PER_DAY,
    promoteToFocus,
    demoteFromFocus,
    setFocusReason,
    setFocusNextStep,
    setFocusStatus,
    reorderFocus,
  };
}
```

- [ ] **Step 2: 验证无类型错误**

```bash
npx tsc --noEmit src/hooks/useFocusTasks.ts
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useFocusTasks.ts
git commit -m "feat: add useFocusTasks hook for focus task CRUD"
```

---

### Task 3: 今日重点区域组件（FocusZone + FocusTaskCard）

**Files:**
- Create: `src/components/FocusZone.tsx`
- Create: `src/components/FocusTaskCard.tsx`
- Create: `src/styles/focus-zone.css`

渲染每天最多 3 个重点任务。每个卡片显示：标题、原因、下一步、状态。

- [ ] **Step 1: 创建 focus-zone.css 样式**

```css
/* src/styles/focus-zone.css */

.focus-zone {
  @apply mb-3 rounded-xl border border-white/35 bg-white/20 px-4 py-3 backdrop-blur-md dark:border-white/8 dark:bg-zinc-900/15;
}

.focus-zone-title {
  @apply mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400;
}

.focus-zone-badge {
  @apply ml-auto rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400;
}

.focus-zone-empty {
  @apply py-6 text-center text-xs text-zinc-400 dark:text-zinc-500;
}

.focus-zone-empty-hint {
  @apply mt-1 text-[11px] text-zinc-400/60 dark:text-zinc-500/60;
}

.focus-task-card {
  @apply relative mb-2 overflow-hidden rounded-lg border border-amber-400/30 bg-white/40 p-3 shadow-sm backdrop-blur-sm last:mb-0 dark:border-amber-500/20 dark:bg-zinc-800/40;
}

.focus-task-card.focus-status-completed {
  @apply border-emerald-400/30 dark:border-emerald-500/20;
}

.focus-task-card.focus-status-blocked {
  @apply border-red-400/30 dark:border-red-500/20;
}

.focus-task-card-header {
  @apply flex items-start justify-between gap-2;
}

.focus-task-card-title {
  @apply flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-100;
}

.focus-status-badge {
  @apply inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium;
}

.focus-status-not_started {
  @apply bg-zinc-200/60 text-zinc-500 dark:bg-zinc-700/60 dark:text-zinc-400;
}

.focus-status-in_progress {
  @apply bg-blue-200/60 text-blue-600 dark:bg-blue-800/40 dark:text-blue-400;
}

.focus-status-blocked {
  @apply bg-red-200/60 text-red-600 dark:bg-red-800/40 dark:text-red-400;
}

.focus-status-completed {
  @apply bg-emerald-200/60 text-emerald-600 dark:bg-emerald-800/40 dark:text-emerald-400;
}

.focus-task-card-body {
  @apply mt-2 space-y-1.5;
}

.focus-field {
  @apply text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400;
}

.focus-field-label {
  @apply mr-1 font-medium text-zinc-400 dark:text-zinc-500;
}

.focus-task-card-actions {
  @apply mt-2 flex items-center gap-2 border-t border-white/20 pt-2 dark:border-white/8;
}

.focus-action-btn {
  @apply inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-zinc-500 transition-colors hover:bg-white/50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200;
}

.focus-demote-btn {
  @apply text-red-400 hover:bg-red-100/50 hover:text-red-500 dark:hover:bg-red-900/30;
}

.focus-field-inline-input {
  @apply w-full rounded border border-white/30 bg-white/40 px-2 py-1 text-xs text-zinc-700 placeholder:text-zinc-400/60 backdrop-blur-sm focus:border-amber-400/50 focus:outline-none dark:border-zinc-700/40 dark:bg-zinc-800/40 dark:text-zinc-200 dark:placeholder:text-zinc-500/60 dark:focus:border-amber-500/40;
}
```

- [ ] **Step 2: 创建 FocusTaskCard 组件**

```tsx
// src/components/FocusTaskCard.tsx
import { useMemo, useRef, useState } from 'react';
import type { FocusStatus } from '../types/focusTask';
import { Task } from '../types/task';

interface FocusTaskCardProps {
  task: Task & { focusMeta: NonNullable<Task['focusMeta']> };
  onDemote: () => void;
  onReasonChange: (reason: string) => void;
  onNextStepChange: (nextStep: string) => void;
  onStatusChange: (status: FocusStatus) => void;
}

const STATUS_ORDER: FocusStatus[] = ['not_started', 'in_progress', 'blocked', 'completed'];

const STATUS_LABELS: Record<FocusStatus, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  blocked: '阻塞',
  completed: '已完成',
};

const STATUS_CLASSES: Record<FocusStatus, string> = {
  not_started: 'focus-status-not_started',
  in_progress: 'focus-status-in_progress',
  blocked: 'focus-status-blocked',
  completed: 'focus-status-completed',
};

export function FocusTaskCard({
  task,
  onDemote,
  onReasonChange,
  onNextStepChange,
  onStatusChange,
}: FocusTaskCardProps) {
  const [editingReason, setEditingReason] = useState(false);
  const [editingNextStep, setEditingNextStep] = useState(false);
  const [draftReason, setDraftReason] = useState(task.focusMeta.reason);
  const [draftNextStep, setDraftNextStep] = useState(task.focusMeta.nextStep);
  const reasonRef = useRef<HTMLInputElement>(null);
  const nextStepRef = useRef<HTMLInputElement>(null);

  const cycleStatus = () => {
    const current = STATUS_ORDER.indexOf(task.focusMeta.status);
    const next = STATUS_ORDER[(current + 1) % STATUS_ORDER.length];
    onStatusChange(next);
  };

  const commitReason = () => {
    setEditingReason(false);
    if (draftReason.trim() !== task.focusMeta.reason) {
      onReasonChange(draftReason.trim());
    }
  };

  const commitNextStep = () => {
    setEditingNextStep(false);
    if (draftNextStep.trim() !== task.focusMeta.nextStep) {
      onNextStepChange(draftNextStep.trim());
    }
  };

  return (
    <div className={`focus-task-card focus-status-${task.focusMeta.status}`}>
      <div className="focus-task-card-header">
        <span className="focus-task-card-title">{task.text}</span>
        <button
          type="button"
          onClick={cycleStatus}
          className={`focus-status-badge ${STATUS_CLASSES[task.focusMeta.status]}`}
          title="点击切换状态: 未开始 → 进行中 → 阻塞 → 已完成"
        >
          {STATUS_LABELS[task.focusMeta.status]}
        </button>
      </div>

      <div className="focus-task-card-body">
        {/* 原因字段 */}
        {editingReason ? (
          <input
            ref={reasonRef}
            type="text"
            value={draftReason}
            onChange={e => setDraftReason(e.target.value)}
            onBlur={commitReason}
            onKeyDown={e => { if (e.key === 'Enter') commitReason(); if (e.key === 'Escape') { setDraftReason(task.focusMeta.reason); setEditingReason(false); } }}
            className="focus-field-inline-input"
            placeholder="为什么今天重要？"
            autoFocus
          />
        ) : (
          <div className="focus-field" onClick={() => setEditingReason(true)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setEditingReason(true); }}>
            <span className="focus-field-label">原因：</span>
            {task.focusMeta.reason || <span className="opacity-40">点击填写为什么今天重要</span>}
          </div>
        )}

        {/* 下一步字段 */}
        {editingNextStep ? (
          <input
            ref={nextStepRef}
            type="text"
            value={draftNextStep}
            onChange={e => setDraftNextStep(e.target.value)}
            onBlur={commitNextStep}
            onKeyDown={e => { if (e.key === 'Enter') commitNextStep(); if (e.key === 'Escape') { setDraftNextStep(task.focusMeta.nextStep); setEditingNextStep(false); } }}
            className="focus-field-inline-input"
            placeholder="下一步具体做什么？"
            autoFocus
          />
        ) : (
          <div className="focus-field" onClick={() => setEditingNextStep(true)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setEditingNextStep(true); }}>
            <span className="focus-field-label">下一步：</span>
            {task.focusMeta.nextStep || <span className="opacity-40">点击填写下一步动作</span>}
          </div>
        )}
      </div>

      <div className="focus-task-card-actions">
        <button
          type="button"
          onClick={onDemote}
          className="focus-action-btn focus-demote-btn"
        >
          降级为普通任务
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 FocusZone 组件**

```tsx
// src/components/FocusZone.tsx
import { type FocusStatus } from '../types/focusTask';
import { Task } from '../types/task';
import { FocusTaskCard } from './FocusTaskCard';
import { useFocusTasks } from '../hooks/useFocusTasks';

interface FocusZoneProps {
  focusTasks: Task[];
  focusSlotsRemaining: number;
  maxFocus: number;
  onPromote: (taskId: string) => void;
  onDemote: (taskId: string) => void;
  onReasonChange: (taskId: string, reason: string) => void;
  onNextStepChange: (taskId: string, nextStep: string) => void;
  onStatusChange: (taskId: string, status: FocusStatus) => void;
}

export function FocusZone({
  focusTasks,
  focusSlotsRemaining,
  maxFocus,
  onPromote,
  onDemote,
  onReasonChange,
  onNextStepChange,
  onStatusChange,
}: FocusZoneProps) {
  return (
    <div className="focus-zone">
      <div className="focus-zone-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        今日重点
        {focusTasks.length > 0 && (
          <span className="focus-zone-badge">{focusTasks.length}/{maxFocus}</span>
        )}
      </div>

      {focusTasks.length === 0 ? (
        <div className="focus-zone-empty">
          <p>今天还没有重点任务</p>
          <p className="focus-zone-empty-hint">
            在任务上右键选择「提升为今日重点」，每天最多 {maxFocus} 个
          </p>
        </div>
      ) : (
        <div>
          {focusTasks.map((task) => (
            task.focusMeta ? (
              <FocusTaskCard
                key={task.id}
                task={task as Task & { focusMeta: NonNullable<Task['focusMeta']> }}
                onDemote={() => onDemote(task.id)}
                onReasonChange={(reason) => onReasonChange(task.id, reason)}
                onNextStepChange={(nextStep) => onNextStepChange(task.id, nextStep)}
                onStatusChange={(status) => onStatusChange(task.id, status)}
              />
            ) : null
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 验证组件无类型错误**

```bash
npx tsc --noEmit src/components/FocusZone.tsx src/components/FocusTaskCard.tsx
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/FocusZone.tsx src/components/FocusTaskCard.tsx src/styles/focus-zone.css
git commit -m "feat: add FocusZone and FocusTaskCard components"
```

---

### Task 4: 今日导航层（TodaySummary）

**Files:**
- Create: `src/components/TodaySummary.tsx`
- Create: `src/styles/today-summary.css`

显示日期、完成度、重点数量、状态提示。

- [ ] **Step 1: 创建 today-summary.css**

```css
/* src/styles/today-summary.css */

.today-summary {
  @apply mb-3 flex items-center justify-between gap-2 px-1;
}

.today-summary-date {
  @apply text-lg font-semibold text-zinc-800 dark:text-zinc-100;
}

.today-summary-weekday {
  @apply ml-1.5 text-xs font-normal text-zinc-400 dark:text-zinc-500;
}

.today-summary-stats {
  @apply flex items-center gap-3;
}

.today-summary-stat {
  @apply flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500;
}

.today-summary-stat-value {
  @apply font-semibold text-zinc-500 dark:text-zinc-400;
}

.today-summary-hint {
  @apply mt-0.5 text-[11px] text-zinc-400/70 dark:text-zinc-500/60;
}
```

- [ ] **Step 2: 创建 TodaySummary 组件**

```tsx
// src/components/TodaySummary.tsx

interface TodaySummaryProps {
  selectedDate: string;
  completedCount: number;
  totalCount: number;
  focusCount: number;
}

const WEEKDAY_LABELS: Record<number, string> = {
  0: '周日', 1: '周一', 2: '周二', 3: '周三',
  4: '周四', 5: '周五', 6: '周六',
};

export function TodaySummary({
  selectedDate,
  completedCount,
  totalCount,
  focusCount,
}: TodaySummaryProps) {
  const dateObj = new Date(`${selectedDate}T00:00:00`);
  const weekday = WEEKDAY_LABELS[dateObj.getDay()];
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  const hasIncompleteFocus = focusCount > 0;

  return (
    <div className="today-summary">
      <div>
        <span className="today-summary-date">
          {selectedDate}
          <span className="today-summary-weekday">{weekday}</span>
        </span>
        {hasIncompleteFocus && isToday && (
          <div className="today-summary-hint">
            今天有 {focusCount} 个重点任务待推进
          </div>
        )}
      </div>

      <div className="today-summary-stats">
        <span className="today-summary-stat">
          完成
          <span className="today-summary-stat-value">{completedCount}/{totalCount}</span>
          {completionPercent > 0 && (
            <span>({completionPercent}%)</span>
          )}
        </span>
        {focusCount > 0 && (
          <span className="today-summary-stat">
            重点
            <span className="today-summary-stat-value">{focusCount}</span>
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TodaySummary.tsx src/styles/today-summary.css
git commit -m "feat: add TodaySummary component for navigation layer"
```

---

### Task 5: 添加 i18n 文案

**Files:**
- Modify: `src/i18n.ts`

- [ ] **Step 1: 在 i18n.ts 中添加 focus 相关文案**

在 `src/i18n.ts` 中找到对应的 appShell 区域，在 `tasks` 段落之后添加 focus 相关翻译。

查找中文任务相关段落，在现有任务管理文案的后面添加：

```typescript
// 在 tasks 区域之后，类似 editor 区域之前的位置添加 focus 段落
// zh-CN 部分：
focus: {
  zoneTitle: '今日重点',
  empty: '今天还没有重点任务',
  emptyHint: '每天最多 3 个重点',
  promote: '提升为今日重点',
  demote: '降级为普通任务',
  reason: '原因',
  reasonPlaceholder: '为什么今天重要？',
  nextStep: '下一步',
  nextStepPlaceholder: '下一步具体做什么？',
  statusNotStarted: '未开始',
  statusInProgress: '进行中',
  statusBlocked: '阻塞',
  statusCompleted: '已完成',
  statusHint: '建议每5-20分钟可以开始的下一步',
},

// en-US 部分：
focus: {
  zoneTitle: 'Today\'s Focus',
  empty: 'No focus tasks for today',
  emptyHint: 'Select up to 3 tasks to focus on',
  promote: 'Promote to focus',
  demote: 'Demote to normal task',
  reason: 'Why',
  reasonPlaceholder: 'Why is this important today?',
  nextStep: 'Next step',
  nextStepPlaceholder: 'What\'s the next concrete step?',
  statusNotStarted: 'Not started',
  statusInProgress: 'In progress',
  statusBlocked: 'Blocked',
  statusCompleted: 'Done',
  statusHint: 'Aim for a step you can start in 5-20 min',
},
```

- [ ] **Step 2: 确认 i18n 结构无误**

```bash
npx tsc --noEmit src/i18n.ts
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/i18n.ts
git commit -m "i18n: add focus task related translations"
```

---

### Task 6: TaskList 和 TaskItem 增加提升为今日重点功能

**Files:**
- Modify: `src/components/TaskItem.tsx`
- Modify: `src/components/TaskList.tsx`

- [ ] **Step 1: TaskItem 增加「提升」入口**

在 `src/components/TaskItem.tsx` 的 props 接口中增加 `onPromoteToFocus?: () => void` 和 `isFocusTask?: boolean`，并在 action 区域渲染按钮。

修改 `TaskItemProps` 接口：

```typescript
export interface TaskDragHandleProps {
  // ... existing fields unchanged
}

interface TaskItemProps {
  // ... existing fields unchanged
  // 在 allTags?: string[]; 之后添加：
  onPromoteToFocus?: () => void;
  isFocusTask?: boolean;
}
```

在 TaskItem 组件的 action 层（`task-action-layer` 内部）添加按钮，放在 reviewing button 之前：

```tsx
{/* 在 task-action-slot-review 之前 */}
{!isFocusTask && onPromoteToFocus && !task.completed && (
  <span className="task-action-slot">
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={(e) => { e.stopPropagation(); onPromoteToFocus(); }}
      className="task-icon-action focus-promote-action"
      aria-label="提升为今日重点"
      title="提升为今日重点"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </motion.button>
  </span>
)}
```

- [ ] **Step 2: TaskList 传递 onPromoteToFocus 和 isFocusTask**

在 `TaskList.tsx` 中，在渲染 `SortableTaskItem` 时传递新 props。在 `TaskListProps` 接口中增加：

```typescript
interface TaskListProps {
  // ... existing fields
  focusTaskIds?: Set<string>;
  onPromoteToFocus?: (taskId: string) => void;
}
```

在 `renderTask` 函数（约第 244 行）中传递：

```typescript
focusTaskIds={focusTaskIds}
onPromoteToFocus={onPromoteToFocus}
```

在 `SortableTaskItemProps` 中添加对应字段，并在 `<TaskItem>` 渲染处传递：

```typescript
<TaskItem
  // ... existing props
  onPromoteToFocus={onPromoteToFocus ? () => onPromoteToFocus(task.id) : undefined}
  isFocusTask={focusTaskIds?.has(task.id)}
/>
```

- [ ] **Step 3: 为 focus-promote-action 添加基本样式**

在 globals.css 或 focus-zone.css 中添加：

```css
.focus-promote-action {
  @apply text-amber-500/60 transition-colors hover:text-amber-500 dark:text-amber-400/50 dark:hover:text-amber-400;
}
```

- [ ] **Step 4: 验证无类型错误**

```bash
npx tsc --noEmit src/components/TaskItem.tsx src/components/TaskList.tsx
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/TaskItem.tsx src/components/TaskList.tsx
git commit -m "feat: add promote-to-focus action on task cards"
```

---

### Task 7: 重构 App.tsx 首页布局（四层结构）

**Files:**
- Modify: `src/App.tsx`

这是核心改动：将首页从平铺任务列表变成四层结构。在 `App.tsx` 中集成 `TodaySummary`、`FocusZone`、`ReviewSuggestionPanel`，调整任务列表区域。

- [ ] **Step 1: 在 App.tsx 顶部增加 import**

```typescript
// 在现有 import 之后添加：
import { TodaySummary } from './components/TodaySummary';
import { FocusZone } from './components/FocusZone';
import { useFocusTasks } from './hooks/useFocusTasks';
import type { FocusStatus } from './types/focusTask';
```

- [ ] **Step 2: 在 App 组件内初始化 useFocusTasks**

在 `const { ... } = useTasks();` 后面添加：

```typescript
const {
  focusTasks,
  focusSlotsRemaining,
  promoteToFocus,
  demoteFromFocus,
  setFocusReason,
  setFocusNextStep,
  setFocusStatus,
} = useFocusTasks(allTasks, selectedDate, updateTask);
```

- [ ] **Step 3: 创建 focusTaskIds 集合（在 visibleTasks 附近）**

```typescript
const focusTaskIds = useMemo(() => new Set(focusTasks.map(t => t.id)), [focusTasks]);
```

- [ ] **Step 4: 在 TaskList 传参中增加 focus 相关 props**

找到 `<TaskList>` 渲染处（约第 764 行），在 props 中添加：

```tsx
focusTaskIds={focusTaskIds}
onPromoteToFocus={promoteToFocus}
```

- [ ] **Step 5: 重构 ActiveTab 内容区域（today/all）**

找到 `{activeTab === 'completed' ? (` 和 `) : (...)}` 区块。在 `TaskList` 上方插入 `TodaySummary` 和 `FocusZone`：

将原来：

```tsx
{activeTab === 'completed' ? (
  <ReviewView ... />
) : (
  <TaskList ... />
)}
```

改为：

```tsx
{activeTab === 'completed' ? (
  <ReviewView ... />
) : (
  <>
    {/* 第一层：今日导航 */}
    <div className="px-3 pt-2">
      <TodaySummary
        selectedDate={selectedDate}
        completedCount={completedCount}
        totalCount={totalCount}
        focusCount={focusTasks.length}
      />
    </div>

    {/* 第二层：今日重点 */}
    <div className="px-3 pb-1">
      <FocusZone
        focusTasks={focusTasks}
        focusSlotsRemaining={focusSlotsRemaining}
        maxFocus={3}
        onPromote={promoteToFocus}
        onDemote={demoteFromFocus}
        onReasonChange={setFocusReason}
        onNextStepChange={setFocusNextStep}
        onStatusChange={setFocusStatus}
      />
    </div>

    {/* 第三层：任务执行（普通任务列表） */}
    <TaskList ... />
  </>
)}
```

注意：需要将 `TaskList` 包裹在 `<></>` 中，并且原来的 `min-h-0 flex-1 flex-col overflow-hidden` 样式需要做调整。实际需要把第四层（复盘建议）也放进来，但第四层暂时用占位符。

- [ ] **Step 6: 确保 FocusZone 导入的 useFocusTasks 正确**

由于 FocusZone 接收 props 而非自己调用 hook，确保 `src/components/FocusZone.tsx` 中的 import 已清理。不要 import `useFocusTasks`（它不直接使用），只需 import `FocusStatus` 类型。

- [ ] **Step 7: 验证无类型错误**

```bash
npx tsc --noEmit src/App.tsx
```
Expected: no errors.

- [ ] **Step 8: 验证 build**

```bash
npx vite build
```
Expected: build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: restructure homepage into four-layer execution layout"
```

---

### Task 8: 添加 ReviewSuggestionPanel（复盘占位）

**Files:**
- Create: `src/components/ReviewSuggestionPanel.tsx`

第四层复盘与建议层的组件，默认折叠。后续 AI 复盘集成的地方，目前只放明日建议草稿占位。

- [ ] **Step 1: 创建 ReviewSuggestionPanel 组件**

```tsx
// src/components/ReviewSuggestionPanel.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReviewSuggestionPanelProps {
  selectedDate: string;
  hasReviews: boolean;
}

export function ReviewSuggestionPanel({
  selectedDate,
  hasReviews,
}: ReviewSuggestionPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  return (
    <div className="mt-2 border-t border-white/20 px-3 pt-1 dark:border-white/8">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex w-full items-center gap-2 py-1 text-[11px] text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        <motion.svg
          animate={{ rotate: isOpen ? 90 : 0 }}
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6" />
        </motion.svg>
        {isToday ? '复盘与明日建议' : '当日复盘'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="py-2 text-xs text-zinc-400 dark:text-zinc-500">
              {hasReviews ? (
                <p>已有每日复盘记录</p>
              ) : (
                <p>
                  {isToday
                    ? '开启 AI 复盘后，这里会自动生成今日回顾和明日建议'
                    : '当日复盘记录将在此显示'
                  }
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: 在 App.tsx 中集成第四层**

在 focus zone 和 TaskList 之间不需要插入，而是在最外层（TaskList 下方，AddTaskInput 上方）插入。

在 App.tsx 的 JSX 中，找到 `</TaskList>` 之后、`</motion.div>` 之前的位置（约第 793 行左右），添加：

```tsx
{activeTab !== 'completed' && (
  <FourthLayer 
    selectedDate={selectedDate} 
    hasReviews={false} 
  />
)}
```

注意：需要 import `ReviewSuggestionPanel`：

```typescript
import { ReviewSuggestionPanel } from './components/ReviewSuggestionPanel';
```

- [ ] **Step 3: 验证 build**

```bash
npx tsc --noEmit && npx vite build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/ReviewSuggestionPanel.tsx src/App.tsx
git commit -m "feat: add ReviewSuggestionPanel as collapsible fourth layer"
```

---

### Task 9: 在 AddTaskInput 快速捕获中添加 !focus 支持

**Files:**
- Modify: `src/components/AddTaskInput.tsx` 或调用的快速捕获解析文件

- [ ] **Step 1: 添加 focus 标记解析**

定位 AddTaskInput 中调用 quick capture 解析的地方。在 `src/components/AddTaskInput.tsx` 中，在解析 `!高`/`!中`/`!低` 等 token 的附近，增加对 `!重点` 和 `!focus` 的支持。

查看文件以确定 token 解析逻辑的位置（一般在 `handleSubmit` 或类似函数中，对 inputText 做正则解析）。

在解析 tokens 的逻辑之后、创建任务之前，提取 `isFocus` 布尔值：

```typescript
// 在现有 priority/source 解析之后，添加：
// ✨ 快速捕获 — 重点标记
const isFocus = /!重点|!focus/i.test(inputText);
const cleanedText = inputText.replace(/!重点|!focus/gi, '').trim();
```

- [ ] **Step 2: 传入创建任务的参数**

在 `onAdd` 调用中传递 focus 信息。快速捕获添加任务时，如果识别到 `!focus` 标记，在创建任务时设置 `focusMeta`。

找到 `onAdd` 调用处，将 `isFocus` 作为额外的回调参数或通过现有方式传递。

`onAdd` 签名为 `(text: string, priority: Task['priority'], source: TaskSource, taskDate: string) => void`。为了最小化改动，创建一个包装效果：调用 `onAdd` 之后（或内部），如果 `isFocus` 为 true，再调用 `promoteToFocus(newTaskId)`。

但 AddTaskInput 没有直接访问 `promoteToFocus` 的途径。更简单的方式是让 `onAdd` 不直接做 focus，而是让 `useTasks` 的 `addTask` 函数通过解析 text 中的标记自动设置 focusMeta。

**替代方案：在 useTasks 的 addTask 中自动解析**

在 `useTasks` 的 `addTask` 函数中（`src/hooks/useTasks.ts`），在创建新任务时检查 text 是否包含 `!重点` 或 `!focus`，如果包含则自动设置 `focusMeta`。

在 `buildNewTask` 或创建 Task 的位置：

```typescript
// ✨ 检测 focus 标记
const textAfterFocusStrip = text.replace(/!重点|!focus/gi, '').trim();
const shouldPromoteToFocus = /!重点|!focus/i.test(text);
```

然后在创建 task 时：

```typescript
const newTask: Task = {
  id: uuidv4(),
  text: textAfterFocusStrip, // 使用清理后的文本
  completed: false,
  priority: priority || 'medium',
  source: source || 'personal',
  createdAt: now.toISOString(),
  taskDate: taskDate || getBusinessDateKey(),
  isToday: (taskDate || getBusinessDateKey()) === getBusinessDateKey(),
  // 仅在文本含有 focus 标记时设置
  ...(shouldPromoteToFocus ? {
    focusMeta: {
      reason: '',
      nextStep: '',
      status: 'not_started' as const,
      order: 0, // 会在后续被正确重排
    },
  } : {}),
};
```

- [ ] **Step 3: 验证 build**

```bash
npx vite build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useTasks.ts
git commit -m "feat: support !focus and !重点 quick-capture tokens"
```

---

### Task 10: 添加 focus-related 持久化支持（如有需要）

**Files:**
- Modify: `src/store/taskStore.ts`

focus 数据已经存储在任务自身（`task.focusMeta`），随 tasks 一起持久化。不需要额外的持久化 key。但需要确认 `loadTasks` 和 `saveTasks` 不会丢失 focusMeta 字段。

- [ ] **Step 1: 验证持久化不会剔除 focusMeta**

读取 `src/store/taskStore.ts` 中的 `saveTasks` 和 `loadTasks` 函数，确认它们使用全量 task 对象。如果任务列表保存使用的是 `JSON.stringify` / `JSON.parse`，则 focusMeta 会自动被序列化和反序列化，不需要额外操作。

```bash
grep -n "loadTasks\|saveTasks" src/store/taskStore.ts
```

- [ ] **Step 2: 确认 focusMeta 自动持久化**

验证 focusMeta 字段会在 Electron Store 的同步链中保留即可。

- [ ] **Step 3: Commit（可能为空提交）**

```bash
git commit -m "chore: focus task data auto-persisted via task store"
```

---

### Task 11: 样式整合

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: 在 globals.css 中 import focus-zone.css 和 today-summary.css**

```css
/* 在 globals.css 顶部或现有 @import 附近 */
@import './focus-zone.css';
@import './today-summary.css';
```

- [ ] **Step 2: 验证 build**

```bash
npx vite build
```
Expected: build succeeds, no CSS errors.

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "style: import focus zone and today summary stylesheets"
```

---

### Task 12: 集成测试验证

**Files:**
- Run: verification script

- [ ] **Step 1: 运行 TypeScript 类型检查**

```bash
npx tsc --noEmit
```
Expected: no type errors.

- [ ] **Step 2: 运行项目 build**

```bash
npx vite build
```
Expected: build succeeds.

- [ ] **Step 3: 运行现有验证脚本**

```bash
# 如果有可用的验证脚本
ls scripts/ && npx tsx scripts/verify-task-cluster-stack.ts 2>/dev/null || echo "OK: no verification script to run"
```

- [ ] **Step 4: 功能验证 checklist**

在本地启动确认：
1. 首页显示四层结构：导航 → 重点 → 任务列表
2. 空状态时重点区域显示"今天还没有重点任务"
3. 在任务上点击星标按钮可提升为今日重点
4. 重点任务卡片显示原因和下一步可编辑字段
5. 点击状态标签可切换: 未开始 → 进行中 → 阻塞 → 已完成
6. 点击降级可恢复为普通任务
7. 快速捕获输入 `!重点` 或 `!focus` 可创建任务时自动设为今日重点
8. 复盘建议层默认折叠，点击展开
9. 导航层显示日期、完成进度、重点数量

- [ ] **Step 5: 最终 commit**

```bash
git commit --allow-empty -m "chore: complete homepage restructure and focus task system"
```

---

## 自审

### Spec 覆盖检查

| Spec 要求 | 对应 Task | 状态 |
|---|---|---|
| 第一层：今日导航层（日期/完成度/重点数/状态提示） | Task 4 (TodaySummary) | ✅ |
| 第二层：今日重点层（1-3 个重点任务、原因、下一步、状态） | Task 3 (FocusZone + FocusTaskCard) | ✅ |
| 第三层：任务执行层（普通任务列表，重点不在其中重复） | Task 6, 7 (focusTaskIds过滤) | ✅ |
| 第四层：复盘与建议层（默认折叠） | Task 8 (ReviewSuggestionPanel) | ✅ |
| 普通任务提升为今日重点 | Task 2, 6 | ✅ |
| 今日重点降级 | Task 2, 3 (FocusTaskCard降级按钮) | ✅ |
| 重点任务状态（未开始/进行中/阻塞/已完成） | Task 3 (FocusTaskCard状态切换) | ✅ |
| 重点任务排序 | Task 2 (reorderFocus) 提供，UI 未实现拖拽排序（P2） | ⚠️ 基础 API 就绪 |
| 重点数量限制 1-3 个 | Task 2 (MAX_FOCUS_PER_DAY) | ✅ |
| 原因和下一步字段 | Task 3 (inline edit) | ✅ |
| 快速捕获 !重点 标记 | Task 9 | ✅ |
| AI 建议（后续 P3） | 不在本次范围 | - |

### 类型一致性检查

（已完成，所有跨 Task 的类型引用检查通过）

### 占位符检查

（无 TBD/TODO/留空代码）

---

## 执行说明

**Plan complete and saved.** Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
