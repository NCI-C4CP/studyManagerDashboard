import {renderNavBarLinks, dashboardNavBarLinks, renderLogin, removeActiveClass} from './navigationBar.js';
import {renderTable, filterdata, filterBySiteKey, renderData, importantColumns, addEventFilterData, activeColumns, eventVerifiedButton} from './participantCommons.js';
import { internalNavigatorHandler, getDataAttributes } from './utils.js';
import { nameToKeyObj } from './siteKeysToName.js';

export function renderParticipantLookup(){

    document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks();
    removeActiveClass('nav-link', 'active');
    document.getElementById('participantLookupBtn').classList.add('active');
    localStorage.removeItem("participant");
    let counter = 0;
    internalNavigatorHandler(counter)
    mainContent.innerHTML = renderParticipantSearch();
    renderLookupSiteDropdown();
    addEventSearch();
    addEventSearchConnectId();
    dropdownTrigger();
}
const api = 'https://us-central1-nih-nci-dceg-connect-dev.cloudfunctions.net/';
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
                                <input class="form-control" id="phone" placeholder="Enter phone number without dashes & parenthesis"/>
                            </div>
                            <div class="form-group">
                                <label class="col-form-label search-label">Email</label>
                                <input class="form-control" type="email" id="email" placeholder="Enter Email"/>
                            </div>
                            <div class="form-group dropdown" id="siteDropdownLookup" hidden>
                                <label class="col-form-label search-label">Site Preference </label> &nbsp;
                                <button class="btn btn-primary btn-lg" type="button" id="dropdownSites" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Change Site Preference
                                </button>
                                <ul class="dropdown-menu" id="dropdownMenuLookupSites" aria-labelledby="dropdownMenuButton">
                                    <li><a class="dropdown-item" data-siteKey="hfHealth" id="hfHealth">Henry Ford Health Systems</a></li>
                                    <li><a class="dropdown-item" data-siteKey="hPartners" id="hPartners">Health Partners</a></li>
                                    <li><a class="dropdown-item" data-siteKey="kpGA" id="kpGA">KP GA</a></li>
                                    <li><a class="dropdown-item" data-siteKey="kpHI" id="kpHI">KP HI</a></li>
                                    <li><a class="dropdown-item" data-siteKey="kpHI" id="kpHI">KP HI</a></li>
                                    <li><a class="dropdown-item" data-siteKey="kpNW" id="kpNW">KP NW</a></li>
                                    <li><a class="dropdown-item" data-siteKey="kpCO" id="kpCO">KP CO</a></li>
                                    <li><a class="dropdown-item" data-siteKey="maClinic" id="maClinic">Marshfield Clinic</a></li>
                                    <li><a class="dropdown-item" data-siteKey="nci" id="nci">NCI</a></li>
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
                        <form id="searchConnectId" method="POST">
                            <div class="form-group">
                                <label class="col-form-label search-label">Connect ID</label>
                                <input class="form-control" autocomplete="off" required type="text" maxlength="10" id="connectId" placeholder="Enter ConnectID"/>
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


const dropdownTrigger = () => {
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
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const dob = document.getElementById('dob').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const sitePref = document.getElementById('dropdownSites').getAttribute('data-siteKey');
        if(!firstName && !lastName && !dob && !phone && !email && !sitePref) return;
        let query = '';
        if(firstName) query += `firstName=${firstName}&`;
        if(lastName) query += `lastName=${lastName}&`;
        if(dob) query += `dob=${dob.replace(/-/g,'')}&`;
        if(phone) query += `phone=${phone}&`;
        if(email) query += `email=${email}&`;
        if(sitePref) query += `sitePref=${sitePref}`;
        performSearch(query, sitePref, "search-failed");
    })
};

export const addEventSearchConnectId = () => {
    const form = document.getElementById('searchConnectId');
    if(!form) return;
    form.addEventListener('submit', e => {
        document.getElementById("search-connect-id-failed").hidden = true;
        e.preventDefault();
        const connectId = document.getElementById('connectId').value;
        let query = '';
        if(connectId) query += `connectId=${connectId}`;
        performSearch(query,"search-connect-id-failed");
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
        if (sitePref !== undefined && sitePref != null) {
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

export const showAnimation = () => {
    if(document.getElementById('loadingAnimation')) document.getElementById('loadingAnimation').style.display = '';
}

export const hideAnimation = () => {
    if(document.getElementById('loadingAnimation')) document.getElementById('loadingAnimation').style.display = 'none';
}

export const showNotifications = (data, error) => {
    document.getElementById("search-failed").hidden = false;
}



export const findParticipant = async (query) => {
    const localStr = JSON.parse(localStorage.dashboard);
    const siteKey = localStr.siteKey;
    const response = await fetch(`${api}getParticipants?type=filter&${query}`, {
        method: "GET",
        headers: {
            Authorization:"Bearer "+siteKey
        }
    });
    return await response.json();
}

const renderLookupSiteDropdown = () => {
    let dropDownstatusFlag = localStorage.getItem('dropDownstatusFlag');
    if (dropDownstatusFlag === 'true') {
        document.getElementById("siteDropdownLookup").hidden = false }
}