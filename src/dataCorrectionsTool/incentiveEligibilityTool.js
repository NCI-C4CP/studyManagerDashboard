import fieldMapping from '../fieldToConceptIdMapping.js';
import { dashboardNavBarLinks, removeActiveClass } from '../navigationBar.js';
import { renderParticipantHeader } from '../participantHeader.js';
import { handleBackToToolSelect, displayDataCorrectionsNavbar, setActiveDataCorrectionsTab } from './dataCorrectionsHelpers.js';
import { showAnimation, hideAnimation, baseAPI, getIdToken, triggerNotificationBanner, formatUTCDate } from '../utils.js';
import { findParticipant } from '../participantLookup.js';

let participantPaymentRound = null;
let isEligibleForIncentiveUpdate = null;
let selectedDateOfEligibility = null; // YYYY-MM-DD

const conceptIdToPaymentRoundMapping = {
    266600170: 'baseline',
}

export const setupIncentiveEligibilityToolPage = (participant) => { 
    if (participant !== undefined) {
        const isParent = localStorage.getItem('isParent');
        document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks(isParent);
        removeActiveClass('nav-link', 'active');
        document.getElementById('participantVerificationBtn').classList.add('active');
        mainContent.innerHTML = renderIncentiveEligibilityToolContent(participant);
        handlePaymentRoundSelect(participant);
        handleBackToToolSelect();
        clearPaymentRoundSelect();
        toggleSubmitButton();
        setupModalContent();
        setActiveDataCorrectionsTab();
        // setIncentiveEligibleInputDefaultValue();
        handleDatePickerSelection();
        // confirmIncentiveEligibilityUpdate(participant);
    }
};


const renderIncentiveEligibilityToolContent = (participant) => { 
    return `<div id="root root-margin">
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
                        <h2 class="norcToolTypeHeader">Incentive Eligibility </h2>
                        <p class="norcToolDropdownInfoText">
                            To update the incentive eligibility for this participant, please choose the payment round and set the date of eligibility below. By clicking submit, the incentive eligibility status will be updated from 'not eligible' to 'eligible'.
                        </p>   

                        <div style="display:flex">
                            <p class="infoLabel">Payment Round:</p>    
                            <div class="btn-group dropright">
                                <button type="button" class="btn btn-info dropdown-toggle selectButton ml-3" data-toggle="dropdown" aria-expanded="false">
                                    Select
                                </button>
                                <div id="dropdownPaymentMenu" class="dropdown-menu">
                                    <a class="dropdown-item">Select</a>
                                    <a class="dropdown-item" data-payment=${fieldMapping['baseline']}>Baseline</a>
                                </div>    
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col my-4">
                        <p class="font-weight-bold">Current Incentive Eligibility Status: </p>
                        <p id="incentiveStatusText" class="infoLabel">Incentive Eligibility Status: </p>
                        <p id="dateOfEligibilityText">Date of Eligibility:</p>
                        <p id="isIncentiveEligibleNote" class="norcToolNote"></p>
                        <div id="setDateOfEligibilityContainer" class="d-flex"></div>
                    </div>
                </div>

                <div class="row" style="margin-top: 8rem;">
                    <div class="col">
                        <div class="d-flex">
                            <div>
                                <button type="button" class="btn btn-secondary" id="backToToolSelect"><- Back</button>
                                <button type="button" class="btn btn-danger" id="clearPaymentRoundButton" style="margin-left: 0.5rem;">Clear</button>
                            </div>
                            <div style="margin-left: 3rem;">
                                <button type="button" class="btn btn-primary" id="submitButton" data-toggle="modal" data-target="#modalConfirmUpdateEligibility">Submit</button>
                            </div>
                        </div>
                    </div>
                </div>    
            </div>
        </div>
        
        <!-- Confirmation Modal -->
        <div class="modal fade" id="modalConfirmUpdateEligibility" tabindex="-1" aria-labelledby="confirmUpdateEligibility" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="confirmModalHeader">Confirm Update Incentive Eligibility</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="confirmUpdateEligibility" data-dismiss="modal">Confirm</button>
                </div>
                </div>
            </div>
        </div>
        `;
};


/**
 * Handles the payment round selection dropdown conetent
*/
const handlePaymentRoundSelect = (participant) => {
    const paymentRoundElement = document.getElementById('dropdownPaymentMenu');
    const dropdownPaymentOptions = paymentRoundElement.children;
    const incentiveStatusText = document.getElementById('incentiveStatusText');
    const isIncentiveEligibleNote = document.getElementById('isIncentiveEligibleNote');
    const selectButton = document.querySelector('.selectButton');
    const participantConnectId = participant?.["Connect_ID"];
    const query = `connectId=${participantConnectId}`

    if (!paymentRoundElement || 
        !dropdownPaymentOptions || 
        !incentiveStatusText || 
        !isIncentiveEligibleNote || 
        !selectButton) return;

    const { paymentRound, baselinePayment, eligiblePayment, norcPaymentEligibility, no } = fieldMapping; 

    for (let option of dropdownPaymentOptions) {
        option.addEventListener('click', async (e) => {
            participantPaymentRound = e.target.dataset.payment;
            if (participantPaymentRound === fieldMapping['baseline'].toString()) {
                selectButton.textContent = e.target.textContent;
                try {
                    showAnimation();
                    const response = await findParticipant(query);
                    hideAnimation();
                    const participantData = response.data[0];
                    console.log("participantData: ", participantData);
                    localStorage.setItem('participant', JSON.stringify(participantData));

                    const isNORCPaymentEligible = participantData?.[paymentRound]?.[baselinePayment]?.[norcPaymentEligibility] === no;
                    const isIncentiveEligible = participantData?.[paymentRound]?.[baselinePayment]?.[eligiblePayment] === no;
                    const isEligibleForIncentiveUpdate = isNORCPaymentEligible && isIncentiveEligible;

                    if (isEligibleForIncentiveUpdate) {
                        toggleSubmitButton(isEligibleForIncentiveUpdate);
                        displaySetDateOfEligibilityContent();
                        setIncentiveEligibleInputDefaultValue();
                        handleParticipantPaymentTextContent(participantData, isEligibleForIncentiveUpdate);
                        confirmIncentiveEligibilityUpdate(participant);
                        dateOfEligibilityInput.disabled = false;
                    } else {
                        toggleSubmitButton();
                        handleParticipantPaymentTextContent(participantData, isEligibleForIncentiveUpdate);
                        // dateOfEligibilityInput.disabled = true;
                    }
                    setupModalContent(participantPaymentRound);
                } catch (error) {
                    console.error(`Failed to fetch participant data for Connect ID ${participantConnectId}: `, error);
                }
            } else { 
                toggleSubmitButton();
                participantPaymentRound = null;
                isEligibleForIncentiveUpdate = null;
                selectButton.textContent = e.target.textContent;
                // setIncentiveEligibleInputDefaultValue();
                removeSetDateOfEligibilityContent();
                isIncentiveEligibleNote.innerHTML = ``;
                // dateOfEligibilityInput.disabled = false;
                handleParticipantPaymentTextContent(participant, isEligibleForIncentiveUpdate);
            }
        });
    }
};

const handleParticipantPaymentTextContent = (participant, isEligibleForIncentiveUpdate) => { 
    const incentiveStatusText = document.getElementById('incentiveStatusText');
    const isIncentiveEligibleNote = document.getElementById('isIncentiveEligibleNote');
    // const dateOfEligibilityInput = document.getElementById('dateOfEligibilityInput');
    const dateOfEligibilityText = document.getElementById('dateOfEligibilityText');
    if (!incentiveStatusText || !isIncentiveEligibleNote) return;
    
    const { paymentRound, baseline, eligiblePaymentRoundTimestamp } = fieldMapping; 

    if (isEligibleForIncentiveUpdate) {
        incentiveStatusText.textContent = 'Incentive Eligibility Status: Yes';
        dateOfEligibilityText.textContent = 'Date of Eligibility: N/A';

    } else if (isEligibleForIncentiveUpdate === false) {
        incentiveStatusText.textContent = 'Incentive Eligibility Status: No';
        dateOfEligibilityText.textContent = `Date of Eligibility: ${formatUTCDate(participant?.[paymentRound]?.[baseline]?.[eligiblePaymentRoundTimestamp])}`; // TODO: Add flexibility for other payment rounds
        isIncentiveEligibleNote.innerHTML = `<span><i class="fas fa-check-square fa-lg" style="color: #4CAF50; background: white;"></i> This participant is already incentive eligible. The eligibility status cannot be updated.</span>`;
        // dateOfEligibilityInput.value = formatUTCDate(participant?.[paymentRound]?.[baseline]?.[eligiblePaymentRoundTimestamp], true);

    } else {
        incentiveStatusText.textContent = 'Incentive Eligibility Status: ';
        dateOfEligibilityText.textContent = 'Date of Eligibility:';
        // dateOfEligibilityInput.textContent = setIncentiveEligibleInputDefaultValue();
    }

}

const setIncentiveEligibleInputDefaultValue = () => { 
    const dateOfEligibilityInput = document.getElementById('dateOfEligibilityInput');
    if (dateOfEligibilityInput) {
        const currentDate = new Date().toLocaleDateString("en-CA", {timeZone:"America/New_York"}); // MM/DD/YYYY
        dateOfEligibilityInput.value = currentDate;
        dateOfEligibilityInput.max = currentDate;
    }
};

const convertToISO8601 = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString();
};

/**
 *  Clears the payment round selection back to default and clears the text content
 */
const clearPaymentRoundSelect = () => {
    const clearButton = document.getElementById('clearPaymentRoundButton');
    const isIncentiveEligibleNote = document.getElementById('isIncentiveEligibleNote');
    const selectButton = document.querySelector('.selectButton');
    // const dateOfEligibilityInput = document.getElementById('dateOfEligibilityInput');
    if (!clearButton || !isIncentiveEligibleNote || !selectButton) return;

    clearButton.addEventListener('click', () => {
        setParticipantPaymentRound();
        // dateOfEligibilityInput.disabled = false;
        removeSetDateOfEligibilityContent();
    });
};

const setParticipantPaymentRound = () => { 
    const clearButton = document.getElementById('clearPaymentRoundButton');
    const isIncentiveEligibleNote = document.getElementById('isIncentiveEligibleNote');
    const selectButton = document.querySelector('.selectButton');
    const incentiveStatusText = document.getElementById('incentiveStatusText');
    const dateOfEligibilityText = document.getElementById('dateOfEligibilityText');
    if (!clearButton || !isIncentiveEligibleNote || !selectButton || !incentiveStatusText || !dateOfEligibilityText) return;

    isIncentiveEligibleNote.textContent = '';
    dateOfEligibilityText.textContent = 'Date of Eligibility:';
    selectButton.textContent = ' Select ';
    participantPaymentRound = null;
    setIncentiveEligibleInputDefaultValue();
    incentiveStatusText.textContent = 'Incentive Eligibility Status: ';
}

const toggleSubmitButton = (isEligibleForIncentiveUpdate) => { 
    const submitButton = document.getElementById('submitButton');
    if (!submitButton) return;
    if (isEligibleForIncentiveUpdate) {
        submitButton.removeAttribute('disabled');
    } else {
        submitButton.disabled = true;
    }
};

const confirmIncentiveEligibilityUpdate = (participant) => { 
    const confirmButton = document.getElementById('confirmUpdateEligibility');
    // const dateOfEligibilityInput = document.getElementById('dateOfEligibilityInput');
    const { paymentRound, baseline, eligiblePaymentRoundTimestamp } = fieldMapping;

    if (confirmButton && dateOfEligibilityInput) {
        ;
        confirmButton.addEventListener('click', async (e) => {
            const confirmUpdateEligibilityButton = document.getElementById('confirmUpdateEligibility');
            const selectedDateValue = selectedDateOfEligibility ? convertToISO8601(selectedDateOfEligibility) : convertToISO8601(dateOfEligibilityInput.value);
            if (confirmUpdateEligibilityButton) {
                try {
                    console.log("Confirm button and date of eligibility input found")
                    const updateResponse = await updateParticipantIncentiveEligibility(participant, participantPaymentRound, selectedDateValue);
                    const currentParticipantData = updateResponse.data;

                    if (updateResponse.code === 200) { 
                        triggerNotificationBanner("Participant incentive eligibility status updated successfully!", "success" ,10000);

                        document.getElementById('incentiveStatusText').textContent = 'Incentive Eligibility Status: No';
                        document.getElementById('isIncentiveEligibleNote').innerHTML = `<span><i class="fas fa-check-square fa-lg" style="color: #4CAF50; background: white;"></i> This participant is already incentive eligible.</span>`;
                        document.getElementById('dateOfEligibilityText').textContent = `Date of Eligibility: ${formatUTCDate(currentParticipantData?.[paymentRound]?.[baseline]?.[eligiblePaymentRoundTimestamp])}`; // TODO: Add flexibility for other payment rounds
                        // document.getElementById('dateOfEligibilityInput').textContent = formatUTCDate(currentParticipantData[paymentRound]?.[baseline]?.[eligiblePaymentRoundTimestamp], true);
                        // document.getElementById('dateOfEligibilityInput').disabled = true;
                        removeSetDateOfEligibilityContent();
                        toggleSubmitButton();
                    }
                } catch (error) { 
                    console.error("Failed to update participant incentive eligibility: ", error);
                    triggerNotificationBanner(`${error.message}`, 'danger', 10000);
                } 
            }
        });
    }
}

const setupModalContent = (participantPaymentRound) => {
    const paymentRoundType = conceptIdToPaymentRoundMapping[participantPaymentRound];
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;
    modalBody.textContent = `Are you sure you want to update the participant's incentive eligibility status for ${paymentRoundType}?`;
};

/**
 * Handles user input choosing from the date picker and sets selectedDateOfEligibility value
 * 
*/
const handleDatePickerSelection = () => {
    const datePicker = document.getElementById("dateOfEligibilityInput");
    if (datePicker) {
        datePicker.addEventListener("change", (e) => {
            selectedDateOfEligibility = e.target.value; // YYYY-MM-DD
        }) 
    }
};

const displaySetDateOfEligibilityContent = () => { 
    const setDateOfEligibilityContainer = document.getElementById('setDateOfEligibilityContainer');
    if (setDateOfEligibilityContainer) {
        setDateOfEligibilityContainer.innerHTML = `<p>Set Date of Eligibility:</p>
            <input type="date" id="dateOfEligibilityInput" class="form-control"  max="9999-12-31" style="margin-left: 1rem; width:14rem;">`;
    }
}

const removeSetDateOfEligibilityContent = () => { 
    const setDateOfEligibilityContainer = document.getElementById('setDateOfEligibilityContainer');
    if (setDateOfEligibilityContainer) {
        setDateOfEligibilityContainer.innerHTML = '';
    }
}

/**
 * Update participant incentive eligibility ands returns updated data on success
 * Async function to update participant incentive eligibility
 * @param {Object} participant - Participant object
 * @param {String} selectedPaymentRound - Selected payment round
 * @param {String} selectedDateValue - Selected date of eligibility
 * @returns {Promise<{
 *   code: number,
 *   data: Object,
 *   message?: string
 * }>}  Response object - { code: 200, data: {100767870,...} }
*/
const updateParticipantIncentiveEligibility = async (participant, selectedPaymentRound, selectedDateValue) => { 
    const connectId = participant['Connect_ID'];

    try {
        const idToken = await getIdToken();
        const response = await fetch(`${baseAPI}/dashboard?api=updateParticipantIncentiveEligibility`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + idToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                connectId: connectId,
                currentPaymentRound: selectedPaymentRound,
                dateOfEligibilityInput: selectedDateValue // ISO8601 date format
            }),
        });
        if (!response.ok) {
            const error = (response.status + " Error" + ": " + (await response.json()).message);
            throw new Error(error);
        }

        const responseObj = await response.json();
        return responseObj;
    } catch (error) { 
        console.error("Failed to update participant incentive eligibility: ", error);
        throw error;
    }
};