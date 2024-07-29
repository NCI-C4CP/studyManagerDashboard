import { dashboardNavBarLinks, removeActiveClass } from './navigationBar.js';
import { attachUpdateLoginMethodListeners, allStates, closeModal, getFieldValues, getImportantRows, getModalLabel, hideUneditableButtons, renderReturnSearchResults, resetChanges, saveResponses, showSaveNoteInModal, submitClickHandler, suffixList, languageList, viewParticipantSummary, } from './participantDetailsHelpers.js';
import fieldMapping from './fieldToConceptIdMapping.js'; 
import { renderParticipantHeader } from './participantHeader.js';
import { getDataAttributes } from './utils.js';
import { appState } from './stateManager.js';

appState.setState({unsavedChangesTrack:{saveFlag: false, counter: 0}});

window.addEventListener('beforeunload',  (e) => {
    if (appState.getState().unsavedChangesTrack.saveFlag === false && appState.getState().unsavedChangesTrack.counter > 0) { 
    // Cancel the event and show alert that the unsaved changes would be lost 
        e.preventDefault(); 
        e.returnValue = ''; 
    } 
})
// Prevents from scrolling to bottom or middle of the page
window.addEventListener('onload', (e) => {
    setTimeout(function() {
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    }, 15);
})

const initLoginMechanism = (participant) => {
    participant['Change Login Phone'] = participant[fieldMapping.accountPhone] ?? '';
    participant['Change Login Email'] = participant[fieldMapping.accountEmail] ?? ''; 
    appState.setState({loginMechanism:{phone: true, email: true}});
}

export const renderParticipantDetails = (participant, changedOption) => {
    initLoginMechanism(participant);
    const isParent = localStorage.getItem('isParent');
    document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks(isParent);
    removeActiveClass('nav-link', 'active');
    document.getElementById('participantDetailsBtn').classList.add('active');
    mainContent.innerHTML = render(participant, changedOption);
    let originalHTML =  mainContent.innerHTML;
    hideUneditableButtons(participant, changedOption);
    localStorage.setItem("participant", JSON.stringify(participant));
    changeParticipantDetail(participant,  changedOption, originalHTML);
    editAltContact(participant);
    viewParticipantSummary(participant);
    renderReturnSearchResults();
    attachUpdateLoginMethodListeners(participant[fieldMapping.accountEmail], participant[fieldMapping.accountPhone], participant.token, participant.state.uid);
    submitClickHandler(participant, changedOption);
}

export const render = (participant, changedOption) => {
    const importantRows = getImportantRows(participant, changedOption);

    let template = `<div class="container">`
    if (!participant) {
        template +=` 
            <div id="root">
                Please select a participant first!
            </div>
        </div>
        `
    } else {
        template += `
            <div id="root" > 
            <div id="alert_placeholder"></div>
            ${renderParticipantHeader(participant)}     
            ${renderBackToSearchDivAndButton()}
            ${renderCancelChangesAndSaveChangesButtons()}
            ${renderDetailsTableHeader()}
        `;

        const filteredImportantRows = importantRows.filter(row => row.display === true);
        filteredImportantRows.forEach(row => {
            const conceptId = row.field;
            const variableLabel = row.label;
            const variableValue = participant[conceptId];
            const valueToRender = getFieldValues(variableValue, conceptId);
            const loginEditMemoRowBackgroundColor = conceptId === 'Login Update Memo' ? '#f5f5f5' : null;
            const buttonToRender = getButtonToRender(variableLabel, conceptId, participant[fieldMapping.dataDestroyCategorical]);
            template += `
                <tr class="detailedRow" style="text-align: left; background-color: ${loginEditMemoRowBackgroundColor}" id="${conceptId}row">
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
                    </td>
                </tr>
            `
        });
        template += `
                    </tbody>
                </table>
                ${renderCancelChangesAndSaveChangesButtons()}
            </div>
        </div>
        `;
        template += `${renderShowMoreDataModal()}`
    }
    return template;
}

const changeParticipantDetail = (participant, changedOption, originalHTML) => {
    const detailedRow = Array.from(document.getElementsByClassName('detailedRow'));
    if (detailedRow) {
        detailedRow.forEach(element => {
            let editRow = element.getElementsByClassName('showMore')[0];
            const values = editRow;
            let data = getDataAttributes(values);
            editRow && editRow.addEventListener('click', () => {
                const header = document.getElementById('modalHeader');
                const body = document.getElementById('modalBody');
                const conceptId = data.participantconceptid;
                const participantKey = data.participantkey;
                const modalLabel = getModalLabel(participantKey);
                const participantValue = data.participantvalue;
                header.innerHTML = `
                    <h5>Edit ${modalLabel}</h5>
                    <button type="button" class="modal-close-btn" id="closeModal" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>`
                let template = `
                    <div>
                        ${renderFormInModal(participant, changedOption, conceptId, participantKey, modalLabel, participantValue)}
                    </div>`
                body.innerHTML = template;
                showSaveNoteInModal(conceptId);
                saveResponses(participant, changedOption, element, conceptId);
                resetChanges(participant, originalHTML);   
            });
        })
    }
}

/**
 * Render the edit button for the participant details based on the variable
 * @param {string} variableLabel - the label of the variable
 * @param {string} conceptId - the conceptId of the variable 
 * @returns {HTMLButtonElement} - template string with the button to render
 */
const getButtonToRender = (variableLabel, conceptId, participantIsDataDestroyed) => {
    const isParticipantDataDestroyed = participantIsDataDestroyed === fieldMapping.requestedDataDestroySigned;
    const loginButtonType = !isParticipantDataDestroyed && conceptId === 'Change Login Phone' ? 'Phone' : !isParticipantDataDestroyed && conceptId === 'Change Login Email' ? 'Email' : null;
    const participantKey = loginButtonType ? '' : `data-participantkey="${variableLabel}"`;
    const participantConceptId = loginButtonType ? '' : `data-participantconceptid="${conceptId}"`;
    const participantLoginUpdate = loginButtonType ? `data-participantLoginUpdate="${loginButtonType.toLowerCase()}"` : '';
    const buttonId = loginButtonType ? `updateUserLogin${loginButtonType}` : `${conceptId}button`;

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

// For alternate contact details. Would be updates once concept ids for alt details are ready
const editAltContact = (participant) => {
    const a = document.getElementById('altContact');
    if (a) {
        a.addEventListener('click',  () => {
        altContactHandler(participant);
        })
    }   
}

const altContactHandler = (participant) => {
    const header = document.getElementById('modalHeader');
    const body = document.getElementById('modalBody');
    header.innerHTML = `<h5>Alternate Contact Details</h5><button type="button" id="closeModal" class="modal-close-btn" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>`
    let template = '<div>'
    template += `
            <br />
            <span id='fieldName' data-fieldName='First Name'><strong>Name</strong></span> : <input type="text" name="newName" id="newName" data-currrentFName=${participant.Module1 && participant.Module1.ALTCONTACT1.ALTCONTACT1_FNAME} value=${participant.Module1 && participant.Module1.ALTCONTACT1.ALTCONTACT1_FNAME} />
            <br />
            <span id='fieldLName' data-fieldLName='Last Name'><strong>Last Name</strong></span> : <input type="text" name="newLName" id="newLName" data-currrentLName=${participant.Module1 && participant.Module1.ALTCONTACT1.ALTCONTACT1_LNAME} value=${participant.Module1 && participant.Module1.ALTCONTACT1.ALTCONTACT1_LNAME} />
            <br />
            <span id='fieldRelationship' data-fieldRelationship='relationship'><strong>Relationship</strong></span> : <input type="text" name="newRelationship" id="newRelationship" />
            <br />
            <span id='fieldHome' data-fieldHome='home'><strong>Home Number</strong></span> : <input type="text" name="newHome" id="newHome" data-currentHome=${participant.Module1 && participant.Module1.ALTCONTACT2.ALTCONTACT2_HOME} value=${participant.Module1 && participant.Module1.ALTCONTACT2.ALTCONTACT2_HOME} />
            <br />
            <span id='fieldMobile' data-fieldMobile='mobile'><strong>Mobile Number</strong></span> : <input type="text" name="newMobile" id="newMobile" data-currentMobile=${participant.Module1 && participant.Module1.ALTCONTACT2.ALTCONTACT2_MOBILE} value=${participant.Module1 && participant.Module1.ALTCONTACT2.ALTCONTACT2_MOBILE} />
            <br />
            <span id='fieldEmail' data-fieldEmail='email'><strong>Email</strong></span> : <input type="text" name="newEmail" id="newEmail" data-currentEmail=${participant.Module1 && participant.Module1.ALTCONTACT2.ALTCONTACT2_EMAIL} value="${participant.Module1 && participant.Module1.ALTCONTACT2.ALTCONTACT2_EMAIL}" />
            <br />

            <div style="display:inline-block;">
                <button type="submit" class="btn btn-danger" data-dismiss="modal" target="_blank">Cancel</button>
                <button type="button" class="btn btn-primary" id="altDetailsSubmit">Submit</button>
            </div>
        </div>`
    body.innerHTML = template;
    saveAltResponse( participant);
    viewParticipantSummary(participant)
}

const saveAltResponse = (participant) => {
    const a = document.getElementById('altDetailsSubmit')
    a.addEventListener('click', (e) => {
        e.preventDefault()
        let changedModuleOption = {};
        let altNewName = document.getElementById('newName').value;
        let altCurrentName = getDataAttributes(document.getElementById('newName'));
        changedModuleOption['Name'] = altNewName;

        let altNewLName = document.getElementById('newLName').value;
        let altCurrentLName = getDataAttributes(document.getElementById('newLName'));
        changedModuleOption['Last Name'] = altNewLName;

        let newRelationship = document.getElementById('newRelationship').value;
        changedModuleOption['Relationship'] = newRelationship;


        let altCurrentHome = getDataAttributes(document.getElementById('newHome'));
        let newHome = document.getElementById('newHome').value;
        changedModuleOption['Home'] = newHome;

        let altCurrentMobile = getDataAttributes(document.getElementById('newMobile'));
        let newMobile = document.getElementById('newMobile').value;
        changedModuleOption['Mobile'] = newMobile;

        let newEmail = document.getElementById('newEmail').value;
        let altCurrentEmail = getDataAttributes(document.getElementById('newEmail'));
        changedModuleOption['Email'] = newEmail;

        for (let key in changedModuleOption) {
            changedModuleOption[key] === '' ?
                delete changedModuleOption[key] : ''
        }
        
        closeModal();
      
        let editedElement;
        const a = Array.from(document.getElementsByClassName('detaileAltRow'))
        a.forEach(element =>
            editedElement = element
        )

        let updatedEditedValue = editedElement.querySelectorAll("td")[0];
        if (altNewName !== '' && altNewLName !== '') {
            updatedEditedValue.innerHTML = altNewName +" "+ altNewLName;
        }
        else if (altNewName !== '') {
            updatedEditedValue.innerHTML = altNewName +" "+ altCurrentLName.currrentlname;
        }
        else if (altNewLName !== '') {
            updatedEditedValue.innerHTML = altCurrentName.currrentfname +" "+ altNewLName;
        }

        updatedEditedValue = editedElement.querySelectorAll("td")[1];
        updatedEditedValue.innerHTML = newRelationship !== '' ? newRelationship : null

        updatedEditedValue = editedElement.querySelectorAll("td")[2];
        updatedEditedValue.innerHTML = newHome !== '' ? newHome : altCurrentHome.currenthome

        updatedEditedValue = editedElement.querySelectorAll("td")[3];
        updatedEditedValue.innerHTML = newMobile !== '' ? newMobile : altCurrentMobile.currentmobile

        updatedEditedValue = editedElement.querySelectorAll("td")[4];
        updatedEditedValue.innerHTML = newEmail !== '' ? newEmail : altCurrentEmail.currentemail
      
    })
}

const renderBackToSearchDivAndButton = () => {
    return `
        <div class="float-left">
            <button type="button" class="btn btn-primary" id="displaySearchResultsBtn">Back to Search</button>    
        </div>
        
    `;
};

const renderDetailsTableHeader = () => {
    return `
        <table class="table detailsTable"> <h4 style="text-align: center;"> Participant Details </h4>
            <thead style="position: sticky;" class="thead-dark"> 
                <tr>
                    <th style="text-align: left; scope="col">Field</th>
                    <th style="text-align: left; scope="col">Value</th>
                    <th style="text-align: left; scope="col"></th>
                </tr>
            </thead>
        <tbody class="participantDetailTable">
    `;
};

const renderFormInModal = (participant, changedOption, conceptId, participantKey, modalLabel, participantValue) => {
    const textFieldMappingsArray = getImportantRows(participant, changedOption)
        .filter(row => row.editable && (row.validationType == 'text' || row.validationType == 'email' || row.validationType == 'address' || row.validationType == 'year' || row.validationType == 'zip'))
        .map(row => row.field);

    const phoneFieldMappingsArray = getImportantRows(participant, changedOption)
        .filter(row => row.editable && row.validationType == 'phoneNumber')
        .map(row => row.field);

    const permissionSelector = getImportantRows(participant, changedOption)
        .filter(row => row.editable && (row.validationType == 'permissionSelector'))
        .map(row => row.field);

    const renderPermissionSelector = permissionSelector.includes(parseInt(conceptId));
    const renderPhone = phoneFieldMappingsArray.includes(parseInt(conceptId));
    const renderText = textFieldMappingsArray.includes(parseInt(conceptId));
    const renderDay = conceptId == fieldMapping.birthDay;
    const renderMonth = conceptId == fieldMapping.birthMonth;
    const renderState = conceptId == fieldMapping.state;
    const renderSuffix = conceptId == fieldMapping.suffix;
    const renderLanguage = conceptId == fieldMapping.preferredLanguage;
    const elementId = `fieldModified${conceptId}`;

    return `
        <form id="formResponse" method="post">
            <span id="${elementId}" data-fieldconceptid=${conceptId} data-fieldModified=${participantKey}>
                ${modalLabel}:
            </span>
            ${renderDay ? renderDaySelector(participantValue, conceptId) : ''}
            ${renderMonth ? renderMonthSelector(participantValue, conceptId) : ''}
            ${renderPermissionSelector ? renderTextVoicemailPermissionSelector(participantValue, conceptId) : ''}
            ${renderState ? renderStateSelector(participantValue, conceptId) : ''}
            ${renderSuffix ? renderSuffixSelector(participant, participantValue, conceptId) : ''}
            ${renderText ? renderTextInputBox(participantValue, conceptId) : ''}
            ${renderPhone ? renderPhoneInputBox(participantValue, conceptId) : ''}
            ${renderLanguage ? renderLanguageSelector(participant, participantValue, conceptId) : ''}
            <br/>
            <span id="showError"></span>
            <span style="font-size: 12px;" id="showNote"><i></i></span>
            <br/>
            <div style="display:inline-block;">
                <button type="submit" class="btn btn-danger" data-dismiss="modal" target="_blank">Cancel</button>
                &nbsp;
                <button type="submit" class="btn btn-primary" id="editModal" data-toggle="modal">Submit</button>
            </div>
        </form>
    `;
};

const renderShowMoreDataModal = () => {
    return `
        <div class="modal fade" id="modalShowMoreData" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div class="modal-content sub-div-shadow">
                    <div class="modal-header" id="modalHeader"></div>
                    <div class="modal-body" id="modalBody"></div>
                </div>
            </div>
        </div>
    `;
};

const renderCancelChangesAndSaveChangesButtons = () => {
    return `
        <div class="float-right" style="display:inline-block;">
            <button type="button" id="cancelChanges" class="btn btn-danger">Cancel Changes</button>
            &nbsp;
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
        <select name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue=${participantValue}>
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
        <select name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue=${participantValue}>
            ${options}
        </select>
    `;
};

const renderTextVoicemailPermissionSelector = (participantValue, conceptId) => {
    return `
        <select name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue=${participantValue}>
            <option class="option-dark-mode" value="${fieldMapping.no}">-- Select --</option>
            <option class="option-dark-mode" value="${fieldMapping.yes}">Yes</option>
            <option class="option-dark-mode" value="${fieldMapping.no}">No</option>
        </select>
    `;
};

const renderStateSelector = (participantValue, conceptId) => {
    let options = '';
    for(const state in allStates){
        options += `<option class="option-dark-mode" value="${state}">${state}</option>`
    }
    return `
        <select name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue=${participantValue}>
            ${options}
        </select>
    `;
};

const renderTextInputBox = (participantValue, conceptId) => {
    return `
        <input type="text" name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue=${participantValue}>
    `;
};

const renderPhoneInputBox = (participantValue, conceptId) => {
    return `
        <input type="tel" name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue=${participantValue} placeholder="999-999-9999" pattern="([0-9]{3}-?[0-9]{3}-?[0-9]{4})?">
        <br>
        <small>Requested Format (no parentheses): 123-456-7890</small><br>
    `;
};

const renderSuffixSelector = (participant, participantValue, conceptId) => {
    return `
        <select style="max-width:200px; margin-left:0px;" name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue=${participantValue}>
            <option value="${fieldMapping.noneOfTheseApply}">-- Select --</option>
            <option value="${fieldMapping.jr}" ${participant[fieldMapping.suffix] ? (suffixList[participant[fieldMapping.suffix]] == 0 ? 'selected':'') : ''}>Jr.</option>
            <option value="${fieldMapping.sr}" ${participant[fieldMapping.suffix] ? (suffixList[participant[fieldMapping.suffix]] == 1 ? 'selected':'') : ''}>Sr.</option>
            <option value="${fieldMapping.one}" ${participant[fieldMapping.suffix] ? (suffixList[participant[fieldMapping.suffix]] == 2 ? 'selected':'') : ''}>I, 1st</option>
            <option value="${fieldMapping.two}" ${participant[fieldMapping.suffix] ? (suffixList[participant[fieldMapping.suffix]] == 3 || suffixList[participant[fieldMapping.suffix]] == 10 ? 'selected':'') : ''}>II, 2nd</option>
            <option value="${fieldMapping.three}" ${participant[fieldMapping.suffix] ? (suffixList[participant[fieldMapping.suffix]] == 4 || suffixList[participant[fieldMapping.suffix]] == 11 ? 'selected':'') : ''}>III, 3rd</option>
            <option value="${fieldMapping.four}" ${participant[fieldMapping.suffix] ? (suffixList[participant[fieldMapping.suffix]] == 5 ? 'selected':'') : ''}>IV, 4th</option>
            <option value="${fieldMapping.five}" ${participant[fieldMapping.suffix] ? (suffixList[participant[fieldMapping.suffix]] == 6 ? 'selected':'') : ''}>V, 5th</option>
            <option value="${fieldMapping.six}" ${participant[fieldMapping.suffix] ? (suffixList[participant[fieldMapping.suffix]] == 7 ? 'selected':'') : ''}>VI, 6th</option>
            <option value="${fieldMapping.seven}" ${participant[fieldMapping.suffix] ? (suffixList[participant[fieldMapping.suffix]] == 8 ? 'selected':'') : ''}>VII, 7th</option>
            <option value="${fieldMapping.eight}" ${participant[fieldMapping.suffix] ? (suffixList[participant[fieldMapping.suffix]] == 9 ? 'selected':'') : ''}>VIII, 8th</option>
        </select>
        `
};

const renderLanguageSelector = (participant, participantValue, conceptId) => {
    return `
        <select style="max-width:200px; margin-left:0px;" name="newValue${conceptId}" id="newValue${conceptId}" data-currentValue=${participantValue}>
            <option value="">-- Select --</option>
            <option value="${fieldMapping.language.en}" ${participant[fieldMapping.preferredLanguage] ? (languageList[participant[fieldMapping.preferredLanguage]] == 0 ? 'selected':'') : ''}>English</option>
            <option value="${fieldMapping.language.es}" ${participant[fieldMapping.preferredLanguage] ? (languageList[participant[fieldMapping.preferredLanguage]] == 1 ? 'selected':'') : ''}>Spanish</option>
        </select>
        `
};
