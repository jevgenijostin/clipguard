// Run with Node; no image libraries. Coordinates use a 128-unit design grid.
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { deflateSync } = require('node:zlib');
const { crc32 } = require('./binary');
const output = join(__dirname, '../extension/icons');
mkdirSync(output, { recursive: true });
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  body.copy(result, 4);
  result.writeUInt32BE(crc32(body), result.length - 4);
  return result;
}
function rounded(x, y, left, top, width, height, radius) {
  const dx = Math.max(left + radius - x, 0, x - (left + width - radius));
  const dy = Math.max(top + radius - y, 0, y - (top + height - radius));
  return x >= left && x <= left + width && y >= top && y <= top + height && dx * dx + dy * dy <= radius * radius;
}
function polygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function colorAt(x, y) {
  // Amber clipboard, ivory paper and a dark alert badge: echoes the real warning.
  let color = [0, 0, 0, 0];
  if (rounded(x, y, 18, 16, 84, 104, 12)) color = [117, 35, 0, 255];
  if (rounded(x, y, 24, 22, 72, 92, 7)) color = [255, 180, 84, 255];
  if (rounded(x, y, 32, 32, 56, 74, 3)) color = [255, 249, 237, 255];
  if (rounded(x, y, 42, 8, 36, 28, 7)) color = [117, 35, 0, 255];
  if (rounded(x, y, 51, 15, 18, 9, 3)) color = [255, 180, 84, 255];
  if (rounded(x, y, 41, 48, 36, 6, 3) || rounded(x, y, 41, 62, 24, 6, 3)) color = [117, 35, 0, 255];
  if (polygon(x, y, [[89, 58], [116, 69], [112, 97], [103, 111], [89, 121], [75, 111], [66, 97], [62, 69]])) color = [117, 35, 0, 255];
  if (rounded(x, y, 85, 72, 8, 24, 3) || rounded(x, y, 85, 102, 8, 8, 3)) color = [255, 180, 84, 255];
  return color;
}
for (const size of [16, 48, 128]) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  const samples = 8;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const sum = [0, 0, 0, 0];
    for (let sy = 0; sy < samples; sy++) for (let sx = 0; sx < samples; sx++) {
      const color = colorAt((x + (sx + 0.5) / samples) * 128 / size, (y + (sy + 0.5) / samples) * 128 / size);
      for (let c = 0; c < 3; c++) sum[c] += color[c] * color[3] / 255;
      sum[3] += color[3];
    }
    const offset = y * (1 + size * 4) + 1 + x * 4;
    for (let c = 0; c < 3; c++) raw[offset + c] = sum[3] ? Math.round(sum[c] * 255 / sum[3]) : 0;
    raw[offset + 3] = Math.round(sum[3] / (samples * samples));
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 6;
  writeFileSync(join(output, `icon-${size}.png`), Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]));
  console.log(`Generated icon-${size}.png (${size} x ${size})`);
}
