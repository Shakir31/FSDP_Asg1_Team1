import { sha256 } from 'js-sha256';
import { Buffer } from 'buffer';

export function generateHmac(jsonString, secretKey) {
  const concatenatedString = jsonString + secretKey;
  const hash = sha256.create();
  hash.update(concatenatedString);
  const hmac = Buffer.from(hash.array()).toString('base64');
  return hmac;
}