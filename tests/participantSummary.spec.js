import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { urls } from '../src/utils.js';
import { renderParticipantHeader } from '../src/participantHeader.js';
import { participantState } from '../src/stateManager.js';
import { refreshParticipantAfterReset } from '../src/participantSummary.js';
import { setupTestEnvironment, teardownTestEnvironment, createMockParticipant, waitForAsyncTasks, installFirebaseStub } from './helpers.js';

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
    const resolved = module?.default ?? module;
    render = resolved.render;
    renderParticipantSummary = resolved.renderParticipantSummary;
    retrieveDHQHEIReport = resolved.retrieveDHQHEIReport;
    renderSummaryTabContent = resolved.renderSummaryTabContent;
  };

  beforeEach(async () => {
    setupTestEnvironment();
    installFirebaseStub({ uid: 'test-user' });
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

    expect(html).toContain('Participant Summary');
    expect(html).toContain('HIPAA Revoc Form');
    expect(html).toContain('Data Destroy Form');
    expect(html).toContain('downloadPhysActReport');
  });

  it('renderParticipantSummary populates DOM and attaches download anchors', () => {
    const participant = buildSummaryParticipant();

    renderParticipantSummary(participant, {});

    const mainContent = document.getElementById('mainContent').innerHTML;
    expect(mainContent).toContain('Participant Summary');
    expect(document.getElementById('downloadCopy')).not.toBeNull();
    expect(document.getElementById('navBarLinks').innerHTML).not.toBe('');
  });

  it('retrieveDHQHEIReport short-circuits when submission criteria not met', async () => {
    const result = await retrieveDHQHEIReport(fieldMapping.started, null, null);
    expect(result).toBe(null);
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

      expect(html).toContain('HIPAA Revoc Form');
      expect(html).toContain('Signed</td>');
      expect(html).toContain('HIPAA_Revoc_V1.0_Eng');
      expect(html).toContain('downloadCopyHipaaRevoc');
      expect(html).toContain('icon--success');
    });

    it('renders not signed HIPAA revocation with disabled link', () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.revokeHIPAA]: fieldMapping.yes,
        [fieldMapping.signedHIPAARevoc]: fieldMapping.no,
        [fieldMapping.versionHIPAARevoc]: 'HIPAA_Revoc_V1.0_Eng',
        [fieldMapping.dateHIPAARevoc]: '2024-02-01T00:00:00Z',
      });

      const html = render(participant, {});

      expect(html).toContain('HIPAA Revoc Form');
      expect(html).toContain('Not Signed</td>');
      expect(html).toContain('link--disabled');
      expect(html).toContain('icon--error');
    });

    it('does not render HIPAA revocation when not requested', () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.revokeHIPAA]: fieldMapping.no,
      });

      const html = render(participant, {});

      expect(html).not.toContain('HIPAA Revoc Form');
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

      expect(html).toContain('Data Destroy Form');
      expect(html).toContain('Signed</td>');
      expect(html).toContain('Data_Destroy_V1.0_Eng');
      expect(html).toContain('downloadCopyDataDestroy');
      expect(html).toContain('icon--success');
    });

    it('renders not signed data destruction with disabled link', () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.destroyData]: fieldMapping.yes,
        [fieldMapping.signedDataDestroy]: fieldMapping.no,
        [fieldMapping.versionDataDestroy]: 'Data_Destroy_V1.0_Eng',
        [fieldMapping.dateDataDestroy]: '2024-02-02T00:00:00Z',
      });

      const html = render(participant, {});

      expect(html).toContain('Data Destroy Form');
      expect(html).toContain('Not Signed</td>');
      expect(html).toContain('link--disabled');
      expect(html).toContain('icon--error');
    });

    it('does not render data destruction when not requested', () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.destroyData]: fieldMapping.no,
      });

      const html = render(participant, {});

      expect(html).not.toContain('Data Destroy Form');
    });
  });

  describe('retrieveDHQHEIReport input validation', () => {
    it('returns null when studyID is missing', async () => {
      const result = await retrieveDHQHEIReport(fieldMapping.submitted, null, 'user456');
      expect(result).toBe(null);
    });

    it('returns null when respondentUsername is missing', async () => {
      const result = await retrieveDHQHEIReport(fieldMapping.submitted, 'study_123', null);
      expect(result).toBe(null);
    });

    it('returns null when dhqSurveyStatus is not submitted', async () => {
      const result = await retrieveDHQHEIReport(fieldMapping.started, 'study_123', 'user456');
      expect(result).toBe(null);
    });

    it('validates that submission status is checked first', async () => {
      const result = await retrieveDHQHEIReport(fieldMapping.notYetEligible, 'study_123', 'user456');
      expect(result).toBe(null);
    });
  });

  describe('renderSummaryTabContent', () => {
    it('renders summary table structure', async () => {
      const participant = buildSummaryParticipant();
      const html = await renderSummaryTabContent(participant);

      expect(html).toContain('Participant Summary');
    });

    it('renders summary content without provided reports', async () => {
      const participant = buildSummaryParticipant();
      const html = await renderSummaryTabContent(participant, null);

      expect(html).toContain('Participant Summary');
      expect(html).toContain('table');
    });

    it('renders summary content with provided reports', async () => {
      const participant = buildSummaryParticipant();
      const reports = {
        physActReport: {
          [`d_${fieldMapping.reports.physicalActivity.reportTS}`]: '2024-03-01T00:00:00Z',
        },
      };
      const html = await renderSummaryTabContent(participant, reports);

      expect(html).toContain('Participant Summary');
      expect(html).toContain('downloadPhysActReport');
    });

    it('handles missing participant gracefully', async () => {
      const html = await renderSummaryTabContent(null);
      expect(html).toContain('No participant data available');
    });

    it('includes alert placeholder', async () => {
      const participant = buildSummaryParticipant();
      const html = await renderSummaryTabContent(participant);

      expect(html).toContain('alert_placeholder');
    });

    it('renders complete summary table structure', async () => {
      const participant = buildSummaryParticipant();
      const html = await renderSummaryTabContent(participant);

      expect(html).toContain('table');
      expect(html).toContain('thead');
      expect(html).toContain('tbody');
      expect(html).toContain('Icon');
      expect(html).toContain('Status');
      expect(html).toContain('Date');
    });

    it('handles participant with revocation and destruction flags', async () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.revokeHIPAA]: fieldMapping.yes,
        [fieldMapping.signedHIPAARevoc]: fieldMapping.yes,
        [fieldMapping.destroyData]: fieldMapping.yes,
        [fieldMapping.signedDataDestroy]: fieldMapping.yes,
      });
      const html = await renderSummaryTabContent(participant);

      expect(html).toContain('HIPAA Revoc Form');
      expect(html).toContain('Data Destroy Form');
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
      expect(html).toContain('openResetDialog');
      document.getElementById('mainContent').innerHTML = html;

      await waitForAsyncTasks();

      const resetBtn = document.getElementById('openResetDialog');
      expect(resetBtn).not.toBeNull();

      // Click reset to trigger modal content
      resetBtn.click();
      await waitForAsyncTasks();

      const resetModalHeader = document.getElementById('resetModalHeader');
      const resetModalBody = document.getElementById('resetModalBody');
      const editModalHeader = document.getElementById('modalHeader');

      expect(resetModalHeader.textContent).toContain('Confirm Participant Reset');
      expect(resetModalBody.textContent).toContain('reset this participant');
      expect(resetModalBody.querySelector('#resetUserBtn')).not.toBeNull();
      // Ensure the edit modal header is not changed by the reset flow
      expect(editModalHeader.textContent).toBe('edit-modal-header');
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
      expect(resetBtn).not.toBeNull();

      resetBtn.click();
      await waitForAsyncTasks();
      const modalEl = document.getElementById('resetParticipantModal');
      expect(modalEl.classList.contains('show') || modalEl.style.display === 'block').toBe(true);

      const confirmBtn = document.getElementById('resetUserBtn');
      expect(confirmBtn).not.toBeNull();
      
      global.fetch = async () => ({
        ok: true,
        json: async () => ({ code: 200, data: { data: participant } })
      });

      confirmBtn.click();
      await waitForAsyncTasks();
      await new Promise(res => setTimeout(res, 0));
      expect(modalEl.classList.contains('show')).toBe(false);
      expect(modalEl.style.display === '' || modalEl.style.display === 'none').toBe(true);

      expect(document.querySelector('.modal-backdrop')).toBeNull();
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
      expect(resetBtn).not.toBeNull();
      resetBtn.click();
      await waitForAsyncTasks();

      const confirmBtn = document.getElementById('resetUserBtn');
      expect(confirmBtn).not.toBeNull();
      confirmBtn.click();
      await waitForAsyncTasks();
      await new Promise(res => setTimeout(res, 10));
      await refreshParticipantAfterReset(updatedParticipant);

      const mainContentHtml = document.getElementById('mainContent').innerHTML;
      const stateParticipant = participantState.getParticipant();

      expect(stateParticipant.Connect_ID).toBe('NEW-CONNECT');
      expect(mainContentHtml).toContain('NEW-CONNECT');
      expect(mainContentHtml).toContain('Connect_ID');

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
    expect(current[fieldMapping.verifiedFlag]).toBe(fieldMapping.verified);
    expect(window.location.hash).toBe('#participantDetails/summary');
  });
});
