(() => {
  let warning;
  function showWarning() {
    warning?.remove();
    warning = document.createElement('div');
    warning.style.cssText = 'all:initial!important;position:fixed!important;top:16px!important;right:16px!important;z-index:2147483647!important;display:block!important;width:min(400px, calc(100vw - 32px))!important;';
    const root = warning.attachShadow({ mode: 'closed' });
    const box = document.createElement('div');
    box.setAttribute('role', 'alert');
    box.style.cssText = 'font:15px/1.5 system-ui,sans-serif;color:#fff;background:#752300;border:2px solid #ffb454;border-radius:8px;padding:16px;box-shadow:0 4px 20px #0006;';
    const text = document.createElement('p');
    text.style.margin = '0 0 12px';
    text.textContent = 'ClipGuard: pasted text differs from your recent copy. Your clipboard may have been changed by something else running on this machine. Check the pasted text before using it.';
    const dismiss = document.createElement('button');
    dismiss.textContent = 'Dismiss';
    dismiss.style.cssText = 'font:inherit;padding:4px 12px;cursor:pointer;color:#111;background:#fff;border:1px solid #aaa;border-radius:4px;';
    dismiss.addEventListener('click', () => warning?.remove());
    box.append(text, dismiss);
    root.append(box);
    (document.body || document.documentElement).append(warning);
  }

  function send(kind, value) {
    chrome.runtime.sendMessage({ source: 'clipguard', kind, value })
      .then(result => { if (kind === 'paste' && result?.mismatch) showWarning(); })
      .catch(() => {}); // Extension reloads invalidate existing content scripts.
  }

  function selectedText(event) {
    const target = event.composedPath()[0];
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      if (target.selectionStart === null) return null;
      return target.value.slice(target.selectionStart, target.selectionEnd);
    }
    const selection = window.getSelection();
    return selection?.rangeCount ? selection.toString() : null;
  }

  function onCopy(event) {
    if (!event.isTrusted) return;
    const selection = selectedText(event);
    // Read after page handlers have had a chance to override the copied text.
    queueMicrotask(() => {
      const data = event.clipboardData;
      const customText = data && Array.from(data.types).includes('text/plain');
      const value = customText ? data.getData('text/plain') : event.defaultPrevented ? null : selection;
      send('copy', value);
    });
  }
  // Capture phase on document, matching the paste listener below, so that
  // common page scripts (paywalls, copy-protection) calling stopPropagation
  // on copy/cut can't silently prevent us from observing the event at all.
  document.addEventListener('copy', onCopy, true);
  document.addEventListener('cut', onCopy, true);
  document.addEventListener('paste', event => {
    if (!event.isTrusted) return;
    const data = event.clipboardData;
    if (data && Array.from(data.types).includes('text/plain')) send('paste', data.getData('text/plain'));
  }, true);
})();
