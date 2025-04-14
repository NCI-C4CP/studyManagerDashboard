import { renderParticipantDetails } from './participantDetails.js';
import { clearLocalStorage } from '../index.js';
import fieldMapping from './fieldToConceptIdMapping.js'; 
import { getIdToken, showAnimation, hideAnimation, urls, getParticipants, sortByKey, resetPagination } from './utils.js';
import { appState } from './stateManager.js';
import { nameToKeyObj, keyToNameObj, keyToShortNameObj, participantConceptIDToTextMapping, searchBubbleMap, tableHeaderMap } from './idsToName.js';

export const importantColumns = [fieldMapping.fName, fieldMapping.mName, fieldMapping.lName, fieldMapping.birthMonth, fieldMapping.birthDay, fieldMapping.birthYear, fieldMapping.email, 'Connect_ID', fieldMapping.healthcareProvider];

const renderSearchBubbles = () => {
    let template = `<div class="row">
        <div class="col" id="columnFilter">`;

    template += [...searchBubbleMap].map(([key, label]) =>
        `<button name="column-filter" class="filter-btn sub-div-shadow" data-column="${key}">` +
        `${label}` +
        `</button>`).join('');

    template += `</div>
    </div>`;

    return template;
}

export const renderTable = (data, source) => {
    
    let template = '';
    if(data.length === 0) return `No data found!`;

    localStorage.removeItem("participant");
    
    template += renderSearchBubbles();

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

const renderDataTable = (data, showButtons) => {
    document.getElementById('dataTable').innerHTML = buildTableTemplate(data, showButtons);
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
 
/**
 * Fields from tableHeaderMap are always included in the table.
 * Selected bubbles are added to 'importantColumns' as they're selected.
 * Build the table headers from the importantColumns, checking tableHeaderMap and searchBubbleMap for the column names.
 * @returns {string} - HTML string for the table headers
 */

const buildSearchResultsTableHeader = () => {
    const headerStringArray = importantColumns.map((columnKey) => {
        if (!isNaN(columnKey)) columnKey = parseInt(columnKey);

        const columnName = tableHeaderMap.get(columnKey) ?? searchBubbleMap.get(columnKey) ?? columnKey;
        return `<th class="sticky-row">${columnName}</th>`;
    });

    return `<thead class="thead-dark sticky-row">
            <tr>
                <th class="sticky-row">Select</th>
                ${headerStringArray.join("")}
            </tr>
        </thead>`;
}

const buildTableTemplate = (data, showButtons) => {
    let template = buildSearchResultsTableHeader();
    template += '<tbody>';

    data.forEach(participant => {
        let rowHtml = `<tr><td><button class="btn btn-primary select-participant" data-token="${participant.token}">Select</button></td>`;

        // importantColumns are the columns to display
        importantColumns.forEach(columnKey => {
            const rawValue = participant[columnKey];
            const cellContent = participantConceptIDToTextMapping(rawValue, columnKey, participant);
            // Append the table cell
            rowHtml += `<td>${cellContent}</td>`;
        });

        rowHtml += `</tr>`;
        template += rowHtml;
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