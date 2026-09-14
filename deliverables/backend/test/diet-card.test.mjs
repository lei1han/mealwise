import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDietCard } from '../src/domain/diet-card.js';

test('buildDietCard：按 food_refs 拆分为食物行 + 餐次合计', () => {
  const card = buildDietCard({
    meal: 'lunch',
    items: ['米饭', '鸡胸肉', '绿叶蔬菜'],
    cal_min: 350,
    cal_max: 420,
    food_refs: ['food:rice', 'food:chicken_breast', 'food:greens'],
    confidence: 'high',
    is_estimated: false,
  });
  assert.equal(card.meal_label, '午餐');
  assert.equal(card.total_text, '350~420');
  assert.equal(card.rows.length, 3);
  assert.equal(card.rows[0].name, '米饭');
  assert.equal(card.rows[0].cal_text, '180~220');
  assert.ok(card.rows[0].situation.includes('一拳'));
});

test('buildDietCard：库外项均分区间热量', () => {
  const card = buildDietCard({
    meal: 'dinner',
    items: ['麻辣烫'],
    cal_min: 400,
    cal_max: 600,
    food_refs: ['food:external'],
    is_estimated: true,
    confidence: 'low',
  });
  assert.equal(card.rows[0].cal_text, '400~600');
  assert.ok(card.rows[0].situation.includes('粗略'));
});
