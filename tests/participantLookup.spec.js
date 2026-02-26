import {
  renderParticipantLookup,
  renderCachedSearchResults,
  rebuildQueryString,
} from '../src/participantLookup.js';
import { searchState } from '../src/stateManager.js';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  installFirebaseStub,
  createMockParticipant,
  createDOMFixture,
  cleanupDOMFixture,
  clearAllState,
} from './helpers.js';

describe('participantLookup', () => {
  let firebaseStub;
  let mainContent;

  beforeEach(async () => {
    setupTestEnvironment();
    firebaseStub = installFirebaseStub({ uid: 'test-user' });
    await clearAllState();
    mainContent = createDOMFixture('mainContent');
    createDOMFixture('navBarLinks');
  });

  afterEach(() => {
    searchState.clearSearchResults();
    cleanupDOMFixture(mainContent);
    teardownTestEnvironment();
  });

  it('clears cached lookup results and renders the lookup form', async () => {
    const metadata = {
      searchType: 'lookup',
      firstName: 'ana',
      lastName: 'smith',
      pageNumber: 1,
      direction: '',
      cursorHistory: [],
    };
    await searchState.setSearchResults(metadata, [createMockParticipant('test-1')]);

    expect(searchState.getSearchResults()).not.toBe(null);

    renderParticipantLookup();

    expect(searchState.getSearchResults()).toBe(null);
    expect(document.getElementById('search')).not.toBe(null);
    expect(document.getElementById('searchId')).not.toBe(null);
    firebaseStub.setUid('test-user');
  });

  it('restores cached lookup results on renderCachedSearchResults', async () => {
    const metadata = {
      searchType: 'lookup',
      token: 'abc-123',
      pageNumber: 1,
      direction: '',
      cursorHistory: [],
    };
    const participants = [createMockParticipant('lookup-1', { token: 'abc-123' })];
    await searchState.setSearchResults(metadata, participants);

    await renderCachedSearchResults();

    const table = document.getElementById('dataTable');
    expect(table).not.toBe(null);
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(participants.length);
    const backToSearch = document.getElementById('back-to-search');
    expect(backToSearch).not.toBe(null);
  });

  it('rebuilds query strings from lookup metadata', () => {
    const metadata = {
      firstName: 'ana',
      lastName: 'smith',
      dob: '1990-01-02',
      phone: '(123) 456-7890',
      email: 'ana@example.com',
      connectId: '12345',
      token: 'tkn-1',
      studyId: 'std-2',
    };
    const query = rebuildQueryString(metadata);

    expect(query).toContain('firstName=ana');
    expect(query).toContain('lastName=smith');
    expect(query).toContain('dob=19900102');
    expect(query).toContain('phone=1234567890');
    expect(query).toContain('email=ana%40example.com');
    expect(query).toContain('connectId=12345');
    expect(query).toContain('token=tkn-1');
    expect(query).toContain('studyId=std-2');
  });
});
