// // State Management
import { encryptString, decryptString } from './crypto.js';

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

export const appState = createStore();

// Participant State Management
// Cache for in-flight recovery promise to prevent concurrent recovery attempts.
//   --Race condition on multi-refresh. Specifically observed in local development.
let participantRecoveryPromise = null;

export const participantState = {
    /**
     * Set participant data in memory and store `token` in sessionStorage for recovery on page refresh
     * @param {Object} participant - The participant object with token property
     */
    setParticipant: (participant) => {
        if (!participant) {
            console.warn('participantState.setParticipant: participant is null or undefined');
            return;
        }

      appState.setState({ participant });
      if (participant.token) {
          // Encrypt and persist token for recovery
          (async () => {
              try {
                  const uid = firebase?.auth?.().currentUser?.uid;
                  if (!uid) return; // cannot derive key without uid
                  const enc = await encryptString(participant.token, uid);
                  sessionStorage.setItem('participantTokenEnc', enc);
              } catch (e) {
                  console.warn('participantState.setParticipant encryption failed');
              }
          })();
      } else {
          console.warn('participantState.setParticipant: participant missing token property');
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
        sessionStorage.removeItem('participantTokenEnc');
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
            const uid = firebase?.auth?.().currentUser?.uid;
            const payload = sessionStorage.getItem('participantTokenEnc');
            if (!payload || !uid) return null;
            try {
                return await decryptString(payload, uid);
            } catch (e) {
                // tampered/old version. Clear and return null
                sessionStorage.removeItem('participantTokenEnc');
                return null;
            }
        } catch (error) {
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

        const sessionToken = await participantState.getParticipantToken();

        if (!sessionToken) {
            return null;
        }

        // Create and cache the recovery promise
        participantRecoveryPromise = (async () => {
            try {
                // Dynamic import to avoid circular dependency
                const { findParticipant } = await import('./participantLookup.js');
                const response = await findParticipant(`token=${sessionToken}`);

                if (response.code === 200 && response.data && response.data[0]) {
                    const participant = response.data[0];
                    appState.setState({ participant });
                    return participant;

                } else {
                    // Token is invalid or participant not found
                    console.warn('Participant recovery failed: invalid token or participant not found');
                    appState.setState({ participant: null });
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
            sessionStorage.setItem('userSession', JSON.stringify(userData));
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
        sessionStorage.removeItem('userSession');
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

    return { ...merged };
};

const persistMetadataAsync = (metadata) => {
    if (!metadata) return;
    (async () => {
        try {
            const uid = firebase?.auth?.().currentUser?.uid;
            if (!uid) return; // cannot derive key without uid
            const enc = await encryptString(JSON.stringify(metadata), uid);
            sessionStorage.setItem('searchMetadataEnc', enc);
        } catch (e) {
            console.warn('searchState.persistMetadataAsync encryption failed', e);
        }
    })();
};

export const searchState = {
    /**
     * Set search results in memory and store encrypted metadata in sessionStorage
     * @param {Object} searchMetadata - Search parameters and pagination state
     * @param {Array} resultsArray - Array of participant objects for current page
     */
    setSearchResults: (searchMetadata, resultsArray) => {
        if (!searchMetadata) {
            console.warn('searchState.setSearchResults: metadata is null or undefined');
            return;
        }

        const normalizedMetadata = sanitizeMetadata(searchMetadata);
        searchResultsCache = Array.isArray(resultsArray) ? resultsArray : null;

        searchMetadataCache = normalizedMetadata;
        persistMetadataAsync(normalizedMetadata);
    },

    /**
     * Initialize metadata for predefined searches (route + filters)
     * @param {Object} metadata
     */
    initializePredefinedMetadata: async (metadata) => {
        if (!metadata) return null;
        const normalized = sanitizeMetadata({ searchType: 'predefined' }, metadata);
        searchMetadataCache = normalized;
        persistMetadataAsync(normalized);
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

        const next = sanitizeMetadata(base, updates);
        searchMetadataCache = next;
        persistMetadataAsync(next);
        return { ...next };
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
            const uid = firebase?.auth?.().currentUser?.uid;
            const payload = sessionStorage.getItem('searchMetadataEnc');
            if (!payload || !uid) return null;
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
        return !!sessionStorage.getItem('searchMetadataEnc');
    },

    /**
     * Clear search results from memory and sessionStorage
     */
    clearSearchResults: () => {
        searchResultsCache = null;
        searchMetadataCache = null;
        sessionStorage.removeItem('searchMetadataEnc');
    },
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
    appState.setState({ hasUnsavedChanges: false });
};
