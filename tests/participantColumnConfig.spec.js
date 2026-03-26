import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { bubbleCategories, bubbleFieldMap, defaultColumnKeys } from '../src/participantColumnConfig.js';

const flattenCategoryFields = () =>
  bubbleCategories.flatMap((category) =>
    (category.fields ?? []).map((field, index) => ({
      categoryKey: category.key,
      key: field.key,
      label: field.label,
      order: index,
    })),
  );

describe('participantColumnConfig', () => {
  it('should expose every field in bubbleFieldMap exactly once', () => {
    const flattenedFields = flattenCategoryFields();
    const lastDefinedLabels = new Map();
    flattenedFields.forEach(({ key, label }) => {
      lastDefinedLabels.set(key, label);
    });

    expect(bubbleFieldMap.size).toBe(lastDefinedLabels.size);
    lastDefinedLabels.forEach((label, key) => {
      expect(bubbleFieldMap.has(key), `missing key ${key}`).toBe(true);
      expect(bubbleFieldMap.get(key)).toBe(label);
    });
  });

  it('should keep category field copies decoupled from the source map', () => {
    const { key, label } = flattenCategoryFields()[0];
    const category = bubbleCategories.find((cat) =>
      (cat.fields ?? []).some((field) => field.key === key),
    );
    const fieldRef = category.fields.find((field) => field.key === key);
    const originalField = { ...fieldRef };

    fieldRef.label = 'Modified Label';
    expect(bubbleFieldMap.get(key)).toBe(label);

    fieldRef.key = 'modified-key';
    expect(bubbleFieldMap.has(key)).toBe(true);
    expect(bubbleFieldMap.has('modified-key')).toBe(false);

    Object.assign(fieldRef, originalField);
  });

  it('should expose required category metadata', () => {
    const identifiers = bubbleCategories.find((category) => category.key === 'identifiers');
    expect(identifiers).not.toBeNull();
    expect(identifiers.label).toBe('Identifiers');
    expect(identifiers.fields.map((field) => field.key)).toEqual([
      'Connect_ID',
      'pin',
      'token',
      'studyId',
    ]);

    const defaultCategory = bubbleCategories.find((category) => category.key === 'default-columns');
    expect(defaultCategory).not.toBeNull();
    expect(defaultCategory.fields).toSatisfy(v => v.length > 0);
  });

  it('should keep defaultColumnKeys in sync with the default category order', () => {
    const defaultCategory = bubbleCategories.find((category) => category.key === 'default-columns');
    const expectedKeys = defaultCategory.fields.map((field) => field.key);
    expect(defaultColumnKeys).toEqual(expectedKeys);
  });

  it('should only list default columns that are present in the bubble field map', () => {
    defaultColumnKeys.forEach((key) => {
      expect(bubbleFieldMap.has(key), `missing bubble field for ${key}`).toBe(true);
      expect(bubbleFieldMap.get(key)).toBeTypeOf('string');
    });
  });

  it('should include both string and numeric columns in bubbleFieldMap', () => {
    expect(bubbleFieldMap.has('token')).toBe(true);
    expect(bubbleFieldMap.has(fieldMapping.verifiedFlag)).toBe(true);
    expect(bubbleFieldMap.get('token')).toBe('Token');
    expect(bubbleFieldMap.get(fieldMapping.verifiedFlag)).toBe('Verif Stat');
  });

  describe('category structure validation', () => {
    const expectedCategoryKeys = [
      'default-columns',
      'identifiers',
      'enrollmentDetails',
      'deIdentifiedData',
      'verificationTable',
      'accountDetails',
      'userProfileDetails',
      'studyActivityCompletion',
      'refusalsWithdrawals',
    ];

    it('should contain all expected category keys', () => {
      const actualKeys = bubbleCategories.map((category) => category.key);
      expect(actualKeys).toEqual(expectedCategoryKeys);
    });

    it('should have non-empty labels for all categories', () => {
      bubbleCategories.forEach((category) => {
        expect(category.label).toBeTypeOf('string');
        expect(category.label.length).toBeGreaterThan(0);
      });
    });

    it('should have fields array in each category', () => {
      bubbleCategories.forEach((category) => {
        expect(category.fields).toBeInstanceOf(Array);
        expect(category.fields.length).toBeGreaterThan(0);
      });
    });

    it('should not have null field keys in bubbleFieldMap', () => {
      bubbleFieldMap.forEach((label, key) => {
        expect(key).not.toBeNull();
        expect(label).toBeTypeOf('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });

    it('should have no duplicate field keys within the same category', () => {
      bubbleCategories.forEach((category) => {
        const keysInCategory = category.fields.map((field) => field.key);
        const uniqueKeys = new Set(keysInCategory);
        expect(uniqueKeys.size).toBe(keysInCategory.length, `Duplicate keys found in category ${category.key}`);
      });
    });

    it('should have valid field structure in each category', () => {
      bubbleCategories.forEach((category) => {
        category.fields.forEach((field) => {
          expect(field).toHaveProperty('key');
          expect(field).toHaveProperty('label');
          expect(field.label).toBeTypeOf('string');
        });
      });
    });

    it('should allow same field key to appear in multiple categories (handling default fields)', () => {
      const keyOccurrences = new Map();
      bubbleCategories.forEach((category) => {
        category.fields.forEach((field) => {
          const count = keyOccurrences.get(field.key) || 0;
          keyOccurrences.set(field.key, count + 1);
        });
      });

      const duplicatedKeys = Array.from(keyOccurrences.entries()).filter(([_, count]) => count > 1);
      expect(duplicatedKeys.length).toBeGreaterThan(0);
    });
  });
});
