import { ClipboardMonitor, COPY_WINDOW_MS } from './engine/monitor.js';

// Session storage survives worker suspension, but is cleared when the browser exits.
// Serialize events so concurrent tabs cannot overwrite a more recent copy.
let pending = Promise.resolve();
async function handle(message) {
  const monitor = new ClipboardMonitor();
  const { recentCopy } = await chrome.storage.session.get('recentCopy');
  if (recentCopy) monitor.copy(recentCopy.value, recentCopy.timestamp);
  const now = Date.now();
  monitor.expire(now);
  let mismatch = false;
  if (message.kind === 'copy') {
    monitor.copy(message.value, now);
  } else {
    mismatch = Boolean(monitor.paste(message.value, now));
  }
  if (monitor.latest) {
    await chrome.storage.session.set({ recentCopy: monitor.latest });
    await chrome.alarms.create('expire-copy', { when: monitor.latest.timestamp + COPY_WINDOW_MS });
  } else {
    await chrome.storage.session.remove('recentCopy');
  }
  return { mismatch };
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (!sender.tab || message?.source !== 'clipguard' ||
      !['copy', 'paste'].includes(message.kind) ||
      !(typeof message.value === 'string' || message.value === null)) return;
  pending = pending.then(() => handle(message));
  pending.then(respond, () => respond({ error: true }));
  pending = pending.catch(() => {});
  return true;
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name !== 'expire-copy') return;
  pending = pending.then(() => handle({ kind: 'paste', value: null })).catch(() => {});
});
