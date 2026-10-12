// Deterministic, uncompressed ZIP archives using only Node built-ins.
// Fixed timestamps and sorted paths make repeated builds byte-identical.
const { readFileSync, readdirSync, mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { crc32 } = require('./binary');
const root = join(__dirname, '..');
function files(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1).flatMap(entry => {
    const name = prefix + entry.name;
    if (entry.isDirectory()) return files(join(directory, entry.name), name + '/');
    if (!entry.isFile()) throw new Error(`Unsupported file: ${name}`);
    return [{ name, data: readFileSync(join(directory, entry.name)) }];
  });
}
function zip(entries) {
  const local = [], central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const filename = Buffer.from(name);
    const crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6); header.writeUInt16LE(33, 12);
    header.writeUInt32LE(crc, 14); header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22); header.writeUInt16LE(filename.length, 26);
    local.push(header, filename, data);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50); record.writeUInt16LE(20, 4);
    header.copy(record, 6, 4, 30);
    record.writeUInt32LE(offset, 42);
    central.push(record, filename);
    offset += header.length + filename.length + data.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}
const entries = files(join(root, 'extension'));
const manifest = JSON.parse(entries.find(entry => entry.name === 'manifest.json').data);
if (manifest.manifest_version !== 3) throw new Error('Expected Manifest V3');
for (const icon of Object.values(manifest.icons)) {
  if (!entries.some(entry => entry.name === icon)) throw new Error(`Missing icon: ${icon}`);
}
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/clipguard-extension.zip'), zip(entries));
// Firefox uses an event page with the same ES module, not a service worker.
const firefox = structuredClone(manifest);
firefox.background = { scripts: ['background.js'], type: 'module' };
firefox.browser_specific_settings = { gecko: {
  id: 'clipguard@jevgenijostin.github.io', strict_min_version: '140.0',
  data_collection_permissions: { required: ['none'] },
}, gecko_android: { strict_min_version: '142.0' } };
const firefoxEntries = entries.map(entry => entry.name === 'manifest.json'
  ? { name: entry.name, data: Buffer.from(JSON.stringify(firefox, null, 2) + '\n') } : entry);
writeFileSync(join(root, 'dist/clipguard-firefox.zip'), zip(firefoxEntries));
console.log('Packaged dist/clipguard-extension.zip (Chrome/Edge) and dist/clipguard-firefox.zip (AMO)');
