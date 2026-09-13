# 三餐教练 视觉设计规范（v3：马卡龙色系）

* 文档类型：视觉设计规范（Design Token Spec）

* 版本：v3.0

* 日期：2026-09-01

* 色系方向：马卡龙色系（Macaron / Pastel）

* 人格关键词：专业 · 内心温暖 · 一点毒舌

***

## 1. 设计理念

马卡龙色系天然具有「柔软、亲和、不攻击性」的气质，天然契合教练"内心温暖"的一面。
同时通过**降低明度、增加灰度**来保持专业的克制感，避免过于甜腻；
通过**高对比度的强调色**保留"毒舌"的锐利——在热量超标、漏报提醒等关键节点上，颜色会"刺"一下。

五个方案按色相排列，覆盖绿、蓝、紫、粉、黄五个方向。

***

## 2. 方案总览

### 方案一：薄荷马卡龙

* **主色** `#7CB89E` — 柔和的薄荷绿，清新健康，像春天第一口呼吸

* **气质**：干净、有生命力、不甜腻

* **适用**：强调"健康生活方式"的教练形象

### 方案二：海盐马卡龙

* **主色** `#7E9CB8` — 低饱和蓝灰，像海盐味的马卡龙，冷静又温柔

* **气质**：沉静、可信赖、有书卷气

* **适用**：偏"专业顾问"型的教练形象

### 方案三：薰衣草马卡龙

* **主色** `#A08CB8` — 柔和的灰紫，保留薰衣草的温暖，但不幼稚

* **气质**：温柔、有安抚力、伙伴感

* **适用**：偏"陪伴型"、情绪支持为主的教练形象

### 方案四：蜜桃马卡龙

* **主色** `#D4A08C` — 柔和的蜜桃粉橘，温暖但不甜，像一杯温热的桃子茶

* **气质**：亲切、有温度、让人放下防备

* **适用**：偏"亦师亦友"、平等对话的教练形象

### 方案五：柠檬马卡龙

* **主色** `#B8A060` — 柔和的黄油柠檬黄，明媚但不刺眼

* **气质**：积极、有活力、带一点幽默感

* **适用**：偏"毒舌幽默"型的教练形象

***

## 3. 方案一：薄荷马卡龙（推荐）— 完整 Token

```css
:root {
  /* ===== Brand Primary: Mint Macaron ===== */
  --xc-primary: #7CB89E;
  --xc-primary-foreground: #FFFFFF;
  --xc-primary-50: #EDF6F2;
  --xc-primary-100: #D4EBE0;

  /* ===== Surfaces ===== */
  --xc-background: #F6FBF8;
  --xc-surface: #FFFFFF;
  --xc-surface-2: #EFF6F2;

  /* ===== Text ===== */
  --xc-foreground: #1A2822;
  --xc-muted-foreground: #5E7066;
  --xc-placeholder: #9AAFA2;

  /* ===== Lines & Borders ===== */
  --xc-border: #DCE6E0;
  --xc-input: #DCE6E0;
  --xc-ring: #7CB89E;
  --xc-divider: rgba(26, 40, 34, 0.06);

  /* ===== Status / Accent ===== */
  --xc-state-accent: #D4754A;
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
  --xc-shadow-1: 0 1px 2px rgba(26, 40, 34, 0.04), 0 1px 1px rgba(26, 40, 34, 0.02);
  --xc-shadow-2: 0 8px 24px -8px rgba(26, 40, 34, 0.04);
  --xc-shadow-3: 0 24px 60px -20px rgba(26, 40, 34, 0.04);

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

***

## 4. 方案二：海盐马卡龙 — 完整 Token

```css
:root {
  /* ===== Brand Primary: Sea Salt Macaron ===== */
  --xc-primary: #7E9CB8;
  --xc-primary-foreground: #FFFFFF;
  --xc-primary-50: #EEF3F8;
  --xc-primary-100: #D6E2EE;

  /* ===== Surfaces ===== */
  --xc-background: #F7F9FC;
  --xc-surface: #FFFFFF;
  --xc-surface-2: #F0F4F8;

  /* ===== Text ===== */
  --xc-foreground: #1A2430;
  --xc-muted-foreground: #5C6A7A;
  --xc-placeholder: #9AA8B4;

  /* ===== Lines & Borders ===== */
  --xc-border: #DCE2EA;
  --xc-input: #DCE2EA;
  --xc-ring: #7E9CB8;
  --xc-divider: rgba(26, 36, 48, 0.06);

  /* ===== Status / Accent ===== */
  --xc-state-accent: #D4754A;
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
  --xc-shadow-1: 0 1px 2px rgba(26, 36, 48, 0.05), 0 1px 1px rgba(26, 36, 48, 0.03);
  --xc-shadow-2: 0 8px 24px -8px rgba(26, 36, 48, 0.05);
  --xc-shadow-3: 0 24px 60px -20px rgba(26, 36, 48, 0.05);

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

***

## 5. 方案三：薰衣草马卡龙 — 完整 Token

```css
:root {
  /* ===== Brand Primary: Lavender Macaron ===== */
  --xc-primary: #A08CB8;
  --xc-primary-foreground: #FFFFFF;
  --xc-primary-50: #F3EFF8;
  --xc-primary-100: #E4DAEE;

  /* ===== Surfaces ===== */
  --xc-background: #F9F7FC;
  --xc-surface: #FFFFFF;
  --xc-surface-2: #F3F0F8;

  /* ===== Text ===== */
  --xc-foreground: #1E182E;
  --xc-muted-foreground: #665E7A;
  --xc-placeholder: #A098B4;

  /* ===== Lines & Borders ===== */
  --xc-border: #E2DEEA;
  --xc-input: #E2DEEA;
  --xc-ring: #A08CB8;
  --xc-divider: rgba(30, 24, 46, 0.06);

  /* ===== Status / Accent ===== */
  --xc-state-accent: #D4754A;
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
  --xc-shadow-1: 0 1px 2px rgba(30, 24, 46, 0.05), 0 1px 1px rgba(30, 24, 46, 0.03);
  --xc-shadow-2: 0 8px 24px -8px rgba(30, 24, 46, 0.05);
  --xc-shadow-3: 0 24px 60px -20px rgba(30, 24, 46, 0.05);

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

***

## 6. 方案四：蜜桃马卡龙 — 完整 Token

```css
:root {
  /* ===== Brand Primary: Peach Macaron ===== */
  --xc-primary: #D4A08C;
  --xc-primary-foreground: #FFFFFF;
  --xc-primary-50: #FBF2EE;
  --xc-primary-100: #F5E0D6;

  /* ===== Surfaces ===== */
  --xc-background: #FCF9F7;
  --xc-surface: #FFFFFF;
  --xc-surface-2: #F8F2EE;

  /* ===== Text ===== */
  --xc-foreground: #2A1E18;
  --xc-muted-foreground: #7A6558;
  --xc-placeholder: #B4A098;

  /* ===== Lines & Borders ===== */
  --xc-border: #EAE0D8;
  --xc-input: #EAE0D8;
  --xc-ring: #D4A08C;
  --xc-divider: rgba(42, 30, 24, 0.06);

  /* ===== Status / Accent ===== */
  --xc-state-accent: #C55A3A;
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
  --xc-shadow-1: 0 1px 2px rgba(42, 30, 24, 0.05), 0 1px 1px rgba(42, 30, 24, 0.03);
  --xc-shadow-2: 0 8px 24px -8px rgba(42, 30, 24, 0.05);
  --xc-shadow-3: 0 24px 60px -20px rgba(42, 30, 24, 0.05);

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

***

## 7. 方案五：柠檬马卡龙 — 完整 Token

```css
:root {
  /* ===== Brand Primary: Lemon Macaron ===== */
  --xc-primary: #B8A060;
  --xc-primary-foreground: #FFFFFF;
  --xc-primary-50: #F8F4EA;
  --xc-primary-100: #EDE4CC;

  /* ===== Surfaces ===== */
  --xc-background: #FBFAF5;
  --xc-surface: #FFFFFF;
  --xc-surface-2: #F5F2EA;

  /* ===== Text ===== */
  --xc-foreground: #262218;
  --xc-muted-foreground: #706858;
  --xc-placeholder: #B0A898;

  /* ===== Lines & Borders ===== */
  --xc-border: #E6E2D4;
  --xc-input: #E6E2D4;
  --xc-ring: #B8A060;
  --xc-divider: rgba(38, 34, 24, 0.06);

  /* ===== Status / Accent ===== */
  --xc-state-accent: #D4754A;
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
  --xc-shadow-1: 0 1px 2px rgba(38, 34, 24, 0.05), 0 1px 1px rgba(38, 34, 24, 0.03);
  --xc-shadow-2: 0 8px 24px -8px rgba(38, 34, 24, 0.05);
  --xc-shadow-3: 0 24px 60px -20px rgba(38, 34, 24, 0.05);

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

***

## 8. 五方案色板速览

| Token       | 薄荷        | 海盐        | 薰衣草       | 蜜桃        | 柠檬        |
| ----------- | --------- | --------- | --------- | --------- | --------- |
| primary     | `#7CB89E` | `#7E9CB8` | `#A08CB8` | `#D4A08C` | `#B8A060` |
| primary-50  | `#EDF6F2` | `#EEF3F8` | `#F3EFF8` | `#FBF2EE` | `#F8F4EA` |
| primary-100 | `#D4EBE0` | `#D6E2EE` | `#E4DAEE` | `#F5E0D6` | `#EDE4CC` |
| background  | `#F6FBF8` | `#F7F9FC` | `#F9F7FC` | `#FCF9F7` | `#FBFAF5` |
| surface-2   | `#EFF6F2` | `#F0F4F8` | `#F3F0F8` | `#F8F2EE` | `#F5F2EA` |
| foreground  | `#1A2822` | `#1A2430` | `#1E182E` | `#2A1E18` | `#262218` |
| muted       | `#5E7066` | `#5C6A7A` | `#665E7A` | `#7A6558` | `#706858` |
| border      | `#DCE6E0` | `#DCE2EA` | `#E2DEEA` | `#EAE0D8` | `#E6E2D4` |
| accent      | `#D4754A` | `#D4754A` | `#D4754A` | `#C55A3A` | `#D4754A` |

***

## 9. 组件级颜色分配（五方案通用）

### 9.1 聊天气泡

| 角色     | 背景               | 文字                        | 圆角            |
| ------ | ---------------- | ------------------------- | ------------- |
| 教练消息   | `--xc-surface`   | `--xc-foreground`         | 14px / 左下 4px |
| 教练消息边框 | `--xc-border`    | —                         | —             |
| 用户消息   | `--xc-primary`   | `--xc-primary-foreground` | 14px / 右下 4px |
| 系统提示   | `--xc-surface-2` | `--xc-muted-foreground`   | 8px           |

### 9.2 按钮

| 类型   | 背景                 | 文字             | 边框            |
| ---- | ------------------ | -------------- | ------------- |
| 主按钮  | `--xc-primary`     | `#FFFFFF`      | 无             |
| 次按钮  | 透明                 | `--xc-primary` | `--xc-border` |
| 文字按钮 | 透明                 | `--xc-primary` | 无             |
| 危险按钮 | `--xc-state-error` | `#FFFFFF`      | 无             |

### 9.3 标签 / Badge

| 类型   | 背景                             | 文字                   |
| ---- | ------------------------------ | -------------------- |
| 热量标签 | `--xc-state-accent`            | `#FFFFFF`            |
| 状态成功 | `--xc-state-success` (10% 透明度) | `--xc-state-success` |
| 状态警告 | `--xc-state-warning` (10% 透明度) | `--xc-state-warning` |
| 毒舌标记 | `--xc-primary-50`              | `--xc-primary`       |

***

## 10. 实施说明

1. 从五个方案中选定一个，将其对应的 CSS 变量块完整替换 `colors_and_type.css` 中的 `:root` 块。
2. 阴影 `rgba` 参数需同步为对应方案的前景色 R/G/B 值。
3. 所有页面文件引用 `--xc-*` 变量，无需改动 HTML 结构。
4. 马卡龙色系整体偏柔和，需确认用户气泡（主色底白字）的对比度达标（WCAG AA ≥ 4.5:1），必要时微调主色深度。
5. 强调色（`--xc-state-accent`）在柔和背景下会更突出，这正是"毒舌"的视觉锚点。

***

## 11. 方案选择建议

| 教练形象      | 推荐方案   |
| --------- | ------ |
| 偏"健康生活伙伴" | 薄荷马卡龙  |
| 偏"专业顾问"   | 海盐马卡龙  |
| 偏"情绪陪伴"   | 薰衣草马卡龙 |
| 偏"亦师亦友"   | 蜜桃马卡龙  |
| 偏"毒舌幽默"   | 柠檬马卡龙  |

