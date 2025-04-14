import { renderParticipantDetails } from './participantDetails.js';
import { clearLocalStorage } from '../index.js';
import fieldMapping from './fieldToConceptIdMapping.js'; 
import { getIdToken, showAnimation, hideAnimation, urls, getParticipants, sortByKey, resetPagination } from './utils.js';
import { appState } from './stateManager.js';
import { nameToKeyObj, keyToNameObj, keyToShortNameObj } from './idsToName.js';

export const importantColumns = [fieldMapping.fName, fieldMapping.mName, fieldMapping.lName, fieldMapping.birthMonth, fieldMapping.birthDay, fieldMapping.birthYear, fieldMapping.email, 'Connect_ID', fieldMapping.healthcareProvider];

export const renderTable = (data, source) => {
    
    let template = '';
    if(data.length === 0) return `No data found!`;

    let array = [ 
        'Connect_ID', 'pin', 'token', 'studyId', fieldMapping.timeStudyIdSubmitted, fieldMapping.recruitmentType, fieldMapping.recruitmentDate, fieldMapping.siteReportedAge, fieldMapping.siteReportedRace, 
        fieldMapping.siteReportedSex, fieldMapping.sanfordReportedSex, fieldMapping.sanfordReportedRace, fieldMapping.henryFReportedRace, fieldMapping.bswhReportedRaceEthnicity, fieldMapping.campaignType, fieldMapping.signedInFlag, fieldMapping.signinDate, fieldMapping.pinEntered, fieldMapping.noPin, fieldMapping.consentFlag, 
        fieldMapping.consentDate, fieldMapping.consentVersion, fieldMapping.hippaFlag, fieldMapping.hippaDate, fieldMapping.hipaaVersion, fieldMapping.userProfileFlag, 
        fieldMapping.userProfileDateTime, fieldMapping.verifiedFlag, fieldMapping.verficationDate, fieldMapping.automatedVerification, fieldMapping.outreachRequiredForVerification, fieldMapping.manualVerification,
        fieldMapping.duplicateType, fieldMapping.firstNameMatch, fieldMapping.lastNameMatch, fieldMapping.dobMatch, fieldMapping.pinMatch, fieldMapping.tokenMatch, 
        fieldMapping.zipCodeMatch, fieldMapping.siteMatch, fieldMapping.ageMatch, fieldMapping.cancerStatusMatch, fieldMapping.updateRecruitType, 
        fieldMapping.preConsentOptOut, fieldMapping.datePreConsentOptOut, fieldMapping.maxNumContactsReached, fieldMapping.signInMechansim, fieldMapping.consentFirstName, 
        fieldMapping.consentMiddleName, fieldMapping.consentLastName, fieldMapping.accountName,fieldMapping.accountPhone, fieldMapping.accountEmail, fieldMapping.prefName, 
        fieldMapping.address1, fieldMapping.address2, fieldMapping.city, fieldMapping.state, fieldMapping.zip, fieldMapping.physicalAddress1, fieldMapping.physicalAddress2, fieldMapping.physicalCity, fieldMapping.physicalState, fieldMapping.physicalZip,
        fieldMapping.email, fieldMapping.email1, fieldMapping.email2, fieldMapping.cellPhone, fieldMapping.homePhone, fieldMapping.otherPhone,
        fieldMapping.altAddress1, fieldMapping.altAddress2, fieldMapping.altCity, fieldMapping.altState, fieldMapping.altZip,
        fieldMapping.altContactFirstName, fieldMapping.altContactLastName, fieldMapping.altContactMobilePhone, fieldMapping.altContactHomePhone, fieldMapping.altContactEmail,    
        fieldMapping.previousCancer, fieldMapping.allBaselineSurveysCompleted, 
        fieldMapping.preferredLanguage, fieldMapping.participationStatus, fieldMapping.bohStatusFlag1, fieldMapping.mreStatusFlag1, fieldMapping.sasStatusFlag1, fieldMapping.lawStausFlag1, 
        fieldMapping.ssnFullflag, fieldMapping.ssnPartialFlag , fieldMapping.refusedSurvey,  fieldMapping.refusedBlood, fieldMapping.refusedUrine,  fieldMapping.refusedMouthwash, fieldMapping.refusedSpecimenSurveys, fieldMapping.refusedFutureSamples, fieldMapping.refusedQualityOfLifeSurvey, fieldMapping.refusedAllFutureQualityOfLifeSurveys, fieldMapping.refusedCancerScreeningHistorySurvey,
        fieldMapping.refusedExperienceSurvey, fieldMapping.refusedAllFutureExperienceSurveys, fieldMapping.refusedFutureSurveys, fieldMapping.refusedAllFutureActivities, fieldMapping.revokeHIPAA, fieldMapping.dateHipaaRevokeRequested, fieldMapping.dateHIPAARevoc, fieldMapping.withdrawConsent, fieldMapping.dateWithdrewConsentRequested, 
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
                    
                    ${(source === 'all' || source === 'active' || source === 'passive') ? ` 
                        <div class="col-12">
                            <div class="d-flex flex-wrap align-items-center"> 
                                <div class="form-group dropdown dropright mr-3" id="siteDropdownLookup" ${localStorage.getItem('dropDownstatusFlag') === 'false' ? `hidden` : ``}>
                                    <button class="btn btn-primary btn-lg dropdown-toggle" type="button" id="dropdownSites" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style="margin-top: 10px;"></button>
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

                                <form class="form-inline align-items-center" id="dateFilters">
                                    <label for="startDate" class="font-weight-bold mr-3">Verification Status Time:</label>
                                    <div class="form-group mr-2">
                                        <span class="small text-muted mr-1">From:</span>
                                        <input type="date" class="form-control" id="startDate" style="width:160px; height:40px;">
                                    </div>
                                    <div class="form-group mr-2">
                                        <span class="small text-muted mr-1">To:</span>
                                        <input type="date" class="form-control" id="endDate" style="width:160px; height:40px;">
                                    </div>
                                    <button type="button" class="btn btn-outline-danger" id="resetDate">Reset</button>
                                </form>
                            </div>
                        </div>
                    `: ``}
                    </div>`

    let backToSearch = (source === 'participantLookup')? `<button class="btn btn-primary" id="back-to-search">Back to Search</button>`: "";
    template += `
                <div class="row">
                    <div class="col">
                        <div class="float-left">
                            ${backToSearch}
                        </div>
                    </div>
                
                    <div class="row w-100 mx-0">
                        <div class="col-12 px-0">
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
                    </div>
                </div>`
    return template;
}

export  const renderData = (data, source) => {
    if(data.length === 0) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = renderTable(data, source);
        hideAnimation();
        return;
    }
    
    const pageSize = 50;
    const dataLength = data.length;
    data.splice(pageSize, dataLength);
    renderDataTable(data)
    addEventShowMoreInfo(data);
    if (source !== 'bubbleFilters') {
        document.getElementById('paginationContainer').innerHTML = paginationTemplate();

        addEventPagination();
        addEventActivePassiveFilter();
        addEventDateFilter();
        addEventSiteFilter();
    }
}

export const renderFilters = () => {

    if (appState.getState().startDateFilter) {
        const startDate = document.getElementById('startDate');
        startDate.value = appState.getState().startDateFilter;
    }

    if (appState.getState().endDateFilter) {
        const endDate = document.getElementById('endDate');
        endDate.value = appState.getState().endDateFilter;
    }

    if (appState.getState().participantTypeFilter === 'active') {
        const activeButton = document.getElementById('activeFilter');
        activeButton.classList.add('btn-info');
        activeButton.classList.remove('btn-outline-info');
    }

    if (appState.getState().participantTypeFilter === 'passive') {
        const passiveButton = document.getElementById('passiveFilter');
        passiveButton.classList.add('btn-info');
        passiveButton.classList.remove('btn-outline-info');
    }

    const dropdownButton = document.getElementById('dropdownSites');
    if (dropdownButton) {
        const siteName = appState.getState().siteCode ? keyToShortNameObj[appState.getState().siteCode] : keyToShortNameObj[1000];
        dropdownButton.innerHTML = siteName;
    }
}

const renderDataTable = (data) => {
    document.getElementById('dataTable').innerHTML = tableTemplate(data);
    addEventShowMoreInfo(data);
}

/**
 * Sets up event handlers for the Active and Passive participant filter buttons.
 * 
 * @function addEventActivePassiveFilter
 * @returns {void}
 */
const addEventActivePassiveFilter = () => {
    const activeButton = document.getElementById('activeFilter');
    const passiveButton = document.getElementById('passiveFilter');

    const setupButton = (button, filterType) => {
        button && button.addEventListener('click', () => {
            const isActive = button.classList.contains('btn-info');
            const newFilterType = isActive ? 'all' : filterType;

            appState.setState({ participantTypeFilter: newFilterType });
            resetPagination();
            reRenderMainTable();
        });
    }

    setupButton(activeButton, 'active');
    setupButton(passiveButton, 'passive');
}

/**
 * Sets up event listeners for date filter inputs to enable filtering participants by date range.
 * 
 * @function addEventDateFilter
 * @returns {void}
 */
const addEventDateFilter = () => {
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const resetDateFilters = document.getElementById('resetDate');

    resetDateFilters && resetDateFilters.addEventListener('click', async () => {
        appState.setState({ startDateFilter: ``, endDateFilter: ``});
        resetPagination();
        reRenderMainTable();
    });

    const setupDateInput = (input, dateType) => {
        input && (input.max = new Date().toISOString().split("T")[0]);
        input && input.addEventListener('change', () => {
            const newDate = input.value;

            appState.setState({ [dateType]: newDate} );
            resetPagination();
            reRenderMainTable();
        });
    }

    setupDateInput(startDate, 'startDateFilter');
    setupDateInput(endDate, 'endDateFilter');
}

/**
 * Sets up event listeners for pagination controls to navigate through participant data.
 * 
 * @function addEventPagination
 * @returns {void}
 */
const addEventPagination = () => {
    const prevButton = document.getElementById('previousLink');
    const nextButton = document.getElementById('nextLink');
    const currentPage = appState.getState().pageNumber;

    const setupPaginationButton = (button, type) => {
        button && button.addEventListener('click', async () => {
            if (type === 'previous') appState.setState({ pageNumber: currentPage - 1, direction: 'previous' });
            if (type === 'next') appState.setState({ pageNumber: currentPage + 1, direction: 'next' });

            window.scrollTo({top: 0, behavior: 'smooth'});

            reRenderMainTable();
        });
    }

    setupPaginationButton(prevButton, 'previous');
    setupPaginationButton(nextButton, 'next');
}
/**
 * Sets up event listeners for the dropdown to filter participants by site.
 * 
 * @function addEventSiteFilter
 * @returns {void}
 */
const addEventSiteFilter = () => {
    const dropdownButton = document.getElementById('dropdownMenuButtonSites');

    const setupDropdownButton = (button) => {
        button && button.addEventListener('click', (e) => {
            const siteKey = e.target.getAttribute('data-siteKey');
            const siteCode = nameToKeyObj[siteKey];

            appState.setState({ siteCode });
            reRenderMainTable();
        });
    }
    
    setupDropdownButton(dropdownButton);
}

export const reRenderMainTable = async () => {

    showAnimation();

    const response = await getParticipants();
    const data = sortByKey(response.data, fieldMapping.healthcareProvider);
    
    hideAnimation();

    if(response.code === 200 && data.length > 0) {
        if (data.length > 0) {
            const mainContent = document.getElementById('mainContent');
            const type = appState.getState().participantTypeFilter;

            mainContent.innerHTML = renderTable(data, type);
            renderData(data, type);
            activeColumns(data);
            renderFilters();

            return;
        }
        else {
            renderDataTable([]);
            return alertTrigger();
        }
    }
    else {
        clearLocalStorage();
    }
}

/**
 * Creates a template for pagination controls
 * 
 * @function paginationTemplate
 * @returns {string} HTML template string for pagination controls
 */
const paginationTemplate = () => {

    const { pageNumber, cursorHistory } = appState.getState();

    return `
    <div class="pagination-container mt-3 mb-3 d-flex justify-content-center">
        <nav aria-label="Participant data pagination">
            <div class="pagination sub-div-shadow d-flex align-items-center" style="border-radius:6px; background-color:white;">
                <button id="previousLink" class="btn page-item flex-grow-1" ${pageNumber === 1 ? `disabled` : ``} style="border-right:1px solid #dee2e6; min-width:120px; text-align:center;">
                    <i class="fa fa-arrow-left" aria-hidden="true"></i>
                    &nbsp;Previous
                </button>
                
                <span id="currentPageNumber" class="page-item text-primary px-4 m-0 flex-grow-1" style="min-width:120px; text-align:center;">
                    Page: ${appState.getState().pageNumber}
                </span>
                
                <button id="nextLink" class="btn page-item flex-grow-1" ${cursorHistory.length === 0 ? `disabled` : ``} style="border-left:1px solid #dee2e6; min-width:120px; text-align:center;">
                    Next&nbsp;
                    <i class="fa fa-arrow-right" aria-hidden="true"></i>
                </button>
            </div>
        </nav>
    </div>`;
}

// TODO: needs code refactoring
const tableTemplate = (data) => {
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
                x === (fieldMapping.refusedFutureSurveys).toString() || x === (fieldMapping.refusedQualityOfLifeSurvey).toString() || x === (fieldMapping.refusedAllFutureQualityOfLifeSurveys).toString() || x === fieldMapping.refusedCancerScreeningHistorySurvey.toString() ||
                x === (fieldMapping.refusedExperienceSurvey).toString() || x === (fieldMapping.refusedAllFutureExperienceSurveys).toString()) ?
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
                : ( participant['state'][fieldMapping.duplicateType.toString()] === fieldMapping.eligibilityStatusChanged ) ?
                template += `<td>${participant['state'][fieldMapping.duplicateType.toString()] ? `Change in eligibility status` : ``}</td>`
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

export const activeColumns = (data) => {
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
                renderData(data, 'bubbleFilters');
            }
            else{
                btn.classList.remove('filter-active');
                importantColumns.splice(importantColumns.indexOf(value), 1);
                renderData(data, 'bubbleFilters');
            }
            document.getElementById('currentPageNumber').innerHTML = `&nbsp;Page: 1&nbsp;`
            document.getElementById('nextLink').setAttribute('data-nextpage', 1);

            if (appState.getState().startDateFilter) document.getElementById('startDate').value = appState.getState().startDateFilter;
            if (appState.getState().endDateFilter) document.getElementById('endDate').value = appState.getState().endDateFilter;
        })
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