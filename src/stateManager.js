import { encryptString, decryptString } from './crypto.js';
import { hideAnimation } from './utils.js';
import { normalizeColumnValue } from './participantCommons.js';

/**
 * Default values for all encrypted stores
 */

const STATS_DEFAULTS = Object.freeze({
    statsData: {},
    statsDataUpdateTime: 0,
});

const ROLE_DEFAULTS = Object.freeze({
    isParent: false,
    coordinatingCenter: false,
    helpDesk: false,
});

const WITHDRAWAL_DEFAULTS = Object.freeze({
    hasPriorParticipationStatus: false,
    hasPriorSuspendedContact: false,
});

const UI_DEFAULTS = Object.freeze({
    siteDropdownVisible: false,
    withdrawalFlags: WITHDRAWAL_DEFAULTS,
    activeColumns: undefined,
    filtersExpanded: true,
});

const encryptedStoreLoaders = [];
let activeUID = null;
let participantLookupLoader = () => import('./participantLookup.js');

/**
 * State Management and Encryption utilities
 */

// Protect against mutation and/or shared refs. Return a deep clone of the value.
const deepClone = (value, fallback = {}) => {
    const source = value === undefined || value === null ? fallback : value;
    if (source === undefined || source === null) return {};
    if (typeof source !== 'object') return source;
    try {
        return JSON.parse(JSON.stringify(source));
    } catch (error) {
        console.warn('deepClone: failed to clone value', value, error);
        return JSON.parse(JSON.stringify(fallback));
    }
};

// Return a boolean value from a string or number
const asBoolean = (value) => {
    if (typeof value === 'string') {
        const trimmed = value.trim().toLowerCase();
        if (trimmed === 'true' || trimmed === '1') return true;
        if (trimmed === 'false' || trimmed === '0') return false;
    }
    if (typeof value === 'number') {
        if (Number.isNaN(value)) return false;
        return value !== 0;
    }
    if (typeof value === 'bigint') {
        return value !== 0n;
    }
    return !!value;
};

// Access the Firebase auth instance
const getAuth = () => {
    try {
        if (typeof firebase === 'undefined' || typeof firebase?.auth !== 'function') return null;
        return firebase.auth();
    } catch (error) {
        console.warn('getAuth: unable to access firebase auth', error);
        return null;
    }
};

// Get the current Firebase UID (or null)
const getCurrentUID = () => {
    const auth = getAuth();
    return auth?.currentUser?.uid ?? null;
};

/**
 * Create a store for the application state and initialize it with the default values
 * @param {object} initialState - The initial state of the store
 * @returns {object} The store object
 */
const createStore = (startState = {}) => {
    let state = JSON.parse(JSON.stringify(startState));

    /** @param {object | function} update - an object or a function to update state */
    const setState = (update) => { 
        const updatedSlice = typeof update === 'function' ? update(state) : update;
        state = { ...state, ...updatedSlice };
    };

    /** @return {object}  */
    const getState = () => state;

    return {
        setState,
        getState,
        // Note: `set` and `get` are implemented as aliases for setState and getState. Added per @we-ai's request.
        set: setState,
        get: getState,
    };
}

export const appState = createStore({
    hasUnsavedChanges: false,
    participant: null,
    reports: null,
});

/**
 * Persist encrypted store state to sessionStorage
 * @param {string} sessionStorageKey - The key to store the encrypted value under
 * @param {*} value - The value to encrypt and persist
 * @param {string} uid - The user ID to derive encryption key from (must be provided by caller)
 */
const persistEncryptedStore = async (sessionStorageKey, value, uid) => {
    try {
        const serialized = JSON.stringify(value);
        const encrypted = await encryptString(serialized, uid);
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(sessionStorageKey, encrypted);
        }
    } catch (error) {
        console.warn(`Failed to persist store "${sessionStorageKey}"`, error);
    }
};

/**
 * Create an encrypted store for the application state
 * Important so data in appState can survive page reloads.
 * @param {object} stateKey - The key of the state in the appState object
 * @param {object} defaults - The default values for the store
 * @param {function} validationFn - The function to validate the state
 * @param {string} sessionStorageKey - The key of the state in the sessionStorage
 * @returns {object} The store object
 */
const createEncryptedStore = ({ stateKey, defaults, validationFn, sessionStorageKey }) => {
    const getDefaultState = () => deepClone(defaults);

    const writeStoreState = (stateValue) => {
        const validatedState = validationFn(stateValue);
        appState.setState({ [stateKey]: validatedState });
        return validatedState;
    };

    const readStoreState = () => {
        const currentState = appState.getState()[stateKey];
        // Only validate defaults - existing state is already validated by writeStoreState
        return currentState !== undefined ? currentState : validationFn(getDefaultState());
    };

    const loadFromStorage = async (uid) => {
        let loadedState = getDefaultState();

        if (uid && typeof sessionStorage !== 'undefined') {
            const encryptedData = sessionStorage.getItem(sessionStorageKey);
            if (encryptedData) {
                try {
                    const decryptedData = await decryptString(encryptedData, uid);
                    const parsedState = JSON.parse(decryptedData);
                    loadedState = parsedState;
                } catch (error) {
                    console.warn(`Failed to load store "${stateKey}"`, error);
                    sessionStorage.removeItem(sessionStorageKey);
                    loadedState = getDefaultState();
                }
            }
        }

        writeStoreState(loadedState);
        return loadedState;
    };

    encryptedStoreLoaders.push(loadFromStorage);
    writeStoreState(getDefaultState());

    return {
        get: () => deepClone(readStoreState()),
        set: async (update) => {
            const currentState = readStoreState();
            const updatedValue = typeof update === 'function' ? update(deepClone(currentState)) : update;
            const validatedState = writeStoreState(updatedValue);

            const uid = getCurrentUID();
            if (uid) {
                await persistEncryptedStore(sessionStorageKey, validatedState, uid);
            }
        },
        clear: () => {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem(sessionStorageKey);
            }
            writeStoreState(getDefaultState());
        },
    };
};

// Initialize appState just after user authenticates
export const initializeAppState = async () => {
    const uid = getCurrentUID();

    if (activeUID === uid) {
        return appState.getState();
    }

    await Promise.all(encryptedStoreLoaders.map((loadFromStorage) => loadFromStorage(uid)));
    activeUID = uid;
    return appState.getState();
};

export const resetAppStateUID = () => {
    activeUID = null;
};

// Override the participant lookup loader for testing
export const setParticipantLookupLoader = (loader) => {
    participantLookupLoader = typeof loader === 'function' ? loader : () => import('./participantLookup.js');
};

/**
 * Validation helpers
 */

const validateBooleanFlags = (defaults, candidate = {}) => {
    const inputData = candidate && typeof candidate === 'object' ? candidate : {};
    const validatedFlags = {};
    for (const key in defaults) {
        validatedFlags[key] = asBoolean(inputData[key]);
    }
    return validatedFlags;
};

const validateStats = (candidate = {}) => {
    const inputData = candidate && typeof candidate === 'object' ? candidate : {};
    const statsData = deepClone(inputData.statsData);
    const timestamp = Number(inputData.statsDataUpdateTime ?? 0);
    return {
        statsData,
        statsDataUpdateTime: Number.isFinite(timestamp) && timestamp >= 0 ? timestamp : 0,
    };
};

const validateRoleFlags = (candidate = {}) => {
    return validateBooleanFlags(ROLE_DEFAULTS, candidate);
};

const validateWithdrawalFlags = (candidate = {}) => {
    return validateBooleanFlags(WITHDRAWAL_DEFAULTS, candidate);
};

const validateUi = (candidate = {}) => {
    const inputData = candidate && typeof candidate === 'object' ? candidate : {};
    return {
        siteDropdownVisible: asBoolean(inputData.siteDropdownVisible),
        withdrawalFlags: validateWithdrawalFlags(inputData.withdrawalFlags),
        activeColumns: Array.isArray(inputData.activeColumns) ? inputData.activeColumns : undefined,
        filtersExpanded: inputData.filtersExpanded === undefined ? true : asBoolean(inputData.filtersExpanded),
    };
};

/**
 * Encrypted stores for the state objects. Note: encryption is required for sessionStorage usage (security scanner).
 */

const statsStore = createEncryptedStore({
    stateKey: 'stats',
    defaults: STATS_DEFAULTS,
    validationFn: validateStats,
    sessionStorageKey: 'statsStateEnc',
});

const roleStore = createEncryptedStore({
    stateKey: 'roleFlags',
    defaults: ROLE_DEFAULTS,
    validationFn: validateRoleFlags,
    sessionStorageKey: 'roleFlagsEnc',
});

const uiStore = createEncryptedStore({
    stateKey: 'uiFlags',
    defaults: UI_DEFAULTS,
    validationFn: validateUi,
    sessionStorageKey: 'uiFlagsEnc',
});

/**
 * State exports
 */

export const statsState = {
    setStats: async (statsData = {}, statsDataUpdateTime = 0) => {
        await statsStore.set({ statsData, statsDataUpdateTime });
    },
    getStats: () => deepClone(statsStore.get().statsData),
    getStatsUpdateTime: () => statsStore.get().statsDataUpdateTime,
    clear: () => statsStore.clear(),
};

export const roleState = {
    setRoleFlags: async (roleFlags = {}) => {
        await roleStore.set((prev) => ({
            isParent: asBoolean(roleFlags.isParent ?? prev.isParent),
            coordinatingCenter: asBoolean(roleFlags.coordinatingCenter ?? prev.coordinatingCenter),
            helpDesk: asBoolean(roleFlags.helpDesk ?? prev.helpDesk),
        }));
    },
    getRoleFlags: () => ({ ...roleStore.get() }),
    clear: () => roleStore.clear(),
};


export const uiState = {
    setSiteDropdownVisible: async (isVisible = false) => {
        await uiStore.set((prev) => ({
            ...prev,
            siteDropdownVisible: asBoolean(isVisible),
        }));
    },
    isSiteDropdownVisible: () => uiStore.get().siteDropdownVisible,
    setWithdrawalStatusFlags: async (flags = {}) => {
        await uiStore.set((prev) => ({
            ...prev,
            withdrawalFlags: {
                hasPriorParticipationStatus: asBoolean(flags.hasPriorParticipationStatus ?? prev.withdrawalFlags.hasPriorParticipationStatus),
                hasPriorSuspendedContact: asBoolean(flags.hasPriorSuspendedContact ?? prev.withdrawalFlags.hasPriorSuspendedContact),
            },
        }));
    },
    getWithdrawalStatusFlags: () => ({ ...uiStore.get().withdrawalFlags }),
    clearWithdrawalStatusFlags: async () => {
        await uiStore.set((prev) => ({
            ...prev,
            withdrawalFlags: validateWithdrawalFlags(WITHDRAWAL_DEFAULTS),
        }));
    },
    /**
     * Get active columns from uiState (synchronous)
     * @return {Array|undefined} Array of active column keys (normalized: numbers for concept IDs, strings for non-numeric keys) or undefined if not set
     */
    getActiveColumns: () => {
        return uiStore.get().activeColumns;
    },
    /**
     * Update active columns in uiState
     * Normalizes column values: numeric strings become numbers, non-numeric strings remain strings
     * @param {Array} columns - Array of column keys (strings or numbers)
     */
    updateActiveColumns: async (columns) => {
        if (!Array.isArray(columns)) {
            console.warn('uiState.updateActiveColumns: columns must be an array');
            return;
        }

        // Normalize all column values for consistent storage
        const normalizedColumns = columns.map(col => normalizeColumnValue(col));

        await uiStore.set((prev) => ({
            ...prev,
            activeColumns: normalizedColumns,
        }));
    },
    setFiltersExpanded: async (isExpanded = true) => {
        await uiStore.set((prev) => ({
            ...prev,
            filtersExpanded: asBoolean(isExpanded),
        }));
    },
    isFiltersExpanded: () => uiStore.get().filtersExpanded,
    clear: () => uiStore.clear(),
};

// Participant State Management
// Cache for in-flight recovery promise to prevent concurrent recovery attempts.
//   --Race condition on multi-refresh. Specifically observed in local development.
let participantRecoveryPromise = null;

export const participantState = {
    /**
     * Set participant data in memory and store `token` in sessionStorage for recovery on page refresh
     * @param {Object} participant - The participant object with token property
     */
    setParticipant: async (participant) => {
        if (!participant) {
            console.warn('participantState.setParticipant: participant is null or undefined');
            return;
        }

        appState.setState({ participant });
        if (!participant.token) {
            console.warn('participantState.setParticipant: participant missing token property');
            return;
        }

        // Encrypt and persist token for recovery
        try {
            const uid = getCurrentUID();
            if (!uid) return; // cannot derive key without uid
            const enc = await encryptString(participant.token, uid);
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('participantTokenEnc', enc);
            }
        } catch (e) {
            console.warn('participantState.setParticipant encryption failed', e);
        }
    },

    /**
     * Get participant data from memory
     * @return {Object|null} The participant object or null if not set
     */
    getParticipant: () => {
        return appState.getState().participant || null;
    },

    /**
     * Clear participant data from memory and sessionStorage
     * Also clears associated reports data
     */
    clearParticipant: () => {
        appState.setState({ participant: null });
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('participantTokenEnc');
        }
        // Clear the recovery promise cache and associated reports
        participantRecoveryPromise = null;

        if (typeof reportsState !== 'undefined') {
            reportsState.clearReports();
        }
    },

    /**
     * Get participant token from sessionStorage for recovery
     * @return {string|null} The participant token or null if not set
     */
    getParticipantToken: async () => {
        try {
            const uid = getCurrentUID();
            if (typeof sessionStorage === 'undefined' || !uid) return null;
            const payload = sessionStorage.getItem('participantTokenEnc');
            if (!payload) return null;
            try {
                return await decryptString(payload, uid);
            } catch (e) {
                // tampered/old version. Clear and return null
                sessionStorage.removeItem('participantTokenEnc');
                return null;
            }
        } catch (error) {
            console.warn('participantState.getParticipantToken error', error);
            return null;
        }
    },

    /**
     * Check if participant is currently set in memory
     * @return {boolean} True if participant is set, false otherwise
     */
    hasParticipant: () => {
        return !!appState.getState().participant;
    },

    /**
     * Recover participant from Firestore using token in sessionStorage
     * Protects against concurrent recovery attempts during rapid page refreshes
     * @return {Promise<Object|null>} The participant object or null if recovery fails
     */
    recoverParticipantFromSession: async () => {
        // If recovery is already in progress, return the existing promise
        if (participantRecoveryPromise) {
            return participantRecoveryPromise;
        }

        participantRecoveryPromise = (async () => {
            try {
                const sessionToken = await participantState.getParticipantToken();

                if (!sessionToken) {
                    return null;
                }

                // Dynamic import to avoid circular dependency
                const { findParticipant } = await participantLookupLoader();
                const response = await findParticipant(`token=${sessionToken}`);

                if (response.code === 200 && response.data && response.data[0]) {
                    const participant = response.data[0];
                    appState.setState({ participant });
                    return participant;

                } else {
                    // Token is invalid or participant not found
                    console.warn('Participant recovery failed: invalid token or participant not found');
                    appState.setState({ participant: null });
                    if (typeof sessionStorage !== 'undefined') {
                        sessionStorage.removeItem('participantTokenEnc');
                    }
                    return null;
                }

            } catch (error) {
                console.error('Error recovering participant from session:', error);
                // On network/API error, keep token for retry, just clear memory
                appState.setState({ participant: null });
                return null;

            } finally {
                // Clear the promise cache when done (success or failure)
                participantRecoveryPromise = null;
            }
        })();

        return participantRecoveryPromise;
    },

    /**
     * Get participant from memory or attempt session-based recovery from Firestore
     * @return {Promise<Object|null>} The participant object or null if not available
     */
    getParticipantFromState: async () => {
        let participant = participantState.getParticipant();

        if (!participant) {
            participant = await participantState.recoverParticipantFromSession();
        }

        return participant;
    }
};

// User Session Management
export const userSession = {
    /**
     * Set user session data in sessionStorage
     * @param {Object} userData - User data object (e.g., {email: 'user@example.com'})
     */
    setUser: (userData) => {
        if (userData && userData.email) {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('userSession', JSON.stringify(userData));
            }
        } else {
            console.warn('userSession.setUser: userData missing or invalid');
        }
    },

    /**
     * Get user session data from sessionStorage
     * @return {Object|null} User data object or null if not set
     */
    getUser: () => {
        try {
            if (typeof sessionStorage === 'undefined') return null;
            const userSession = sessionStorage.getItem('userSession');
            return userSession ? JSON.parse(userSession) : null;
        } catch (error) {
            console.error('Error parsing user session:', error);
            return null;
        }
    },

    /**
     * Get user email from session
     * @return {string} User email or empty string if not available
     */
    getUserEmail: () => {
        const user = userSession.getUser();
        return user?.email || '';
    },

    /**
     * Clear user session data
     */
    clearUser: () => {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('userSession');
        }
    },

    /**
     * Check if user is currently logged in (has valid session)
     * @return {boolean} True if user session exists, false otherwise
     */
    hasUser: () => {
        return !!userSession.getUser();
    }
};

// Reports State Management
export const reportsState = {
    /**
     * Set reports data in memory (appState only, not persisted to sessionStorage)
     * @param {Object} reports - The reports object (e.g., { physActReport: {...} })
     */
    setReports: (reports) => {
        if (!reports) {
            console.warn('reportsState.setReports: reports is null or undefined');
            return;
        }
        appState.setState({ reports });
    },

    /**
     * Get reports data from memory
     * @return {Object|null} The reports object or null if not set
     */
    getReports: () => {
        return appState.getState().reports || null;
    },

    /**
     * Clear reports data from memory
     */
    clearReports: () => {
        appState.setState({ reports: null });
    },

    /**
     * Get reports from memory or fetch if not available
     * @param {Object} participant - The participant object
     * @param {Function} retrievePhysicalActivityReport - Function to fetch the report
     * @return {Promise<Object>} The reports object
     */
    getReportsFromState: async (participant, retrievePhysicalActivityReport) => {
        // First try fetching from memory, then from Firestore
        let reports = reportsState.getReports();

        if (!reports) {
            reports = {};
            const physActReport = await retrievePhysicalActivityReport(participant);
            if (physActReport) {
                reports.physActReport = physActReport;
            }
            reportsState.setReports(reports);
        }
        return reports;
    }
};

// Search State Management
// Manages participant search results and metadata

let searchMetadataCache = null;
let searchResultsCache = null;

const sanitizeMetadata = (metadata, overrides = {}) => {
    if (!metadata && (!overrides || Object.keys(overrides).length === 0)) {
        return null;
    }

    const merged = { ...(metadata || {}), ...(overrides || {}) };
    const inferredType = merged.searchType || (merged.predefinedType || merged.routeKey ? 'predefined' : undefined);

    if (inferredType === 'predefined') {
        const predefinedType = merged.predefinedType ?? merged.effectiveType ?? merged.routeKey ?? '';
        const effectiveType = merged.effectiveType ?? predefinedType;
        const routeKey = merged.routeKey ?? predefinedType ?? effectiveType ?? '';

        return {
            searchType: 'predefined',
            predefinedType,
            effectiveType,
            routeKey,
            siteCode: merged.siteCode ?? '',
            startDateFilter: merged.startDateFilter ?? '',
            endDateFilter: merged.endDateFilter ?? '',
            pageNumber: merged.pageNumber ?? 1,
            direction: merged.direction ?? '',
            cursorHistory: Array.isArray(merged.cursorHistory) ? merged.cursorHistory : [],
        };
    }

    // For lookup searches
    return { ...merged };
};

const persistSearchMetadata = async (metadata) => {
    if (!metadata) return;
    try {
        const uid = getCurrentUID();
        if (!uid) return; // cannot derive key without uid
        const enc = await encryptString(JSON.stringify(metadata), uid);
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('searchMetadataEnc', enc);
        }
    } catch (e) {
        console.warn('searchState.persistSearchMetadata encryption failed', e);
    }
};

export const searchState = {
    /**
     * Set search results in memory and store encrypted metadata in sessionStorage
     * Two search types:
     *   --predefined searches are participant lists from the navigation menu, including 'all', 'verified', 'cannotbeverified', etc.
     *   --lookup searches are individual participant details from the participant lookup form, including 'firstName', 'lastName', 'dob', 'phone', 'email', 'connectId', 'token', 'studyId'
     * @param {Object} searchMetadata - Search parameters and pagination state
     * @param {Array} resultsArray - Array of participant objects for current page
     */
    setSearchResults: async (searchMetadata, resultsArray) => {
        if (!searchMetadata) {
            console.warn('searchState.setSearchResults: metadata is null or undefined');
            return;
        }

        const normalizedMetadata = sanitizeMetadata(searchMetadata);
        searchResultsCache = Array.isArray(resultsArray) ? resultsArray : null;

        searchMetadataCache = normalizedMetadata;
        await persistSearchMetadata(normalizedMetadata);
    },

    /**
     * Initialize metadata for predefined searches (route + filters)
     * @param {Object} metadata
     */
    initializePredefinedMetadata: async (metadata) => {
        if (!metadata) return null;
        const normalized = sanitizeMetadata({ searchType: 'predefined' }, metadata);
        searchMetadataCache = normalized;
        await persistSearchMetadata(normalized);
        return { ...normalized };
    },

    /**
     * Merge metadata updates for predefined searches
     * @param {Object} updates
     */
    updatePredefinedMetadata: async (updates = {}) => {
        const base = searchMetadataCache && searchMetadataCache.searchType === 'predefined'
            ? searchMetadataCache
            : { searchType: 'predefined' };

        const mergedMetadata = sanitizeMetadata(base, updates);
        searchMetadataCache = mergedMetadata;
        await persistSearchMetadata(mergedMetadata);
        return { ...mergedMetadata };
    },

    /**
     * Get search results from memory
     * @return {Array|null} The search results array or null if not set
     */
    getSearchResults: () => {
        if (searchResultsCache) return searchResultsCache;
        return null;
    },

    /**
     * Clear cached search results (keep metadata so queries can be re-run)
     */
    clearResultsCache: () => {
        searchResultsCache = null;
    },

    /**
     * Get cached metadata synchronously
     * @return {Object|null}
     */
    getCachedMetadata: () => {
        if (!searchMetadataCache) return null;
        return { ...searchMetadataCache };
    },

    /**
     * Get decrypted search metadata from sessionStorage
     * @return {Promise<Object|null>} The search metadata object or null if not set
     */
    getSearchMetadata: async () => {
        if (searchMetadataCache) {
            return { ...searchMetadataCache };
        }

        try {
            const uid = getCurrentUID();
            if (typeof sessionStorage === 'undefined' || !uid) return null;
            const payload = sessionStorage.getItem('searchMetadataEnc');
            if (!payload) return null;
            try {
                const decrypted = await decryptString(payload, uid);
                const parsed = JSON.parse(decrypted);
                const normalized = sanitizeMetadata(parsed);
                searchMetadataCache = normalized;
                return { ...normalized };
            } catch (e) {
                // tampered/old version. Clear and return null
                sessionStorage.removeItem('searchMetadataEnc');
                searchMetadataCache = null;
                return null;
            }
        } catch (error) {
            console.error('Error retrieving search metadata:', error);
            return null;
        }
    },

    /**
     * Check if search metadata exists in sessionStorage (synchronous check)
     * @return {boolean} True if search metadata exists, false otherwise
     */
    hasSearchResults: () => {
        if (searchMetadataCache) return true;
        if (typeof sessionStorage === 'undefined') return false;
        return !!sessionStorage.getItem('searchMetadataEnc');
    },

    /**
     * Clear search results from memory and sessionStorage
     */
    clearSearchResults: () => {
        searchResultsCache = null;
        searchMetadataCache = null;
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('searchMetadataEnc');
        }
    },
};

/**
 * Clear cached participant search data, preserve search metadata. To re-trigger search.
 * This protects against stale (cached) results when navigating back to the search results page after making changes to the participant profile.
 */
export const invalidateSearchResultsCache = () => {
    if (typeof searchState.clearResultsCache === 'function') {
        searchState.clearResultsCache();
    } else {
        searchState.clearSearchResults();
    }
};

/**
 * Compose normalized metadata for predefined participant searches.
 * Accepts a base object and applies defaults.
 * @param {Object} baseObj - Partial metadata (from cache or route context)
 * @returns {Object} Normalized predefined search metadata (searches including 'all', 'verified', 'cannotbeverified', etc.)
 */
export const buildPredefinedSearchMetadata = (baseObj = {}) => sanitizeMetadata({ searchType: 'predefined' }, baseObj);

/**
 * Unsaved Changes Management -- Participant Details Page
 * Mark there are unsaved changes in the UI
 */
export const markUnsaved = () => {
    appState.setState({ hasUnsavedChanges: true });
};

/**
 * Clear the unsaved changes indicator
 */
export const clearUnsaved = () => {
    appState.setState({ hasUnsavedChanges: false, changedOption: {} });
};

/**
 * Clear the user session and reset the application state
 */
export const signOutAndClearSession = () => {
    const auth = getAuth();
    auth?.signOut?.();
    hideAnimation();
    userSession.clearUser();
    participantState.clearParticipant();
    roleState.clear();
    uiState.clear();
    statsState.clear();
    reportsState.clearReports();
    appState.setState({ hasUnsavedChanges: false });
    resetAppStateUID();
    window.location.hash = '#';
};
