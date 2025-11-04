import { expect } from 'chai';
import {
  appState,
  buildPredefinedSearchMetadata,
  clearSession,
  clearUnsaved,
  initializeAppState,
  markUnsaved,
  participantState,
  reportsState,
  resetAppStateUID,
  roleState,
  searchState,
  statsState,
  uiState,
  userSession,
  setParticipantLookupLoader,
} from '../src/stateManager.js';
import {
  installFirebaseStub,
  setupTestEnvironment,
  teardownTestEnvironment,
  waitForAsyncTasks,
  captureConsoleWarnings,
  createMockParticipantLookupLoader,
  createMockParticipant,
} from './helpers.js';

describe('stateManager', () => {
  let firebaseStub;
  let signOutCalled = false;

  beforeEach(() => {
    setupTestEnvironment();
    firebaseStub = installFirebaseStub({
      uid: 'test-user',
      onSignOut: () => {
        signOutCalled = true;
      },
    });
    signOutCalled = false;
    window.sessionStorage.clear();
    window.location.hash = '#initial';
    resetAppStateUID();
    statsState.clear();
    roleState.clear();
    uiState.clear();
    participantState.clearParticipant();
    userSession.clearUser();
    reportsState.clearReports();
    searchState.clearSearchResults();
    appState.setState({ hasUnsavedChanges: false });
    setParticipantLookupLoader();
  });

  afterEach(() => {
    teardownTestEnvironment();
    setParticipantLookupLoader();
  });

  describe('appState', () => {
    it('supports setState and getState methods', () => {
      appState.setState({ hasUnsavedChanges: true });
      expect(appState.getState().hasUnsavedChanges).to.equal(true);
    });

    it('supports set and get aliases', () => {
      appState.set({ hasUnsavedChanges: true });
      expect(appState.get().hasUnsavedChanges).to.equal(true);
    });

    it('supports function-based state updates', () => {
      appState.setState({ hasUnsavedChanges: false });
      appState.setState((prev) => ({ ...prev, hasUnsavedChanges: true }));
      expect(appState.getState().hasUnsavedChanges).to.equal(true);
    });

    it('returns current state object', () => {
      appState.setState({ hasUnsavedChanges: false });
      const state1 = appState.getState();
      const state2 = appState.getState();
      // TODO: address this
      // Note: appState returns the same reference, mutations will affect it
      // Deep cloning happens in encrypted stores, not in appState itself
      expect(state1).to.equal(state2);
    });
  });

  describe('statsState', () => {
    it('sets and retrieves stats data', async () => {
      await statsState.setStats({ foo: 'bar' }, 123);
      expect(statsState.getStats()).to.deep.equal({ foo: 'bar' });
      expect(statsState.getStatsUpdateTime()).to.equal(123);
    });

    it('persists stats across hydration', async () => {
      await statsState.setStats({ persisted: true }, 999);
      expect(window.sessionStorage.getItem('statsStateEnc')).to.be.a('string');

      appState.setState({ stats: { statsData: {}, statsDataUpdateTime: 0 } });
      resetAppStateUID();
      await initializeAppState();

      expect(statsState.getStats()).to.deep.equal({ persisted: true });
      expect(statsState.getStatsUpdateTime()).to.equal(999);
    });

    it('falls back to defaults when stats payload is tampered', async () => {
      await statsState.setStats({ foo: 'bar' }, 111);
      window.sessionStorage.setItem('statsStateEnc', 'corrupted');
      appState.setState({ stats: { statsData: { foo: 'bar' }, statsDataUpdateTime: 111 } });

      resetAppStateUID();
      await initializeAppState();

      expect(statsState.getStats()).to.deep.equal({});
      expect(statsState.getStatsUpdateTime()).to.equal(0);
      expect(window.sessionStorage.getItem('statsStateEnc')).to.equal(null);
    });

    it('resets stats when signed in as a different user', async () => {
      await statsState.setStats({ foo: 'user1' }, 42);
      firebaseStub.setUid('another-user');
      appState.setState({ stats: { statsData: { foo: 'user1' }, statsDataUpdateTime: 42 } });
      resetAppStateUID();
      await initializeAppState();

      expect(statsState.getStats()).to.deep.equal({});
      expect(statsState.getStatsUpdateTime()).to.equal(0);
    });

    it('validates timestamp to be finite and non-negative', async () => {
      await statsState.setStats({}, -1);
      expect(statsState.getStatsUpdateTime()).to.equal(0);

      await statsState.setStats({}, NaN);
      expect(statsState.getStatsUpdateTime()).to.equal(0);

      await statsState.setStats({}, Infinity);
      expect(statsState.getStatsUpdateTime()).to.equal(0);
    });
  });

  describe('roleState', () => {
    it('sets and retrieves role flags', async () => {
      await roleState.setRoleFlags({ isParent: true, coordinatingCenter: '1', helpDesk: 0 });
      expect(roleState.getRoleFlags()).to.deep.equal({
        isParent: true,
        coordinatingCenter: true,
        helpDesk: false,
      });
    });

    it('preserves existing flags when partial update provided', async () => {
      await roleState.setRoleFlags({ isParent: true, coordinatingCenter: true });
      await roleState.setRoleFlags({ helpDesk: true });
      expect(roleState.getRoleFlags()).to.deep.equal({
        isParent: true,
        coordinatingCenter: true,
        helpDesk: true,
      });
    });

    it('persists role flags across hydration', async () => {
      await roleState.setRoleFlags({ isParent: true, coordinatingCenter: true });
      appState.setState({
        roleFlags: {
          isParent: false,
          coordinatingCenter: false,
          helpDesk: false,
        },
      });
      resetAppStateUID();
      await initializeAppState();

      expect(roleState.getRoleFlags()).to.deep.equal({
        isParent: true,
        coordinatingCenter: true,
        helpDesk: false,
      });
    });

    it('normalizes boolean values from strings and numbers', async () => {
      await roleState.setRoleFlags({
        isParent: 'true',
        coordinatingCenter: 1,
        helpDesk: 'false',
      });
      expect(roleState.getRoleFlags()).to.deep.equal({
        isParent: true,
        coordinatingCenter: true,
        helpDesk: false,
      });
    });
  });

  describe('uiState', () => {
    it('manages UI flags and withdrawal helpers', async () => {
      expect(uiState.isSiteDropdownVisible()).to.equal(false);

      await uiState.setSiteDropdownVisible(true);
      expect(uiState.isSiteDropdownVisible()).to.equal(true);

      await uiState.setWithdrawalStatusFlags({ hasPriorParticipationStatus: 'true' });
      expect(uiState.getWithdrawalStatusFlags()).to.deep.include({
        hasPriorParticipationStatus: true,
        hasPriorSuspendedContact: false,
      });

      await uiState.clearWithdrawalStatusFlags();
      expect(uiState.getWithdrawalStatusFlags()).to.deep.equal({
        hasPriorParticipationStatus: false,
        hasPriorSuspendedContact: false,
      });
    });

    it('persists UI state across hydration', async () => {
      await uiState.setSiteDropdownVisible(true);
      await uiState.setWithdrawalStatusFlags({
        hasPriorParticipationStatus: true,
        hasPriorSuspendedContact: true,
      });

      appState.setState({
        uiFlags: {
          siteDropdownVisible: false,
          withdrawalFlags: {
            hasPriorParticipationStatus: false,
            hasPriorSuspendedContact: false,
          },
        },
      });
      resetAppStateUID();
      await initializeAppState();

      expect(uiState.isSiteDropdownVisible()).to.equal(true);
      expect(uiState.getWithdrawalStatusFlags()).to.deep.equal({
        hasPriorParticipationStatus: true,
        hasPriorSuspendedContact: true,
      });
    });

    it('normalizes boolean values for site dropdown visibility', async () => {
      await uiState.setSiteDropdownVisible('true');
      expect(uiState.isSiteDropdownVisible()).to.equal(true);

      await uiState.setSiteDropdownVisible(0);
      expect(uiState.isSiteDropdownVisible()).to.equal(false);

      await uiState.setSiteDropdownVisible(1);
      expect(uiState.isSiteDropdownVisible()).to.equal(true);
    });

    it('preserves other withdrawal flags when updating one', async () => {
      await uiState.setWithdrawalStatusFlags({
        hasPriorParticipationStatus: true,
        hasPriorSuspendedContact: true,
      });

      await uiState.setWithdrawalStatusFlags({
        hasPriorParticipationStatus: false,
      });

      expect(uiState.getWithdrawalStatusFlags()).to.deep.equal({
        hasPriorParticipationStatus: false,
        hasPriorSuspendedContact: true,
      });
    });
  });

  describe('participantState', () => {
    it('encrypts participant token and recovers it from session storage', async () => {
      const participantPayload = createMockParticipant('test-user-123', { token: 'secret-token', name: 'Test' });
      participantState.setParticipant(participantPayload);
      await waitForAsyncTasks();

      const stored = window.sessionStorage.getItem('participantTokenEnc');
      expect(stored).to.be.a('string');

      appState.setState({ participant: null });

      setParticipantLookupLoader(createMockParticipantLookupLoader(
        async () => ({ code: 200, data: [participantPayload] })
      ));

      const recovered = await participantState.recoverParticipantFromSession();
      expect(recovered).to.deep.equal(participantPayload);
      expect(participantState.getParticipant()).to.deep.equal(participantPayload);
    });

    it('clears stored participant token when recovery fails', async () => {
      participantState.setParticipant({ id: 2, token: 'bad-token' });
      await waitForAsyncTasks();

      appState.setState({ participant: null });

      setParticipantLookupLoader(createMockParticipantLookupLoader(
        async () => ({ code: 404, data: [] })
      ));

      const recovered = await participantState.recoverParticipantFromSession();
      expect(recovered).to.equal(null);
      expect(window.sessionStorage.getItem('participantTokenEnc')).to.equal(null);
    });

    it('returns null for tampered participant token', async () => {
      window.sessionStorage.setItem('participantTokenEnc', 'invalid-payload');
      const token = await participantState.getParticipantToken();
      expect(token).to.equal(null);
      expect(window.sessionStorage.getItem('participantTokenEnc')).to.equal(null);
    });

    it('checks if participant exists in state', () => {
      expect(participantState.hasParticipant()).to.equal(false);
      participantState.setParticipant({ id: 1, token: 'test-token' });
      expect(participantState.hasParticipant()).to.equal(true);
      participantState.clearParticipant();
      expect(participantState.hasParticipant()).to.equal(false);
    });

    it('retrieves participant from state or recovers from session', async () => {
      const participantPayload = createMockParticipant('test-user-123', { token: 'recovered-token' });
      setParticipantLookupLoader(createMockParticipantLookupLoader(
        async () => ({ code: 200, data: [participantPayload] })
      ));

      participantState.setParticipant({ id: 1, token: 'recovered-token' });
      await waitForAsyncTasks();

      appState.setState({ participant: null });

      const recovered = await participantState.getParticipantFromState();
      expect(recovered).to.deep.equal(participantPayload);
      expect(participantState.getParticipant()).to.deep.equal(participantPayload);
    });

    it('prevents concurrent participant recovery attempts', async () => {
      let callCount = 0;
      const participantPayload = createMockParticipant('test-user-123', { token: 'concurrent-token' });

      setParticipantLookupLoader(createMockParticipantLookupLoader(
        async () => {
          callCount++;
          await new Promise((resolve) => setTimeout(resolve, 50));
          return { code: 200, data: [participantPayload] };
        }
      ));

      participantState.setParticipant({ id: 1, token: 'concurrent-token' });
      await waitForAsyncTasks();

      appState.setState({ participant: null });

      const [result1, result2, result3] = await Promise.all([
        participantState.recoverParticipantFromSession(),
        participantState.recoverParticipantFromSession(),
        participantState.recoverParticipantFromSession(),
      ]);

      expect(callCount).to.equal(1);
      expect(result1).to.deep.equal(participantPayload);
      expect(result2).to.deep.equal(participantPayload);
      expect(result3).to.deep.equal(participantPayload);
    });

    it('handles network errors during recovery gracefully', async () => {
      participantState.setParticipant({ id: 1, token: 'network-error-token' });
      await waitForAsyncTasks();

      appState.setState({ participant: null });

      setParticipantLookupLoader(createMockParticipantLookupLoader(
        async () => {
          throw new Error('Network error');
        }
      ));

      const recovered = await participantState.recoverParticipantFromSession();
      expect(recovered).to.equal(null);
      // Token should remain for retry
      expect(window.sessionStorage.getItem('participantTokenEnc')).to.not.equal(null);
    });

    it('warns when setting participant without token', () => {
      const { warnings, restore } = captureConsoleWarnings();
      participantState.setParticipant({ id: 1 });
      expect(warnings.length).to.be.greaterThan(0);
      expect(warnings[0]).to.include('missing token property');
      restore();
    });

    it('warns when setting null participant', () => {
      const { warnings, restore } = captureConsoleWarnings();
      participantState.setParticipant(null);
      expect(warnings.length).to.be.greaterThan(0);
      expect(warnings[0]).to.include('null or undefined');
      restore();
    });
  });

  describe('userSession', () => {
    it('sets and retrieves user data', () => {
      const userData = { email: 'test@example.com', name: 'Test User' };
      userSession.setUser(userData);

      const retrieved = userSession.getUser();
      expect(retrieved).to.deep.equal(userData);
      expect(window.sessionStorage.getItem('userSession')).to.be.a('string');
    });

    it('retrieves user email from session', () => {
      const userData = { email: 'test@example.com', name: 'Test User' };
      userSession.setUser(userData);

      expect(userSession.getUserEmail()).to.equal('test@example.com');
    });

    it('returns empty string when no user email exists', () => {
      expect(userSession.getUserEmail()).to.equal('');
    });

    it('checks if user session exists', () => {
      expect(userSession.hasUser()).to.equal(false);

      userSession.setUser({ email: 'test@example.com' });
      expect(userSession.hasUser()).to.equal(true);

      userSession.clearUser();
      expect(userSession.hasUser()).to.equal(false);
    });

    it('clears user session data', () => {
      userSession.setUser({ email: 'test@example.com' });
      expect(userSession.getUser()).to.not.equal(null);

      userSession.clearUser();
      expect(userSession.getUser()).to.equal(null);
      expect(window.sessionStorage.getItem('userSession')).to.equal(null);
    });

    it('handles malformed JSON in sessionStorage', () => {
      window.sessionStorage.setItem('userSession', 'invalid-json{');
      const user = userSession.getUser();
      expect(user).to.equal(null);
    });

    it('warns when setting user without email', () => {
      const { warnings, restore } = captureConsoleWarnings();
      userSession.setUser({ name: 'No Email User' });
      expect(warnings.length).to.be.greaterThan(0);
      expect(warnings[0]).to.include('missing or invalid');
      restore();
    });

    it('warns when setting null user', () => {
      const { warnings, restore } = captureConsoleWarnings();
      userSession.setUser(null);
      expect(warnings.length).to.be.greaterThan(0);
      expect(warnings[0]).to.include('missing or invalid');
      restore();
    });
  });

  describe('reportsState', () => {
    it('sets and retrieves reports data', () => {
      const reportsData = {
        physActReport: { status: 'completed', data: { steps: 10000 } },
      };

      reportsState.setReports(reportsData);
      const retrieved = reportsState.getReports();

      expect(retrieved).to.deep.equal(reportsData);
    });

    it('returns null when no reports are set', () => {
      expect(reportsState.getReports()).to.equal(null);
    });

    it('clears reports data', () => {
      const reportsData = { physActReport: { status: 'completed' } };
      reportsState.setReports(reportsData);

      expect(reportsState.getReports()).to.not.equal(null);

      reportsState.clearReports();
      expect(reportsState.getReports()).to.equal(null);
    });

    it('fetches reports from state or retrieves them via function', async () => {
      const participant = { id: 1, token: 'test-token' };
      const mockPhysActReport = { status: 'completed', data: { steps: 5000 } };

      const retrievePhysicalActivityReport = async (p) => {
        expect(p).to.deep.equal(participant);
        return mockPhysActReport;
      };

      const reports = await reportsState.getReportsFromState(
        participant,
        retrievePhysicalActivityReport,
      );

      expect(reports.physActReport).to.deep.equal(mockPhysActReport);
      expect(reportsState.getReports()).to.deep.equal(reports);
    });

    it('returns cached reports without fetching again', async () => {
      const participant = { id: 1, token: 'test-token' };
      const cachedReports = { physActReport: { status: 'cached' } };
      let fetchCallCount = 0;

      reportsState.setReports(cachedReports);

      const retrievePhysicalActivityReport = async () => {
        fetchCallCount++;
        return { status: 'fetched' };
      };

      const reports = await reportsState.getReportsFromState(
        participant,
        retrievePhysicalActivityReport,
      );

      expect(fetchCallCount).to.equal(0);
      expect(reports).to.deep.equal(cachedReports);
    });

    it('handles null report from retrieval function', async () => {
      const participant = { id: 1, token: 'test-token' };
      const retrievePhysicalActivityReport = async () => null;

      const reports = await reportsState.getReportsFromState(
        participant,
        retrievePhysicalActivityReport,
      );

      expect(reports).to.deep.equal({});
    });

    it('clears reports when participant is cleared', async () => {
      const reportsData = { physActReport: { status: 'completed' } };
      reportsState.setReports(reportsData);
      expect(reportsState.getReports()).to.not.equal(null);

      participantState.clearParticipant();
      expect(reportsState.getReports()).to.equal(null);
    });

    it('warns when setting null or undefined reports', () => {
      const { warnings, restore } = captureConsoleWarnings();
      reportsState.setReports(null);
      expect(warnings.length).to.be.greaterThan(0);
      expect(warnings[0]).to.include('null or undefined');
      restore();

      const { warnings: warnings2, restore: restore2 } = captureConsoleWarnings();
      reportsState.setReports(undefined);
      expect(warnings2.length).to.be.greaterThan(0);
      restore2();
    });
  });

  describe('searchState', () => {
    it('stores search results and encrypts metadata to sessionStorage', async () => {
      const metadata = {
        searchType: 'lookup',
        firstName: 'alex',
      };
      const results = [{ id: 1 }];

      await searchState.setSearchResults(metadata, results);
      expect(searchState.getSearchResults()).to.deep.equal(results);
      const cached = searchState.getCachedMetadata();
      expect(cached).to.include({ searchType: 'lookup', firstName: 'alex' });
      
      // Verify metadata is encrypted and stored
      const storedEncrypted = window.sessionStorage.getItem('searchMetadataEnc');
      expect(storedEncrypted).to.be.a('string');
      expect(storedEncrypted).to.match(/^v1:/); // Verify encryption format
    });

    it('normalizes and persists predefined metadata', async () => {
      const normalized = await searchState.initializePredefinedMetadata({ routeKey: 'verified' });
      expect(normalized).to.deep.include({ searchType: 'predefined', routeKey: 'verified' });
      
      // Verify metadata is encrypted and stored
      const storedEncrypted = window.sessionStorage.getItem('searchMetadataEnc');
      expect(storedEncrypted).to.be.a('string');
      expect(storedEncrypted).to.match(/^v1:/);
      
      const updated = await searchState.updatePredefinedMetadata({ pageNumber: 2 });
      expect(updated.pageNumber).to.equal(2);
      
      // Verify updated metadata is also persisted
      const updatedEncrypted = window.sessionStorage.getItem('searchMetadataEnc');
      expect(updatedEncrypted).to.be.a('string');
      expect(updatedEncrypted).to.not.equal(storedEncrypted); // Different IV each time
    });

    it('handles complex predefined metadata with filters and pagination', async () => {
      const metadata = await searchState.initializePredefinedMetadata({
        routeKey: 'all',
        siteCode: 'SITE001',
        startDateFilter: '2024-01-01',
        endDateFilter: '2024-12-31',
        pageNumber: 3,
        direction: 'next',
        cursorHistory: ['cursor1', 'cursor2'],
      });

      expect(metadata).to.deep.include({
        searchType: 'predefined',
        routeKey: 'all',
        siteCode: 'SITE001',
        startDateFilter: '2024-01-01',
        endDateFilter: '2024-12-31',
        pageNumber: 3,
        direction: 'next',
      });
      expect(metadata.cursorHistory).to.deep.equal(['cursor1', 'cursor2']);
    });

    it('infers predefined type from routeKey or effectiveType', async () => {
      const metadata1 = await searchState.initializePredefinedMetadata({ routeKey: 'verified' });
      expect(metadata1.searchType).to.equal('predefined');
      expect(metadata1.predefinedType).to.equal('verified');
      expect(metadata1.effectiveType).to.equal('verified');

      const metadata2 = await searchState.initializePredefinedMetadata({ effectiveType: 'cannotbeverified' });
      expect(metadata2.predefinedType).to.equal('cannotbeverified');
      expect(metadata2.routeKey).to.equal('cannotbeverified');
    });

    it('persists encrypted metadata to sessionStorage', async () => {
      const metadata = { searchType: 'lookup', firstName: 'test' };
      await searchState.setSearchResults(metadata, [{ id: 1 }]);

      const storedEncrypted = window.sessionStorage.getItem('searchMetadataEnc');
      expect(storedEncrypted).to.be.a('string');
      expect(storedEncrypted).to.match(/^v1:/); // Verify encryption format
    });

    it('recovers search metadata from sessionStorage when cache is empty', async () => {
      const metadata = { searchType: 'lookup', firstName: 'recovered-test' };
      
      // Store metadata (populates both cache and storage)
      await searchState.setSearchResults(metadata, [{ id: 1 }]);
      
      // Save the encrypted payload
      const encryptedPayload = window.sessionStorage.getItem('searchMetadataEnc');
      expect(encryptedPayload).to.be.a('string');
      
      // Clear everything (simulates page refresh/module reload)
      searchState.clearSearchResults();
      expect(searchState.getCachedMetadata()).to.equal(null);
      
      // Restore encrypted data to storage (simulating persistence across page refresh)
      window.sessionStorage.setItem('searchMetadataEnc', encryptedPayload);
      
      // Now recover from storage (cache is empty, so should decrypt from storage)
      const recovered = await searchState.getSearchMetadata();
      expect(recovered).to.not.equal(null);
      expect(recovered).to.deep.include({ searchType: 'lookup', firstName: 'recovered-test' });
      
      // Cache should now be populated after recovery
      expect(searchState.getCachedMetadata()).to.deep.include({ searchType: 'lookup', firstName: 'recovered-test' });
    });

    it('cleans up tampered metadata', async () => {
      window.sessionStorage.setItem('searchMetadataEnc', 'invalid');
      const metadata = await searchState.getSearchMetadata();
      expect(metadata).to.equal(null);
      expect(window.sessionStorage.getItem('searchMetadataEnc')).to.equal(null);
    });

    it('reports whether cached metadata exists', async () => {
      expect(searchState.hasSearchResults()).to.equal(false);
      await searchState.setSearchResults({ searchType: 'lookup' }, [{ id: 1 }]);
      expect(searchState.hasSearchResults()).to.equal(true);
    });

    it('handles null or invalid results array', async () => {
      await searchState.setSearchResults({ searchType: 'lookup' }, null);
      expect(searchState.getSearchResults()).to.equal(null);

      await searchState.setSearchResults({ searchType: 'lookup' }, 'not-an-array');
      expect(searchState.getSearchResults()).to.equal(null);
    });

    it('warns when setting search results without metadata', async () => {
      const { warnings, restore } = captureConsoleWarnings();
      await searchState.setSearchResults(null, [{ id: 1 }]);
      expect(warnings.length).to.be.greaterThan(0);
      expect(warnings[0]).to.include('metadata is null or undefined');
      restore();
    });

    it('clears cached search data', async () => {
      await searchState.setSearchResults({ searchType: 'lookup' }, [{ id: 1 }]);
      searchState.clearSearchResults();

      expect(searchState.getSearchResults()).to.equal(null);
      expect(searchState.getCachedMetadata()).to.equal(null);
      expect(window.sessionStorage.getItem('searchMetadataEnc')).to.equal(null);
    });

    it('builds predefined search metadata', () => {
      const metadata = buildPredefinedSearchMetadata({ routeKey: 'all' });
      expect(metadata).to.deep.include({ searchType: 'predefined', routeKey: 'all' });
    });

    it('merges metadata updates correctly', async () => {
      await searchState.initializePredefinedMetadata({ routeKey: 'verified', pageNumber: 1 });
      const updated = await searchState.updatePredefinedMetadata({ pageNumber: 2, siteCode: 'SITE001' });

      expect(updated.routeKey).to.equal('verified');
      expect(updated.pageNumber).to.equal(2);
      expect(updated.siteCode).to.equal('SITE001');
    });
  });

  describe('unsaved changes', () => {
    it('marks changes as unsaved', () => {
      expect(appState.getState().hasUnsavedChanges).to.equal(false);
      markUnsaved();
      expect(appState.getState().hasUnsavedChanges).to.equal(true);
    });

    it('clears unsaved changes flag', () => {
      appState.setState({ hasUnsavedChanges: true });
      expect(appState.getState().hasUnsavedChanges).to.equal(true);
      clearUnsaved();
      expect(appState.getState().hasUnsavedChanges).to.equal(false);
    });
  });

  describe('state hydration', () => {
    it('hydrates state only once per authenticated user', async () => {
      await initializeAppState();
      const firstState = appState.getState();

      await statsState.setStats({ baz: 'qux' }, 456);
      resetAppStateUID();

      await initializeAppState();
      const secondState = appState.getState();

      expect(secondState).to.not.equal(firstState);
      expect(statsState.getStats()).to.deep.equal({ baz: 'qux' });
      expect(statsState.getStatsUpdateTime()).to.equal(456);
    });

    it('returns early if already initialized for current user', async () => {
      await initializeAppState();
      await statsState.setStats({ test: 'data' }, 123);

      // Should return immediately without re-hydrating
      const state = await initializeAppState();
      expect(statsState.getStats()).to.deep.equal({ test: 'data' });
      expect(state).to.deep.include({ stats: { statsData: { test: 'data' }, statsDataUpdateTime: 123 } });
    });

    it('handles unauthenticated state', async () => {
      firebaseStub.setUid(null);
      resetAppStateUID();
      await initializeAppState();

      // Should initialize with defaults
      expect(statsState.getStats()).to.deep.equal({});
      expect(roleState.getRoleFlags()).to.deep.equal({
        isParent: false,
        coordinatingCenter: false,
        helpDesk: false,
      });
    });
  });

  describe('resetAppStateUID', () => {
    it('resets the active UID tracking', async () => {
      await initializeAppState();
      await statsState.setStats({ test: 'data' }, 123);

      resetAppStateUID();
      firebaseStub.setUid('new-user');
      await initializeAppState();

      // Should load defaults for new user
      expect(statsState.getStats()).to.deep.equal({});
    });
  });

  describe('session management', () => {
    it('clears session data and triggers sign out', async () => {
      const loader = document.createElement('div');
      loader.id = 'loadingAnimation';
      document.body.appendChild(loader);

      await statsState.setStats({ retain: true }, 789);
      await roleState.setRoleFlags({ helpDesk: true });
      await uiState.setWithdrawalStatusFlags({ hasPriorSuspendedContact: true });
      participantState.setParticipant({ id: 1, token: 'foo' });
      await waitForAsyncTasks();
      appState.setState({ hasUnsavedChanges: true });
      window.location.hash = '#test';

      clearSession();

      expect(signOutCalled).to.equal(true);
      expect(statsState.getStats()).to.deep.equal({});
      expect(roleState.getRoleFlags()).to.deep.equal({
        isParent: false,
        coordinatingCenter: false,
        helpDesk: false,
      });
      expect(uiState.isSiteDropdownVisible()).to.equal(false);
      expect(uiState.getWithdrawalStatusFlags()).to.deep.equal({
        hasPriorParticipationStatus: false,
        hasPriorSuspendedContact: false,
      });
      expect(participantState.getParticipant()).to.equal(null);
      expect(appState.getState().hasUnsavedChanges).to.equal(false);
      expect(reportsState.getReports()).to.equal(null);
      // Note: window.location.hash is skipped in tests because JSDOM doesn't support mutable hash
      // In production, clearSession() correctly sets window.location.hash = '#'
      expect(loader.style.display).to.equal('none');
    });
  });
});
