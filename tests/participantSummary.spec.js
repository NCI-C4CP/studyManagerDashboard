import { expect } from 'chai';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { setupTestEnvironment, teardownTestEnvironment, createMockParticipant, waitForAsyncTasks } from './helpers.js';

const createPdfLibStub = () => {
  const stubPage = {
    getSize: () => ({ width: 100, height: 100 }),
    drawText: () => {},
  };

  return {
    PDFDocument: {
      load: async () => ({
        embedFont: async () => ({}),
        getPages: () => [stubPage],
        addPage: () => stubPage,
        save: async () => new Uint8Array(),
      }),
    },
    StandardFonts: {
      Helvetica: 'Helvetica',
      TimesRomanItalic: 'TimesRomanItalic',
    },
    rgb: () => ({}),
  };
};

const buildSummaryParticipant = (overrides = {}) => createMockParticipant('summary-uid', {
  state: { uid: 'summary-uid' },
  [fieldMapping.consentFlag]: fieldMapping.yes,
  [fieldMapping.consentDate]: '2024-01-01T00:00:00Z',
  [fieldMapping.consentVersion]: 'HP_consent_V0.02_Eng',
  [fieldMapping.hipaaFlag]: fieldMapping.yes,
  [fieldMapping.hipaaDate]: '2024-01-02T00:00:00Z',
  [fieldMapping.hipaaVersion]: 'HP_HIPAA_V1.0_Eng',
  [fieldMapping.userProfileFlag]: fieldMapping.yes,
  [fieldMapping.userProfileDateTime]: '2024-01-03T00:00:00Z',
  [fieldMapping.verifiedFlag]: fieldMapping.verified,
  [fieldMapping.verficationDate]: '2024-01-04T00:00:00Z',
  [fieldMapping.refusalOptions]: {},
  [fieldMapping.healthcareProvider]: 452412599,
  [fieldMapping.preferredLanguage]: fieldMapping.language.en,
  [fieldMapping.dhqSurveyStatus]: fieldMapping.submitted,
  [fieldMapping.dhqSurveyCompletedDate]: '2024-01-05T00:00:00Z',
  [fieldMapping.dhqStudyID]: 'study_123',
  [fieldMapping.dhqUsername]: 'user123',
  ...overrides,
});

describe('participantSummary', () => {
  let render;
  let renderParticipantSummary;
  let retrieveDHQHEIReport;

  const ensureModuleLoaded = async () => {
    if (render && renderParticipantSummary && retrieveDHQHEIReport) return;
    global.PDFLib = global.PDFLib ?? createPdfLibStub();
    const module = await import('../src/participantSummary.js');
    render = module.render;
    renderParticipantSummary = module.renderParticipantSummary;
    retrieveDHQHEIReport = module.retrieveDHQHEIReport;
  };

  beforeEach(async () => {
    setupTestEnvironment();
    document.body.innerHTML = '<div id="navBarLinks"></div><div id="mainContent"></div>';
    await ensureModuleLoaded();
  });

  afterEach(async () => {
    await waitForAsyncTasks();
    teardownTestEnvironment();
  });

  it('renders summary table with optional revocation/destruction rows and ROI links', () => {
    const participant = buildSummaryParticipant({
      [fieldMapping.revokeHIPAA]: fieldMapping.yes,
      [fieldMapping.signedHIPAARevoc]: fieldMapping.yes,
      [fieldMapping.versionHIPAARevoc]: 'HIPAA_Revoc_V1.0_Eng',
      [fieldMapping.dateHIPAARevoc]: '2024-02-01T00:00:00Z',
      [fieldMapping.destroyData]: fieldMapping.yes,
      [fieldMapping.signedDataDestroy]: fieldMapping.yes,
      [fieldMapping.versionDataDestroy]: 'Data_Destroy_V1.0_Eng',
      [fieldMapping.dateDataDestroy]: '2024-02-02T00:00:00Z',
    });
    const reports = {
      physActReport: {
        [`d_${fieldMapping.reports.physicalActivity.reportTS}`]: '2024-03-01T00:00:00Z',
      },
    };

    const html = render(participant, reports);

    expect(html).to.include('Participant Summary');
    expect(html).to.include('HIPAA Revoc Form');
    expect(html).to.include('Data Destroy Form');
    expect(html).to.include('downloadPhysActReport');
  });

  it('renderParticipantSummary populates DOM and attaches download anchors', () => {
    const participant = buildSummaryParticipant();

    renderParticipantSummary(participant, {});

    const mainContent = document.getElementById('mainContent').innerHTML;
    expect(mainContent).to.include('Participant Summary');
    expect(document.getElementById('downloadCopy')).to.not.be.null;
    expect(document.getElementById('navBarLinks').innerHTML).to.not.equal('');
  });

  it('retrieveDHQHEIReport short-circuits when submission criteria not met', async () => {
    const result = await retrieveDHQHEIReport(fieldMapping.started, null, null);
    expect(result).to.equal(null);
  });

  describe('hipaaRevocation template states', () => {
    it('renders signed HIPAA revocation with download link', () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.revokeHIPAA]: fieldMapping.yes,
        [fieldMapping.signedHIPAARevoc]: fieldMapping.yes,
        [fieldMapping.versionHIPAARevoc]: 'HIPAA_Revoc_V1.0_Eng',
        [fieldMapping.dateHIPAARevoc]: '2024-02-01T00:00:00Z',
      });

      const html = render(participant, {});

      expect(html).to.include('HIPAA Revoc Form');
      expect(html).to.include('Signed</td>');
      expect(html).to.include('HIPAA_Revoc_V1.0_Eng');
      expect(html).to.include('downloadCopyHipaaRevoc');
      expect(html).to.include('icon--success');
    });

    it('renders not signed HIPAA revocation with disabled link', () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.revokeHIPAA]: fieldMapping.yes,
        [fieldMapping.signedHIPAARevoc]: fieldMapping.no,
        [fieldMapping.versionHIPAARevoc]: 'HIPAA_Revoc_V1.0_Eng',
        [fieldMapping.dateHIPAARevoc]: '2024-02-01T00:00:00Z',
      });

      const html = render(participant, {});

      expect(html).to.include('HIPAA Revoc Form');
      expect(html).to.include('Not Signed</td>');
      expect(html).to.include('link--disabled');
      expect(html).to.include('icon--error');
    });

    it('does not render HIPAA revocation when not requested', () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.revokeHIPAA]: fieldMapping.no,
      });

      const html = render(participant, {});

      expect(html).to.not.include('HIPAA Revoc Form');
    });
  });

  describe('dataDestroy template states', () => {
    it('renders signed data destruction with download link', () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.destroyData]: fieldMapping.yes,
        [fieldMapping.signedDataDestroy]: fieldMapping.yes,
        [fieldMapping.versionDataDestroy]: 'Data_Destroy_V1.0_Eng',
        [fieldMapping.dateDataDestroy]: '2024-02-02T00:00:00Z',
      });

      const html = render(participant, {});

      expect(html).to.include('Data Destroy Form');
      expect(html).to.include('Signed</td>');
      expect(html).to.include('Data_Destroy_V1.0_Eng');
      expect(html).to.include('downloadCopyDataDestroy');
      expect(html).to.include('icon--success');
    });

    it('renders not signed data destruction with disabled link', () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.destroyData]: fieldMapping.yes,
        [fieldMapping.signedDataDestroy]: fieldMapping.no,
        [fieldMapping.versionDataDestroy]: 'Data_Destroy_V1.0_Eng',
        [fieldMapping.dateDataDestroy]: '2024-02-02T00:00:00Z',
      });

      const html = render(participant, {});

      expect(html).to.include('Data Destroy Form');
      expect(html).to.include('Not Signed</td>');
      expect(html).to.include('link--disabled');
      expect(html).to.include('icon--error');
    });

    it('does not render data destruction when not requested', () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.destroyData]: fieldMapping.no,
      });

      const html = render(participant, {});

      expect(html).to.not.include('Data Destroy Form');
    });
  });

  describe('retrieveDHQHEIReport input validation', () => {
    it('returns null when studyID is missing', async () => {
      const result = await retrieveDHQHEIReport(fieldMapping.submitted, null, 'user456');
      expect(result).to.equal(null);
    });

    it('returns null when respondentUsername is missing', async () => {
      const result = await retrieveDHQHEIReport(fieldMapping.submitted, 'study_123', null);
      expect(result).to.equal(null);
    });

    it('returns null when dhqSurveyStatus is not submitted', async () => {
      const result = await retrieveDHQHEIReport(fieldMapping.started, 'study_123', 'user456');
      expect(result).to.equal(null);
    });

    it('validates that submission status is checked first', async () => {
      const result = await retrieveDHQHEIReport(fieldMapping.notYetEligible, 'study_123', 'user456');
      expect(result).to.equal(null);
    });
  });
});
