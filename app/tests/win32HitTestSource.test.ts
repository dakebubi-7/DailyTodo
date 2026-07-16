import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const nativeSource = readFileSync(
  resolve(process.cwd(), 'native/win32-hit-test/win32-hit-test.cpp'),
  'utf8',
);

describe('Win32 hit-test native drag bridge', () => {
  it('can emit a bounded trace for native drag messages during diagnosis', () => {
    expect(nativeSource).toContain('DAILYTODO_HIT_TEST_TRACE');
    expect(nativeSource).toContain('TraceDragMessage(hwnd, message, w_param, l_param);');
  });

  it('starts the native caption move loop from the non-client caption press', () => {
    expect(nativeSource).toContain('message == WM_NCLBUTTONDOWN && w_param == HTCAPTION');
    expect(nativeSource).toContain('return DefWindowProcW(hwnd, message, w_param, l_param);');
  });
});
