/** 报餐/报体重可选日期：今天、昨天（与云端 Asia/Shanghai 口径对齐，小程序用本地日历日） */
function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

function localDateKey(offsetDays = 0) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isAllowedRecordDate(dateStr) {
  const allowed = [localDateKey(0), localDateKey(-1)];
  return allowed.includes(dateStr);
}

module.exports = {
  localDateKey,
  isAllowedRecordDate,
  todayKey: () => localDateKey(0),
  yesterdayKey: () => localDateKey(-1)
};
