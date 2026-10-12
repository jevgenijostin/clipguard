import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { expect, it, vi } from 'vitest';

it('captures selected and custom text, ignores synthetic events, and renders a dismissible warning', async () => {
  const dom = new JSDOM('<textarea>copied text</textarea>', { runScripts: 'outside-only' });
  const { window } = dom;
  const handlers = {};
  const windowListen = window.addEventListener.bind(window);
  window.addEventListener = (name, handler, ...rest) => {
    handlers[name] = handler;
    windowListen(name, handler, ...rest);
  };
  const documentListen = window.document.addEventListener.bind(window.document);
  window.document.addEventListener = (name, handler, ...rest) => {
    handlers[name] = handler;
    documentListen(name, handler, ...rest);
  };
  let shadow;
  const attach = window.Element.prototype.attachShadow;
  window.Element.prototype.attachShadow = function (options) {
    shadow = attach.call(this, options);
    return shadow;
  };
  const sendMessage = vi.fn(async message => ({ mismatch: message.kind === 'paste' }));
  window.chrome = { runtime: { sendMessage } };
  window.eval(readFileSync(new URL('../extension/content.js', import.meta.url), 'utf8'));
  const input = window.document.querySelector('textarea');
  input.setSelectionRange(0, 6);
  const event = { isTrusted: true, composedPath: () => [input], clipboardData: { types: [], getData: () => '' } };
  handlers.copy(event);
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(sendMessage).toHaveBeenLastCalledWith({ source: 'clipguard', kind: 'copy', value: 'copied' });
  handlers.cut({ ...event, defaultPrevented: true, clipboardData: { types: ['text/plain'], getData: () => 'custom' } });
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(sendMessage).toHaveBeenLastCalledWith({ source: 'clipguard', kind: 'copy', value: 'custom' });
  handlers.copy({ ...event, defaultPrevented: true });
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(sendMessage).toHaveBeenLastCalledWith({ source: 'clipguard', kind: 'copy', value: null });
  const calls = sendMessage.mock.calls.length;
  handlers.copy({ ...event, isTrusted: false });
  handlers.paste({ ...event, isTrusted: false });
  await Promise.resolve();
  expect(sendMessage).toHaveBeenCalledTimes(calls);
  handlers.paste({ ...event, clipboardData: { types: ['text/plain'], getData: () => '<script>secret</script>' } });
  await Promise.resolve();
  expect(shadow.querySelector('[role="alert"]').textContent).toContain('pasted text differs');
  expect(shadow.textContent).not.toContain('secret');
  const host = shadow.host;
  expect(host.isConnected).toBe(true);
  shadow.querySelector('button').click();
  expect(host.isConnected).toBe(false);
  dom.window.close();
});
