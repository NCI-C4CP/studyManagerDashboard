import { expect } from 'chai';
import { setupTestEnvironment, teardownTestEnvironment, installFirebaseStub, createDOMFixture, cleanupDOMFixture, clearAllState, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import { searchState } from '../src/stateManager.js';
import { setParticipantLookupNavRequest } from '../src/navigationBar.js';

describe('router', function () {
  this.timeout(5000);
  let firebaseStub;
  let mainContent;
  let navBarLinks;

  const loadRouter = async () => {
    const module = await import('../index.js');
    return module.router;
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
});
