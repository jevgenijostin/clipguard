import { detectAddress } from './validators.js';

export const COPY_WINDOW_MS = 120_000;

export class ClipboardMonitor {
  constructor({ windowMs = COPY_WINDOW_MS } = {}) {
    if (!Number.isFinite(windowMs) || windowMs <= 0) throw new RangeError('windowMs must be positive and finite');
    this.windowMs = windowMs;
    this.lastByType = new Map();
    this.latest = null;
  }
  clear() { this.lastByType.clear(); this.latest = null; }
  expire(timestamp) {
    if (!Number.isFinite(timestamp)) throw new TypeError('A finite timestamp is required');
    for (const [type, event] of this.lastByType) {
      if (timestamp < event.timestamp || timestamp - event.timestamp >= this.windowMs) this.lastByType.delete(type);
    }
    if (this.latest && (timestamp < this.latest.timestamp || timestamp - this.latest.timestamp >= this.windowMs)) this.latest = null;
  }
  copy(value, timestamp) {
    this.expire(timestamp);
    // Every copy supersedes the global clipboard, even unrelated/invalid text.
    this.clear();
    const address = detectAddress(value);
    if (address?.valid) {
      const event = { value, timestamp, address };
      this.latest = event;
      this.lastByType.set(address.type, event);
    }
    return address;
  }
  paste(value, timestamp) {
    this.expire(timestamp);
    const address = detectAddress(value);
    if (!address) return null;
    const copied = this.lastByType.get(address.type);
    if (!copied || copied !== this.latest || copied.value === value) return null;
    return {
      type: address.type, copied: copied.value, pasted: value, timestamp,
      confidence: copied.address.checksum === 'valid' && address.checksum === 'valid' ? 'high' : 'medium',
      pastedChecksum: address.checksum,
    };
  }
}
