# 板块 3：后端设计（细化版）

- 文档类型：分板块实施计划（Backend）
- 版本：v2.1（契约 B 冻结对齐 + 承接契约 A 增量提案）
- 日期：2026-08-28
- 依赖：设计规格 `../specs/2026-08-28-xcoach-design.md`、总计划 `2026-08-28-xcoach-master-plan.md`、提示词成品 `../../deliverables/prompt/2026-08-28-xcoach-prompts.md`、契约 A 增量提案 `../../deliverables/operations-business/2026-08-28-xcoach-contract-a-proposal.md`
- 依赖契约：契约 A（数据模型）、契约 B（结构化输出）、契约 C（前后端接口）
- 状态：待评审

---

## 0. 本次冻结的关键决策

| 决策项 | 结论 | 理由摘要 |
|---|---|---|
| 部署形态 | **微信云开发**（云函数 + 云数据库 + 定时触发器 + 云调用） | 免运维、免域名备案；订阅消息走云调用免 access_token 管理；openid 自动鉴权；MVP 成本约 20~40 元/月。代价：绑定微信生态、云函数冷启动——MVP 可接受 |
| 契约 C 形态 | REST → **云函数调用**（`wx.cloud.callFunction` + action 路由） | 由部署形态决定，语义映射保持一致（见第 3.2 节） |
| 运行时 | Node.js 18 + TypeScript | 云开发原生支持；TS 保证 schema/解析层的类型安全 |
| LLM | **OpenAI 兼容适配器**，默认 **DeepSeek**（`deepseek-chat`，JSON mode） | 价格最低、支持 `response_format: json_object`、中文强；适配器层保证可随时切换 GLM/通义等 |
| 流式 | **MVP 非流式** | 云函数为一次性 HTTP 响应，无法真正流式转发；前端用打字机动画模拟 |
| 食物库存储 | 代码内 `foods.json` 随云函数部署，**不入库** | 只读、量小、需与提示词版本对齐，避免每次对话查询数据库 |
| 关键数字 | 热量预算、定标公式由**服务端计算**，LLM 只负责表达 | 防 LLM 算术出错，保证"靠谱"的产品底色 |

---

## 1. 目标

产出 MVP 后端完整方案：技术选型、数据库、API、LLM 集成、食物库、定时督促。本版在 v1.0 框架基础上细化到可直接开工的粒度，并完成契约 A / C 的冻结。

## 2. 架构总览

```
微信小程序前端（板块 1）
        │  wx.cloud.callFunction({ name:'api', data:{ action, payload } })
        ▼
云函数 api（统一入口，action 路由）
        ├── 会话编排 pipeline（第 11 节）
        ├── 记忆读写服务（第 7 节）
        ├── 预算/定标计算器（服务端公式，第 10 节）
        ├── LLM 适配器（第 6 节）──► DeepSeek API（OpenAI 兼容）
        └── 云数据库（第 4 节）
云函数 scheduler（定时触发器，独立部署）
        └── 漏报判断 → 云调用订阅消息推送（第 9 节）
```

只部署 **2 个云函数**：`api`（所有前端入口，内部路由）与 `scheduler`（定时触发器必须独立配置 cron）。避免函数碎片化导致多处冷启动与部署负担。

---

## 3. 契约对账（本板块冻结与修改项）

### 3.1 契约 A：冻结 + 扩展

- 4 个核心实体（users / memories / weight_records / diet_records）字段冻结为第 4 节的具体类型，`memories.category` 枚举维持 `static / dynamic / emotion`。
- **扩展集合**：`messages`（聊天历史，会话编排必需）；`subscribe_auth`（订阅授权/额度账本）与 `notify_log`（触达日志）承接**契约 A 增量提案**（商业埋点），督促必需。
- `memories` 增加 `source` 字段（`onboarding` / `chat_extract`），便于后续追溯记忆来源。

### 3.2 契约 C：REST → 云函数（改版）

原 REST 语义与云函数 action 一一映射，前端板块确认后冻结：

| 原 REST 提案 | 云函数调用形式 |
|---|---|
| `POST /chat` | `callFunction('api', { action:'chat.send', payload:{ text } })` |
| `GET /conversation/current` | `action:'conversation.current'` |
| `GET /conversation/history` | `action:'conversation.history', payload:{ cursor, limit }` |
| `GET/PUT /user/profile` | `action:'user.profile.get'` / `action:'user.profile.update'`，payload 传 patch |
| `PUT /user/target` | `action:'user.target.update'` |
| `POST /subscribe/authorize` | `action:'subscribe.report', payload:{ accepted, template_key }` |

统一响应 envelope：成功 `{ code: 0, data }`；失败 `{ code, message }`（错误码见 5.3）。流式：MVP 非流式，前端打字机动画模拟（前端板块知悉）。

### 3.3 对契约 B 的消费要求（与提示词成品冻结版对齐；契约 B 已于 2026-08-28 冻结，见总计划 §1.2）

1. LLM 输出必须是**单一 JSON 根对象**（含 `reply_text` / `intent` / `extracted` / `budget_remaining_kcal`），不要包裹 markdown 代码块；提示词中需出现 "json" 字样（DeepSeek JSON mode 的硬要求）。
2. **`budget_remaining_kcal` 冻结为单值**（整数 kcal，无法确定填 `null`），不做区间化；后端以自身预算计算兜底覆盖（见 6.4）。
3. `intent` 枚举维持 `diet_report | weight_report | mood_talk | goal_setup | off_topic | other`（`off_topic` 为 2026-08-28 新增：主题外跑题拒绝，`extracted` 留 `{}`）。
4. `diet_record` 使用 **`food_refs` 数组**（与 `items` 一一对应）与 **`confidence`**（high/medium/low）；`is_estimated` 由后端派生（含 `food:external` 或 `confidence=low` 时为 true）。
5. 后端以**服务端计算的预算为准**覆盖 LLM 输出的数字（见 6.4），提示词板块可放心让模型复述注入的数字。

---

## 4. 数据库 Schema（云数据库集合）

### 4.1 users

| 字段 | 类型 | 说明 |
|---|---|---|
| _id | auto | |
| openid | string | 唯一索引 |
| nickname | string | |
| gender | string | `male / female`（定标公式必需） |
| age_group | string | `18-24 / 25-34 / 35-44 / 45-54 / 55+`（定标公式取组中值算 BMR） |
| height_cm | number | 身高 |
| initial_weight_kg | number | 初始体重 |
| target_weight_kg | number | 目标体重 |
| estimate_weeks | number | 预估周期（周） |
| daily_calorie_budget_kcal | number | 每日热量预算 |
| snark_level | string | `gentle / light / spicy`，默认 `light` |
| food_restrictions | string[] | 禁忌/过敏 |
| dietary_preferences | string | 饮食偏好 |
| exercise_condition | string | 运动条件 |
| exercise_habits | string | 运动习惯 |
| motivation | string | 减肥动机 |
| onboarding_state | string | 状态机（见第 10 节） |
| profiling_progress | object | 摸底各字段完成标记 `{ gender:false, age_group:false, height:false, weight:false, history:false, ... }` |
| onboarding_completed_at | date，可空 | 定标完成时刻 = **执行期起点锚点**（写一次，不随更新刷新） |
| last_active_at | date | 最后活跃时刻（任意记录/对话落库时冗余刷新，支撑流失节点） |
| created_at / updated_at | date | |

### 4.2 memories

| 字段 | 类型 | 说明 |
|---|---|---|
| _id | auto | |
| user_id | string | |
| category | string | `static / dynamic / emotion` |
| content | string | 记忆内容 |
| source | string | `onboarding / chat_extract` |
| created_at | date | |

索引：`user_id + category + created_at`（降序）。写入遵循去重契约（§7.2）：static 同语义更新不新增、dynamic 按自然日覆盖、emotion 保留最近 20 条。

### 4.3 weight_records

| 字段 | 类型 | 说明 |
|---|---|---|
| _id | auto | |
| user_id | string | |
| date | string | `YYYY-MM-DD`（用户本地日期，取服务端+8 时区） |
| weight_kg | number | |
| created_at | date | |

索引：`user_id + date`。同日多次报体重允许存在多条，读取取当日最新。

### 4.4 diet_records

| 字段 | 类型 | 说明 |
|---|---|---|
| _id | auto | |
| user_id | string | |
| date | string | `YYYY-MM-DD` |
| meal | string | `breakfast / lunch / dinner / snack` |
| raw_text | string | 用户原始描述 |
| items | array | `[{ food_id, food_name, portion_fist }]`，portion_fist ∈ {0.5, 1, 2, 2.5} |
| cal_min / cal_max | number | 区间 |
| confidence | enum | `high / medium / low`，可空；来自契约 B `diet_record.confidence`，支撑低置信度占比监控 |
| is_estimated | bool | 库外/复合菜估算标记（由 `food_refs` 含 `food:external` 或 `confidence=low` 派生） |
| created_at | date | |

索引：`user_id + date + meal`。同餐次多次汇报允许追加（读取合并口径）。

### 4.5 messages（新增）

| 字段 | 类型 | 说明 |
|---|---|---|
| _id | auto | |
| user_id | string | |
| role | string | `user / coach` |
| content | string | 消息文本 |
| intent | string | coach 消息附带（契约 B 解析结果） |
| meta | object | 提取摘要（food_refs、是否降级等） |
| created_at | date | |

索引：`user_id + created_at`（降序）。上下文裁剪取最近 20 条。

### 4.6 subscribe_auth（订阅授权与额度账本，承接契约 A 提案）

微信一次性授权 = 一次发送，故"是否授权 / 是否过期 / 剩余额度"统一由本表表达：

| 字段 | 类型 | 说明 |
|---|---|---|
| _id | auto | |
| user_id | string | |
| template_key | string | 模板标识（MVP 单模板 `daily_reminder`） |
| status | enum | `authorized / denied / expired / used`（授权、拒绝、过期、已发送） |
| authorized_at | date | 授权时间 |
| used_at | date，可空 | 消耗（发送）时间 |
| updated_at | date | |

索引：`user_id + template_key + status`。剩余可发额度 = 该用户该模板 `status=authorized` 的记录数。

### 4.7 notify_log（触达日志，承接契约 A 提案）

| 字段 | 类型 | 说明 |
|---|---|---|
| _id | auto | |
| user_id | string | |
| trigger_type | enum | `morning_greeting / meal_reminder / missed_report / recall` |
| channel | enum | `subscribe_msg / in_app_card` |
| status | enum | `sent / delivered / clicked / failed`（`clicked` 需平台点击回传，不可得则降级为 `sent/delivered`） |
| sent_at | date | |

索引：`user_id + sent_at`（降序）。支撑「触达覆盖率 / 主动督促有效性 / 流失预警」三类指标。

---

## 5. API 定义（云函数 action，冻结版）

### 5.1 入口约定

```js
wx.cloud.callFunction({
  name: 'api',
  data: { action: 'chat.send', payload: { text: '中午吃了半拳米饭一拳青菜' } }
})
// → { code: 0, data: { reply_text, intent, budget_remaining_kcal, subscribe_hint } }
```

鉴权：云函数天然可取调用者 openid，无需登录态。

### 5.2 action 清单

| action | payload | 返回 data |
|---|---|---|
| `chat.send` | `{ text }` | `{ reply_text, intent, budget_remaining_kcal, degraded, subscribe_hint }` |
| `conversation.current` | `{ limit? }` | `{ items: [...] }` 最近消息 |
| `conversation.history` | `{ cursor, limit }` | `{ items, next_cursor }` |
| `user.profile.get` | — | users 脱敏文档 |
| `user.profile.update` | `{ patch }` | `{ ok }` 白名单字段 |
| `user.target.update` | `{ target_weight_kg, estimate_weeks? }` | `{ ok }` |
| `subscribe.report` | `{ accepted, template_key }` | `{ remaining }` |

限流：`chat.send` 每用户每分钟 6 条上限（防刷 + 控成本）。

### 5.3 错误码

| code | 含义 |
|---|---|
| 0 | 成功 |
| 40001 | payload 校验失败 |
| 42901 | 触发限流 |
| 50000 | 内部错误 |
| 50010 | LLM 解析降级（code=0 + `degraded:true`，前端正常展示纯文本） |

---

## 6. LLM 集成层

### 6.1 适配器

`llm/client.ts` 实现 `callLLM(messages, options)`，走 OpenAI 兼容 `/chat/completions`：

- `baseURL / apiKey / model` 从云函数环境变量读取（**密钥不进 git 不入库**）。
- 默认 `deepseek-chat`，开启 `response_format: { type: 'json_object' }`。
- 超时 30s；网络类错误自动重试 1 次；参数自带幂等保护（客户端 5s 内相同文本去重）。

### 6.2 结构化输出解析管线（契约 B 消费）

```
原始输出 → strip 代码围栏 → JSON.parse → schema 校验(zod)
   ├─ 成功 → 数值 sanity 检查 → 进入落库
   ├─ 解析/校验失败 → 带"上次输出无法解析，请严格输出合法 JSON"修复提示重试 1 次
   └─ 仍失败 → 降级：reply_text=原始文本(截 500 字)，intent='other'，
               extracted 全部丢弃（不落坏数据），messages 落库标记 parse_failed，打告警日志
```

- schema 校验用 zod（bundle 后约 12KB，可接受）。
- 数值 sanity：单餐热量区间 clamp 到 [50, 3000] kcal；体重 clamp 到 [25, 300] kg，越界视为脏数据丢弃对应 extracted 字段。

### 6.3 重试与降级原则

- **只重试格式问题**（可修复），不重试业务语义问题。
- 降级永远返回可展示的纯文本，**绝不让解析失败阻断对话**，也绝不落库无法校验的 extracted 数据。

### 6.4 预算数字：服务端为准

`budget_remaining_kcal` 由服务端计算：`预算 − 今日已报餐热量累计`，取单值中位 `[预算 − (Σcal_min + Σcal_max)/2]`。返回前用该值**覆盖** LLM 输出的数字；prompt 中注入服务端算好的单值供 LLM 复述，双保险。无法计算（未定标/纯情绪）时填 `null`。

---

## 7. 记忆读写服务

### 7.1 注入（读）

每次 `chat.send` 组装 prompt 时注入：

| 记忆类别 | 注入策略 |
|---|---|
| static | 全量（onboarding 产出，量少约 ≤10 条） |
| emotion | 最近 5 条 |
| dynamic | 今日 diet_records + 最近 7 天 weight_records + 服务端计算的当前预算 |

总注入预算 ≤1500 tokens，超限按 recency 截断（优先截 emotion 旧条目）。注入格式由提示词板块定，后端提供结构化数据块。

### 7.2 抽取（写）

- `extracted.memory_points` → 逐条校验 `category` 枚举后写入 memories（source=`chat_extract`）。
- **去重契约（对齐提示词成品 §8.3，后端实现）**：
  - `static`：按 `(user_id, category, content 归一化)` 判重；**同语义更新而非新增**（新条目覆盖/标记旧条目失效），避免执行期目标改动的记忆残留旧值。
  - `dynamic`：按自然日**覆盖式更新**（每日体重/小目标只要最新一条）。
  - `emotion`：允许多条，但保留最近 `N=20` 条，其余归档。
- 记忆写入钩子：`users.onboarding_completed_at` 仅在定标确认（转 `active`）时写一次；`last_active_at` 在任意记录/对话落库时冗余刷新（见 §4.1）。

---

## 8. 食物库

### 8.1 数据格式（`food/foods.json`，随云函数部署）

```json
{
  "id": "food:rice",
  "name": "米饭",
  "category": "staple",
  "base_unit": "1拳(约150g熟)",
  "kcal_per_fist": 205,
  "range_pct": 0.15
}
```

- 分类：`staple` 主食 / `protein` 蛋白 / `meat` 肉禽水产蛋 / `vegetable` 蔬菜 / `fruit` 水果 / `takeout` 外卖 / `snack` 零食。
- 量化规则：半拳 0.5×、一拳 1×、两拳 2×、两拳以上 2.5×（并提示）。区间 = 基准 ±`range_pct`。
- `food_refs` 引用规范：库内 `food:xxx`；库外 `food:external` 且 `is_estimated=true`（对齐契约 B 冻结版，派生规则见总计划 §1.2）。

### 8.2 注入方式

MVP **全量注入 system prompt**（紧凑表：id+名称+每拳热量，100 项约 1000 tokens，DeepSeek 价格下成本可忽略，且可靠）。后续优化为关键词粗筛 top-k 检索式注入。

### 8.3 校准（交付标准之一）

用 20 条真实风格描述（"半拳米饭+一拳青菜+半拳鸡腿肉"）+ 人工标注热量做 benchmark 脚本，误差在标注区间 ±20% 内为合格；不合格条目修数据或调 range_pct。

---

## 9. 定时督促（scheduler 云函数）

### 9.1 触发节奏（定时触发器，云开发 cron 为 7 字段：秒 分 时 日 月 周 年）

| 时间 | cron | 行为 |
|---|---|---|
| 08:30 | `0 30 8 * * * *` | 早问候+催体重：当日无 weight_record 则推 |
| 13:00 | `0 0 13 * * * *` | 午餐追问：当日无 lunch diet_record 则推 |
| 20:00 | `0 0 20 * * * *` | 晚餐追问：当日无 dinner diet_record 则推 |
| 21:30 | `0 30 21 * * * *` | 晚间总结：纯模板拼装（已报 X 餐、共 Y~Z 大卡），**不调 LLM**（省成本+快；深度总结由次日早问候的 LLM 完成） |

每日推送上限 4 条；额度不足（剩余 authorized=0）时跳过并写 `notify_log`（status=`failed`）记录漏发。

### 9.2 订阅消息额度管理

- 微信订阅消息为**一次性授权=一次发送**（个人小程序无长期订阅），策略是"每次成功对话后前端请求一次授权"积累额度。
- `chat.send` 返回 `subscribe_hint`（剩余额度 < 3 时为 true），前端据此弹授权请求；授权结果上报 `subscribe.report`（accepted → 插入一条 `status=authorized` 的 `subscribe_auth` 记录）。
- 发送走云调用 `subscribeMessage.send`（免 access_token 管理）；每条触达在 `notify_log` 写日志（trigger_type / channel / status / sent_at）。模板 ID：MVP 申请 1 个通用提醒类模板，ID 常量前后端各存一份（对齐总计划契约 C 说明）。
- 额度判定与触达日志均落 `subscribe_auth` / `notify_log`（§4.6 / §4.7），供「触达覆盖率 / 主动督促有效性」指标计算。

---

## 10. Onboarding 状态机与定标公式

### 10.1 状态机（服务端持有，LLM 只通过 intent/extracted 暗示转移）

```
new ──首次对话──► profiling ──摸底字段齐全──► target_pending ──用户确认──► active
                    ▲                                              │
                    └────────── recalibrating ◄──平台期/目标变化────┘
```

- `profiling`：后端维护 `profiling_progress` 完成度；LLM 抽取到的摸底字段写入 users + memories(static)。
- `target_pending`：摸底齐 → 服务端跑定标公式 → 建议目标注入上下文 → LLM 与用户沟通确认。
- 确认判定：`intent=goal_setup` 且 extracted 含 target → 写 users、转 `active`。
- `recalibrating`：触发条件（连续 2 周体重无变化等）MVP 仅预留状态，不做自动判定。

### 10.2 定标公式（服务端计算）

1. BMR（Mifflin-St Jeor）：`10×kg + 6.25×cm − 5×age + s`（男 +5 / 女 −161）。年龄段取组中值：18-24→21、25-34→29.5、35-44→39.5、45-54→49.5、55+→58。
2. TDEE = BMR × 活动系数（1.2~1.55，按 exercise_habits 粗估）。
3. 缺口 300~500 kcal/天 → 每周约 0.3~0.6 kg，落在健康区间 0.3~0.75 kg/周。
4. 预算 = TDEE − 缺口，**安全下限 1200 kcal（女）/ 1500 kcal（男）**。
5. 周期 =（当前 − 目标体重）/ 每周速率。

> 摸底补问性别、年龄段已确认（设计规格 v1.1 / users 表 4.1 节已含字段）；提示词板块在 onboarding 话术中需自然带出，不作敏感盘问。

---

## 11. 会话编排 pipeline（chat.send 时序）

1. 鉴权（云函数取 openid）+ 限流检查。
2. 状态检查（new 用户初始化，进入 onboarding 分支提示词）。
3. 取上下文：messages 最近 20 条。
4. 取记忆（第 7.1 节策略）+ 服务端计算预算单值。
5. 组装 prompt：系统提示词（提示词板块）+ 用户档案/记忆块 + 食物库表 + 状态机指令 + 历史。
6. 调 LLM（30s 超时，网络错误重试 1 次）。
7. 解析管线（第 6.2 节）→ 成功或降级。
8. 服务端覆盖 `budget_remaining_kcal`。
9. 落库：messages（user+coach 双条）→ extracted 中 diet_records / weight_records / memory_points / 摸底字段。
10. 状态机转移评估（第 10 节）。
11. 返回 `{ reply_text, intent, budget_remaining_kcal, degraded, subscribe_hint }`。

---

## 12. 成本控制

| 手段 | 说明 |
|---|---|
| 上下文裁剪 | 历史 20 条 + 记忆注入 ≤1500 tokens |
| 前缀缓存 | system prompt（人设+食物库）置于最前，命中 DeepSeek context cache |
| 模型可切换 | 适配器环境变量切换；未来可按场景分级（总结用便宜档） |
| 限流 | 每用户 6 条/分钟 |
| 推送不调 LLM | 晚间总结纯模板拼装 |

量级估算：单次对话约 3~4K input + 500 output tokens；日活 100 × 日均 10 次对话，DeepSeek 价格下月成本约在个位数到十几元人民币量级，可控。

---

## 13. 安全与隐私

- 体重/饮食/情绪为敏感数据：仅 openid 关联，不采集手机号等实名信息；昵称仅存用户授权后的展示名。
- LLM 传输：DeepSeek 为国内服务，无出境问题；prompt 携带敏感字段一事需在隐私政策中披露。
- 用户数据删除：MVP 预留人工工单通道（合规兜底）。
- 密钥管理：LLM apiKey 仅存云函数环境变量。

---

## 14. 代码目录结构

```
cloudfunctions/
  api/
    src/
      index.ts              # action 路由 + envelope
      handlers/
        chat.ts  user.ts  conversation.ts  subscribe.ts
      llm/
        client.ts           # OpenAI 兼容适配器
        parser.ts           # 契约 B 解析/校验/降级
        schema.ts           # zod schema（契约 B）
      memory/
        reader.ts  writer.ts
      food/foods.json
      budget/
        calculator.ts       # 预算/TDEE/定标公式
      state/
        onboarding.ts       # 状态机
    config.json             # 触发器/环境声明
  scheduler/
    src/index.ts            # 定时入口：漏报判断+云调用推送
scripts/
  setup-db.(js|ts)          # 建集合+索引脚本（交付物）
  seed-foods.ts             # 食物库校准/导入工具
  benchmark-foods.ts        # 第 8.3 节校准 benchmark
```

---

## 15. 实施里程碑与验收

| 里程碑 | 内容 | 验收 | 进度 |
|---|---|---|---|
| M1 环境与骨架 | 云开发 env 初始化、`api`/`scheduler` 函数骨架、集合+索引脚本、foods.json v0 | 骨架可部署、setup-db 跑通 | ✅ **已落地**：`deliverables/backend` 零依赖内核 + `src/data/foods.json`（24 项）+ `scripts/setup-db.js`（schema/索引 7 集合打印）；云开发 env/函数骨架待 M3 部署时建 |
| M2 mock 闭环 | mock LLM（固定 JSON 响应）跑通 chat pipeline 全时序 | 脚本模拟"发消息→回复→落库→返回"闭环通过 | ✅ **已落地**：`scripts/demo-chat.js` 多轮闭环通过；`npm test` 10/10（解析/降级/画像/状态机/记忆去重） |
| M3 真 LLM 接入 | DeepSeek key 配置、解析/降级管线、注入非法 JSON 用例 | 降级用例：返回纯文本、无坏数据落库 | ⬜ 解析/降级管线**已就绪**（`src/llm/parser.js` + `client.js` OpenAI 兼容适配器）；待接入真实 key |
| M4 定标与状态机 | 10.2 公式 + onboarding 状态机 + 摸底落库 | onboarding 模拟会话走到 active | ✅ **已落地**：`src/domain/onboarding.js`（Mifflin/状态机/画像提取）、`budget.js`（剩余单值）；demo 已转 active |
| M5 定时督促 | 模板申请、scheduler、漏报判断、额度管理 | dry-run 日志：漏报判断与额度扣减正确 | 🟡 **逻辑已落地**：NUDGE_SLOTS 对齐 §9.1、`src/services/nudge.js`（漏报判断/额度扣减/notify_log）、`src/scheduler.js` 入口 + `scheduler.nudge`/`subscribe.report` action、`scripts/nudge-dryrun.js` 探针全程正确；待订阅模板 ID 后接真推送 |
| M6 食物库完备 | 扩到 50~100 项 + 校准 benchmark | 第 8.3 节 benchmark 通过 | ✅ **已落地**：`foods.json` v0.2 共 **51 项**（五大类齐全）+ `foods-benchmark.js` 数据自省 11/11 + `food-calib.json` §8.3 校准 **20/20、平均偏差 2.0%** |

**最终完成标准**（对齐 v1.0）：M2 + M3 + M6 即满足"mock 前端/脚本跑通闭环 + schema 建表脚本 + 食物库数据交付"。

### 15.1 M3~M6 接入点核对清单（人工环境项，逐一勾选）

> 内核代码已就绪，以下为**部署/外部依赖**类接入点，需在腾讯云开发与小程序后台人工完成。

#### M3 真 LLM 接入
- [ ] 申请 DeepSeek API key，写入环境变量 `DEEPSEEK_API_KEY`（或云函数环境变量）
- [ ] `src/llm/client.js` 调用方改为 `createLlm({ service:'openai', apiKey, baseURL, model:'deepseek-chat' })`（默认即 OpenAI 兼容，切供应商只改 baseURL/model）
- [ ] 云函数 `api` 部署：`src/index.js` 作为 `main` 入口，`event.action` 分发已就绪
- [ ] 端到端：真 LLM 跑 3 轮对话，校验结构化输出能落库、注入非法 JSON 触发降级（`npm run demo` 改接真实 key 验证）

#### M4 定标与状态机（内核已落地，仅剩真实画像确认）
- [ ] 用真 LLM 重跑 onboarding 会话，确认 `profiling_progress` 各字段（gender/age_group/height/weight/history/target）能稳定抽取
- [ ] 校验 Mifflin 预算与 1200/1500 下限在 mock 与真实模型间一致

#### M5 定时督促（依赖外部申请，尽早启动）
- [ ] 小程序后台申请订阅消息模板（1 个通用提醒类），获取 `template_id`
- [ ] 模板 ID 常量写入前后端各一份（契约 C 约定：前端硬编码、后端拼装字段）
- [x] 云函数 `scheduler`：按 §9 节奏（4 cron：08:00/13:00/19:00/21:00）实现触发 + 漏报判断（13:30/19:30 无当日对应餐次记录）✅ **已落地**：NUDGE_SLOTS 对齐 §9.1（morning/meal_lunch/meal_dinner/evening），`src/scheduler.js` + `scheduler.nudge` action，`_shouldNudge` 按 weight/lunch/dinner 缺失判定
- [x] `subscribe_auth` 额度扣减（`status authorized→used`）+ `notify_log` 写日志（trigger_type/channel/status，`clicked` 不可得则降级 sent/delivered）✅ **已落地**：nudge.js `_consumeQuota` + `_writeLog`；额度为 0 记 failed 日志（同日不重复）
- [x] dry-run：模拟漏报用户，日志验证"漏报判断 + 额度扣减 + 触达记录"正确 ✅ `scripts/nudge-dryrun.js` 探针全程正确
- [ ] 前端在 `subscribe_hint=true`（剩余 <3）时弹授权请求，`subscribe.report` 上报 accepted→插入 `status=authorized`

#### M6 食物库完备
- [x] foods.json 从 24 项扩到 50~100 项（对齐设计规格五大类；每项含 `1 拳` 基准 kcal + min/max 区间）✅ v0.2 共 **51 项**，类别分布：主食 11 / 蛋白 9 / 肉禽水产蛋 11 / 蔬果 12 / 零食外卖 8
- [x] 校准 benchmark（§8.3）：对每类抽样 10+ 条真实描述，校验解析命中率与热量偏差达标 ✅ **已固化**：`src/data/food-calib.json`（20 条真实风格描述 + 人工拆解 ref + 营养参考 anchor）+ `scripts/foods-calib-benchmark.js`（`npm run calib`）。结果：解析命中率 **100%**、平均偏差 **2.0%**、20/20 通过（阈值 ±20%，可用参数收紧）
- [x] 扩库后跑 `npm test`，确认 `is_estimated`/`food:external` 归一不回归 ✅ 10/10 通过；`npm run foods-bench` 数据自省 11/11 通过

---

## 16. 开放问题（跨板块）

1. **给提示词板块**：契约 B **已冻结为单值版**（2026-08-28 回写总计划 §1.2）：`budget_remaining_kcal` 单值（可 null，服务端兜底）——**不做区间化**；`food_refs` 数组、`confidence`、`is_estimated` 派生。onboarding 话术已覆盖**性别、年龄段**的摸底提问（枚举值见 4.1 节，话术自然带出、不作敏感盘问）；摸底字段清单以 `profiling_progress`（4.1 节）为对齐基线。
2. **给前端板块**：契约 C 云函数版（3.2 节）需确认冻结（含 `chat.send` 返回 `budget_remaining_kcal` 单值）；打字机动画模拟流式；`subscribe_hint=true` 时的授权请求时机设计。
3. **给运营板块**：订阅消息模板类目与申请（需尽早，审核有周期）；隐私政策文案需覆盖敏感数据传 LLM 的披露。**契约 A 增量提案已由本板块承接**（users 埋点字段 + `subscribe_auth`/`notify_log` 表），提案 §7 回写约定执行，商业计划书 §8 待对账项第 1 条待运营板块销项。
4. ~~性别/年龄段是否入库 users 表~~ **已闭环（2026-08-28）**：设计规格 v1.1 摸底清单与 users 表均已补充 `gender`、`age_group` 字段。
