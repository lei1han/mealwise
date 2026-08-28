# 契约 A 增量提案：商业埋点所需字段（板块 4 → 板块 3）

- 文档类型：跨板块接口契约变更提案（Contract A Amendment Proposal）
- 版本：v1.0
- 日期：2026-08-28
- 上游：总计划 `../../docs/superpowers/plans/2026-08-28-xcoach-master-plan.md` §1.1（契约 A）、设计规格 `../../docs/superpowers/specs/2026-08-28-xcoach-design.md` §7、商业计划书 `2026-08-28-xcoach-business-plan.md` §1.3
- 目标读者：板块 3（后端）
- 状态：**已承接（2026-08-28 后端 v2.1 采纳）**——7 项增量全部被后端 schema 承接，回写总计划 §1.1；差异点见下表，详见后端文档 §3.1 / §4

---

## 0. 背景与目的

商业计划书 §1 把北极星「靠谱减重结果」拆成了 1 个北极星 + 4 个过程指标 + 2 个负向监控。逐项反查发现：**设计规格 §7 现有字段不足以支撑其中「留存 / 流失」与「主动督促有效性」两类指标的可计算**，核心缺口是记录表缺少精确时间戳、以及"订阅触达"无任何落库。

本文作为契约 A 的**增量诉求**，只提案必须的最小字段，不推翻 §7 既有结构，供板块 3 冻结 schema 时采纳。

---

## 1. 变更原则

1. **最小增量**：只补"指标可计算"所必需的字段，杜绝无依据扩字段。
2. **向后兼容**：与契约 A/B/C 现状兼容，不改变已有字段语义。
3. **由指标反推**：每个新增字段都标注"支撑哪个指标"，无法映射到指标的字段一律不提。
4. **命名对齐**：沿用现有 `snake_case` 风格；`weight_records / diet_records` 现有中文占位字段（"日期/体重"等）建议一并归一为英文，最终以后端冻结为准。

---

## 2. 现有字段缺口分析

| 指标（商业计划书 §1.1） | 依赖数据 | 现有 §7 是否可算 | 缺口 |
|---|---|---|---|
| 目标达成率 / 达成度 | `users` + `weight_records` 时序 | 部分 | `weight_records` 只有"日期"无精确时间戳，且缺执行期起点锚点 |
| 日均汇报次数 | `diet_records`/`weight_records` 按日计数 | 可算 | 无（仅需耗时一致性） |
| 连续汇报天数（streak） | 按 `user_id+日期` 连续区间 | 可算 | 记录表缺精确时间戳会污染跨日边界 |
| 热量汇报覆盖率 | `diet_records.meal` | 可算 | 无 |
| 预算达成 | `users.daily_calorie_budget` vs `diet_records` | 可算 | 无（`confidence` 缺失会高估"可信达成"） |
| 情绪低谷 | `memories.category=emotion` | 可算 | 无（但缺事件时间精度，趋势统计受限） |
| 流失节点分布 | 各表最新记录时间 vs 当前 | **不可算** | 记录表无精确时间戳、`users` 无 `last_active_at` |
| 主动督促有效性 | 订阅/触达日志 | **完全缺失** | 无任何订阅授权与触达落库 |

> 结论：必须补齐「时间戳」与「订阅触达日志」两类，否则留存/流失/触达效果三项关键指标无法落地。

---

## 3. 增量字段提案

### 3.1 既有表字段补充

| 所属表 | 新字段 | 建议类型 | 说明 | 写入时机 | 支撑指标 |
|---|---|---|---|---|---|
| `weight_records` | `created_at` | timestamp | 记录精确产生时间（粒度分），与"日期"字段并存或合并 | 报体重落库时 | 达成度、streak、流失 |
| `diet_records` | `created_at` | timestamp | 同上，饮食记录精确时间 | 汇报饮食落库时 | 覆盖率、streak、流失 |
| `diet_records` | `confidence` | enum `high/medium/low`，可空 | 热量估算置信度，对齐提示词 §4 `diet_record.confidence` | 汇报饮食落库时 | 公信力监控（低置信度占比） |
| `users` | `onboarding_completed_at` | timestamp，可空 | 定标完成时刻 = **执行期起点锚点**，"执行期 ≥N 天"口径依据 | 定标确认后写入 | 北极星、达成率 |
| `users` | `last_active_at` | timestamp | 最后活跃时刻；可由各记录表最新时间派生，若查询代价高则冗余落库（后端二选一） | 任意记录/对话落库时刷新 | 流失节点 |

### 3.2 新增表（订阅触达，MVP 主动督促的可观测底座）

**表 `subscribe_auth`（订阅授权状态）**

| 字段 | 建议类型 | 说明 |
|---|---|---|
| `user_id` | string | 用户标识 |
| `template_id` | string | 订阅消息模板 ID |
| `status` | enum `authorized/denied/expired` | 授权状态 |
| `authorized_at` | timestamp | 授权时间 |
| `updated_at` | timestamp | 最近变更时间 |

支撑：MVP 主动督促依赖微信订阅消息，须知道"每个用户对哪些模板授权、是否过期"，才能发催报并统计触达覆盖率。

**表 `notify_log`（触达日志）**

| 字段 | 建议类型 | 说明 |
|---|---|---|
| `user_id` | string | 用户标识 |
| `trigger_type` | enum（见下） | 触达场景 |
| `channel` | enum `subscribe_msg/in_app_card` | 触达渠道 |
| `status` | enum `sent/delivered/clicked/failed` | 送达与点击结果 |
| `sent_at` | timestamp | 发送时间 |

`trigger_type` 建议枚举：`morning_greeting / meal_reminder / missed_report / recall`（早问候 / 餐次催报 / 漏报点醒 / 召回），对齐提示词 §6 的主动督促场景。

支撑：负向监控-2（流失节点）+ "主动督促是否有效"的唯一数据来源，直接决定 §6.4「订阅消息频次受限」风险的验证方式。

---

## 4. 字段 → 指标解锁映射

| 新增字段/表 | 解锁的指标或能力 |
|---|---|
| `weight_records.created_at` | 达成度时序、连续汇报天数、流失节点 |
| `diet_records.created_at` | 热量覆盖率、streak、流失节点 |
| `diet_records.confidence` | 低置信度估算占比（公信力监控） |
| `users.onboarding_completed_at` | "执行期 ≥N 天"口径（北极星分母） |
| `users.last_active_at` | 流失节点分布 |
| `subscribe_auth` | 触达覆盖率、授权漏斗、频次验证 |
| `notify_log` | 触达有效性、漏报召回效果、流失预警 |

---

## 5. 兼容性与注意事项

1. **不触碰契约 B/C**：本提案只涉及数据模型（契约 A），不动结构化输出 schema（B）与前后端接口（C）。
2. **`confidence` 语义对齐**：提示词 §4/§7 已输出 `diet_record.confidence`，后端此前仅校验未落库，本提案建议**落库**以便统计，无解析负担。
3. **时区与粒度**：时间戳统一 UTC 存储、展示转本地；粒度到分钟即可，秒级非必需。
4. **`notify_log.clicked` 的可得性**：微信订阅消息的"点击回传"是否可取需后端核实平台能力；若不可得，降级为仅记 `sent/delivered`，触达效果改用"触达后 24h 内是否产生汇报"间接度量。
5. **`last_active_at` 冗余取舍**：若采用每表派生即可满足查询，可不建该字段；此处仅作为低查询代价的备选。

---

## 6. 需板块 3 确认的开放问题

1. 本次 7 项增量（5 字段 + 2 表）哪些采纳、哪些由现有方案等价覆盖？
2. `weight_records / diet_records` 中文占位字段是否统一归一为英文命名？
3. `notify_log.status` 是否可获得真实"送达/点击"回传，还是降级为间接度量（§5.4）？
4. `last_active_at` 选择冗余落库还是查询派生？

---

## 8. 承接差异记录（2026-08-28 后端 v2.1）

后端已按提案 §7 回写完总计划。7 项增量全部承接，差异如下：

| 提案 | 后端版本 | 差异说明 |
|---|---|---|
| `subscribe_auth.template_id` | `template_key` | 改名，语义一致；且与额度账本合并为**同一张表** `subscribe_auth`，复用该集合原有的额度表达 |
| `notify_log.status.clicked` | 保留但并不保证可得 | 同提案 §5.4，不可得时降级为 `sent/delivered` + 「触达后 24h 内是否汇报」间接度量 |
| `last_active_at` | 冗余刷新 | 采纳提案 §5.4 的冗余落库分支（非派生） |

其余字段（`created_at`×2、`confidence`、`onboarding_completed_at`）按提案原样入库。提案使命完成，归档为已采纳。

---

## 7. 回写约定

本提案经板块 3 确认采纳后，**由板块 3 回写总计划 §1.1（契约 A）**，冻结正式 schema；本提案届时归档为已采纳，商业计划书 §8 待对账项第 1 条同步销项。