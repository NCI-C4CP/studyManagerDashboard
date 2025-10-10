import { dashboardNavBarLinks, removeActiveClass } from './navigationBar.js';
import { renderTable, filterBySiteKey, renderParticipantSearchResults, activeColumns, renderTablePage } from './participantCommons.js';
import { getDataAttributes, getIdToken, showAnimation, hideAnimation, baseAPI, urls, escapeHTML, renderSiteDropdown, resetPagination } from './utils.js';
import { nameToKeyObj } from './idsToName.js';
import { addFormInputFormattingListeners } from './participantDetailsHelpers.js';

export function renderParticipantLookup(){
    resetPagination();
    document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks();
    removeActiveClass('nav-link', 'active');
    document.getElementById('participantLookupBtn').classList.add('active');
    localStorage.removeItem("participant");

    mainContent.innerHTML = renderParticipantSearch();
    
    // Add all event listeners after DOM updates
    requestAnimationFrame(() => {
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
                            <div class="form-group">
                                <label class="col-form-label search-label">First name</label>
                                <input class="form-control" autocomplete="off" type="text" id="firstName" placeholder="Enter First Name"/>
                            </div>
                            <div class="form-group">
                                <label class="col-form-label search-label">Last name</label>
                                <input class="form-control" autocomplete="off" type="text" id="lastName" placeholder="Enter Last Name"/>
                            </div>
                            <div class="form-group">
                                <label class="col-form-label search-label">Date of birth</label>
                                <input class="form-control" autocomplete="off" type="date" id="dob"/>
                            </div>
                            <div class="form-group">
                                <label class="col-form-label search-label">Phone number</label>
                                <input class="form-control phone-input" autocomplete="off" id="phone" placeholder="(999) 999-9999" maxlength="14"/>
                            </div>
                            <span><i> (OR) </i></span>
                            <br />
                            <div class="form-group">
                                <label class="col-form-label search-label">Email</label>
                                <input class="form-control" autocomplete="off" type="email" id="email" placeholder="Enter Email"/>
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
                                <label class="col-form-label search-label">Connect ID</label>
                                <input class="form-control" autocomplete="off" type="text" maxlength="10" id="connectId" placeholder="Enter ConnectID"/>
                            </div>
                            <span><i> (OR) </i></span>
                            <div class="form-group">
                                <label class="col-form-label search-label">Token</label>
                                <input class="form-control" autocomplete="off" type="text" maxlength="36" id="token" placeholder="Enter Token"/>
                            </div>
                            <span><i> (OR) </i></span>
                            <div class="form-group">
                                <label class="col-form-label search-label">Study ID</label>
                                <input class="form-control" autocomplete="off" type="text" maxlength="36" id="studyId" placeholder="Enter StudyID"/>
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
        performSearch(params.toString(), sitePref, "search-failed");
    })
};

export const addEventSearchId = () => {
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

        performSearch(params.toString(), "allResults", "search-connect-id-failed");
    })
};

const alertTrigger = () => {
    let alertList = document.getElementById('alert_placeholder');
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

export const performSearch = async (query, siteAbbr, failedElem) => {
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
            document.getElementById(failedElem).hidden = false;
            return alertTrigger();
        }
        
        renderTablePage(siteFilteredData, 'participantLookup');
        
        const element = document.getElementById('back-to-search');
        element.addEventListener('click', () => { 
            renderParticipantLookup();
        });
        
    } catch (error) {
        console.error('Error during participant search:', error);
        document.getElementById(failedElem).hidden = false;
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

// TODO: Oct 2025 -- from pt details page, render previous search results.
export const renderLookupResultsTable = () => {
    const loadDetailsPage = '#participants/all'
    location.replace(window.location.origin + window.location.pathname + loadDetailsPage); // updates url to participantsAll
}
