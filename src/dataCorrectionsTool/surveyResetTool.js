import fieldMapping from '../fieldToConceptIdMapping.js';
import { updateNavBar } from '../navigationBar.js';
import { findParticipant } from '../participantLookup.js';
import { baseAPI, getIdToken, hideAnimation, showAnimation } from '../utils.js';
import { participantState, invalidateSearchResultsCache } from '../stateManager.js';
import { setActiveDataCorrectionsTab } from './dataCorrectionsHelpers.js';
import { triggerNotificationBanner } from '../utils.js';
import { refreshParticipantHeaders } from '../participantHeader.js';
import { renderParticipantDetails } from '../participantDetails.js';

let selectedSurvey = null;

const statusMapping = {
    "972455046": "Not Started",
    "615768760": "Started",
    "231311385": "Completed",
};

const surveyModalBody = {
    [fieldMapping.ssnStatusFlag]: "Are you sure you want to reset the survey status for the SSN survey?",
};

export const setupSurveyResetToolPage = (participant, { containerId = 'mainContent', skipNavBarUpdate = false } = {}) => {
    if (participant !== undefined) {
        if (!skipNavBarUpdate) {
            updateNavBar('participantVerificationBtn');
        }
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = renderDataCorrectionsSelectionContent(participant);
        handleSurveyTypeChange(participant);
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
                <!-- Alert Placeholder -->
                <div id="alert_placeholder" class="dataCorrectionsAlert"></div>

                <div class="row">
                    <div class="col my-2">
                        <h2 class="norcToolTypeHeader"> Survey Status Reset Tool</h2>
                        <p class="norcToolDropdownInfoText">
                            Please select the survey to be reset below. A survey reset means that the survey data and answers will be <span style="text-decoration:underline;">permanently deleted</span>, and the survey status flag will be reset to 'not started'.
                        </p>
                        <div style="display:flex">
                            <p class="infoLabel">Update Survey:</p>
                            <div class="btn-group dropright">
                                <button type="button" class="btn btn-info dropdown-toggle selectButton" data-toggle="dropdown" aria-expanded="false"  style="margin-left: 1rem;">
                                    Select
                                </button>
                                <div id="dropdownSurveyMenu" class="dropdown-menu">
                                    <a class="dropdown-item">Select</a>
                                    <a class="dropdown-item" data-survey=${fieldMapping.ssnStatusFlag}>SSN Survey</a>
                                </div>    
                            </div>
                        </div>
                        <p class="font-weight-bold mt-5">Current Survey Status:</p>
                        <p id="surveyNameText" class="infoLabel">Survey Name: </p>          
                        <p id="surveyStatusText" class="infoLabel">Survey Status: </p>
                        <p id="isSurveyAlreadyResetNote" class="font-weight-bold"></p>
                    </div>
                </div>

                <div class="row" style="margin-top: 8rem;">
                    <div class="col">
                        <div class="d-flex">
                            <div>
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
    const dropdownSurveyOptions = surveyDropdown?.children;
    const selectButton = document.querySelector('.selectButton');
    if (!surveyDropdown || !dropdownSurveyOptions || !selectButton) return;

    const participantConnectId = participant['Connect_ID'];
    const { ssnStatusFlag, notStarted } = fieldMapping;
    let query;

    for (let option of dropdownSurveyOptions) {
        option.addEventListener('click', async (e) => { // TODO: Add gaurd to prevent multiple event listeners from being added
            selectedSurvey = Number(e.target.dataset.survey);
            
            if (selectedSurvey === ssnStatusFlag) {
                selectButton.textContent = e.target.textContent;
                try {
                    query = `connectId=${participantConnectId}`
                    showAnimation();
                    const response = await findParticipant(query);
                    hideAnimation();
                    const participantData = response.data[0];
                    await participantState.setParticipant(participantData);

                    if (participantData[ssnStatusFlag] === notStarted) { 
                        displayAlreadyResetNote();
                        disableSubmitButton();
                    } else { 
                        removeAlreadyResetNote();
                        enableSubmitButton();
                    }
                    updateSurveyStatusTextContent(participantData, selectedSurvey);
                    
                } catch (error) {
                    console.error(`Failed to fetch participant data for Connect ID ${participantConnectId}: `, error);
                }
            } else {
                selectButton.textContent = e.target.textContent;
                selectedSurvey = null;
                updateSurveyStatusTextContent(participant, selectedSurvey);
                removeAlreadyResetNote();
            }
        });
    }
};

const updateSurveyStatusTextContent = (participant, selectedSurvey, statusCode) => {
    const surveyNameElement = document.getElementById('surveyNameText');
    const surveyStatusElement = document.getElementById('surveyStatusText');
    const { surveyStatus, ssnStatusFlag } = fieldMapping;

    const participantSurveyStatus = {
        [ssnStatusFlag]: participant[ssnStatusFlag],
    };

    if (selectedSurvey === ssnStatusFlag) {
        surveyNameElement.textContent = 'Survey Name: SSN Survey';
        surveyStatusElement.textContent = `Survey Status: ${statusMapping[participantSurveyStatus[ssnStatusFlag]] || ''} `;

        if (statusCode === 200) { 
            surveyStatusElement.textContent = `Survey Status: ${statusMapping[surveyStatus["notStarted"]]}`;
        }
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
        const surveyStatusElement = document.getElementById('surveyStatusText');
        const selectButton = document.querySelector('.selectButton');
        const submitButton = document.getElementById('submitButton');
        if (!surveyNameElement || !surveyStatusElement || !selectButton || !submitButton) return;

        surveyNameElement.textContent = 'Survey Name: ';
        surveyStatusElement.textContent = 'Survey Status: ';
        selectButton.textContent = 'Select';
        selectedSurvey = null;
        disableSubmitButton();
        removeAlreadyResetNote();
    });
};

const submitSurveyStatusReset = () => {
    const submitButton = document.getElementById('submitButton');
    const confirmResetButton = document.getElementById('confirmResetButton');
    const surveyStatusElement = document.getElementById('surveyStatusText');
    if (!submitButton || !confirmResetButton || !surveyStatusElement) return;

    submitButton.addEventListener('click', async () => {
        if (selectedSurvey === null) return;
        setupModalContent(selectedSurvey);
    });

    if (confirmResetButton) {
            confirmResetButton.addEventListener('click', async () => { 
                try {
                    const response = await resetParticipantSurvey(selectedSurvey);
                    
                    if (response.code === 200 || response.data) {
                        await participantState.setParticipant(response.data);
                        invalidateSearchResultsCache();
                        refreshParticipantHeaders(response.data);
                        updateSurveyStatusTextContent(response.data, selectedSurvey, response.code);
                        if (window.location.hash.includes('#participantDetails')) {
                            await renderParticipantDetails(response.data, {}, 'details');
                        }
                        displayAlreadyResetNote();
                        triggerNotificationBanner("Survey has been successfully reset!", "success", 10000);
                        disableSubmitButton();
                    }
                }   catch (error) { 
                    console.error(`Failed to reset survey: ${error.message}`);
                    triggerNotificationBanner(`${error.message}`, "danger", 10000);
                }            
            });
    }
};

const displayAlreadyResetNote = () => { 
    const isSurveyAlreadyResetNote = document.getElementById('isSurveyAlreadyResetNote');
    if (!isSurveyAlreadyResetNote) return;
    isSurveyAlreadyResetNote.innerHTML = `<span><i class="fas fa-check-square fa-lg" style="color: #4CAF50; background: white;"></i> The survey is "Not Started". There is no survey data to be reset.</span>`;
}

const removeAlreadyResetNote = () => { 
    const isSurveyAlreadyResetNote = document.getElementById('isSurveyAlreadyResetNote');
    if (!isSurveyAlreadyResetNote) return;
    isSurveyAlreadyResetNote.innerHTML = ``;
}

const setupModalContent = (survey) => {
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;
    modalBody.textContent = surveyModalBody[survey];
}

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

/**
 * Reset the participant survey status for the selected survey
 * @param {number} selectedSurvey - the survey to reset, Ex. selectedSurvey = ssnStatusFlag (126331570)
 * @param {object} participant - the participant object
 * @returns {Promise<object>} - the updated participant object
 * 
*/
export const resetParticipantSurvey = async (selectedSurvey) => { 
    const participant = participantState.getParticipant();
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
