import { expect } from 'chai';
import { resolveBaseAPI, baseAPI } from '../src/utils.js';
import {
  installFirebaseStub,
  setupTestEnvironment,
  teardownTestEnvironment,
} from './helpers.js';

describe('utils', () => {
  beforeEach(() => {
    setupTestEnvironment();
    installFirebaseStub();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('baseAPI resolution', () => {
    it('returns prod endpoint when host matches prod', () => {
      expect(resolveBaseAPI('dashboard-myconnect.cancer.gov'))
        .to.equal('https://api-myconnect.cancer.gov');
    });

    it('returns stage endpoint when host matches stage', () => {
      expect(resolveBaseAPI('dashboard-myconnect-stage.cancer.gov'))
        .to.equal('https://api-myconnect-stage.cancer.gov');
    });

    it('defaults to dev endpoint otherwise', () => {
      expect(resolveBaseAPI('example.com'))
        .to.equal('https://us-central1-nih-nci-dceg-connect-dev.cloudfunctions.net');
    });

    it('exports baseAPI using dev endpoint when location is undefined', () => {
      // In test environment, location is not defined at module load time
      expect(baseAPI).to.equal('https://us-central1-nih-nci-dceg-connect-dev.cloudfunctions.net');
    });
  });
});
