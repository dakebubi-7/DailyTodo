# Daily Todo - Desktop Application Specification

## 1. Project Overview

**Project Name:** Daily Todo
**Type:** Desktop Application (Electron + React + TypeScript)
**Core Feature:** A beautiful, minimalist daily task management app with warm paper aesthetics
**Target Users:** Professionals and individuals who want an elegant, distraction-free task management experience

---

## 2. Technical Stack

| Layer | Technology |
|-------|------------|
| Desktop Shell | Electron (latest stable) |
| UI Framework | React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS + Custom CSS Variables |
| Animation | Framer Motion |
| Data Persistence | electron-store |
| Fonts | Playfair Display (headings), DM Sans (body) |
| Build Tool | Vite |
| Drag & Drop | @dnd-kit/core |
| Confetti | canvas-confetti |

---

## 3. Visual Design

### Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Background | Warm Ivory | `#F5F0E8` |
| Card Background | Pure White | `#FFFFFF` |
| Primary (Dark Green) | Deep Forest | `#2D4A3E` |
| Accent (Gold) | Soft Gold | `#C9A84C` |
| Text Primary | Charcoal | `#2C2C2C` |
| Text Secondary | Warm Gray | `#6B6B6B` |
| Completed Task | Muted | `#A0A0A0` |
| Priority High | Warm Red | `#D35F5F` |
| Priority Medium | Amber | `#E5A84B` |
| Priority Low | Soft Teal | `#5B9A8B` |

### Typography

- **Headings:** Playfair Display, 600 weight
- **Body:** DM Sans, 400/500 weight
- **Scale:** 12px (small), 14px (body), 16px (emphasis), 24px (title), 32px (hero)

### Spacing System

- Base unit: 4px
- Margins: 16px (compact), 24px (standard), 32px (generous)
- Card padding: 20px
- Border radius: 16px (cards), 8px (inputs), 24px (buttons)

### Visual Effects

- **Paper Texture:** SVG feTurbulence noise filter at 2% opacity
- **Card Shadow:** `0 4px 24px rgba(45, 74, 62, 0.08)`
- **Hover Shadow:** `0 8px 32px rgba(45, 74, 62, 0.12)`
- **Transitions:** 200ms ease-out (default), 300ms ease-out (emphasis)

---

## 4. Window Configuration

- **Default Size:** 420 × 680px
- **Minimum Size:** 360 × 500px
- **Frameless Window:** `frame: false`
- **Custom Title Bar:** Drag region with `-webkit-app-region: drag`
- **Window Controls:** Custom minimize/close buttons (top-right)

---

## 5. Layout Structure

```
┌────────────────────────────────────┐
│ [Drag Area]  日期        _  ✕     │  ← TitleBar
├────────────────────────────────────┤
│  Daily Todo                    ☀   │  ← Header (with dark mode toggle)
│  ████████████░░░░  6/10 完成       │  ← Progress Bar
├────────────────────────────────────┤
│  今日    |    全部    |   已完成    │  ← TabBar (animated underline)
├────────────────────────────────────┤
│  ● 完成设计稿审查                 │  ← TaskItem (high priority)
│  ✓ 发周报邮件        [delete]     │  ← TaskItem (completed)
│  ○ 整理桌面文件       [delete]     │  ← TaskItem (low priority)
│  ...                               │
├────────────────────────────────────┤
│  [+ 添加新任务...]                 │  ← AddTaskInput
└────────────────────────────────────┘
```

---

## 6. Component Specifications

### 6.1 TitleBar
- Height: 40px
- Contains: Drag region, date display, window controls
- Window controls: minimize (─), close (✕)
- Hover state: Background opacity change

### 6.2 Header
- Hero title: "Daily Todo" in Playfair Display
- Date: "2025年5月19日 星期一" format
- Progress bar: Animated fill with percentage
- Dark mode toggle: Sun/Moon icon (top-right)

### 6.3 TabBar
- Three tabs: "今日", "全部", "已完成"
- Animated underline (layoutId) slides to selected tab
- Tab content filters tasks accordingly

### 6.4 TaskItem
- Checkbox: Custom styled, animated check mark
- Priority indicator: Colored dot (●)
- Text: Editable on double-click
- States: Default, Hover (shows delete), Completed (strikethrough + fade)
- Delete button: Appears on hover, slide-out animation on delete

### 6.5 AddTaskInput
- Full-width input with + icon
- Placeholder: "添加新任务..."
- Submit: Enter key or click + button
- Priority selector: Three dots (●●●) below input

### 6.6 ProgressBar
- Animated width transition (300ms ease-out)
- Background: Light gray
- Fill: Gradient from primary to accent
- Label: "X/Y 完成"

---

## 7. Functionality Specification

### 7.1 Task Data Model

```typescript
interface Task {
  id: string;           // UUID
  text: string;         // Task description
  completed: boolean;    // Completion status
  priority: 'high' | 'medium' | 'low';
  createdAt: string;     // ISO date string
  isToday: boolean;      // Marked for "today" view
  completedAt?: string;  // When completed (ISO date)
}
```

### 7.2 Core Features

1. **Add Task**
   - Enter text → Press Enter or click + button
   - Default priority: medium
   - Animation: Slide up from bottom + fade in

2. **Complete Task**
   - Click checkbox to toggle
   - Animation: Checkbox bounces, text fades to strikethrough
   - Completed tasks move to bottom of list

3. **Edit Task**
   - Double-click text to enter edit mode
   - Click outside or press Enter to save
   - Press Escape to cancel

4. **Delete Task**
   - Hover reveals delete button
   - Click delete → Task slides out + fades
   - No confirmation for single delete (keep it fast)

5. **Priority Change**
   - Click priority dot to cycle: high → medium → low → high
   - Visual: Dot color changes

6. **Tab Filtering**
   - "今日": `isToday === true || createdAt === today`
   - "全部": All tasks
   - "已完成": `completed === true`

### 7.3 Data Persistence

- **Storage:** electron-store (JSON file)
- **Key:** `tasks`
- **Auto-save:** On every mutation
- **Load:** On app startup

### 7.4 Confetti Animation

- Trigger: When all tasks completed (count > 0)
- Duration: 3 seconds
- Particles: Gold and green colors

---

## 8. Animation Specifications

| Animation | Type | Duration | Easing |
|-----------|------|----------|--------|
| Task Add | slideUp + fadeIn | 400ms | spring(1, 80, 10) |
| Task Complete | scale bounce | 300ms | spring(2, 10) |
| Task Delete | slideRight + fadeOut | 300ms | easeOut |
| Progress Bar | width | 300ms | easeOut |
| Tab Underline | layoutId | 300ms | easeOut |
| Page Load | staggerChildren | 50ms delay | - |
| Dark Mode | all colors | 200ms | easeOut |

---

## 9. File Structure

```
daily-todo/
├── electron/
│   ├── main.ts           # Main process
│   └── preload.ts        # Preload script (IPC)
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── TitleBar.tsx
│   │   ├── Header.tsx
│   │   ├── TabBar.tsx
│   │   ├── TaskList.tsx
│   │   ├── TaskItem.tsx
│   │   ├── AddTaskInput.tsx
│   │   └── Confetti.tsx
│   ├── hooks/
│   │   └── useTasks.ts
│   ├── store/
│   │   └── taskStore.ts
│   ├── types/
│   │   └── task.ts
│   └── styles/
│       └── globals.css
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## 10. Acceptance Criteria

- [ ] Application launches without errors
- [ ] Tasks can be added, completed, edited, deleted
- [ ] Priority can be changed
- [ ] Tab filtering works correctly
- [ ] Progress bar updates in real-time
- [ ] Confetti triggers when all tasks complete
- [ ] Data persists across app restarts
- [ ] Dark mode toggle works smoothly
- [ ] All animations are smooth (60fps)
- [ ] Window controls (minimize, close) work
- [ ] Custom title bar is draggable
- [ ] No TypeScript errors
