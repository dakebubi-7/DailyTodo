import assert from 'node:assert/strict';
import { nextWidgetDesktopState } from '../shared/widgetDesktopState';

// enter / blur always settle to idle (pinned to desktop, sent to bottom)
assert.equal(nextWidgetDesktopState('idle', 'enter'), 'idle');
assert.equal(nextWidgetDesktopState('active', 'enter'), 'idle');
assert.equal(nextWidgetDesktopState('idle', 'widget-blur'), 'idle');
assert.equal(nextWidgetDesktopState('active', 'widget-blur'), 'idle');

// focusing the widget raises it so the user can type / tap tasks
assert.equal(nextWidgetDesktopState('idle', 'widget-focus'), 'active');
assert.equal(nextWidgetDesktopState('active', 'widget-focus'), 'active');

console.log('widget-desktop-state verification passed');
