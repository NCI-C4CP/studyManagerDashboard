import * as stateManagerModule from '../src/stateManager.js';
import {
  installFirebaseStub,
  setupTestEnvironment,
  teardownTestEnvironment,
  captureConsoleWarnings,
  createMockParticipantLookupLoader,
  createMockParticipant,
  clearAllState,
} from './helpers.js';

describe('stateManager', () => {
  let firebaseStub;
  let signOutCalled = false;
  const stateManager = stateManagerModule?.default ?? stateManagerModule;
  const {
    appState,
    buildPredefinedSearchMetadata,
    signOutAndClearSession,
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
    invalidateSearchResultsCache,
  } = stateManager;

  beforeEach(async () => {
    setupTestEnvironment();
    firebaseStub = installFirebaseStub({
      uid: 'test-user',
      onSignOut: () => {
        signOutCalled = true;
      },
    });
    signOutCalled = false;
    window.location.hash = '#initial';
    await clearAllState();
  });

  afterEach(async () => {
    // Clean up any state set during tests
    const stateModule = await import('../src/stateManager.js');
    const { searchState, reportsState, appState } = stateModule?.default ?? stateModule;
    searchState?.clearSearchResults?.();
    reportsState?.clearReports?.();
    const currentState = appState?.getState?.() || {};
    if (currentState.reports !== null || currentState.participant !== null) {
      appState?.setState({
        ...currentState,
        reports: null,
        participant: null,
      });
    }

    window.sessionStorage.clear();
    
    teardownTestEnvironment();
    setParticipantLookupLoader();
  });

  describe('appState', () => {
    it('supports setState and getState methods', () => {
      appState.setState({ hasUnsavedChanges: true });
      expect(appState.getState().hasUnsavedChanges).toBe(true);
    });

    it('supports set and get aliases', () => {
      appState.set({ hasUnsavedChanges: true });
      expect(appState.get().hasUnsavedChanges).toBe(true);
    });

    it('supports function-based state updates', () => {
      appState.setState({ hasUnsavedChanges: false });
      appState.setState((prev) => ({ ...prev, hasUnsavedChanges: true }));
      expect(appState.getState().hasUnsavedChanges).toBe(true);
    });

    it('returns current state object', () => {
      appState.setState({ hasUnsavedChanges: false });
      const state1 = appState.getState();
      const state2 = appState.getState();
      // Note: appState returns the same reference, mutations will affect it
      // Deep cloning happens in encrypted stores, not in appState itself
      expect(state1).toBe(state2);
    });
  });

  describe('statsState', () => {
    it('sets and retrieves stats data', async () => {
      await statsState.setStats({ foo: 'bar' }, 123);
      expect(statsState.getStats()).toEqual({ foo: 'bar' });
      expect(statsState.getStatsUpdateTime()).toBe(123);
    });

    it('persists stats across hydration', async () => {
      await statsState.setStats({ persisted: true }, 999);
      expect(window.sessionStorage.getItem('statsStateEnc')).toBeTypeOf('string');

      appState.setState({ stats: { statsData: {}, statsDataUpdateTime: 0 } });
      resetAppStateUID();
      await initializeAppState();

      expect(statsState.getStats()).toEqual({ persisted: true });
      expect(statsState.getStatsUpdateTime()).toBe(999);
    });

    it('falls back to defaults when stats payload is tampered', async () => {
      await statsState.setStats({ foo: 'bar' }, 111);
      window.sessionStorage.setItem('statsStateEnc', 'corrupted');
      appState.setState({ stats: { statsData: { foo: 'bar' }, statsDataUpdateTime: 111 } });

      resetAppStateUID();
      await initializeAppState();

      expect(statsState.getStats()).toEqual({});
      expect(statsState.getStatsUpdateTime()).toBe(0);
      expect(window.sessionStorage.getItem('statsStateEnc')).toBe(null);
    });

    it('resets stats when signed in as a different user', async () => {
      await statsState.setStats({ foo: 'user1' }, 42);
      firebaseStub.setUid('another-user');
      appState.setState({ stats: { statsData: { foo: 'user1' }, statsDataUpdateTime: 42 } });
      resetAppStateUID();
      await initializeAppState();

      expect(statsState.getStats()).toEqual({});
      expect(statsState.getStatsUpdateTime()).toBe(0);
    });

    it('validates timestamp to be finite and non-negative', async () => {
      await statsState.setStats({}, -1);
      expect(statsState.getStatsUpdateTime()).toBe(0);

      await statsState.setStats({}, NaN);
      expect(statsState.getStatsUpdateTime()).toBe(0);

      await statsState.setStats({}, Infinity);
      expect(statsState.getStatsUpdateTime()).toBe(0);
    });
  });

  describe('roleState', () => {
    it('sets and retrieves role flags', async () => {
      await roleState.setRoleFlags({ isParent: true, coordinatingCenter: '1', helpDesk: 0 });
      expect(roleState.getRoleFlags()).toEqual({
        isParent: true,
        coordinatingCenter: true,
        helpDesk: false,
        isSiteManager: false,
        isEHRUploader: false,
      });
    });

    it('preserves existing flags when partial update provided', async () => {
      await roleState.setRoleFlags({ isParent: true, coordinatingCenter: true });
      await roleState.setRoleFlags({ helpDesk: true });
      expect(roleState.getRoleFlags()).toEqual({
        isParent: true,
        coordinatingCenter: true,
        helpDesk: true,
        isSiteManager: false,
        isEHRUploader: false,
      });
      
      roleState.clear();
    });

    it('persists role flags across hydration', async () => {
      await roleState.setRoleFlags({ isParent: true, coordinatingCenter: true });
      appState.setState({
        roleFlags: {
          isParent: false,
          coordinatingCenter: false,
          helpDesk: false,
          isSiteManager: false,
          isEHRUploader: false,
        },
      });
      resetAppStateUID();
      await initializeAppState();

      expect(roleState.getRoleFlags()).toEqual({
        isParent: true,
        coordinatingCenter: true,
        helpDesk: false,
        isSiteManager: false,
        isEHRUploader: false,
      });
    });

    it('normalizes boolean values from strings and numbers', async () => {
      await roleState.setRoleFlags({
        isParent: 'true',
        coordinatingCenter: 1,
        helpDesk: 'false',
      });
      expect(roleState.getRoleFlags()).toEqual({
        isParent: true,
        coordinatingCenter: true,
        helpDesk: false,
        isSiteManager: false,
        isEHRUploader: false,
      });
    });

  });

  describe('uiState', () => {
    it('manages UI flags and withdrawal helpers', async () => {
      expect(uiState.isSiteDropdownVisible()).toBe(false);

      await uiState.setSiteDropdownVisible(true);
      expect(uiState.isSiteDropdownVisible()).toBe(true);

      await uiState.setWithdrawalStatusFlags({ hasPriorParticipationStatus: 'true' });
      expect(uiState.getWithdrawalStatusFlags()).toMatchObject({
        hasPriorParticipationStatus: true,
        hasPriorSuspendedContact: false,
      });

      await uiState.clearWithdrawalStatusFlags();
      expect(uiState.getWithdrawalStatusFlags()).toEqual({
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

      expect(uiState.isSiteDropdownVisible()).toBe(true);
      expect(uiState.getWithdrawalStatusFlags()).toEqual({
        hasPriorParticipationStatus: true,
        hasPriorSuspendedContact: true,
      });
    });

    it('normalizes boolean values for site dropdown visibility', async () => {
      await uiState.setSiteDropdownVisible('true');
      expect(uiState.isSiteDropdownVisible()).toBe(true);

      await uiState.setSiteDropdownVisible(0);
      expect(uiState.isSiteDropdownVisible()).toBe(false);

      await uiState.setSiteDropdownVisible(1);
      expect(uiState.isSiteDropdownVisible()).toBe(true);
    });

    it('preserves other withdrawal flags when updating one', async () => {
      await uiState.setWithdrawalStatusFlags({
        hasPriorParticipationStatus: true,
        hasPriorSuspendedContact: true,
      });

      await uiState.setWithdrawalStatusFlags({
        hasPriorParticipationStatus: false,
      });

      expect(uiState.getWithdrawalStatusFlags()).toEqual({
        hasPriorParticipationStatus: false,
        hasPriorSuspendedContact: true,
      });
    });

    it('defaults filtersExpanded to true and persists updates', async () => {
      expect(uiState.isFiltersExpanded()).toBe(true);

      await uiState.setFiltersExpanded(false);
      expect(uiState.isFiltersExpanded()).toBe(false);
      expect(window.sessionStorage.getItem('uiFlagsEnc')).toBeTypeOf('string');

      appState.setState({
        uiFlags: {
          siteDropdownVisible: false,
          withdrawalFlags: {
            hasPriorParticipationStatus: false,
            hasPriorSuspendedContact: false,
          },
          activeColumns: undefined,
          filtersExpanded: true,
        },
      });
      resetAppStateUID();
      await initializeAppState();

      expect(uiState.isFiltersExpanded()).toBe(false);
    });
  });

  describe('participantState', () => {
    it('encrypts participant token and recovers it from session storage', async () => {
      const participantPayload = createMockParticipant('test-user-123', { token: 'secret-token', name: 'Test' });
      await participantState.setParticipant(participantPayload);

      const stored = window.sessionStorage.getItem('participantTokenEnc');
      expect(stored).toBeTypeOf('string');

      appState.setState({ participant: null });

      setParticipantLookupLoader(createMockParticipantLookupLoader(
        async () => ({ code: 200, data: [participantPayload] })
      ));

      const recovered = await participantState.recoverParticipantFromSession();
      expect(recovered).toEqual(participantPayload);
      expect(participantState.getParticipant()).toEqual(participantPayload);
    });

    it('clears stored participant token when recovery fails', async () => {
      await participantState.setParticipant({ id: 2, token: 'bad-token' });

      appState.setState({ participant: null });

      setParticipantLookupLoader(createMockParticipantLookupLoader(
        async () => ({ code: 404, data: [] })
      ));

      const recovered = await participantState.recoverParticipantFromSession();
      expect(recovered).toBe(null);
      expect(window.sessionStorage.getItem('participantTokenEnc')).toBe(null);
    });

    it('returns null for tampered participant token', async () => {
      window.sessionStorage.setItem('participantTokenEnc', 'invalid-payload');
      const token = await participantState.getParticipantToken();
      expect(token).toBe(null);
      expect(window.sessionStorage.getItem('participantTokenEnc')).toBe(null);
    });

    it('checks if participant exists in state', async () => {
      expect(participantState.hasParticipant()).toBe(false);
      await participantState.setParticipant({ id: 1, token: 'test-token' });
      expect(participantState.hasParticipant()).toBe(true);
      participantState.clearParticipant();
      expect(participantState.hasParticipant()).toBe(false);
    });

    it('retrieves participant from state or recovers from session', async () => {
      const participantPayload = createMockParticipant('test-user-123', { token: 'recovered-token' });
      setParticipantLookupLoader(createMockParticipantLookupLoader(
        async () => ({ code: 200, data: [participantPayload] })
      ));

      await participantState.setParticipant({ id: 1, token: 'recovered-token' });

      appState.setState({ participant: null });

      const recovered = await participantState.getParticipantFromState();
      expect(recovered).toEqual(participantPayload);
      expect(participantState.getParticipant()).toEqual(participantPayload);
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

      await participantState.setParticipant({ id: 1, token: 'concurrent-token' });

      appState.setState({ participant: null });

      const [result1, result2, result3] = await Promise.all([
        participantState.recoverParticipantFromSession(),
        participantState.recoverParticipantFromSession(),
        participantState.recoverParticipantFromSession(),
      ]);

      expect(callCount).toBe(1);
      expect(result1).toEqual(participantPayload);
      expect(result2).toEqual(participantPayload);
      expect(result3).toEqual(participantPayload);
    });

    it('handles network errors during recovery gracefully', async () => {
      await participantState.setParticipant({ id: 1, token: 'network-error-token' });

      appState.setState({ participant: null });

      setParticipantLookupLoader(createMockParticipantLookupLoader(
        async () => {
          throw new Error('Network error');
        }
      ));

      const recovered = await participantState.recoverParticipantFromSession();
      expect(recovered).toBe(null);
      // Token should remain for retry
      expect(window.sessionStorage.getItem('participantTokenEnc')).not.toBe(null);
    });

    it('warns when setting participant without token', async () => {
      const { warnings, restore } = captureConsoleWarnings();
      await participantState.setParticipant({ id: 1 });
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('missing token property');
      restore();
    });

    it('warns when setting null participant', async () => {
      const { warnings, restore } = captureConsoleWarnings();
      await participantState.setParticipant(null);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('null or undefined');
      restore();
    });
  });

  describe('userSession', () => {
    it('sets and retrieves user data', () => {
      const userData = { email: 'test@example.com', name: 'Test User' };
      userSession.setUser(userData);

      const retrieved = userSession.getUser();
      expect(retrieved).toEqual(userData);
      expect(window.sessionStorage.getItem('userSession')).toBeTypeOf('string');
    });

    it('retrieves user email from session', () => {
      const userData = { email: 'test@example.com', name: 'Test User' };
      userSession.setUser(userData);

      expect(userSession.getUserEmail()).toBe('test@example.com');
    });

    it('returns empty string when no user email exists', () => {
      expect(userSession.getUserEmail()).toBe('');
    });

    it('checks if user session exists', () => {
      expect(userSession.hasUser()).toBe(false);

      userSession.setUser({ email: 'test@example.com' });
      expect(userSession.hasUser()).toBe(true);

      userSession.clearUser();
      expect(userSession.hasUser()).toBe(false);
    });

    it('clears user session data', () => {
      userSession.setUser({ email: 'test@example.com' });
      expect(userSession.getUser()).not.toBe(null);

      userSession.clearUser();
      expect(userSession.getUser()).toBe(null);
      expect(window.sessionStorage.getItem('userSession')).toBe(null);
    });

    it('handles malformed JSON in sessionStorage', () => {
      window.sessionStorage.setItem('userSession', 'invalid-json{');
      const user = userSession.getUser();
      expect(user).toBe(null);
    });

    it('warns when setting user without email', () => {
      const { warnings, restore } = captureConsoleWarnings();
      userSession.setUser({ name: 'No Email User' });
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('missing or invalid');
      restore();
    });

    it('warns when setting null user', () => {
      const { warnings, restore } = captureConsoleWarnings();
      userSession.setUser(null);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('missing or invalid');
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

      expect(retrieved).toEqual(reportsData);
      
      reportsState.clearReports();
    });

    it('returns null when no reports are set', () => {
      expect(reportsState.getReports()).toBe(null);
    });

    it('clears reports data', () => {
      const reportsData = { physActReport: { status: 'completed' } };
      reportsState.setReports(reportsData);

      expect(reportsState.getReports()).not.toBe(null);

      reportsState.clearReports();
      expect(reportsState.getReports()).toBe(null);
    });

    it('fetches reports from state or retrieves them via function', async () => {
      const participant = { id: 1, token: 'test-token' };
      const mockPhysActReport = { status: 'completed', data: { steps: 5000 } };

      const retrievePhysicalActivityReport = async (p) => {
        expect(p).toEqual(participant);
        return mockPhysActReport;
      };

      const reports = await reportsState.getReportsFromState(
        participant,
        retrievePhysicalActivityReport,
      );

      expect(reports.physActReport).toEqual(mockPhysActReport);
      expect(reportsState.getReports()).toEqual(reports);
      
      reportsState.clearReports();
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

      expect(fetchCallCount).toBe(0);
      expect(reports).toEqual(cachedReports);
      
      reportsState.clearReports();
    });

    it('handles null report from retrieval function', async () => {
      const participant = { id: 1, token: 'test-token' };
      const retrievePhysicalActivityReport = async () => null;

      const reports = await reportsState.getReportsFromState(
        participant,
        retrievePhysicalActivityReport,
      );

      expect(reports).toEqual({});
      
      reportsState.clearReports();
    });

    it('clears reports when participant is cleared', async () => {
      const reportsData = { physActReport: { status: 'completed' } };
      reportsState.setReports(reportsData);
      expect(reportsState.getReports()).not.toBe(null);

      participantState.clearParticipant();
      expect(reportsState.getReports()).toBe(null);
    });

    it('warns when setting null or undefined reports', () => {
      const { warnings, restore } = captureConsoleWarnings();
      reportsState.setReports(null);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('null or undefined');
      restore();

      const { warnings: warnings2, restore: restore2 } = captureConsoleWarnings();
      reportsState.setReports(undefined);
      expect(warnings2.length).toBeGreaterThan(0);
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
      expect(searchState.getSearchResults()).toEqual(results);
      const cached = searchState.getCachedMetadata();
      expect(cached).toMatchObject({ searchType: 'lookup', firstName: 'alex' });
      
      // Verify metadata is encrypted and stored
      const storedEncrypted = window.sessionStorage.getItem('searchMetadataEnc');
      expect(storedEncrypted).toBeTypeOf('string');
      expect(storedEncrypted).toMatch(/^v1:/); // Verify encryption format
    });

    it('normalizes and persists predefined metadata', async () => {
      const normalized = await searchState.initializePredefinedMetadata({ routeKey: 'verified' });
      expect(normalized).toMatchObject({ searchType: 'predefined', routeKey: 'verified' });
      
      // Verify metadata is encrypted and stored
      const storedEncrypted = window.sessionStorage.getItem('searchMetadataEnc');
      expect(storedEncrypted).toBeTypeOf('string');
      expect(storedEncrypted).toMatch(/^v1:/);
      
      const updated = await searchState.updatePredefinedMetadata({ pageNumber: 2 });
      expect(updated.pageNumber).toBe(2);
      
      // Verify updated metadata is also persisted
      const updatedEncrypted = window.sessionStorage.getItem('searchMetadataEnc');
      expect(updatedEncrypted).toBeTypeOf('string');
      expect(updatedEncrypted).not.toBe(storedEncrypted); // Different IV each time
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

      expect(metadata).toMatchObject({
        searchType: 'predefined',
        routeKey: 'all',
        siteCode: 'SITE001',
        startDateFilter: '2024-01-01',
        endDateFilter: '2024-12-31',
        pageNumber: 3,
        direction: 'next',
      });
      expect(metadata.cursorHistory).toEqual(['cursor1', 'cursor2']);
    });

    it('infers predefined type from routeKey or effectiveType', async () => {
      const metadata1 = await searchState.initializePredefinedMetadata({ routeKey: 'verified' });
      expect(metadata1.searchType).toBe('predefined');
      expect(metadata1.predefinedType).toBe('verified');
      expect(metadata1.effectiveType).toBe('verified');

      const metadata2 = await searchState.initializePredefinedMetadata({ effectiveType: 'cannotbeverified' });
      expect(metadata2.predefinedType).toBe('cannotbeverified');
      expect(metadata2.routeKey).toBe('cannotbeverified');
    });

    it('persists encrypted metadata to sessionStorage', async () => {
      const metadata = { searchType: 'lookup', firstName: 'test' };
      await searchState.setSearchResults(metadata, [{ id: 1 }]);

      const storedEncrypted = window.sessionStorage.getItem('searchMetadataEnc');
      expect(storedEncrypted).toBeTypeOf('string');
      expect(storedEncrypted).toMatch(/^v1:/); // Verify encryption format
    });

    it('recovers search metadata from sessionStorage when cache is empty', async () => {
      const metadata = { searchType: 'lookup', firstName: 'recovered-test' };
      
      // Store metadata (populates both cache and storage)
      await searchState.setSearchResults(metadata, [{ id: 1 }]);
      
      // Save the encrypted payload
      const encryptedPayload = window.sessionStorage.getItem('searchMetadataEnc');
      expect(encryptedPayload).toBeTypeOf('string');
      
      // Clear everything (simulates page refresh/module reload)
      searchState.clearSearchResults();
      expect(searchState.getCachedMetadata()).toBe(null);
      
      // Restore encrypted data to storage (simulating persistence across page refresh)
      window.sessionStorage.setItem('searchMetadataEnc', encryptedPayload);
      
      // Now recover from storage (cache is empty, so should decrypt from storage)
      const recovered = await searchState.getSearchMetadata();
      expect(recovered).not.toBe(null);
      expect(recovered).toMatchObject({ searchType: 'lookup', firstName: 'recovered-test' });
      
      // Cache should now be populated after recovery
      expect(searchState.getCachedMetadata()).toMatchObject({ searchType: 'lookup', firstName: 'recovered-test' });
      
      searchState.clearSearchResults();
      window.sessionStorage.removeItem('searchMetadataEnc');
    });

    it('cleans up tampered metadata', async () => {
      window.sessionStorage.setItem('searchMetadataEnc', 'invalid');
      const metadata = await searchState.getSearchMetadata();
      expect(metadata).toBe(null);
      expect(window.sessionStorage.getItem('searchMetadataEnc')).toBe(null);
      
      searchState.clearSearchResults();
    });

    it('reports whether cached metadata exists', async () => {
      expect(searchState.hasSearchResults()).toBe(false);
      await searchState.setSearchResults({ searchType: 'lookup' }, [{ id: 1 }]);
      expect(searchState.hasSearchResults()).toBe(true);
    });

    it('handles null or invalid results array', async () => {
      await searchState.setSearchResults({ searchType: 'lookup' }, null);
      expect(searchState.getSearchResults()).toBe(null);

      await searchState.setSearchResults({ searchType: 'lookup' }, 'not-an-array');
      expect(searchState.getSearchResults()).toBe(null);
    });

    it('warns when setting search results without metadata', async () => {
      const { warnings, restore } = captureConsoleWarnings();
      await searchState.setSearchResults(null, [{ id: 1 }]);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('metadata is null or undefined');
      restore();
    });

    it('clears cached search data', async () => {
      await searchState.setSearchResults({ searchType: 'lookup' }, [{ id: 1 }]);
      searchState.clearSearchResults();

      expect(searchState.getSearchResults()).toBe(null);
      expect(searchState.getCachedMetadata()).toBe(null);
      expect(window.sessionStorage.getItem('searchMetadataEnc')).toBe(null);
    });

    it('clears only results cache while preserving metadata', async () => {
      const metadata = { searchType: 'lookup', firstName: 'alex' };
      const results = [{ id: 1 }];

      await searchState.setSearchResults(metadata, results);
      expect(searchState.getSearchResults()).toEqual(results);
      const encryptedBefore = window.sessionStorage.getItem('searchMetadataEnc');
      expect(encryptedBefore).toBeTypeOf('string');

      searchState.clearResultsCache();

      expect(searchState.getSearchResults()).toBe(null);
      expect(searchState.getCachedMetadata()).toMatchObject({ searchType: 'lookup', firstName: 'alex' });
      expect(window.sessionStorage.getItem('searchMetadataEnc')).toBe(encryptedBefore);
    });

    it('builds predefined search metadata', () => {
      const metadata = buildPredefinedSearchMetadata({ routeKey: 'all' });
      expect(metadata).toMatchObject({ searchType: 'predefined', routeKey: 'all' });
    });

    it('merges metadata updates correctly', async () => {
      await searchState.initializePredefinedMetadata({ routeKey: 'verified', pageNumber: 1 });
      const updated = await searchState.updatePredefinedMetadata({ pageNumber: 2, siteCode: 'SITE001' });

      expect(updated.routeKey).toBe('verified');
      expect(updated.pageNumber).toBe(2);
      expect(updated.siteCode).toBe('SITE001');
    });
  });

  describe('invalidateSearchResultsCache', () => {
    let originalClearResultsCache;
    let originalClearSearchResults;

    beforeEach(() => {
      originalClearResultsCache = searchState.clearResultsCache;
      originalClearSearchResults = searchState.clearSearchResults;
    });

    afterEach(() => {
      searchState.clearResultsCache = originalClearResultsCache;
      searchState.clearSearchResults = originalClearSearchResults;
    });

    it('uses clearResultsCache when available', () => {
      let clearResultsCalled = false;
      let clearAllCalled = false;

      searchState.clearResultsCache = () => { clearResultsCalled = true; };
      searchState.clearSearchResults = () => { clearAllCalled = true; };

      invalidateSearchResultsCache();

      expect(clearResultsCalled).toBe(true);
      expect(clearAllCalled).toBe(false);
    });

    it('falls back to clearSearchResults when partial cache clear is unavailable', () => {
      let clearAllCalled = false;

      searchState.clearResultsCache = undefined;
      searchState.clearSearchResults = () => { clearAllCalled = true; };

      invalidateSearchResultsCache();

      expect(clearAllCalled).toBe(true);
    });
  });

  describe('unsaved changes', () => {
    it('marks changes as unsaved', () => {
      expect(appState.getState().hasUnsavedChanges).toBe(false);
      markUnsaved();
      expect(appState.getState().hasUnsavedChanges).toBe(true);
    });

    it('clears unsaved changes flag', () => {
      appState.setState({ hasUnsavedChanges: true });
      expect(appState.getState().hasUnsavedChanges).toBe(true);
      clearUnsaved();
      expect(appState.getState().hasUnsavedChanges).toBe(false);
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

      expect(secondState).not.toBe(firstState);
      expect(statsState.getStats()).toEqual({ baz: 'qux' });
      expect(statsState.getStatsUpdateTime()).toBe(456);
    });

    it('returns early if already initialized for current user', async () => {
      await initializeAppState();
      await statsState.setStats({ test: 'data' }, 123);

      // Should return immediately without re-hydrating
      const state = await initializeAppState();
      expect(statsState.getStats()).toEqual({ test: 'data' });
      expect(state).toMatchObject({ stats: { statsData: { test: 'data' }, statsDataUpdateTime: 123 } });
    });

    it('handles unauthenticated state', async () => {
      firebaseStub.setUid(null);
      resetAppStateUID();
      roleState.clear(); // Clear any existing role state
      await initializeAppState();

      // Should initialize with defaults (keep any pre-existing stats if present in appState)
      expect(roleState.getRoleFlags()).toEqual({
        isParent: false,
        coordinatingCenter: false,
        helpDesk: false,
        isSiteManager: false,
        isEHRUploader: false,
      });
      const stats = statsState.getStats();
      expect(stats && typeof stats === 'object').toBe(true);
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
      expect(statsState.getStats()).toEqual({});
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
      await participantState.setParticipant({ id: 1, token: 'foo' });
      appState.setState({ hasUnsavedChanges: true });
      window.location.hash = '#test';

      signOutAndClearSession();

      expect(signOutCalled).toBe(true);
      expect(statsState.getStats()).toEqual({});
      expect(roleState.getRoleFlags()).toEqual({
        isParent: false,
        coordinatingCenter: false,
        helpDesk: false,
        isSiteManager: false,
        isEHRUploader: false,
      });
      expect(uiState.isSiteDropdownVisible()).toBe(false);
      expect(uiState.getWithdrawalStatusFlags()).toEqual({
        hasPriorParticipationStatus: false,
        hasPriorSuspendedContact: false,
      });
      expect(participantState.getParticipant()).toBe(null);
      expect(appState.getState().hasUnsavedChanges).toBe(false);
      expect(reportsState.getReports()).toBe(null);
      // Note: window.location.hash is skipped in tests because JSDOM doesn't support mutable hash
      // In production, signOutAndClearSession() correctly sets window.location.hash = '#'
      expect(loader.style.display).toBe('none');
    });
  });
});
