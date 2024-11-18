import fieldMapping from '../fieldToConceptIdMapping.js';
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

let selectedSurveyType = null;
let surveyName = "";
let surveyStatus = "";


export const setupSurveyResetToolPage = (participant) => {
    if (participant !== undefined) {
        const isParent = localStorage.getItem; 
        document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks(isParent);
        removeActiveClass('nav-link', 'active');
        document.getElementById('participantVerificationBtn').classList.add('active');
        mainContent.innerHTML = renderDataCorrectionsSelectionContent(participant);
        handleSurveyTypeChange(participant);
        handleBackToToolSelect();
        clearSurveySelection();
    }
}


const renderDataCorrectionsSelectionContent = (participant) => {
    return `
        <div id="root root-margin">
            <div class="container-fluid" style="padding: 0 0.9rem">

                ${renderParticipantHeader(participant)}

                <div class="row">
                    <div class="col">
                        <h1 class="smallerHeading">Data Corrections Tool</h1>
                        <p class="norcToolNote">
                            Note: This tool should only be used to make corrections to participant data post-verification. All changes need to be approved by the CCC before being applied to the participant record via this tool.
                        </p>
                    </div>
                </div>


                <div class="row">
                    <div class="col my-2">
                        <h2 class="norcToolTypeHeader"> Survey Status Reset </h2>
                        <p id="surveyNameText" class="infoLabel">Survey Name: </p>          
                        <p id="surveytStatusText" class="infoLabel">Survey Status: </p>
                        <!- Add button after update survey status on same line-->

                        <div style="display:flex">
                            <p class="infoLabel">Update Survey Status</p>    
                            <div class="btn-group dropright">
                                <button type="button" class="btn btn-info dropdown-toggle selectButton" data-toggle="dropdown" aria-expanded="false"  style="margin-left: 1rem;">
                                    Select
                                </button>
                                <div id="dropdownSurveyMenu" class="dropdown-menu">
                                    <a class="dropdown-item">Select</a>
                                    <a class="dropdown-item" data-survey="ssn">SSN Survey</a>
                                </div>    
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row" style="margin-top: 8rem;">
                    <div class="col">
                        <div class="d-flex">
                            <div>
                                <button type="button" class="btn btn-secondary" id="backToToolSelect"><- Back</button>
                                <button type="button" class="btn btn-danger" id="clearSurveySelect" style="margin-left: 0.5rem;">Clear</button>
                            </div>
                            <div style="margin-left: 3rem;">
                                <button type="button" class="btn btn-primary">Submit</button>
                            </div>
                        </div>
                    </div>
                </div>    
            </div>
        </div>
    `;
}



/*
Create a function as an event handler for the dropdown menu items
1. User selection will populate the survey status field
 - On load it's select default (nothing shows) 
 - After user selects, text will populate on the field 

*/




const handleSurveyTypeChange = (participant) => { 
    const surveyDropdown = document.getElementById('dropdownSurveyMenu');
    if (!surveyDropdown) return;
    console.log(surveyDropdown);

    const dropdownSurveyOptions = document.querySelector('#dropdownSurveyMenu').children;
    if (!dropdownSurveyOptions) return;
    console.log("🚀 ~ handleSurveyTypeChange ~ dropdownSurveyOptions:", dropdownSurveyOptions)

    const selectButton = document.querySelector('.selectButton');
    if (!selectButton) return;

    // click event listener for dropdown menu items
    // use text content to change the status field
    for (let option of dropdownSurveyOptions) {
        option.addEventListener('click', (e) => {
            const selectedSurveyTypeText = e.target.textContent.trim();
            
            console.log(selectedSurveyType);
    
            if (selectedSurveyTypeText === 'Select') {
                selectButton.textContent = 'Select';
                selectedSurveyType = null;
                console.log("🚀 ~ surveyDropdown.addEventListener ~ selectedSurveyTypeText:", selectedSurveyTypeText)
                updateSurveyStatusTextContent(participant, selectedSurveyType);
            } else {
                selectButton.textContent = selectedSurveyTypeText;
                selectedSurveyType = e.target.dataset.survey;
                console.log("🚀 ~ surveyDropdown.addEventListener ~ selectedSurveyType:", selectedSurveyType)
                console.log("🚀 ~ surveyDropdown.addEventListener ~ selectedSurveyTypeText:", selectedSurveyTypeText)
                updateSurveyStatusTextContent(participant, selectedSurveyType);
            }
        });
    }
}


/**
 * 
*/
const updateSurveyStatusTextContent = (participant, selectedSurveyType) => {
    console.log("🚀 ~ updateSurveyStatusTextContent ~ participant:", participant)
    const surveyNameElement = document.getElementById('surveyNameText');
    const surveyStatusElement = document.getElementById('surveytStatusText');
    // get the survey status from the participant object store into object
    const participantSurveyStatus = {
        "ssn": participant[fieldMapping.ssnStatusFlag],
    };

    const statusMapping = {
        "972455046": "Not Started",
        "615768760": "Started",
        "231311385": "Completed",
    }

    console.log("🚀 ~ updateSurveyStatusTextContent ~ participantSurveyStatus:", participantSurveyStatus)

    if (selectedSurveyType === 'ssn') {
        surveyNameElement.textContent = 'Survey Name: SSN Survey';
        surveyStatusElement.textContent = `Survey Status: ${statusMapping[participantSurveyStatus.ssn] || ''} `;

    } else if (selectedSurveyType === null) {
        surveyNameElement.textContent = 'Survey Name: ';
        surveyStatusElement.textContent = 'Survey Status: ';
    }
}


const handleBackToToolSelect = () => {
    const backToToolSelectButton = document.getElementById('backToToolSelect');
    if (!backToToolSelectButton) return;

    backToToolSelectButton.addEventListener('click', () => {
       location.hash = '#dataCorrectionsToolSelection';
    });
}

/**
 *  Clears the survey status selection back to default and clears the text content
 */
const clearSurveySelection = () => { 
    const clearButton = document.getElementById('clearSurveySelect');
    if (!clearButton)  return;

    clearButton.addEventListener('click', () => {
        const surveyNameElement = document.getElementById('surveyNameText');
        if (!surveyNameElement) return;
        const surveyStatusElement = document.getElementById('surveytStatusText');
        if (!surveyStatusElement) return
        const selectButton = document.querySelector('.selectButton');
        if (!selectButton) return;

        surveyNameElement.textContent = 'Survey Name: ';
        surveyStatusElement.textContent = 'Survey Status: ';
        selectButton.textContent = 'Select';
        selectedSurveyType = null;
    });
}



