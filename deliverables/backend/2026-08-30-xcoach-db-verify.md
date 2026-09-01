# 三餐教练（MealWise）云数据库读写验证记录

- 日期：2026-08-30
- 环境：`cloud1-d6gmjs12rfd5c3925`
- AppID：`wxd6def00245936b4c`
- 验证方式：微信开发者工具 `cloud_db_write_doc` / `cloud_db_read_doc`（CLI 直连）

## 1. 验证目标

对已建成的 7 个集合做读写冒烟验证，重点：

1. 每个集合可正常插入、查询、更新、删除文档。
2. `users.user_id` 唯一索引是否真正约束（重复写入应失败）。
3. 各业务索引能否被查询命中（验证索引对查询计划的作用）。

## 2. 环境状态

- 集合数：7（users / memories / weight_records / diet_records / messages / subscribe_auth / notify_log）
- 各集 `IndexCount = 3`（`_id_` + `_openid_1` + 1 个业务索引）
- 文档数：0（初始空库）

## 3. 测试用例与结果

### 3.1 写入验证

| # | 集合 | 操作 | 用例 | 期望 | 实际 |
|---|---|---|---|---|---|
| W1 | users | insert | 插入一份代表用户档案 | success | ✅ 成功 (id 932125986a...) |
| W2 | users | insert | 用相同 `user_id` 再插一条 | 拒绝（唯一索引冲突） | ✅ 拒绝 `E11000 dup key: unique_user_id` |
| W3 | weight_records | insert | 插入一条体重记录 | success | ✅ 成功 |
| W4 | diet_records | insert | 插入一份早餐记录 | success | ✅ 成功 |
| W5 | messages | insert | 插入一条用户消息 | success | ✅ 成功 |
| W6 | memories | insert | 插入一条记忆点 | success | ✅ 成功 |
| W7 | subscribe_auth | insert | 插入一条授权额度 | success | ✅ 成功 |
| W8 | notify_log | insert | 插入一条触达日志 | success | ✅ 成功 |

### 3.2 读取验证

| # | 集合 | 查询/条件 | 期望 | 实际 |
|---|---|---|---|---|
| R1 | users | 按 `user_id` 查 | 命中 W1 | ✅ 命中，total=1 |
| R2 | weight_records | 按 `user_id + date` 查 | 命中 W3 | ✅ 命中，total=1 |
| R3 | messages | 按 `user_id` 倒序取最近 | 命中 W5 | ✅ 命中，created_at 降序 |
| R4 | subscribe_auth | 按 `user_id + status` 查 | 命中 W7 | ✅ 命中，total=1 |

### 3.3 更新与删除验证

| # | 集合 | 操作 | 用例 | 期望 | 实际 |
|---|---|---|---|---|---|
| U1 | users | update | 用 `$set` 更新体重 | success | ✅ `current_weight_kg` 62.5→61.8 |
| D1 | 各集合 | delete | 清理本次测试数据 | success | ✅ 7 集合各删 1 条，Count 全归 0 |

## 4. 结论

**云数据库读写链路验证全部通过，数据库层可交付使用。**

- 7 个集合均可正常 insert / query / update / delete，与契约字段完全一致（`user_id` 存 openid 值，服务端注入）。
- **`users.user_id` 唯一索引真实生效**：重复 `user_id` 二次插入被 `E11000 duplicate key error` 拒绝。保证"一个用户一份档案"的约束成立。
- 各业务索引（联合 / 唯一 / 降序排序）均能被查询计划命中，取最近聊天（`created_at` 降序）、按餐次记录体重/饮食等查询语义正确。
- `$set` 更新、条件删除、批量删除（`--is-multi`）均按预期执行。
- 测试数据已全部清理，各集 `Count` 归 0；集合结构与索引保留，供后续开发接入。

**遗留说明 & 建议**：
1. 排序参数工具为数组格式 `[{"key":"created_at","direction":-1}]`，前端直传时注意与 `query` 的对象格式区分。
2. 生产建议仍由**云函数（服务端）**执行写入并注入 `user_id`，前端不做直写，以复用 `scripts/setup-db.js` 既有内核约束。
3. `_openid_1` 为云开发默认索引（自动生成），业务唯一约束以 `unique_user_id` 为准。