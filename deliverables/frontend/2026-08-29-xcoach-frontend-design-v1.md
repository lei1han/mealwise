# X教练 前端设计稿 v1.0（定稿）

- 文档类型：前端设计交付文档
- 版本：v1.0（定稿）
- 日期：2026-08-29
- 设计稿路径（HTML 原型）：`deliverables/frontend/xcoach-frontend-design/`
- 依赖设计规格：`docs/superpowers/specs/2026-08-28-xcoach-design.md`
- 依赖配色方案：`docs/superpowers/specs/2026-08-28-xcoach-visual-design-v2.md`

---

## 1. 设计概述

### 1.1 产品定位

X教练 是一个微信小程序形态的减肥教练，通过纯对话形式帮助用户靠谱减重。MVP 前端为聊天界面 + 极简子流程弹窗，不做复杂可视化。

### 1.2 设计原则

- **聊天内容优先**：全屏气泡线程，UI 元素极简，不抢对话焦点
- **温暖信任感**：鼠尾草绿配色传达专业但不冰冷，暖陶土强调色保留温度
- **操作无摩擦**：底部 Sheet 子流程，不打断对话上下文
- **微信原生体验**：遵从微信小程序导航栏、授权按钮等原生交互规范

### 1.3 目标设备

- 微信小程序（iPhone 375pt 为基准视口）
- 文档滚动模式（`document-scroll`），聊天区域可滚动

---

## 2. 设计系统（Design Tokens）

### 2.1 配色方案

| Token | 色值 | 用途 |
|---|---|---|
| `--xc-primary` | `#4E7A5C` | 品牌主色：用户气泡、主按钮、选中态、聚焦环 |
| `--xc-primary-foreground` | `#FFFFFF` | 主色上的文字 |
| `--xc-primary-50` | `#EEF5F0` | 主色浅底：教练头像背景 |
| `--xc-primary-100` | `#D6E8DC` | 主色浅底（备用） |
| `--xc-background` | `#F8FBF9` | 页面背景：淡绿底 |
| `--xc-surface` | `#FFFFFF` | 卡片/气泡底色 |
| `--xc-surface-2` | `#F1F5F2` | 次级表面：输入框背景、未选中态 |
| `--xc-foreground` | `#1A2620` | 主文字色 |
| `--xc-muted-foreground` | `#5C7064` | 次级文字 |
| `--xc-placeholder` | `#9AACA0` | 占位文字 |
| `--xc-border` | `#DEE6E0` | 边框/分割线 |
| `--xc-input` | `#DEE6E0` | 输入框边框 |
| `--xc-ring` | `#4E7A5C` | 聚焦环（同主色） |
| `--xc-state-accent` | `#C5733A` | 强调色：热量标签高亮 |
| `--xc-state-success` | `#22C55E` | 成功状态 |
| `--xc-state-warning` | `#F59E0B` | 警告状态 |
| `--xc-state-error` | `#EF4444` | 错误状态 |

### 2.2 圆角

| Token | 值 | 用途 |
|---|---|---|
| `--xc-radius-xs` | 4px | 气泡小角 |
| `--xc-radius-sm` | 8px | 按钮、输入框 |
| `--xc-radius-md` | 12px | 卡片 |
| `--xc-radius-lg` | 16px | 气泡 |
| `--xc-radius-pill` | 999px | 标签、Pill 按钮 |

### 2.3 阴影

| Token | 值 | 用途 |
|---|---|---|
| `--xc-shadow-1` | `0 1px 2px rgba(26,38,32,0.05)` | 轻微抬起：气泡、按钮 |
| `--xc-shadow-2` | `0 8px 24px -8px rgba(26,38,32,0.05)` | 中等抬起：Sheet |
| `--xc-shadow-3` | `0 24px 60px -20px rgba(26,38,32,0.05)` | 深度抬起：底部 Sheet |

### 2.4 字体

- 字体栈：`Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`
- 等宽字体：`"SF Mono", "Menlo", monospace`
- 聊天正文：15px（`text-[15px]`）
- 辅助文字：12px ~ 14px
- 标题：16px ~ 22px

### 2.5 间距

- 基础间距：4px / 8px / 12px / 16px / 24px / 32px
- 页面水平内边距：16px（`px-4`）
- 气泡间距：16px（`space-y-4`）
- 表单字段间距：16px（`gap-4`）

---

## 3. 页面清单与用户旅程

### 3.1 完整用户旅程

```
启动闪屏 → 授权登录 → 摸底对话 → 每日聊天
                              ├── 体质信息录入（Sheet）
                              ├── 毒舌档位选择（Sheet）
                              └── 订阅消息授权（Sheet）
```

### 3.2 页面一览

| 页面 ID | 页面标题 | 文件名 | 类型 | 说明 |
|---|---|---|---|---|
| `page-splash` | 启动闪屏 | `pages/splash.html` | 全屏展示 | 品牌展示 + 静默登录缓冲 |
| `page-auth-login` | 授权登录 | `pages/auth-login.html` | 全屏 | 欢迎引导 + 微信授权 |
| `page-chat-onboarding` | Onboarding 摸底定标 | `pages/chat-onboarding.html` | 聊天 | 摸底对话 + 定标确认 |
| `page-sheet-weight` | 体质信息录入 | `pages/sheet-weight.html` | 底部 Sheet | 性别/年龄段/体重/目标/身高 |
| `page-sheet-snark` | 毒舌档位选择 | `pages/sheet-snark.html` | 底部 Sheet | 温柔/轻损/辛辣三选一 |
| `page-sheet-subscribe` | 订阅消息授权 | `pages/sheet-subscribe.html` | 底部 Sheet | 订阅授权 + 降级按钮 |
| `page-chat-main` | 聊天主流程 | `pages/chat-main.html` | 聊天 | 每日执行中聊天 |

---

## 4. 各页面详细设计

### 4.1 启动闪屏（`splash.html`）

**状态**：纯展示，停留 1~2 秒后自动跳转授权登录页。

**布局**：
- 全屏鼠尾草绿（`#4E7A5C`）背景
- 垂直居中布局

**内容**：
- 品牌 "X" 字母：72px，白色，font-weight 700，居中
- 副标题："你的私人减肥教练"，15px，白色 80% 透明度
- 标语："靠谱地瘦下来"，18px，白色，font-weight 600
- 副标语："专业 · 陪伴 · 一点毒舌"，12px，白色 60% 透明度
- 底部三点加载指示（CSS animation 纯 CSS 实现）
- 加载文字："加载中..."，12px，白色 50% 透明度

**开发注意**：
- 无任何交互按钮，纯展示页
- 静默调用 `wx.login()` 获取 openid
- 1.5~2 秒后自动 `navigateTo` 到授权登录页

---

### 4.2 授权登录（`auth-login.html`）

**状态**：首次用户授权入口，融合欢迎引导。

**布局**：
- 全屏垂直布局，`min-h-screen`
- 背景色 `--xc-background`（`#F8FBF9`）

**内容分区**：

**品牌区**（顶部 15% 位置）：
- "X" 品牌字母：56px，鼠尾草绿，font-weight 700，居中
- "X教练"：22px，font-weight 700，鼠尾草绿
- "你的私人减肥教练"：14px，`--xc-muted-foreground`

**欢迎引导区**（品牌区下方 40px）：
- 白色卡片包裹（`--xc-surface`，圆角 12px，内边距 20px）
- 三行功能亮点，每行左侧 Lucide `check` 图标（鼠尾草绿），右侧文字：
  - "每日饮食记录与热量估算" — 副文字："拍张照或一句话，教练帮你估算热量区间"
  - "实时督促与毒舌陪伴" — 副文字："漏报？教练会毒舌提醒你，损事不损人"
  - "渐进式目标管理" — 副文字："从你的现状出发，倒推一个够得着的目标"
- 行间距 20px

**授权按钮区**（底部 30% 位置）：
- 主按钮："微信授权登录"，`--xc-primary` 背景，白色文字，圆角 8px，高度 48px，满宽
- 按钮下方 12px："授权后即可开始你的减肥之旅"，12px，`--xc-muted-foreground`
- 再下方 24px："先看看，暂不授权"，13px，`--xc-primary` 颜色，文字链接

**底部协议**（最底部 32px）：
- "登录即表示同意《用户协议》和《隐私政策》"，11px，`--xc-placeholder`
- 协议链接：`--xc-primary` 颜色 + 下划线

**开发注意**：
- "微信授权登录"按钮绑定 `wx.getUserProfile` 或 `<button open-type="getUserInfo">`
- 昵称和头像通过微信原生组件获取（`<input type="nickname">` + `<button open-type="chooseAvatar">`），开发时从后端配置真实头像
- "暂不授权"跳转需处理：允许进入但限制部分功能，或引导至授权页

---

### 4.3 Onboarding 摸底定标（`chat-onboarding.html`）

**状态**：首次用户摸底对话，展示教练向用户逐项了解基本情况。

**布局**：
- 顶部：微信小程序导航栏（标题 "X教练"，胶囊按钮占位）
- 中间：可滚动聊天区域
- 底部：快速回复按钮栏（sticky）

**对话流程**（按顺序）：
1. 教练：自我介绍 + 摸底开场
2. 用户：应答
3. 教练：**询问昵称**（"怎么称呼你？"）
4. 用户：回答昵称
5. 教练：询问身高体重
6. 用户：回答
7. 教练：询问减肥史
8. 用户：回答
9. 教练：询问目标体重
10. 用户：回答
11. 教练：定标确认（显示预估周期 + 三个快速回复按钮）

**快速回复按钮**：
- 主按钮："确认目标"（`--xc-primary` 背景，白色文字，圆角 pill）
- 次级按钮："我想再快一点"（白色底 + 边框）
- 次级按钮："有点长，能不能短点"（白色底 + 边框）

**气泡样式**：
- 教练气泡：白色底 + 边框，左上角小圆角，其余圆角 16px，阴影 `--xc-shadow-1`
- 用户气泡：鼠尾草绿底 + 白色文字，右上角小圆角，其余圆角 16px
- 头像：教练为圆形图标（`--xc-primary-50` 底 + `--xc-primary` 图标色），用户无头像

**开发注意**：
- 昵称在此环节自然提问获取，不走独立表单
- 定标目标的预估周期公式由后端计算，前端只展示
- 快速回复按钮点击后触发 `chat.send` 接口

---

### 4.4 体质信息录入（`sheet-weight.html`）

**状态**：底部 Sheet 弹出表单，收集身体数据，从聊天页触发。

**布局**：
- 顶部：微信小程序导航栏
- 教练提示气泡："先填一下基本身体信息，我帮你算预算。"
- 底部 Sheet：圆角 16px 顶部，含把手、表单、按钮

**表单字段**（按顺序）：

**性别**（Segmented Control）：
- 两个并排按钮："男" / "女"
- 未选中：`--xc-surface-2` 背景
- 选中态：`--xc-primary` 背景 + 白色文字
- 高度 40px，圆角 8px

**年龄段**（Horizontal Pill）：
- 5 个选项：18-24 / 25-34 / 35-44 / 45-54 / 55+
- 默认选中 25-34
- 未选中：白色底 + `--xc-border` 边框，圆角 pill
- 选中态：`--xc-primary` 背景 + 白色文字

**当前体重（kg）**：
- 数字输入框，step 0.1，输入模式 decimal
- 高度 48px，圆角 8px，`--xc-input` 边框

**目标体重（kg）**：
- 同当前体重

**身高（cm）**：
- 数字输入框，整数
- 同当前体重

**按钮**：
- 主按钮："保存"，`--xc-primary` 背景，高度 48px，圆角 8px
- 次级按钮："取消"，白色底 + 边框

**开发注意**：
- 性别和年龄段为 BMR/TDEE 计算公式必需字段
- 数字输入框需设置 `inputmode="decimal"` 或 `inputmode="numeric"`
- 保存后调用 `user.profile.update` 接口

---

### 4.5 毒舌档位选择（`sheet-snark.html`）

**状态**：底部 Sheet，用户选择教练毒舌风格。

**布局**：
- 教练提示气泡："我的毒舌程度你可以选，随时可以改。"
- 底部 Sheet 含三档选项

**三档选项**：
- 温柔："几乎不损，以鼓励为主"
- 轻损（默认）："吐槽一句 + 给台阶，损事不损人"
- 辛辣："损得更狠，但仍然有度"

**选中态**：`--xc-primary` 背景 + 白色文字，`--xc-shadow-1` 阴影

**开发注意**：
- 选择后调用 `user.profile.update` 写入 `snark_level`
- 文案中"随时可以改"暗示后续可通过聊天指令修改

---

### 4.6 订阅消息授权（`sheet-subscribe.html`）

**状态**：底部 Sheet，引导用户授权订阅消息。

**布局**：
- 教练提示气泡："每天早上我会提醒你报体重，漏报的话……你懂的。开个订阅通知？"
- 底部 Sheet 含授权说明和按钮

**授权说明**：
- 功能说明列表（Lucide 图标 + 文字）
- 教练头像占位：圆形区域，开发时接入真实头像

**按钮**：
- 主按钮："开启通知"，`--xc-primary` 背景
- 文字链接："暂时不需要"，`--xc-muted-foreground`

**开发注意**：
- 调用 `wx.requestSubscribeMessage` 弹出微信原生授权弹窗
- 授权结果通过 `subscribe.report` 接口上报后端
- 降级按钮"暂时不需要"需处理不授权场景

---

### 4.7 聊天主流程（`chat-main.html`）

**状态**：每日执行中聊天，展示完整对话闭环。

**布局**：
- 顶部：微信小程序导航栏
- 中间：可滚动聊天区域（含预算卡）
- 底部：固定输入栏（`fixed bottom-0`，含 safe-area）

**对话区域**：

**预算卡片**（教练消息中嵌入）：
- 白色卡片，圆角 12px，`--xc-shadow-1` 阴影
- 显示：今日热量预算 + 已消耗 + 剩余
- 热量数值使用 `--xc-state-accent`（暖陶土色）高亮

**教练气泡**：
- 包含文本消息 + 可选预算卡
- 催报卡片：当用户漏报时，教练主动发送催报消息

**用户气泡**：
- 鼠尾草绿底 + 白色文字
- 包含用户汇报的饮食描述

**打字动画**：
- 教练消息支持打字机效果（前端模拟）
- 三个点跳动动画（CSS animation）

**底部输入栏**：
- 固定底部，`z-40`
- 输入框：白色底 + 圆角 8px，`--xc-border` 边框
- 发送按钮：`--xc-primary` 背景，圆形图标按钮
- 需考虑 `safe-area-inset-bottom`

**开发注意**：
- 输入栏固定底部需配合 `padding-bottom` 避免遮挡最后一条消息
- 打字动画为前端纯 CSS 模拟，MVP 非流式
- 预算卡数据由后端 `chat.send` 返回
- 催报机制由后端定时任务触发，前端只展示

---

## 5. 通用组件样式规范

### 5.1 聊天气泡

**教练气泡**：
```css
background: var(--xc-surface);
color: var(--xc-foreground);
border: 1px solid var(--xc-border);
border-radius: var(--xc-radius-lg) var(--xc-radius-lg) var(--xc-radius-lg) var(--xc-radius-xs);
box-shadow: var(--xc-shadow-1);
```

**用户气泡**：
```css
background: var(--xc-primary);
color: var(--xc-primary-foreground);
border-radius: var(--xc-radius-lg) var(--xc-radius-xs) var(--xc-radius-lg) var(--xc-radius-lg);
```

### 5.2 底部 Sheet

- 顶部圆角 16px
- 顶部把手（`w-10 h-1 rounded-full`，`--xc-border` 颜色）
- 内边距：上 12px，下 32px，水平 20px
- 阴影：`--xc-shadow-3`
- 背景：`--xc-surface`

### 5.3 主按钮

- 高度 48px
- 圆角 8px（`--xc-radius-sm`）
- 背景：`--xc-primary`
- 文字：白色，15px，font-weight 600
- 满宽

### 5.4 次级按钮

- 高度 48px
- 圆角 8px
- 背景：`--xc-surface`
- 边框：1px solid `--xc-border`
- 文字：`--xc-foreground`，15px，font-weight 500

### 5.5 Quick Reply Pill

- 圆角：`--xc-radius-pill`（999px）
- 内边距：上下 10px，左右 16px
- 主按钮：`--xc-primary` 背景 + 白色文字
- 次级按钮：`--xc-surface` 背景 + `--xc-border` 边框

### 5.6 输入框

- 高度 48px
- 圆角 8px
- 边框：1px solid `--xc-input`
- 背景：`--xc-surface`
- 聚焦态：`ring-2 ring-ring border-transparent`

---

## 6. CSS 变量全量引用

所有页面 `<head>` 中内嵌完整的 CSS 变量定义（`colors_and_type.css` 内容），开发时可直接复制到小程序 `app.wxss` 或全局样式文件中。

**语义别名映射**（用于 Tailwind utility 类）：

| Tailwind 类 | CSS 变量 |
|---|---|
| `bg-primary` | `var(--xc-primary)` |
| `text-primary` | `var(--xc-primary)` |
| `bg-background` | `var(--xc-background)` |
| `text-foreground` | `var(--xc-foreground)` |
| `text-muted-foreground` | `var(--xc-muted-foreground)` |
| `bg-surface` | `var(--xc-surface)` |
| `bg-muted` | `var(--xc-surface-2)` |
| `border-border` | `var(--xc-border)` |
| `border-input` | `var(--xc-input)` |
| `ring-ring` | `var(--xc-ring)` |

---

## 7. 开发注意事项

### 7.1 微信小程序适配

- 导航栏：使用微信原生导航栏，标题 "X教练"，设计稿中导航栏为占位示意
- 胶囊按钮：右上角胶囊按钮为微信原生，设计稿中为占位示意
- 底部安全区：所有底部固定元素需加 `padding-bottom: env(safe-area-inset-bottom)`
- 头像：教练头像由开发时配置，使用 `<image>` 组件加载后端 URL

### 7.2 登录流程

- 静默登录：`wx.login()` 在闪屏页自动调用，无 UI
- 昵称：在摸底对话中自然提问获取，不使用微信原生昵称组件
- 手机号：**MVP 不收集**
- 用户协议/隐私政策：需在小程序后台配置，前端跳转链接

### 7.3 接口对接

详见总计划契约 C（`docs/superpowers/plans/2026-08-28-xcoach-master-plan.md` 第 1.3 节）：
- 聊天发送：`callFunction('api', { action: 'chat.send', payload: { text } })`
- 用户信息：`user.profile.get / user.profile.update`
- 订阅消息：`subscribe.report`

### 7.4 图标库

- 使用 Lucide 图标（设计稿中通过 CDN 加载）
- 微信小程序中需替换为本地 SVG 或使用 `lucide-weapp` 等小程序兼容方案

### 7.5 响应式

- 基准视口 375px（iPhone 6/7/8）
- 气泡最大宽度 75%（`max-w-[75%]`）
- 内容区域自适应，不使用固定高度（除闪屏页）

---

## 8. 设计稿文件结构

```
deliverables/frontend/xcoach-frontend-design/
├── .design                          # 设计画布文件（7 页）
├── colors_and_type.css              # CSS 设计令牌
├── runtime-orchestration-summary.json  # 设计编排记录
└── pages/
    ├── splash.html                  # 启动闪屏
    ├── auth-login.html              # 授权登录
    ├── chat-onboarding.html         # 摸底定标
    ├── sheet-weight.html            # 体质信息录入
    ├── sheet-snark.html             # 毒舌档位选择
    ├── sheet-subscribe.html         # 订阅消息授权
    └── chat-main.html               # 聊天主流程
```

---

## 9. 版本记录

| 版本 | 日期 | 变更 |
|---|---|---|
| v1.0 | 2026-08-29 | 定稿。7 页完整设计稿，覆盖闪屏→授权→摸底→执行全链路。配色方案鼠尾草绿 v2。新增性别/年龄段选择器。昵称改为聊天中自然带出。 |