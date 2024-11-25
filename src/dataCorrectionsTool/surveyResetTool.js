import fieldMapping from '../fieldToConceptIdMapping.js';
import { dashboardNavBarLinks, removeActiveClass } from '../navigationBar.js';
import { renderParticipantHeader } from '../participantHeader.js';
import { findParticipant } from '../participantLookup.js';
import { baseAPI, getIdToken, hideAnimation, showAnimation } from '../utils.js';
import { handleBackToToolSelect, displayDataCorrectionsNavbar, setActiveDataCorrectionsTab } from './dataCorrectionsHelpers.js';
import { triggerNotificationBanner } from '../utils.js';

let selectedSurvey = null;

const statusMapping = {
    "972455046": "Not Started",
    "615768760": "Started",
    "231311385": "Completed",
};

const surveyModalBody = {
    "ssn": "Are you sure you want to reset the survey status for the SSN survey?",
};

export const setupSurveyResetToolPage = (participant) => {
    if (participant !== undefined) {
        const isParent = localStorage.getItem('isParent');
        document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks(isParent);
        removeActiveClass('nav-link', 'active');
        document.getElementById('participantVerificationBtn').classList.add('active');
        mainContent.innerHTML = renderDataCorrectionsSelectionContent(participant);
        handleSurveyTypeChange(participant);
        handleBackToToolSelect();
        clearSurveySelection();
        submitSurveyStatusReset();
        disableSubmitButton();
        setActiveDataCorrectionsTab(); 
    }
};

const renderDataCorrectionsSelectionContent = (participant) => {
    return `
        <div id="root root-margin">
            <div class="container-fluid" style="padding: 0 0.9rem">
                ${renderParticipantHeader(participant)}
                ${displayDataCorrectionsNavbar()}

                <!-- Alert Placeholder -->
                <div id="alert_placeholder" class="dataCorrectionsAlert"></div>
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
                    <button type="button" class="btn btn-primary" id="confirmResetButton" data-dismiss="modal">Confirm</button>
                </div>
                </div>
            </div>
        </div>
    `;
};


const handleSurveyTypeChange = (participant) => { 
    const surveyDropdown = document.getElementById('dropdownSurveyMenu');
    if (!surveyDropdown) return;

    const dropdownSurveyOptions = document.querySelector('#dropdownSurveyMenu').children;
    if (!dropdownSurveyOptions) return;

    const selectButton = document.querySelector('.selectButton');
    if (!selectButton) return;

    const participantConnectId = participant['Connect_ID'];

    let query;

    for (let option of dropdownSurveyOptions) {
        option.addEventListener('click', async (e) => {
            selectedSurvey = e.target.dataset.survey;
            if (selectedSurvey === 'ssn') {
                selectButton.textContent = e.target.textContent;
                selectedSurvey = e.target.dataset.survey;
                try {
                    query = `connectId=${participantConnectId}`
                    showAnimation();
                    const response =  await findParticipant(query);
                    hideAnimation();
                    const latestParticipant = response.data[0];
                    localStorage.setItem('participant', JSON.stringify(latestParticipant));
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
};


const updateSurveyStatusTextContent = (participant, selectedSurvey) => {
    const surveyNameElement = document.getElementById('surveyNameText');
    const surveyStatusElement = document.getElementById('surveyStatusText');

    const participantSurveyStatus = {
        "ssn": participant[fieldMapping.ssnStatusFlag],
    };

    if (selectedSurvey === 'ssn') {
        surveyNameElement.textContent = 'Survey Name: SSN Survey';
        surveyStatusElement.textContent = `Survey Status: ${statusMapping[participantSurveyStatus.ssn] || ''} `;
        enableSubmitButton();

    } else if (selectedSurvey === null) {
        surveyNameElement.textContent = 'Survey Name: ';
        surveyStatusElement.textContent = 'Survey Status: ';
        disableSubmitButton();
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
        const submitButton = document.getElementById('submitButton');
        if (!submitButton) return;

        surveyNameElement.textContent = 'Survey Name: ';
        surveyStatusElement.textContent = 'Survey Status: ';
        selectButton.textContent = 'Select';
        selectedSurvey = null;
        submitButton.disabled = true;

    });
};

const submitSurveyStatusReset = () => {
    const submitButton = document.getElementById('submitButton');
    const confirmResetButton = document.getElementById('confirmResetButton');
    if (!submitButton || !confirmResetButton) return;

    submitButton.addEventListener('click', async () => {
        if (selectedSurvey === null) return;
        setupModalContent(selectedSurvey);
    });

    if (confirmResetButton) {
            confirmResetButton.addEventListener('click', async () => { 
                try {
                    const response = await resetParticipantSurvey(selectedSurvey);
                    
                    if (response.code === 200 || response.data) {
                        localStorage.setItem('participant', JSON.stringify(response.data));
                        updateSurveyStatusTextContent(response.data, selectedSurvey);
                        triggerNotificationBanner("Survey has been successfully reset!", "success", 10000);
                    }
                }   catch (error) { 
                    console.error(`Failed to reset survey: ${error.message}`);
                    triggerNotificationBanner(`${error.message}`, "danger", 10000);
                }            
            });
    }
};

const setupModalContent = (survey) => {
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;
    modalBody.textContent = surveyModalBody[survey];
}

/**
 * Reset the participant survey status for the selected survey
 * @param {string} selectedSurvey - the survey to reset
 * @param {object} participant - the participant object
 * @returns {Promise<object>} - the updated participant object
 * 
*/
const resetParticipantSurvey = async (selectedSurvey) => { 
    const participant = JSON.parse(localStorage.getItem('participant'));
    const connectId = participant['Connect_ID'];

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
        if (!response.ok) {
            const error = (response.status + " Error" + ": " + (await response.json()).message);
            throw new Error(error);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to reset participant survey: ", error);
        throw error;
    }
};

const disableSubmitButton = () => { 
    const submitButton = document.getElementById('submitButton');
    if (!submitButton) return;
    submitButton.disabled = true;
}

const enableSubmitButton = () => { 
    const submitButton = document.getElementById('submitButton');
    if (!submitButton) return;
    submitButton.disabled = false;
}