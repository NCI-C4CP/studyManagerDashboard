// import fieldMapping from './fieldToConceptIdMapping.js';
import { dashboardNavBarLinks, removeActiveClass } from '../navigationBar.js';
// import { showAnimation, hideAnimation, baseAPI, getIdToken, getDataAttributes, triggerNotificationBanner } from './utils.js';
import { renderParticipantHeader } from '../participantHeader.js';
// import { keyToVerificationStatus, keyToDuplicateType, recruitmentType, updateRecruitmentType } from './idsToName.js';
// import { appState } from './stateManager.js';
// import { findParticipant } from './participantLookup.js';

// dataCorrectionsToolSelection
// incentiveEligibilityTool
// surveyResetTool
// verificationCorrrectionsTool
let selectedTool = null;
// const selectToolDropdownText = ['Select', console.log("🚀 ~ setupContinueNavigationHandler ~ selectButton:", selectButton), 'Survey Reset', 'Incentive Eligibility'];

// Render the data corrections tool selection page
export const renderDataCorrectionsSelectionToolPage = (participant) => {
    console.log("🚀 ~ renderDataCorrectionsToolPage ~ participant:", participant)
    if (participant !== undefined) {
        const isParent = localStorage.getItem('isParent')
        document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks(isParent);
        removeActiveClass('nav-link', 'active');
        document.getElementById('participantVerificationBtn').classList.add('active');
        mainContent.innerHTML = renderDataCorrectionsSelectionContent(participant);

        let selectedResponse = {};
        // dropdownTrigger('dropdownVerification', 'dropdownMenuButtonVerificationOptns', selectedResponse);
        // dropdownTrigger('dropdownDuplicateType', 'dropdownMenuButtonDuplicateTypeOptns',selectedResponse);
        // dropdownTrigger('dropdownUpdateRecruitType', 'dropdownMenuButtonUpdateRecruitTypeOptns', selectedResponse);
        // viewOptionsSelected(participant);
        // resetChanges(participant);

        setupContinueNavigationHandler();
        setupDropdownSelectionHandler();
    }
}



const renderDataCorrectionsSelectionContent = (participant) => {
    return `
        <div id="root root-margin">
            <div class="container-fluid">
                <div class="col-lg">
                    ${renderParticipantHeader(participant)}

                    <div id="alert_placeholder"></div>

                    <div class="row">
                        <div class="col">                    
                            <h4><b>Data Corrections Tool</b></h4>
                            <span style="position:relative; font-size: 15px; top:2px;">
                                <b>Note: This tool should only be used to make corrections to participant data post-verification. All changes need to be approved by the CCC before being applied to the participant record via this tool.</b>
                            </span>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col">
                            <p class="font-weight-bold" style="font-size:1.2rem;"> Please select the tool you would like to use: </p>
                            <div class="btn-group dropright">
                            <!-- Todo: Add dropdown color later -->
                                <button type="button" class="btn btn-secondary dropdown-toggle selectButton" data-toggle="dropdown" aria-expanded="false">
                                    Select
                                </button>
                                <div id="dropdownToolsMenu" class="dropdown-menu">
                                    <a class="dropdown-item">Select</a>
                                    <a class="dropdown-item" data-tool="verificationCorrections">Verification Corrections</a>
                                    <a class="dropdown-item" data-tool="surveyReset">Survey Reset</a>
                                    <a class="dropdown-item" data-tool="incentiveEligibility">Incentive Eligibility</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row mt-5">
                        <div class="col">
                            <button type="button" class="btn btn-primary continueButton disabled">Continue</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

const setupContinueNavigationHandler = () => {
    const continueBtn = document.querySelector('.continueButton');
    if (!continueBtn) return;

    const selectButton = document.querySelector('.selectButton');
    if (!selectButton) return;
    

    continueBtn.addEventListener('click', () => {
        // console.log("🚀 ~ setupContinueNavigationHandler ~ selectedTool:", selectedTool)
        const selectButton = document.querySelector('.selectButton');
        const selectedButtonType = selectButton.getAttribute('data-tool');
        if (!selectedButtonType) return;
        // console.log("🚀 ~ continueBtn.addEventListener ~ selectButtonText:", selectedButtonType, typeof selectedButtonType)
        // verificationCorrections
        if (selectedButtonType === 'verificationCorrections') {
            console.log('#verificationCorrrectionsTool')
            window.location.hash = '#verificationCorrrectionsTool';
        } else if (selectedButtonType === 'surveyReset') {
            console.log('#surveyResetTool')
            // window.location.hash = '#surveyResetTool
        } else  if (selectedButtonType === 'incentiveEligibility') {
            console.log('#incentiveEligibilityTool')
            // window.location.hash = '#incentiveEligibilityTool';
        }
    });
}

const setupDropdownSelectionHandler = () => { 
    // get dropdown menu options element
    const dropdownMenu = document.getElementById('dropdownToolsMenu');
    // console.log("🚀 ~ setupDropdownSelectionHandler ~ dropdownMenu:", dropdownMenu)
    if (!dropdownMenu) return;

    // get dropdown options
    const dropdownOptions = dropdownMenu.querySelectorAll('.dropdown-item');
    // console.log("🚀 ~ setupDropdownSelectionHandler ~ dropdownOptions:", dropdownOptions)
    if (!dropdownOptions) return;

    // get select button element
    const selectButton = document.querySelector('.selectButton');
    // console.log("🚀 ~ setupDropdownSelectionHandler ~ selectButton:", selectButton)
    if (!selectButton) return;

    // enable continue button
    const continueButton = document.querySelector('.continueButton');
    if (!continueButton) return;

    // add logic to handle user selection, update null value to selected value and enable continue button
    // loop through dropdown options and add event listener to each option
    for (let option of dropdownOptions) {
        option.addEventListener('click', (e) => {
            // console.log("event dropdown selected", e.target);
            const selectedText = e.target.textContent.trim();
            selectButton.textContent = selectedText;
            // selectedTool = selectedText;

            console.log(e.target.getAttribute('data-tool'))
            const selectedToolType = e.target.getAttribute('data-tool');

            // console.log("🚀 ~ option.addEventListener ~ selectedTool:", selectedTool,"---", typeof selectedTool, selectedTool !== 'Select')
            if (selectedToolType) {
                // console.log("🚀 ~ option.addEventListener ~ selectedTool:", selectedToolType);
                continueButton.classList.remove('disabled');
                selectButton.setAttribute('data-tool', selectedToolType);
                selectButton.textContent = selectedText;
            } else {
                // console.log("🚀 ~ option.addEventListener ~ selectedTool:", selectedToolType);
                continueButton.classList.add('disabled');
                selectButton.setAttribute('data-tool', '');
            }
        });
    }
}



// add event listener for dropdown menu options








/*
const dataCorrectionsToolRoutes = [
    '#dataCorrectionsToolSelection',
    '#incentiveEligibilityTool',
    '#surveyResetTool',
    '#verificationCorrrectionsTool',
];

else if (dataCorrectionsToolRoutes.includes(route)) {
    if (JSON.parse(localStorage.getItem("participant")) === null) {
        alert("No participant selected. Please select a participant from the participants dropdown or the participant lookup page");
    }
    else {
        let participant = JSON.parse(localStorage.getItem("participant"))

        switch(route) {
            case '#dataCorrectionsToolSelection':
                // function for 
                render ""
                break;
            case '#incentiveEligibilityTool':
                // function for 
                render ""
                break;
            case '#surveyResetTool':
                // function for 
                render ""
                break;
            case '#verificationCorrrectionsTool':
                // function for 
                render ""
                break;
            default:
                window.location.hash = '#dataCorrectionsToolSelection';
                break;
        }
        renderDataCorrectionsToolPage(participant);
    }
}

*/



/*
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



// KEEP FOR LATER
                    return `
        <div id="root root-margin">
            <div class="container-fluid">
                <div class="col-lg">
                    ${renderParticipantHeader(participant)}

                    <div id="alert_placeholder"></div>
                    <div class="row form-row">
                    <div>                    
                        <h4><b>Data Corrections Tool</b></h4>
                        <span style="position:relative; font-size: 15px; top:2px;">
                            <b>Note: This tool should only be used to make corrections to participant data post-verification. All changes need to be approved by the CCC before being applied to the participant record via this tool.</b>
                        </span>
                    </div>
                <div>
            </div>
        </div>
    `;
*/



/*
Refactor Module template literal structure

1. Verification Status
2. Duplicate Type
3. Recruitment Type
4. Incentive Eligibility
5. Survey Status Reset 



*/