import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRaw } from '../src/llm/parser.js';

test('完整 diet_report 结构化解析 + is_estimated=false', () => {
  const r = parseRaw(JSON.stringify({
    reply_text: '这餐约 320~400',
    intent: 'diet_report',
    extracted: {
      diet_record: { meal: 'lunch', items: ['米饭', '鸡腿肉'], cal_min: 320, cal_max: 400, food_refs: ['food:rice', 'food:chicken_thigh'], confidence: 'high' },
    },
    budget_remaining_kcal: 560,
  }));
  assert.equal(r.degraded, false);
  assert.equal(r.intent, 'diet_report');
  assert.equal(r.extracted.diet_record.cal_min, 320);
  assert.equal(r.extracted.diet_record.is_estimated, false);
  assert.equal(r.budget_remaining_kcal, 560);
});

test('库外/复合菜 food:external 或 low 置信度 → is_estimated=true', () => {
  const a = parseRaw('{"reply_text":"x","intent":"diet_report","extracted":{"diet_record":{"meal":"lunch","items":["沙拉"],"cal_min":200,"cal_max":300,"food_refs":["food:external"],"confidence":"medium"}}}');
  assert.equal(a.extracted.diet_record.is_estimated, true);
  const b = parseRaw('{"reply_text":"x","intent":"diet_report","extracted":{"diet_record":{"meal":"lunch","items":["米饭"],"cal_min":100,"cal_max":200,"food_refs":["food:rice"],"confidence":"low"}}}');
  assert.equal(b.extracted.diet_record.is_estimated, true);
});

test('非 JSON → 降级 pure text，不落数据不报错', () => {
  const r = parseRaw('今天也好好加油啦，别焦虑');
  assert.equal(r.degraded, true);
  assert.equal(r.intent, 'other');
  assert.deepEqual(r.extracted, {});
  assert.equal(r.body === undefined, true);
});

test('包裹文本的 JSON 片段也能被提取', () => {
  const r = parseRaw('好的，这是结构化结果：\n{"reply_text":"记下了","intent":"other","extracted":{}}');
  assert.equal(r.degraded, false);
  assert.equal(r.reply_text, '记下了');
});

test('体重越界 → weight_record 被丢弃', () => {
  const r = parseRaw('{"reply_text":"x","intent":"weight_report","extracted":{"weight_record":{"weight_kg":999.9}}}');
  assert.equal(r.extracted.weight_record, undefined);
});

test('非法 category 的 memory_point 被丢弃，合法保留', () => {
  const r = parseRaw('{"reply_text":"x","intent":"other","extracted":{"memory_points":[{"category":"bogus","content":"nope"},{"category":"emotion","content":"想被哄"}]}}');
  assert.equal(r.extracted.memory_points.length, 1);
  assert.equal(r.extracted.memory_points[0].content, '想被哄');
});