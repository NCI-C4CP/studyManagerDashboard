import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { baseAPI, urls } from '../src/utils.js';
import { renderParticipantHeader } from '../src/participantHeader.js';
import { participantState, reportsState, searchState } from '../src/stateManager.js';
import { setupTestEnvironment, teardownTestEnvironment, createMockParticipant, installFirebaseStub, trackAsyncEventHandlers, mockApi, jsonResponse, expectConsole } from './helpers.js';

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

const waitForFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

describe('participantSummary', () => {
  let retrieveDHQHEIReport;
  let renderSummaryTabContent;
  let asyncHandlerTracker;
  let fetchSpy;

  const ensureModuleLoaded = async () => {
    if (retrieveDHQHEIReport && renderSummaryTabContent) return;
    global.PDFLib = global.PDFLib ?? createPdfLibStub();
    const module = await import('../src/participantSummary.js');
    const resolved = module?.default ?? module;
    retrieveDHQHEIReport = resolved.retrieveDHQHEIReport;
    renderSummaryTabContent = resolved.renderSummaryTabContent;
  };

  beforeEach(async () => {
    setupTestEnvironment();
    installFirebaseStub({ uid: 'test-user' });
    participantState.clearParticipant();
    fetchSpy = mockApi({ 'GET retrievePhysicalActivityReport': () => jsonResponse({ code: 200, data: [] }) });
    document.body.innerHTML = '<div id="navBarLinks"></div><div id="mainContent"></div>';
    await ensureModuleLoaded();
  });

  afterEach(async () => {
    try {
      await asyncHandlerTracker?.allSettled();
    } finally {
      asyncHandlerTracker?.restore();
      asyncHandlerTracker = null;
      participantState.clearParticipant();
      teardownTestEnvironment();
    }
  });

  it('renders summary table with optional revocation/destruction rows and ROI links', async () => {
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

    const html = await renderSummaryTabContent(participant, reports);

    expect(html).toContain('Participant Summary');
    expect(html).toContain('>Round</th>');
    expect(html).toContain('>Type</th>');
    expect(html).toContain('HIPAA Revoc Form');
    expect(html).toContain('Data Destroy Form');
    expect(html).toContain('downloadPhysActReport');
  });

  it('renders follow-up rows after all existing summary rows', async () => {
    const participant = buildSummaryParticipant({
      [fieldMapping.destroyData]: fieldMapping.yes,
      [fieldMapping.signedDataDestroy]: fieldMapping.yes,
      [fieldMapping.versionDataDestroy]: 'Data_Destroy_V1.0_Eng',
      [fieldMapping.dateDataDestroy]: '2024-02-02T00:00:00Z',
      followups: [{
        [fieldMapping.followups.activityRound]: 'A1',
        [fieldMapping.followups.activityType]: fieldMapping.followups.SSC,
        [fieldMapping.followups.activityList]: ['Blood Collection'],
        [fieldMapping.followups.eligibilityEndAt]: '2027-03-01T00:00:00Z',
        collections: [],
      }],
    });

    const html = await renderSummaryTabContent(participant, {});
    const followupIndex = html.indexOf('<td>A1</td>');

    expect(followupIndex).toBeGreaterThan(html.indexOf('downloadPhysActReport'));
    expect(followupIndex).toBeGreaterThan(html.indexOf('Data Destroy Form'));
  });

  describe('hipaaRevocation template states', () => {
    it('renders signed HIPAA revocation with download link', async () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.revokeHIPAA]: fieldMapping.yes,
        [fieldMapping.signedHIPAARevoc]: fieldMapping.yes,
        [fieldMapping.versionHIPAARevoc]: 'HIPAA_Revoc_V1.0_Eng',
        [fieldMapping.dateHIPAARevoc]: '2024-02-01T00:00:00Z',
      });

      const html = await renderSummaryTabContent(participant, {});

      expect(html).toContain('HIPAA Revoc Form');
      expect(html).toContain('Signed</td>');
      expect(html).toContain('HIPAA_Revoc_V1.0_Eng');
      expect(html).toContain('downloadCopyHipaaRevoc');
      expect(html).toContain('icon--success');

      const container = document.createElement('div');
      container.innerHTML = html;
      const row = [...container.querySelectorAll('tbody tr')]
        .find(element => element.textContent.includes('HIPAA Revoc Form'));
      expect(row.cells).toHaveLength(10);
      expect(row.cells[1].textContent).toBe('Revocation');
      expect(row.cells[2].textContent).toBe('');
      expect(row.cells[3].textContent).toBe('Agreement');
      expect(row.cells[4].textContent).toBe('HIPAA Revoc Form');
    });

    it('renders not signed HIPAA revocation with disabled link', async () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.revokeHIPAA]: fieldMapping.yes,
        [fieldMapping.signedHIPAARevoc]: fieldMapping.no,
        [fieldMapping.versionHIPAARevoc]: 'HIPAA_Revoc_V1.0_Eng',
        [fieldMapping.dateHIPAARevoc]: '2024-02-01T00:00:00Z',
      });

      const html = await renderSummaryTabContent(participant, {});

      expect(html).toContain('HIPAA Revoc Form');
      expect(html).toContain('Not Signed</td>');
      expect(html).toContain('link--disabled');
      expect(html).toContain('icon--error');
    });

    it('does not render HIPAA revocation when not requested', async () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.revokeHIPAA]: fieldMapping.no,
      });

      const html = await renderSummaryTabContent(participant, {});

      expect(html).not.toContain('HIPAA Revoc Form');
    });
  });

  describe('dataDestroy template states', () => {
    it('renders signed data destruction with download link', async () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.destroyData]: fieldMapping.yes,
        [fieldMapping.signedDataDestroy]: fieldMapping.yes,
        [fieldMapping.versionDataDestroy]: 'Data_Destroy_V1.0_Eng',
        [fieldMapping.dateDataDestroy]: '2024-02-02T00:00:00Z',
      });

      const html = await renderSummaryTabContent(participant, {});

      expect(html).toContain('Data Destroy Form');
      expect(html).toContain('Signed</td>');
      expect(html).toContain('Data_Destroy_V1.0_Eng');
      expect(html).toContain('downloadCopyDataDestroy');
      expect(html).toContain('icon--success');

      const container = document.createElement('div');
      container.innerHTML = html;
      const row = [...container.querySelectorAll('tbody tr')]
        .find(element => element.textContent.includes('Data Destroy Form'));
      expect(row.cells).toHaveLength(10);
      expect(row.cells[1].textContent).toBe('Destruction');
      expect(row.cells[2].textContent).toBe('');
      expect(row.cells[3].textContent).toBe('Agreement');
      expect(row.cells[4].textContent).toBe('Data Destroy Form');
    });

    it('renders not signed data destruction with disabled link', async () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.destroyData]: fieldMapping.yes,
        [fieldMapping.signedDataDestroy]: fieldMapping.no,
        [fieldMapping.versionDataDestroy]: 'Data_Destroy_V1.0_Eng',
        [fieldMapping.dateDataDestroy]: '2024-02-02T00:00:00Z',
      });

      const html = await renderSummaryTabContent(participant, {});

      expect(html).toContain('Data Destroy Form');
      expect(html).toContain('Not Signed</td>');
      expect(html).toContain('link--disabled');
      expect(html).toContain('icon--error');
    });

    it('does not render data destruction when not requested', async () => {
      const participant = buildSummaryParticipant({
        [fieldMapping.destroyData]: fieldMapping.no,
      });

      const html = await renderSummaryTabContent(participant, {});

      expect(html).not.toContain('Data Destroy Form');
    });
  });

  describe('retrieveDHQHEIReport input validation', () => {
    it('returns null when studyID is missing', async () => {
      expectConsole('error', 'DHQ3 Retrieval criteria not met:');
      const result = await retrieveDHQHEIReport(fieldMapping.submitted, null, 'user456');
      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns null when respondentUsername is missing', async () => {
      expectConsole('error', 'DHQ3 Retrieval criteria not met:');
      const result = await retrieveDHQHEIReport(fieldMapping.submitted, 'study_123', null);
      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns null when dhqSurveyStatus is not submitted', async () => {
      expectConsole('error', 'DHQ3 Retrieval criteria not met:');
      const result = await retrieveDHQHEIReport(fieldMapping.started, 'study_123', 'user456');
      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('does not request a report for an ineligible participant', async () => {
      expectConsole('error', 'DHQ3 Retrieval criteria not met:');
      const result = await retrieveDHQHEIReport(fieldMapping.notYetEligible, 'study_123', 'user456');
      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('renderSummaryTabContent', () => {
    it('renders summary content when the report request fails', async () => {
      const participant = buildSummaryParticipant();
      mockApi({
        'GET retrievePhysicalActivityReport': () => jsonResponse({ message: 'Authorization failed!' }, { status: 401 }),
      });
      expectConsole('error', 'Error in retrievePhysicalActivityReport: Error: 401: Authorization failed!');
      expectConsole('error', 'Error fetching reports: Error: 401: Authorization failed!');

      const html = await renderSummaryTabContent(participant);

      expect(html).toContain('Participant Summary');
      expect(html).toContain('<table');
      expect(html).not.toContain('id="downloadPhysActReport"');
      expect(reportsState.getReports()).toBeNull();
    });

    it('fetches and caches a report when reports are not provided', async () => {
      const participant = buildSummaryParticipant();
      const report = {
        [`d_${fieldMapping.reports.physicalActivity.reportTS}`]: '2024-03-01T00:00:00Z',
      };
      mockApi({
        'GET retrievePhysicalActivityReport': () => jsonResponse({ code: 200, data: [report] }),
      });
      const html = await renderSummaryTabContent(participant, null);
      const cachedHtml = await renderSummaryTabContent(participant);

      expect(html).toContain('id="downloadPhysActReport"');
      expect(cachedHtml).toContain('id="downloadPhysActReport"');
      expect(fetchSpy).toHaveBeenCalledExactlyOnceWith(
        `${baseAPI}/dashboard?api=retrievePhysicalActivityReport&uid=summary-uid`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(reportsState.getReports()).toEqual({ physActReport: report });
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
      asyncHandlerTracker = trackAsyncEventHandlers();
      // Minimal edit modal skeleton to verify it is untouched by reset flow
      document.body.innerHTML = `
        <div id="navBarLinks"></div>
        <div id="mainContent"></div>
        <div id="modalShowMoreData"><div id="modalHeader">edit-modal-header</div><div id="modalBody"></div></div>
      `;
    });

    it('populates only the reset modal and leaves the edit modal intact', async () => {
      const participant = buildSummaryParticipant();
      const html = await renderSummaryTabContent(participant);
      expect(html).toContain('openResetDialog');
      document.getElementById('mainContent').innerHTML = html;

      await waitForFrame();

      const resetBtn = document.getElementById('openResetDialog');
      expect(resetBtn).not.toBeNull();

      // Click reset to trigger modal content
      resetBtn.click();
      await asyncHandlerTracker.allSettled();

      const resetModalHeader = document.getElementById('resetModalHeader');
      const resetModalBody = document.getElementById('resetModalBody');
      const editModalHeader = document.getElementById('modalHeader');

      expect(resetModalHeader.textContent).toContain('Confirm Participant Reset');
      expect(resetModalBody.textContent).toContain('reset this participant');
      expect(resetModalBody.querySelector('#resetUserBtn')).not.toBeNull();
      // Ensure the edit modal header is not changed by the reset flow
      expect(editModalHeader.textContent).toBe('edit-modal-header');
    });

    it('shows and hides the reset modal without Bootstrap', async () => {
      const participant = buildSummaryParticipant();
      const html = await renderSummaryTabContent(participant);
      // Simulate the page-level header plus the summary tab content
      document.getElementById('mainContent').innerHTML = `${renderParticipantHeader(participant)}${html}`;
      await waitForFrame();

      const resetBtn = document.getElementById('openResetDialog');
      expect(resetBtn).not.toBeNull();

      resetBtn.click();
      await asyncHandlerTracker.allSettled();
      const modalEl = document.getElementById('resetParticipantModal');
      expect(modalEl.classList.contains('show') || modalEl.style.display === 'block').toBe(true);

      const confirmBtn = document.getElementById('resetUserBtn');
      expect(confirmBtn).not.toBeNull();

      mockApi({
        'POST resetUser': () => jsonResponse({ code: 200, data: { data: participant } }),
        'GET getFilteredParticipants': () => jsonResponse({ code: 200, data: [{ ...participant, followups: [] }] }),
      });

      confirmBtn.click();
      await asyncHandlerTracker.allSettled();
      expect(modalEl.classList.contains('show')).toBe(false);
      expect(modalEl.style.display === '' || modalEl.style.display === 'none').toBe(true);

      expect(document.querySelector('.modal-backdrop')).toBeNull();
    });

    it.each([
      { mode: 'fresh', outcome: 'reloads fresh follow-up rows' },
      { mode: 'empty', outcome: 'accepts a confirmed empty follow-up lookup' },
      { mode: 'http-error', outcome: 'drops stale follow-up rows when the reload fails' },
      { mode: 'unavailable', outcome: 'warns when follow-up enrichment fails' },
    ])('refreshes the participant header and $outcome after a successful reset', async ({ mode }) => {
      const reloadFails = mode === 'http-error';
      const unavailable = reloadFails || mode === 'unavailable';
      const activity = {
        [fieldMapping.followups.activityRound]: 'A1',
        [fieldMapping.followups.activityType]: fieldMapping.followups.SSC,
      };
      const participant = buildSummaryParticipant({
        Connect_ID: 'OLD-CONNECT',
        followups: [{
          ...activity,
          surveyTracking: [{
            [fieldMapping.followups.surveyType]: fieldMapping.followups.bloodUrineMouthwashSurvey,
            [fieldMapping.followups.surveyStatus]: fieldMapping.surveyStatus.completed,
            [fieldMapping.followups.surveySubmittedAt]: '2024-06-01T00:00:00Z',
          }],
        }],
      });
      // The action returns a bare document; only the subsequent GET has fresh follow-up rows.
      const updatedParticipant = buildSummaryParticipant({
        Connect_ID: 'NEW-CONNECT',
        [fieldMapping.verficationDate]: '2025-02-02T00:00:00Z',
      });
      const followups = mode === 'fresh' ? [{ ...activity, surveyTracking: [] }] : [];
      const reloadedParticipant = mode === 'unavailable'
        ? updatedParticipant
        : { ...updatedParticipant, followups };

      if (reloadFails) {
        expectConsole('error', 'Unable to reload follow-up data. Using the action response. Error: Follow-up reload unavailable');
      }
      mockApi({
        'POST resetUser': () => jsonResponse({ code: 200, data: { data: updatedParticipant } }),
        'GET getFilteredParticipants': () => reloadFails
          ? jsonResponse({ message: 'Follow-up reload unavailable' }, { status: 503 })
          : jsonResponse({ code: 200, data: [reloadedParticipant] }),
      });
      const followupSurveyRow = () => [...document.querySelectorAll('.row-color-followup-dark')]
        .find(row => row.textContent.includes('Research B/U/M'));

      await participantState.setParticipant(participant);
      await searchState.setSearchResults({ searchType: 'lookup', token: participant.token }, [participant]);
      reportsState.setReports({ physActReport: { [`d_${fieldMapping.reports.physicalActivity.reportTS}`]: '2024-03-01T00:00:00Z' } });
      document.getElementById('mainContent').innerHTML = await renderSummaryTabContent(participant);
      await waitForFrame();
      expect(followupSurveyRow()?.textContent).toContain('Submitted');

      document.getElementById('openResetDialog').click();
      document.getElementById('resetUserBtn').click();
      await asyncHandlerTracker.allSettled();

      expect(fetchSpy).toHaveBeenCalledWith(
        `${baseAPI}/dashboard?api=resetUser`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ uid: participant.state.uid, saveToDb: 'true' }),
        }),
      );
      expect(fetchSpy).toHaveBeenCalledWith(
        `${baseAPI}/dashboard?api=getFilteredParticipants&token=${updatedParticipant.token}`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(participantState.getParticipant()).toMatchObject(updatedParticipant);
      expect(participantState.getParticipant().followups).toEqual(unavailable ? undefined : followups);
      expect(searchState.getSearchResults()).toBeNull();
      expect(reportsState.getReports()).toEqual({});
      expect(window.location.hash).toBe('#participantDetails/summary');
      expect(document.querySelector('#summary-tab')?.getAttribute('aria-selected')).toBe('true');
      expect(document.querySelector('.participant-header')?.textContent).toContain('NEW-CONNECT');
      if (mode !== 'fresh') {
        expect(followupSurveyRow()).toBeUndefined();
      } else {
        expect(followupSurveyRow()?.textContent).toContain('Not Started');
        expect(followupSurveyRow()?.textContent).not.toContain('Submitted');
      }
      if (unavailable) {
        expect(document.querySelector('.alert-warning')?.textContent).toContain('Saved. Reopen the participant to refresh follow-up data.');
        expect(document.querySelector('.alert-success')).toBeNull();
      } else {
        expect(document.querySelector('.alert-success')?.textContent).toContain('Success! Participant Reset.');
        expect(document.querySelector('.alert-warning')).toBeNull();
      }
      expect(document.querySelector('.alert-danger')).toBeNull();
    });

    // The override endpoint returns no participant, so reload through the enriched lookup.
    it.each(['loaded', 'http-error', 'unavailable'])('handles a saved test data override with %s follow-up data', async (mode) => {
      const participant = buildSummaryParticipant();
      const followups = [{
        [fieldMapping.followups.activityRound]: 'A2',
        [fieldMapping.followups.activityType]: fieldMapping.followups.SSC,
      }];
      const verificationDate = '2024-06-01T04:00:00.000Z';
      const correction = {
        token: participant.token,
        [fieldMapping.verficationDate]: verificationDate,
        [fieldMapping.userProfileDateTime]: verificationDate,
        [fieldMapping.consentDate]: verificationDate,
        [fieldMapping.hipaaDate]: verificationDate,
      };
      const updatedParticipant = {
        ...participant, ...correction,
        ...(mode === 'loaded' ? { followups } : {}),
      };
      await participantState.setParticipant(participant);
      await searchState.setSearchResults({ searchType: 'lookup', token: participant.token }, [participant]);
      reportsState.setReports({ physActReport: { [`d_${fieldMapping.reports.physicalActivity.reportTS}`]: '2024-03-01T00:00:00Z' } });
      if (mode === 'http-error') {
        expectConsole('error', 'Error in refreshParticipantAfterDateOverride: Error: Lookup unavailable');
      }
      mockApi({
        'POST participantDataCorrection': () => jsonResponse({ code: 200 }),
        'GET getFilteredParticipants': () => mode === 'http-error'
          ? jsonResponse({ message: 'Lookup unavailable' }, { status: 503 })
          : jsonResponse({ code: 200, data: [updatedParticipant] }),
      });

      document.getElementById('mainContent').innerHTML = await renderSummaryTabContent(participant);
      await waitForFrame();
      expect(document.querySelector('.row-color-followup-light')).toBeNull();

      document.getElementById('openDataOverrideDialog').click();
      document.getElementById('verificationDateInput').value = '2024-06-01';
      document.getElementById('dataOverrideBtn').click();
      await asyncHandlerTracker.allSettled();

      expect(fetchSpy).toHaveBeenCalledWith(
        `${baseAPI}/dashboard?api=participantDataCorrection`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ data: [correction] }) }),
      );
      expect(fetchSpy).toHaveBeenCalledWith(
        `${baseAPI}/dashboard?api=getFilteredParticipants&token=${participant.token}`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(searchState.getSearchResults()).toBeNull();
      expect(reportsState.getReports()).toEqual(mode === 'http-error' ? null : {});
      expect(participantState.getParticipant()).toMatchObject(mode === 'http-error' ? participant : updatedParticipant);
      if (mode !== 'http-error') {
        expect(window.location.hash).toBe('#participantDetails/summary');
        expect(document.querySelector('#summary-tab')?.getAttribute('aria-selected')).toBe('true');
        expect(document.querySelector('.participant-header')?.textContent).toContain(participant.Connect_ID);
      }
      if (mode === 'loaded') {
        expect(document.querySelector('.row-color-followup-light')?.textContent).toContain('A2');
        expect(document.querySelector('.alert-success')?.textContent).toContain('Success! Participant Data Overridden.');
      } else {
        expect(document.querySelector('.row-color-followup-light')).toBeNull();
        const warningMessage = mode === 'http-error'
          ? 'Date override saved, but the displayed participant information may be out of date. Reopen the participant to refresh it.'
          : 'Saved. Reopen the participant to refresh follow-up data.';
        expect(document.querySelector('.alert-warning')?.textContent).toContain(warningMessage);
        expect(document.querySelector('.alert-success')).toBeNull();
      }
      expect(document.querySelector('.alert-danger')).toBeNull();
    });
    it('reports a failed test data write without attempting a participant reload', async () => {
      const participant = buildSummaryParticipant();
      await participantState.setParticipant(participant);
      await searchState.setSearchResults({ searchType: 'lookup', token: participant.token }, [participant]);
      const cachedReports = { physActReport: { [`d_${fieldMapping.reports.physicalActivity.reportTS}`]: '2024-03-01T00:00:00Z' } };
      reportsState.setReports(cachedReports);
      mockApi({
        'POST participantDataCorrection': () => jsonResponse({ message: 'Write failed' }, { status: 500 }),
      });
      expectConsole('error', 'Error in postResetUserData: Error: 500: Write failed');
      expectConsole('error', 'error Error: 500: Write failed');
      document.getElementById('mainContent').innerHTML = await renderSummaryTabContent(participant);
      await waitForFrame();

      document.getElementById('openDataOverrideDialog').click();
      document.getElementById('verificationDateInput').value = '2024-06-01';
      document.getElementById('dataOverrideBtn').click();
      await asyncHandlerTracker.allSettled();

      expect(participantState.getParticipant()).toMatchObject(participant);
      expect(searchState.getSearchResults()).not.toBeNull();
      expect(reportsState.getReports()).toEqual(cachedReports);
      expect(fetchSpy.mock.calls.some(([url]) => url.includes('api=getFilteredParticipants'))).toBe(false);
      expect(document.querySelector('.alert-danger')?.textContent).toContain('Error resetting participant');
      expect(document.querySelector('.alert-warning')).toBeNull();
      expect(document.querySelector('.alert-success')).toBeNull();
    });
  });

});
