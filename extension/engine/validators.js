import { sha256 } from '@noble/hashes/sha2.js';
import { keccak_256 } from '@noble/hashes/sha3.js';

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BECH32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const result = (type, format, looksLike, valid, checksum = 'invalid') =>
  ({ type, format, looksLike, valid, checksum: !looksLike ? 'none' : checksum });

export function validateBitcoin(value) {
  if (typeof value !== 'string') return result('BTC', null, false, false);
  if (/^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(value)) {
    let number = 0n;
    for (const char of value) number = number * 58n + BigInt(BASE58.indexOf(char));
    const bytes = [];
    while (number) { bytes.unshift(Number(number & 255n)); number >>= 8n; }
    for (const char of value) { if (char !== '1') break; bytes.unshift(0); }
    const body = Uint8Array.from(bytes.slice(0, 21));
    const digest = sha256(sha256(body));
    const valid = bytes.length === 25 && [0, 5].includes(bytes[0]) &&
      bytes.slice(21).every((byte, index) => byte === digest[index]);
    return result('BTC', value[0] === '1' ? 'P2PKH' : 'P2SH', true, valid, valid ? 'valid' : 'invalid');
  }
  const lower = value.toLowerCase();
  const shaped = /^bc1q[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/.test(lower) && [42, 62].includes(value.length);
  if (!shaped) return result('BTC', null, false, false);
  const data = [...lower.slice(3)].map(char => BECH32.indexOf(char));
  // BIP-173 HRP expansion for mainnet "bc".
  let check = 1;
  const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  for (const value of [3, 3, 0, 2, 3, ...data]) {
    const top = check >>> 25;
    check = ((check & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i++) if ((top >>> i) & 1) check ^= generators[i];
  }
  let accumulator = 0, bits = 0;
  const program = [];
  for (const word of data.slice(1, -6)) {
    accumulator = ((accumulator << 5) | word) & 0xfff;
    bits += 5;
    if (bits >= 8) { bits -= 8; program.push((accumulator >>> bits) & 255); }
  }
  const valid = (value === lower || value === value.toUpperCase()) && check === 1 &&
    data[0] === 0 && [20, 32].includes(program.length) && bits < 5 &&
    ((accumulator << (8 - bits)) & 255) === 0;
  return result('BTC', value.length === 42 ? 'P2WPKH' : 'P2WSH', true, valid, valid ? 'valid' : 'invalid');
}

export function validateEthereum(value) {
  const shaped = typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value);
  if (!shaped) return result('ETH', 'hex', false, false);
  const body = value.slice(2), lower = body.toLowerCase();
  const hash = [...keccak_256(new TextEncoder().encode(lower))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const expected = [...lower].map((char, i) => parseInt(hash[i], 16) >= 8 ? char.toUpperCase() : char).join('');
  const checksumValid = body === expected;
  const uniform = body === lower || body === body.toUpperCase();
  return result('ETH', 'hex', true, checksumValid || uniform, checksumValid ? 'valid' : uniform ? 'absent' : 'invalid');
}

export function detectAddress(value) {
  return [validateBitcoin(value), validateEthereum(value)].find(item => item.looksLike) ?? null;
}
