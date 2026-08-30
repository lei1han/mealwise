# X教练 视觉设计规范（配色方案二：鼠尾草绿）

- 文档类型：视觉设计规范（Design Token Spec）
- 版本：v1.0
- 日期：2026-08-28
- 配色方案：方案二 · 鼠尾草绿
- 人格关键词：专业冷静 · 天然健康 · 柔和有度

---

## 1. 配色总览

### 1.1 设计理念

围绕「专业 + 内心温暖 + 一点毒舌」的教练人格。
鼠尾草绿（Sage Green）作为主色：专业冷静的基底，天然健康感，柔和而不甜腻，专业中透出温度。
暖橙强调色保留在热量标签、警告等关键节点，确保"内心温暖"不丢失。

### 1.2 色板速览

| Token | 色值 | 用途 |
|---|---|---|
| 主色 | `#4E7A5C` | 主按钮、用户气泡、强调元素 |
| 主色前景 | `#FFFFFF` | 主色上的文字 |
| 主色 50 | `#EEF5F0` | 主色最浅背景（标签、选中态） |
| 主色 100 | `#D6E8DC` | 主色浅背景（hover、高亮区） |
| 背景 | `#F8FBF9` | 页面底色 |
| 卡片 | `#FFFFFF` | 卡片、弹窗、输入框 |
| 次级背景 | `#F1F5F2` | 次级区域、分隔背景 |
| 前景 | `#1A2620` | 主文字 |
| 次级文字 | `#5C7064` | 辅助说明、时间戳 |
| 占位文字 | `#9AACA0` | 输入框占位 |
| 边框 | `#DEE6E0` | 分割线、卡片边框 |
| 强调色 | `#C5733A` | 热量标签、警告、数据高亮 |
| 强调色前景 | `#FFFFFF` | 强调色上的文字 |
| 成功 | `#22C55E` | 达标、完成 |
| 警告 | `#F59E0B` | 提醒、接近上限 |
| 错误 | `#EF4444` | 超标、危险信号 |

---

## 2. 完整 CSS 变量（Design Tokens）

```css
:root {
  /* ===== Brand Primary: Sage Green ===== */
  --xc-primary: #4E7A5C;
  --xc-primary-foreground: #FFFFFF;
  --xc-primary-50: #EEF5F0;
  --xc-primary-100: #D6E8DC;

  /* ===== Surfaces ===== */
  --xc-background: #F8FBF9;
  --xc-surface: #FFFFFF;
  --xc-surface-2: #F1F5F2;

  /* ===== Text ===== */
  --xc-foreground: #1A2620;
  --xc-muted-foreground: #5C7064;
  --xc-placeholder: #9AACA0;

  /* ===== Lines & Borders ===== */
  --xc-border: #DEE6E0;
  --xc-input: #DEE6E0;
  --xc-ring: #4E7A5C;
  --xc-divider: rgba(26, 38, 32, 0.06);

  /* ===== Status / Accent ===== */
  --xc-state-accent: #C5733A;
  --xc-state-accent-foreground: #FFFFFF;
  --xc-state-success: #22C55E;
  --xc-state-warning: #F59E0B;
  --xc-state-error: #EF4444;

  /* ===== Radius ===== */
  --xc-radius-xs: 4px;
  --xc-radius-sm: 8px;
  --xc-radius-md: 12px;
  --xc-radius-lg: 16px;
  --xc-radius-pill: 999px;

  /* ===== Shadows ===== */
  --xc-shadow-1: 0 1px 2px rgba(26, 38, 32, 0.05), 0 1px 1px rgba(26, 38, 32, 0.03);
  --xc-shadow-2: 0 8px 24px -8px rgba(26, 38, 32, 0.05);
  --xc-shadow-3: 0 24px 60px -20px rgba(26, 38, 32, 0.05);

  /* ===== Typography ===== */
  --xc-font-sans: Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  --xc-font-mono: "SF Mono", "Menlo", monospace;

  /* ===== Semantic Aliases ===== */
  --xc-card: var(--xc-surface);
  --xc-card-foreground: var(--xc-foreground);
  --xc-popover: var(--xc-surface);
  --xc-popover-foreground: var(--xc-foreground);
  --xc-muted: var(--xc-surface-2);
  --xc-muted-foreground: var(--xc-muted-foreground);
}
```

---

## 3. 组件级颜色分配

### 3.1 聊天气泡

| 角色 | 背景 | 文字 | 圆角 |
|---|---|---|---|
| 教练消息 | `--xc-surface` | `--xc-foreground` | 14px / 左下 4px |
| 教练消息边框 | `--xc-border` | — | — |
| 用户消息 | `--xc-primary` | `--xc-primary-foreground` | 14px / 右下 4px |
| 系统提示 | `--xc-surface-2` | `--xc-muted-foreground` | 8px |

### 3.2 按钮

| 类型 | 背景 | 文字 | 边框 | 圆角 |
|---|---|---|---|---|
| 主按钮 | `--xc-primary` | `#FFFFFF` | 无 | `--xc-radius-sm` |
| 次按钮 | 透明 | `--xc-primary` | `--xc-border` | `--xc-radius-sm` |
| 文字按钮 | 透明 | `--xc-primary` | 无 | — |
| 危险按钮 | `--xc-state-error` | `#FFFFFF` | 无 | `--xc-radius-sm` |

### 3.3 输入框

| 状态 | 背景 | 边框 | 文字 |
|---|---|---|---|
| 默认 | `--xc-surface` | `--xc-input` | `--xc-foreground` |
| 聚焦 | `--xc-surface` | `--xc-ring` | `--xc-foreground` |
| 占位 | `--xc-surface` | `--xc-input` | `--xc-placeholder` |

### 3.4 标签 / Badge

| 类型 | 背景 | 文字 |
|---|---|---|
| 热量标签 | `--xc-state-accent` | `#FFFFFF` |
| 状态成功 | `--xc-state-success` (10% 透明度) | `--xc-state-success` |
| 状态警告 | `--xc-state-warning` (10% 透明度) | `--xc-state-warning` |
| 毒舌标记 | `--xc-primary-50` | `--xc-primary` |

### 3.5 底部导航 / 工具栏

| 元素 | 颜色 |
|---|---|
| 背景 | `--xc-surface` |
| 上边框 | `--xc-border` |
| 激活图标 | `--xc-primary` |
| 未激活图标 | `--xc-muted-foreground` |
| 激活文字 | `--xc-primary` |
| 未激活文字 | `--xc-muted-foreground` |

### 3.6 设置 / 表单页

| 元素 | 颜色 |
|---|---|
| 页面背景 | `--xc-background` |
| 分组背景 | `--xc-surface-2` |
| 卡片背景 | `--xc-surface` |
| 分组标题 | `--xc-muted-foreground` |
| 开关激活 | `--xc-primary` |
| 选中项 | `--xc-primary-50` |

---

## 4. 排版规范

| 层级 | 字号 | 字重 | 用途 |
|---|---|---|---|
| 大标题 | 22px | 700 | 页面标题 |
| 中标题 | 18px | 600 | 分组标题、卡片标题 |
| 正文 | 15px | 400 | 聊天气泡、正文 |
| 辅助文字 | 13px | 400 | 时间戳、说明、标签 |
| 小字 | 11px | 500 | 徽标、极致小字 |
| 数字强调 | 20px | 700 | 热量数字、体重数字 |

行高：正文 1.5，标题 1.3，小字 1.4。

---

## 5. 间距规范

| Token | 值 | 用途 |
|---|---|---|
| `--xc-space-xs` | 4px | 紧密间距 |
| `--xc-space-sm` | 8px | 小间距 |
| `--xc-space-md` | 12px | 常规间距 |
| `--xc-space-lg` | 16px | 大间距 |
| `--xc-space-xl` | 24px | 区块间距 |
| `--xc-space-2xl` | 32px | 页面边距 |

---

## 6. 与旧方案（方案一 暖珊瑚橙）的差异对照

| Token | 旧值 | 新值 |
|---|---|---|
| `--xc-primary` | `#F4A261` | `#4E7A5C` |
| `--xc-primary-50` | `#FFF3E8` | `#EEF5F0` |
| `--xc-primary-100` | `#FFE6D0` | `#D6E8DC` |
| `--xc-background` | `#FFFBF7` | `#F8FBF9` |
| `--xc-surface-2` | `#F8F4F0` | `#F1F5F2` |
| `--xc-foreground` | `#2C2C2C` | `#1A2620` |
| `--xc-muted-foreground` | `#7D7A78` | `#5C7064` |
| `--xc-placeholder` | `#A8A4A1` | `#9AACA0` |
| `--xc-border` | `#EDE8E3` | `#DEE6E0` |
| `--xc-state-accent` | `#E76F51` | `#C5733A` |
| `--xc-ring` | `#F4A261` | `#4E7A5C` |

---

## 7. 实施说明

1. 将第 2 节的 CSS 变量完整替换 `colors_and_type.css` 中的 `:root` 块。
2. 阴影色值中的 `rgba` 参数需同步更新为前景色（`26, 38, 32`）。
3. 所有页面文件（`pages/*.html`）引用 `--xc-*` 变量，无需改动 HTML 结构。
4. 切换后需检查：热量标签（`--xc-state-accent`）在绿色背景上是否足够醒目，必要时可微调饱和度为 `#CC6B2E`。