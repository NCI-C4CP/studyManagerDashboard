import fieldMapping from './fieldToConceptIdMapping.js';
import { dashboardNavBarLinks, removeActiveClass } from './navigationBar.js';
import { showAnimation, hideAnimation, baseAPI, getIdToken, getDataAttributes, triggerNotificationBanner } from './utils.js';
import { renderParticipantHeader } from './participantHeader.js';
import { keyToVerificationStatus, keyToDuplicateType, recruitmentType, updateRecruitmentType } from './idsToName.js';
import { appState } from './stateManager.js';
import { findParticipant } from './participantLookup.js';


export const renderDataCorrectionsToolPage = (participant) => {
    if (participant !== undefined) {
        const isParent = localStorage.getItem('isParent')
        document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks(isParent);
        removeActiveClass('nav-link', 'active');
        document.getElementById('participantVerificationBtn').classList.add('active');
        mainContent.innerHTML = renderVerificationTool(participant);
        let selectedResponse = {};
        dropdownTrigger('dropdownVerification', 'dropdownMenuButtonVerificationOptns', selectedResponse);
        dropdownTrigger('dropdownDuplicateType', 'dropdownMenuButtonDuplicateTypeOptns',selectedResponse);
        dropdownTrigger('dropdownUpdateRecruitType', 'dropdownMenuButtonUpdateRecruitTypeOptns', selectedResponse);
        viewOptionsSelected(participant);
        resetChanges(participant);
    }
}

export const renderVerificationTool = (participant) => {
    let template = ``;
    template = `        
                <div id="root root-margin">
                    <div class="col-lg">
                    ${renderParticipantHeader(participant)}
                    <div id="alert_placeholder"></div>
                        <div class="row form-row">
                            <div>                    
                                <h4><b>Data Corrections Tool</b></h4>
                                <span style="position:relative; font-size: 15px; top:2px;"><b>Note: This tool should only be used to make corrections to participant data post-verification. 
                                All changes need to be approved by the CCC before being applied to the participant record via this tool.</b></span>
                                <div style="position:relative; left:20px; top:2px;">
                                    <br />
                                    <h6><b>Verification Status</b></h6>
                                    <p>- Current Verification Status: <b>${keyToVerificationStatus[participant[fieldMapping.verifiedFlag]]}</b></p>
                                    <div class="dropdown dropright" id="verificationDropdownLookup1">
                                        - Update Verification Type:
                                        <button class="btn btn-info dropdown-toggle" type="button" id="dropdownVerification" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" 
                                        ${participant[fieldMapping.verifiedFlag] === fieldMapping.notYetVerified ? `disabled` : ``}> Select</button>
                                        <ul class="dropdown-menu" id="dropdownMenuButtonVerificationOptns" aria-labelledby="dropdownMenuButton1">
                                            <li><a class="dropdown-item" data-cid='select' id="slct">Select</a></li>
                                            <li><a class="dropdown-item" data-cid=${fieldMapping.verified} id="vrfd">Verified</a></li>
                                            <li><a class="dropdown-item" data-cid=${fieldMapping.outreachTimedout} id="outRchTime">Outreach timed out</a></li>
                                            ${participant[fieldMapping.verifiedFlag] !== fieldMapping.verified ? 
                                                `<li><a class="dropdown-item" data-cid=${fieldMapping.cannotBeVerified} id="cantVrfd">Cannot be verified</a></li>` : ``}
                                            <li><a class="dropdown-item" data-cid=${fieldMapping.duplicate} id="dup">Duplicate</a></li>
                                        </ul>
                                    </div>
                                    <h6><b>Duplicate Type</b></h6>
                                    <span style="font-size: 12px;"><b>Note: Duplicate type variable should only be updated with prior approval from CCC.</b></span>
                                    <p>- Current Duplicate Type: <b>${keyToDuplicateType[participant['state'][fieldMapping.duplicateType]] || ``}</b></p>
                                    <div class="dropdown dropright" id="duplicateTypeDropdownLookup">
                                        - Update Duplicate Type:
                                        <button class="btn btn-info dropdown-toggle" type="button" id="dropdownDuplicateType" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" 
                                            ${participant[fieldMapping.verifiedFlag] !== fieldMapping.duplicate ? `disabled`: ``}>Select</button>
                                        <ul class="dropdown-menu" id="dropdownMenuButtonDuplicateTypeOptns" aria-labelledby="dropdownMenuButton2">
                                            <li><a class="dropdown-item" data-cid='select' id="slct">Select</a></li>
                                            ${participant['state'][fieldMapping.duplicateType] ? `<li><a class="dropdown-item" data-cid="NULL" id="null">NULL</a></li>` : ``}
                                            <li><a class="dropdown-item" data-cid=${fieldMapping.activeSignedAsPassive} id="activSgndPssve">Active recruit signed in as Passive recruit</a></li>
                                            <li><a class="dropdown-item" data-cid=${fieldMapping.passiveSignedAsActive} id="pssveSgndActiv">Passive recruit signed in as Active recruit</a></li>
                                            <li><a class="dropdown-item" data-cid=${fieldMapping.notActiveSignedAsPassive} id="notActivSgndPssve">Not Active recruit signed in as Passive recruit</a></li>
                                            <li><a class="dropdown-item" data-cid=${fieldMapping.notActiveSignedAsActive} id="notActivSgndActiv">Not Active recruit signed in as an Active recruit</a></li>
                                            <li><a class="dropdown-item" data-cid=${fieldMapping.alreadyEnrolled} id="alrEnrlld">Participant already enrolled</a></li>
                                        </ul>
                                    </div>
                                    <h6><b>Recruit Type</b></h6>
                                    <span style="font-size: 12px;"><b>Note: Recruit Type and Update Recruit Type should only be updated with prior approval from CCC.</b></span>
                                    <p>- Current Recruit Type: <b>${recruitmentType[participant[fieldMapping.recruitmentType]]}</b></p>
                                    <p>- Current Update Recruit Type Response: <b>${updateRecruitmentType[participant['state'][fieldMapping.updateRecruitType]] || ``}</b></p>
                                    <div class="dropdown dropright" id="updateRecruitTypeDropdownLookup">
                                    - Update Recruit Type:
                                    <button class="btn btn-info dropdown-toggle" type="button" id="dropdownUpdateRecruitType" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"
                                        ${participant[fieldMapping.verifiedFlag] === fieldMapping.notYetVerified ? `disabled` : ``}>Select</button>
                                        <ul class="dropdown-menu" id="dropdownMenuButtonUpdateRecruitTypeOptns" aria-labelledby="dropdownMenuButton3">
                                            <li><a class="dropdown-item" data-cid='select' id="slct">Select</a></li>
                                            <li><a class="dropdown-item" data-cid=${fieldMapping.noChangeNeeded} id="noChnge">No change needed</a></li>
                                        ${
                                            participant[fieldMapping.recruitmentType] === fieldMapping.active ? `
                                                <li><a class="dropdown-item" data-cid=${fieldMapping.notActiveToPassive} id="noActToPassv">Not Active to Passive</a></li>
                                                <li><a class="dropdown-item" data-cid=${fieldMapping.activeToPassive} id="actToPassv">Active to Passive</a></li>`
                                            : 
                                            participant[fieldMapping.recruitmentType] === fieldMapping.passive ? `
                                                <li><a class="dropdown-item" data-cid=${fieldMapping.passiveToActive} id="passvToActiv">Passive to Active</a></li>`
                                            : ``
                                        }
                                        </ul>
                                </div>
                                </div>
                                <div style="display:inline-block; margin-top:20px;">
                                    <button type="button" class="btn btn-danger" id="cancelChanges">Cancel</button>
                                    <button type="button" data-toggle="modal" data-target="#modalShowSelectedData"
                                        class="btn btn-primary next-btn" id="submitCorrection">Submit</button>
                                </div>
                                </div>
                        </div>
                    </div>
                               
                </div>`
           
        template += ` <div class="modal fade" id="modalShowSelectedData" data-keyboard="false" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div class="modal-content sub-div-shadow">
                <div class="modal-header" id="modalHeader"></div>
                <div class="modal-body" id="modalBody"></div>
            </div>
        </div>
    </div>`
    return template;
}

const dropdownTrigger = (buttonId, menuId, response) => {
    let keyName = 'Select'
    let dropdownTriggerBtn = document.getElementById(buttonId);
    let dropdownMenuButton = document.getElementById(menuId);
    if (dropdownTriggerBtn && dropdownMenuButton) {
        let tempKeyName = dropdownTriggerBtn.innerHTML = keyName;
        dropdownMenuButton.addEventListener('click', (e) => {
            if (keyName === 'Select' || keyName === tempKeyName) {
                dropdownTriggerBtn.innerHTML = e.target.textContent;
                const selectedOption = getDataAttributes(e.target);
                if (buttonId === 'dropdownVerification') {
                    disableDuplicateTypeBtn(selectedOption);
                    response[fieldMapping.verifiedFlag] = selectedOption.cid === 'select' ? selectedOption.cid : parseInt(selectedOption.cid)
                }
                if (buttonId === 'dropdownDuplicateType') {
                    response[`state.${fieldMapping.duplicateType}`] = selectedOption.cid === 'NULL' || selectedOption.cid === 'select' ? selectedOption.cid : parseInt(selectedOption.cid)
                }
                if (buttonId === 'dropdownUpdateRecruitType') {
                    response[`state.${fieldMapping.updateRecruitType}`] = selectedOption.cid === 'select' ? selectedOption.cid : parseInt(selectedOption.cid)
                }
            }
            appState.setState({'correctedOptions': response})
        });
    }
};

const disableDuplicateTypeBtn = (selectedOption) => {
    const dropdownDuplicateTypeBtn = document.getElementById('dropdownDuplicateType');
    dropdownDuplicateTypeBtn.disabled = selectedOption.cid !== fieldMapping.duplicate.toString();
}

export const viewOptionsSelected = (participant) => {
    const submitCorrectionEle = document.getElementById('submitCorrection');
    if (submitCorrectionEle) {
        submitCorrectionEle.addEventListener('click', () => { 
            optionsHandler(participant);
        })
    }
}

const optionsHandler = (participant) => {
    const header = document.getElementById('modalHeader');
    const body = document.getElementById('modalBody');
    header.innerHTML = `<h5>Options Selected</h5><button type="button" id="closeModal" class="modal-close-btn" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>`
    const selectedOptions = appState.getState().correctedOptions;
    cleanUpSelectedOptions(selectedOptions);
    body.innerHTML = `
        <div style="display:inline-block;">
        ${
            ((selectedOptions === undefined || selectedOptions === null || Object.keys(selectedOptions).length === 0)) ? 
            `<span><b>No corrections selected</b></span> <br />
            <button type="button" class="btn btn-primary" disabled>Confirm</button>`
            :
            ((!checkIncorrectSelections(participant, selectedOptions))) ?
                `<span><b>Invalid operation</b></span> <br />
                <button type="button" class="btn btn-primary" disabled>Confirm</button>`
            :
            `${renderSelectedOptions(selectedOptions)}
                <button type="button" class="btn btn-primary" data-dismiss="modal" target="_blank" id="confirmCorrection">Confirm</button>`
        }
            <button type="button" class="btn btn-danger" data-dismiss="modal" target="_blank">Cancel</button>
        </div>
    </div>`
    finalizeCorrections(participant, selectedOptions);
}

const checkIncorrectSelections = (participant, selectedOptions) => {
    if (selectedOptions[fieldMapping.verifiedFlag] && selectedOptions[fieldMapping.verifiedFlag] === participant[fieldMapping.verifiedFlag]) {
        triggerNotificationBanner(`Verficiation status already set to <b>${keyToVerificationStatus[selectedOptions[fieldMapping.verifiedFlag]]}</b>`, 'warning')
        return false;
    }
    if (selectedOptions[`state.${fieldMapping.duplicateType}`] && selectedOptions[`state.${fieldMapping.duplicateType}`] === participant[`state.${fieldMapping.duplicateType}`]) {
        triggerNotificationBanner(`Duplicate Type already set to <b>${keyToDuplicateType[selectedOptions[`state.${fieldMapping.duplicateType}`]]}</b>`, 'warning')
        return false;
    }
    if (selectedOptions[`state.${fieldMapping.updateRecruitType}`] && selectedOptions[`state.${fieldMapping.updateRecruitType}`] === participant[`state.${fieldMapping.updateRecruitType}`]) {
        triggerNotificationBanner(`Update Recruit Type already set to <b>${updateRecruitmentType[selectedOptions[`state.${fieldMapping.updateRecruitType}`]]}</b>`, 'warning')
        return false;
    }
    else return true
}

const renderSelectedOptions = (selectedOptions) => {
    let template = ``
    if (selectedOptions[fieldMapping.verifiedFlag]) {
        template += `- Update Verification Type : ${keyToVerificationStatus[selectedOptions[fieldMapping.verifiedFlag]]} <br />`
    }
    if (selectedOptions[`state.${fieldMapping.duplicateType}`]) {
        template += `- Update Duplicate Type : ${keyToDuplicateType[selectedOptions[`state.${fieldMapping.duplicateType}`]] || selectedOptions[`state.${fieldMapping.duplicateType}`]} <br />`
    }
    if (selectedOptions[`state.${fieldMapping.updateRecruitType}`]) {
        template += `- Update Recruit Type : ${updateRecruitmentType[selectedOptions[`state.${fieldMapping.updateRecruitType}`]]} <br />`
    }
    return template
}

const finalizeCorrections = (participant, selectedOptions) => {
    const confirmBtn = document.getElementById('confirmCorrection');
    const updateRecruitTypeOptn = selectedOptions && selectedOptions[`state.${fieldMapping.updateRecruitType}`]
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => { 
            if (participant[fieldMapping.verifiedFlag] === fieldMapping.duplicate && `state.${fieldMapping.duplicateType}` in selectedOptions === false) {
                selectedOptions[`state.${fieldMapping.duplicateType}`] = `NULL`
            }
            if (updateRecruitTypeOptn === fieldMapping.passiveToActive) {
                selectedOptions[fieldMapping.recruitmentType] = fieldMapping.active
            }
            if (updateRecruitTypeOptn === fieldMapping.activeToPassive || updateRecruitTypeOptn === fieldMapping.notActiveToPassive) {
                selectedOptions[fieldMapping.recruitmentType] = fieldMapping.passive
            }
            selectedOptions['token'] = participant['token'];
            await clickHandler(selectedOptions)
        })
    }
}

// async-await function to make HTTP POST request
const clickHandler = async (selectedOptions) => {
    try {
        showAnimation();
        const idToken = await getIdToken();
        const payload = { "data": [selectedOptions] }
        const response = await fetch(`${baseAPI}/dashboard?api=participantDataCorrection`, {
            method:'POST',
            body: JSON.stringify(payload),
            headers:{
                Authorization:"Bearer " + idToken,
                "Content-Type": "application/json"
                }
            })
            hideAnimation();

            if (response.status === 200) {
                const query = `token=${selectedOptions.token}`;
                const reloadedParticipant = await findParticipant(query);
                reloadVerificationToolPage(reloadedParticipant.data[0], 'Correction(s) updated.', 'success');
                localStorage.setItem("participant", JSON.stringify(reloadedParticipant.data[0]));
            }
            else { 
                triggerNotificationBanner('Error: No corrections were made.', 'warning')
            }
        }
    catch (error) {
        console.error('An error occurred:', error);
        triggerNotificationBanner('Try again later.', 'danger');
        }
    }

const reloadVerificationToolPage = (participant, message, type) => {
    showAnimation();
    renderDataCorrectionsToolPage(participant);
    triggerNotificationBanner(message, type);
    hideAnimation();
}


 const cleanUpSelectedOptions = (selectedOptions) => {
    selectedOptions && Object.keys(selectedOptions).some( (key) => {
        if (selectedOptions[key] === "select") {
            delete selectedOptions[key]
        }
    });
}

const resetChanges = (participant) => {
    const cancelBtn = document.getElementById("cancelChanges");
    cancelBtn.addEventListener("click", () => {
        reloadVerificationToolPage(participant, 'Changes Cancelled', 'warning');
    })   
}