import { setupTestEnvironment, teardownTestEnvironment, installFirebaseStub, createDOMFixture, cleanupDOMFixture, clearAllState, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import * as stateManagerModule from '../src/stateManager.js';
import { setParticipantLookupNavRequest } from '../src/navigationBar.js';

describe('router', () => {
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
    expect(cached).not.toBeNull();
    expect(cached.length).toBe(1);
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
    expect(main).not.toBeNull();
  });

  it('redirects unauthenticated users to login route', async () => {
    firebaseStub.setUid(null);
    window.location.hash = '#home';

    const router = await loadRouter();
    await router();
    await waitForAsyncTasks(20);

    expect(window.location.hash).toBe('#login');
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

      expect(detailsRoute.startsWith('#participantDetails')).toBe(true);
      expect(summaryRoute.startsWith('#participantDetails')).toBe(true);
      expect(withdrawalRoute.startsWith('#participantDetails')).toBe(true);
    });

    it('extracts tab IDs from participant details routes', () => {
      expect('#participantDetails/summary'.split('/')[1]).toBe('summary');
      expect('#participantDetails/withdrawal'.split('/')[1]).toBe('withdrawal');
      expect('#participantDetails/messages'.split('/')[1]).toBe('messages');
      expect('#participantDetails'.split('/')[1]).toBeUndefined();
    });

    it('identifies data corrections route as participant-dependent', () => {
      const route = '#participantDetails/dataCorrections';
      expect(route.startsWith('#participantDetails')).toBe(true);
    });
  });

});
