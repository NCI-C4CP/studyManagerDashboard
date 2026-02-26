import {
  getConceptIdByCountryName,
  getCountryNameByConceptId,
  getCountryNameByCode3,
  getCountryCode3ByCountryName,
  getCountryList,
  getCountryData,
  getCountryCode3List,
} from '../src/countryMapping.js';

describe('countryMapping', () => {
  describe('getConceptIdByCountryName', () => {
    it('returns concept ID for valid country name', () => {
      expect(getConceptIdByCountryName('United States of America')).toBe(333208328);
      expect(getConceptIdByCountryName('Canada')).toBe(794205182);
      expect(getConceptIdByCountryName('Germany')).toBe(780612099);
    });

    it('returns undefined for unknown country name', () => {
      expect(getConceptIdByCountryName('Unknown Country')).toBeUndefined();
      expect(getConceptIdByCountryName('')).toBeUndefined();
    });

    it('is case-sensitive', () => {
      expect(getConceptIdByCountryName('united states of america')).toBeUndefined();
      expect(getConceptIdByCountryName('CANADA')).toBeUndefined();
    });
  });

  describe('getCountryNameByConceptId', () => {
    it('returns country name for valid concept ID', () => {
      expect(getCountryNameByConceptId(333208328)).toBe('United States of America');
      expect(getCountryNameByConceptId(794205182)).toBe('Canada');
      expect(getCountryNameByConceptId(780612099)).toBe('Germany');
    });

    it('returns undefined for unknown concept ID', () => {
      expect(getCountryNameByConceptId(999999999)).toBeUndefined();
      expect(getCountryNameByConceptId(0)).toBeUndefined();
    });

    it('handles historical/territory countries', () => {
      expect(getCountryNameByConceptId(794707854)).toBe('Czechoslovakia');
      expect(getCountryNameByConceptId(610145443)).toBe('German Democratic Republic');
      expect(getCountryNameByConceptId(193698473)).toBe('French Guiana');
    });
  });

  describe('getCountryNameByCode3', () => {
    it('returns country name for valid 3-char code', () => {
      expect(getCountryNameByCode3('usa')).toBe('United States of America');
      expect(getCountryNameByCode3('can')).toBe('Canada');
      expect(getCountryNameByCode3('deu')).toBe('Germany');
    });

    it('handles uppercase codes', () => {
      expect(getCountryNameByCode3('USA')).toBe('United States of America');
    });

    it('returns undefined for unknown code', () => {
      expect(getCountryNameByCode3('xyz')).toBeUndefined();
    });

    it('handles null/undefined input', () => {
      expect(getCountryNameByCode3(null)).toBeUndefined();
      expect(getCountryNameByCode3(undefined)).toBeUndefined();
    });
  });

  describe('getCountryCode3ByCountryName', () => {
    it('returns 3-char code for valid country name', () => {
      expect(getCountryCode3ByCountryName('United States of America')).toBe('usa');
      expect(getCountryCode3ByCountryName('Canada')).toBe('can');
      expect(getCountryCode3ByCountryName('Germany')).toBe('deu');
    });

    it('returns undefined for unknown country name', () => {
      expect(getCountryCode3ByCountryName('Unknown Country')).toBeUndefined();
      expect(getCountryCode3ByCountryName('')).toBeUndefined();
    });

    it('is case-sensitive', () => {
      // Should fail with wrong casing since country names have specific capitalization
      expect(getCountryCode3ByCountryName('united states of america')).toBeUndefined();
      expect(getCountryCode3ByCountryName('CANADA')).toBeUndefined();
    });

    it('handles null/undefined input', () => {
      expect(getCountryCode3ByCountryName(null)).toBeUndefined();
      expect(getCountryCode3ByCountryName(undefined)).toBeUndefined();
    });

    it('handles historical/territory countries', () => {
      expect(getCountryCode3ByCountryName('Czechoslovakia')).toBe('csk');
      expect(getCountryCode3ByCountryName('German Democratic Republic')).toBe('ddr');
      expect(getCountryCode3ByCountryName('French Guiana')).toBe('guf');
    });
  });

  describe('getCountryList', () => {
    it('returns array of country names', () => {
      const list = getCountryList();
      expect(list).toBeInstanceOf(Array);
      expect(list.length).toBe(270);
      expect(list).toContain('United States of America');
      expect(list).toContain('Canada');
      expect(list).toContain('Zimbabwe');
    });

    it('returns names in alphabetical order', () => {
      const list = getCountryList();
      expect(list[0]).toBe('Afghanistan');
    });
  });

  describe('getCountryCode3List', () => {
    it('returns array of 3-character codes', () => {
      const list = getCountryCode3List();
      expect(list).toBeInstanceOf(Array);
      expect(list.length).toBe(270);
      expect(list).toContain('usa');
    });
  });

  describe('getCountryData', () => {
    it('returns array of all country objects', () => {
      const data = getCountryData();
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBe(270);
    });

    it('each object has required properties', () => {
      const data = getCountryData();
      const usa = data.find(c => c.code3 === 'usa');
      expect(usa).toHaveProperty('name', 'United States of America');
      expect(usa).toHaveProperty('code3', 'usa');
      expect(usa).toHaveProperty('conceptId', 333208328);
    });

    it('returns a defensive copy, not the original array', () => {
      const data1 = getCountryData();
      const data2 = getCountryData();

      // Should be different array references
      expect(data1).not.toBe(data2);

      // But should have the same content
      expect(data1.length).toBe(data2.length);
      expect(data1[0]).toEqual(data2[0]);
    });

    it('mutating returned array does not affect future calls', () => {
      const data1 = getCountryData();
      const originalLength = data1.length;

      // Mutate the returned array
      data1.push({ name: 'Fake Country', code3: 'fak', conceptId: 999 });

      // Get a new copy
      const data2 = getCountryData();

      // Should still have original length
      expect(data2.length).toBe(originalLength);
      expect(data2.length).toBe(270);
    });
  });

  describe('data integrity', () => {
    it('all entries have valid concept IDs', () => {
      const data = getCountryData();
      data.forEach(country => {
        expect(country.conceptId).toBeTypeOf('number');
        expect(country.conceptId).toBeGreaterThan(0);
      });
    });

    it('all entries have valid names', () => {
      const data = getCountryData();
      data.forEach(country => {
        expect(country.name).toBeTypeOf('string');
        expect(country.name.length).toBeGreaterThan(0);
      });
    });

    it('all entries have valid 3-char codes', () => {
      const data = getCountryData();
      data.forEach(country => {
        expect(country.code3).toBeTypeOf('string');
        expect(country.code3.length).toBe(3);
      });
    });

    it('concept IDs are unique', () => {
      const data = getCountryData();
      const conceptIds = data.map(c => c.conceptId);
      const uniqueIds = [...new Set(conceptIds)];
      expect(uniqueIds.length).toBe(conceptIds.length);
    });

    it('code3 values are unique', () => {
      const data = getCountryData();
      const codes = data.map(c => c.code3);
      const uniqueCodes = [...new Set(codes)];
      expect(uniqueCodes.length).toBe(codes.length);
    });
  });
});
