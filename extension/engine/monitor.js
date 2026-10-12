export const COPY_WINDOW_MS = 120_000;

export class ClipboardMonitor {
  constructor({ windowMs = COPY_WINDOW_MS } = {}) {
    if (!Number.isFinite(windowMs) || windowMs <= 0) throw new RangeError('windowMs must be positive and finite');
    this.windowMs = windowMs;
    this.latest = null;
  }
  clear() { this.latest = null; }
  expire(timestamp) {
    if (!Number.isFinite(timestamp)) throw new TypeError('A finite timestamp is required');
    if (this.latest && (timestamp < this.latest.timestamp || timestamp - this.latest.timestamp >= this.windowMs)) this.latest = null;
  }
  copy(value, timestamp) {
    this.expire(timestamp);
    // Every copy supersedes the global clipboard, even unrelated/invalid text.
    this.clear();
    if (typeof value === 'string') this.latest = { value, timestamp };
    return this.latest;
  }
  paste(value, timestamp) {
    this.expire(timestamp);
    const copied = this.latest;
    if (typeof value !== 'string' || !copied || copied.value === value) return null;
    return {
      copied: copied.value, pasted: value, timestamp,
    };
  }
}
