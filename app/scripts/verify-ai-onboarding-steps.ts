import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const onboardingPath = join(root, 'src', 'components', 'AiOnboarding.tsx');
const stepsPath = join(root, 'src', 'components', 'aiOnboarding', 'AiOnboardingSteps.tsx');

assert(existsSync(stepsPath), 'AI onboarding steps presentation module should exist');

const onboarding = readFileSync(onboardingPath, 'utf8');
const steps = readFileSync(stepsPath, 'utf8');

assert.match(
  onboarding,
  /<AiOnboardingSteps\s+step=\{step\}\s+text=\{text\}\s+draft=\{draft\}\s+onUpdate=\{update\}\s*\/>/s,
  'AI onboarding should delegate step presentation while retaining state and navigation ownership',
);
assert.match(steps, /export function AiOnboardingSteps\(/, 'step presentation module should export AiOnboardingSteps');
assert.match(steps, /step === 1/, 'step presentation module should render the introduction step');
assert.match(steps, /step === 2/, 'step presentation module should render API settings fields');
assert.match(steps, /step === 3/, 'step presentation module should render timer settings');
assert.match(steps, /onUpdate\('baseUrl', event\.target\.value\)/, 'API base URL changes should remain wired through the parent updater');
assert.match(steps, /onUpdate\('apiKey', event\.target\.value\)/, 'API key changes should remain wired through the parent updater');
assert.match(steps, /onUpdate\('model', event\.target\.value\)/, 'model changes should remain wired through the parent updater');
assert.match(steps, /onUpdate\('timerEnabled', event\.target\.checked\)/, 'timer toggle changes should remain wired through the parent updater');
assert.match(steps, /onUpdate\('timerTime', event\.target\.value\)/, 'timer time changes should remain wired through the parent updater');
assert.match(onboarding, /const finish = \(\) => onComplete\(dismissOnboarding\(/, 'parent should retain completion policy');
assert.match(onboarding, /const skip = \(\) => onComplete\(dismissOnboarding\(/, 'parent should retain skip policy');

console.log('AI onboarding step presentation verification passed.');
