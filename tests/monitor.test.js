import { describe, expect, it } from 'vitest';
import { ClipboardMonitor, COPY_WINDOW_MS } from '../extension/engine/monitor.js';

describe('ClipboardMonitor', () => {
  it.each([
    ['ordinary text', 'replaced text'],
    ['https://example.org', 'https://evil.example'],
    ['DE89 3704 0044 0532 0130 00', 'different bank account'],
    ['1BoatSLRHtKNngkdXEeobR76b53LETtpyT', 'not an address'],
    ['秘密 😀', '秘密 😈'],
    ['a\nb', 'a\r\nb'], [' text ', 'text'], ['', 'injected'], ['copied', ''],
  ])('detects exact-text changes: %j → %j', (copied, pasted) => {
    const monitor = new ClipboardMonitor();
    monitor.copy(copied, 100);
    expect(monitor.paste(pasted, 101)).toEqual({ copied, pasted, timestamp: 101 });
  });
  it('ignores matching pastes and pastes without a copy', () => {
    const monitor = new ClipboardMonitor();
    expect(monitor.paste('hello', 0)).toBeNull();
    monitor.copy('hello', 1);
    expect(monitor.paste('hello', 2)).toBeNull();
  });
  it('uses the latest copy across repeated pastes', () => {
    const monitor = new ClipboardMonitor();
    monitor.copy('old', 0);
    monitor.copy('new', 1);
    expect(monitor.paste('new', 2)).toBeNull();
    expect(monitor.paste('old', 3)?.copied).toBe('new');
    expect(monitor.paste('other', 4)?.copied).toBe('new');
  });
  it('expires at the exact window boundary', () => {
    const monitor = new ClipboardMonitor();
    monitor.copy('a', 10);
    expect(monitor.paste('b', 10 + COPY_WINDOW_MS - 1)).not.toBeNull();
    expect(monitor.paste('b', 10 + COPY_WINDOW_MS)).toBeNull();
    expect(monitor.latest).toBeNull();
  });
  it('supports a custom window and clears on clock rollback', () => {
    const monitor = new ClipboardMonitor({ windowMs: 10 });
    monitor.copy('a', 100);
    expect(monitor.paste('b', 99)).toBeNull();
    monitor.copy('a', 100);
    expect(monitor.paste('b', 110)).toBeNull();
  });
  it('clears explicitly and for an unobservable copy', () => {
    const monitor = new ClipboardMonitor();
    monitor.copy('a', 0);
    monitor.clear();
    expect(monitor.paste('b', 1)).toBeNull();
    monitor.copy('a', 2);
    monitor.copy(null, 3);
    expect(monitor.paste('b', 4)).toBeNull();
  });
  it('ignores non-text pastes', () => {
    const monitor = new ClipboardMonitor();
    monitor.copy('a', 0);
    expect(monitor.paste(null, 1)).toBeNull();
    expect(monitor.paste('b', 2)).not.toBeNull();
  });
  it.each([0, -1, Infinity, NaN])('rejects invalid window %s', windowMs => {
    expect(() => new ClipboardMonitor({ windowMs })).toThrow(RangeError);
  });
  it.each([NaN, Infinity, undefined])('requires finite timestamps: %s', timestamp => {
    const monitor = new ClipboardMonitor();
    expect(() => monitor.copy('a', timestamp)).toThrow(TypeError);
    expect(() => monitor.paste('b', timestamp)).toThrow(TypeError);
  });
});
