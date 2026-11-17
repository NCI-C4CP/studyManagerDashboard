import { setupTestEnvironment, teardownTestEnvironment, installFirebaseStub, createDOMFixture, cleanupDOMFixture, clearAllState, createMockParticipant, mockApi, jsonResponse, expectConsole } from './helpers.js';
import * as stateManagerModule from '../src/stateManager.js';
import * as utilsModule from '../src/utils.js';
import { setParticipantLookupNavRequest } from '../src/navigationBar.js';

describe('router', () => {
  let firebaseStub;
  let mainContent;
  let navBarLinks;
  const stateManager = stateManagerModule?.default ?? stateManagerModule;
  const { searchState, participantState, roleState } = stateManager;

  const routeTo = async (hash) => {
    const { router } = await import('../index.js');
    // These tests invoke the router directly, so browser events should not invoke it too.
    window.onload = null;
    window.onhashchange = null;
    window.history.replaceState(null, null, hash);
    await router();
  };

  beforeEach(async () => {
    setupTestEnvironment();
    firebaseStub = installFirebaseStub({ uid: 'test-user' });
    await clearAllState();
    await roleState.setRoleFlags({ isSiteManager: true });
    setParticipantLookupNavRequest(false);
    mainContent = createDOMFixture('mainContent');
    navBarLinks = createDOMFixture('navBarLinks');
  });

  afterEach(() => {
    searchState.clearSearchResults();
    cleanupDOMFixture(mainContent);
    cleanupDOMFixture(navBarLinks);
    teardownTestEnvironment();
  });

  it('restores cached lookup results when revisiting participantLookup without nav intent', async () => {
    const metadata = {
      searchType: 'lookup',
      token: 'abc-123',
      pageNumber: 1,
      direction: '',
      cursorHistory: [],
    };
    const participants = [createMockParticipant('lookup-1', { token: 'abc-123' })];
    await searchState.setSearchResults(metadata, participants);

    await routeTo('#participantLookup');

    const rows = mainContent.querySelectorAll('#dataTable tbody tr');
    expect(rows).toHaveLength(1);
    expect(rows[0].querySelector('.select-participant')?.dataset.token).toBe(participants[0].token);
    expect(mainContent.querySelector('#search')).toBeNull();
  });

  it('shows fresh lookup form when nav intent is set', async () => {
    const metadata = {
      searchType: 'lookup',
      token: 'abc-123',
      pageNumber: 1,
      direction: '',
      cursorHistory: [],
    };
    const participants = [createMockParticipant('lookup-1', { token: 'abc-123' })];
    await searchState.setSearchResults(metadata, participants);

    setParticipantLookupNavRequest(true);
    await routeTo('#participantLookup');

    expect(mainContent.querySelector('#search')).not.toBeNull();
    expect(mainContent.querySelector('#searchId')).not.toBeNull();
    expect(mainContent.querySelector('#dataTable')).toBeNull();
    expect(searchState.getSearchResults()).toBeNull();
  });

  it('redirects unauthenticated users to login route', async () => {
    firebaseStub.setUid(null);
    await routeTo('#home');

    expect(window.location.hash).toBe('#login');
  });

  it('signs out after an authorization denial before rendering a protected route', async () => {
    roleState.clear();
    expectConsole('error', 'Authorization request failed: 401');
    expectConsole('error', 'User is not authorized to access dashboard. Signing out...');
    const fetchMock = mockApi({
      'GET validateSiteUsers': () => jsonResponse({ code: 401 }, { status: 401 }),
    });

    await routeTo('#participantLookup');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(firebaseStub.currentUser).toBeNull();
    expect(mainContent.childElementCount).toBe(0);
  });

  describe('participant details routing', () => {
    const expectActiveParticipantTab = (tabId) => {
      const activeTabs = [...mainContent.querySelectorAll('.participant-tabs .nav-link.active')];
      const activePanes = [...mainContent.querySelectorAll('.participant-tab-content > .tab-pane.active')];
      expect(activeTabs.map(({ id }) => id)).toEqual([`${tabId}-tab`]);
      expect(activeTabs[0].getAttribute('aria-selected')).toBe('true');
      expect(activePanes.map(({ id }) => id)).toEqual([`${tabId}-content`]);
    };

    beforeEach(async () => {
      const participant = createMockParticipant('test-123', { token: 'abc-123' });
      await participantState.setParticipant(participant);
      await roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });
    });

    afterEach(() => {
      participantState.clearParticipant();
    });

    it('renders Details for the participant route without a tab', async () => {
      await routeTo('#participantDetails');

      expectActiveParticipantTab('details');
      expect(mainContent.querySelector('#details-content .detailsTable')).not.toBeNull();
    });

    it('renders Summary when opened directly', async () => {
      mockApi({
        'GET retrievePhysicalActivityReport': jsonResponse({ code: 200, data: [] }),
      });
      await routeTo('#participantDetails/summary');

      expectActiveParticipantTab('summary');
      expect(mainContent.querySelector('#summary-content').textContent).toContain('Participant Summary');
    });

    it('renders the Withdrawal form for a parent user', async () => {
      await routeTo('#participantDetails/withdrawal');

      expectActiveParticipantTab('withdrawal');
      expect(mainContent.querySelector('#withdrawal-content #formMainPage')).not.toBeNull();
    });

    it('renders Data Corrections for a help desk user', async () => {
      await roleState.setRoleFlags({ isSiteManager: false, isParent: false, helpDesk: true });
      await routeTo('#participantDetails/dataCorrections');

      expectActiveParticipantTab('dataCorrections');
      expect(mainContent.querySelector('#dataCorrections-content #dataCorrectionsToolContainer')).not.toBeNull();
    });

    it('falls back to Details for an unknown tab', async () => {
      await routeTo('#participantDetails/unknown');

      expectActiveParticipantTab('details');
      expect(mainContent.querySelector('#details-content .detailsTable')).not.toBeNull();
    });

    it.each(['withdrawal', 'dataCorrections'])('falls back to Details when the user cannot open %s', async (tabId) => {
      await roleState.setRoleFlags({ isParent: false });
      await routeTo(`#participantDetails/${tabId}`);

      expectActiveParticipantTab('details');
      expect(mainContent.querySelector(`#${tabId}-tab`)).toBeNull();
      expect(mainContent.querySelector(`#${tabId}-content`)).toBeNull();
    });

    it('restores the committed participant-details route when unsaved navigation is cancelled', async () => {
      vi.stubGlobal('history', window.history);
      await routeTo('#participantDetails');
      expect(mainContent.querySelector('.participant-tabs')).not.toBeNull();

      stateManager.appState.setState({ hasUnsavedChanges: true });
      const confirmSpy = vi.spyOn(utilsModule, 'showConfirmModal').mockResolvedValue(false);

      await routeTo('#home');

      expect(window.location.hash).toBe('#participantDetails');
      expect(confirmSpy).toHaveBeenCalledOnce();
    });
  });

  describe('#mySamples route', () => {
    const mockSampleRecords = (records) => mockApi({
      'GET getAllMySamples': () => jsonResponse({ code: 200, data: records }),
    });

    beforeEach(() => {
      mockSampleRecords([{
        id: 'site-1',
        siteAcronym: 'NCI',
        siteName: 'National Cancer Institute',
        saved: null,
        published: { en: 'Hello', es: 'Hola' },
      }]);
    });

    afterEach(() => {
      stateManager.appState.setState({ mySamples: null });
    });

    it('renders My Samples page for #mySamples route', async () => {
      await routeTo('#mySamples');

      expect(mainContent.innerHTML).toContain('My Samples');
    });

    it('renders site cards when data is returned', async () => {
      await routeTo('#mySamples');

      expect(mainContent.innerHTML).toContain('Site: National Cancer Institute');
      expect(mainContent.innerHTML).toContain('Activity Type: Baseline');
    });

    it('sorts a legacy Baseline template before SSC for the same site', async () => {
      mockSampleRecords([{
        id: 'site-ssc',
        siteAcronym: 'NCI',
        siteName: 'National Cancer Institute',
        activityType: 'SSC',
        saved: null,
        published: { en: 'SSC', es: 'SSC' },
      }, {
        id: 'site-baseline',
        siteAcronym: 'NCI',
        siteName: 'National Cancer Institute',
        saved: null,
        published: { en: 'Baseline', es: 'Baseline' },
      }]);

      await routeTo('#mySamples');

      const activityTypes = [...document.querySelectorAll('.card-title')]
        .map(element => element.textContent.trim());
      expect(activityTypes).toEqual([
        'Activity Type: Baseline',
        'Activity Type: SSC',
      ]);
    });

    it('renders empty state when no data is returned', async () => {
      mockSampleRecords([]);

      await routeTo('#mySamples');

      expect(mainContent.innerHTML).toContain('My Samples Data Not Found');
    });
  });

  describe('#generateServiceAccountKey route', () => {
    beforeEach(async () => {
      await roleState.setRoleFlags({ isSiteManager: true, helpDesk: false, coordinatingCenter: false, isEHRUploader: false, isServiceAccountManager: true });
      mockApi({
        'GET listServiceAccountKeys': () => jsonResponse({ code: 200, data: { keys: [] } }),
      });
    });

    it('renders the API Key Generator page', async () => {
      await routeTo('#generateServiceAccountKey');

      expect(mainContent.innerHTML).toContain('API Key Generator');
      expect(mainContent.innerHTML).toContain('generateKeyBtn');
    });

    it('displays active keys table when keys exist', async () => {
      mockApi({
        'GET listServiceAccountKeys': () => jsonResponse({ code: 200, data: { keys: [
          { keyId: 'abc123def456', createdAt: '2026-07-01T00:00:00Z', expiresAt: '2026-10-01T00:00:00Z', isLegacy: false }
        ] } }),
      });

      await routeTo('#generateServiceAccountKey');

      expect(mainContent.innerHTML).toContain('abc123def456');
    });

    it('renders the page for delegated site users', async () => {
      await roleState.setRoleFlags({ isSiteManager: false, helpDesk: false, coordinatingCenter: false, isEHRUploader: false, isDelegatedSiteUser: true, isServiceAccountManager: true });

      await routeTo('#generateServiceAccountKey');

      expect(mainContent.innerHTML).toContain('API Key Generator');
      expect(mainContent.innerHTML).toContain('generateKeyBtn');
    });

    it('shows a contact message when the site has no service account configured', async () => {
      await roleState.setRoleFlags({ isSiteManager: true, isServiceAccountManager: false, acronym: 'CGR' });

      await routeTo('#generateServiceAccountKey');

      expect(mainContent.innerHTML).toContain('No service account is configured for CGR');
      expect(mainContent.innerHTML).not.toContain('generateKeyBtn');
    });
  });

  describe('delegated site user route lockdown', () => {
    beforeEach(async () => {
      await roleState.setRoleFlags({ isSiteManager: false, helpDesk: false, coordinatingCenter: false, isEHRUploader: false, isDelegatedSiteUser: true, isServiceAccountManager: true });
    });

    it('redirects restricted routes to home', async () => {
      await routeTo('#participants/all');

      expect(window.location.hash).toBe('#home');
    });

    it('shows the limited access message on home', async () => {
      await routeTo('#home');

      expect(mainContent.innerHTML).toContain('limited access to the Connect Study Manager Dashboard for API key management');
    });
  });

});
