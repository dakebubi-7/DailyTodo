import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const probeSourcePath = resolve(process.cwd(), 'native/direct-composition-probe/direct-composition-probe.cpp');

describe('DirectComposition native glass probe source', () => {
  it('hosts a native caption-drag window with a DirectComposition visual tree', () => {
    expect(existsSync(probeSourcePath)).toBe(true);

    const source = readFileSync(probeSourcePath, 'utf8');
    expect(source).toContain('DCompositionCreateDevice');
    expect(source).toContain('WM_NCHITTEST');
    expect(source).toContain('HTCLIENT : HTCAPTION');
  });

  it('uses the Windows Acrylic policy without Electron or CSS backdrop filters', () => {
    const source = readFileSync(probeSourcePath, 'utf8');
    expect(source).toContain('SetWindowCompositionAttribute');
    expect(source).toContain('ACCENT_ENABLE_ACRYLICBLURBEHIND');
    expect(source).not.toContain('BrowserWindow');
    expect(source).not.toContain('backdrop-filter');
  });

  it('can compare the system caption loop with a direct native move loop', () => {
    const source = readFileSync(probeSourcePath, 'utf8');
    expect(source).toContain('--custom-drag');
    expect(source).toContain('SetCapture(hwnd)');
    expect(source).toContain('SetWindowPos(hwnd');
    expect(source).toContain('ReleaseCapture()');
  });

  it('can compare Acrylic with the lighter live BlurBehind material', () => {
    const source = readFileSync(probeSourcePath, 'utf8');
    expect(source).toContain('--blur-behind');
    expect(source).toContain('ACCENT_ENABLE_BLURBEHIND');
    expect(source).toContain('ApplyBackgroundMaterial(hwnd, drag_state.use_blur_behind)');
  });
});
