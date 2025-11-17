import { sha256 } from 'js-sha256';
import { Buffer } from 'buffer';

// Single clean HMAC util implementation (no duplicates)
export async function generateHmac(payload, secret) {
  if (!window?.crypto?.subtle) {
    throw new Error("Web Crypto API not available");
  }
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const algo = { name: "HMAC", hash: { name: "SHA-256" } };

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyData,
    algo,
    false,
    ["sign"]
  );

  const sig = await window.crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    enc.encode(payload)
  );

  return arrayBufferToBase64(sig);
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function generateHmacSync(jsonString, secretKey) {
  const concatenatedString = jsonString + secretKey;
  const hash = sha256.create();
  hash.update(concatenatedString);
  const hmac = Buffer.from(hash.array()).toString('base64');
  return hmac;
}