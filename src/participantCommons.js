import { renderParticipantDetails } from './participantDetails.js';
import { clearLocalStorage } from '../index.js';
import fieldMapping from './fieldToConceptIdMapping.js';
import { getIdToken, showAnimation, hideAnimation, getParticipants, sortByKey, renderSiteDropdown, triggerNotificationBanner } from './utils.js';
import { searchState, buildPredefinedSearchMetadata } from './stateManager.js';
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
    if (data.length === 0) return `No data found!`;
    
    // Display the site dropdown, active and passive filters, and verification status time filter for specific search sources
    const displayFilters = ['all', 'verified', 'active', 'passive'].includes(source);

    let template = '';
    template += renderSearchBubbles();
    template += ` <div id="alert_placeholder"></div>
                    <div class="row">
                    
                    ${displayFilters ? ` 
                        <div class="col-12">
                            <div class="d-flex flex-wrap align-items-center"> 
                                ${renderSiteDropdown('table')}

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

    let backToSearch = (source === 'participantLookup')
        ? `<button type="button" class="btn btn-primary" id="back-to-search" data-back-mode="lookup-form">Back to Search</button>`
        : "";
    template += `
                <div class="row">
                    <div class="col">
                        <div class="float-left">
                            ${backToSearch}
                        </div>
                    </div>
                
                    <div class="row w-100 mx-0">
                        <div class="col-12 px-0 table-responsive">
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

export  const renderParticipantSearchResults = (data, source) => {
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
        if (source) {
            document.getElementById('paginationContainer').innerHTML = paginationTemplate();
        }

        addEventPagination();
        addEventActivePassiveFilter();
        addEventDateFilter();
        addEventSiteFilter();
    }
}

export const renderFilters = () => {
    const metadata = searchState.getCachedMetadata();
    const startDateValue = metadata?.startDateFilter || '';
    const endDateValue = metadata?.endDateFilter || '';
    const participantType = metadata?.effectiveType || metadata?.predefinedType || '';

    if (startDateValue) {
        const startDate = document.getElementById('startDate');
        startDate.value = startDateValue;
    }

    if (endDateValue) {
        const endDate = document.getElementById('endDate');
        endDate.value = endDateValue;
    }

    if (participantType === 'active') {
        const activeButton = document.getElementById('activeFilter');
        activeButton?.classList.add('btn-info');
        activeButton?.classList.remove('btn-outline-info');
    }

    if (participantType === 'passive') {
        const passiveButton = document.getElementById('passiveFilter');
        passiveButton?.classList.add('btn-info');
        passiveButton?.classList.remove('btn-outline-info');
    }

    const dropdownButton = document.getElementById('dropdownSites');
    if (dropdownButton) {
        const siteCode = metadata?.siteCode;
        if (siteCode && siteCode !== nameToKeyObj.allResults) {
            const siteName = keyToShortNameObj[siteCode];
            dropdownButton.innerHTML = siteName;
            dropdownButton.setAttribute('data-siteKey', Object.keys(nameToKeyObj).find(key => nameToKeyObj[key] === siteCode) || 'allResults');
        } else {
            dropdownButton.innerHTML = 'All Sites';
            dropdownButton.setAttribute('data-siteKey', 'allResults');
        }
    }
}

const renderDataTable = (data, showButtons) => {
    document.getElementById('dataTable').innerHTML = buildTableTemplate(data, showButtons);
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
        button && button.addEventListener('click', async () => {
            const isActive = button.classList.contains('btn-info');
            const metadata = searchState.getCachedMetadata();
            const baseType = metadata?.predefinedType || 'all';
            const newFilterType = isActive ? baseType : filterType;

            await searchState.updatePredefinedMetadata({
                effectiveType: newFilterType,
                pageNumber: 1,
                direction: '',
                cursorHistory: []
            });
            await reRenderMainTable();
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
        await searchState.updatePredefinedMetadata({
            startDateFilter: '',
            endDateFilter: '',
            pageNumber: 1,
            direction: '',
            cursorHistory: []
        });
        await reRenderMainTable();
    });

    const setupDateInput = (input, dateType) => {
        input && (input.max = new Date().toISOString().split("T")[0]);
        input && input.addEventListener('change', async () => {
            const newDate = input.value;

            await searchState.updatePredefinedMetadata({
                [dateType]: newDate,
                pageNumber: 1,
                direction: '',
                cursorHistory: []
            });
            await reRenderMainTable();
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
    const setupPaginationButton = (button, type) => {
        button && button.addEventListener('click', async () => {
            const latestMetadata = searchState.getCachedMetadata();
            const currentPageNumber = latestMetadata?.pageNumber || 1;
            let nextPage = currentPageNumber;
            let direction = latestMetadata?.direction || '';

            if (type === 'previous') {
                nextPage = Math.max(1, currentPageNumber - 1);
                direction = 'previous';
            }

            if (type === 'next') {
                nextPage = currentPageNumber + 1;
                direction = 'next';
            }

            await searchState.updatePredefinedMetadata({
                pageNumber: nextPage,
                direction,
                cursorHistory: latestMetadata?.cursorHistory || []
            });

            await reRenderMainTable();
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
        button && button.addEventListener('click', async (e) => {
            const siteKey = e.target.getAttribute('data-siteKey');
            const siteCode = nameToKeyObj?.[siteKey] ?? nameToKeyObj.allResults;

            await searchState.updatePredefinedMetadata({
                siteCode,
                pageNumber: 1,
                direction: '',
                cursorHistory: []
            });
            await reRenderMainTable();
        });
    }
    
    setupDropdownButton(dropdownButton);
}

export const renderTablePage = (data, type) => {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = renderTable(data, type);
    
    renderParticipantSearchResults(data, type);
    activeColumns(data);
    if (type !== 'participantLookup') {
        renderFilters();
    }
}

export const reRenderMainTable = async () => {
    showAnimation();

    try {
        const metadata = searchState.getCachedMetadata();
        const routeKey = metadata?.routeKey || metadata?.predefinedType || 'all';
        const routeType = metadata?.predefinedType || 'all';
        const type = metadata?.effectiveType || routeType;
        const response = await getParticipants();

        if (response?.code === 401) {
            clearLocalStorage();
            return;
        }

        if (response?.code !== 200 || !Array.isArray(response?.data)) {
            console.error('Unexpected participants payload', response);
            throw new Error('Unexpected participants payload');
        }

        const data = sortByKey(response.data, fieldMapping.healthcareProvider);

        if (data.length > 0) {
            // Update search cache with new page data
            const paginationState = searchState.getCachedMetadata() || metadata || {};
            const searchMetadata = buildPredefinedSearchMetadata({
                predefinedType: paginationState.predefinedType || routeType,
                effectiveType: paginationState.effectiveType || type,
                routeKey: paginationState.routeKey || routeKey,
                siteCode: paginationState.siteCode ?? nameToKeyObj.allResults,
                startDateFilter: paginationState.startDateFilter ?? '',
                endDateFilter: paginationState.endDateFilter ?? '',
                pageNumber: paginationState.pageNumber || 1,
                direction: paginationState.direction || '',
                cursorHistory: paginationState.cursorHistory || []
            });
            searchState.setSearchResults(searchMetadata, data);

            renderTablePage(data, type);

            requestAnimationFrame(() => {
                const targetElement = document.getElementById('dataTable'); // Target the table itself
                const headerElement = document.querySelector('.navbar'); // The sticky header

                if (targetElement && headerElement) {
                    const headerHeight = headerElement.offsetHeight;
                    const targetPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = targetPosition + window.scrollY - headerHeight - 10; // Add 10px of padding

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        }
        else {
            renderDataTable([]);
            alertTrigger();
        }
    } catch (error) {
        console.error('Error refreshing participants table:', error);
        triggerNotificationBanner(
            'Error loading participant data. Please try again. If the problem persists, contact support.',
            'danger',
            4000
        );
    } finally {
        hideAnimation();
    }
}

/**
 * Creates a template for pagination controls
 * 
 * @function paginationTemplate
 * @returns {string} HTML template string for pagination controls
 */
const paginationTemplate = () => {

    const metadata = searchState.getCachedMetadata();
    const pageNumber = metadata?.pageNumber || 1;
    const cursorHistory = metadata?.cursorHistory || [];

    return `
    <div class="pagination-container mt-3 mb-3 d-flex justify-content-center">
        <nav aria-label="Participant data pagination">
            <div class="pagination sub-div-shadow d-flex align-items-center" style="border-radius:6px; background-color:white;">
                <button id="previousLink" class="btn page-item flex-grow-1" ${pageNumber === 1 ? `disabled` : ``} style="border-right:1px solid #dee2e6; min-width:120px; text-align:center;">
                    <i class="fa fa-arrow-left" aria-hidden="true"></i>
                    &nbsp;Previous
                </button>
                
                <span id="currentPageNumber" class="page-item text-primary px-4 m-0 flex-grow-1" style="min-width:120px; text-align:center;">
                    Page: ${pageNumber}
                </span>
                
                <button id="nextLink" class="btn page-item flex-grow-1" ${cursorHistory[pageNumber - 1] ? `` : `disabled`} style="border-left:1px solid #dee2e6; min-width:120px; text-align:center;">
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

const buildTableTemplate = (data) => {
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

export const filterBySiteKey = (data, siteAbbr) => {
    if (!siteAbbr || siteAbbr === 'allResults') {
        return data;
    }

    const siteCode = nameToKeyObj?.[siteAbbr];
    
    // Filter participants by site code (827220437)
    return data.filter(participant => participant[fieldMapping.healthcareProvider] === siteCode);
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
                renderParticipantSearchResults(data, 'bubbleFilters');
            }
            else{
                btn.classList.remove('filter-active');
                importantColumns.splice(importantColumns.indexOf(value), 1);
                renderParticipantSearchResults(data, 'bubbleFilters');
            }
            document.getElementById('currentPageNumber').innerHTML = `&nbsp;Page: 1&nbsp;`
            document.getElementById('nextLink').setAttribute('data-nextpage', 1);
            const metadata = searchState.getCachedMetadata();
            if (metadata?.startDateFilter) document.getElementById('startDate').value = metadata.startDateFilter;
            if (metadata?.endDateFilter) document.getElementById('endDate').value = metadata.endDateFilter;
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
