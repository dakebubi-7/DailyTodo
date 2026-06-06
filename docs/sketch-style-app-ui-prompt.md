STYLEKIT_STYLE_REFERENCE
style_name: 铅笔手绘风应用UI
style_slug: sketch-style-app
style_source: /styles/sketch-style-app

# Hard Prompt

请严格遵守以下风格规则并保持一致性，禁止风格漂移。

## 执行要求
- 优先保证风格一致性，其次再做创意延展。
- 遇到冲突时以禁止项为最高优先级。
- 输出前自检：颜色、排版、间距、交互是否仍属于该风格。
- 移动优先设计：所有UI组件优先考虑移动端触摸交互。

## Style Rules
# Sketch Style App UI (铅笔手绘风应用界面) Design System

> 模拟铅笔手绘的应用UI设计风格，不规则线条边框、纸张纹理背景、手写字体感、素描阴影和涂鸦装饰，为移动应用注入亲切温暖的手工质感。

## 核心理念

Sketch Style App UI 是一种模拟手绘铅笔素描的移动应用设计风格，通过不规则的线条、纸张纹理和手写感元素，为数字界面注入温暖的手工质感。

核心理念：
- 手工感：线条和形状不追求完美对齐，保留手绘的不规则感
- 纸张质感：使用暖色调米色背景模拟素描本纸张
- 铅笔线条：边框使用不均匀的手绘风格虚线
- 素描阴影：使用轻微的偏移阴影模拟铅笔描边效果
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
宽度: border-2
颜色: border-[#2c2c2c]
样式: border-dashed
圆角: rounded-sm
```

### 阴影
```
小:   shadow-[1px_1px_0px_rgba(44,44,44,0.3)]
中:   shadow-[2px_2px_0px_rgba(44,44,44,0.3)]
大:   shadow-[3px_3px_0px_rgba(44,44,44,0.3)]
按下: active:shadow-[1px_1px_0px_rgba(44,44,44,0.5)]
聚焦: focus:shadow-[2px_2px_0px_rgba(44,44,44,0.4)]
```

### 交互效果
```
过渡动画: transition-all duration-200
按下状态: active:opacity-80 active:translate-y-[1px]
禁用状态: disabled:opacity-50 disabled:cursor-not-allowed
```

### 字体
```
标题: font-sans font-semibold tracking-normal
正文: font-sans
小字: font-sans text-xs
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
卡片内边距: p-4
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
列表项高度: min-h-[56px]
```

---

## [FORBIDDEN] 绝对禁止

以下 class 在本风格中**绝对禁止使用**，生成时必须检查并避免：

### 禁止的 Class
- `rounded-xl`
- `rounded-2xl`
- `rounded-3xl`
- `rounded-full`
- `rounded-lg`
- `rounded-md`
- `shadow-lg`
- `shadow-xl`
- `shadow-2xl`
- `shadow-md`
- `bg-[#ff71ce]`
- `bg-[#01cdfe]`
- `bg-[#ff006e]`
- `bg-[#00ff00]`
- `text-[#ff71ce]`
- `text-[#01cdfe]`
- `border-4`
- `font-black`
- `bg-gradient-to-r`
- `bg-gradient-to-l`
- `bg-gradient-to-b`
- `hover:` (移动端不使用hover效果)

### 禁止的模式
- 匹配 `^rounded-(?:md|lg|xl|2xl|3xl|full)$`
- 匹配 `^shadow-(?:md|lg|xl|2xl)$`
- 匹配 `^bg-(?:\[#ff|\[#01cd|\[#00ff)`
- 匹配 `^bg-gradient-`
- 匹配 `^hover:`

### 禁止原因
- `rounded-xl`: Sketch style 使用最小圆角 (rounded-sm) 保持手绘感
- `shadow-xl`: Sketch style 使用轻微的铅笔阴影，不使用重阴影
- `bg-[#ff71ce]`: Sketch style 使用铅笔色调（灰色、米色），不使用霓虹色
- `bg-gradient-to-r`: Sketch style 使用平面纸张质感，不使用渐变
- `hover:`: 移动端应用使用触摸交互，不使用鼠标悬停效果

> WARNING: 如果你的代码中包含以上任何 class，必须立即替换。

---

## [REQUIRED] 必须包含

### 按钮必须包含
```
rounded-sm
border-2 border-dashed border-[#2c2c2c]
transition-all duration-200
font-semibold
min-h-[44px]
active:opacity-80 active:translate-y-[1px]
```

### 卡片必须包含
```
rounded-sm
border-2 border-dashed border-[#2c2c2c]
bg-[#f5f0e8]
shadow-[2px_2px_0px_rgba(44,44,44,0.3)]
p-4
```

### 输入框必须包含
```
rounded-sm
border-2 border-dashed border-[#2c2c2c]
bg-[#faf5ed]
font-sans
h-12
px-4
focus:shadow-[2px_2px_0px_rgba(44,44,44,0.4)]
focus:outline-none
```

### 列表项必须包含
```
min-h-[56px]
border-b-2 border-dashed border-[#2c2c2c]
px-4 py-3
active:bg-[#f5f0e8]
transition-all duration-200
```

### 底部导航必须包含
```
border-t-2 border-dashed border-[#2c2c2c]
bg-[#faf5ed]
h-16
```

---

## [COMPARE] 错误 vs 正确对比

### 按钮

[WRONG] **错误示例**（使用了圆角和模糊阴影）：
```html
<button class="rounded-lg shadow-lg bg-blue-500 text-white px-4 py-2 hover:bg-blue-600">
  点击我
</button>
```

[CORRECT] **正确示例**（使用虚线边框、无圆角、触摸反馈）：
```html
<button class="rounded-sm border-2 border-dashed border-[#2c2c2c] bg-[#4a4a4a] text-white px-6 py-3 min-h-[44px] font-semibold transition-all duration-200 active:opacity-80 active:translate-y-[1px]">
  点击我
</button>
```

### 卡片

[WRONG] **错误示例**（使用了渐变和圆角）：
```html
<div class="rounded-xl shadow-2xl bg-gradient-to-r from-purple-500 to-pink-500 p-6">
  <h3 class="text-xl font-semibold">标题</h3>
</div>
```

[CORRECT] **正确示例**（纸张背景、虚线边框、硬边缘阴影）：
```html
<div class="rounded-sm border-2 border-dashed border-[#2c2c2c] bg-[#f5f0e8] shadow-[2px_2px_0px_rgba(44,44,44,0.3)] p-4">
  <h3 class="font-sans font-semibold text-lg">标题</h3>
  <p class="font-sans text-sm text-[#4a4a4a] mt-2">描述内容</p>
</div>
```

### 输入框

[WRONG] **错误示例**（灰色边框、圆角、hover效果）：
```html
<input class="rounded-md border border-gray-300 px-3 py-2 hover:border-blue-500 focus:ring-2" />
```

[CORRECT] **正确示例**（虚线边框、纸张背景、聚焦阴影）：
```html
<input class="rounded-sm border-2 border-dashed border-[#2c2c2c] bg-[#faf5ed] h-12 px-4 font-sans focus:shadow-[2px_2px_0px_rgba(44,44,44,0.4)] focus:outline-none" placeholder="请输入..." />
```

### 列表项

[WRONG] **错误示例**（实线分隔、圆角、小触摸目标）：
```html
<div class="border-b border-gray-200 px-3 py-2 hover:bg-gray-50">
  <span class="text-sm">列表项</span>
</div>
```

[CORRECT] **正确示例**（虚线分隔、足够的触摸目标、触摸反馈）：
```html
<div class="min-h-[56px] border-b-2 border-dashed border-[#2c2c2c] px-4 py-3 flex items-center active:bg-[#f5f0e8] transition-all duration-200">
  <span class="font-sans text-base">列表项</span>
</div>
```

---

## [TEMPLATES] 应用UI组件模板

使用以下模板生成应用界面，只需替换 `{PLACEHOLDER}` 部分：

### 顶部应用栏骨架
```html
<header class="bg-[#faf5ed] border-b-2 border-dashed border-[#2c2c2c] px-4 h-14 flex items-center justify-between">
  <button class="min-h-[44px] min-w-[44px] flex items-center justify-center active:opacity-80 transition-all duration-200">
    {BACK_ICON}
  </button>
  <h1 class="font-sans font-semibold text-lg">
    {PAGE_TITLE}
  </h1>
  <button class="min-h-[44px] min-w-[44px] flex items-center justify-center active:opacity-80 transition-all duration-200">
    {ACTION_ICON}
  </button>
</header>
```

### 列表视图骨架
```html
<div class="bg-[#faf5ed] min-h-screen">
  <!-- List container -->
  <div class="divide-y-0">
    <!-- List item template - repeat for each item -->
    <div class="min-h-[56px] border-b-2 border-dashed border-[#2c2c2c] px-4 py-3 flex items-center justify-between active:bg-[#f5f0e8] transition-all duration-200">
      <div class="flex-1">
        <h3 class="font-sans font-semibold text-base">{ITEM_TITLE}</h3>
        <p class="font-sans text-sm text-[#6a6a6a] mt-1">{ITEM_SUBTITLE}</p>
      </div>
      <svg class="w-5 h-5 text-[#2c2c2c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </div>
  </div>
</div>
```

### 卡片网格骨架
```html
<div class="bg-[#faf5ed] p-4">
  <h2 class="font-sans font-semibold text-xl mb-4">{SECTION_TITLE}</h2>
  <div class="grid grid-cols-2 gap-4">
    <!-- Card template - repeat for each card -->
    <div class="rounded-sm border-2 border-dashed border-[#2c2c2c] bg-[#f5f0e8] shadow-[2px_2px_0px_rgba(44,44,44,0.3)] p-4 active:opacity-80 active:translate-y-[1px] transition-all duration-200">
      <div class="aspect-square bg-[#e5dfd0] rounded-sm border border-dashed border-[#2c2c2c] mb-3 flex items-center justify-center">
        {CARD_ICON}
      </div>
      <h3 class="font-sans font-semibold text-sm">{CARD_TITLE}</h3>
      <p class="font-sans text-xs text-[#6a6a6a] mt-1">{CARD_DESCRIPTION}</p>
    </div>
  </div>
</div>
```

### 表单输入骨架
```html
<div class="bg-[#faf5ed] p-4 space-y-4">
  <!-- Input field template -->
  <div>
    <label class="font-sans font-semibold text-sm text-[#2c2c2c] mb-2 block">
      {LABEL_TEXT}
    </label>
    <input 
      type="text" 
      class="w-full rounded-sm border-2 border-dashed border-[#2c2c2c] bg-[#faf5ed] h-12 px-4 font-sans focus:shadow-[2px_2px_0px_rgba(44,44,44,0.4)] focus:outline-none" 
      placeholder="{PLACEHOLDER}"
    />
  </div>
  
  <!-- Textarea template -->
  <div>
    <label class="font-sans font-semibold text-sm text-[#2c2c2c] mb-2 block">
      {LABEL_TEXT}
    </label>
    <textarea 
      class="w-full rounded-sm border-2 border-dashed border-[#2c2c2c] bg-[#faf5ed] min-h-[120px] px-4 py-3 font-sans focus:shadow-[2px_2px_0px_rgba(44,44,44,0.4)] focus:outline-none resize-none" 
      placeholder="{PLACEHOLDER}"
    ></textarea>
  </div>
  
  <!-- Submit button -->
  <button class="w-full rounded-sm border-2 border-dashed border-[#2c2c2c] bg-[#4a4a4a] text-white h-12 font-semibold transition-all duration-200 active:opacity-80 active:translate-y-[1px]">
    {BUTTON_TEXT}
  </button>
</div>
```

### 底部导航栏骨架
```html
<nav class="fixed bottom-0 left-0 right-0 bg-[#faf5ed] border-t-2 border-dashed border-[#2c2c2c] h-16 flex items-center justify-around">
  <!-- Nav item template - repeat for each tab -->
  <button class="flex flex-col items-center justify-center min-w-[60px] min-h-[44px] active:opacity-80 transition-all duration-200">
    <svg class="w-6 h-6 text-[#2c2c2c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {ICON_PATH}
    </svg>
    <span class="font-sans text-xs text-[#2c2c2c] mt-1">{TAB_LABEL}</span>
  </button>
</nav>
```

### 对话框/模态框骨架
```html
<!-- Backdrop -->
<div class="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
  <!-- Dialog -->
  <div class="bg-[#faf5ed] rounded-sm border-2 border-dashed border-[#2c2c2c] shadow-[3px_3px_0px_rgba(44,44,44,0.3)] p-6 max-w-sm w-full">
    <h2 class="font-sans font-semibold text-xl mb-2">{DIALOG_TITLE}</h2>
    <p class="font-sans text-sm text-[#6a6a6a] mb-6">{DIALOG_MESSAGE}</p>
    
    <!-- Actions -->
    <div class="flex gap-3">
      <button class="flex-1 rounded-sm border-2 border-dashed border-[#2c2c2c] bg-[#e5dfd0] h-12 font-semibold transition-all duration-200 active:opacity-80 active:translate-y-[1px]">
        {CANCEL_TEXT}
      </button>
      <button class="flex-1 rounded-sm border-2 border-dashed border-[#2c2c2c] bg-[#4a4a4a] text-white h-12 font-semibold transition-all duration-200 active:opacity-80 active:translate-y-[1px]">
        {CONFIRM_TEXT}
      </button>
    </div>
  </div>
</div>
```

### 标签页骨架
```html
<div class="bg-[#faf5ed]">
  <!-- Tab bar -->
  <div class="border-b-2 border-dashed border-[#2c2c2c] flex">
    <!-- Tab button template - repeat for each tab -->
    <button class="flex-1 h-12 font-sans font-semibold text-sm border-r-2 border-dashed border-[#2c2c2c] last:border-r-0 active:bg-[#f5f0e8] transition-all duration-200 data-[active=true]:bg-[#f5f0e8]">
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
<div class="fixed top-4 left-4 right-4 rounded-sm border-2 border-dashed border-[#2c2c2c] bg-[#f5f0e8] shadow-[3px_3px_0px_rgba(44,44,44,0.3)] p-4 flex items-start gap-3">
  <svg class="w-5 h-5 text-[#2c2c2c] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {ICON_PATH}
  </svg>
  <div class="flex-1">
    <h3 class="font-sans font-semibold text-sm">{NOTIFICATION_TITLE}</h3>
    <p class="font-sans text-xs text-[#6a6a6a] mt-1">{NOTIFICATION_MESSAGE}</p>
  </div>
  <button class="min-w-[24px] min-h-[24px] flex items-center justify-center active:opacity-80 transition-all duration-200">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  </button>
</div>
```

---

## [CHECKLIST] 生成后自检清单

**在输出代码前，必须逐项验证以下每一条。如有违反，立即修正后再输出：**

### 1. 圆角检查
- [ ] 搜索代码中的 `rounded-`
- [ ] 确认只有 `rounded-sm` 或 `rounded-none`
- [ ] 如果发现 `rounded-lg`、`rounded-md`、`rounded-xl` 等，替换为 `rounded-sm`

### 2. 阴影检查
- [ ] 搜索代码中的 `shadow-`
- [ ] 确认只使用 `shadow-[Xpx_Xpx_0px_rgba(...)]` 格式
- [ ] 如果发现 `shadow-lg`、`shadow-xl`、`shadow-md` 等，替换为正确格式

### 3. 边框检查
- [ ] 搜索代码中的 `border-`
- [ ] 确认边框样式包含 `border-dashed`
- [ ] 确认边框颜色是 `border-[#2c2c2c]`
- [ ] 如果发现实线边框或其他颜色，替换为正确值

### 4. 交互检查
- [ ] 所有按钮都有 `active:opacity-80 active:translate-y-[1px]`
- [ ] 所有可点击元素都有 `transition-all duration-200`
- [ ] 没有使用 `hover:` 效果（移动端不需要）
- [ ] 所有交互元素至少 `min-h-[44px]` 或 `min-w-[44px]`

### 5. 触摸目标检查
- [ ] 按钮高度至少 `h-12` 或 `min-h-[44px]`
- [ ] 列表项高度至少 `min-h-[56px]`
- [ ] 图标按钮至少 `min-h-[44px] min-w-[44px]`
- [ ] 底部导航高度 `h-16`

### 6. 字体检查
- [ ] 标题使用 `font-sans font-semibold`
- [ ] 正文使用 `font-sans`
- [ ] 没有使用 `font-black` 或 `font-bold`

### 7. 颜色检查
- [ ] 背景色使用 `bg-[#faf5ed]` 或 `bg-[#f5f0e8]`
- [ ] 边框色使用 `border-[#2c2c2c]`
- [ ] 文字色使用 `text-[#2c2c2c]` 或 `text-[#6a6a6a]`
- [ ] 没有使用霓虹色或渐变

### 8. 移动端优化检查
- [ ] 使用固定的 px 值而非响应式断点（移动优先）
- [ ] 间距适合移动端（px-4, py-3 等）
- [ ] 字号适合移动端阅读（text-base, text-sm 等）

> CRITICAL: **如果任何一项检查不通过，必须修正后重新生成代码。**

---

## [EXAMPLES] 示例 Prompt

### 1. 待办事项应用

铅笔手绘风格的待办事项应用

```
用 Sketch Style App UI 风格创建一个待办事项应用界面，要求：
1. 纸张纹理背景 #faf5ed
2. 虚线边框的列表项
3. 手绘感的复选框
4. 底部添加按钮
5. 顶部应用栏显示标题
6. 铅笔灰色主色调
```

### 2. 笔记应用

仿手写笔记的移动应用

```
用 Sketch Style App UI 风格设计一个笔记应用界面，要求：
1. 模仿素描本的纸张质感
2. 卡片式笔记列表
3. 虚线分隔线
4. 手绘风格的图标
5. 底部导航栏
6. 浮动添加按钮
```

### 3. 个人资料页面

手绘风格的用户资料界面

```
Create a user profile screen using Sketch Style App UI with avatar, bio section, stats cards, settings list, and consistent visual language.
```

### 4. 登录界面

铅笔手绘风格的登录页面

```
用 Sketch Style App UI 风格创建登录界面，要求：
1. 纸张背景
2. 虚线边框输入框
3. 手绘感按钮
4. 简洁的表单布局
5. 品牌标志区域
```

### 5. 商品列表

手绘风格的电商商品列表

```
用 Sketch Style App UI 风格设计商品列表界面，要求：
1. 网格布局的商品卡片
2. 虚线边框卡片
3. 纸张质感背景
4. 顶部搜索栏
5. 底部导航
6. 商品图片占位区域
```
