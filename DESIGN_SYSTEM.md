# AI 编码助手 — 设计系统

> 基于 Tavily 搜索 ChatGPT、Claude.ai、Shadcn UI、Prompt Kit、Peloton 等产品的设计研究。
> 核心参考：**Claude.ai 的极简克制 + Shadcn UI 的精致组件质感**。

---

## 设计原则

1. **极简克制** — 颜色只用于一个强调点，其余全是灰阶
2. **层次分明** — 通过阴影、边框、背景色差创造深度，不用颜色区分
3. **精致代码块** — 仿 VS Code 暗色主题，深灰底 + 亮色文字
4. **克制动画** — 只在关键交互处用 200ms ease-out，不花哨
5. **呼吸留白** — 充裕的 padding 和 margin，不拥挤

---

## 色彩系统（仅 3 色）

```
黑色  #09090b  文字、用户气泡、发送按钮、Logo 方块
白色  #ffffff  卡片背景、AI 气泡、输入框、侧边栏
蓝色  #2563eb  仅用于：选区高亮、focus ring、链接（极少出现）
```

### 背景

```
页面背景  #fafafa  中性浅灰（不是暖灰也不是冷灰）
```

### 边框

```
统一  #e5e7eb（Tailwind gray-200）
不要用透明度、不要用花哨的颜色边框
```

### 状态色（仅在状态指示器小圆点中使用）

```
在线/成功  emerald-500  #10b981
加载中     amber-400    #fbbf24
错误       red-500      #ef4444
```

---

## 字体

```
字体栈: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
正文:    14px / 1.6
辅助:    13px
标签:    11px uppercase tracking-wider
字重:    400（正文）/ 500（按钮、标签）/ 600（标题）
```

---

## 圆角

```
大卡片/气泡/面板  rounded-2xl (16px)
小元素/按钮/输入  rounded-xl  (12px)
头像/小图标方块   rounded-md  (8px)  或 rounded-lg (12px)
```

## 阴影

```
仅 2 级:
  shadow-sm   卡片默认
  shadow-xl   浮层（设置面板、模态框）
不要到处加阴影，保持干净
```

---

## 组件规范

### 消息气泡

- **用户消息**: `bg-gray-900 text-white rounded-2xl rounded-tr-md`（深色，右侧）
- **AI 消息**: `bg-white border border-gray-200 rounded-2xl rounded-tl-md`（白卡片，左侧）
- 头像: 24px 圆角方块 `rounded-md`，用户 `bg-gray-200`，AI `bg-gray-900` + 白色 "AI" 文字
- 消息间距: `space-y-6`
- 时间戳: 默认隐藏，hover 时显示（`text-gray-300 text-[11px]`）

### 代码块（重点）

```css
背景:     bg-[#1e1e1e]（VS Code 暗色主题）
头部:     bg-[#2d2d2d]，显示语言标签 + 复制按钮
代码文字: text-[#d4d4d4]
边框:     border border-[#3e3e3e]
圆角:     rounded-lg
字体:     font-mono text-[13px]
```

### 内联代码

```css
bg-gray-100 rounded text-[12px] font-mono text-gray-700
```

### 输入区

- 背景: `bg-white border-t border-gray-200`
- 输入框: `bg-gray-50 border border-gray-200 rounded-xl`，高度 48px
- 聚焦: `border-gray-900` + `shadow-[0_0_0_1px_rgba(9,9,11,0.08)]`
- 发送按钮: `bg-gray-900 text-white hover:bg-gray-800 rounded-xl`，高度 48px
- 禁用: `bg-gray-100 text-gray-300`

### 侧边栏

- 背景: `bg-white border-r border-gray-200`（纯白，无毛玻璃）
- Logo: `bg-gray-900` 圆角方块 + 白色图标
- 工具行: `hover:bg-gray-50 rounded-md`
- 底部操作: 灰色文字按钮，hover 时变深

### 空状态

- 居中大标题 + 3 个快捷提示卡片
- 卡片: `bg-white border border-gray-200 rounded-xl`，hover 时 `border-gray-300 bg-gray-50`

### ToggleSwitch

- 开: `bg-gray-900`（黑色）
- 关: `bg-gray-200`（浅灰）
- 不用彩色

### 设置面板

- 遮罩: `bg-black/20 backdrop-blur-sm`
- 面板: `bg-white rounded-2xl shadow-xl border border-gray-200`

### 打字指示器

- 3 个 `bg-gray-400` 小圆点，弹跳动画
- 不带头像

---

## 动画规范

```
时长:    200ms（统一）
缓动:    ease-out（进入）、ease-out（退出，但更短）
循环动画: 仅打字指示器 3 点弹跳
禁止:    whileHover scale 弹跳、到处 bounce
Framer Motion 用途: 消息入场(y+6, opacity)、空状态淡入、面板弹入
```

---

## 绝对禁止

- 彩色渐变气泡（如 from-primary to primary-dark）
- 毛玻璃侧边栏（backdrop-blur）
- 到处弹跳的 scale 动画
- 3 种以上颜色同时出现
- 彩色 toggle 开关
- 彩色发送按钮
- 超过 2 级阴影
- emoji 作为图标（用 Lucide SVG）
