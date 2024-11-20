import fieldMapping from '../fieldToConceptIdMapping.js'; // change to conceptMapping
import { dashboardNavBarLinks, removeActiveClass } from '../navigationBar.js';
// import { showAnimation, hideAnimation, baseAPI, getIdToken, getDataAttributes, triggerNotificationBanner } from './utils.js';
import { renderParticipantHeader } from '../participantHeader.js';
// import { keyToVerificationStatus, keyToDuplicateType, recruitmentType, updateRecruitmentType } from './idsToName.js';
// import { appState } from './stateManager.js';
import { findParticipant } from '../participantLookup.js';
import { baseAPI, getDataAttributes, getIdToken, hideAnimation, showAnimation } from '../utils.js';
import { handleBackToToolSelect } from './dataCorrectionsHelpers.js';

let selectedSurvey = null;
const statusMapping = {
    "972455046": "Not Started",
    "615768760": "Started",
    "231311385": "Completed",
}

const surveyModalText = {
    "ssn": "Are you sure you want to reset the survey status for the SSN survey?",
}

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
        submitSurveyStatusReset();
        // handleSurveyReset();
    }
}

const renderDataCorrectionsSelectionContent = (participant) => {
    return `
        <div id="root root-margin">
            <div class="container-fluid" style="padding: 0 0.9rem">
                ${renderParticipantHeader(participant)}

                <!-- Alert Placeholder -->
                <div id="alertPlaceholder" style="margin-top: 20px;"></div>
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
                        <p id="surveyStatusText" class="infoLabel">Survey Status: </p>
                        <p class="infoLabel font-weight-bold mb-3">Please select the survey to be reset.</p>

                        <div style="display:flex">
                            <p class="infoLabel">Update Survey:</p>
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
                                <button type="button" class="btn btn-primary" id="submitButton" data-toggle="modal" data-target="#modalConfirmReset">Submit</button>
                            </div>
                        </div>
                    </div>
                </div>    
            </div>
        </div>

        <!-- Confirmation Modal -->
        <div class="modal fade" id="modalConfirmReset" tabindex="-1" aria-labelledby="confirSurveyResetModal" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="confirmModalHeader">Confirm Survey Reset</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="confirmResetButton">Confirm</button>
                </div>
                </div>
            </div>
        </div>
    `;
}


const handleSurveyTypeChange = (participant) => { 
    const surveyDropdown = document.getElementById('dropdownSurveyMenu');
    if (!surveyDropdown) return;
    console.log(surveyDropdown);

    const dropdownSurveyOptions = document.querySelector('#dropdownSurveyMenu').children;
    if (!dropdownSurveyOptions) return;
    console.log("🚀 ~ handleSurveyTypeChange ~ dropdownSurveyOptions:", dropdownSurveyOptions)

    const selectButton = document.querySelector('.selectButton');
    if (!selectButton) return;

    const participantConnectId = participant['Connect_ID'];
    console.log("🚀 ~ handleSurveyTypeChange ~ participantConnectId:", participantConnectId)

    let query;

    // click event listener for dropdown menu items
    // use text content to change the status field
    for (let option of dropdownSurveyOptions) {
        option.addEventListener('click', async (e) => {
            // selectedSurvey = e.target.textContent.trim();
            selectedSurvey = e.target.dataset.survey;
            console.log(selectedSurvey);
            if (selectedSurvey === 'ssn') {
                selectButton.textContent = e.target.textContent;
                selectedSurvey = e.target.dataset.survey;
                console.log("🚀 ~ surveyDropdown.addEventListener ~ selectedSurvey:", selectedSurvey)
                // console.log("🚀 ~ surveyDropdown.addEventListener ~ selectedSurveyTypeText:", selectedSurveyTypeText)
                try {
                    query = `connectId=${participantConnectId}`
                    // updateSurveyStatusTextContent(participant, selectedSurvey);
                    showAnimation();
                    const response =  await findParticipant(query);
                    hideAnimation();
                    console.log("🚀 ~ response", response)
                    const latestParticipant = response.data[0];
                    // console.log("🚀 latestParticipant", latestParticipant)
                    localStorage.setItem('particpant', JSON.stringify(latestParticipant));
                    updateSurveyStatusTextContent(latestParticipant, selectedSurvey);
                } catch (error) {
                    console.error(`Failed to fetch participant data for Connect ID ${participantConnectId}: `, error);
                }
            } else {
                selectButton.textContent = e.target.textContent;
                selectedSurvey = null;
                updateSurveyStatusTextContent(participant, selectedSurvey);
            }
        });
    }
}


const updateSurveyStatusTextContent = (participant, selectedSurvey) => {
    const surveyNameElement = document.getElementById('surveyNameText');
    const surveyStatusElement = document.getElementById('surveyStatusText');

    const participantSurveyStatus = {
        "ssn": participant[fieldMapping.ssnStatusFlag],
    };

    if (selectedSurvey === 'ssn') {
        surveyNameElement.textContent = 'Survey Name: SSN Survey';
        surveyStatusElement.textContent = `Survey Status: ${statusMapping[participantSurveyStatus.ssn] || ''} `;

    } else if (selectedSurvey === null) {
        surveyNameElement.textContent = 'Survey Name: ';
        surveyStatusElement.textContent = 'Survey Status: ';
    }
};

/**
 *  Clears the survey status selection back to default and clears the text content
 */
const clearSurveySelection = () => { 
    const clearButton = document.getElementById('clearSurveySelect');
    if (!clearButton)  return;

    clearButton.addEventListener('click', () => {
        const surveyNameElement = document.getElementById('surveyNameText');
        if (!surveyNameElement) return;
        const surveyStatusElement = document.getElementById('surveyStatusText');
        if (!surveyStatusElement) return
        const selectButton = document.querySelector('.selectButton');
        if (!selectButton) return;

        surveyNameElement.textContent = 'Survey Name: ';
        surveyStatusElement.textContent = 'Survey Status: ';
        selectButton.textContent = 'Select';
        selectedSurvey = null;
    });
}

// Create a function to GET the participant data and update in localStorage


const submitSurveyStatusReset = () => {
    const submitButton = document.getElementById('submitButton');
    if (!submitButton) return;
    const confirmResetButton = document.getElementById('confirmResetButton');
    console.log("🚀 ~ submitSurveyStatusReset ~ confirmResetButton:", confirmResetButton)
    console.log("selectedSurvey", selectedSurvey);

    submitButton.addEventListener('click', async () => {
        if (selectedSurvey === null) return;
        setupModalContent(selectedSurvey);

        if (confirmResetButton) {
            confirmResetButton.addEventListener('click', async () => { 
                try {
                    // handle reset for each survey type
                    // const participant = JSON.parse(localStorage.getItem('participant'));
                    const response = await resetParticipantSurvey(selectedSurvey);
                    console.log("🚀 ~ submitButton.addEventListener ~ response:", response);
                    
                    if (response.status === 200) {
                        showAlert("Survey has been successfully reset.", "success");
                        localStorage.setItem('participant', JSON.stringify(response.data));
                        updateSurveyStatusTextContent(response.data, selectedSurvey);
                    } else {
                        showAlert(`Failed to reset survey: ${response.message}`, "danger");
                    }
                }   catch (error) { 
                    console.error(`Failed to reset survey: ${error.message}`);
                }            
            });
        }
    });
}

const setupModalContent = (survey) => { 
    console.log("🚀 ~ setupModalContent ~ survey:", survey)
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;
    modalBody.textContent = surveyModalText[survey];
}

/**
 * Reset the participant survey status for the selected survey
 * @param {string} selectedSurvey - the survey to reset
 * @param {object} participant - the participant object
 * @returns {Promise<object>} - the updated participant object
 * 
*/
const resetParticipantSurvey = async (selectedSurvey) => { 
    const participant = JSON.parse(localStorage.getItem('particpant'));
    const connectId = participant['Connect_ID'];
    console.log("🚀 ~ resetParticipantSurvey ~ participant:", participant)

    try {
        const idToken = await getIdToken();
        const response = await fetch(`${baseAPI}/dashboard?api=resetParticipantSurvey`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + idToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                connectId: connectId,
                survey: selectedSurvey 
            }),
        });

        console.log("🚀 ~ resetParticipantSurvey ~ response:", response)
        if (!response.ok) {
            const error = (response.status + ": " + (await response.json()).message);
            throw new Error(error);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to reset participant survey: ", error);
        throw error;
    }
}