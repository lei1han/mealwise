# 三餐教练 微信小程序

> **⚠️ 快照冻结说明（2026-08-30）**：本目录已冻结为前端设计快照，仅作历史参考，不再维护。当前唯一工程与事实来源为仓库根的 `MealWise/` 目录（含云开发工程、云函数与联调配置）。如需改动页面或接口逻辑，请直接在 `MealWise/` 中进行。

纯对话减肥教练 MVP 前端。

## 技术栈

- 原生微信小程序框架
- CSS 自定义属性（设计令牌）
- Mock 数据层（开发阶段替代后端接口）

## 目录结构

```
mealwise-miniapp/
├── app.js / app.json / app.wxss    # 应用入口、路由、全局样式
├── project.config.json              # 微信开发者工具配置
├── utils/
│   ├── api.js                       # API 封装层（Mock / 真实接口切换）
│   └── mock.js                      # Mock 数据（模拟后端回复）
└── pages/
    ├── splash/                      # 启动闪屏
    ├── auth-login/                  # 授权登录 + 欢迎引导
    ├── chat-onboarding/             # 摸底定标聊天
    ├── chat-main/                   # 每日聊天主流程
    ├── sheet-weight/                # 体质信息录入 Sheet
    ├── sheet-snark/                 # 毒舌档位选择 Sheet
    └── sheet-subscribe/             # 订阅消息授权 Sheet
```

## 用户旅程

```
启动闪屏 → 授权登录 → 摸底定标 → 每日聊天
                        ├── 体质录入
                        ├── 毒舌档位
                        └── 订阅消息
```

## 开发

### 前置条件

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 注册小程序并获取 AppID（填入 `project.config.json` 的 `appid` 字段）
3. 在开发者工具中导入本项目

### Mock 模式

默认使用 Mock 数据，无需后端：

```js
// utils/api.js
const USE_MOCK = true;  // 切换为 false 启用真实接口
```

### 页面流转

- `splash` → `auth-login`：静默登录后自动跳转
- `auth-login` → `chat-onboarding`：授权后进入摸底
- `chat-onboarding` → `chat-main`：定标完成后进入每日聊天
- Sheet 页面（`sheet-weight/snark/subscribe`）：通过 `navigateTo` 从聊天页弹窗打开

## 设计规范

详见 `../2026-08-29-xcoach-frontend-design-v1.md`

## 接口契约

详见 `../../docs/superpowers/plans/2026-08-28-xcoach-master-plan.md` 第 1.3 节

## 版本

v1.0 (2026-08-29)