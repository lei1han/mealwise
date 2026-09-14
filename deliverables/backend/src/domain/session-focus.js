// 会话上下文总结：注入 LLM，减少多轮后话题漂移（规则生成，不调额外 LLM）

function clip(s, max = 120) {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + '…';
}

/** 从近期用户发言推断话题标签 */
export function inferRecentTopics(messages, maxUserLines = 6) {
  const userLines = messages
    .filter((m) => m.role === 'user')
    .slice(-maxUserLines)
    .map((m) => m.content)
    .join(' ');
  const topics = [];
  if (/吃|餐|早饭|午饭|晚饭|加餐|奶茶|零食/.test(userLines)) topics.push('饮食记录');
  if (/体重|公斤|kg|斤/.test(userLines)) topics.push('体重');
  if (/目标|减到|瘦/.test(userLines)) topics.push('目标');
  if (/运动|步数|跑步|健身/.test(userLines)) topics.push('运动');
  if (/睡|熬夜|作息/.test(userLines)) topics.push('作息');
  if (/心情|压力|烦|累|崩|焦虑/.test(userLines)) topics.push('情绪');
  if (/性别|身高|年龄|摸底/.test(userLines)) topics.push('摸底信息');
  return topics.length ? topics.join('、') : '日常跟进';
}

/** 被裁剪掉的更早消息 → 短摘要 */
export function summarizeOlderMessages(olderMessages) {
  if (!olderMessages.length) return '';
  const userCount = olderMessages.filter((m) => m.role === 'user').length;
  const firstUser = olderMessages.find((m) => m.role === 'user');
  const lastUser = [...olderMessages].reverse().find((m) => m.role === 'user');
  const topics = inferRecentTopics(olderMessages, 10);
  const parts = [
    `更早共 ${userCount} 条用户消息（已省略原文）`,
    `主要涉及：${topics}`,
  ];
  if (firstUser && lastUser && firstUser !== lastUser) {
    parts.push(`开端：「${clip(firstUser.content, 48)}」`);
    parts.push(`临近切换窗口前：「${clip(lastUser.content, 48)}」`);
  }
  return parts.join('；');
}

/**
 * @param {object} opts
 * @param {object} opts.user
 * @param {object[]} opts.messages 全量消息（升序）
 * @param {string} [opts.memoryCtx]
 * @param {number|null} opts.budgetRemaining
 * @param {boolean} opts.reportedWeightToday
 * @param {number} opts.todayMealCount
 */
export function buildSessionFocus({
  user,
  messages,
  memoryCtx,
  budgetRemaining,
  reportedWeightToday,
  todayMealCount,
}) {
  const lines = [];
  const state = user.onboarding_state;
  if (state !== 'active') {
    lines.push('阶段：摸底中（先建立信任、收集体质与动机，再定标）。');
    lines.push(`近几轮话题：${inferRecentTopics(messages)}`);
    lines.push('承接用户上一句情绪与诉求，循序渐进提问；不要跳步催填表。');
  } else {
    lines.push('阶段：执行期（核心：今日饮食、体重、预算与习惯）。');
    lines.push(
      `今日状态：${reportedWeightToday ? '已' : '未'}报体重；已记录 ${todayMealCount} 条饮食；预算剩余约 ${
        budgetRemaining == null ? '未定标' : budgetRemaining
      } kcal。`
    );
    if (user.target_weight_kg != null && user.current_weight_kg != null) {
      lines.push(`目标：${user.current_weight_kg}kg → ${user.target_weight_kg}kg。`);
    }
    lines.push(`近几轮话题：${inferRecentTopics(messages)}`);
    lines.push('回复须先呼应上文再给建议；用户跑题时简短接住后拉回饮食/体重/今日可执行一步。');
  }
  if (memoryCtx) {
    const oneLine = memoryCtx.split('\n').filter(Boolean).slice(0, 4).join(' / ');
    lines.push(`已记记忆摘要：${clip(oneLine, 200)}`);
  }
  return lines.join('\n');
}

/**
 * 组装注入 LLM 的历史块：更早摘要 + 最近原文
 */
export function buildHistoryContext(allMessagesAsc, historyRounds = 12) {
  const keep = historyRounds * 2;
  const recent = allMessagesAsc.slice(-keep);
  const older = allMessagesAsc.length > keep ? allMessagesAsc.slice(0, -keep) : [];
  const parts = [];
  if (older.length) {
    parts.push(`## 更早对话摘要\n${summarizeOlderMessages(older)}`);
  }
  if (recent.length) {
    const body = recent.map((m) => `${m.role === 'coach' ? '教练' : '用户'}：${m.content}`).join('\n');
    parts.push(`## 最近对话\n${body}`);
  }
  return parts.join('\n\n');
}
