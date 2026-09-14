// Mock LLM：本地演示用启发式，产出符合契约 B 的 JSON；真实环境切换 llm/client.js 的 OpenAI 兼容调用。
import { RAW } from '../domain/foods.js';

function pickFoods(text) {
  const found = [];
  for (const f of RAW) {
    if (text.includes(f.name)) found.push(f);
  }
  return found;
}

function composeDiet(turn, budgetKcal) {
  const foods = pickFoods(turn);
  const meal = /早餐/.test(turn) ? 'breakfast' : /晚餐|晚饭/.test(turn) ? 'dinner' : /夜宵|加餐/.test(turn) ? 'snack' : 'lunch';
  const items = foods.length ? foods.slice(0, 4) : [];
  const refs = foods.slice(0, 4).map((f) => `food:${f.id}`);
  const calMin = items.length ? items.reduce((s, f) => s + f.min, 0) : 0;
  const calMax = items.length ? items.reduce((s, f) => s + f.max, 0) : 0;

  const names = items.length ? items.map((f) => f.name).join('、') : '这点食物';
  const kcalDesc = calMax ? `约 ${calMin}~${calMax} 大卡` : '热量先不细算';
  const reply = `这餐${kcalDesc}，${items.length ? names + ' 挺实在' : '更细的食物名我再问问你'}。`;
  return {
    reply,
    diet: calMax ? { meal, items: foods.slice(0, 4).map((f) => f.name), cal_min: calMin, cal_max: calMax, food_refs: refs.length ? refs : ['food:external'], confidence: refs.length >= items.length ? 'high' : 'low' } : null,
  };
}

export function mockComplete({ messages }) {
  // 仅取最后一条用户消息（mock 不看完整历史）
  const last = messages[messages.length - 1]?.content ?? '';
  const turn = String(last);

  // 降级测试触发
  if (turn.includes('解析失败测试')) {
    throw new Error('mock 返回非 JSON');
  }

  if (/Python|写代码|编程/.test(turn)) {
    return JSON.stringify({
      reply_text: '代码我真不在行，我的主场是你的身材。说说今天中午吃了啥？',
      intent: 'off_topic',
      extracted: {},
      budget_remaining_kcal: null,
    });
  }

  const memoryPoints = [];

  // 静态画像：性别/年龄段
  if (/男/.test(turn)) memoryPoints.push({ category: 'static', content: '用户为男性' });
  if (/女/.test(turn)) memoryPoints.push({ category: 'static', content: '用户为女性' });
  if (/年龄|岁/.test(turn)) {
    const m = turn.match(/\d{2}\s*岁/);
    if (m) {
      const age = parseInt(m[0], 10);
      const grp = age <= 24 ? '18-24' : age <= 34 ? '25-34' : age <= 44 ? '35-44' : age <= 54 ? '45-54' : '55+';
      memoryPoints.push({ category: 'static', content: `年龄段 ${grp}` });
    }
  }
  if (/身高|厘米|cm|CM/.test(turn)) {
    const m = turn.match(/(\d{3})\s*(?:厘米|cm|CM)?/);
    if (m && m[1] >= 120 && m[1] <= 230) memoryPoints.push({ category: 'static', content: `身高 ${m[1]}cm` });
  }
  const tm = turn.match(/(?:减到|目标)\s*(\d{2}(?:\.\d)?)/);
  if (tm) memoryPoints.push({ category: 'static', content: `目标体重 ${tm[1]}kg` });
  if (turn.includes('不吃香菜')) memoryPoints.push({ category: 'static', content: '不吃香菜' });

  // 情绪
  const emo = /心情不好|压力|想哭|心烦|焦虑|暴食/.test(turn);
  if (emo) {
    memoryPoints.push({ category: 'emotion', content: '压力大时容易想吃甜食，需要可执行的替代方案而非说教' });
  }

  // 体重
  const wm = turn.match(/(\d{2}(?:\.\d)?)\s*(?:kg|公斤|斤)/i);
  const weight = wm ? parseFloat(wm[1]) : null;
  let weightReply = '';
  if (weight) {
    memoryPoints.push({ category: 'dynamic', content: `今日体重 ${weight}kg` });
    weightReply = `到 ${weight} 了，稳。明天照常称，把速度守住别贪快。`;
  }

  const diet = composeDiet(turn, null);

  let intent = 'other';
  if (weight && !diet.diet) intent = 'weight_report';
  else if (diet.diet) intent = 'diet_report';
  else if (emo) intent = 'mood_talk';

  const reply =
    diet.diet?.cal_max && intent !== 'mood_talk'
      ? diet.reply + weightReply
      : weightReply || (emo ? '先抱一个。想吃甜说明今天缺口拉太猛，试着加一拳水果或换一块黑巧，别硬扛。' : '嗯，我记下了。有什么想说随时来。');

  return JSON.stringify({
    reply_text: reply,
    intent,
    extracted: {
      diet_record: dieldReport(diet),
      weight_record: weight ? { weight_kg: weight } : undefined,
      memory_points: memoryPoints.length ? memoryPoints : undefined,
    },
    budget_remaining_kcal: null,
  });
}

function dieldReport(diet) {
  return diet?.diet ?? undefined;
}