import { strict as assert } from 'node:assert';
import { decideBlock, BlockState, BlockAction } from '../shared/aiReview/scanDecision';
import { embedHash } from '../shared/aiReview/hash';

// 1. 空块 → Unprocessed → fill
assert.deepEqual(decideBlock(''), { state: BlockState.Unprocessed, action: BlockAction.Fill });
assert.deepEqual(decideBlock('   \n  '), { state: BlockState.Unprocessed, action: BlockAction.Fill });

// 2. 未改动的 AI 草稿 → AiUnmodified → overwrite 允许
const ai = embedHash('🤖 AI 草稿\n内容');
assert.deepEqual(decideBlock(ai), { state: BlockState.AiUnmodified, action: BlockAction.Overwrite });

// 3. 用户改过的 AI 草稿 → UserModified → skip
const edited = ai.replace('内容', '我改了');
assert.deepEqual(decideBlock(edited), { state: BlockState.UserModified, action: BlockAction.Skip });

// 4. 无 hash 但有内容 → UserAuthored → skip
assert.deepEqual(decideBlock('我自己写的复盘'), { state: BlockState.UserAuthored, action: BlockAction.Skip });

// 5. 冻结标签 → Frozen → skip（即便空/即便是 AI 草稿）
assert.deepEqual(
  decideBlock('<!-- DAILYTODO:FREEZE -->\n' + ai, { frozen: true }),
  { state: BlockState.Frozen, action: BlockAction.Skip },
);
assert.deepEqual(decideBlock('', { frozen: true }), { state: BlockState.Frozen, action: BlockAction.Skip });

// 6. 强制重生成绕过 skip（但不绕过 Frozen）
assert.equal(decideBlock(edited, { force: true }).action, BlockAction.Overwrite);
assert.equal(decideBlock('', { frozen: true, force: true }).action, BlockAction.Skip);

console.log('Scan decision verification passed');
