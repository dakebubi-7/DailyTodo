import { strict as assert } from 'node:assert';
import { getShellText } from '../src/i18n';

const zh = getShellText('zh-CN');
const en = getShellText('en-US');

const zhTs = zh.settings.templateSources;
const enTs = en.settings.templateSources;

assert.equal(zhTs.title, '模板与素材');
assert.equal(zhTs.dailyNotePath, '每日记录文件位置');
assert.equal(zhTs.personalWeeklyTemplate, '个人周报生成模板');
assert.equal(zhTs.externalMonthlyDir, '对外月报输出目录');
assert.equal(zhTs.testSources, '测试素材来源');
assert.equal(zhTs.noSourceFound, '没有找到本周期原始记录，请检查素材来源或手动选择素材文件。');

const zhJson = JSON.stringify(zhTs);
for (const forbidden of ['dailyNotePath:', 'weeklyPrompt', 'externalMonthlyDir:', 'presetId', 'Legacy task export path']) {
  assert.equal(zhJson.includes(forbidden), false, `Chinese settings leaked ${forbidden}`);
}

assert.equal(enTs.title, 'Templates & Sources');
assert.equal(enTs.dailyNotePath, 'Daily note file path');
assert.equal(enTs.noSourceFound, 'No source notes found for this period. Check source settings or choose files manually.');

// English copy must not contain Chinese-only labels.
const enJson = JSON.stringify(enTs);
for (const forbidden of ['模板与素材', '每日记录文件位置', '个人周报生成模板']) {
  assert.equal(enJson.includes(forbidden), false, `English settings leaked ${forbidden}`);
}

console.log('verify-template-source-i18n ok');
