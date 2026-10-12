# ClipGuard

A free Manifest V3 browser extension that warns when pasted **text of any kind** differs
from the most recent copy or cut observed by the extension within two minutes. This
includes ordinary text, IBANs, wallet addresses, links, and empty strings. Detection
uses exact string comparison, without format recognition or checksum gating.

## Install locally (Chrome / Edge)

1. Clone this repository.
2. Open `chrome://extensions` (or `edge://extensions`) and enable Developer mode.
3. Choose **Load unpacked** and select the repository's `extension` directory.
4. Open or reload the web pages where you want protection.

No build step or runtime dependency installation is required. All detection runs
locally; there are no network requests, accounts, license keys, or paid features.

## What works

- Real copy, cut, and paste DOM events on HTTP(S) pages, including frames.
- Selected text in inputs, textareas, and page selections, plus ordinary custom
  `text/plain` copy handlers that reach the extension's listener.
- A shared latest-copy baseline across observed tabs and frames. Session storage
  survives background worker suspension and clears on browser exit. An alarm removes
  expired text (browser scheduling can delay physical cleanup); expired baselines
  are never used for detection. Clipboard contents are not logged or sent anywhere.
- A dismissible, accessible in-page warning toast when a mismatch is detected.
  It does not display clipboard contents, block paste, or alter the pasted field.

The warning says the clipboard **may** have been changed by something else running
on the machine. It is evidence of a text mismatch, not proof of malware.

## Limits and rough edges

Extensions cannot observe every system clipboard change. Copies from desktop apps,
browser UI, restricted pages (such as extension stores), and JavaScript Clipboard API
calls are not tracked. A paste without a recent observed copy cannot be checked.
An unobserved legitimate copy within the window can produce a false warning.
Whitespace, line-ending, or other legitimate text transformations can also warn.

Only plain text is compared, not images, files, or rich-text formatting. Pages that
stop copy-event propagation, unusual custom editors, or handlers that rewrite the
clipboard after our listener may prevent accurate observation. Paste is checked
from the event's clipboard text, not the final field value after page processing.
The warning appears at the top right of the receiving page/frame; page overlays or
hostile scripts can obscure/remove it. This is a detector, not a malware remover.
Store publishing, automated real-browser coverage, and Firefox validation are not
implemented.

## Development and verification

Use Node.js 24 or newer:

```sh
npm ci
npm test
```

`extension/engine/monitor.js` contains the time-windowed comparison state machine.
`background.js` shares its baseline using extension session storage; `content.js`
collects events and shows warnings. The existing address validators remain unused
utilities; they do not control detection.

Manual smoke test after loading the extension: copy text on a normal webpage, paste
it unchanged (no warning), then copy different text from a desktop editor and paste
it into the webpage within two minutes (warning). Repeat across two browser tabs.
Dismiss the toast, then repeat after waiting two minutes (no stale-copy warning).
Automated tests simulate integration; a manual browser smoke test is still needed.
