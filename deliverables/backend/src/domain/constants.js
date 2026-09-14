// 领域常量：枚举与预算安全下限（对齐后端计划，契约 B / A 冻结口径）

export const INTENTS = Object.freeze(['diet_report', 'weight_report', 'mood_talk', 'goal_setup', 'off_topic', 'other']);

export const MEALS = Object.freeze(['breakfast', 'lunch', 'dinner', 'snack']);

export const MEMORY_CATEGORIES = Object.freeze(['static', 'dynamic', 'emotion']);

export const GOAL_STAGES = Object.freeze(['摸底', '定标', '执行', '收敛重整']);

export const ONBOARDING_STATES = Object.freeze(['new', 'profiling', 'active', 'converging']);

export const AGE_GROUP_MID = Object.freeze({
  '18-24': 21,
  '25-34': 29.5,
  '35-44': 39.5,
  '45-54': 49.5,
  '55+': 58,
});

// 定标热量安全下限（Mifflin 定标后换算）
export const CAL_FLOOR = Object.freeze({ female: 1200, male: 1500 });

// 记忆读取 token 预算（注入 memory 的上限，粗略按字符估）
export const MEMORY_TOKEN_BUDGET = 1500;
export const EMOTION_KEEP = 20; // emotion 保留最近条数
export const HISTORY_ROUNDS = 12; // 注入最近对话轮数（1 轮 = 用户+教练各 1 条）

// 定时督促：对齐计划 §9.1（云开发 cron 为 7 字段：秒 分 时 日 月 周 年）
// slot：调度标识；trigger：notify_log.trigger_type 枚举；condition：漏报判定维度（null=总是推送如晚间总结）
export const NUDGE_SLOTS = Object.freeze([
  { slot: 'morning_greeting', trigger: 'morning_greeting', condition: 'weight', cron: '0 30 8 * * * *' },
  { slot: 'meal_reminder_lunch', trigger: 'meal_reminder', condition: 'lunch', cron: '0 0 13 * * * *' },
  { slot: 'meal_reminder_dinner', trigger: 'meal_reminder', condition: 'dinner', cron: '0 0 20 * * * *' },
  { slot: 'evening_summary', trigger: 'recall', condition: null, cron: '0 30 21 * * * *' }, // 晚间总结：纯模板，不调 LLM
]);