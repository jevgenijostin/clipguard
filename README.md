# ClipGuard

Browser extension (in progress) that watches clipboard copy/paste events and flags when a
copied crypto wallet address (BTC/ETH/etc.) silently changes before paste - the signature
move of clipboard-hijacking "clipper" malware. Pure client-side, no network calls.

**Status: early scaffold, not a working MVP yet.** Work on this stopped mid-build on the
night of 2026-10-10 when the build session went offline; it has not resumed since. What
exists:

- `extension/engine/monitor.js` - clipboard copy/paste event-correlation state machine
  (time-windowed, per-value-type tracking).
- `extension/engine/validators.js` - address format + checksum validators (Bitcoin base58
  checksum implemented; others not yet started).

Not yet done: Ethereum/other-chain validators, the extension manifest/UI, any tests, CI,
and the license-key gating for the paid tier described in the original pitch.

Monetization (planned): free single-chain (BTC) detection, paid unlock for more chains +
team/log export, one-time license key.
