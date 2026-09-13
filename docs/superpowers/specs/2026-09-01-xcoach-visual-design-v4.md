# 三餐教练 视觉设计规范（v4：低饱和暖调）

* 文档类型：视觉设计规范（Design Token Spec）

* 版本：v4.0

* 日期：2026-09-01

* 色系方向：低饱和度暖色调 · 圆润纤细 · 干净柔和

* 人格关键词：专业 · 内心温暖 · 一点毒舌

***

## 1. 设计理念

五个方案共同遵循「低饱和 + 暖色调」的底色，营造**干净、柔和、舒适**的视觉感受。
圆角、轻阴影、低对比度背景共同构筑"圆润纤细不尖锐"的触感。
暖橙色强调色在柔和底色上形成唯一的锐利锚点——热量标签、漏报提醒——这就是"毒舌"的视觉落点。

***

## 2. 方案总览

| 方案      | 主色        | 色相  | 气质          |
| ------- | --------- | --- | ----------- |
| 一 · 杏仁奶 | `#C4A882` | 暖米棕 | 温润如玉，不争不抢   |
| 二 · 蜜桃茶 | `#D4AA8C` | 暖粉橘 | 柔和亲切，像下午茶时光 |
| 三 · 玫瑰雾 | `#C49598` | 灰粉  | 温柔克制，有呼吸感   |
| 四 · 焦糖奶 | `#C49A6C` | 暖金棕 | 温暖醇厚，有安全感   |
| 五 · 燕麦色 | `#C0B098` | 暖灰米 | 极致中性，宁静不打扰  |

***

## 3. 方案一：杏仁奶 — 完整 Token

```css
:root {
  /* ===== Brand Primary: Almond Milk ===== */
  --xc-primary: #C4A882;
  --xc-primary-foreground: #FFFFFF;
  --xc-primary-50: #F7F2EA;
  --xc-primary-100: #EDE2D0;

  /* ===== Surfaces ===== */
  --xc-background: #FBFAF6;
  --xc-surface: #FFFFFF;
  --xc-surface-2: #F5F2EA;

  /* ===== Text ===== */
  --xc-foreground: #2A2418;
  --xc-muted-foreground: #7A7060;
  --xc-placeholder: #B0A898;

  /* ===== Lines & Borders ===== */
  --xc-border: #E8E2D4;
  --xc-input: #E8E2D4;
  --xc-ring: #C4A882;
  --xc-divider: rgba(42, 36, 24, 0.06);

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
  --xc-shadow-1: 0 1px 2px rgba(42, 36, 24, 0.04), 0 1px 1px rgba(42, 36, 24, 0.02);
  --xc-shadow-2: 0 8px 24px -8px rgba(42, 36, 24, 0.04);
  --xc-shadow-3: 0 24px 60px -20px rgba(42, 36, 24, 0.04);

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

## 4. 方案二：蜜桃茶 — 完整 Token

```css
:root {
  /* ===== Brand Primary: Peach Tea ===== */
  --xc-primary: #D4AA8C;
  --xc-primary-foreground: #FFFFFF;
  --xc-primary-50: #FBF3EC;
  --xc-primary-100: #F5E2D4;

  /* ===== Surfaces ===== */
  --xc-background: #FCF9F6;
  --xc-surface: #FFFFFF;
  --xc-surface-2: #F8F2EC;

  /* ===== Text ===== */
  --xc-foreground: #2A2018;
  --xc-muted-foreground: #7A6858;
  --xc-placeholder: #B4A298;

  /* ===== Lines & Borders ===== */
  --xc-border: #EAE0D8;
  --xc-input: #EAE0D8;
  --xc-ring: #D4AA8C;
  --xc-divider: rgba(42, 32, 24, 0.06);

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
  --xc-shadow-1: 0 1px 2px rgba(42, 32, 24, 0.04), 0 1px 1px rgba(42, 32, 24, 0.02);
  --xc-shadow-2: 0 8px 24px -8px rgba(42, 32, 24, 0.04);
  --xc-shadow-3: 0 24px 60px -20px rgba(42, 32, 24, 0.04);

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

## 5. 方案三：玫瑰雾 — 完整 Token

```css
:root {
  /* ===== Brand Primary: Rose Mist ===== */
  --xc-primary: #C49598;
  --xc-primary-foreground: #FFFFFF;
  --xc-primary-50: #F9F0F0;
  --xc-primary-100: #F0DCDC;

  /* ===== Surfaces ===== */
  --xc-background: #FCF9F8;
  --xc-surface: #FFFFFF;
  --xc-surface-2: #F8F2F0;

  /* ===== Text ===== */
  --xc-foreground: #2A1E1E;
  --xc-muted-foreground: #7A6262;
  --xc-placeholder: #B4A0A0;

  /* ===== Lines & Borders ===== */
  --xc-border: #EAE0DE;
  --xc-input: #EAE0DE;
  --xc-ring: #C49598;
  --xc-divider: rgba(42, 30, 30, 0.06);

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
  --xc-shadow-1: 0 1px 2px rgba(42, 30, 30, 0.04), 0 1px 1px rgba(42, 30, 30, 0.02);
  --xc-shadow-2: 0 8px 24px -8px rgba(42, 30, 30, 0.04);
  --xc-shadow-3: 0 24px 60px -20px rgba(42, 30, 30, 0.04);

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

## 6. 方案四：焦糖奶 — 完整 Token

```css
:root {
  /* ===== Brand Primary: Caramel Milk ===== */
  --xc-primary: #C49A6C;
  --xc-primary-foreground: #FFFFFF;
  --xc-primary-50: #F8F0E6;
  --xc-primary-100: #EDDEC8;

  /* ===== Surfaces ===== */
  --xc-background: #FCFAF5;
  --xc-surface: #FFFFFF;
  --xc-surface-2: #F6F2EA;

  /* ===== Text ===== */
  --xc-foreground: #2A2218;
  --xc-muted-foreground: #7A6C58;
  --xc-placeholder: #B4A898;

  /* ===== Lines & Borders ===== */
  --xc-border: #EAE2D4;
  --xc-input: #EAE2D4;
  --xc-ring: #C49A6C;
  --xc-divider: rgba(42, 34, 24, 0.06);

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
  --xc-shadow-1: 0 1px 2px rgba(42, 34, 24, 0.04), 0 1px 1px rgba(42, 34, 24, 0.02);
  --xc-shadow-2: 0 8px 24px -8px rgba(42, 34, 24, 0.04);
  --xc-shadow-3: 0 24px 60px -20px rgba(42, 34, 24, 0.04);

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

## 7. 方案五：燕麦色 — 完整 Token

```css
:root {
  /* ===== Brand Primary: Oatmeal ===== */
  --xc-primary: #C0B098;
  --xc-primary-foreground: #FFFFFF;
  --xc-primary-50: #F6F2EA;
  --xc-primary-100: #EBE2D2;

  /* ===== Surfaces ===== */
  --xc-background: #FAF8F4;
  --xc-surface: #FFFFFF;
  --xc-surface-2: #F4F0E8;

  /* ===== Text ===== */
  --xc-foreground: #262218;
  --xc-muted-foreground: #706858;
  --xc-placeholder: #B0A898;

  /* ===== Lines & Borders ===== */
  --xc-border: #E6E2D6;
  --xc-input: #E6E2D6;
  --xc-ring: #C0B098;
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
  --xc-shadow-1: 0 1px 2px rgba(38, 34, 24, 0.04), 0 1px 1px rgba(38, 34, 24, 0.02);
  --xc-shadow-2: 0 8px 24px -8px rgba(38, 34, 24, 0.04);
  --xc-shadow-3: 0 24px 60px -20px rgba(38, 34, 24, 0.04);

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

| Token       | 杏仁奶       | 蜜桃茶       | 玫瑰雾       | 焦糖奶       | 燕麦色       |
| ----------- | --------- | --------- | --------- | --------- | --------- |
| primary     | `#C4A882` | `#D4AA8C` | `#C49598` | `#C49A6C` | `#C0B098` |
| primary-50  | `#F7F2EA` | `#FBF3EC` | `#F9F0F0` | `#F8F0E6` | `#F6F2EA` |
| primary-100 | `#EDE2D0` | `#F5E2D4` | `#F0DCDC` | `#EDDEC8` | `#EBE2D2` |
| background  | `#FBFAF6` | `#FCF9F6` | `#FCF9F8` | `#FCFAF5` | `#FAF8F4` |
| surface-2   | `#F5F2EA` | `#F8F2EC` | `#F8F2F0` | `#F6F2EA` | `#F4F0E8` |
| foreground  | `#2A2418` | `#2A2018` | `#2A1E1E` | `#2A2218` | `#262218` |
| muted       | `#7A7060` | `#7A6858` | `#7A6262` | `#7A6C58` | `#706858` |
| border      | `#E8E2D4` | `#EAE0D8` | `#EAE0DE` | `#EAE2D4` | `#E6E2D6` |
| accent      | `#D4754A` | `#D4754A` | `#D4754A` | `#D4754A` | `#D4754A` |

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

## 10. 排版规范

| 层级   | 字号   | 字重  | 行高  | 用途        |
| ---- | ---- | --- | --- | --------- |
| 大标题  | 22px | 700 | 1.3 | 页面标题      |
| 中标题  | 18px | 600 | 1.3 | 分组标题、卡片标题 |
| 正文   | 15px | 400 | 1.5 | 聊天气泡、正文   |
| 辅助文字 | 13px | 400 | 1.4 | 时间戳、说明、标签 |
| 小字   | 11px | 500 | 1.4 | 徽标、极致小字   |
| 数字强调 | 20px | 700 | 1.3 | 热量数字、体重数字 |

***

## 11. 间距规范

| Token            | 值    | 用途   |
| ---------------- | ---- | ---- |
| `--xc-space-xs`  | 4px  | 紧密间距 |
| `--xc-space-sm`  | 8px  | 小间距  |
| `--xc-space-md`  | 12px | 常规间距 |
| `--xc-space-lg`  | 16px | 大间距  |
| `--xc-space-xl`  | 24px | 区块间距 |
| `--xc-space-2xl` | 32px | 页面边距 |

***

## 12. 实施说明

1. 从五个方案中选定一个，将其对应的 CSS 变量块完整替换 `colors_and_type.css` 中的 `:root` 块。
2. 阴影 `rgba` 参数需同步为对应方案的前景色 R/G/B 值。
3. 所有页面文件引用 `--xc-*` 变量，无需改动 HTML 结构。
4. 本版本所有方案均为暖色调低饱和，主色明度控制在 60-75% 区间，确保舒适不刺眼。
5. 强调色 `#D4754A` 在柔和底色上形成唯一高对比度锚点——热量标签、警告提示——作为"毒舌"的视觉落点。

***

## 13. 方案选择建议

| 偏好       | 推荐方案 |
| -------- | ---- |
| 最中性、不挑内容 | 燕麦色  |
| 偏温暖亲切    | 蜜桃茶  |
| 偏温柔女性化   | 玫瑰雾  |
| 偏醇厚有深度   | 焦糖奶  |
| 偏温润如玉    | 杏仁奶  |

