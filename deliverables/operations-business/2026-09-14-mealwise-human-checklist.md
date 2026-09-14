# 三餐教练（MealWise）人工参与任务清单

- 文档类型：人工验收 / 平台操作清单（仅开发者或运营执行）
- 版本：v1.0
- 日期：2026-09-14
- 关联：总计划 `docs/superpowers/plans/2026-08-28-xcoach-master-plan.md` §1.3、部署计划 `docs/superpowers/plans/2026-08-28-xcoach-dev-deploy-plan.md`、调优报告 `deliverables/operations-business/2026-09-02-mealwise-tuning-report/`
- Agent 侧计划（勿与本清单混做）：`deliverables/operations-business/2026-09-14-mealwise-agent-execution-plan.md`

> **铁律**：涉及微信账号、密钥、审核、真机扫码、云开发控制台的操作，只能由人工完成；完成后把「现象 + Console/云函数日志」反馈给 Agent 修代码。

---

## 使用方式

- 按章节顺序勾选 `[ ]` → `[x]`。
- 每项附 **验收标准**；未通过不要进入下一章。
- 工程目录：`MealWise/`（勿在 `deliverables/frontend/mealwise-miniapp/` 快照上联调）。

---

## A. 环境与账号（一次性）

| 状态 | # | 任务 | 验收标准 |
|:---:|---|------|----------|
| [ ] | A1 | 微信开发者工具已登录，**设置 → 安全设置 → 服务端口** 已开启 | Agent/CLI 可 `open` 项目（可选） |
| [ ] | A2 | 导入工程目录 `MealWise/`，AppID `wxd6def00245936b4c` | 模拟器可编译，无项目级报错 |
| [ ] | A3 | 云开发环境 `cloud1-d6gmjs12rfd5c3925` 已开通；**在文件树右键 `cloudfunctions` → 选择/切换目标环境**（与 `app.js` 一致） | 云开发面板可打开；上传云函数不再报「请在 cloudfunctionRoot 选择一个云环境」 |
| [ ] | A4 | 云函数 `cloudfunctions/api` → **上传并部署：云端安装依赖** | 云端最新代码与本地 commit 一致 |
| [ ] | A5 | 云函数环境变量 `DEEPSEEK_API_KEY` 已配置（勿提交仓库） | 云上 `chat.send` 返回真人化回复，非固定 mock 句式 |
| [ ] | A6 | 云数据库集合与索引按后端计划 §4 存在（或调用一次 `db.ensure` 后人工补索引） | 控制台可见 users/messages/diet_records 等 |

---

## B. 模拟器端到端走查（M4 / M7）

参考：`deliverables/frontend/mealwise-miniapp/DEV_GUIDE.md`（流程与 MealWise 对齐）。

| 状态 | # | 任务 | 验收标准 |
|:---:|---|------|----------|
| [ ] | B1 | 闪屏 → 授权页（可跳过手机号）→ 进入 `chat-main` | 无白屏、无死循环跳转 |
| [ ] | B2 | 首进自动 `__start__`，摸底对话 + 必要时弹出体质 sheet | `onboarding_state` 随流程 `new → profiling → active` |
| [ ] | B3 | 体质 sheet 保存后教练有确认气泡，预算卡出现 | 云库 `users` 字段齐，`onboarding_completed_at` 有值 |
| [ ] | B4 | 日常：报体重、报午餐、情绪闲聊各至少 1 轮 | `weight_records` / `diet_records` / `memories` 有对应写入 |
| [ ] | B5 | 退出小程序再进：**历史消息分页**、画像/餐次不丢（M7） | `conversation.history` 顺序正确 |
| [ ] | B6 | 聊天文本补充摸底（如减肥史 `history_kg`）真 LLM 下是否写入记忆 | `memories` 符合提示词 §8 口径 |
| [ ] | B7 | 三条回归：报午餐 / 报体重 / 跑题（如「帮我写 Python」） | 饮食 `food_refs` 非全 external；跑题拒绝并拉回主题 |
| [ ] | B8 | 确认 `miniprogram/utils/api.js` 联调策略：`USE_MOCK` 与 `REAL_ACTIONS` 符合预期 | Network 显示 `callFunction api`，无 Mock 与真云混用困惑 |

**失败时反馈模板**：步骤 → 预期 → 实际 → Console 全文 → 云函数日志 requestId。

---

## C. 订阅消息与定时督促（M5，依赖公众平台）

| 状态 | # | 任务 | 验收标准 |
|:---:|---|------|----------|
| [ ] | C1 | 小程序后台申请 **订阅消息模板**（饮食/体重提醒类），记录 `template_id` | 模板字段与后端 `nudge.js` 拼装字段一致 |
| [ ] | C2 | 将 `template_id` 交给 Agent 写入前端 `sheet-subscribe`（及后端常量，若需要） | 代码已合入后你再部署云函数 |
| [ ] | C3 | 真机：`sheet-subscribe` 授权一次 | `subscribe_auth` 出现 `status=authorized`，额度 +1 |
| [ ] | C4 | 真机：触发一次推送（或 Agent 配置后你点验） | 手机收到 1 条；`notify_log` 有记录 |
| [ ] | C5 | `subscribe_hint=true`（额度 &lt;3）时前端会引导再授权 | 拒绝授权时前端有降级提示 |
| [ ] | C6 | 跨日验证四个督促时段（§9.1：早/午/晚/夜间） | 漏报判断与文案符合产品预期 |

> 若暂无模板 ID：C3–C6 整章可暂缓；小程序内催报卡片仍应可用。

---

## D. 运营配置（可选，上线前建议）

| 状态 | # | 任务 | 验收标准 |
|:---:|---|------|----------|
| [ ] | D1 | 云库 `app_config` 配置 `coach_avatar_url`（public=true） | 聊天页教练头像显示图片 |
| [ ] | D2 | 如需改话术：配置 `prompt.chat.system` 等（public=false） | 改后无需重部署云函数即可生效 |
| [ ] | D3 | 核对 `prompt.*` 与代码默认兜底语义一致（Agent P0 完成后） | 有/无云端配置时行为差异可接受 |

---

## E. 提审与发布

| 状态 | # | 任务 | 验收标准 |
|:---:|---|------|----------|
| [ ] | E1 | 隐私政策、用户协议、内容合规自查 | 审核材料齐全 |
| [ ] | E2 | 检查 `sitemap.json`、`project.config.json` | 符合微信规范 |
| [ ] | E3 | 开发者工具上传 → **体验版** 小范围灰度 | 体验版完整主流程可用 |
| [ ] | E4 | 提交审核 → 发布 | 正式版可访问 |
| [ ] | E5 | 商业计划 §2 埋点字段抽样（云库） | `onboarding_completed_at`、`diet_records.confidence` 等有真实数据 |

---

## F. 与 Agent 的协作节奏

1. **你先做 A + B**：把未勾选项与日志发给 Agent。
2. **Agent 按执行计划改代码并 push**：你再 **A4 重新部署云函数** + 重做失败的 B 项。
3. **C 章** 在你拿到 `template_id` 后启动；**E 章** 在 B 全绿后启动。

---

## 变更记录

| 日期 | 说明 |
|------|------|
| 2026-09-14 | 初版：从总计划 §15、部署计划、调优报告拆出纯人工清单 |
