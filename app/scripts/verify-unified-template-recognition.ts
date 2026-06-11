import { strict as assert } from 'node:assert';
import { missingDailyCoreTokens } from '../shared/dailyMarkdownTemplate';
import {
  buildRecognizeReportMessages,
  parseRecognizedReportPrompt,
} from '../shared/aiReview/recognizeReportTemplate';
import type { TemplateRecognitionTarget } from '../shared/templateRecognition';

const targets: TemplateRecognitionTarget[] = ['daily', 'personalWeekly', 'personalMonthly', 'externalWeekly', 'externalMonthly'];
assert.equal(targets.length, 5);
assert.deepEqual(missingDailyCoreTokens('{{work}}\n{{inspiration}}'), ['tasks']);

const externalMessages = buildRecognizeReportMessages('## Summary', 'externalWeekly');
assert.ok(externalMessages[0].content.includes('脱敏'));
assert.ok(externalMessages[0].content.includes('绝不编造'));
assert.ok(externalMessages[0].content.includes('周报'));

const externalMonthly = buildRecognizeReportMessages('## Summary', 'externalMonthly');
assert.ok(externalMonthly[0].content.includes('月报'));
assert.ok(externalMonthly[0].content.includes('脱敏'));

const personalMessages = buildRecognizeReportMessages('## Summary', 'personalMonthly');
assert.ok(personalMessages[0].content.includes('月报'));
assert.ok(!personalMessages[0].content.includes('脱敏'));

const personalWeekly = buildRecognizeReportMessages('## Summary', 'personalWeekly');
assert.ok(personalWeekly[0].content.includes('周报'));

assert.equal(parseRecognizedReportPrompt('```md\nhello\n```'), 'hello');

console.log('verify-unified-template-recognition ok');
