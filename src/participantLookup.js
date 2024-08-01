import { dashboardNavBarLinks, removeActiveClass } from './navigationBar.js';
import { renderTable, filterdata, filterBySiteKey, renderData, addEventFilterData, activeColumns } from './participantCommons.js';
import { internalNavigatorHandler, getDataAttributes, getIdToken, showAnimation, hideAnimation, baseAPI, urls } from './utils.js';
import { nameToKeyObj } from './idsToName.js';

export function renderParticipantLookup(){
    const isParent = localStorage.getItem('isParent')
    document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks(isParent);
    removeActiveClass('nav-link', 'active');
    document.getElementById('participantLookupBtn').classList.add('active');
    localStorage.removeItem("participant");
    let counter = 0;
    internalNavigatorHandler(counter)
    mainContent.innerHTML = renderParticipantSearch();
    renderLookupSiteDropdown();
    addEventSearch();
    addEventSearchId();
    triggerLookup();
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
                                <input class="form-control" type="date" id="dob"/>
                            </div>
                            <div class="form-group">
                                <label class="col-form-label search-label">Phone number</label>
                                <input class="form-control" id="phone" placeholder="Enter a 10-digit phone number"/>
                            </div>
                            <span><i> (OR) </i></span>
                            <br />
                            <div class="form-group">
                                <label class="col-form-label search-label">Email</label>
                                <input class="form-control" type="email" id="email" placeholder="Enter Email"/>
                            </div>
                            <div class="form-group dropdown" id="siteDropdownLookup" hidden>
                                <label class="col-form-label search-label">Site Preference </label> &nbsp;
                                <button class="btn btn-primary btn-lg dropdown-toggle" type="button" id="dropdownSites" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Filter by Site
                                </button>
                                <ul class="dropdown-menu" id="dropdownMenuLookupSites" aria-labelledby="dropdownMenuButton">
                                    <li><a class="dropdown-item" data-siteKey="allResults" id="all">All</a></li>
                                    <li><a class="dropdown-item" data-siteKey="BSWH" id="BSWH">Baylor Scott & White Health</a></li>
                                    <li><a class="dropdown-item" data-siteKey="hfHealth" id="hfHealth">Henry Ford HS</a></li>
                                    <li><a class="dropdown-item" data-siteKey="hPartners" id="hPartners">Health Partners</a></li>
                                    <li><a class="dropdown-item" data-siteKey="kpGA" id="kpGA">KP GA</a></li>
                                    <li><a class="dropdown-item" data-siteKey="kpHI" id="kpHI">KP HI</a></li>
                                    <li><a class="dropdown-item" data-siteKey="kpNW" id="kpNW">KP NW</a></li>
                                    <li><a class="dropdown-item" data-siteKey="kpCO" id="kpCO">KP CO</a></li>
                                    <li><a class="dropdown-item" data-siteKey="maClinic" id="maClinic">Marshfield Clinic</a></li>
                                    ${((location.host !== urls.prod) && (location.host !== urls.stage)) ? `<li><a class="dropdown-item" data-siteKey="nci" id="nci">NCI</a></li>` : ``}
                                    <li><a class="dropdown-item" data-siteKey="snfrdHealth" id="snfrdHealth">Sanford Health</a></li>
                                    <li><a class="dropdown-item" data-siteKey="uChiM" id="uChiM">UofC Medicine</a></li>
                                </ul>
                            </div>
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
    let dropdownMenuButton = document.getElementById('dropdownMenuLookupSites');
    let a = document.getElementById('dropdownSites');
    if (dropdownMenuButton) {
        dropdownMenuButton.addEventListener('click', (e) => {
            a.innerHTML = e.target.textContent;
            const t = getDataAttributes(e.target)
            const att = document.getElementById('dropdownSites').setAttribute("data-siteKey", t.sitekey);
        })
       
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

export const performSearch = async (query, sitePref, failedElem) => {
    showAnimation();
    const response = await findParticipant(query);
    hideAnimation();
    if(response.code === 200 && response.data.length > 0) {
        const mainContent = document.getElementById('mainContent')
        let filterRawData = filterdata(response.data);

        if (sitePref !== undefined && sitePref != null && sitePref !== 'allResults') {
            const sitePrefId = nameToKeyObj[sitePref];
            const tempFilterRawData = filterBySiteKey(filterRawData, sitePrefId);
            if (tempFilterRawData.length !== 0 ) {
                filterRawData = tempFilterRawData;
            }
            else if (tempFilterRawData.length === 0) {
                document.getElementById(failedElem).hidden = false;
                return alertTrigger();
            }
        }
        mainContent.innerHTML = renderTable(filterRawData, 'participantLookup');
        addEventFilterData(filterRawData);
        renderData(filterRawData);
        activeColumns(filterRawData);
        const element = document.getElementById('back-to-search');
        element.addEventListener('click', () => { 
            renderParticipantLookup();
        });
    }
    else if(response.code === 200 && response.data.length === 0) {
        document.getElementById(failedElem).hidden = false;
        alertTrigger();
    }
}

export const showNotifications = (data, error) => {
    document.getElementById("search-failed").hidden = false;
}


export const findParticipant = async (query) => {
    const idToken = await getIdToken();
    const response = await fetch(`${baseAPI}/dashboard?api=getFilteredParticipants&${query}`, {
        method: "GET",
        headers: {
            Authorization:"Bearer " + idToken
        }
    });
    return await response.json();
}

const renderLookupSiteDropdown = () => {
    let dropDownstatusFlag = localStorage.getItem('dropDownstatusFlag');
    if (dropDownstatusFlag === 'true') {
        document.getElementById("siteDropdownLookup").hidden = false }
}

export const renderLookupResultsTable = () => {
    const loadDetailsPage = '#participants/all'
    location.replace(window.location.origin + window.location.pathname + loadDetailsPage); // updates url to participantsAll
}
