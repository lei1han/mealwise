# 三餐教练（原代号 X教练）实施总计划与规划

* 文档类型：实施总计划（Master Plan）

* 版本：v1.3（资料对齐：工程快照索引 + 阅读说明）

* 日期：2026-08-28（正文）；工程快照更新 2026-09-14

* 依赖设计：`../specs/2026-08-28-xcoach-design.md`

* 分板块文档：见下表 4 个子文档

***

## 0. 总览与推进方式

实施拆为 **1 个总计划 + 4 个可独立推进的板块文档**：

| # | 板块        | 子文档                                        | 核心交付物                                | 相对依赖       |
| - | --------- | ------------------------------------------ | ------------------------------------ | ---------- |
| 1 | 前端设计      | `2026-08-28-xcoach-frontend.md`            | 页面/交互/视觉 + 接口调用层                     | 契约 C、A     |
| 2 | 提示词设计     | `2026-08-28-xcoach-prompt.md`              | 系统提示词 + 子提示词 + 结构化输出 schema          | 契约 B、A、食物库 |
| 3 | 后端设计      | `2026-08-28-xcoach-backend.md`             | 架构 + 数据库 + API + LLM 集成 + 食物库 + 定时督促 | 契约 A、B、C   |
| 4 | 产品运营及商业计划 | `2026-08-28-xcoach-operations-business.md` | 指标 + 获客/留存/变现 + 成本与合规                | 前三者，最晚收敛   |

**关键原则**：4 个板块会在不同会话分别推进。为避免各自为政、最后对不上，开工前必须先锁定本总计划第 1 节的「跨板块接口契约」。有了这份契约，各板块即可并行，互不阻塞。

***

## 1. 跨板块接口契约（开工前必须先行对齐）

这是 4 个板块能并行、且最终能拼起来的"公共接口"。每个板块开工前先在对应会话里 Review 一次这节。

### 1.0 当前工程快照（资料阅读用，2026-09-14）

阅读 §1.3 时，**以本节与文末最新日期增量为准**；文中较早的引用块（如「仅 3 个 action、其余 Mock」）为历史记录，已被 2026-08-31～09-01 增量取代。

| 项 | 现状 |
|----|------|
| 运行工程 | 仓库根目录 `MealWise/`（非 `deliverables/frontend/mealwise-miniapp/`） |
| 云函数 action | `api` 内核已实现契约 C 主要 action + `app.config.get` / `db.ensure`（见 §1.3 末尾增量） |
| 前端联调 | `MealWise/miniprogram/utils/api.js`：`REAL_ACTIONS` 覆盖主要 action；`USE_MOCK` 为总开关 |
| Schema 冻结 | `MealWise/cloudfunctions/api/src/db/schema.js` |
| 内核测试 | `cd MealWise/cloudfunctions/api && npm test` → 32/32 |
| 后端交付快照 | `deliverables/backend/` — 改代码后以 `MealWise/.../src` 为准再同步 |
| 未完成（人工/外部） | M5 订阅模板 ID；模拟器 E2E 走查；`subscribe.report` 的 `template_key` 前端补齐 |

仓库导航：`README.md`；前端视觉版本线：`deliverables/frontend/2026-09-14-xcoach-frontend-visual-version.md`。

### 1.1 契约 A：数据模型（后端产出，提示词/前端消费）

* 实体：`users`、`memories`、`weight_records`、`diet_records`（字段见设计规格第 7 节，具体类型已由后端板块细化为 schema，见 `2026-08-28-xcoach-backend.md` 第 4 节）。

* `memories.category` 枚举固定为：`static / dynamic / emotion`。

* 静态记忆字段包含：性别（gender）、年龄段（age\_group）、饮食偏好（dietary\_preferences）、运动习惯（exercise\_habits）、减肥史（history\_kg）。性别/年龄段为定标公式（BMR/TDEE）必需，摸底时自然带出。

* **2026-08-31 对齐唯一工程**：`users` 主键统一为 `user_id`（存 openid 映射，服务端注入），体重字段统一为 `current_weight_kg`，减肥史 `weight_loss_history`→`history_kg`，预估周期 `estimate_weeks`→`target_estimate_weeks`；`daily_calorie_budget_kcal` 不入库（服务端现场计算）。`snark_level` 原为 MVP 代码常量不入库，**2026-09-01 起改为入库持久化**（见 §1.3 增量；`users.snark_level ∈ gentle/light/spicy`，未设置回退 `light`）。字段以 `MealWise/cloudfunctions/api/src/db/schema.js` 为冻结版，随设计规格 §7、后端计划 §4 同步回写。

* 后端板块扩展：新增 `messages`（聊天历史）、`subscribe_auth`（订阅授权/额度账本）、`notify_log`（触达日志）集合（后两者承接契约 A 增量提案）；`memories` 增加 `source` 字段。

* **2026-09-01 增量（全局配置表）**：新增 `app_config` 集合（**无** **`user_id`**），行结构 `{ key, value, public, description, updated_at }`，`key` 语义唯一；`public=true` 为公开配置（客户端经 `app.config.get` 只读拉取，如教练头像 `coach_avatar_url`），`prompt.*` 为内部提示词覆盖（`public=false`/缺省，仅云函数侧读取，未配置回退代码默认模板）。运营在云开发控制台直接维护，云函数每次请求实时读取生效、无需重部署。

* **2026-09-01 增量（授权登录回填用户资料）**：`users` 新增 `phone` / `avatar_url` 字段（`nickname` 原有）；隐私策略由「不采集手机号等实名信息」调整为「授权后记录」——手机号经 `getPhoneNumber` code 云调用换取，昵称/头像来自微信头像昵称填写能力（`chooseAvatar` + `input type="nickname"`，用户主动填写，不再静默获取）。回填仅空字段写（手机号不换绑）。字段以 `MealWise/cloudfunctions/api/src/db/schema.js` 为冻结版。

* 记忆写入：按提示词成品 §8.3 **去重契约**——static 同语义更新不新增、dynamic 按自然日覆盖、emotion 保留最近 20 条；读取侧 static 全量、emotion 近 5 条、dynamic 当日饮食 + 近 7 天体重，与后端 `2026-08-28-xcoach-backend.md` §7、提示词 §8 口径一致。

* **待办联动**：契约 A 增量提案（板块 4）**已被后端板块采纳并回写本节（2026-08-28）**：记录表时间戳、`diet_records.confidence`、`users.onboarding_completed_at`/`last_active_at`、`subscribe_auth`/`notify_log` 两表均已并入 schema（见后端 §4）；`subscribe_quotas` 已并入 `subscribe_auth`。商业计划书 §8 待对账项第 1 条由板块 4 销项。

### 1.2 契约 B：结构化输出（提示词产出，后端消费）—— 冻结版

LLM 每次回复除自然语言外，须以统一 JSON 返回"机器可读结果"，后端据此落库。冻结 schema（LLM 每次回复只输出一个合法 JSON 根对象，不包裹 markdown 代码块）：

```json
{
  "reply_text": "给用户看的聊天内容",
  "intent": "diet_report | weight_report | mood_talk | goal_setup | off_topic | other",
  "extracted": {
    "diet_record": { "meal": "lunch", "items": ["米饭"], "cal_min": 320, "cal_max": 400, "food_refs": ["food:rice"], "confidence": "high" },
    "weight_record": { "weight_kg": 65.2 },
    "memory_points": [ { "category": "emotion", "content": "今天压力大想吃甜" } ]
  },
  "budget_remaining_kcal": 600
}
```

字段规则（后端解析据此校验，详细解析/降级见提示词成品 `deliverables/prompt/2026-08-28-xcoach-prompts.md` §7）：

* `diet_record` 仅当本轮汇报饮食时出现：`food_refs` 数组与 `items` 一一对应，库内 `food:xxx`、库外/复合菜 `food:external`；`confidence`（high/medium/low）支撑"低置信度诚实标注"。`is_estimated` 由后端派生：`food_refs` 含 `food:external` 或 `confidence=low` 时为 true，落库 `diet_records.is_estimated`。

* `weight_record` 仅当报体重时出现；可选 `record_date`（`YYYY-MM-DD`）。`diet_record` 同理。**落库规则（2026-09-14）**：服务端仅接受 **今天/昨天**（`Asia/Shanghai` 自然日）；聊天口语含前天及更早、或 `record_date` 越界时 **不落库** 饮食/体重，并返回 `record_date_rejected: true`。`chat.send` 可选入参 `record_date`（报体重 sheet 等结构化入口）。昨天补记的体重 **不** 更新 `users.current_weight_kg`。
* `memory_points` 仅当出现值得长期记忆的新信息时出现，`category` 枚举 `static / dynamic / emotion`。

* `budget_remaining_kcal` 为整数 kcal，**无法确定时填** **`null`**（如定标前闲聊、纯情绪陪聊）；后端以自身预算计算兜底覆盖，不信任模型口径（见后端计划 §6.4）。

* `off_topic`：用户请求主题外任务/知识（编程、工作、作业、通用问答等）时标记；`extracted` 通常留 `{}`，回复为拒绝并拉回主题（见提示词 §9.2）。

> 契约 A / B / C 均已冻结（B 于 2026-08-28 由提示词板块冻结并回写；同日扩展 intent 新增 `off_topic`——主题外跑题拒绝，见提示词 §9.2；记忆去重契约见提示词 §8.3，写入策略见 §1.1）。

### 1.3 契约 C：前后端接口（后端产出，前端消费）

> **后端板块已改版并冻结 v2（2026-08-28）**：部署形态确定为微信云开发，接口从 REST 改为云函数调用（`wx.cloud.callFunction`，action 路由），语义与原 REST 提案一一映射。MVP 非流式（前端打字机动画模拟）。详见 `2026-08-28-xcoach-backend.md` 第 3.2 / 5 节。

* 会话：`callFunction('api', { action: 'chat.send', payload: { text } })` → 返回回复 + 结构化结果（统一 envelope `{ code, data, message }`）。支持 `text: '__start__'`（或空文本）作摸底开场：首次用户（`onboarding_state=new`）无历史时前端自动触发，后端返回并落库摸底开场白。返回含 `onboarding_state`（`new/profiling/active`），前端据此渲染摸底引导 / 预算卡，状态机由后端主导、前端不做本地判定。

* 授权登录（**2026-09-01 增量**）：`action: 'auth.login'`，payload `{ phoneCode?, nickname?, avatarUrl? }` → `{ is_new, phone, nickname, avatar_url }`。手机号 code 由云函数适配层经 `cloud.openapi.phonenumber.getPhoneNumber` 换号（失败静默 → `phone=null`）；`nickname`/`avatarUrl` 回填能力保留（来自微信头像昵称填写能力，头像经云存储上传换取 fileID 后落库）。upsert 用户且**仅空字段写**（手机号不换绑）。**MVP 暂不启用资料完善步**：授权手机号成功后直接进入聊天，资料完善界面后续版本再设计接入。

* 会话上下文：`action: 'conversation.current'`、历史消息 `action: 'conversation.history'`（cursor 分页）；用户状态 `action: 'user.state.get'`（首帧读取 `onboarding_state` 与 `reported_weight_today`——是否今日已报体重，供前端催报卡判断）。**2026-09-14**：`chat.send` 组装 LLM 时注入规则生成的 **会话要点**（阶段/今日状态/近几轮话题/记忆摘要）+ **更早对话摘要**（超出 `HISTORY_ROUNDS` 窗口的原文裁剪为短摘要），降低多轮后上下文漂移。

* 用户/目标：`user.profile.get / user.profile.update`（**仅主动编辑用**，如 Sheet 补充录入；摸底画像由 `chat.send` + LLM 抽取驱动，不再走 profile.update）、`user.target.update`。

* 订阅消息：`action: 'subscribe.report'`（上报授权结果，accepted → 额度 +1）、后端 scheduler 云调用推送；`chat.send` 返回 `subscribe_hint`（额度不足 3 次时提示前端请求授权）。

* 模板 ID：需在小程序后台申请，前端硬编码，后端按模板字段拼装。

> 契约 A / B / C 均已冻结：A/C 由后端板块冻结（v2，2026-08-28）；B 由提示词板块冻结并回写本节（2026-08-28）。**2026-08-30 增量（前端单聊天页合并决策）**：摸底对话与每日聊天合并为单一聊天页，`chat.send` 新增 `__start__` 开场与 `onboarding_state` 返回，新增 `user.state.get`，`user.profile.update` 移除摸底用途。对应后端计划 §5.2 action 清单需同步。
>
> **2026-08-30 增量（工程迁移落地，`MealWise/`** **为唯一工程）**：
>
> * **userId 注入**：前端不传 userId，云函数入口经 `wx-server-sdk` 的 `cloud.getWXContext().OPENID` 服务端注入；本地冒烟/无云端上下文时回退 `local_smoke`。
>
> * **事件结构**：统一 `event = { action, payload }`，云函数适配层将 `payload` 展开至内核顶层字段（如 `payload.text` → `text`），与上述契约语义一一对应。
>
> * **envelope**：成功 `{ code: 0, data }`；失败 `{ code: 400（未知 action）/ 500（内部错误）, message }`。
>
> * **部署形态**：单云函数 `cloudfunctions/api/`（CJS 适配入口 `index.js` + ESM 内核 `src/`，`src/package.json` 的 `{"type":"module"}` 标记为 ESM 兼容必需）。环境 `cloud1-d6gmjs12rfd5c3925`，appid `wxd6def00245936b4c`。
>
> * **实现进度**：内核当前已实现 `chat.send` / `subscribe.report` / `scheduler.nudge` 三个 action（本地冒烟 14/14 通过）；`conversation.current` / `conversation.history` / `user.state.get` / `user.profile.*` / `user.target.update` 尚未在内核实现，前端由 Mock 层承接。前端 `utils/api.js` 以 `REAL_ACTIONS` 白名单逐 action 灰度切换真实云函数。
>
> * **快照冻结**：`deliverables/frontend/mealwise-miniapp/` 冻结为设计快照，后续开发一律在 `MealWise/` 进行。
>
> **2026-09-01 增量（摸底体重录入 sheet 入对话流）**：
>
> * **新 action** **`onboarding.profile.submit`**：摸底体质录入 sheet 保存后，前端把结构化字段上报后端，后端落库 `users` 并产出一条教练对话（确认 + 下一摸底问题）。
>
>   * 请求：`payload.fields = { gender: 'male'|'female', age_group: '18-24'|'25-34'|'35-44'|'45-54'|'55+', height, initial_weight, target_weight }`（结构化字段，非聊天文本）。
>
>   * 返回：`{ reply_text, onboarding_state }`（此时仍为 `profiling`）；成功后前端把 `reply_text` 追加为教练气泡并解锁输入。
>
>   * 真实内核尚未实现，前端 `utils/api.js`（Mock）承接；上线前需在后端 action 路由补齐。
>
> * **`chat.send`** **返回新增可选** **`action`** **字段**（UI 指令）：摸底推进到"问体重"环节时返回 `action: 'open_weight_sheet'`，前端据此自动弹出体质录入 sheet，并锁定聊天输入（不产出下一轮对话）；待用户保存结构化信息（`onboarding.profile.submit`）产出新对话后再解锁。`action` 仅为前端指令，状态机仍以 `onboarding_state` 为准。
>
> * **`chat.send`** **返回新增可选** **`diet_card`**（UI 展示，2026-09-14）：本轮落库 `diet_records` 时由服务端根据契约 B 的 `diet_record` + 食物库 `food_refs` 派生，结构 `{ meal, meal_label, total_text, is_estimated, rows: [{ name, cal_text, situation }] }`；聊天页教练气泡下渲染为简洁表格（食物 / 热量 / 情况），与口语 `reply_text` 并存。
>
> **2026-08-31 增量（后端模块全量落地）**：
>
> * **内核 9 个 action 全部实现并部署**（2026-08-31 云函数 `api` 重新上传，Nodejs20.19）：新增 `conversation.current` / `conversation.history`（cursor 分页，`{ items, next_cursor }`）/ `user.profile.get`（派生 `daily_calorie_budget`、`snark_level` 常量，均不入库）/ `user.profile.update`（白名单 `nickname/gender/age_group/height_cm`，兼容前端 `height` 字段名）/ `user.target.update` / `onboarding.profile.submit`（`initial_weight` 落 `current_weight_kg`，字段齐备即状态机转 `active`）/ `budget.today`（返回 `{ total, consumed, remaining, target_weight, current_weight, weekly_change }`，对齐前端消费口径）。
>
> * **`budget.today`** **正式入契约 C**（此前前端在用而后端清单未登记，本次补登）。
>
> * **错误码对齐 §5.3 冻结版**：`40001` payload 校验失败 / `42901` 限流（`chat.send` 每用户每分钟 6 条，基于 `messages` 近 1 分钟计数）/ `50000` 内部错误；未知 action 返回 `40001`。
>
> * **`chat.send`** **/** **`__start__`** **返回** **`action: 'open_weight_sheet'`**：判定规则为状态机主导——`onboarding_state !== 'active'` 且（`height_cm` 或 `current_weight_kg` 缺失）时附带该指令（不依赖 LLM）；前端 `_initChat` 开场与 `handleSend` 均已处理。
>
> * **消息时间戳单调性**：`ChatService._appendMessage` 保证每用户 `messages.created_at` 严格递增（同毫秒多轮 +1ms 推进），修复 cursor 分页排序错乱隐患。
>
> * **前端灰度全量放开**：`utils/api.js` 的 `REAL_ACTIONS` 覆盖全部 9 个 action + `subscribe.report`；`getHistory` 归一化 `{ items, next_cursor }` → `{ messages, hasMore, cursor }`；`updateProfile` 真实链路按契约传 `{ patch }`；42901 限流文案透传。
>
> * **测试**：内核本地 `npm test` 22/22 通过（原 14 项回归 + 新增 8 项：open\_weight\_sheet 时机 / submitProfile 落库与状态机 / conversation 分页 / profile 白名单 / target 更新 / budget.today / 限流 / 错误码）；快照 `deliverables/backend` 已同步并同样 22/22 通过。
>
> * **待人工验证**：模拟器端到端走查（含 M7 跨会话续读）与 M4 真实画像字段核验；M5 订阅模板 ID 申请后单独排期。
>
> **2026-09-01 增量（毒舌档位入库持久化）**：
>
> * **决策**：毒舌档位由「MVP 代码常量」改为**入库持久化**（用户可调），落实设计规格 §3.2「轻损 + 可调」。
>
> * **契约 A**：`users` 新增 `snark_level` 字段（`gentle=温柔 / light=轻损 / spicy=辛辣`，未设置或非法值回退 `light`）；`daily_calorie_budget_kcal` 仍不入库（服务端现场计算）。
>
> * **契约 C**：`user.profile.update` 白名单新增 `snark_level`（非法值静默忽略）；`user.profile.get` 返回用户入库档位；`chat.send` 系统提示词按用户档位组装「毒舌档位：温柔/轻损/辛辣」，替代 `ENV` 硬编码，对话内容随档位变化（`chat.js` `SNARK_LABELS` 映射）。
>
> * **前端**：`sheet-snark` 提交成功即经 `user.profile.update` 落库；返回聊天页后走 `pendingSnarkChange` 机制（与报体重 / 体质录入同款），教练**主动追加一条确认消息**（三档文案对齐提示词成品 §2）。
>
> **2026-09-01 增量（云端配置表 + 提示词后台可配置）**：
>
> * **新 action** **`app.config.get`**：无入参，返回公开配置 key-value map（仅 `app_config.public=true` 的行 + 默认兜底 `{ coach_avatar_url: '' }`）；`prompt.*` 内部键不返回给客户端。
>
> * **`app_config`** **集合**（契约 A）：`{ key, value, public, description, updated_at }`，运营在云开发控制台维护，云函数每次请求经 `ConfigService.ready()` 实时读取，改完即生效、无需重部署。
>
> * **提示词可配置**：`prompt.chat.system`（聊天系统提示词，占位符 `{gender} {age_group} {height_cm} {current_weight_kg} {target_weight_kg} {daily_budget} {budget_remaining} {goal_stage} {snark_label} {onboarding_hint}`）、`prompt.opening.new|profiling|active`（开场白）、`prompt.target_confirm` / `prompt.target_partial`（摸底话术）、`prompt.nudge.*`（定时督促模板）；未配置回退代码默认模板，行为不变。**输出契约（契约 B）默认不开放**，保持代码常量。
>
> * **前端**：`chat-main` 教练头像改为「有图显图、无图显字」——`coach_avatar_url` 配置后显示图片头像，否则回退「教」字占位；`utils/api.js` 新增 `getAppConfig()`（真实链路失败兜底默认配置）。
>
> * **测试**：内核本地 `npm test` 29/29 通过（新增 `config.test.mjs`：app.config.get 公开/内部隔离、prompt 覆盖、render 占位符、集合缺失兜底）；`npm test` 脚本由 `node --test test/` 改为 `node --test`（Node v25 目录参数无法解析的兼容修正）。
>
> * **数据库工具 action（同日增量）**：新增 `db.ensure`（幂等建表检查：7 个用户集合 + `app_config` 缺失自动创建，返回 `{ collection, status, count }`）。集合被删除后，任意 API 调用都会自动重建空表——运营「删表重建」即可完成整库重置（SDK 建表不建索引，正式环境需按后端计划 §4 在控制台重建）。内核本地 `npm test` 32/32。

***

## 2. 并行推进与汇总方式

1. **先对齐契约**：4 个板块各自开工前，先花一小段确认其依赖的「接口契约」并冻结。
2. **并行推进**：板块 1/2/3 可高度并行；板块 4 可先起方法论与获客/合规部分，成本与路线图最后收敛。
3. **汇总集成**：最后一轮会话统一 Review 四个板块产出，做接口对账、端到端走查、产出合并后的整体文档，并据此启动后续开发。

***

## 3. 建议的推进顺序

1. 后端先冻结「接口契约 + 数据模型」（公共底座）。
2. 提示词并行冻结「结构化输出 schema + 食物库引用方式」。
3. 前端依据契约先搭 mock。
4. 运营/商业同步起「指标体系 + 合规」。
5. 各板块交付 → 最后汇总走查。

