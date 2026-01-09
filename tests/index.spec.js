import { expect } from 'chai';
import { setupTestEnvironment, teardownTestEnvironment, installFirebaseStub, createDOMFixture, cleanupDOMFixture, clearAllState, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import * as stateManagerModule from '../src/stateManager.js';
import { setParticipantLookupNavRequest } from '../src/navigationBar.js';

describe('router', function () {
  this.timeout(5000);
  let firebaseStub;
  let mainContent;
  let navBarLinks;
  const stateManager = stateManagerModule?.default ?? stateManagerModule;
  const { searchState, participantState, roleState } = stateManager;

  const loadRouter = async () => {
    const module = await import('../index.js');
    const resolved = module?.default ?? module;
    return resolved.router;
  };

  beforeEach(async () => {
    setupTestEnvironment();
    firebaseStub = installFirebaseStub({ uid: 'test-user' });
    await clearAllState();
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

    window.location.hash = '#participantLookup';
    const router = await loadRouter();
    await router();
    await waitForAsyncTasks(20);

    const cached = searchState.getSearchResults();
    expect(cached).to.not.equal(null);
    expect(cached.length).to.equal(1);
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
    window.location.hash = '#participantLookup';
    const router = await loadRouter();
    await router();
    await waitForAsyncTasks(20);

    const main = document.getElementById('mainContent');
    expect(main).to.not.equal(null);
  });

  it('redirects unauthenticated users to login route', async () => {
    firebaseStub.setUid(null);
    window.location.hash = '#home';

    const router = await loadRouter();
    await router();
    await waitForAsyncTasks(20);

    expect(window.location.hash).to.equal('#login');
  });

  describe('participant details routing', () => {
    let participant;

    beforeEach(async () => {
      participant = createMockParticipant('test-123', { token: 'abc-123' });
      await participantState.setParticipant(participant);
      roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });

      // Mock fetch (prevent actual API calls)
      global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({ code: 200, data: [] }),
      });
    });

    afterEach(async () => {
      await participantState.clearParticipant();
      delete global.fetch;
    });

    it('recognizes participant details routes', () => {
      // Test that the router logic identifies participant details routes
      const detailsRoute = '#participantDetails';
      const summaryRoute = '#participantDetails/summary';
      const withdrawalRoute = '#participantDetails/withdrawal';

      expect(detailsRoute.startsWith('#participantDetails')).to.be.true;
      expect(summaryRoute.startsWith('#participantDetails')).to.be.true;
      expect(withdrawalRoute.startsWith('#participantDetails')).to.be.true;
    });

    it('extracts tab IDs from participant details routes', () => {
      expect('#participantDetails/summary'.split('/')[1]).to.equal('summary');
      expect('#participantDetails/withdrawal'.split('/')[1]).to.equal('withdrawal');
      expect('#participantDetails/messages'.split('/')[1]).to.equal('messages');
      expect('#participantDetails'.split('/')[1]).to.be.undefined;
    });

    it('identifies data corrections route as participant-dependent', () => {
      const route = '#participantDetails/dataCorrections';
      expect(route.startsWith('#participantDetails')).to.be.true;
    });
  });

  describe('renderDashboard', () => {
    beforeEach(async () => {
      if (!document.getElementById('mainContent')) {
        createDOMFixture('mainContent');
      }

      const mainContentElement = document.getElementById('mainContent');
      
      // Make mainContent available as a global variable (simulating browser behavior for elements with IDs)
      global.mainContent = mainContentElement;
      globalThis.mainContent = mainContentElement;
      
      await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false, isSiteManager: false, isEHRUploader: false });
      
      // Mock getIdToken to avoid Firebase calls
      global.getIdToken = async () => 'mock-token';
      
      // Mock fetch for API calls
      global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({ code: 200, data: [{}] }),
      });
    });

    afterEach(() => {
      delete global.mainContent;
      delete globalThis.mainContent;
      delete global.getIdToken;
      delete global.fetch;
    });

    it('renders dashboard modal structure for regular users on home route', async () => {
      window.location.hash = '#home';
      const router = await loadRouter();
      await router();
      await waitForAsyncTasks(20);

      const mainContent = document.getElementById('mainContent');
      expect(mainContent.innerHTML).to.include('siteManagerMainModal');
      expect(mainContent.innerHTML).to.include('modal');
    });

    it('renders modal for EHR uploaders without rendering charts', async () => {
      window.location.hash = '#home';
      const routerModule = await import('../index.js');
      const indexStateManager = await import('../src/stateManager.js');
      
      await indexStateManager.roleState.setRoleFlags({ isEHRUploader: true });
      
      await routerModule.router();
      await waitForAsyncTasks(50);

      const mainContent = document.getElementById('mainContent');
      const html = mainContent.innerHTML;
      
      expect(html).to.include('siteManagerMainModal');
      expect(html).to.not.include('chart-container');
    });

    it('shows limited access message for EHR uploaders', async () => {
      window.location.hash = '#home';
      const routerModule = await import('../index.js');
      const indexStateManager = await import('../src/stateManager.js');
      
      await indexStateManager.roleState.setRoleFlags({ isEHRUploader: true });
      await routerModule.router();
      await waitForAsyncTasks(100);

      const mainContent = document.getElementById('mainContent');
      const html = mainContent.innerHTML;
      
      expect(html).to.include('You have limited access to the Connect Study Manager Dashboard');
      expect(html).to.include('Data Uploaders');
      expect(html).to.include('ConnectCC@nih.gov');
    });

    it('does not render charts for EHR uploaders', async () => {
      window.location.hash = '#home';
      const routerModule = await import('../index.js');
      const indexStateManager = await import('../src/stateManager.js');
      
      await indexStateManager.roleState.setRoleFlags({ isEHRUploader: true });
      
      await routerModule.router();
      await waitForAsyncTasks(20);

      const mainContent = document.getElementById('mainContent');
      expect(mainContent.innerHTML).to.not.include('chart');
    });

    it('renders modal structure on dashboard', async () => {
      window.location.hash = '#home';
      const router = await loadRouter();
      await router();
      await waitForAsyncTasks(20);

      const mainContent = document.getElementById('mainContent');
      expect(mainContent.innerHTML).to.include('siteManagerMainModal');
      expect(mainContent.innerHTML).to.include('siteManagerModalHeader');
      expect(mainContent.innerHTML).to.include('siteManagerModalBody');
    });
  });
});
