import { updateNavBar } from './navigationBar.js';
import { filterBySiteKey, renderTablePage } from './participantCommons.js';
import { getDataAttributes, getIdToken, showAnimation, hideAnimation, baseAPI, urls, escapeHTML, renderSiteDropdown } from './utils.js';
import { participantState, searchState } from './stateManager.js';
import { nameToKeyObj } from './idsToName.js';
import { addFormInputFormattingListeners } from './participantDetailsHelpers.js';

const getMainContent = () => (typeof document !== 'undefined' ? document.getElementById('mainContent') : null);

export function renderParticipantLookup(){
    searchState.clearSearchResults(); // Clear search cache when showing fresh lookup form
    updateNavBar('participantLookupBtn');

    const mainContent = getMainContent();
    if (!mainContent) return;
    mainContent.innerHTML = renderParticipantSearch();

    // Add all event listeners after DOM updates
    requestAnimationFrame(() => {
        if (typeof document === 'undefined') return;
        addEventSearch();
        addEventSearchId();
        addFormInputFormattingListeners();
        triggerLookup();
    });
}

export function renderParticipantSearch() {
    return `
        <div class="container">
        <div id="root">
        <div id="alert_placeholder"></div>
                <div class="row">
                <div class="col-lg">
                    <h5>Participant Lookup</h5>
                </div>
            </div>
            <div class="row">
                <div class="col-lg">
                    <div class="row form-row">
                        <form id="search" method="POST">
                            <!-- NOTE: aria-autocomplete="none" used as a workaround to suppress Edge autofill behavior -->
                            <div class="form-group">
                                <label class="col-form-label search-label" for="firstName">First name</label>
                                <input class="form-control" autocomplete="off" aria-autocomplete="none" name="searchFirstName" type="text" id="firstName" placeholder="Enter First Name"/>
                            </div>
                            <div class="form-group">
                                <label class="col-form-label search-label" for="lastName">Last name</label>
                                <input class="form-control" autocomplete="off" aria-autocomplete="none" name="searchLastName" type="text" id="lastName" placeholder="Enter Last Name"/>
                            </div>
                            <div class="form-group">
                                <label class="col-form-label search-label" for="dob">Date of birth</label>
                                <input class="form-control" autocomplete="off" aria-autocomplete="none" name="searchDOB" type="date" id="dob"/>
                            </div>
                            <div class="form-group">
                                <label class="col-form-label search-label" for="phone">Phone number</label>
                                <input class="form-control phone-input" autocomplete="off" aria-autocomplete="none" name="searchPhone" id="phone" placeholder="(999) 999-9999" maxlength="14"/>
                            </div>
                            <span><i> (OR) </i></span>
                            <br />
                            <div class="form-group">
                                <label class="col-form-label search-label" for="email">Email</label>
                                <input class="form-control" autocomplete="off" aria-autocomplete="none" name="searchEmail" type="email" id="email" placeholder="Enter Email"/>
                            </div>
                            ${renderSiteDropdown('lookup', 'dropdownMenuLookupSites')}
                            <div id="search-failed" class="search-not-found" hidden>
                                The participant with entered search criteria not found!
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-outline-primary">Search</button>
                            </div>
                        </form>
                    </div>
                </div>
                <div class="col-lg">
                    <div class="row form-row">
                        <form id="searchId" method="POST">
                            <div class="form-group">
                                <label class="col-form-label search-label" for="connectId">Connect ID</label>
                                <input class="form-control" autocomplete="off" aria-autocomplete="none" type="text" maxlength="10" id="connectId" placeholder="Enter ConnectID"/>
                            </div>
                            <span><i> (OR) </i></span>
                            <div class="form-group">
                                <label class="col-form-label search-label" for="token">Token</label>
                                <input class="form-control" autocomplete="off" aria-autocomplete="none" type="text" maxlength="36" id="token" placeholder="Enter Token"/>
                            </div>
                            <span><i> (OR) </i></span>
                            <div class="form-group">
                                <label class="col-form-label search-label" for="studyId">Study ID</label>
                                <input class="form-control" autocomplete="off" aria-autocomplete="none" type="text" maxlength="36" id="studyId" placeholder="Enter StudyID"/>
                            </div>
                            <div id="search-connect-id-failed" class="search-not-found" hidden>
                                The participant with entered search criteria not found!
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-outline-primary">Search</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            </div>
        </div>
        `;


}


const triggerLookup = () => {
    if (typeof document === 'undefined') return;
    const dropdownMenuButton = document.getElementById('dropdownMenuLookupSites');
    const dropdownFilter = document.getElementById('dropdownSites');

    if (dropdownMenuButton) {
        dropdownMenuButton.addEventListener('click', (e) => {
            dropdownFilter.innerHTML = escapeHTML(e.target.textContent);
            dropdownFilter.setAttribute("data-siteKey", getDataAttributes(e.target).sitekey);
        });
    }
}

const addEventSearch = () => {
    if (typeof document === 'undefined') return;
    const form = document.getElementById('search');

    if(!form) return;
    form.addEventListener('submit', e => {
        document.getElementById("search-failed").hidden = true;
        e.preventDefault();
        const firstName = document.getElementById('firstName').value?.toLowerCase();
        const lastName = document.getElementById('lastName').value?.toLowerCase();
        const dob = document.getElementById('dob').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const sitePref = document.getElementById('dropdownSites').getAttribute('data-siteKey');

        const params = new URLSearchParams();
        if (firstName) params.append('firstName', firstName);
        if (lastName) params.append('lastName', lastName);
        if (dob) params.append('dob', dob.replace(/-/g,''));
        if (phone) params.append('phone', phone.replace(/\D/g, ''));
        if (email) params.append('email', email);

        if (params.size === 0) {
            return alert('Please enter at least one field to search');
        };

        // Create search metadata for caching
        const searchMetadata = {
            searchType: 'lookup',
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            dob: dob || undefined,
            phone: phone || undefined,
            email: email || undefined,
            siteFilter: sitePref,
            pageNumber: 1,
            direction: '',
            cursorHistory: []
        };

        performSearch(params.toString(), sitePref, "search-failed", searchMetadata);
    })
};

export const addEventSearchId = () => {
    if (typeof document === 'undefined') return;
    const form = document.getElementById('searchId');
    if(!form) return;
    form.addEventListener('submit', e => {
        document.getElementById("search-connect-id-failed").hidden = true;
        e.preventDefault();
        const connectId = document.getElementById('connectId').value;
        const token = document.getElementById('token').value;
        const studyId = document.getElementById('studyId').value;

        const params = new URLSearchParams();
        if (connectId) params.append('connectId', connectId);
        if (token) params.append('token', token);
        if (studyId) params.append('studyId', studyId);

        if (params.size === 0) {
            return alert('Please enter at least one field to search');
        };

        // Create search metadata for caching
        const searchMetadata = {
            searchType: 'lookup',
            connectId: connectId || undefined,
            token: token || undefined,
            studyId: studyId || undefined,
            siteFilter: "allResults",
            pageNumber: 1,
            direction: '',
            cursorHistory: []
        };

        performSearch(params.toString(), "allResults", "search-connect-id-failed", searchMetadata);
    })
};

const alertTrigger = () => {
    if (typeof document === 'undefined') return '';
    let alertList = document.getElementById('alert_placeholder');
    if (!alertList) return '';
    let template = ``;
    template += `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
        The participant with entered search criteria not found!
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    </div>`
    alertList.innerHTML = template;
    return template;
}

export const performSearch = async (query, siteAbbr, failedElem, cacheMetadata = null) => {
    try {
        showAnimation();

        const response = await findParticipant(query);

        if(response.code !== 200) {
            throw new Error('Search failed with code:', response.code, response.message);
        }

        // Note: this only happens when isParent=true AND site filter is applied.
        // Otherwise, pt data is filtered during the query in ConnectFaas.
        const siteFilteredData = filterBySiteKey(response.data, siteAbbr);
        if (siteFilteredData.length === 0) {
            if (typeof document !== 'undefined') {
                const failedEl = document.getElementById(failedElem);
                if (failedEl) failedEl.hidden = false;
            }
            return alertTrigger();
        }

        // Cache search results and metadata
        if (cacheMetadata) {
            await searchState.setSearchResults(cacheMetadata, siteFilteredData);
        }

        renderTablePage(siteFilteredData, 'participantLookup');
        attachBackToSearchHandler();

    } catch (error) {
        console.error('Error during participant search:', error);
        if (typeof document !== 'undefined') {
            const failedEl = document.getElementById(failedElem);
            if (failedEl) failedEl.hidden = false;
        }
        alertTrigger();

    } finally {
        hideAnimation();
    }
}

export const showNotifications = (data, error) => {
    document.getElementById("search-failed").hidden = false;
}

export const findParticipant = async (query) => {
    try {
        const idToken = await getIdToken();
        const response = await fetch(`${baseAPI}/dashboard?api=getFilteredParticipants&${query}`, {
            method: "GET",
            headers: {
                Authorization:"Bearer " + idToken
            }
        });

        const json = await response.json();

        if (!response.ok) {
            throw new Error(`Error fetching participants: ${response.status} - ${json?.message || 'Unknown error'}`);
        }

        return json;

    } catch (error) {
        console.error('Error in findParticipant():', error);
        return { code: 500, message: error.message, data: [] };
    }
}

/**
 * Rebuild query string from search metadata for re-fetching results
 * @param {Object} metadata - Search metadata object
 * @return {string} Query string for API call
 */
export const rebuildQueryString = (metadata) => {
    const params = new URLSearchParams();
    if (metadata.firstName) params.append('firstName', metadata.firstName);
    if (metadata.lastName) params.append('lastName', metadata.lastName);
    if (metadata.dob) params.append('dob', metadata.dob.replace(/-/g, ''));
    if (metadata.phone) params.append('phone', metadata.phone.replace(/\D/g, ''));
    if (metadata.email) params.append('email', metadata.email);
    if (metadata.connectId) params.append('connectId', metadata.connectId);
    if (metadata.token) params.append('token', metadata.token);
    if (metadata.studyId) params.append('studyId', metadata.studyId);
    return params.toString();
};

/**
 * Render cached search results or re-fetch if not in memory
 * If results are in memory, render them. Else, re-fetch with stored metadata.
 */
export const renderCachedSearchResults = async () => {
    const cachedResults = searchState.getSearchResults();
    const metadata = await searchState.getSearchMetadata();

    if (cachedResults) {
        renderTablePage(cachedResults, 'participantLookup');
        attachBackToSearchHandler();

    } else if (metadata) {
        const queryString = rebuildQueryString(metadata);
        await performSearch(queryString, metadata.siteFilter, 'search-failed', metadata);

    } else {
        console.error('Error in renderCachedSearchResults: No search metadata found, falling back to empty lookup form');
        renderParticipantLookup();
    }
};

/**
 * Navigate back to the user's most recent search results.
 * Lookup searches render cached rows (or re-fetch with saved params).
 * Predefined searches route back to the stored participants slug so the
 * router can restore pagination, filters, and results from the cache.
 */
export const navigateBackToSearchResults = async () => {
    try {
        const metadata = await searchState.getSearchMetadata();

        if (!metadata) {
            renderParticipantLookup();
            return;
        }

        if (metadata.searchType === 'lookup') {
            await renderCachedSearchResults();
            return;
        }

        if (metadata.searchType === 'predefined') {
            const routeKey = metadata.routeKey || metadata.predefinedType || 'all';

            if (!metadata.routeKey || metadata.routeKey !== routeKey) {
                await searchState.updatePredefinedMetadata({ routeKey });
            }

            const targetHash = `#participants/${routeKey}`;
            if (window.location.hash === targetHash) {
                window.dispatchEvent(new HashChangeEvent('hashchange'));
            } else {
                window.location.hash = targetHash;
            }
            return;
        }

        renderParticipantLookup();
    } catch (error) {
        console.error('navigateBackToSearchResults error:', error);
        renderParticipantLookup();
    }
};

/**
 * Attach handler to the "Back to Search" button within lookup results
 */
export const attachBackToSearchHandler = () => {
    const element = document.getElementById('back-to-search');
    if (!element) return;
    element.onclick = () => {
        const mode = element.dataset.backMode;

        if (mode === 'lookup-form') {
            renderParticipantLookup();
            return;
        }

        navigateBackToSearchResults().catch((error) => {
            console.error('Error navigating back to search results:', error);
            renderParticipantLookup();
        });
    };
};
