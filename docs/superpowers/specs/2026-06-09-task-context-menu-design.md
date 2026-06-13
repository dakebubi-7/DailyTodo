# 任务右键菜单 + 日期/标签管理设计

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为任务添加右键菜单，支持多日期设置、标签管理、子项添加（第二阶段）。第一阶段实现右键菜单框架、日期设置、标签管理。

**Architecture:** 
- 数据层：扩展 `Task` 类型添加 `scheduledDates` 和 `tags` 字段
- UI 层：右键菜单弹出框 + 日期选择器 + 标签编辑器
- 交互层：上下文菜单逻辑、多日期处理、标签建议（从历史学习）
- 存储层：任务数据持久化这些新字段

**Tech Stack:** React, TypeScript, Framer Motion, Electron, Tailwind/CSS

---

## 第一阶段：右键菜单 + 日期 + 标签

### 数据模型

#### Task 接口扩展

```typescript
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  source?: TaskSource;
  createdAt: string;
  taskDate: string;
  isToday: boolean;
  carriedFromDate?: string;
  carriedFromTaskId?: string;
  completedAt?: string;
  completionReview?: TaskCompletionReview;
  completionReviews?: TaskCompletionReview[];
  cleared?: boolean;
  
  // 新增字段（第一阶段）
  scheduledDates?: string[];  // 多个日期，格式 "YYYY-MM-DD"
  tags?: string[];            // 标签数组
}
```

**向后兼容性：** 这两个字段都是可选的，既存任务不需要迁移。

---

### 右键菜单 UI

#### 菜单结构

右键任务卡片时弹出菜单，包括以下选项：

1. **设置日期** → 展开子菜单
   - 今天
   - 明天
   - 下周一
   - 选择日期（日期选择器）
   - 清除日期（移除所有 scheduledDates）

2. **编辑标签** → 打开标签编辑框

3. **添加子项** → 打开输入框（第二阶段）

4. **分隔线**

5. **编辑** → 编辑任务文本（现有功能）

6. **删除** → 删除任务（现有功能）

#### 菜单位置与交互

- 右键菜单在鼠标位置弹出，使用 `position: fixed` 定位
- 菜单超出视口时自动调整位置（上下/左右）
- 点击菜单外或按 Escape 关闭
- 选择菜单项后自动关闭

---

### 日期设置

#### 快捷按钮

- **今天**：当前业务日期
- **明天**：当前业务日期 + 1 天
- **下周一**：当前周一 + 7 天

相对日期根据 `getBusinessDateKey()` 计算，确保与应用的日期逻辑一致。

#### 日期选择器

使用原生 `<input type="date">` 或 Flatpickr 库。选择日期后直接添加到 `scheduledDates` 数组中。

#### 清除日期

移除该任务的所有 `scheduledDates`。

#### 多日期显示

任务卡片上显示所有 scheduledDates，格式类似：
```
📅 今天 · 明天 · 6/15
```

排序：按日期从早到晚。最多显示 3 个日期，超过则显示"📅 3+ dates"。

---

### 标签管理

#### 标签编辑框

点击"编辑标签"时，弹出一个编辑框：
- 显示该任务已有的标签（可删除）
- 输入框支持自由输入，多个标签用逗号或空格分隔
- 下方显示"历史标签"建议列表（从所有任务的标签中学习）
- 可点击建议直接添加

#### 历史标签学习

扫描 `allTasks` 中所有任务的 `tags` 字段，去重并按使用频率排序，作为建议列表。

#### 标签显示

任务卡片上显示标签为小胶囊，样式：
- 背景：浅色（与来源标签类似）
- 文本：深色
- 间距：0.3rem gap
- 最多显示 2 个标签，超过则显示"+N more"

---

### 组件分解

#### 新增组件

**TaskContextMenu.tsx**
- Props：`{ task, position, onClose, onUpdate }`
- 渲染右键菜单，包含所有菜单项
- 处理日期、标签编辑打开

**DatePickerMenu.tsx**
- Props：`{ task, onClose, onUpdate }`
- 子菜单：快捷按钮 + 日期选择器 + 清除按钮
- 更新 `scheduledDates` 字段

**TagEditor.tsx**
- Props：`{ task, allTags, onClose, onUpdate }`
- 显示现有标签 + 输入框 + 建议列表
- 更新 `tags` 字段

#### 修改现有组件

**TaskItem.tsx**
- 添加 `onContextMenu` 事件处理器
- 显示 scheduledDates 和 tags（如果存在）
- 传递 `onUpdate` 回调给 `TaskContextMenu`

**TaskList.tsx**
- 计算历史标签列表（所有任务的 tags）
- 传递 `allTags` 给 `TaskContextMenu` / `TagEditor`

**useTasks.ts**
- 添加 `updateTask(id, updates)` 方法，支持更新任务字段
- 保证数据持久化

**Task 类型** (`types/task.ts`)
- 扩展 `Task` 接口，添加 `scheduledDates?` 和 `tags?` 字段

#### CSS 样式 (`globals.css`)

新增：
- `.context-menu` - 菜单容器
- `.context-menu-item` - 菜单项
- `.context-menu-item:hover` - 悬停状态
- `.context-menu-submenu` - 子菜单
- `.date-picker-menu` - 日期选择器菜单
- `.tag-editor` - 标签编辑框
- `.tag-pill` - 标签胶囊样式
- `.tag-suggestion` - 建议标签样式
- `.scheduled-dates` - 日期显示行

---

## 数据流

1. 用户右键任务 → `TaskItem` 捕获 `onContextMenu` 事件
2. 显示 `TaskContextMenu` 弹出框（传递任务和位置）
3. 用户选择菜单项（设置日期/编辑标签/等）
4. 打开相应编辑器（`DatePickerMenu` / `TagEditor`）
5. 用户确认更改 → 调用 `onUpdate(taskId, { scheduledDates: [...] 或 tags: [...] })`
6. `useTasks.updateTask()` 更新内存和存储
7. 任务卡片重新渲染，显示新的日期/标签

---

## 错误处理

- 日期选择器选择无效日期 → 提示错误
- 标签输入过长（>50 字符）→ 截断或提示
- 添加重复标签 → 去重
- 网络同步失败 → 显示提示，允许重试

---

## 第二阶段计划（不在本 spec 中）

- 子任务树形结构：`Task` 添加 `subtasks?: Task[]`
- 子任务 UI：递归渲染 + 收展动画
- 子任务菜单项：在右键菜单中添加"添加子项"选项

