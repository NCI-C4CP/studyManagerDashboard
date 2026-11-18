import { encryptString, decryptString } from '../src/crypto.js';
import { Buffer } from 'node:buffer';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  installFirebaseStub,
} from './helpers.js';

describe('crypto', () => {
  beforeEach(() => {
    setupTestEnvironment();
    installFirebaseStub({ uid: 'test-user-123' });
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('encryptString', () => {
    it('encrypts a plaintext string and returns formatted payload', async () => {
      const plainText = 'sensitive-data-123';
      const payload = await encryptString(plainText, 'test-user-123');

      expect(payload).toBeTypeOf('string');
      expect(payload).toMatch(/^v1:/);
      expect(payload.split(':')).toHaveLength(3);
    });

    it('produces different ciphertext for same plaintext (nonce uniqueness)', async () => {
      const plainText = 'same-text';
      const payload1 = await encryptString(plainText, 'test-user-123');
      const payload2 = await encryptString(plainText, 'test-user-123');

      // Same plaintext, same UID, but different IVs should produce different payloads
      expect(payload1).not.toBe(payload2);

      // But both should decrypt to the same plaintext
      const decrypted1 = await decryptString(payload1, 'test-user-123');
      const decrypted2 = await decryptString(payload2, 'test-user-123');
      expect(decrypted1).toBe(plainText);
      expect(decrypted2).toBe(plainText);
    });

    it('encrypts various string types (empty, special chars, unicode, JSON)', async () => {
      const testCases = [
        '',
        '!@#$%^&*()_+-=[]{}|;:,.<>?',
        'Hello 世界 🌍 Привет',
        JSON.stringify({ key: 'value', nested: { array: [1, 2, 3] } }),
      ];

      for (const plainText of testCases) {
        const payload = await encryptString(plainText, 'test-user-123');
        const decrypted = await decryptString(payload, 'test-user-123');
        if (plainText.startsWith('{')) {
          expect(JSON.parse(decrypted)).toEqual(JSON.parse(plainText));
        } else {
          expect(decrypted).toBe(plainText);
        }
      }
    });

    it('throws error when UID is missing or empty', async () => {
      await expect(encryptString('test', null)).rejects.toThrow('uid is required');
      await expect(encryptString('test', '')).rejects.toThrow('uid is required');
    });
  });

  describe('decryptString', () => {
    it('throws error for empty or null payload', async () => {
      await expect(decryptString('', 'test-user-123'))
        .rejects.toThrow('empty payload');
      await expect(decryptString(null, 'test-user-123'))
        .rejects.toThrow('empty payload');
    });

    it('throws error for malformed payload', async () => {
      await expect(decryptString('not-a-valid-payload', 'test-user-123'))
        .rejects.toThrow('malformed payload');
      await expect(decryptString('v1:only-one-part', 'test-user-123'))
        .rejects.toThrow('malformed payload');
    });

    it('throws error for unsupported version', async () => {
      await expect(decryptString('v2:iv:ciphertext', 'test-user-123'))
        .rejects.toThrow('unsupported version');
    });

    it('throws error for tampered data (IV or ciphertext)', async () => {
      const plainText = 'test-data';
      const payload = await encryptString(plainText, 'test-user-123');
      const [version, iv, ciphertext] = payload.split(':');
      const flipFirstBit = (encoded) => {
        const bytes = Buffer.from(encoded, 'base64url');
        bytes[0] ^= 1;
        return bytes.toString('base64url');
      };

      // Keep valid encoding and lengths so rejection checks authentication.
      const tamperedIV = `${version}:${flipFirstBit(iv)}:${ciphertext}`;
      await expect(decryptString(tamperedIV, 'test-user-123'))
        .rejects.toMatchObject({ name: 'OperationError' });

      const tamperedCT = `${version}:${iv}:${flipFirstBit(ciphertext)}`;
      await expect(decryptString(tamperedCT, 'test-user-123'))
        .rejects.toMatchObject({ name: 'OperationError' });
    });

    it('throws error when UID is missing or empty', async () => {
      const payload = await encryptString('test', 'test-user-123');
      await expect(decryptString(payload, null)).rejects.toThrow('uid is required');
      await expect(decryptString(payload, '')).rejects.toThrow('uid is required');
    });
  });

  describe('integration with sessionStorage', () => {
    it('can encrypt and store data that survives sessionStorage round-trip', async () => {
      const plainText = 'data-to-store';
      const uid = 'test-user-123';
      
      const payload = await encryptString(plainText, uid);
      sessionStorage.setItem('testKey', payload);
      
      const retrieved = sessionStorage.getItem('testKey');
      expect(retrieved).toBe(payload);
      
      const decrypted = await decryptString(retrieved, uid);
      expect(decrypted).toBe(plainText);
    });

    it('encrypts JSON data for sessionStorage', async () => {
      const data = { key: 'value', nested: { array: [1, 2, 3] } };
      const plainText = JSON.stringify(data);
      const uid = 'test-user-123';
      
      const payload = await encryptString(plainText, uid);
      sessionStorage.setItem('encryptedData', payload);
      
      const retrieved = sessionStorage.getItem('encryptedData');
      const decrypted = await decryptString(retrieved, uid);
      const parsed = JSON.parse(decrypted);
      
      expect(parsed).toEqual(data);
    });
  });

  describe('security properties', () => {
    it('matches a fixed encryption vector for the v1 payload', async () => {
      const plainText = 'secret-password-123';
      vi.spyOn(crypto, 'getRandomValues').mockImplementation((bytes) => {
        bytes.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        return bytes;
      });

      // Independently computed with Node's hkdfSync/createCipheriv APIs:
      // SHA-256 HKDF, salt "smdb-v1", empty info, AES-256-GCM, 128-bit tag.
      const expected = 'v1:AAECAwQFBgcICQoL:' +
        '-rNjDzNl3zDT2517rstcsVbuBDqB-gddRIitF3Aekj7ogc0';
      await expect(encryptString(plainText, 'test-user-123'))
        .resolves.toBe(expected);
      await expect(decryptString(expected, 'test-user-123'))
        .resolves.toBe(plainText);
    });

    it('key isolation: different UIDs cannot decrypt each other\'s data', async () => {
      const plainText = 'user-specific-data';
      const payload = await encryptString(plainText, 'user-1');
      
      await expect(decryptString(payload, 'user-2'))
        .rejects.toMatchObject({ name: 'OperationError' });
      
      // Should succeed with correct UID
      const decrypted = await decryptString(payload, 'user-1');
      expect(decrypted).toBe(plainText);
    });
  });
});

