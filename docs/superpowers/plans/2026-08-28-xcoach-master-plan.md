# X教练（代号）实施总计划与规划

- 文档类型：实施总计划（Master Plan）
- 版本：v1.2（契约 B 对齐 prompt 冻结版 + 承接契约 A 增量提案）
- 日期：2026-08-28
- 依赖设计：`../specs/2026-08-28-xcoach-design.md`
- 分板块文档：见下表 4 个子文档

---

## 0. 总览与推进方式

实施拆为 **1 个总计划 + 4 个可独立推进的板块文档**：

| # | 板块 | 子文档 | 核心交付物 | 相对依赖 |
|---|---|---|---|---|
| 1 | 前端设计 | `2026-08-28-xcoach-frontend.md` | 页面/交互/视觉 + 接口调用层 | 契约 C、A |
| 2 | 提示词设计 | `2026-08-28-xcoach-prompt.md` | 系统提示词 + 子提示词 + 结构化输出 schema | 契约 B、A、食物库 |
| 3 | 后端设计 | `2026-08-28-xcoach-backend.md` | 架构 + 数据库 + API + LLM 集成 + 食物库 + 定时督促 | 契约 A、B、C |
| 4 | 产品运营及商业计划 | `2026-08-28-xcoach-operations-business.md` | 指标 + 获客/留存/变现 + 成本与合规 | 前三者，最晚收敛 |

**关键原则**：4 个板块会在不同会话分别推进。为避免各自为政、最后对不上，开工前必须先锁定本总计划第 1 节的「跨板块接口契约」。有了这份契约，各板块即可并行，互不阻塞。

---

## 1. 跨板块接口契约（开工前必须先行对齐）

这是 4 个板块能并行、且最终能拼起来的"公共接口"。每个板块开工前先在对应会话里 Review 一次这节。

### 1.1 契约 A：数据模型（后端产出，提示词/前端消费）

- 实体：`users`、`memories`、`weight_records`、`diet_records`（字段见设计规格第 7 节，具体类型已由后端板块细化为 schema，见 `2026-08-28-xcoach-backend.md` 第 4 节）。
- `memories.category` 枚举固定为：`static / dynamic / emotion`。
- 静态记忆字段包含：性别（gender）、年龄段（age_group）、饮食偏好（dietary_preferences）、运动习惯（exercise_habits）、减肥史（weight_loss_history）。性别/年龄段为定标公式（BMR/TDEE）必需，摸底时自然带出。
- 后端板块扩展：新增 `messages`（聊天历史）、`subscribe_auth`（订阅授权/额度账本）、`notify_log`（触达日志）集合（后两者承接契约 A 增量提案）；`memories` 增加 `source` 字段。
- 记忆写入：按提示词成品 §8.3 **去重契约**——static 同语义更新不新增、dynamic 按自然日覆盖、emotion 保留最近 20 条；读取侧 static 全量、emotion 近 5 条、dynamic 当日饮食 + 近 7 天体重，与后端 `2026-08-28-xcoach-backend.md` §7、提示词 §8 口径一致。
- **待办联动**：契约 A 增量提案（板块 4）**已被后端板块采纳并回写本节（2026-08-28）**：记录表时间戳、`diet_records.confidence`、`users.onboarding_completed_at`/`last_active_at`、`subscribe_auth`/`notify_log` 两表均已并入 schema（见后端 §4）；`subscribe_quotas` 已并入 `subscribe_auth`。商业计划书 §8 待对账项第 1 条由板块 4 销项。

### 1.2 契约 B：结构化输出（提示词产出，后端消费）—— 冻结版

LLM 每次回复除自然语言外，须以统一 JSON 返回"机器可读结果"，后端据此落库。冻结 schema（LLM 每次回复只输出一个合法 JSON 根对象，不包裹 markdown 代码块）：

```json
{
  "reply_text": "给用户看的聊天内容",
  "intent": "diet_report | weight_report | mood_talk | goal_setup | other",
  "extracted": {
    "diet_record": { "meal": "lunch", "items": ["米饭"], "cal_min": 320, "cal_max": 400, "food_refs": ["food:rice"], "confidence": "high" },
    "weight_record": { "weight_kg": 65.2 },
    "memory_points": [ { "category": "emotion", "content": "今天压力大想吃甜" } ]
  },
  "budget_remaining_kcal": 600
}
```

字段规则（后端解析据此校验，详细解析/降级见提示词成品 `deliverables/prompt/2026-08-28-xcoach-prompts.md` §7）：
- `diet_record` 仅当本轮汇报饮食时出现：`food_refs` 数组与 `items` 一一对应，库内 `food:xxx`、库外/复合菜 `food:external`；`confidence`（high/medium/low）支撑"低置信度诚实标注"。`is_estimated` 由后端派生：`food_refs` 含 `food:external` 或 `confidence=low` 时为 true，落库 `diet_records.is_estimated`。
- `weight_record` 仅当报体重时出现；`memory_points` 仅当出现值得长期记忆的新信息时出现，`category` 枚举 `static / dynamic / emotion`。
- `budget_remaining_kcal` 为整数 kcal，**无法确定时填 `null`**（如定标前闲聊、纯情绪陪聊）；后端以自身预算计算兜底覆盖，不信任模型口径（见后端计划 §6.4）。

> 契约 A / B / C 均已冻结（B 于 2026-08-28 由提示词板块冻结并回写；记忆去重契约见提示词 §8.3，写入策略见 §1.1）。

### 1.3 契约 C：前后端接口（后端产出，前端消费）

> **后端板块已改版并冻结 v2（2026-08-28）**：部署形态确定为微信云开发，接口从 REST 改为云函数调用（`wx.cloud.callFunction`，action 路由），语义与原 REST 提案一一映射。MVP 非流式（前端打字机动画模拟）。详见 `2026-08-28-xcoach-backend.md` 第 3.2 / 5 节。

- 会话：`callFunction('api', { action: 'chat.send', payload: { text } })` → 返回回复 + 结构化结果（统一 envelope `{ code, data, message }`）。
- 会话上下文：`action: 'conversation.current'`、历史消息 `action: 'conversation.history'`（cursor 分页）。
- 用户/目标：`user.profile.get / user.profile.update`、`user.target.update`。
- 订阅消息：`action: 'subscribe.report'`（上报授权结果，accepted → 额度 +1）、后端 scheduler 云调用推送；`chat.send` 返回 `subscribe_hint`（额度不足 3 次时提示前端请求授权）。
- 模板 ID：需在小程序后台申请，前端硬编码，后端按模板字段拼装。

> 契约 A / B / C 均已冻结：A/C 由后端板块冻结（v2，2026-08-28）；B 由提示词板块冻结并回写本节（2026-08-28）。

---

## 2. 并行推进与汇总方式

1. **先对齐契约**：4 个板块各自开工前，先花一小段确认其依赖的「接口契约」并冻结。
2. **并行推进**：板块 1/2/3 可高度并行；板块 4 可先起方法论与获客/合规部分，成本与路线图最后收敛。
3. **汇总集成**：最后一轮会话统一 Review 四个板块产出，做接口对账、端到端走查、产出合并后的整体文档，并据此启动后续开发。

---

## 3. 建议的推进顺序

1. 后端先冻结「接口契约 + 数据模型」（公共底座）。
2. 提示词并行冻结「结构化输出 schema + 食物库引用方式」。
3. 前端依据契约先搭 mock。
4. 运营/商业同步起「指标体系 + 合规」。
5. 各板块交付 → 最后汇总走查。