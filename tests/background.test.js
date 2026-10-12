import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('shares and serializes copy state across tabs, restores it after restart, and expires it', async () => {
  let listener;
  let alarmListener;
  let state = {};
  let now = 1000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  vi.stubGlobal('chrome', {
    storage: { session: {
      get: vi.fn(async () => structuredClone(state)),
      set: vi.fn(async value => { state = structuredClone(value); }),
      remove: vi.fn(async () => { state = {}; }),
    } },
    alarms: { create: vi.fn(async () => {}), onAlarm: { addListener: fn => { alarmListener = fn; } } },
    runtime: { onMessage: { addListener: fn => { listener = fn; } } },
  });
  const send = (kind, value, tab = 1) => new Promise(resolve => {
    listener({ source: 'clipguard', kind, value }, { tab: { id: tab } }, resolve);
  });
  await import('../extension/background.js');
  const results = await Promise.all([send('copy', 'old'), send('copy', 'latest', 2), send('paste', 'old', 3)]);
  expect(results[2]).toEqual({ mismatch: true });
  expect(await send('paste', 'latest', 3)).toEqual({ mismatch: false });
  vi.resetModules();
  await import('../extension/background.js');
  expect(await send('paste', 'changed', 4)).toEqual({ mismatch: true });
  now += 120000;
  alarmListener({ name: 'expire-copy' });
  expect(await send('paste', 'changed')).toEqual({ mismatch: false });
  expect(state).toEqual({});
  await send('copy', 'a');
  await send('copy', null);
  expect(await send('paste', 'b')).toEqual({ mismatch: false });
});
