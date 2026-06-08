import { strict as assert } from 'node:assert';
import { redactForExport } from '../shared/aiReview/redaction';

const input = [
  '## 今日工作',
  '<!-- tag: work -->',
  '做了对外项目 A',
  '## 灵感闪念',
  '<!-- tag: private -->',
  '私人想法不可外泄',
  '## 读书',
  '<!-- tag: secret -->',
  '机密',
].join('\n');

const out = redactForExport(input);
assert.ok(out.includes('对外项目 A'), 'work content kept');
assert.ok(!out.includes('私人想法'), 'private removed');
assert.ok(!out.includes('机密'), 'secret removed');

// 无 work 标记的整段默认剔除（硬规则：只放行 work）
const noWork = redactForExport('## 杂记\n随便写写');
assert.equal(noWork.trim(), '', 'non-work content excluded by default');

// #work 标签也放行；同段含 private 优先剔除
const mixed = redactForExport('## 项目\n#work\n可对外的进展');
assert.ok(mixed.includes('可对外的进展'), '#work tag allows section');

const conflict = redactForExport('## 项目\n#work #private\n敏感');
assert.equal(conflict.trim(), '', 'private 优先于 work，剔除');

console.log('Redaction verification passed');
