import { strict as assert } from 'node:assert';
import { applyOverrides, resetToDefault } from '../shared/aiReview/sectionOverrides';
import { createDefaultSections, SectionType } from '../shared/aiReview/sectionConfig';

const base = createDefaultSections();

// 部分覆盖：只改 REVIEW 的 title，其它字段与其它段保持预设
const merged = applyOverrides(base, [{ markerKey: 'REVIEW', title: '我的复盘' }]);
const review = merged.find((s) => s.markerKey === 'REVIEW')!;
assert.equal(review.title, '我的复盘', 'override title applied');
assert.equal(review.prompt, base[0].prompt, '未改字段跟随预设');
const tomorrow = merged.find((s) => s.markerKey === 'TOMORROW')!;
assert.equal(tomorrow.title, base[1].title, '未覆盖段保持预设');

// 预设升级：base 改了 prompt，用户只覆盖了 title → 新 prompt 自动跟随
const upgraded = base.map((s) => (s.markerKey === 'REVIEW' ? { ...s, prompt: '升级后的 prompt' } : s));
const afterUpgrade = applyOverrides(upgraded, [{ markerKey: 'REVIEW', title: '我的复盘' }]);
const r2 = afterUpgrade.find((s) => s.markerKey === 'REVIEW')!;
assert.equal(r2.title, '我的复盘', '用户改动保留');
assert.equal(r2.prompt, '升级后的 prompt', '未改字段跟随预设升级');

// type 覆盖
const typeOv = applyOverrides(base, [{ markerKey: 'REVIEW', type: SectionType.Deterministic }]);
assert.equal(typeOv.find((s) => s.markerKey === 'REVIEW')!.type, SectionType.Deterministic);

// 恢复默认 = 清空 override
const reset = resetToDefault();
assert.equal(reset.find((s) => s.markerKey === 'REVIEW')!.title, base[0].title, 'reset 回到预设');

console.log('Section overrides verification passed');
