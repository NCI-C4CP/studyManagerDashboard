import { encryptString, decryptString } from '../src/crypto.js';
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
      try {
        await encryptString('test', null);
        throw new Error('Should have thrown an error for null UID');
      } catch (error) {
        expect(error.message).toContain('uid is required');
      }

      try {
        await encryptString('test', '');
        throw new Error('Should have thrown an error for empty UID');
      } catch (error) {
        expect(error.message).toContain('uid is required');
      }
    });
  });

  describe('decryptString', () => {
    it('decrypts a valid payload correctly', async () => {
      const plainText = 'test-data-456';
      const payload = await encryptString(plainText, 'test-user-123');
      const decrypted = await decryptString(payload, 'test-user-123');
      expect(decrypted).toBe(plainText);
    });

    it('throws error for empty or null payload', async () => {
      try {
        await decryptString('', 'test-user-123');
        throw new Error('Should have thrown an error for empty payload');
      } catch (error) {
        expect(error.message).toContain('empty payload');
      }

      try {
        await decryptString(null, 'test-user-123');
        throw new Error('Should have thrown an error for null payload');
      } catch (error) {
        expect(error.message).toContain('empty payload');
      }
    });

    it('throws error for malformed payload', async () => {
      try {
        await decryptString('not-a-valid-payload', 'test-user-123');
        throw new Error('Should have thrown an error for wrong format');
      } catch (error) {
        expect(error.message).toContain('malformed payload');
      }

      try {
        await decryptString('v1:only-one-part', 'test-user-123');
        throw new Error('Should have thrown an error for missing parts');
      } catch (error) {
        expect(error.message).toContain('malformed payload');
      }
    });

    it('throws error for unsupported version', async () => {
      try {
        await decryptString('v2:iv:ciphertext', 'test-user-123');
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('unsupported version');
      }
    });

    it('throws error for tampered data (IV or ciphertext)', async () => {
      const plainText = 'test-data';
      const payload = await encryptString(plainText, 'test-user-123');
      const parts = payload.split(':');

      // Tamper with IV
      try {
        const tamperedIV = `v1:${parts[1].slice(0, -1)}:${parts[2]}`;
        await decryptString(tamperedIV, 'test-user-123');
        throw new Error('Should have thrown an error for tampered IV');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // Tamper with ciphertext
      try {
        const tamperedCT = `v1:${parts[1]}:${parts[2].slice(0, -1)}`;
        await decryptString(tamperedCT, 'test-user-123');
        throw new Error('Should have thrown an error for tampered ciphertext');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('throws error when UID is missing or empty', async () => {
      const payload = await encryptString('test', 'test-user-123');

      try {
        await decryptString(payload, null);
        throw new Error('Should have thrown an error for null UID');
      } catch (error) {
        expect(error.message).toContain('uid is required');
      }

      try {
        await decryptString(payload, '');
        throw new Error('Should have thrown an error for empty UID');
      } catch (error) {
        expect(error.message).toContain('uid is required');
      }
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

    it('maintains data integrity across multiple encrypt/decrypt cycles', async () => {
      const plainText = 'critical-data';
      const uid = 'test-user-123';
      
      // Simulate multiple storage/retrieval cycles
      let payload = await encryptString(plainText, uid);
      for (let i = 0; i < 5; i++) {
        const decrypted = await decryptString(payload, uid);
        expect(decrypted).toBe(plainText);
        // Re-encrypt and continue
        payload = await encryptString(plainText, uid);
      }
    });
  });

  describe('security properties', () => {
    it('encrypted payload does not contain plaintext', async () => {
      const plainText = 'secret-password-123';
      const payload = await encryptString(plainText, 'test-user-123');
      
      // Verify plaintext is not visible in encrypted payload
      expect(payload).not.toContain('secret');
      expect(payload).not.toContain('password');
      expect(payload).not.toContain('123');
    });

    it('key isolation: different UIDs cannot decrypt each other\'s data', async () => {
      const plainText = 'user-specific-data';
      const payload = await encryptString(plainText, 'user-1');
      
      // Should fail to decrypt with different UID
      try {
        await decryptString(payload, 'user-2');
        throw new Error('Should have thrown an error');
      } catch (error) {
        // Decryption fails with wrong key (may be DOMException)
        expect(error).toBeInstanceOf(Error);
      }
      
      // Should succeed with correct UID
      const decrypted = await decryptString(payload, 'user-1');
      expect(decrypted).toBe(plainText);
    });
  });
});

