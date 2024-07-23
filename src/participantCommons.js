import { renderParticipantDetails } from './participantDetails.js';
import { animation, clearLocalStorage } from './index.js';
import fieldMapping from './fieldToConceptIdMapping.js'; 
import { getIdToken, getDataAttributes, showAnimation, hideAnimation, baseAPI, urls  } from './utils.js';
import { appState } from './stateManager.js';
import { dashboardNavBarLinks, removeActiveClass } from './navigationBar.js';
import { nameToKeyObj, keyToNameObj, keyToShortNameObj } from './idsToName.js';

export const importantColumns = [fieldMapping.fName, fieldMapping.mName, fieldMapping.lName, fieldMapping.birthMonth, fieldMapping.birthDay, fieldMapping.birthYear, fieldMapping.email, 'Connect_ID', fieldMapping.healthcareProvider];

export const renderTable = (data, source) => {
    let prevState = appState.getState().filterHolder
    appState.setState({filterHolder:{...prevState, source: source}})
    let template = '';
    if(data.length === 0) return `No data found!`;
    let array = [ 'Connect_ID', 'pin', 'token', 'studyId', fieldMapping.timeStudyIdSubmitted, fieldMapping.recruitmentType, fieldMapping.recruitmentDate, fieldMapping.siteReportedAge, fieldMapping.siteReportedRace, 
    fieldMapping.siteReportedSex, fieldMapping.sanfordReportedSex, fieldMapping.sanfordReportedRace, fieldMapping.henryFReportedRace, fieldMapping.bswhReportedRaceEthnicity, fieldMapping.campaignType, fieldMapping.signedInFlag, fieldMapping.signinDate, fieldMapping.pinEntered, fieldMapping.noPin, fieldMapping.consentFlag, 
    fieldMapping.consentDate, fieldMapping.consentVersion, fieldMapping.hippaFlag, fieldMapping.hippaDate, fieldMapping.hipaaVersion, fieldMapping.userProfileFlag, 
    fieldMapping.userProfileDateTime, fieldMapping.verifiedFlag, fieldMapping.verficationDate, fieldMapping.automatedVerification, fieldMapping.outreachRequiredForVerification, fieldMapping.manualVerification,
    fieldMapping.duplicateType, fieldMapping.firstNameMatch, fieldMapping.lastNameMatch, fieldMapping.dobMatch, fieldMapping.pinMatch, fieldMapping.tokenMatch, 
    fieldMapping.zipCodeMatch, fieldMapping.siteMatch, fieldMapping.ageMatch, fieldMapping.cancerStatusMatch, fieldMapping.updateRecruitType, 
    fieldMapping.preConsentOptOut, fieldMapping.datePreConsentOptOut, fieldMapping.maxNumContactsReached, fieldMapping.signInMechansim, fieldMapping.consentFirstName, 
    fieldMapping.consentMiddleName, fieldMapping.consentLastName, fieldMapping.accountName,fieldMapping.accountPhone, fieldMapping.accountEmail, fieldMapping.prefName, 
    fieldMapping.address1, fieldMapping.address2, fieldMapping.city, fieldMapping.state, fieldMapping.zip, fieldMapping.email, fieldMapping.email1, 
    fieldMapping.email2, fieldMapping.cellPhone, fieldMapping.homePhone, fieldMapping.otherPhone, fieldMapping.previousCancer, fieldMapping.allBaselineSurveysCompleted, 
    fieldMapping.preferredLanguage, fieldMapping.participationStatus, fieldMapping.bohStatusFlag1, fieldMapping.mreStatusFlag1, fieldMapping.sasStatusFlag1, fieldMapping.lawStausFlag1, 
    fieldMapping.ssnFullflag, fieldMapping.ssnPartialFlag , fieldMapping.refusedSurvey,  fieldMapping.refusedBlood, fieldMapping.refusedUrine,  fieldMapping.refusedMouthwash, fieldMapping.refusedSpecimenSurveys, fieldMapping.refusedFutureSamples, fieldMapping.refusedQualityOfLifeSurvey, fieldMapping.refusedAllFutureQualityOfLifeSurveys,
    fieldMapping.refusedFutureSurveys, fieldMapping.refusedAllFutureActivities, fieldMapping.revokeHIPAA, fieldMapping.dateHipaaRevokeRequested, fieldMapping.dateHIPAARevoc, fieldMapping.withdrawConsent, fieldMapping.dateWithdrewConsentRequested, 
    fieldMapping.participantDeceased, fieldMapping.dateOfDeath, fieldMapping.destroyData, fieldMapping.dateDataDestroyRequested, fieldMapping.dateDataDestroy, fieldMapping.suspendContact
 ];
    localStorage.removeItem("participant");
    let conceptIdMapping = JSON.parse(localStorage.getItem('conceptIdMapping'));
    if (conceptIdMapping) {
        template += `<div class="row">
            <div class="col" id="columnFilter">
                ${array.map(x => `<button name="column-filter" class="filter-btn sub-div-shadow" data-column="${x}">${conceptIdMapping[x] && conceptIdMapping[x] ? 
                    ((x !== fieldMapping.consentFirstName && x !== fieldMapping.consentMiddleName && x !== fieldMapping.consentLastName) ? 
                        conceptIdMapping[x]['Variable Label'] || conceptIdMapping[x]['Variable Name'] : getCustomVariableNames(x)) : x}</button>`)}
            </div>
        </div>`
    }
    template += ` <div id="alert_placeholder"></div>
                    <div class="row">
                    ${(source === 'participantAll') ? ` 
                    <span style="padding-left: 20px;"></span>  
                    <div class="form-group dropdown dropright" id="siteDropdownLookup" hidden>
                    <button class="btn btn-primary btn-lg dropdown-toggle" type="button" id="dropdownSites" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style="margin-top: 10px;">
                        Filter by Site
                    </button>
                    <ul class="dropdown-menu" id="dropdownMenuButtonSites" aria-labelledby="dropdownMenuButton">
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
                <div class="btn-group .btn-group-lg" role="group" aria-label="Basic example" style="margin-left:25px; padding: 10px 20px; border-radius: 10px; width:25%; height:25%;">
                    <button type="button" class="btn btn-outline-info btn-lg" id="activeFilter">Active</button>
                    <button type="button" class="btn btn-outline-info btn-lg" id="passiveFilter">Passive</button>
                </div>
                <form class="form-inline" id="dateFilters">
                    <h5 style="padding-left: 15px;"> &nbsp; Filter by Verification Status Time:  &nbsp;</h5>
                    <h5 style="margin-right:25px;">From:</h5>
                    <div class="form-group mb-2">
                        <input type="date" class="form-control" id="startDate" style="width:200px; height:50px;">
                    </div>
                    <h5 style="margin-left:15px;">To:</h5>
                    <div class="form-group mx-sm-3 mb-2">
                        <input type="date" class="form-control" id="endDate" style="width:200px; height:50px;">
                    </div>
                    <button type="submit" class="btn btn-warning btn-lg mb-2" style="margin-right:10px;" >Search</button>

                    <button type="button" class="btn btn-outline-danger btn-lg mb-2" id="resetDate">Reset Date</button>
                </form>
                `: ``} </div>`

    let backToSearch = (source === 'participantLookup')? `<button class="btn btn-primary" id="back-to-search">Back to Search</button>`: "";
    template += `
                <div class="row">
                    <div class="col">
                        <div class="float-left">
                            ${backToSearch}
                        </div>
                        <div class="float-right" style="display: none">
                            <input id="filterData" class="form-control sub-div-shadow" type="text" placeholder="Min. 3 characters" disabled><span data-toggle="tooltip" title='Search by first name, last name or connect id' class="fas fa-search search-icon"></span></div>
                        </div> 
                    </div>
                <div class="row allow-overflow">
                    <div class="col sticky-header">
                        <table id="dataTable" class="table table-hover table-bordered table-borderless sub-div-shadow no-wrap"></table>
                        <div id="paginationContainer"></div>
                    </div>
                    <div class="modal fade" id="modalShowMoreData" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
                        <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
                            <div class="modal-content sub-div-shadow">
                                <div class="modal-header" id="modalHeader"></div>
                                <div class="modal-body" id="modalBody"></div>
                            </div>
                        </div>
                    </div>
                </div>`
    return template;
}

export  const renderData = (data, source, showButtons) => {
    if(data.length === 0) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = renderTable(data, source);
        animation(false); 
        return;
    }
    const pageSize = 50;
    const dataLength = data.length;
    data.splice(pageSize, dataLength);
    // addEventPageBtns(pageSize, data, showButtons);
    renderDataTable(data, showButtons)
    addEventShowMoreInfo(data);
    if (source !== 'bubbleFilters') {
        let nextPageCounter = 1;
        let prevPageCounter = 0;
        document.getElementById('paginationContainer').innerHTML = paginationTemplate(nextPageCounter, prevPageCounter);
        pagninationNextTrigger();
        pagninationPreviousTrigger();
        getActiveParticipants();
        getPassiveParticipants();
        getDateFilters();
        resetDateFilter();
    }
}


export const reMapFilters = async (filters) =>  {
    let query = ``
    let type = ``
    let startDate = ``
    let endDate = ``
    let pageCounter = ``
    let selectedSite = 'Filter by Site'
    if (filters.siteCode && filters.siteCode !== `Filter by Site` && filters.siteCode !== 1000) {
        query += `&siteCode=${filters.siteCode}`
        selectedSite = keyToShortNameObj[nameToKeyObj[filters.siteName]]
    } 
    if (filters.type && filters.type !== ``) {
        query += `&type=${filters.type}`
        type = filters.type
    } 
    else {
        query += `&type=all`
    }

    if (filters.startDate && filters.startDate !== ``) {
        query +=  `&from=${filters.startDate}T00:00:00.000Z&to=${filters.endDate}T23:59:59.999Z`
        startDate = filters.startDate
        endDate = filters.endDate
    }

    if (filters.nextPageCounter && filters.nextPageCounter !== false) {
        query += `&page=${filters.nextPageCounter}`
        pageCounter = filters.nextPageCounter
    }

    if (filters.nextPageCounter === undefined || filters.nextPageCounter === 0) {
        query += `&page=1`
        pageCounter = 1
    }

    const response = await getCurrentSelectedParticipants(query)
    reRenderMainTable(response, type, selectedSite, startDate, endDate, pageCounter)
}

const renderDataTable = (data, showButtons) => {
    document.getElementById('dataTable').innerHTML = tableTemplate(data, showButtons);
    addEventShowMoreInfo(data);
}

const getActiveParticipants = () => {
    let activeButton = document.getElementById('activeFilter');
    activeButton && activeButton.addEventListener('click', () => {   
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        let prevState = appState.getState().filterHolder
        appState.setState({filterHolder:{...prevState, nextPageCounter: 1}})
        if (document.getElementById('activeFilter').getAttribute('data-get-pts')) return;
        if (activeButton.getAttribute('active') === 'true') {
            activeButton.classList.add('btn-outline-info'); 
            activeButton.classList.remove('btn-info');
            reRenderParticipantsTableBasedOFilter('all', startDate, endDate);
            appState.setState({filterHolder:{...prevState, type: ``}})
            activeButton.setAttribute('active', false);
        }
        else {
            activeButton.setAttribute('data-get-pts', true)
            reRenderParticipantsTableBasedOFilter('active', startDate, endDate);
            activeButton.setAttribute('active', true);
            activeButton.removeAttribute('data-get-pts');
        }
    })
}

const getPassiveParticipants = () => {
    let passiveButton = document.getElementById('passiveFilter');
    passiveButton && passiveButton.addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        let prevState = appState.getState().filterHolder
        appState.setState({filterHolder:{...prevState, nextPageCounter: 1}})
        if (passiveButton.getAttribute('passive') === 'true') {
            passiveButton.classList.add('btn-outline-info'); 
            passiveButton.classList.remove('btn-info');
            reRenderParticipantsTableBasedOFilter('all', startDate, endDate);
            appState.setState({filterHolder:{...prevState, type: ``}})
            passiveButton.setAttribute('passive', false);
        }
        else {
            reRenderParticipantsTableBasedOFilter('passive', startDate, endDate);
            passiveButton.setAttribute('passive', true);
        }
    })
}

const getDateFilters = () => {
    const dateFilters = document.getElementById('dateFilters');
    dateFilters && dateFilters.addEventListener('submit', async (e) => {
        e.preventDefault();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        document.getElementById('startDate').value = ``
        document.getElementById('endDate').value = ``
        if (startDate === `` || endDate === ``) { missingDateTrigger() }
        else {
            const filterHolder = appState.getState().filterHolder
            let siteKey = document.getElementById('dropdownMenuButtonSites').getAttribute('selectedsite');
            if (siteKey === null && filterHolder && filterHolder.siteName && filterHolder.siteName !== `Filter by Site`) { siteKey = filterHolder.siteName }
            let siteKeyId = ``
            let siteKeyName = ``
            if (siteKey !== null && siteKey !== 'allResults') {
                siteKeyId = nameToKeyObj[siteKey];
                siteKeyName = keyToShortNameObj[siteKeyId];
            } else {
                siteKeyId = 'Filter by Site'
                siteKeyName = 'Filter by Site'
            }
            let response = ``;
            let filter = ``;
            let pageCounter = 1
            let passiveButton = document.getElementById('passiveFilter').getAttribute('passive');
            let activeButton = document.getElementById('activeFilter').getAttribute('active');
            if (activeButton === 'true') {
                response = await getParticipantsWithDateFilters('active', siteKeyId, startDate, endDate);
                filter = 'active';
            } 
            else if (passiveButton === 'true') {
                response = await getParticipantsWithDateFilters('passive', siteKeyId, startDate, endDate);
                filter = 'passive';
            }
            else { 
                response = await getParticipantsWithDateFilters(null, siteKeyId, startDate, endDate); }

            reRenderMainTable(response, filter, siteKeyName, startDate, endDate, pageCounter);
        }
    })
}

const resetDateFilter = () => {
    const resetDateFilters = document.getElementById('resetDate');
    resetDateFilters && resetDateFilters.addEventListener('click', async (e) => {
        e.preventDefault();
        document.getElementById('startDate').value = ``
        document.getElementById('endDate').value = ``
        let prevState = appState.getState().filterHolder
        appState.setState({filterHolder:{...prevState, to: ``, from: ``}})
    })
}

const reRenderParticipantsTableBasedOFilter = async (filter, startDate, endDate) => {
    let siteKeyId = 'Filter by Site'
    let siteKeyName = 'Filter by Site'
    let pageCounter = 1
    if (appState.getState().filterHolder && appState.getState().filterHolder.siteName) {
        siteKeyId = appState.getState().filterHolder.siteCode 
        siteKeyName = keyToShortNameObj[nameToKeyObj[appState.getState().filterHolder.siteName]]
    }
    showAnimation();

    const response = await getParticipantsWithFilters(filter, siteKeyId, startDate, endDate);
    hideAnimation();
    reRenderMainTable(response, filter, siteKeyName, startDate, endDate, pageCounter);
}

const reRenderMainTable =  (response, filter, selectedSite, startDate, endDate, pageCounter) => {
    if(response.code === 200 && response.data.length > 0) {
        let filterRawData = filterdata(response.data);
        if (filterRawData.length === 0)  return alertTrigger();
        const isParent = localStorage.getItem('isParent')
        document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks(isParent);
        document.getElementById('participants').innerHTML = '<i class="fas fa-users"></i> All Participants'
        removeActiveClass('dropdown-item', 'dd-item-active');
        document.getElementById('allBtn').classList.add('dd-item-active');
        removeActiveClass('nav-link', 'active');
        document.getElementById('participants').classList.add('active');
        localStorage.setItem('filterRawData', JSON.stringify(filterRawData));
        mainContent.innerHTML = renderTable(filterRawData, 'participantAll');
        addEventFilterData(filterRawData);
        renderData(filterRawData, true);
        activeColumns(filterRawData);
        renderLookupSiteDropdown();
        dropdownTriggerAllParticipants(selectedSite);
        if (filter === 'active') {
            let activeButton = document.getElementById('activeFilter');
            activeButton.classList.remove('btn-outline-info'); 
            activeButton.classList.add('btn-info');
            activeButton.setAttribute('active', true);
            let passiveButton = document.getElementById('passiveFilter');
            if ([...passiveButton.classList].includes('btn-info')) {
                passiveButton.classList.remove('btn-info');
                passiveButton.classList.add('btn-outline-info');  
            }
        }
        else if (filter === 'passive') {
            let passiveButton = document.getElementById('passiveFilter');
            passiveButton.classList.remove('btn-outline-info');
            passiveButton.classList.add('btn-info');
            passiveButton.setAttribute('passive', true);
            let activeButton = document.getElementById('activeFilter');
            if ([...activeButton.classList].includes('btn-info')) {
                activeButton.classList.remove('btn-info');
                activeButton.classList.add('btn-outline-info'); 
            }
        }
        if (startDate !== undefined || startDate !== ``) {
            document.getElementById('startDate').value = startDate
            document.getElementById('endDate').value = endDate
        }
        if (pageCounter !== undefined || pageCounter !== ``) {
            const pageElement = document.getElementById('currentPageNumber');
            if (pageElement) { 
                pageElement.innerHTML = `&nbsp;Page: ${pageCounter}&nbsp;&nbsp;`; 
                document.getElementById('nextLink').setAttribute('data-nextpage', pageCounter);
            }
        }
        return;
    }
    else if(response.code === 200 && response.data.length === 0) {
        renderDataTable([]);
        return alertTrigger();
    }
}


const paginationTemplate = (nextPageCounter, prevPageCounter) => {
    let template = `
    <div class="btn-group .btn-group-lg" role="group" aria-label="Basic example">
        <div style="display:inline-block;">
            <nav aria-label="Page navigation example">
                <div class="pagination" style="border-style:solid; border-radius:6px; border-width:1px; border-color:gray; background-color:white;">
                    <button id="previousLink"  class="page-item" data-prevpage=${prevPageCounter} style="border-right-style:solid; border-width:1px; border-color:gray; background-color:white;"><i class="fa fa-arrow-left" aria-hidden="true"></i>&nbsp;Previous</button>
                    <button id="nextLink"  class="page-item" data-nextpage=${nextPageCounter} style="border-left-style:solid; border-width:1px; border-color:gray; background-color:white;">Next&nbsp;<i class="fa fa-arrow-right" aria-hidden="true"></i></button>
                    <div ><span id="currentPageNumber" class="page-item" style="color:blue;">&nbsp;Page: 1&nbsp;&nbsp;</span></div>
                </div>
            </nav>        
        </div>
    </div>
    `;
    return template;
}


const pagninationNextTrigger = () => {
    let a = document.getElementById('nextLink');
    let b = document.getElementById('previousLink');

    a && a.addEventListener('click', async () => {
        const currState = appState.getState()
        let nextPageCounter = parseInt(a.getAttribute('data-nextpage'));
        if (currState.filterHolder && currState.filterHolder.source === `participantAll`  && currState.filterHolder.nextPageCounter && currState.filterHolder.nextPageCounter > nextPageCounter) nextPageCounter = appState.getState().filterHolder.nextPageCounter
        document.getElementById('currentPageNumber').innerHTML = `&nbsp;Page: ${nextPageCounter + 1}&nbsp;&nbsp;`
        showAnimation();
        let sitePref = ``;
        let sitePrefAttr = document.getElementById('dropdownMenuButtonSites');
        if (sitePrefAttr && sitePrefAttr.getAttribute('selectedsite') === null) sitePref = 'allResults'
        else if (sitePrefAttr && sitePrefAttr.getAttribute('selectedsite') !== null) sitePref = sitePrefAttr.getAttribute('selectedsite');
        
        const sitePrefId = nameToKeyObj[sitePref];
        nextPageCounter = nextPageCounter + 1
        b.disabled = false;
        const response = await getMoreParticipants(sitePrefId, nextPageCounter);
        hideAnimation();
        if(response.code === 200 && response.data.length > 0) {
            let filterRawData = filterdata(response.data);
            if (filterRawData.length === 0)  return alertTrigger();
            a.setAttribute('data-nextpage', nextPageCounter);
            renderDataTable(filterRawData);
            addEventFilterData(filterRawData);
        }
        else if(response.code === 200 && response.data.length === 0) {
            renderDataTable([]);
            a.setAttribute('data-nextpage', nextPageCounter);
            // disable the next button
            a.disabled = true;
            return alertTrigger();
        }
        else if (response.code !== 200) {
            clearLocalStorage();
        }
    })

}

const pagninationPreviousTrigger = () => {
    let a = document.getElementById('previousLink');
    let b = document.getElementById('nextLink');
    if (parseInt(a.getAttribute('data-nextpage')) === 1 || parseInt(a.getAttribute('data-nextpage')) < 1 ) {
        // disables the previous button if clicked on the first page
        document.getElementById('previousLink').disabled = true;
    }
    a && a.addEventListener('click', async () => {
        let pageCounter = parseInt(a.getAttribute('data-prevpage'));
        let nextPageCounter = parseInt(b.getAttribute('data-nextpage'));
        pageCounter = nextPageCounter - 1 // 1
        nextPageCounter = nextPageCounter - 1 // 1
        showAnimation();
        b.disabled = false;
        let sitePref = ``;
        let sitePrefAttr = document.getElementById('dropdownMenuButtonSites');
        if (sitePrefAttr && sitePrefAttr.getAttribute('selectedsite') === null) sitePref = 'allResults'
        else if (sitePrefAttr && sitePrefAttr.getAttribute('selectedsite') !== null) sitePref = sitePrefAttr.getAttribute('selectedsite');
        const sitePrefId = nameToKeyObj[sitePref];
        if (pageCounter >= 1) {
            document.getElementById('currentPageNumber').innerHTML = `&nbsp;Page: ${pageCounter}&nbsp;`;
            const response = await getMoreParticipants(sitePrefId, pageCounter);
            hideAnimation();
            if(response.code === 200 && response.data.length > 0) {
                let filterRawData = filterdata(response.data);
                if (filterRawData.length === 0)  return alertTrigger()
                renderDataTable(filterRawData);
                addEventFilterData(filterRawData);

            }
            else if(response.code === 200 && response.data.length === 0) {
                renderDataTable([])
                b.setAttribute('data-nextpage', nextPageCounter);
                a.setAttribute('data-prevpage', pageCounter);
                return alertTrigger();
            }
            else if(response.code != 200 && response.data.length === 0) {
                clearLocalStorage();
            }
            b.setAttribute('data-nextpage', nextPageCounter);
            a.setAttribute('data-prevpage', pageCounter);
        } 
        else if (pageCounter <= 0) {
            a.disabled = true
            b.setAttribute('data-nextpage', 1);
            a.setAttribute('data-prevpage', 0);
            hideAnimation();
        }
        else {
            hideAnimation();
        } 
})
}

// TODO: needs code refactoring
const tableTemplate = (data, showButtons) => {
    const conceptIdMapping = JSON.parse(localStorage.getItem("conceptIdMapping"));
    let headerStringArray = [];
    if (conceptIdMapping) {
      headerStringArray = importantColumns.map((column) => {
        let columnName = conceptIdMapping[column]
          ? getCustomVariableNames(column) ||
            conceptIdMapping[column]["Variable Label"] ||
            conceptIdMapping[column]["Variable Name"]
          : column;

        return `<th class="sticky-row">${columnName}</th>`;
      });
    } else {
      const fallbackColumnNameArray = [
        "First Name (UP)",
        "Middle Name (UP)",
        "Last Name (UP)",
        "Birth Month",
        "Birth Day",
        "Birth Year",
        "Preferred email",
        "Connect_ID",
        "Site",
        ...importantColumns.slice(9),
      ];
      headerStringArray = fallbackColumnNameArray.map((columnName) => `<th class="sticky-row">${columnName}</th>`);
    }

    let template = `<thead class="thead-dark sticky-row">
            <tr>
                <th class="sticky-row">Select</th>
                ${headerStringArray.join("")}
            </tr>
        </thead>`;
    
    data.forEach(participant => {
        // mapping from concept id to variable name
        template += `<tbody><tr><td><button class="btn btn-primary select-participant" data-token="${participant.token}">Select</button></td>`
        importantColumns.forEach(x => {
            (participant[x] && typeof participant[x] === 'object') ?
                (template += `<td><pre>${JSON.stringify(participant[x], undefined, 4)}</pre></td>`)
            : 
            ( keyToNameObj[participant[x]] && keyToNameObj[participant[x]] !== undefined && x === fieldMapping.healthcareProvider ) ? 
               ( template += `<td>${keyToNameObj[participant[x]] ? keyToNameObj[participant[x]] : ''}</td>`)
            : (participant[x] && participant[x] === fieldMapping.no) ?
               ( template += `<td>${participant[x] ? 'No' : ''}</td>` )
            : (participant[x] && participant[x] === fieldMapping.yes) ?
               ( template += `<td>${participant[x] ? 'Yes' : ''}</td>` )
            : (participant[x] && participant[x] === fieldMapping.active) ?
               ( template += `<td>${participant[x] ? 'Active' : ''}</td>` )
            : (participant[x] && participant[x] === fieldMapping.passive) ?
                ( template += `<td>${participant[x] ? 'Passive' : ''}</td>`)
            : (participant[x] && participant[x] === fieldMapping.inactive) ?
                ( template += `<td>${participant[x] ? 'Not active' : ''}</td>`)
            : (participant[x] && participant[x] === fieldMapping.prefPhone) ?
               ( template += `<td>${participant[x] ? 'Text Message' : ''}</td>` )
            : (participant[x] && participant[x] === fieldMapping.prefEmail) ?
               ( template += `<td>${participant[x] ? 'Email' : ''}</td>` )
            : (participant[x] && x === fieldMapping.accountEmail.toString()) ?
                ( template += `<td>${participant[x].startsWith('noreply') ? '' : participant[x]}</td>` )
            : ((x === (fieldMapping.signinDate).toString()) || (x === (fieldMapping.userProfileDateTime).toString()) || (x === (fieldMapping.consentDate).toString())
             || (x === (fieldMapping.recruitmentDate).toString()) || (x === (fieldMapping.verficationDate).toString())) ? 
               ( template += `<td>${participant[x] ? new Date(participant[x]).toLocaleString() : ''}</td>`) // human readable time date
            : (x === (fieldMapping.verifiedFlag).toString()) ?
            (
                (participant[x] === fieldMapping.notYetVerified) ?
                    template += `<td>${participant[x] ? 'Not Yet Verified'  : ''}</td>`
                : (participant[x] === fieldMapping.outreachTimedout) ?
                    template += `<td>${participant[x] ? 'Out Reach Timed Out'  : ''}</td>`
                : (participant[x] === fieldMapping.verified) ?
                    template += `<td>${participant[x] ? 'Verified'  : ''}</td>`
                : (participant[x] === fieldMapping.cannotBeVerified) ?
                    template += `<td>${participant[x] ? 'Can Not Be Verified '  : ''}</td>`
                : (
                    template += `<td>${participant[x] ? 'Duplicate'  : ''}</td>` )
            )
            : (x === (fieldMapping.participationStatus).toString()) ?
            (
                (participant[x] === fieldMapping.noRefusal) ?
                    template += `<td>${participant[x] ? 'No Refusal'  : ''}</td>`
                : (participant[x] === ``) ?
                    template += `<td>No Refusal</td>`
                : (participant[x] === fieldMapping.refusedSome) ?
                    template += `<td>${participant[x] ? 'Refused Some'  : ''}</td>`
                : (participant[x] === fieldMapping.refusedAll) ?
                    template += `<td>${participant[x] ? 'Refused All'  : ''}</td>`
                : (participant[x] === fieldMapping.revokeHIPAAOnly) ?
                    template += `<td>${participant[x] ? 'Revoke HIPAA Only'  : ''}</td>`
                : (participant[x] === fieldMapping.withdrewConsent) ?
                template += `<td>${participant[x] ? 'Withdrew Consent'  : ''}</td>`
                : (participant[x] === fieldMapping.destroyDataStatus) ?
                template += `<td>${participant[x] ? 'Destroy Data Status'  : ''}</td>`
                : (participant[x] === fieldMapping.deceased) ?
                    template += `<td>${participant[x] ? 'Deceased'  : ''}</td>` 
                : (participant[x] === fieldMapping.dataDestroyed) ?
                    template += `<td>${participant[x] ? 'Data Destroyed'  : ''}</td>` 
                : template += `<td> ERROR </td>`
            )
            : (x === (fieldMapping.bohStatusFlag1).toString() || x === (fieldMapping.mreStatusFlag1).toString() 
            || x === (fieldMapping.lawStausFlag1).toString() || x === (fieldMapping.sasStatusFlag1).toString()) ?
            (
                (participant[x] === fieldMapping.submitted1) ?
                ( template += `<td>${participant[x] ? 'Submitted'  : ''}</td>` )
                : (participant[x] === fieldMapping.started1) ?
                (template += `<td>${participant[x] ? 'Started'  : ''}</td>` )
                : (template += `<td>${participant[x] ? 'Not Started'  : ''}</td>` )
            )
            :  (x === (fieldMapping.refusedSurvey).toString() || x === (fieldMapping.refusedBlood).toString() || x === (fieldMapping.refusedUrine).toString() ||
                x === (fieldMapping.refusedMouthwash).toString() || x === (fieldMapping.refusedSpecimenSurveys).toString() || x === (fieldMapping.refusedFutureSamples).toString() || 
                x === (fieldMapping.refusedFutureSurveys).toString() || x === (fieldMapping.refusedQualityOfLifeSurvey).toString() || x === (fieldMapping.refusedAllFutureQualityOfLifeSurveys).toString()) ?
            (
                (participant[fieldMapping.refusalOptions]?.[x] === fieldMapping.yes ?
                    ( template += `<td>${participant[fieldMapping.refusalOptions]?.[x] ? 'Yes'  : ''}</td>` )
                    :
                    ( template += `<td>${participant[fieldMapping.refusalOptions]?.[x] ? 'No'  : ''}</td>` )
                )
            )
            :  (x === (fieldMapping.refusedAllFutureActivities).toString()) ?
            (
                (participant[fieldMapping.refusalOptions]?.[x] === fieldMapping.yes ?
                    ( template += `<td>${participant[fieldMapping.refusalOptions][x] ? 'Yes'  : ''}</td>` )
                    :
                    ( template += `<td>${participant[fieldMapping.refusalOptions]?.[x] ? 'No'  : ''}</td>` )
                )
            )
            : (x === 'studyId') ? (template += `<td>${participant['state']['studyId'] ? participant['state']['studyId'] : ``}</td>`)
            : (x === fieldMapping.suspendContact.toString()) ? (
                template += `<td>${participant[fieldMapping.suspendContact.toString()] ? participant[fieldMapping.suspendContact.toString()].split('T')[0] : ``}</td>`)
            : (x === fieldMapping.siteReportedAge.toString()) ? 
            (
                ( participant['state'][fieldMapping.siteReportedAge.toString()] === fieldMapping.ageRange1 ) ?
                    template += `<td>${participant['state'][fieldMapping.siteReportedAge.toString()] ? `30-34` : ``}</td>`
                :   ( participant['state'][fieldMapping.siteReportedAge.toString()] === fieldMapping.ageRange2 ) ?
                    template += `<td>${participant['state'][fieldMapping.siteReportedAge.toString()] ? `35-39` : ``}</td>`
                :   ( participant['state'][fieldMapping.siteReportedAge.toString()] === fieldMapping.ageRange3 ) ?
                    template += `<td>${participant['state'][fieldMapping.siteReportedAge.toString()] ? `40-45` : ``}</td>`
                :   ( participant['state'][fieldMapping.siteReportedAge.toString()] === fieldMapping.ageRange4 ) ?
                    template += `<td>${participant['state'][fieldMapping.siteReportedAge.toString()] ? `46-50` : ``}</td>`
                :   ( participant['state'][fieldMapping.siteReportedAge.toString()] === fieldMapping.ageRange5 ) ?
                    template += `<td>${participant['state'][fieldMapping.siteReportedAge.toString()] ? `51-55` : ``}</td>`
                :   ( participant['state'][fieldMapping.siteReportedAge.toString()] === fieldMapping.ageRange6 ) ?
                    template += `<td>${participant['state'][fieldMapping.siteReportedAge.toString()] ? `56-60` : ``}</td>`
                :   ( participant['state'][fieldMapping.siteReportedAge.toString()] === fieldMapping.ageRange7 ) ?
                    template += `<td>${participant['state'][fieldMapping.siteReportedAge.toString()] ? `61-65` : ``}</td>`
                :   ( participant['state'][fieldMapping.siteReportedAge.toString()] === fieldMapping.ageRange8 ) ?
                    template += `<td>${participant['state'][fieldMapping.siteReportedAge.toString()] ? `66-70` : ``}</td>`
                :
                    ( template += `<td>${participant['state'][fieldMapping.siteReportedAge.toString()] ? `ERROR` : ``}</td>`))
            : (x === fieldMapping.siteReportedSex.toString()  ) ? (
            (  
                ( participant['state'][fieldMapping.siteReportedSex.toString()] === fieldMapping.female ) ?
                template += `<td>${participant['state'][fieldMapping.siteReportedAge.toString()] ? `Female` : ``}</td>`
                :   ( participant['state'][fieldMapping.siteReportedSex.toString()] === fieldMapping.male ) ?
                    template += `<td>${participant['state'][fieldMapping.siteReportedAge.toString()] ? `Male` : ``}</td>`
                :   ( participant['state'][fieldMapping.siteReportedSex.toString()] === fieldMapping.intersex ) ?
                    template += `<td>${participant['state'][fieldMapping.siteReportedAge.toString()] ? `Intersex` : ``}</td>`
                :
                    template += `<td>${participant['state'][fieldMapping.siteReportedSex.toString()] ? `Unavailable/Unknown` : ``}</td>`)
                )
            : (x === fieldMapping.sanfordReportedSex.toString()  ) ? (
                (  
                    ( participant['state'][fieldMapping.sanfordReportedSex.toString()] === fieldMapping.female ) ?
                    template += `<td>${participant['state'][fieldMapping.sanfordReportedSex.toString()] ? `Female` : ``}</td>`
                    :   ( participant['state'][fieldMapping.sanfordReportedSex.toString()] === fieldMapping.male ) ?
                        template += `<td>${participant['state'][fieldMapping.sanfordReportedSex.toString()] ? `Male` : ``}</td>`
                    :
                        template += `<td>${participant['state'][fieldMapping.sanfordReportedSex.toString()] ? `Unavailable/Unknown` : ``}</td>`)
                    )
            : (x === fieldMapping.siteReportedRace.toString()) ? (
                (  
                    ( participant['state'][fieldMapping.siteReportedRace.toString()] === fieldMapping.white ) ?
                    template += `<td>${participant['state'][fieldMapping.siteReportedRace.toString()] ? `White` : ``}</td>`
                    :   ( participant['state'][fieldMapping.siteReportedRace.toString()] === fieldMapping.other ) ?
                        template += `<td>${participant['state'][fieldMapping.siteReportedRace.toString()] ? `Other` : ``}</td>`
                    :
                        template += `<td>${participant['state'][fieldMapping.siteReportedRace.toString()] ? `Unavailable/Unknown` : ``}</td>`)
                    )
            : (x === fieldMapping.sanfordReportedRace.toString()) ? (
                (  
                    ( participant['state'][fieldMapping.sanfordReportedRace.toString()] === fieldMapping.africanAmericanSH ) ?
                    template += `<td>${participant['state'][fieldMapping.sanfordReportedRace.toString()] ? `African American` : ``}</td>`
                    :   ( participant['state'][fieldMapping.sanfordReportedRace.toString()] === fieldMapping.americanIndianSH ) ?
                        template += `<td>${participant['state'][fieldMapping.sanfordReportedRace.toString()] ? `American Indian or Alaskan Native` : ``}</td>`
                        :   ( participant['state'][fieldMapping.sanfordReportedRace.toString()] === fieldMapping.asianSH ) ?
                        template += `<td>${participant['state'][fieldMapping.sanfordReportedRace.toString()] ? `Asian` : ``}</td>`
                        :   ( participant['state'][fieldMapping.sanfordReportedRace.toString()] === fieldMapping.whiteSH ) ?
                        template += `<td>${participant['state'][fieldMapping.sanfordReportedRace.toString()] ? `Caucasian/White` : ``}</td>`
                        :   ( participant['state'][fieldMapping.sanfordReportedRace.toString()] === fieldMapping.hispanicLBSH ) ?
                        template += `<td>${participant['state'][fieldMapping.sanfordReportedRace.toString()] ? `Hispanic/Latino/Black` : ``}</td>`
                        :   ( participant['state'][fieldMapping.sanfordReportedRace.toString()] === fieldMapping.hispanicLDSH ) ?
                        template += `<td>${participant['state'][fieldMapping.sanfordReportedRace.toString()] ? `Hispanic/Latino/Declined` : ``}</td>`
                        :   ( participant['state'][fieldMapping.sanfordReportedRace.toString()] === fieldMapping.hispanicLWSH ) ?
                        template += `<td>${participant['state'][fieldMapping.sanfordReportedRace.toString()] ? `Hispanic/Latino/White` : ``}</td>`
                        :   ( participant['state'][fieldMapping.sanfordReportedRace.toString()] === fieldMapping.nativeHawaiianSH ) ?
                        template += `<td>${participant['state'][fieldMapping.sanfordReportedRace.toString()] ? `Native Hawaiian/Pacific Islander` : ``}</td>`
                        :   ( participant['state'][fieldMapping.sanfordReportedRace.toString()] === fieldMapping.nativeHawaiianPISH ) ?
                        template += `<td>${participant['state'][fieldMapping.sanfordReportedRace.toString()] ? `Pacific Islander` : ``}</td>`
                        :   ( participant['state'][fieldMapping.sanfordReportedRace.toString()] === fieldMapping.blankSH ) ?
                        template += `<td>${participant['state'][fieldMapping.sanfordReportedRace.toString()] ? `Blank` : ``}</td>`
                        :   ( participant['state'][fieldMapping.sanfordReportedRace.toString()] === fieldMapping.declinedSH ) ?
                        template += `<td>${participant['state'][fieldMapping.sanfordReportedRace.toString()] ? `Declined` : ``}</td>`
                    :
                        template += `<td>${participant['state'][fieldMapping.sanfordReportedRace.toString()] ? `Unavailable/Unknown` : ``}</td>`)
                    )
            : (x === fieldMapping.henryFReportedRace.toString()) ? (
                (  
                    ( participant['state'][fieldMapping.henryFReportedRace.toString()] === fieldMapping.africanAmericanHF ) ?
                    template += `<td>${participant['state'][fieldMapping.henryFReportedRace.toString()] ? `African American` : ``}</td>`
                        :   ( participant['state'][fieldMapping.henryFReportedRace.toString()] === fieldMapping.whiteHF ) ?
                        template += `<td>${participant['state'][fieldMapping.henryFReportedRace.toString()] ? `Caucasian/White` : ``}</td>`
                        :   ( participant['state'][fieldMapping.henryFReportedRace.toString()] === fieldMapping.otherHF ) ?
                        template += `<td>${participant['state'][fieldMapping.henryFReportedRace.toString()] ? `Other` : ``}</td>`
                        :
                        template += `<td>${participant['state'][fieldMapping.henryFReportedRace.toString()] ? `Unavailable/Unknown` : ``}</td>`)
                    )
            : (x === fieldMapping.bswhReportedRaceEthnicity.toString()) ? (
                (
                    (participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] === fieldMapping.whiteNonHispanic) ?
                        template += `<td>${participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] ? `White non-Hispanic` : ``}</td>`
                        : (participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] === fieldMapping.blackNonHispanic) ?
                        template += `<td>${participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] ? `Black non-Hispanic` : ``}</td>`
                        : (participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] === fieldMapping.hispanicLatino) ?
                        template += `<td>${participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] ? `Hispanic/Latino` : ``}</td>`
                        : (participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] === fieldMapping.asian) ?
                        template += `<td>${participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] ? `Asian` : ``}</td>`
                        : (participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] === fieldMapping.americanIndianOrAlaskanNative) ?
                        template += `<td>${participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] ? `American Indian or Alaskan Native` : ``}</td>`
                        : (participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] === fieldMapping.nativeHawaiianOrOtherPacificIslander) ?
                        template += `<td>${participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] ? `Native Hawaiian or Other Pacific Islander` : ``}</td>`
                        : (participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] === fieldMapping.multiRacial) ?
                        template += `<td>${participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] ? `Multi-racial` : ``}</td>`
                        : (participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] === fieldMapping.other) ?
                        template += `<td>${participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] ? `Other` : ``}</td>`
                        : (participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] === fieldMapping.unavailable) ?
                        template += `<td>${participant['state'][fieldMapping.bswhReportedRaceEthnicity.toString()] ? `Unavailable/Unknown` : ``}</td>` 
                        : template += `<td>${``}</td>`)
                )
            : (x === fieldMapping.preConsentOptOut.toString()) ? (
                ( participant['state'][fieldMapping.preConsentOptOut.toString()] === fieldMapping.yes ) ?
                template += `<td>${participant['state'][fieldMapping.preConsentOptOut.toString()] ? `Yes` : ``}</td>`
                : template += `<td>${participant['state'][fieldMapping.preConsentOptOut.toString()] ? `No` : ``}</td>`
                )
            : (x === fieldMapping.datePreConsentOptOut.toString()) ? (
                template += `<td>${participant['state'][fieldMapping.datePreConsentOptOut.toString()] ? participant['state'][fieldMapping.datePreConsentOptOut.toString()] : ``}</td>`
                )
            : (x === fieldMapping.maxNumContactsReached.toString()) ? (
                ( participant['state'][fieldMapping.maxNumContactsReached.toString()] === fieldMapping.yes ) ?
                    template += `<td>${participant['state'][fieldMapping.maxNumContactsReached.toString()] ? `Yes` : ``}</td>`
                : template += `<td>${participant['state'][fieldMapping.maxNumContactsReached.toString()] ? `No` : ``}</td>`
                )
            :(x === fieldMapping.studyIdTimeStamp.toString()) ? (
                template += `<td>${participant['state'][fieldMapping.studyIdTimeStamp.toString()] ? participant['state'][fieldMapping.studyIdTimeStamp.toString()] : ``}</td>`
            ) 
            : (x === fieldMapping.campaignType.toString()) ? (
                (  
                    ( participant['state'][fieldMapping.campaignType.toString()] === fieldMapping.random ) ?
                    template += `<td>${participant['state'][fieldMapping.campaignType.toString()] ? `Random` : ``}</td>`
                    :   ( participant['state'][fieldMapping.campaignType.toString()] === fieldMapping.screeningAppointment ) ?
                        template += `<td>${participant['state'][fieldMapping.campaignType.toString()] ? `Screening Appointment` : ``}</td>`
                    :   ( participant['state'][fieldMapping.campaignType.toString()] === fieldMapping.nonScreeningAppointment ) ?
                        template += `<td>${participant['state'][fieldMapping.campaignType.toString()] ? `Non Screening Appointment` : ``}</td>`
                    :  ( participant['state'][fieldMapping.campaignType.toString()] === fieldMapping.demographicGroup ) ?
                            template += `<td>${participant['state'][fieldMapping.campaignType.toString()] ? `Demographic Group` : ``}</td>`
                    :  ( participant['state'][fieldMapping.campaignType.toString()] === fieldMapping.agingOutofStudy ) ?
                        template += `<td>${participant['state'][fieldMapping.campaignType.toString()] ? `Aging Out of Study` : ``}</td>`
                    :  ( participant['state'][fieldMapping.campaignType.toString()] === fieldMapping.geographicGroup ) ?
                        template += `<td>${participant['state'][fieldMapping.campaignType.toString()] ? `Geographic Group` : ``}</td>`
                    :  ( participant['state'][fieldMapping.campaignType.toString()] === fieldMapping.postScreeningAppointment ) ?
                        template += `<td>${participant['state'][fieldMapping.campaignType.toString()] ? `Post Screening Appointment` : ``}</td>`
                    :  ( participant['state'][fieldMapping.campaignType.toString()] === fieldMapping.technologyAdapters ) ?
                        template += `<td>${participant['state'][fieldMapping.campaignType.toString()] ? `Technology Adapters` : ``}</td>`
                    :  ( participant['state'][fieldMapping.campaignType.toString()] === fieldMapping.lowIncomeAreas ) ?
                        template += `<td>${participant['state'][fieldMapping.campaignType.toString()] ? `Low Income Areas/Health Professional Shortage Areas` : ``}</td>`
                    :  ( participant['state'][fieldMapping.campaignType.toString()] === fieldMapping.researchRegistry ) ?
                    template += `<td>${participant['state'][fieldMapping.campaignType.toString()] ? `Research Registry` : ``}</td>`
                    :  ( participant['state'][fieldMapping.campaignType.toString()] === fieldMapping.popUp ) ?
                    template += `<td>${participant['state'][fieldMapping.campaignType.toString()] ? `Pop up` : ``}</td>`
                    :  ( participant['state'][fieldMapping.campaignType.toString()] === fieldMapping.noneOftheAbove ) ?
                        template += `<td>${participant['state'][fieldMapping.campaignType.toString()] ? `None of the Above` : ``}</td>`
                :
                        template += `<td>${participant['state'][fieldMapping.campaignType.toString()] ? `Other` : ``}</td>`)
                    )
            : (x === (fieldMapping.enrollmentStatus).toString()) ? 
            (   
                (participant[x] === fieldMapping.signedInEnrollment) ?
                template += `<td>${participant[x] ? 'Signed In'  : ''}</td>`
                : (participant[x] === fieldMapping.consentedEnrollment) ?
                    template += `<td>${participant[x] ? 'Consented'  : ''}</td>`
                : (participant[x] === fieldMapping.userProfileCompleteEnrollment) ?
                    template += `<td>${participant[x] ? 'User Profile Complete'  : ''}</td>`
                : (participant[x] === fieldMapping.verificationCompleteEnrollment) ?
                    template += `<td>${participant[x] ? 'Verification Complete'  : ''}</td>`
                : (participant[x] === fieldMapping.cannotBeVerifiedEnrollment) ?
                template += `<td>${participant[x] ? 'Cannot Be Verified'  : ''}</td>`
                : (participant[x] === fieldMapping.verifiedMimimallyEnrolledEnrollment) ?
                template += `<td>${participant[x] ? 'Verified Mimimally Enrolled'  : ''}</td>`
                : (participant[x] === fieldMapping.fullyEnrolledEnrollment) ?
                    template += `<td>${participant[x] ? 'Fully Enrolled'  : ''}</td>` 
                : template += `<td> ERROR </td>` 
            )
            : (x === (fieldMapping.preferredLanguage).toString()) ? 
            (   
                (participant[x] === fieldMapping.language.en) ?
                template += `<td>${participant[x] ? 'English'  : ''}</td>`
                : (participant[x] === fieldMapping.language.es) ?
                    template += `<td>${participant[x] ? 'Spanish'  : ''}</td>`
                : (!participant[x]) ?
                    template += `<td></td>` 
                : template += `<td> ERROR </td>` 
            )
            : (x === fieldMapping.automatedVerification.toString()) ? (
                ( participant['state'][fieldMapping.automatedVerification.toString()] === fieldMapping.methodUsed ) ?
                    template += `<td>${participant['state'][fieldMapping.automatedVerification.toString()] ? `Method Used` : ``}</td>`
                :    template += `<td>${participant['state'][fieldMapping.automatedVerification.toString()] ? `Method Not Used` : ``}</td>`            
            )
            : (x === fieldMapping.manualVerification.toString()) ? (
                ( participant['state'][fieldMapping.manualVerification.toString()] === fieldMapping.methodUsed ) ?
                template += `<td>${participant['state'][fieldMapping.manualVerification.toString()] ? `Method Used` : ``}</td>`
                :   template += `<td>${participant['state'][fieldMapping.manualVerification.toString()] ? `Method Not Used` : ``}</td>`
            )
            : (x === fieldMapping.outreachRequiredForVerification.toString()) ? (
                ( participant['state'][fieldMapping.outreachRequiredForVerification.toString()] === fieldMapping.yes ) ?
                    template += `<td>${participant['state'][fieldMapping.outreachRequiredForVerification.toString()] ? `Yes` : ``}</td>`
                :   template += `<td>${participant['state'][fieldMapping.outreachRequiredForVerification.toString()] ? `No` : ``}</td>`
            )
            : (x === fieldMapping.duplicateType.toString()) ? (
                ( participant['state'][fieldMapping.duplicateType.toString()] === fieldMapping.notActiveSignedAsPassive ) ?
                    template += `<td>${participant['state'][fieldMapping.duplicateType.toString()] ? `Not Active recruit signed in as Passive recruit` : ``}</td>`
                : ( participant['state'][fieldMapping.duplicateType.toString()] === fieldMapping.alreadyEnrolled ) ?
                template += `<td>${participant['state'][fieldMapping.duplicateType.toString()] ? `Already Enrolled` : ``}</td>`
                : ( participant['state'][fieldMapping.duplicateType.toString()] === fieldMapping.notActiveSignedAsActive ) ?
                template += `<td>${participant['state'][fieldMapping.duplicateType.toString()] ? `Not Active recruit signed in as Active recruit` : ``}</td>`
                : ( participant['state'][fieldMapping.duplicateType.toString()] === fieldMapping.passiveSignedAsActive ) ?
                template += `<td>${participant['state'][fieldMapping.duplicateType.toString()] ? `Passive recruit signed in as Active recruit` : ``}</td>`
                : ( participant['state'][fieldMapping.duplicateType.toString()] === fieldMapping.activeSignedAsPassive ) ?
                template += `<td>${participant['state'][fieldMapping.duplicateType.toString()] ? `Active recruit signed in as Passive recruit` : ``}</td>`
                :  template += `<td></td>`
            )
            : (x === fieldMapping.updateRecruitType.toString()) ? (
                ( participant['state'][fieldMapping.updateRecruitType.toString()] === fieldMapping.passiveToActive ) ?
                    template += `<td>${participant['state'][fieldMapping.updateRecruitType.toString()] ? `Passive To Active` : ``}</td>`
                : ( participant['state'][fieldMapping.updateRecruitType.toString()] === fieldMapping.activeToPassive ) ?
                template += `<td>${participant['state'][fieldMapping.updateRecruitType.toString()] ? `Active To Passive` : ``}</td>`
                :  template += `<td>${participant['state'][fieldMapping.updateRecruitType.toString()] ? `No Change Needed` : ``}</td>`
            )
            : (x === fieldMapping.firstNameMatch.toString()) ? (
                ( participant['state'][fieldMapping.firstNameMatch.toString()] === fieldMapping.matched ) ?
                    template += `<td>${participant['state'][fieldMapping.firstNameMatch.toString()] ? `Matched` : ``}</td>`
                : template += `<td>${participant['state'][fieldMapping.firstNameMatch.toString()] ? `Not Matched` : ``}</td>`
            )
            : (x === fieldMapping.lastNameMatch.toString()) ? (
                ( participant['state'][fieldMapping.lastNameMatch.toString()] === fieldMapping.matched ) ?
                    template += `<td>${participant['state'][fieldMapping.lastNameMatch.toString()] ? `Matched` : ``}</td>`
                : template += `<td>${participant['state'][fieldMapping.lastNameMatch.toString()] ? `Not Matched` : ``}</td>`
            )
            : (x === fieldMapping.dobMatch.toString()) ? (
                ( participant['state'][fieldMapping.dobMatch.toString()] === fieldMapping.matched ) ?
                    template += `<td>${participant['state'][fieldMapping.dobMatch.toString()] ? `Matched` : ``}</td>`
                : template += `<td>${participant['state'][fieldMapping.dobMatch.toString()] ? `Not Matched` : ``}</td>`
            )
            : (x === fieldMapping.pinMatch.toString()) ? (
                ( participant['state'][fieldMapping.pinMatch.toString()] === fieldMapping.matched ) ?
                    template += `<td>${participant['state'][fieldMapping.pinMatch.toString()] ? `Matched` : ``}</td>`
                : template += `<td>${participant['state'][fieldMapping.pinMatch.toString()] ? `Not Matched` : ``}</td>`
            )
            : (x === fieldMapping.tokenMatch.toString()) ? (
                ( participant['state'][fieldMapping.tokenMatch.toString()] === fieldMapping.matched ) ?
                    template += `<td>${participant['state'][fieldMapping.tokenMatch.toString()] ? `Matched` : ``}</td>`
                : template += `<td>${participant['state'][fieldMapping.tokenMatch.toString()] ? `Not Matched` : ``}</td>`
            )
            : (x === fieldMapping.zipCodeMatch.toString()) ? (
                ( participant['state'][fieldMapping.zipCodeMatch.toString()] === fieldMapping.matched ) ?
                    template += `<td>${participant['state'][fieldMapping.zipCodeMatch.toString()] ? `Matched` : ``}</td>`
                : template += `<td>${participant['state'][fieldMapping.zipCodeMatch.toString()] ? `Not Matched` : ``}</td>`
            )
            : (x === fieldMapping.siteMatch.toString()) ? (
                ( participant['state'][fieldMapping.siteMatch.toString()] === fieldMapping.criteriumMet ) ?
                    template += `<td>${participant['state'][fieldMapping.siteMatch.toString()] ? `CriteriumMet` : ``}</td>`
                : template += `<td>${participant['state'][fieldMapping.siteMatch.toString()] ? `Not Criterium Met` : ``}</td>`
            )
            : (x === fieldMapping.ageMatch.toString()) ? (
                ( participant['state'][fieldMapping.ageMatch.toString()] === fieldMapping.criteriumMet ) ?
                    template += `<td>${participant['state'][fieldMapping.ageMatch.toString()] ? `CriteriumMet` : ``}</td>`
                : template += `<td>${participant['state'][fieldMapping.ageMatch.toString()] ? `Not Criterium Met` : ``}</td>`
            )
            : (x === fieldMapping.cancerStatusMatch.toString()) ? (
                ( participant['state'][fieldMapping.cancerStatusMatch.toString()] === fieldMapping.criteriumMet ) ?
                    template += `<td>${participant['state'][fieldMapping.cancerStatusMatch.toString()] ? `CriteriumMet` : ``}</td>`
                : template += `<td>${participant['state'][fieldMapping.cancerStatusMatch.toString()] ? `Not Criterium Met` : ``}</td>`
            )
            // : (x === fieldMapping.preferredLanguage.toString()) ? (
            //     ( participant['state'][fieldMapping.preferredLanguage.toString()] === fieldMapping.language.en ) ?
            //         template += `<td>${participant['state'][fieldMapping.preferredLanguage.toString()] ? `English` : ``}</td>`
            //     : template += `<td>${participant['state'][fieldMapping.preferredLanguage.toString()] ? `Spanish` : ``}</td>`
            // )
            : (template += `<td>${participant[x] ? participant[x] : ''}</td>`)
        })
        template += `</tr>`; 
    });
    template += '</tbody>';
    return template;
}

const addEventShowMoreInfo = (data) => {
    const elements = document.getElementsByClassName('showMoreInfo');
    Array.from(elements).forEach(element => {
        element.addEventListener('click', () => {
            const filteredData = data.filter(dt => dt.token === element.dataset.token);
            const header = document.getElementById('modalHeader');
            const body = document.getElementById('modalBody');
            const user = filteredData[0];
            header.innerHTML = `<h4>${user[fieldMapping.fName]} ${user[fieldMapping.lName]}</h4><button type="button" class="modal-close-btn" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>`
            let template = '<div>';
            for(let key in user){
                if(typeof user[key] === 'object') {
                    template += `<span><strong>${key}</strong></span> - <ul class="user-data-ul">`
                    for(let nestedKey in user[key]){
                        template += `<li><span><strong>${nestedKey}</strong></span> - <span>${user[key][nestedKey]}</span></li>`
                    }
                    template += `</ul>`
                }
                else {
                    template += `<span><strong>${key}</strong></span> - <span>${user[key]}</span></br>`
                }
            }
            body.innerHTML = template;
        })
    })

    const selectElements = document.getElementsByClassName('select-participant');
    Array.from(selectElements).forEach(element => {
        element.addEventListener('click', async () => {
            const filteredData = data.filter(dt => dt.token === element.dataset.token);
            let changedOption = {};
            const loadDetailsPage = '#participantDetails'
            location.replace(window.location.origin + window.location.pathname + loadDetailsPage); // updates url to participantDetails upon screen update
            const idToken = await getIdToken();
            renderParticipantDetails(filteredData[0], changedOption, idToken);
        });
    });

}
export const addEventFilterData = (data, showButtons) => {
    const btn = document.getElementById('filterData');
    if(!btn) return;
    btn.addEventListener('keyup', async () => {
        const value = document.getElementById('filterData').value.trim();
        if(value.length < 3) {
            renderData(data, showButtons);
            return;
        }
        renderData(searchBy(data, value), showButtons);
    });
}
export const filterdata = (data) => {
    return data.filter(participant => participant['699625233'] !== undefined);
}

export const filterBySiteKey = (data, sitePref) => {
    let filteredData = [];
    data.filter(participant => 
        {
            if (participant['827220437'] === sitePref) {
                filteredData.push(participant);
            }
        })
    return filteredData;
}

export const activeColumns = (data, showButtons) => {
    let btns = document.getElementsByName('column-filter');
    Array.from(btns).forEach(btn => {
        let value = btn.dataset.column;
        if(importantColumns.indexOf(value) !== -1) {
            btn.classList.add('filter-active');
        }
        btn.addEventListener('click', async (e) => {
            e.stopPropagation()
            if(!btn.classList.contains('filter-active')){
                btn.classList.add('filter-active');
                importantColumns.push(value);
                if(document.getElementById('filterData').value.trim().length >= 3) {
                    renderData(searchBy(data, document.getElementById('filterData').value.trim()), showButtons, 'bubbleFilters');
                }
                else {
                    renderData(data, showButtons, 'bubbleFilters');
                }
            }
            else{
                btn.classList.remove('filter-active');
                importantColumns.splice(importantColumns.indexOf(value), 1);
                if(document.getElementById('filterData').value.trim().length >= 3) {
                    renderData(searchBy(data, document.getElementById('filterData').value.trim()), showButtons, 'bubbleFilters');
                }
                else {
                    renderData(data, showButtons, 'bubbleFilters');
                }
            }
            document.getElementById('currentPageNumber').innerHTML = `&nbsp;Page: 1&nbsp;`
            document.getElementById('nextLink').setAttribute('data-nextpage', 1);
            let prevState = appState.getState().filterHolder
            appState.setState({filterHolder:{...prevState, nextPageCounter: 1}})
            if (appState.getState().filterHolder.startDate) {
                document.getElementById('startDate').value = appState.getState().filterHolder.startDate
                document.getElementById('endDate').value = appState.getState().filterHolder.endDate
            }
            if (appState.getState().filterHolder.type === "passive") {
                let passiveButton = document.getElementById('passiveFilter');
                if (passiveButton && [...passiveButton.classList].includes('btn-outline-info')) {
                    passiveButton.classList.remove('btn-outline-info');
                    passiveButton.classList.add('btn-info');  
                }
            }
            if (appState.getState().filterHolder.type === "active") {
                let activeButton = document.getElementById('activeFilter');
                if (activeButton && [...activeButton.classList].includes('btn-outline-info')) {
                    activeButton.classList.remove('btn-outline-info');
                    activeButton.classList.add('btn-info');  
                }
            }
        })
    });
}

export const searchBy = (data, value) => {
    return data.filter(dt => {
        const fn = dt[fieldMapping.fName];
        const ln = dt['996038075'];
        
        if((new RegExp(value, 'i')).test(fn)) {
            // dt.RcrtUP_Fname_v1r0 = fn.replace((new RegExp(value, 'ig')), "<b>$&</b>");
            return dt
        }
        if((new RegExp(value, 'i')).test(ln)) {
            // dt.RcrtUP_Lname_v1r0 = ln.replace((new RegExp(value, 'ig')), "<b>$&</b>");
            return dt
        }
        if((new RegExp(value, 'i')).test(dt.Connect_ID)) {
            // const ID = dt.Connect_ID.toString();
            // dt.Connect_ID = ID.replace((new RegExp(value, 'ig')), "<b>$&</b>");
            return dt
        }
    });
}

const alertTrigger = () => {
    let alertList = document.getElementById('alert_placeholder');
    let template = ``;
    template += `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            No results found!
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    </div>`
    alertList.innerHTML = template;
    return template;
}

const missingDateTrigger = () => {
    let alertList = document.getElementById('alert_placeholder');
    let template = ``;
    template += `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            Enter both To & From date fields!
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    </div>`
    alertList.innerHTML = template;
    return template;
}

export const dropdownTriggerAllParticipants = (sitekeyName) => {
    let a = document.getElementById('dropdownSites');
    if (a) {
        let dropdownMenuButton = document.getElementById('dropdownMenuButtonSites');
        let tempSiteName = a.innerHTML = sitekeyName;
        if (dropdownMenuButton) {
            dropdownMenuButton.addEventListener('click', (e) => {
                if (sitekeyName === 'Filter by Site' || sitekeyName === tempSiteName) {
                    a.innerHTML = e.target.textContent;
                    const t = getDataAttributes(e.target);
                    const query = `sitePref=${t.sitekey}`;
                    reRenderTableParticipantsAllTable(query, t.sitekey, e.target.textContent);
                }
            })
    }}
}

const reRenderTableParticipantsAllTable = async (query, sitePref, currentSiteSelection) => {
    showAnimation();
    const sitePrefId = nameToKeyObj[sitePref];
    let prevState = appState.getState().filterHolder
    appState.setState({filterHolder:{...prevState, 'siteCode': sitePrefId, 'siteName': sitePref}})
    const response = await getParticipantFromSites(sitePrefId);
    hideAnimation();
    if(response.code === 200 && response.data.length > 0) {
        const mainContent = document.getElementById('mainContent')
        let filterRawData = filterdata(response.data);
        if (filterRawData.length === 0)  return alertTrigger();
        localStorage.setItem('filterRawData', JSON.stringify(filterRawData))
        mainContent.innerHTML = renderTable(filterRawData, 'participantAll');
        addEventFilterData(filterRawData);
        renderData(filterRawData);
        activeColumns(filterRawData);
        renderLookupSiteDropdown();
        let dropdownMenuButton = document.getElementById('dropdownMenuButtonSites');
        dropdownMenuButton.setAttribute('selectedsite', sitePref)
        dropdownTriggerAllParticipants(currentSiteSelection);
    }
    else if(response.code === 200 && response.data.length === 0) {
        renderDataTable([]);
        return alertTrigger();
    }
    else if(response.code != 200 && response.data.length === 0) {
        clearLocalStorage();
    }
}

export const renderLookupSiteDropdown = () => {
    let dropDownstatusFlag = localStorage.getItem('dropDownstatusFlag');
    if (dropDownstatusFlag === 'true') {
        document.getElementById("siteDropdownLookup").hidden = false }
}

const getCustomVariableNames = (x) => {
    const customVariableFields = {
                                    [fieldMapping.consentFirstName]: 'First Name (Consent)',
                                    [fieldMapping.consentMiddleName]: 'Middle Name (Consent)',
                                    [fieldMapping.consentLastName]: 'Last Name (Consent)',
                                    [fieldMapping.fName]: 'First Name (UP)',
                                    [fieldMapping.mName]: 'Middle Name (UP)',
                                    [fieldMapping.lName]: 'Last Name (UP)'
                                }
    return customVariableFields[x] ?? '';

}

const getMoreParticipants = async (query, nextPageCounter) => {
    let filterHolder = appState.getState().filterHolder
    if (filterHolder.source === `participantAll`) appState.setState({filterHolder:{...filterHolder, 'nextPageCounter': nextPageCounter}})
    const idToken = await getIdToken();
    let template = `/dashboard?api=getParticipants`;
    const limit = 50;
    if (filterHolder.source === `participantAll`) {
        if (filterHolder.siteCode && filterHolder.siteCode !== `Filter by Site` && filterHolder.siteCode !== 1000) {
            template += `&siteCode=${filterHolder.siteCode}`
        } 
        else if (query !== nameToKeyObj.allResults) {
            template += `&siteCode=${query}`
        }
    
        if (filterHolder.type && filterHolder.type !== ``) {
            template += `&type=${filterHolder.type}`
        } 
        else {
            template += `&type=all`
        }

        if (filterHolder.startDate && filterHolder.startDate !== ``) {
            template +=  `&from=${filterHolder.startDate}T00:00:00.000Z&to=${filterHolder.endDate}T23:59:59.999Z`
        }
    }
    else {
        if (filterHolder.source && filterHolder.type !== ``) {
            template += `&type=${filterHolder.source}`
        } 
    }
    if (nextPageCounter !== undefined ) {
        template += `&page=${nextPageCounter}`
    } 

    template += `&limit=${limit}`

    const response = await fetch(`${baseAPI}${template}`, {
        method: "GET",
        headers: {
            Authorization:"Bearer " + idToken
        }
    });
    return await response.json();
}


const getParticipantFromSites = async (query) => {
    let prevState = appState.getState().filterHolder
    appState.setState({filterHolder:{...prevState, 'siteCode': query, 'nextPageCounter': 0}})
    const idToken = await getIdToken();
    let template = ``;
    const limit = 50;
    (query === nameToKeyObj.allResults) ? template += `/dashboard?api=getParticipants&type=all&limit=${limit}` : template += `/dashboard?api=getParticipants&type=all&siteCode=${query}&limit=${limit}`
    const response = await fetch(`${baseAPI}${template}`, {
        method: "GET",
        headers: {
            Authorization:"Bearer " + idToken
        }
    });
    return await response.json();
}

const getParticipantsWithFilters = async (type, sitePref, startDate, endDate) => {
    let prevState = appState.getState().filterHolder
    appState.setState({filterHolder:{...prevState, 'type': type, 'nextPageCounter': 0}})
    const idToken = await getIdToken();
    let template = `/dashboard?api=getParticipants&type=${type}`;
    const limit = 50;

    if (sitePref !== 'Filter by Site') {
        template += `&siteCode=${sitePref}`
    }
    if (startDate !== ``) {
        template += `&from=${startDate}T00:00:00.000Z&to=${endDate}T23:59:59.999Z`
    }

    template += `&limit=${limit}`
    
    const response = await fetch(`${baseAPI}${template}`, {
        method: "GET",
        headers: {
            Authorization:"Bearer " + idToken
        }
    });
    return await response.json();
}

const getParticipantsWithDateFilters = async (type, sitePref, startDate, endDate) => {
    let prevState = appState.getState().filterHolder
    appState.setState({filterHolder:{...prevState, 'startDate': startDate, 'endDate': endDate, 'nextPageCounter': 0}})
    const idToken = await getIdToken();
    let template = ``;
    const limit = 50;
    if (type !== null && sitePref !== 'Filter by Site') template += `/dashboard?api=getParticipants&type=${type}&siteCode=${sitePref}&from=${startDate}T00:00:00.000Z&to=${endDate}T23:59:59.999Z&limit=${limit}`
    else if (type === null && sitePref !== 'Filter by Site') {
         template += `/dashboard?api=getParticipants&type=all&siteCode=${sitePref}&from=${startDate}T00:00:00.000Z&to=${endDate}T23:59:59.999Z&limit=${limit}` }
    else if (type !== null && sitePref === 'Filter by Site') template += `/dashboard?api=getParticipants&type=${type}&from=${startDate}T00:00:00.000Z&to=${endDate}T23:59:59.999Z&limit=${limit}`
    else template += `/dashboard?api=getParticipants&type=all&from=${startDate}T00:00:00.000Z&to=${endDate}T23:59:59.999Z&limit=${limit}`
    const response = await fetch(`${baseAPI}${template}`, {
        method: "GET",
        headers: {
            Authorization:"Bearer "+idToken
        }
    });
    return await response.json();
}

const getCurrentSelectedParticipants = async (query) => {
    const idToken = await getIdToken();
    let template = `/dashboard?api=getParticipants`;
    template += `${query}`
    const limit = 50;
    template += `&limit=${limit}`
    const response = await fetch(`${baseAPI}${template}`, {
        method: "GET",
        headers: {
            Authorization:"Bearer " + idToken
        }
    });
    return await response.json();
}
