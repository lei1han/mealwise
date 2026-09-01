// 集合 schema 与索引定义（对齐后端计划 §4；云开发建表/布索引时参考）

// 全局配置集合名（无 user_id，由 ConfigService 单独直读，不走按用户的工作集加载）
export const DEFAULT_CONFIG_COLLECTION = 'app_config';

export const SCHEMA = Object.freeze({
  users: {
    fields: ['_id', 'user_id', 'phone', 'nickname', 'avatar_url', 'gender', 'age_group', 'height_cm', 'current_weight_kg', 'target_weight_kg', 'history_kg', 'target_estimate_weeks', 'onboarding_state', 'profiling_progress', 'onboarding_completed_at', 'last_active_at', 'created_at', 'updated_at', 'snark_level'],
    indexes: [{ name: 'idx_user_id', fields: ['user_id'], unique: true }],
    note: 'user_id 即 openid 映射；onboarding_completed_at 为执行期起点锚点（写一次）；last_active_at 冗余刷新；snark_level ∈ gentle/light/spicy（2026-09-01 起入库持久化，替代 MVP 代码常量）；phone/avatar_url 由授权登录回填（2026-09-01 增量：getPhoneNumber 换号 + chooseAvatar 头像 + nickname 输入）',
  },
  memories: {
    fields: ['_id', 'user_id', 'category', 'content', 'date', 'source', 'created_at', 'updated_at'],
    indexes: [{ name: 'idx_user_cat_created', fields: ['user_id', 'category', 'created_at'] }],
    note: 'category ∈ static/dynamic/emotion；去重契约：static 同语义更新、dynamic 按日覆盖、emotion 保留最近 20 条',
  },
  weight_records: {
    fields: ['_id', 'user_id', 'date', 'weight_kg', 'created_at'],
    indexes: [{ name: 'idx_user_date', fields: ['user_id', 'date'] }],
    note: '每日一条，按 date 覆盖',
  },
  diet_records: {
    fields: ['_id', 'user_id', 'date', 'meal', 'items', 'cal_min', 'cal_max', 'food_refs', 'confidence', 'is_estimated', 'created_at'],
    indexes: [{ name: 'idx_user_date', fields: ['user_id', 'date'] }],
    note: 'confidence ∈ high/medium/low；is_estimated 由后端派生',
  },
  messages: {
    fields: ['_id', 'user_id', 'role', 'content', 'created_at'],
    indexes: [{ name: 'idx_user_created', fields: ['user_id', 'created_at'] }],
    note: 'role = user | coach',
  },
  subscribe_auth: {
    fields: ['_id', 'user_id', 'template_key', 'status', 'authorized_at', 'used_at', 'updated_at'],
    indexes: [{ name: 'idx_user_tpl_status', fields: ['user_id', 'template_key', 'status'] }],
    note: 'status ∈ authorized/denied/expired/used；剩余额度 = authorized 未 used 记录数',
  },
  notify_log: {
    fields: ['_id', 'user_id', 'trigger_type', 'channel', 'status', 'sent_at'],
    indexes: [{ name: 'idx_user_sent', fields: ['user_id', 'sent_at'] }],
    note: 'status ∈ sent/delivered/clicked/failed；clicked 不可得则降级 sent/delivered',
  },
  app_config: {
    fields: ['_id', 'key', 'value', 'public', 'description', 'updated_at'],
    indexes: [],
    note: '全局配置表（无 user_id），运营在控制台维护；key 语义唯一；public=true 经 app.config.get 暴露给客户端，prompt.* 为内部提示词覆盖（缺省回退代码默认模板）',
  },
});

export function describeSchema() {
  return Object.entries(SCHEMA).map(([name, s]) => ({
    name,
    fields: s.fields,
    indexes: s.indexes,
    note: s.note,
  }));
}