import { expect } from 'chai';
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
      expect(getConceptIdByCountryName('United States of America')).to.equal(333208328);
      expect(getConceptIdByCountryName('Canada')).to.equal(794205182);
      expect(getConceptIdByCountryName('Germany')).to.equal(780612099);
    });

    it('returns undefined for unknown country name', () => {
      expect(getConceptIdByCountryName('Unknown Country')).to.be.undefined;
      expect(getConceptIdByCountryName('')).to.be.undefined;
    });

    it('is case-sensitive', () => {
      expect(getConceptIdByCountryName('united states of america')).to.be.undefined;
      expect(getConceptIdByCountryName('CANADA')).to.be.undefined;
    });
  });

  describe('getCountryNameByConceptId', () => {
    it('returns country name for valid concept ID', () => {
      expect(getCountryNameByConceptId(333208328)).to.equal('United States of America');
      expect(getCountryNameByConceptId(794205182)).to.equal('Canada');
      expect(getCountryNameByConceptId(780612099)).to.equal('Germany');
    });

    it('returns undefined for unknown concept ID', () => {
      expect(getCountryNameByConceptId(999999999)).to.be.undefined;
      expect(getCountryNameByConceptId(0)).to.be.undefined;
    });

    it('handles historical/territory countries', () => {
      expect(getCountryNameByConceptId(794707854)).to.equal('Czechoslovakia');
      expect(getCountryNameByConceptId(610145443)).to.equal('German Democratic Republic');
      expect(getCountryNameByConceptId(193698473)).to.equal('French Guiana');
    });
  });

  describe('getCountryNameByCode3', () => {
    it('returns country name for valid 3-char code', () => {
      expect(getCountryNameByCode3('usa')).to.equal('United States of America');
      expect(getCountryNameByCode3('can')).to.equal('Canada');
      expect(getCountryNameByCode3('deu')).to.equal('Germany');
    });

    it('handles uppercase codes', () => {
      expect(getCountryNameByCode3('USA')).to.equal('United States of America');
    });

    it('returns undefined for unknown code', () => {
      expect(getCountryNameByCode3('xyz')).to.be.undefined;
    });

    it('handles null/undefined input', () => {
      expect(getCountryNameByCode3(null)).to.be.undefined;
      expect(getCountryNameByCode3(undefined)).to.be.undefined;
    });
  });

  describe('getCountryCode3ByCountryName', () => {
    it('returns 3-char code for valid country name', () => {
      expect(getCountryCode3ByCountryName('United States of America')).to.equal('usa');
      expect(getCountryCode3ByCountryName('Canada')).to.equal('can');
      expect(getCountryCode3ByCountryName('Germany')).to.equal('deu');
    });

    it('returns undefined for unknown country name', () => {
      expect(getCountryCode3ByCountryName('Unknown Country')).to.be.undefined;
      expect(getCountryCode3ByCountryName('')).to.be.undefined;
    });

    it('is case-sensitive', () => {
      // Should fail with wrong casing since country names have specific capitalization
      expect(getCountryCode3ByCountryName('united states of america')).to.be.undefined;
      expect(getCountryCode3ByCountryName('CANADA')).to.be.undefined;
    });

    it('handles null/undefined input', () => {
      expect(getCountryCode3ByCountryName(null)).to.be.undefined;
      expect(getCountryCode3ByCountryName(undefined)).to.be.undefined;
    });

    it('handles historical/territory countries', () => {
      expect(getCountryCode3ByCountryName('Czechoslovakia')).to.equal('csk');
      expect(getCountryCode3ByCountryName('German Democratic Republic')).to.equal('ddr');
      expect(getCountryCode3ByCountryName('French Guiana')).to.equal('guf');
    });
  });

  describe('getCountryList', () => {
    it('returns array of country names', () => {
      const list = getCountryList();
      expect(list).to.be.an('array');
      expect(list.length).to.equal(270);
      expect(list).to.include('United States of America');
      expect(list).to.include('Canada');
      expect(list).to.include('Zimbabwe');
    });

    it('returns names in alphabetical order', () => {
      const list = getCountryList();
      expect(list[0]).to.equal('Afghanistan');
    });
  });

  describe('getCountryCode3List', () => {
    it('returns array of 3-character codes', () => {
      const list = getCountryCode3List();
      expect(list).to.be.an('array');
      expect(list.length).to.equal(270);
      expect(list).to.include('usa');
    });
  });

  describe('getCountryData', () => {
    it('returns array of all country objects', () => {
      const data = getCountryData();
      expect(data).to.be.an('array');
      expect(data.length).to.equal(270);
    });

    it('each object has required properties', () => {
      const data = getCountryData();
      const usa = data.find(c => c.code3 === 'usa');
      expect(usa).to.have.property('name', 'United States of America');
      expect(usa).to.have.property('code3', 'usa');
      expect(usa).to.have.property('conceptId', 333208328);
    });

    it('returns a defensive copy, not the original array', () => {
      const data1 = getCountryData();
      const data2 = getCountryData();

      // Should be different array references
      expect(data1).to.not.equal(data2);

      // But should have the same content
      expect(data1.length).to.equal(data2.length);
      expect(data1[0]).to.deep.equal(data2[0]);
    });

    it('mutating returned array does not affect future calls', () => {
      const data1 = getCountryData();
      const originalLength = data1.length;

      // Mutate the returned array
      data1.push({ name: 'Fake Country', code3: 'fak', conceptId: 999 });

      // Get a new copy
      const data2 = getCountryData();

      // Should still have original length
      expect(data2.length).to.equal(originalLength);
      expect(data2.length).to.equal(270);
    });
  });

  describe('data integrity', () => {
    it('all entries have valid concept IDs', () => {
      const data = getCountryData();
      data.forEach(country => {
        expect(country.conceptId).to.be.a('number');
        expect(country.conceptId).to.be.greaterThan(0);
      });
    });

    it('all entries have valid names', () => {
      const data = getCountryData();
      data.forEach(country => {
        expect(country.name).to.be.a('string');
        expect(country.name.length).to.be.greaterThan(0);
      });
    });

    it('all entries have valid 3-char codes', () => {
      const data = getCountryData();
      data.forEach(country => {
        expect(country.code3).to.be.a('string');
        expect(country.code3.length).to.equal(3);
      });
    });

    it('concept IDs are unique', () => {
      const data = getCountryData();
      const conceptIds = data.map(c => c.conceptId);
      const uniqueIds = [...new Set(conceptIds)];
      expect(uniqueIds.length).to.equal(conceptIds.length);
    });

    it('code3 values are unique', () => {
      const data = getCountryData();
      const codes = data.map(c => c.code3);
      const uniqueCodes = [...new Set(codes)];
      expect(uniqueCodes.length).to.equal(codes.length);
    });
  });
});
