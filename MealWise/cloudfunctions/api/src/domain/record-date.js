// 报餐/报体重落库日期：仅允许「今天」「昨天」（默认 Asia/Shanghai 自然日）
export const REPORT_TIME_ZONE = 'Asia/Shanghai';

/** 指定时区下的 YYYY-MM-DD */
export function recordDateKey(date = new Date(), timeZone = REPORT_TIME_ZONE) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function allowedRecordDateKeys(now = new Date(), timeZone = REPORT_TIME_ZONE) {
  const today = recordDateKey(now, timeZone);
  const yesterday = recordDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000), timeZone);
  return [today, yesterday];
}

export function isAllowedRecordDate(dateStr, now = new Date(), timeZone = REPORT_TIME_ZONE) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  return allowedRecordDateKeys(now, timeZone).includes(dateStr);
}

/** 缺省为今天；非法日期返回 null */
export function normalizeRecordDate(input, now = new Date(), timeZone = REPORT_TIME_ZONE) {
  if (input == null || input === '') return recordDateKey(now, timeZone);
  const d = String(input).slice(0, 10);
  if (!isAllowedRecordDate(d, now, timeZone)) return null;
  return d;
}

/** 从用户口语推断落库日；明确远期/前天等 → rejected */
export function inferRecordDateFromUserText(text, now = new Date(), timeZone = REPORT_TIME_ZONE) {
  const t = String(text || '');
  if (/前天|大前天|上周|上个?月|去年|\d{1,2}\s*月\s*\d{1,2}\s*日|\d{4}-\d{2}-\d{2}/.test(t)) {
    return { rejected: true, date: null };
  }
  if (/昨天|昨日/.test(t)) {
    const keys = allowedRecordDateKeys(now, timeZone);
    return { rejected: false, date: keys[1] };
  }
  if (/今天|今日|今早|刚才|刚刚/.test(t)) {
    return { rejected: false, date: recordDateKey(now, timeZone) };
  }
  return { rejected: false, date: recordDateKey(now, timeZone) };
}

/**
 * 确定本轮饮食/体重落库日期
 * @returns {{ ok: boolean, date: string|null, rejected: boolean }}
 */
export function resolveReportingDate({ userText, clientDate, llmDate, now = new Date(), timeZone = REPORT_TIME_ZONE }) {
  if (clientDate != null) {
    const normalized = normalizeRecordDate(clientDate, now, timeZone);
    if (!normalized) return { ok: false, date: null, rejected: true };
    return { ok: true, date: normalized, rejected: false };
  }
  if (llmDate != null) {
    const normalized = normalizeRecordDate(llmDate, now, timeZone);
    if (!normalized) return { ok: false, date: null, rejected: true };
    return { ok: true, date: normalized, rejected: false };
  }
  const inferred = inferRecordDateFromUserText(userText, now, timeZone);
  if (inferred.rejected) return { ok: false, date: null, rejected: true };
  return { ok: true, date: inferred.date, rejected: false };
}
