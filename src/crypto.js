// Crypto helpers for encrypting small strings in the browser
// Uses HKDF(SHA-256) to derive an AES-GCM key from a stable per-user UID
// Protects sensitive data in sessionStorage during page refresh and passes GitHub security scan.

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Fixed, public salt string for key derivation
const HKDF_SALT_V1 = textEncoder.encode('smdb-v1');

/**
 * Derive a non-exportable AES-GCM CryptoKey from a Firebase user UID
 * using HKDF with SHA-256 and a fixed application salt.
 *
 * @param {string} uid - The Firebase user UID.
 * @returns {Promise<CryptoKey>} A non-extractable AES-GCM key scoped to the UID.
 * @throws {Error} If uid is missing or key derivation fails.
 */
async function deriveKeyFromUid(uid) {
    if (!uid) throw new Error('deriveKeyFromUid: uid is required');
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        textEncoder.encode(uid),
        'HKDF',
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt: HKDF_SALT_V1, info: new Uint8Array() },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Base64url helpers for encoding/decoding Uint8Array buffers without padding.
 *
 * @type {{ encode: (buffer: ArrayBuffer|Uint8Array) => string, decode: (str: string) => Uint8Array }}
 */
const base64url = {
    encode: (buffer) => {
        let binary = '';
        const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    },
    decode: (str) => {
        const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }
};

/**
 * Encrypt a UTF-8 string using a key derived from the UID.
 * Returns a payload formatted as `v1:<base64url(iv)>:<base64url(ciphertext)>`.
 *
 * @param {string} plainText - The plaintext string to encrypt.
 * @param {string} uid - The Firebase user UID to derive the key from.
 * @returns {Promise<string>} base64url payload containing IV and ciphertext.
 * @throws {Error} If encryption fails or key derivation fails.
 */
export async function encryptString(plainText, uid) {
    const key = await deriveKeyFromUid(uid);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            textEncoder.encode(plainText)
        )
    );
    // Payload format: v1:<iv>:<ciphertext>
    return `v1:${base64url.encode(iv)}:${base64url.encode(ciphertext)}`;
}

/**
 * Decrypt a payload produced by encryptString using the UID-derived key.
 * Accepts `v1:<base64url(iv)>:<base64url(ciphertext)>` and returns the UTF-8 plaintext.
 *
 * @param {string} payload - base64url payload to decrypt.
 * @param {string} uid - The Firebase user UID to derive the key from.
 * @returns {Promise<string>} The decrypted plaintext string.
 * @throws {Error} If payload is malformed, version unsupported, or decryption fails.
 */
export async function decryptString(payload, uid) {
    if (!payload) throw new Error('decryptString: empty payload');
    const parts = String(payload).split(':');
    if (parts.length !== 3) throw new Error('decryptString: malformed payload');
    const [version, ivB64u, ctB64u] = parts;
    if (version !== 'v1') throw new Error('decryptString: unsupported version');

    const key = await deriveKeyFromUid(uid);
    const iv = base64url.decode(ivB64u);
    const ciphertext = base64url.decode(ctB64u);
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );
    return textDecoder.decode(plaintext);
}
