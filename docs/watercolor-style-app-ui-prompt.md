STYLEKIT_STYLE_REFERENCE
style_name: 水彩画风应用UI
style_slug: watercolor-style-app
style_source: /styles/watercolor-style-app

# Hard Prompt

请严格遵守以下风格规则并保持一致性，禁止风格漂移。

## 执行要求
- 优先保证风格一致性，其次再做创意延展。
- 遇到冲突时以禁止项为最高优先级。
- 输出前自检：颜色、排版、间距、交互是否仍属于该风格。
- 移动优先设计：所有UI组件优先考虑移动端触摸交互。

## Style Rules
# Watercolor Style App UI (水彩画风应用界面) Design System

> 灵感源自水彩画的移动应用设计风格，柔和的颜色渐变、模糊的边缘效果、纸张质感背景和流动的色彩扩散，为移动应用注入艺术气息与诗意。

## 核心理念

Watercolor Style App UI 是一种模拟水彩画效果的移动应用设计风格，通过柔和的颜色渐变、模糊的边缘和流动的色彩扩散，为界面注入艺术气息和诗意感受。

核心理念：
- 流动感：颜色像水彩一样自然渗透和扩散
- 柔和边缘：使用大圆角和柔和过渡，没有硬朗的边界
- 纸张质感：底层保留水彩纸的温暖纹理
- 透明叠加：水彩的半透明特性，颜色层层叠加
- 触摸友好：所有交互元素至少44x44px，适合手指点击

设计原则：
- 移动优先：优先考虑单手操作和拇指可达区域
- 视觉一致性：所有组件必须遵循统一的视觉语言
- 层次分明：通过颜色深浅、字号大小、留白空间建立清晰的信息层级
- 触摸反馈：每个可交互元素都必须有明确的 active、pressed 状态反馈
- 响应式适配：设计必须在不同屏幕尺寸上保持一致的体验
- 无障碍性：确保色彩对比度符合 WCAG 2.1 AA 标准

---

## Token 字典（精确 Class 映射）

### 边框
```
宽度: border
颜色: border-[#4a6fa5]/20
圆角: rounded-2xl
```

### 阴影
```
小:   shadow-[0_2px_10px_rgba(74,111,165,0.1)]
中:   shadow-[0_4px_20px_rgba(74,111,165,0.12)]
大:   shadow-[0_8px_30px_rgba(74,111,165,0.15)]
按下: active:shadow-[0_2px_10px_rgba(74,111,165,0.08)]
聚焦: focus:shadow-[0_4px_20px_rgba(74,111,165,0.15)]
```

### 交互效果
```
过渡动画: transition-all duration-400 ease-out
按下状态: active:scale-[0.98]
禁用状态: disabled:opacity-50 disabled:cursor-not-allowed
```

### 字体
```
标题: font-serif font-light tracking-wide
正文: font-sans font-light
小字: font-sans font-light text-xs
```

### 字号
```
大标题: text-2xl
标题:   text-xl
副标题: text-lg
正文:   text-base
小字:   text-sm
微字:   text-xs
```

### 间距
```
屏幕边距: px-4 py-4
卡片内边距: p-5
列表项: px-4 py-3
按钮: px-6 py-3
输入框: px-4 py-3
组件间距: space-y-4 或 gap-4
```

### 触摸目标
```
最小尺寸: min-h-[44px] min-w-[44px]
按钮高度: h-12
输入框高度: h-12
列表项高度: min-h-[60px]
```

---

## [FORBIDDEN] 绝对禁止

以下 class 在本风格中**绝对禁止使用**，生成时必须检查并避免：

### 禁止的 Class
- `rounded-none`
- `rounded-sm`
- `border-black`
- `border-2`
- `border-4`
- `border-dashed`
- `shadow-[2px_2px_0px`
- `shadow-[4px_4px_0px`
- `shadow-[8px_8px_0px`
- `font-black`
- `font-bold`
- `font-semibold`
- `bg-black`
- `bg-[#1a1a1a]`
- `text-black`
- `hover:` (移动端不使用hover效果)

### 禁止的模式
- 匹配 `^rounded-(?:none|sm)$`
- 匹配 `^shadow-\[\d+px_\d+px_0px`
- 匹配 `^border-(?:black|dashed|2|4)$`
- 匹配 `^font-(?:black|bold|semibold)$`
- 匹配 `^bg-(?:black|\[#1a1a)`
- 匹配 `^hover:`

### 禁止原因
- `rounded-none`: Watercolor 使用柔和的大圆角 (rounded-2xl)
- `border-4`: Watercolor 使用细腻的边框，不使用粗边框
- `shadow-[4px_4px_0px`: Watercolor 使用柔和扩散阴影，不使用硬边缘阴影
- `font-black`: Watercolor 使用轻盈的字重 (font-light) 营造精致感
- `border-dashed`: Watercolor 使用实线边框，不使用虚线
- `hover:`: 移动端应用使用触摸交互，不使用鼠标悬停效果

> WARNING: 如果你的代码中包含以上任何 class，必须立即替换。

---

## [REQUIRED] 必须包含

### 按钮必须包含
```
rounded-2xl
shadow-[0_4px_20px_rgba(74,111,165,0.12)]
active:scale-[0.98]
transition-all duration-400 ease-out
font-light
min-h-[44px]
```

### 卡片必须包含
```
rounded-2xl
border border-[#4a6fa5]/20
shadow-[0_4px_20px_rgba(74,111,165,0.12)]
bg-[#faf8f5]
p-5
```

### 输入框必须包含
```
rounded-2xl
border border-[#4a6fa5]/20
bg-white/60
font-light
h-12
px-4
focus:shadow-[0_4px_20px_rgba(74,111,165,0.15)]
focus:outline-none
```

### 列表项必须包含
```
min-h-[60px]
border-b border-[#4a6fa5]/20
px-4 py-3
active:bg-[#f0f4f8]/50
transition-all duration-400 ease-out
```

### 底部导航必须包含
```
border-t border-[#4a6fa5]/20
bg-white/80
backdrop-blur-md
h-16
```

---

## [COMPARE] 错误 vs 正确对比

### 按钮

[WRONG] **错误示例**（使用了小圆角和硬阴影）：
```html
<button class="rounded-sm shadow-[2px_2px_0px_rgba(0,0,0,1)] bg-blue-500 text-white px-4 py-2 hover:shadow-none">
  点击我
</button>
```

[CORRECT] **正确示例**（使用大圆角、柔和阴影、缩放反馈）：
```html
<button class="rounded-2xl shadow-[0_4px_20px_rgba(74,111,165,0.12)] bg-gradient-to-br from-[#a8c5e3] to-[#7fa3c9] text-white px-6 py-3 min-h-[44px] font-light active:scale-[0.98] transition-all duration-400 ease-out">
  点击我
</button>
```

### 卡片

[WRONG] **错误示例**（使用了硬边框和无圆角）：
```html
<div class="rounded-none border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] bg-white p-6">
  <h3 class="text-xl font-black">标题</h3>
</div>
```

[CORRECT] **正确示例**（纸张背景、柔和边框、大圆角）：
```html
<div class="rounded-2xl border border-[#4a6fa5]/20 shadow-[0_4px_20px_rgba(74,111,165,0.12)] bg-[#faf8f5] p-5">
  <h3 class="font-serif font-light tracking-wide text-lg">标题</h3>
  <p class="font-sans font-light text-sm text-[#6a7a8a] mt-2">描述内容</p>
</div>
```

### 输入框

[WRONG] **错误示例**（虚线边框、小圆角）：
```html
<input class="rounded-sm border-2 border-dashed border-black px-3 py-2 focus:shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
```

[CORRECT] **正确示例**（半透明背景、柔和边框、聚焦阴影）：
```html
<input class="rounded-2xl border border-[#4a6fa5]/20 bg-white/60 h-12 px-4 font-light focus:shadow-[0_4px_20px_rgba(74,111,165,0.15)] focus:outline-none" placeholder="请输入..." />
```

### 列表项

[WRONG] **错误示例**（虚线分隔、小触摸目标）：
```html
<div class="border-b-2 border-dashed border-black px-3 py-2 hover:bg-gray-50">
  <span class="text-sm font-bold">列表项</span>
</div>
```

[CORRECT] **正确示例**（柔和分隔、足够的触摸目标、触摸反馈）：
```html
<div class="min-h-[60px] border-b border-[#4a6fa5]/20 px-4 py-3 flex items-center active:bg-[#f0f4f8]/50 transition-all duration-400 ease-out">
  <span class="font-sans font-light text-base">列表项</span>
</div>
```

---

## [TEMPLATES] 应用UI组件模板

使用以下模板生成应用界面，只需替换 `{PLACEHOLDER}` 部分：

### 顶部应用栏骨架
```html
<header class="bg-white/80 backdrop-blur-md border-b border-[#4a6fa5]/20 px-4 h-14 flex items-center justify-between">
  <button class="min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-[0.95] transition-all duration-400 ease-out">
    {BACK_ICON}
  </button>
  <h1 class="font-serif font-light text-lg tracking-wide">
    {PAGE_TITLE}
  </h1>
  <button class="min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-[0.95] transition-all duration-400 ease-out">
    {ACTION_ICON}
  </button>
</header>
```

### 列表视图骨架
```html
<div class="bg-gradient-to-b from-[#faf8f5] to-[#f0f4f8] min-h-screen">
  <!-- List container -->
  <div class="divide-y-0">
    <!-- List item template - repeat for each item -->
    <div class="min-h-[60px] border-b border-[#4a6fa5]/20 px-4 py-3 flex items-center justify-between active:bg-[#f0f4f8]/50 transition-all duration-400 ease-out">
      <div class="flex-1">
        <h3 class="font-sans font-light text-base">{ITEM_TITLE}</h3>
        <p class="font-sans font-light text-sm text-[#6a7a8a] mt-1">{ITEM_SUBTITLE}</p>
      </div>
      <svg class="w-5 h-5 text-[#4a6fa5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7"/>
      </svg>
    </div>
  </div>
</div>
```

### 卡片网格骨架
```html
<div class="bg-gradient-to-b from-[#faf8f5] to-[#f0f4f8] p-4">
  <h2 class="font-serif font-light text-xl tracking-wide mb-4">{SECTION_TITLE}</h2>
  <div class="grid grid-cols-2 gap-4">
    <!-- Card template - repeat for each card -->
    <div class="rounded-2xl border border-[#4a6fa5]/20 shadow-[0_4px_20px_rgba(74,111,165,0.12)] bg-[#faf8f5] p-5 active:scale-[0.98] transition-all duration-400 ease-out">
      <div class="aspect-square bg-gradient-to-br from-[#e8f0f8] to-[#d8e8f5] rounded-2xl border border-[#4a6fa5]/10 mb-3 flex items-center justify-center">
        {CARD_ICON}
      </div>
      <h3 class="font-sans font-light text-sm">{CARD_TITLE}</h3>
      <p class="font-sans font-light text-xs text-[#6a7a8a] mt-1">{CARD_DESCRIPTION}</p>
    </div>
  </div>
</div>
```

### 表单输入骨架
```html
<div class="bg-gradient-to-b from-[#faf8f5] to-[#f0f4f8] p-4 space-y-4">
  <!-- Input field template -->
  <div>
    <label class="font-sans font-light text-sm text-[#4a6fa5] mb-2 block">
      {LABEL_TEXT}
    </label>
    <input 
      type="text" 
      class="w-full rounded-2xl border border-[#4a6fa5]/20 bg-white/60 h-12 px-4 font-light focus:shadow-[0_4px_20px_rgba(74,111,165,0.15)] focus:outline-none transition-all duration-400 ease-out" 
      placeholder="{PLACEHOLDER}"
    />
  </div>
  
  <!-- Textarea template -->
  <div>
    <label class="font-sans font-light text-sm text-[#4a6fa5] mb-2 block">
      {LABEL_TEXT}
    </label>
    <textarea 
      class="w-full rounded-2xl border border-[#4a6fa5]/20 bg-white/60 min-h-[120px] px-4 py-3 font-light focus:shadow-[0_4px_20px_rgba(74,111,165,0.15)] focus:outline-none resize-none transition-all duration-400 ease-out" 
      placeholder="{PLACEHOLDER}"
    ></textarea>
  </div>
  
  <!-- Submit button -->
  <button class="w-full rounded-2xl shadow-[0_4px_20px_rgba(74,111,165,0.12)] bg-gradient-to-br from-[#a8c5e3] to-[#7fa3c9] text-white h-12 font-light active:scale-[0.98] transition-all duration-400 ease-out">
    {BUTTON_TEXT}
  </button>
</div>
```

### 底部导航栏骨架
```html
<nav class="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-[#4a6fa5]/20 h-16 flex items-center justify-around">
  <!-- Nav item template - repeat for each tab -->
  <button class="flex flex-col items-center justify-center min-w-[60px] min-h-[44px] active:scale-[0.95] transition-all duration-400 ease-out">
    <svg class="w-6 h-6 text-[#4a6fa5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {ICON_PATH}
    </svg>
    <span class="font-sans font-light text-xs text-[#4a6fa5] mt-1">{TAB_LABEL}</span>
  </button>
</nav>
```

### 对话框/模态框骨架
```html
<!-- Backdrop -->
<div class="fixed inset-0 bg-[#4a6fa5]/20 backdrop-blur-sm flex items-center justify-center p-4">
  <!-- Dialog -->
  <div class="bg-[#faf8f5] rounded-2xl border border-[#4a6fa5]/20 shadow-[0_8px_30px_rgba(74,111,165,0.15)] p-6 max-w-sm w-full">
    <h2 class="font-serif font-light text-xl tracking-wide mb-2">{DIALOG_TITLE}</h2>
    <p class="font-sans font-light text-sm text-[#6a7a8a] mb-6">{DIALOG_MESSAGE}</p>
    
    <!-- Actions -->
    <div class="flex gap-3">
      <button class="flex-1 rounded-2xl border border-[#4a6fa5]/20 bg-white/60 h-12 font-light active:scale-[0.98] transition-all duration-400 ease-out">
        {CANCEL_TEXT}
      </button>
      <button class="flex-1 rounded-2xl shadow-[0_4px_20px_rgba(74,111,165,0.12)] bg-gradient-to-br from-[#a8c5e3] to-[#7fa3c9] text-white h-12 font-light active:scale-[0.98] transition-all duration-400 ease-out">
        {CONFIRM_TEXT}
      </button>
    </div>
  </div>
</div>
```

### 标签页骨架
```html
<div class="bg-gradient-to-b from-[#faf8f5] to-[#f0f4f8]">
  <!-- Tab bar -->
  <div class="border-b border-[#4a6fa5]/20 flex bg-white/60 backdrop-blur-sm">
    <!-- Tab button template - repeat for each tab -->
    <button class="flex-1 h-12 font-sans font-light text-sm border-r border-[#4a6fa5]/20 last:border-r-0 active:bg-[#f0f4f8]/50 transition-all duration-400 ease-out data-[active=true]:bg-[#f0f4f8]/50 data-[active=true]:text-[#4a6fa5]">
      {TAB_LABEL}
    </button>
  </div>
  
  <!-- Tab content -->
  <div class="p-4">
    {TAB_CONTENT}
  </div>
</div>
```

### 通知/Toast骨架
```html
<div class="fixed top-4 left-4 right-4 rounded-2xl border border-[#4a6fa5]/20 bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgba(74,111,165,0.15)] p-4 flex items-start gap-3">
  <svg class="w-5 h-5 text-[#4a6fa5] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {ICON_PATH}
  </svg>
  <div class="flex-1">
    <h3 class="font-sans font-light text-sm">{NOTIFICATION_TITLE}</h3>
    <p class="font-sans font-light text-xs text-[#6a7a8a] mt-1">{NOTIFICATION_MESSAGE}</p>
  </div>
  <button class="min-w-[24px] min-h-[24px] flex items-center justify-center active:scale-[0.95] transition-all duration-400 ease-out">
    <svg class="w-4 h-4 text-[#6a7a8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  </button>
</div>
```

### 浮动操作按钮骨架
```html
<button class="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-[0_8px_30px_rgba(74,111,165,0.15)] bg-gradient-to-br from-[#a8c5e3] to-[#7fa3c9] flex items-center justify-center active:scale-[0.95] transition-all duration-400 ease-out">
  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
  </svg>
</button>
```

---

## [CHECKLIST] 生成后自检清单

**在输出代码前，必须逐项验证以下每一条。如有违反，立即修正后再输出：**

### 1. 圆角检查
- [ ] 搜索代码中的 `rounded-`
- [ ] 确认只有 `rounded-2xl` 或 `rounded-full`（仅用于圆形按钮）
- [ ] 如果发现 `rounded-none`、`rounded-sm`、`rounded-md` 等，替换为 `rounded-2xl`

### 2. 阴影检查
- [ ] 搜索代码中的 `shadow-`
- [ ] 确认只使用 `shadow-[0_Xpx_Xpx_rgba(74,111,165,...)]` 格式
- [ ] 如果发现 `shadow-[2px_2px_0px`、`shadow-lg` 等硬边缘阴影，替换为柔和扩散阴影

### 3. 边框检查
- [ ] 搜索代码中的 `border-`
- [ ] 确认边框样式是实线（无 `border-dashed`）
- [ ] 确认边框颜色是 `border-[#4a6fa5]/20` 或类似半透明色
- [ ] 如果发现 `border-black`、`border-2`、`border-dashed`，替换为正确值

### 4. 交互检查
- [ ] 所有按钮都有 `active:scale-[0.98]`
- [ ] 所有可点击元素都有 `transition-all duration-400 ease-out`
- [ ] 没有使用 `hover:` 效果（移动端不需要）
- [ ] 所有交互元素至少 `min-h-[44px]` 或 `min-w-[44px]`

### 5. 触摸目标检查
- [ ] 按钮高度至少 `h-12` 或 `min-h-[44px]`
- [ ] 列表项高度至少 `min-h-[60px]`
- [ ] 图标按钮至少 `min-h-[44px] min-w-[44px]`
- [ ] 底部导航高度 `h-16`

### 6. 字体检查
- [ ] 标题使用 `font-serif font-light tracking-wide`
- [ ] 正文使用 `font-sans font-light`
- [ ] 没有使用 `font-black`、`font-bold`、`font-semibold`

### 7. 颜色检查
- [ ] 背景色使用 `bg-[#faf8f5]`、`bg-white/60` 或柔和渐变
- [ ] 边框色使用 `border-[#4a6fa5]/20` 或类似半透明色
- [ ] 文字色使用 `text-[#4a6fa5]` 或 `text-[#6a7a8a]`
- [ ] 使用渐变时使用 `bg-gradient-to-br from-[...] to-[...]`

### 8. 移动端优化检查
- [ ] 使用固定的 px 值而非响应式断点（移动优先）
- [ ] 间距适合移动端（px-4, py-3 等）
- [ ] 字号适合移动端阅读（text-base, text-sm 等）
- [ ] 使用 `backdrop-blur-md` 增强毛玻璃效果

> CRITICAL: **如果任何一项检查不通过，必须修正后重新生成代码。**

---

## [EXAMPLES] 示例 Prompt

### 1. 水彩日记应用

水彩画风格的日记应用

```
用 Watercolor Style App UI 风格创建一个日记应用界面，要求：
1. 温暖的纸张色背景 #faf8f5
2. 柔和的水彩渐变色块作为装饰
3. 日记卡片使用半透明背景
4. 衬线字体标题
5. 大圆角和柔和阴影
6. 底部导航栏
```

### 2. 水彩笔记应用

水彩画风格的笔记应用

```
用 Watercolor Style App UI 风格设计一个笔记应用界面，要求：
1. 背景使用柔和的渐变色
2. 笔记卡片使用水彩纸质感
3. 柔和的半透明效果
4. 浮动添加按钮
5. 顶部应用栏使用毛玻璃效果
6. 整体色调温暖柔和
```

### 3. 水彩待办应用

水彩风格的待办事项应用

```
Create a todo app screen using Watercolor Style App UI with task list, categories, progress indicators, and consistent visual language.
```

### 4. 水彩冥想应用

水彩画风格的冥想应用

```
用 Watercolor Style App UI 风格创建冥想应用界面，要求：
1. 柔和的渐变背景
2. 圆形进度指示器
3. 半透明卡片
4. 轻盈的字体
5. 底部播放控制栏
6. 宁静的色彩搭配
```

### 5. 水彩阅读应用

水彩风格的阅读应用

```
用 Watercolor Style App UI 风格设计阅读应用界面，要求：
1. 书籍封面网格布局
2. 柔和的卡片阴影
3. 纸张质感背景
4. 顶部搜索栏
5. 底部导航
6. 温暖的阅读氛围
```
