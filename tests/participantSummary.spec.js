import { expect } from 'chai';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { urls } from '../src/utils.js';
import { renderParticipantHeader } from '../src/participantHeader.js';
import { participantState } from '../src/stateManager.js';
import { refreshParticipantAfterReset } from '../src/participantSummary.js';
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
  let renderSummaryTabContent;

  const ensureModuleLoaded = async () => {
    if (render && renderParticipantSummary && retrieveDHQHEIReport && renderSummaryTabContent) return;
    global.PDFLib = global.PDFLib ?? createPdfLibStub();
    const module = await import('../src/participantSummary.js');
    render = module.render;
    renderParticipantSummary = module.renderParticipantSummary;
    retrieveDHQHEIReport = module.retrieveDHQHEIReport;
    renderSummaryTabContent = module.renderSummaryTabContent;
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

  describe('renderSummaryTabContent', () => {
    it('renders summary table structure', async () => {
      const participant = buildSummaryParticipant();
      const html = await renderSummaryTabContent(participant);

      expect(html).to.include('Participant Summary');
    });

    it('renders summary content without provided reports', async () => {
      const participant = buildSummaryParticipant();
      const html = await renderSummaryTabContent(participant, null);

      expect(html).to.include('Participant Summary');
      expect(html).to.include('table');
    });

    it('renders summary content with provided reports', async () => {
      const participant = buildSummaryParticipant();
      const reports = {
        physActReport: {
          [`d_${fieldMapping.reports.physicalActivity.reportTS}`]: '2024-03-01T00:00:00Z',
        },
      };
      const html = await renderSummaryTabContent(participant, reports);

      expect(html).to.include('Participant Summary');
      expect(html).to.include('downloadPhysActReport');
    });

    it('handles missing participant gracefully', async () => {
      const html = await renderSummaryTabContent(null);
      expect(html).to.include('No participant data available');
    });

    it('includes alert placeholder', async () => {
      const participant = buildSummaryParticipant();
      const html = await renderSummaryTabContent(participant);

      expect(html).to.include('alert_placeholder');
    });

    it('renders complete summary table structure', async () => {
      const participant = buildSummaryParticipant();
      const html = await renderSummaryTabContent(participant);

      expect(html).to.include('table');
      expect(html).to.include('thead');
      expect(html).to.include('tbody');
      expect(html).to.include('Icon');
      expect(html).to.include('Status');
      expect(html).to.include('Date');
    });

    it('handles participant with revocation and destruction flags', async () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.revokeHIPAA]: fieldMapping.yes,
        [fieldMapping.signedHIPAARevoc]: fieldMapping.yes,
        [fieldMapping.destroyData]: fieldMapping.yes,
        [fieldMapping.signedDataDestroy]: fieldMapping.yes,
      });
      const html = await renderSummaryTabContent(participant);

      expect(html).to.include('HIPAA Revoc Form');
      expect(html).to.include('Data Destroy Form');
    });
  });

  describe('reset participant modal isolation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      // Minimal edit modal skeleton to verify it is untouched by reset flow
      document.body.innerHTML = `
        <div id="navBarLinks"></div>
        <div id="mainContent"></div>
        <div id="modalShowMoreData"><div id="modalHeader">edit-modal-header</div><div id="modalBody"></div></div>
      `;
      global.bootstrap = {
        Modal: class {
          constructor(el) { this.el = el; }
          show() { this.el.dataset.shown = '1'; }
          hide() { this.el.dataset.hidden = '1'; }
          static getInstance() { return null; }
        }
      };
    });

    it('populates only the reset modal and leaves the edit modal intact', async () => {
      const participant = buildSummaryParticipant();
      const html = await renderSummaryTabContent(participant);
      expect(html).to.include('openResetDialog');
      document.getElementById('mainContent').innerHTML = html;

      await waitForAsyncTasks();

      const resetBtn = document.getElementById('openResetDialog');
      expect(resetBtn).to.exist;

      // Click reset to trigger modal content
      resetBtn.click();
      await waitForAsyncTasks();

      const resetModalHeader = document.getElementById('resetModalHeader');
      const resetModalBody = document.getElementById('resetModalBody');
      const editModalHeader = document.getElementById('modalHeader');

      expect(resetModalHeader.textContent).to.include('Confirm Participant Reset');
      expect(resetModalBody.textContent).to.include('reset this participant');
      expect(resetModalBody.querySelector('#resetUserBtn')).to.exist;
      // Ensure the edit modal header is not changed by the reset flow
      expect(editModalHeader.textContent).to.equal('edit-modal-header');
    });

    it('shows and hides reset modal via bootstrap and fallback path', async () => {
      const participant = buildSummaryParticipant();
      const html = await renderSummaryTabContent(participant);
      // Simulate the page-level header plus the summary tab content
      document.getElementById('mainContent').innerHTML = `${renderParticipantHeader(participant)}${html}`;
      await waitForAsyncTasks();

      // Force manual fallback path (no bootstrap present)
      delete global.bootstrap;

      const resetBtn = document.getElementById('openResetDialog');
      expect(resetBtn).to.exist;

      resetBtn.click();
      await waitForAsyncTasks();
      const modalEl = document.getElementById('resetParticipantModal');
      expect(modalEl.classList.contains('show') || modalEl.style.display === 'block').to.be.true;

      const confirmBtn = document.getElementById('resetUserBtn');
      expect(confirmBtn).to.exist;
      
      global.fetch = async () => ({
        ok: true,
        json: async () => ({ code: 200, data: { data: participant } })
      });

      confirmBtn.click();
      await waitForAsyncTasks();
      await new Promise(res => setTimeout(res, 0));
      expect(modalEl.classList.contains('show')).to.be.false;
      expect(modalEl.style.display === '' || modalEl.style.display === 'none').to.be.true;

      expect(document.querySelector('.modal-backdrop')).to.be.null;
    });

    it('refreshes the participant header after a successful reset', async () => {
      const participant = buildSummaryParticipant({
        Connect_ID: 'OLD-CONNECT',
        [fieldMapping.verficationDate]: '2024-01-04T00:00:00Z',
      });
      const updatedParticipant = {
        ...participant,
        Connect_ID: 'NEW-CONNECT',
        [fieldMapping.verficationDate]: '2025-02-02T00:00:00Z',
      };

      const originalFetch = global.fetch;
      global.fetch = async (req) => {
        const url = typeof req === 'string' ? req : req?.url || '';
        if (url.includes('resetUser')) {
          return { ok: true, json: async () => ({ code: 200, data: { data: updatedParticipant } }) };
        }
        return { ok: true, json: async () => ({ code: 200, data: {} }) };
      };

      const html = await renderSummaryTabContent(participant);
      document.getElementById('mainContent').innerHTML = html;
      await waitForAsyncTasks();

      const resetBtn = document.getElementById('openResetDialog');
      expect(resetBtn).to.exist;
      resetBtn.click();
      await waitForAsyncTasks();

      const confirmBtn = document.getElementById('resetUserBtn');
      expect(confirmBtn).to.exist;
      confirmBtn.click();
      await waitForAsyncTasks();
      await new Promise(res => setTimeout(res, 10));
      await refreshParticipantAfterReset(updatedParticipant);

      const mainContentHtml = document.getElementById('mainContent').innerHTML;
      const stateParticipant = participantState.getParticipant();

      expect(stateParticipant.Connect_ID).to.equal('NEW-CONNECT');
      expect(mainContentHtml).to.include('NEW-CONNECT');
      expect(mainContentHtml).to.include('Connect_ID');

      global.fetch = originalFetch;
    });
  });

  it('refreshParticipantAfterReset updates participant state', async () => {
    const participant = buildSummaryParticipant({
      [fieldMapping.verifiedFlag]: fieldMapping.duplicate,
      state: { uid: 'reset-uid', [fieldMapping.duplicateType]: fieldMapping.activeSignedAsPassive }
    });

    const refreshedParticipant = {
      ...participant,
      [fieldMapping.verifiedFlag]: fieldMapping.verified,
      state: { uid: 'reset-uid', [fieldMapping.duplicateType]: null },
    };

    await refreshParticipantAfterReset(refreshedParticipant);

    const current = participantState.getParticipant();
    expect(current[fieldMapping.verifiedFlag]).to.equal(fieldMapping.verified);
    expect(window.location.hash).to.equal('#participantDetails/summary');
  });
});
