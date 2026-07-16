import assert from 'node:assert/strict';
import { createDesktopWindowHost } from './desktopWindowHost';

const handle = Buffer.from([1]);
let attached = false;
let attachCalls = 0;
let detachCalls = 0;
const host = createDesktopWindowHost({
  diag: () => undefined,
  getWin32: () => ({
    attachToDesktop: () => {
      attachCalls += 1;
      attached = true;
      return true;
    },
    detachFromDesktop: () => {
      detachCalls += 1;
      attached = false;
    },
    isAttachedToDesktop: () => attached,
  }),
});
const win = {
  isDestroyed: () => false,
  getNativeWindowHandle: () => handle,
};

assert.equal(host.attach(win), true, 'desktop host should attach a detached window');
assert.equal(attachCalls, 1, 'initial attach should call the native bridge once');
assert.equal(host.attach(win), true, 'desktop host should accept an already attached window');
assert.equal(attachCalls, 1, 'already attached windows must not be reparented');

attached = false;
assert.equal(host.ensureAttached(win), true, 'desktop host should recover after Explorer replaces its host');
assert.equal(attachCalls, 2, 'recovery should reattach exactly once');

host.detach(win);
assert.equal(detachCalls, 1, 'leaving desktop mode should detach the window from Explorer');

console.log('desktopWindowHost.verify: all assertions passed');
