import { updateNavBar, setParticipantLookupNavRequest } from './navigationBar.js';
import { attachUpdateLoginMethodListeners, allStates, isAddressInternational, closeModal, getFieldValues, getImportantRows, getIsNORCOrCCC, getModalLabel, primaryPhoneTypes, resetChanges, saveResponses, showSaveNoteInModal, submitClickHandler, suffixList, languageList, viewParticipantSummary, addFormInputFormattingListeners } from './participantDetailsHelpers.js';
import fieldMapping from './fieldToConceptIdMapping.js';
import { renderParticipantHeader } from './participantHeader.js';
import { getDataAttributes, urls, escapeHTML, renderShowMoreDataModal } from './utils.js';
import { appState, participantState, markUnsaved, clearUnsaved } from './stateManager.js';
import { navigateBackToSearchResults } from './participantLookup.js';
import { renderParticipantTabs, initializeTabListeners, loadTabContent, getTabIdFromHash, activateTab } from './participantTabs.js';
import { getCountryCode3List, getCountryNameByCode3 } from './countryMapping.js';

window.addEventListener('beforeunload',  (e) => {
    if (appState.getState().hasUnsavedChanges) { 
    // Cancel the event and show alert that the unsaved changes would be lost 
        e.preventDefault(); 
        e.returnValue = ''; 
    } 
})

// Prevents from scrolling to bottom or middle of the page
window.addEventListener('load', (e) => {
    // Clear unsaved flag after modules are fully loaded
    clearUnsaved();
    requestAnimationFrame(() => {
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    });
})

const initLoginMechanism = (participant) => {
    participant['Change Login Phone'] = participant[fieldMapping.accountPhone] ?? '';
    participant['Change Login Email'] = participant[fieldMapping.accountEmail] ?? ''; 
    appState.setState({loginMechanism:{phone: true, email: true}});
}

export const renderParticipantDetails = async (participant, changedOption = {}, tabId = null, options = {}) => {
    if (!participant) {
        document.getElementById('mainContent').innerHTML = '<div class="container pt-0"><div class="alert alert-warning">No participant data available</div></div>';
        return;
    }
    appState.setState({ changedOption });
    initLoginMechanism(participant);
    await participantState.setParticipant(participant);

    // Determine which tab to show (from parameter or URL hash)
    const activeTabId = tabId || getTabIdFromHash(window.location.hash);

    // Render the page with tabs
    document.getElementById('mainContent').innerHTML = renderParticipantDetailsPage(participant, changedOption, activeTabId);

    // Init search nav listeners, wait for DOM, then init tab content and event listeners
    addSearchNavigationListeners();
    await new Promise(resolve => requestAnimationFrame(resolve));
    await loadDetailsTabContent(participant, changedOption);
    initializeTabListeners(participant);

    // Highlight the active tab, setTimeout delay avoids race conditions
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        setTimeout(() => {
            if (typeof document === 'undefined') return;
            const activeTabLink = document.getElementById(`${activeTabId}-tab`);
            if (activeTabLink) {
                // Remove active class from all tabs, then set the active tab
                document.querySelectorAll('.participant-tabs .nav-link').forEach(el => el.classList.remove('active'));
                activeTabLink.classList.add('active');
            }
            
            const activeTabPane = document.getElementById(`${activeTabId}-content`);
            if (activeTabPane) {
                document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('show', 'active'));
                activeTabPane.classList.add('show', 'active');
            }
        }, 0);
    }

    // Load the active tab if it's not 'details' and activate it
    if (activeTabId !== 'details') {
        await loadTabContent(activeTabId, participant);
        activateTab(activeTabId);
    }

    updateNavBar('participantDetailsBtn');

    const { preserveScrollPosition = false } = options;
    const previousScrollY = preserveScrollPosition ? window.scrollY : 0;

    requestAnimationFrame(() => {
        if (typeof window === 'undefined') return;
        preserveScrollPosition
            ? window.scrollTo({ top: previousScrollY, behavior: 'auto' })
            : window.scrollTo({ top: 0, behavior: 'auto' });    
    });
    
}

/**
 * Render the complete participant details page with tabs
 * @param {object} participant - The participant object
 * @param {object} changedOption - Any changed field values
 * @param {string} activeTabId - The currently active tab ID
 * @returns {string} HTML string for the complete page
 */
const renderParticipantDetailsPage = (participant, changedOption, activeTabId = 'details') => {
    // Check participant status
    const isParticipantDuplicate = participant[fieldMapping.verifiedFlag] === fieldMapping.duplicate;
    const isParticipantCannotBeVerified = participant[fieldMapping.verifiedFlag] === fieldMapping.cannotBeVerified;
    const isParticipantDataDestroyed = participant[fieldMapping.dataDestroyCategorical] === fieldMapping.requestedDataDestroySigned;

    let statusWarning = '';
    let warningTitle = '';
    let warningMessage = '';

    if (isParticipantDuplicate) {
        const isNORCOrCCC = getIsNORCOrCCC();
        warningTitle = 'Duplicate Account';
        warningMessage = 'This participant has been marked as a duplicate account. Editing is disabled for this participant.';
        if (isNORCOrCCC) {
            warningMessage += ' NORC/CCC staff can edit login fields for duplicate accounts.';
        }
    } else if (isParticipantCannotBeVerified) {
        warningTitle = 'Cannot Be Verified';
        warningMessage = 'This participant cannot be verified. Editing is disabled for this participant.';
    } else if (isParticipantDataDestroyed) {
        warningTitle = 'Data Destroyed';
        warningMessage = 'This participant\'s data has been destroyed. Editing is disabled for this participant.';
    }

    if (warningTitle && warningMessage) {
        statusWarning = `
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                <h4 class="alert-heading">${warningTitle}</h4>
                <p>${warningMessage}</p>
            </div>
        `;
    }

    return `
        <div class="container pt-0">
            <div id="root">
                <div id="alert_placeholder"></div>
                ${renderParticipantHeader(participant)}
                ${statusWarning}
                <div class="row mb-3">
                    <div class="col-12">
                        ${renderBackToSearchDivAndButton()}
                    </div>
                </div>
                ${renderParticipantTabs(participant, activeTabId)}
                ${renderShowMoreDataModal()}
            </div>
        </div>
    `;
};

/**
 * Load the content for the details tab
 * @param {object} participant - The participant object
 * @param {object} changedOption - Any changed field values
 * @returns {Promise<void>}
 */
const loadDetailsTabContent = async (participant, changedOption = {}) => {
    const contentContainer = document.getElementById('details-tab-content-inner');
    if (!contentContainer) {
        console.error('Details tab content container not found');
        return;
    }

    contentContainer.innerHTML = renderDetailsTabContentOnly(participant, changedOption);

    // Initialize event listeners for the details form
    changeParticipantDetail(participant, changedOption);
    resetChanges(participant);
    viewParticipantSummary(participant);
    attachUpdateLoginMethodListeners(participant[fieldMapping.accountEmail], participant[fieldMapping.accountPhone]);
    submitClickHandler(participant, changedOption);
};

/**
 * Render just the details form content (for use within the tab)
 * @param {object} participant - The participant object
 * @param {object} changedOption - Any changed field values
 * @returns {string} HTML string for details form
 */
export const renderDetailsTabContentOnly = (participant, changedOption = {}) => {
    const isParticipantDuplicate = participant[fieldMapping.verifiedFlag] === fieldMapping.duplicate;
    const isParticipantCannotBeVerified = participant[fieldMapping.verifiedFlag] === fieldMapping.cannotBeVerified;
    const isParticipantDataDestroyed = participant[fieldMapping.dataDestroyCategorical] === fieldMapping.requestedDataDestroySigned;

    let template = `
        ${renderCancelChangesAndSaveChangesButtons('Upper')}
        ${renderDetailsTableHeader()}
    `;

    const importantRows = getImportantRows(participant, changedOption);
    const filteredImportantRows = importantRows.filter(row => row.display === true);
    filteredImportantRows.forEach(row => {
        
        const conceptId = row.field;
        const participantConsented = participant[fieldMapping.consentFlag] === fieldMapping.yes;
        const hideLoginInformation = (conceptId === 'Change Login Phone' || conceptId === 'Change Login Email') && !participantConsented;
        const shouldHideButton = !row.editable || hideLoginInformation;
        const disableButton = hideLoginInformation || !row.editable;
        const variableLabel = row.label;
        const variableValue = Object.prototype.hasOwnProperty.call(changedOption, conceptId) ? changedOption[conceptId] : participant[conceptId];
        const valueToRender = hideLoginInformation ? 'N/A' : getFieldValues(variableValue, conceptId);
        const fieldHasChanges = Object.prototype.hasOwnProperty.call(changedOption, conceptId);
        let rowBackgroundColor = row.isHeading ? '#f5f5f5' : null;
        if (fieldHasChanges) rowBackgroundColor = '#FFFACA';

        const buttonToRender = (row.isHeading || shouldHideButton) ? '' : getButtonToRender(variableLabel, conceptId, disableButton, isParticipantDataDestroyed, isParticipantDuplicate, isParticipantCannotBeVerified);
        const saveChangesMessage = fieldHasChanges ? `<br><br><i>Please save changes<br>before exiting the page</i>` : '';

        template += `
            <tr class="detailedRow" style="text-align: left; background-color: ${rowBackgroundColor}" id="${conceptId}row">
                <th scope="row">
                    <div class="mb-3">
                        <label class="form-label">
                            ${variableLabel}
                        </label>
                    </div>
                </th>
                <td style="text-align: left;" id="${conceptId}value">
                    ${valueToRender}
                    <br>
                    <br>
                    <div id="${conceptId}note" style="display:none"></div>
                </td> 
                <td style="text-align: left;">
                    ${buttonToRender}
                    ${saveChangesMessage}
                </td>
            </tr>
        `
    });
    template += `
                </tbody>
            </table>
            ${renderCancelChangesAndSaveChangesButtons('Lower')}
    `;
    return template;
};

const changeParticipantDetail = (participant, changedOption) => {
    const detailedRow = Array.from(document.getElementsByClassName('detailedRow'));
    if (detailedRow) {
        // Rm existing listeners
        document.querySelectorAll('.showMore').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });

        // New listeners for buttons
        detailedRow.forEach(element => {
            const editButton = element.querySelector('.showMore');
                if (editButton) {
                    // Skip login buttons, they have their own handlers
                    if (editButton.id === 'updateUserLoginEmail' || editButton.id === 'updateUserLoginPhone') {
                        return;
                    }

                    editButton.addEventListener('click', function (e) {
                        const data = getDataAttributes(this);
                        // Wait for Bootstrap modal to open
                        requestAnimationFrame(() => {
                            const editModal = document.getElementById('modalShowMoreData');
                            const editModalHeader = editModal?.querySelector('#modalHeader');
                            const editModalBody = editModal?.querySelector('#modalBody');
                            const conceptId = data.participantconceptid;
                            const participantKey = data.participantkey;
                            const editModalLabel = getModalLabel(participantKey);
                            const participantValue = data.participantvalue;

                        if (editModalHeader && editModalBody) {
                            editModalHeader.innerHTML = `
                                <h5>Edit ${editModalLabel}</h5>
                                <button type="button" class="modal-close-btn" id="closeModal" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>`;

                            editModalBody.innerHTML = `
                                <div>
                                    ${renderFormInModal(participant, changedOption, conceptId, participantKey, editModalLabel, participantValue)}
                                </div>`;
                            
                            const primaryBtn = document.getElementById('editModal');
                            primaryBtn && primaryBtn.focus();
                            
                            addFormInputFormattingListeners();
                            showSaveNoteInModal(conceptId);
                            saveResponses(participant, changedOption, element, conceptId);

                        } else {
                            triggerNotificationBanner('Error: Failed to open edit modal. Please refresh the page and try again.', 'error');
                        }
                    });
                });
            }
        });
    }
};

/**
 * Render the edit button for the participant details based on the variable
 * @param {string} variableLabel - the label of the variable
 * @param {string} conceptId - the conceptId of the variable 
 * @param {boolean} disableButton - whether the button should be disabled
 * @param {boolean} isParticipantDataDestroyed - whether participant data is destroyed
 * @param {boolean} isParticipantDuplicate - whether participant is duplicate
 * @param {boolean} isParticipantCannotBeVerified - whether participant cannot be verified
 * @returns {HTMLButtonElement} - template string with the button to render
 */
const getButtonToRender = (variableLabel, conceptId, disableButton, isParticipantDataDestroyed, isParticipantDuplicate, isParticipantCannotBeVerified) => {
    const loginButtonType = !isParticipantDataDestroyed && conceptId === 'Change Login Phone' ? 'Phone' : !isParticipantDataDestroyed && conceptId === 'Change Login Email' ? 'Email' : null;
    const participantKey = loginButtonType ? '' : `data-participantkey="${variableLabel}"`;
    const participantConceptId = loginButtonType ? '' : `data-participantconceptid="${conceptId}"`;
    const participantLoginUpdate = loginButtonType ? `data-participantLoginUpdate="${loginButtonType.toLowerCase()}"` : '';
    const buttonId = loginButtonType ? `updateUserLogin${loginButtonType}` : `${conceptId}button`;

    if (disableButton) {
        // Use the passed boolean values instead of re-checking
        let tooltipText = "Participant Consent Required";
        if (isParticipantDuplicate) {
            tooltipText = "Duplicate account - editing disabled";
        } else if (isParticipantCannotBeVerified) {
            tooltipText = "Cannot be verified - editing disabled";
        } else if (isParticipantDataDestroyed) {
            tooltipText = "Data destroyed - editing disabled";
        }
        
        return `
            <button type="button" class="btn btn-secondary btn-custom" disabled title="${tooltipText}">
                Edit
            </button>
        `;
    }

    return `
        <a class="showMore" 
            data-toggle="modal" 
            data-target="#modalShowMoreData"
            name="modalParticipantData"
            id="${buttonId}"
            ${participantKey}
            ${participantConceptId} 
            ${participantLoginUpdate}>
            <button type="button" class="btn btn-primary btn-custom">Edit</button>
        </a>
    `;
};

const renderBackToSearchDivAndButton = () => {
    return `
        <div class="float-left">
            <button type="button" class="btn btn-primary me-2" id="backToSearchResultsBtn">Back to Search Results</button>
            <button type="button" class="btn btn-secondary" id="backToParticipantLookupBtn">Participant Lookup</button>
        </div>
    `;
};

const renderDetailsTableHeader = () => {
    return `
        <table class="table detailsTable"> <h4 style="text-align: center;">Participant Details</h4>
            <thead style="position: sticky;" class="thead-dark"> 
                <tr>
                    <th style="text-align: left;" scope="col">Field</th>
                    <th style="text-align: left;" scope="col">Value</th>
                    <th style="text-align: left;" scope="col"></th>
                </tr>
            </thead>
        <tbody class="participantDetailTable">
    `;
};

const renderFormInModal = (participant, changedOption, conceptId, participantKey, modalLabel, participantValue) => {
    const textFieldTypes = new Set(['name', 'email', 'address', 'city', 'year', 'zip']);
    const textFieldMappingsArray = getImportantRows(participant, changedOption)
        .filter(row => row.editable && textFieldTypes.has(row.validationType))
        .map(row => row.field);

    const phoneFieldMappingsArray = getImportantRows(participant, changedOption)
        .filter(row => row.editable && row.validationType == 'phoneNumber')
        .map(row => row.field);

    const permissionSelector = getImportantRows(participant, changedOption)
        .filter(row => row.editable && (row.validationType == 'permissionSelector'))
        .map(row => row.field);

    //Check to see if the address is international when rendering state or postal codes
    //because they go from restricted inputs to general text
    let internationalAddressConceptId;
    if (conceptId == fieldMapping.state || conceptId == fieldMapping.zip) {
        internationalAddressConceptId = fieldMapping.isIntlAddr;
    } else if (conceptId == fieldMapping.physicalState || conceptId == fieldMapping.physicalZip) {
        internationalAddressConceptId = fieldMapping.physicalAddrIntl;
    } else if (conceptId == fieldMapping.altState || conceptId == fieldMapping.altZip) {
        internationalAddressConceptId = fieldMapping.isIntlAltAddress;
    }
    const isInternational = isAddressInternational(participant, changedOption, internationalAddressConceptId);

    const renderPermissionSelector = permissionSelector.includes(parseInt(conceptId));
    const renderPhone = phoneFieldMappingsArray.includes(parseInt(conceptId));
    const renderText = textFieldMappingsArray.includes(parseInt(conceptId)) || isInternational;
    const renderDay = conceptId == fieldMapping.birthDay;
    const renderMonth = conceptId == fieldMapping.birthMonth;
    const renderState = !isInternational && [fieldMapping.state, fieldMapping.physicalState, fieldMapping.altState].some(id => id == conceptId);
    const renderCountry = [fieldMapping.country, fieldMapping.physicalCountry, fieldMapping.altCountry].some(id => id == conceptId);
    const renderSuffix = conceptId == fieldMapping.suffix;
    const renderLanguage = conceptId == fieldMapping.preferredLanguage;
    const elementId = `fieldModified${conceptId}`;

   

    return `
        <form id="formResponse" method="post">
            <span id="${elementId}" data-fieldconceptid="${conceptId}" data-fieldModified="${escapeHTML(participantKey || '')}">
                ${modalLabel}:
            </span>
            ${renderDay ? renderDaySelector(participantValue, conceptId) : ''}
            ${renderMonth ? renderMonthSelector(participantValue, conceptId) : ''}
            ${renderPermissionSelector ? renderTextVoicemailPermissionSelector(participantValue, conceptId) : ''}
            ${renderState ? renderStateSelector(participantValue, conceptId) : ''}
            ${renderCountry ? renderCountrySelector(participantValue, conceptId) : ''}
            ${renderSuffix ? renderSuffixSelector(participantValue, conceptId) : ''}
            ${renderText ? renderTextInputBox(participantValue, conceptId, isInternational) : ''}
            ${renderPhone ? renderPhoneInputBox(participantValue, conceptId) : ''}
            ${renderLanguage ? renderLanguageSelector(participant, participantValue, conceptId) : ''}
            <br/>
            <span id="showError"></span>
            <span style="font-size: 12px;" id="showNote"><i></i></span>
            <br/>
            <div style="display:inline-block;">
                <button type="button" class="btn btn-danger me-2" data-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary" id="editModal" data-toggle="modal">Submit</button>
            </div>
        </form>
    `;
};

const renderCancelChangesAndSaveChangesButtons = (position) => {
    return `
        <div class="float-right" style="display:inline-block;">
            <button type="button" id="cancelChanges${position}" class="btn btn-danger me-2">Cancel Changes</button>
            <button type="submit" id="updateMemberData" class="updateMemberData btn btn-primary">Save Changes</button>
        </div>
        </br>
        </br>
    `;
};

const renderDaySelector = (participantValue, conceptId) => {
    let options = '';
    for(let i = 1; i <= 31; i++){
        options += `<option class="option-dark-mode" value="${i.toString().padStart(2, '0')}">${i.toString().padStart(2, '0')}</option>`
    }
    return `
        <select name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue="${escapeHTML((participantValue ?? '').toString())}">
            ${options}
        </select>
    `;
};

const renderMonthSelector = (participantValue, conceptId) => {
    let options = '';
    for(let i = 1; i <= 12; i++){
        options += `<option class="option-dark-mode" value="${i.toString().padStart(2, '0')}">${i.toString().padStart(2, '0')}</option>`
    }
    return `
        <select name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue="${escapeHTML((participantValue ?? '').toString())}">
            ${options}
        </select>
    `;
};

const renderTextVoicemailPermissionSelector = (participantValue, conceptId) => {
    return `
        <select name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue="${escapeHTML((participantValue ?? '').toString())}">
            <option class="option-dark-mode" value="${fieldMapping.no}">No</option>
            <option class="option-dark-mode" value="${fieldMapping.yes}">Yes</option>
        </select>
    `;
};

const renderStateSelector = (participantValue, conceptId) => {
    let options = '';
    for(const state in allStates){
        options += `<option class="option-dark-mode" value="${state}">${state}</option>`
    }
    return `
        <select name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue="${escapeHTML((participantValue ?? '').toString())}">
            ${options}
        </select>
    `;
};

const renderCountrySelector = (participantValue, conceptId) => {
    let options = '';
    let countryCodes = getCountryCode3List();
    for(const index in countryCodes){
        if (countryCodes[index] !== 'usa') {
            options += `<option class="option-dark-mode" value="${countryCodes[index]}">${getCountryNameByCode3(countryCodes[index])}</option>`
        }
    }
    return `
        <select name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue="${escapeHTML((participantValue ?? '').toString())}">
            <option class="option-dark-mode" value="">None</option>
            ${options}
        </select>
    `;
};

const renderTextInputBox = (participantValue, conceptId, forceAllChars) => {
    return `
        <input type="text" name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue="${escapeHTML((participantValue ?? '').toString())}" data-force-all-chars=${forceAllChars ? 'true': 'false'}>
    `;
};

const renderPhoneInputBox = (participantValue, conceptId) => {
    const isMainPhoneField = primaryPhoneTypes.includes(parseInt(conceptId)) && parseInt(conceptId) !== fieldMapping.accountPhone // auth/account phone is in a separate section
    const mainPhoneFieldNote = isMainPhoneField ? " Note: At least one phone number is required." : "";

    return `
        <input type="tel" name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue="${escapeHTML((participantValue ?? '').toString())}" placeholder="(999) 999-9999" maxlength="14" class="phone-input">
        <br>
        <small>Format: (999) 999-9999 <br>Leave empty to remove.${mainPhoneFieldNote}</small><br>
    `;
};

const renderSuffixSelector = (participantValue, conceptId) => {
    const listIndex = suffixList[participantValue];
    return `
        <select style="max-width:200px; margin-left:0px;" name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue=${participantValue}>
            <option value="${fieldMapping.noneOfTheseApply}">-- Select --</option>
            <option value="${fieldMapping.jr}" ${listIndex === 0 ? 'selected' : ''}>Jr.</option>
            <option value="${fieldMapping.sr}" ${listIndex === 1 ? 'selected' : ''}>Sr.</option>
            <option value="${fieldMapping.one}" ${listIndex === 2 ? 'selected' : ''}>I, 1st</option>
            <option value="${fieldMapping.two}" ${listIndex === 3 || listIndex === 10 ? 'selected' : ''}>II, 2nd</option>
            <option value="${fieldMapping.three}" ${listIndex === 4 || listIndex === 11 ? 'selected' : ''}>III, 3rd</option>
            <option value="${fieldMapping.four}" ${listIndex === 5 ? 'selected' : ''}>IV, 4th</option>
            <option value="${fieldMapping.five}" ${listIndex === 6 ? 'selected' : ''}>V, 5th</option>
            <option value="${fieldMapping.six}" ${listIndex === 7 ? 'selected' : ''}>VI, 6th</option>
            <option value="${fieldMapping.seven}" ${listIndex === 8 ? 'selected' : ''}>VII, 7th</option>
            <option value="${fieldMapping.eight}" ${listIndex === 9 ? 'selected' : ''}>VIII, 8th</option>
        </select>
        `
};

const renderLanguageSelector = (participant, participantValue, conceptId) => {
    return `
        <select style="max-width:200px; margin-left:0px;" name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue=${participantValue}>
            <option value="${fieldMapping.language.en}" ${participant[fieldMapping.preferredLanguage] ? (languageList[participant[fieldMapping.preferredLanguage]] == 0 ? 'selected':'') : ''}>English</option>
            <option value="${fieldMapping.language.es}" ${participant[fieldMapping.preferredLanguage] ? (languageList[participant[fieldMapping.preferredLanguage]] == 1 ? 'selected':'') : ''}>Spanish</option>
        </select>
        `
};

/**
 * Add event listeners for search navigation buttons
 */
const addSearchNavigationListeners = () => {
    const backToSearchResultsBtn = document.getElementById('backToSearchResultsBtn');
    const backToParticipantLookupBtn = document.getElementById('backToParticipantLookupBtn');

    if (backToSearchResultsBtn) {
        backToSearchResultsBtn.addEventListener('click', handleBackToSearchResults);
    }

    if (backToParticipantLookupBtn) {
        backToParticipantLookupBtn.addEventListener('click', () => {
            setParticipantLookupNavRequest(true);
            location.hash = '#participantLookup';
        });
    }
};

/**
 * Handle "Back to Search Results" button click: delegated to the shared nav helper.
 */
const handleBackToSearchResults = async () => {
    try {
        clearUnsaved();
        participantState.clearParticipant();
        await navigateBackToSearchResults();
    } catch (error) {
        console.error('Error navigating back to search results:', error);
        location.hash = '#participantLookup';
    }
};
