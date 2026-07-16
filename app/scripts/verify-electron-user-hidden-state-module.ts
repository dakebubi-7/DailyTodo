import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'userHiddenState.ts');
const mainPath = join(root, 'electron', 'main.ts');
const shellControllerPath = join(root, 'electron', 'mainShellController.ts');
const bootstrapPath = join(root, 'electron', 'mainWindowBootstrap.ts');
const bootstrapTypesPath = join(root, 'electron', 'mainWindowBootstrapTypes.ts');
const eventsPath = join(root, 'electron', 'mainWindowEvents.ts');
const desktopWindowModePath = join(root, 'electron', 'desktopWindowMode.ts');
const desktopWidgetStateApplierPath = join(root, 'electron', 'desktopWidgetStateApplier.ts');
const desktopVerifierPath = join(root, 'scripts', 'verify-electron-desktop-window-mode-module.ts');
const shellVerifierPath = join(root, 'scripts', 'verify-electron-main-shell-controller-module.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron user-hidden state module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const shellController = readFileSync(shellControllerPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const bootstrapTypes = readFileSync(bootstrapTypesPath, 'utf8');
const events = readFileSync(eventsPath, 'utf8');
const desktopWindowMode = readFileSync(desktopWindowModePath, 'utf8');
const desktopWidgetStateApplier = readFileSync(desktopWidgetStateApplierPath, 'utf8');
const desktopVerifier = readFileSync(desktopVerifierPath, 'utf8');
const shellVerifier = readFileSync(shellVerifierPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export type UserHiddenState\b/, 'userHiddenState should export the shared UserHiddenState type.');
assert.match(helper, /export function createUserHiddenState\b/, 'userHiddenState should export createUserHiddenState.');
assert.match(helper, /let hidden = false;/, 'userHiddenState should own the user-hidden truth source.');
assert.match(helper, /isHidden:\s*\(\)\s*=>\s*hidden/, 'userHiddenState should expose hidden-state reads.');
assert.match(helper, /setHidden:\s*\(nextHidden\)\s*=>\s*\{\s*hidden = nextHidden;\s*\}/, 'userHiddenState should expose hidden-state writes.');

assert.match(main, /from '\.\/userHiddenState'/, 'main should import user-hidden state helpers.');
assert.match(main, /const userHidden = createUserHiddenState\(\)/, 'main should create the shared user-hidden state helper.');
assert.doesNotMatch(main, /let userHidden = false;/, 'main should not own userHidden as a bare boolean after extraction.');
assert.doesNotMatch(main, /getUserHidden:\s*\(\)\s*=>\s*userHidden/, 'main should not pass ad hoc userHidden getter callbacks after extraction.');
assert.doesNotMatch(main, /setUserHidden:\s*\(hidden\)\s*=>\s*\{\s*userHidden = hidden;\s*\}/, 'main should not pass ad hoc userHidden setter callbacks after extraction.');
assert.match(main, /userHidden,/, 'main should pass the shared userHidden state object through composition boundaries.');

assert.match(shellController, /from '\.\/userHiddenState'/, 'mainShellController should import the shared UserHiddenState type.');
assert.match(shellController, /userHidden:\s*Pick<UserHiddenState,\s*'setHidden'>;/, 'mainShellController should depend only on user-hidden writes.');
assert.match(shellController, /userHidden\.setHidden\(false\)/, 'mainShellController should clear user-hidden state when showing the main window.');
assert.match(shellController, /userHidden\.setHidden\(true\)/, 'mainShellController should set user-hidden state when hiding the main window.');
assert.doesNotMatch(shellController, /setUserHidden\(/, 'mainShellController should not use a bespoke setUserHidden callback after extraction.');

assert.match(bootstrapTypes, /from '\.\/userHiddenState'/, 'mainWindowBootstrapTypes should import the shared UserHiddenState type.');
assert.match(bootstrapTypes, /userHidden:\s*Pick<UserHiddenState,\s*'isHidden'>;/, 'mainWindowBootstrapTypes should depend only on user-hidden reads.');
assert.match(bootstrap, /from '\.\/mainWindowBootstrapTypes'/, 'mainWindowBootstrap should depend on its focused dependency contract.');
assert.match(bootstrap, /userHidden,\s*\n\s*getWindowMode/, 'mainWindowBootstrap should forward userHidden into main-window events.');
assert.doesNotMatch(bootstrap, /getUserHidden:\s*\(\)\s*=>/, 'mainWindowBootstrap should not require a separate user-hidden getter callback after extraction.');

assert.match(events, /from '\.\/userHiddenState'/, 'mainWindowEvents should import the shared UserHiddenState type.');
assert.match(events, /userHidden:\s*Pick<UserHiddenState,\s*'isHidden'>;/, 'mainWindowEvents should depend on the shared user-hidden read surface.');
assert.match(events, /userHidden=\$\{userHidden\.isHidden\(\)\}/, 'mainWindowEvents diagnostics should read from the shared user-hidden state.');
assert.match(events, /userHidden\.isHidden\(\)\) return;/, 'mainWindowEvents should preserve the user-hidden desktop-guard skip.');
assert.doesNotMatch(events, /getUserHidden\(\)/, 'mainWindowEvents should not keep the old getUserHidden callback.');

assert.match(desktopWindowMode, /from '\.\/userHiddenState'/, 'desktopWindowMode should import the shared UserHiddenState type.');
assert.match(desktopWindowMode, /userHidden:\s*Pick<UserHiddenState,\s*'isHidden'>;/, 'desktopWindowMode should depend on the shared user-hidden read surface.');
assert.match(desktopWindowMode, /createDesktopWidgetStateApplier\(\{ diag, getWindowMode, userHidden, getWin32 \}\)/, 'desktopWindowMode should pass user-hidden state into the focused desktop state applier.');
assert.match(desktopWidgetStateApplier, /from '\.\/userHiddenState'/, 'desktopWidgetStateApplier should import the shared UserHiddenState type.');
assert.match(desktopWidgetStateApplier, /!userHidden\.isHidden\(\) && !win\.isVisible\(\)/, 'desktopWidgetStateApplier should preserve hidden-state guarded showInactive behavior.');
assert.doesNotMatch(desktopWindowMode, /getUserHidden\(\)/, 'desktopWindowMode should not keep the old getUserHidden callback.');

assert.match(desktopVerifier, /userHidden\\\.isHidden/, 'desktop-window-mode verifier should follow the shared userHidden state boundary.');
assert.match(shellVerifier, /userHidden\\\.setHidden/, 'main-shell verifier should follow the shared userHidden state boundary.');

assert.equal(
  scripts['verify:electron-user-hidden-state-module'],
  'tsx scripts/verify-electron-user-hidden-state-module.ts',
  'package.json should expose the focused user-hidden state verifier.',
);
assertCleanupCoreIncludes('verify:electron-user-hidden-state-module', 'cleanup-core should include the focused user-hidden state verifier.');

console.log('electron user-hidden state module verification passed');
