# ClipGuard store submission

Privacy policy: https://jevgenijostin.github.io/clipguard/store/privacy-policy.html

## Ready-to-upload files

- Chrome Web Store and Edge Add-ons: `dist/clipguard-extension.zip`.
- Firefox Add-ons (AMO): `dist/clipguard-firefox.zip` (Firefox desktop 140+).
- Store icon: `extension/icons/icon-128.png`.
- Screenshot: `demo/screenshot.png` (1280 × 800, 16:10).
- Chrome small promotional tile: `store/promo-440x280.png` (440 × 280).
- Support/homepage: https://github.com/jevgenijostin/clipguard
- Contact: https://github.com/jevgenijostin/clipguard/issues

The ZIP files are already generated locally. For future versions, `npm run package`
recreates both using only Node built-ins; no runtime build or dependencies are needed.
The Chrome/Edge archive contains exactly `extension/` contents with `manifest.json`
at its root. The Firefox archive changes only the manifest: it runs the same background
module as an event page and adds a stable Gecko ID, minimum version and explicit
`data_collection_permissions: { required: ["none"] }`. Keep that ID for later releases.
No detection code is transformed or bundled. AMO's uploaded ZIP contains readable sources;
there is no minification or additional source build to reproduce.
Run `npm run lint:firefox` after packaging to validate the AMO ZIP with Mozilla's
add-ons linter. Lint validation does not replace a Firefox runtime smoke test.

## Name

ClipGuard

## Summary (Chrome: at most 132 characters)

Warns when pasted text differs from a recent copy. Free, local clipboard protection with no accounts or tracking.

## Detailed description

A copied wallet address, bank account number or link can be replaced before you paste
it. ClipGuard helps you notice that mismatch before you use the pasted text.

ClipGuard compares pasted plain text with the most recent copy or cut it observed on
a supported webpage within two minutes. It checks any text, including crypto addresses,
IBANs, links and ordinary messages, using exact comparison rather than format rules.
A mismatch shows a dismissible warning in the page. The paste is not blocked or changed.

There is no popup or toolbar interface to manage. ClipGuard works quietly on HTTP and
HTTPS pages, sharing the latest observed copy across tabs and frames. Its warning
does not display the copied or pasted text.

Free and private: no accounts, tracking, telemetry or network calls. All comparisons
happen locally. The latest observed copy and timestamp are temporarily kept in browser
session storage. Expired copies are never used after two minutes; an alarm cleans them
up, though browser scheduling can delay deletion. Session data clears on browser exit.

Limitations: ClipGuard cannot see every system clipboard change. Copies from desktop
apps, browser controls, restricted pages such as extension stores, and JavaScript
Clipboard API calls are not observed. Without a recent observed copy, it cannot check
a paste. A legitimate unobserved copy or a whitespace/line-ending change may trigger
a warning. Only plain text is compared, not images, files or formatting. Some editors
and page scripts can interfere with event observation or hide the warning. It checks
the paste event text, not later edits made by the page. A warning indicates a mismatch,
not proof of malware. ClipGuard does not remove malware or guarantee clipboard safety.

## Categories

- Chrome: Productivity (Tools subcategory if offered).
- Firefox: Privacy & Security.
- Edge: Productivity.

## Form answers and reviewer notes

Single purpose: warn about a plain-text mismatch between a recent observed copy/cut
and a paste, helping users check potentially changed clipboard text.

No user data is collected or transmitted. Text is processed temporarily on-device as
described in the privacy policy. No remote code, account, login or payment is required.
For permission justifications: `storage` shares the temporary baseline across tabs;
`alarms` cleans up expired baselines; HTTP/HTTPS content-script access observes copy,
cut and paste events and displays warnings across websites and eligible frames.
There is no `clipboardRead` permission or continuous system-clipboard polling.

Reviewer test: on a normal HTTP(S) page, copy selected text and paste it into an input
(no warning). Copy different text in a desktop editor, then paste into the page within
two minutes (warning). Dismiss the warning. Copy on the webpage again, wait over two
minutes, and paste different text (no stale-copy warning). Grant website access when
prompted, and reload tabs opened before installation. No popup is expected.

The screenshot is an explicitly labeled demonstration page with example links.
Its warning markup, text and CSS are extracted verbatim from `extension/content.js`.
Regenerate assets with `npm run icons` and `npm run screenshot` (the latter requires
`npm ci` and `npx playwright install chromium`). The demo itself is self-contained HTML.

## Store differences and owner actions

- **Chrome:** register using the owner's Google account and pay the $5 one-time developer
  registration fee using the owner's payment method; complete account verification and
  the dashboard's privacy declarations. Upload the Chrome/Edge ZIP and assets above.
  [Registration](https://developer.chrome.com/docs/webstore/register/),
  [fee](https://blog.chromium.org/2020/03/new-developer-dashboard-and.html),
  [listing images](https://developer.chrome.com/docs/webstore/images).
- **Firefox AMO:** submission/signing is free, with no listing fee. Upload the Firefox
  ZIP and choose distribution on AMO. Automated validation/signing can make publication
  quicker, but review times vary; do not assume it will always beat Chrome. Select
  desktop Firefox compatibility (Android has not been validated). Declare no data
  collection. [Submission guide](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/),
  [signing/review](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/),
  [Firefox background compatibility](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background),
  [data declaration](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/).
- **Edge:** use the same ZIP as Chrome. Complete the owner account and listing in
  Microsoft Partner Center; the listing and review are separate from Chrome.
  [Publishing guide](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension).

Store approval and review timing are controlled by each store. These files prepare a
submission; they do not indicate that ClipGuard has already been reviewed or published.
