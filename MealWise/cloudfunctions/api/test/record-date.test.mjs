import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  allowedRecordDateKeys,
  isAllowedRecordDate,
  normalizeRecordDate,
  inferRecordDateFromUserText,
  resolveReportingDate,
} from '../src/domain/record-date.js';

const NOW = new Date('2026-09-14T10:00:00+08:00');

test('allowedRecordDateKeys：今天与昨天', () => {
  const keys = allowedRecordDateKeys(NOW);
  assert.deepEqual(keys, ['2026-09-14', '2026-09-13']);
});

test('normalizeRecordDate：缺省今天；非法日期 null', () => {
  assert.equal(normalizeRecordDate(null, NOW), '2026-09-14');
  assert.equal(normalizeRecordDate('2026-09-13', NOW), '2026-09-13');
  assert.equal(normalizeRecordDate('2026-09-01', NOW), null);
});

test('inferRecordDateFromUserText：昨天/前天', () => {
  assert.equal(inferRecordDateFromUserText('昨天体重 68', NOW).date, '2026-09-13');
  assert.equal(inferRecordDateFromUserText('前天吃了火锅', NOW).rejected, true);
});

test('resolveReportingDate：客户端 record_date 优先', () => {
  const r = resolveReportingDate({
    userText: '体重 70',
    clientDate: '2026-09-13',
    llmDate: null,
    now: NOW,
  });
  assert.equal(r.ok, true);
  assert.equal(r.date, '2026-09-13');
});
