import fieldMapping from '../fieldToConceptIdMapping.js';
import { dashboardNavBarLinks, removeActiveClass } from '../navigationBar.js';
import { renderParticipantHeader } from '../participantHeader.js';
import { handleBackToToolSelect, displayDataCorrectionsNavbar, setActiveDataCorrectionsTab } from './dataCorrectionsHelpers.js';
import { showAnimation, hideAnimation, baseAPI, getIdToken, getDataAttributes, triggerNotificationBanner } from '../utils.js';
// import { humanReadableMDY } from '../utils.js';

let participantPaymentRound = null;
let isEligibleForIncentiveUpdate = null;

const conceptIdToPaymentRoundMapping = {
    266600170: 'baseline',
}

export const setupIncentiveEligibilityToolPage = (participant) => { 
    if (participant !== undefined) {
        const isParent = localStorage.getItem; 
        document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks(isParent);
        removeActiveClass('nav-link', 'active');
        document.getElementById('participantVerificationBtn').classList.add('active');
        mainContent.innerHTML = renderIncentiveEligibilityToolContent(participant);
        handlePaymentRoundSelect(participant);
        handleBackToToolSelect();
        clearPaymentRoundSelect();
        setIncentiveEligibleInputDefaultValue();
        toggleSubmitButton();
        handleSubmitButton(participant);
        setActiveDataCorrectionsTab();
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
                        <h2 class="norcToolTypeHeader">Incentive Eligibility</h2>
                        <p class="incentiveEligibileTool norcToolNote">
                            Note: Incentive Eligibility Status should only be updated with prior approval from CCC.
                        </p>   
                        <p id="incentiveStatusText" class="infoLabel">Incentive Eligible Status: </p>
                        <p id="isIncentiveEligbleNote" class="norcToolNote">

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
                        <p id="dateOfEligibilityText">Date of Eligibility:</p>
                        <div class="d-flex">
                            <p>Update Date of Eligibility:</p>
                            <input type="date" id="dateOfEligibility" class="form-control"  max="9999-12-31" style="margin-left: 1rem; width:14rem;">
                        </div>
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
 * Handle the payment round selection dropdown
*/
const handlePaymentRoundSelect = (participant) => {
    const paymentRoundElement = document.getElementById('dropdownPaymentMenu');
    if (!paymentRoundElement) return;

    const dropdownPaymentOptions = paymentRoundElement.children;
    if (!dropdownPaymentOptions) return;

    const incentiveStatusText = document.getElementById('incentiveStatusText');
    if (!incentiveStatusText) return;

    const isIncentiveEligbleNote = document.getElementById('isIncentiveEligbleNote');
    if (!isIncentiveEligbleNote) return;

    const selectButton = document.querySelector('.selectButton');
    if (!selectButton) return;
    
    const dateOfEligibilityInput = document.getElementById('dateOfEligibility');
    if (!dateOfEligibilityInput) return;

    const { paymentRound, baselinePayment, eligiblePayment, yes, no } = fieldMapping; 

    for (let option of dropdownPaymentOptions) {
        option.addEventListener('click', async (e) => {
            // console.log("e",e.target.dataset)
            participantPaymentRound = e.target.dataset.payment;
            console.log("🚀 ~ option.addEventListener ~ participantPaymentRound:", participantPaymentRound)

            if (participantPaymentRound === fieldMapping['baseline'].toString()) {
                // console.log("test")
                // console.log("🚀 ~ option.addEventListener ~ participantPaymentRound:", participantPaymentRound)
                selectButton.textContent = e.target.textContent;
                // incentiveStatusText.textContent = 'Incentive Eligible Status: Yes'; // Save for check if they meet conditions eligible conditions and meet conditions (normal surveys and blood given) (Payment Round, Date of Eligibiliy and Incentive Eligible Status)
                // Check if participant is already incentive eligible (Flags) AND other incentive eligible conditions

                // set thye payment round to the selected payment round
                // participantPaymentRound = e.target.dataset.payment;
                // console.log("🚀 ~ option.addEventListener ~ participantPaymentRound:", participantPaymentRound)

                try {
                    showAnimation();
                    const isParticipantEligibleIncentiveResponse = await checkParticipantForEligibleIncentive(participant, participantPaymentRound); // might rename variable later 
                    console.log("🚀 ~ option.addEventListener ~ isParticipantEligibleIncentive", isParticipantEligibleIncentiveResponse)
                    hideAnimation();
                    const { isEligibleForIncentive, participantData} = isParticipantEligibleIncentiveResponse.data; 

                    // console.log("🚀 ~ option.addEventListener ~ participantData:", participantData)
                    // console.log("🚀 ~ option.addEventListener ~ isParticipantEligibleIncentive:", isEligibleForIncentive)
                    
                    // set participant data in localStorage
                    // localStorage.setItem('participant', JSON.stringify(isParticipantEligibleIncentive.participantData)); // leading to errors
                    

                    // check if isParticipantEligibleIncentive.isEligibleForIncentive is true AND current participant data has "130371375.266600170.731498909" value to "NO"
                    
                    // switch isEligibleForIncentiveUpdate only if participant is not already incentive eligible && isEligibleForIncentive is true
                    
                    console.log("🚀 ~ option.addEventListener ~ participantPaymentRound:", participantPaymentRound)

                    isEligibleForIncentiveUpdate = isEligibleForIncentive && (participantData[paymentRound][baselinePayment][eligiblePayment] === no);
                    console.log("🚀 ~ option.addEventListener ~ isEligibleForIncentiveUpdate:", isEligibleForIncentiveUpdate);

                    if (isEligibleForIncentiveUpdate) {
                        // toggle UI to make submit button active 
                        toggleSubmitButton(isEligibleForIncentiveUpdate);
                        handleParticipantPaymentTextContent(participantData, isEligibleForIncentiveUpdate);
                        dateOfEligibilityInput.disabled = false;
                    } else {
                        toggleSubmitButton();
                        handleParticipantPaymentTextContent(participantData, isEligibleForIncentiveUpdate);
                        dateOfEligibilityInput.disabled = true;    
                        // toggle UI to make submit button inactive
                        // show note that particpant is not eligible for payment incentive update
                    }
                    
                    dateOfEligibilityInput.textContent = setIncentiveEligibleInputDefaultValue(); // default back to this date
                    // toggleSubmitButton(isEligibleForIncentiveUpdate);
                    // set to new data localStorage 
                } catch (error) { 
                    console.error("Failed to check if participant is already incentive eligible: ", error);
                }
                

            } else {
                // revert back participantPaymentRound and isEligibleForIncentiveUpdate to null 
                


                // console.log("🚀 ~ option.addEventListener ~ paymentRound, baselinePayment, eligiblePayment:", paymentRound, baselinePayment, eligiblePayment)
                
                // console.log("test value", participant[paymentRound][baselinePayment]);
                toggleSubmitButton();
                participantPaymentRound = null;
                isEligibleForIncentiveUpdate = null;
                selectButton.textContent = e.target.textContent;
                setIncentiveEligibleInputDefaultValue();
                isIncentiveEligbleNote.innerHTML = ``;
                dateOfEligibilityInput.disabled = false;
                handleParticipantPaymentTextContent(participant, isEligibleForIncentiveUpdate);

            }
        });
    }
};

const handleParticipantPaymentTextContent = (participant, isEligibleForIncentiveUpdate) => { 
    const incentiveStatusText = document.getElementById('incentiveStatusText');
    if (!incentiveStatusText) return;
    const isIncentiveEligbleNote = document.getElementById('isIncentiveEligbleNote');
    if (!isIncentiveEligbleNote) return;
    const dateOfEligibilityInput = document.getElementById('dateOfEligibility');
    if (!dateOfEligibilityInput) return;
    const dateOfEligibilityText = document.getElementById('dateOfEligibilityText');
    if (!dateOfEligibilityText) return;
    
    console.log("🚀 ~ handleParticipantPaymentTextContent ~ isEligibleForIncentiveUpdate:", isEligibleForIncentiveUpdate)
        const { paymentRound, baselinePayment, eligiblePayment, yes, no, baseline, baselinePaymentDate } = fieldMapping; 

    
    if (isEligibleForIncentiveUpdate) {
        incentiveStatusText.textContent = 'Incentive Eligible Status: Yes'; // participant is eligible to be updated
        dateOfEligibilityText.textContent = 'Date of Eligibility: N/A';
        // dateOfEligibilityInput = // do i need to update the time again for default?

    }
    else if (isEligibleForIncentiveUpdate === false) {
        incentiveStatusText.textContent = 'Incentive Eligible Status: No'; // participant is not eligible to be updated
        dateOfEligibilityText.textContent = `Date of Eligibility: ${humanReadableMDYTimeZoneOffset(participant[paymentRound][baseline][baselinePaymentDate])}`; // TODO: Add flexibility for other payment rounds
        // dateOfEligibilityInput.textContent = setIncentiveEligibleInputDefaultValue(); // do i need to update the time again for default?
        isIncentiveEligbleNote.innerHTML = `<span><i class="fas fa-check-square fa-lg" style="color: #4CAF50; background: white;"></i> This participant is already incentive eligible.</span>`;

    } else {
        incentiveStatusText.textContent = 'Incentive Eligible Status: '; // participant is not eligible to be updated
        dateOfEligibilityText.textContent = 'Date of Eligibility:';
        dateOfEligibilityInput.textContent = setIncentiveEligibleInputDefaultValue(); // do i need to update the time again for default?
    }

}
    

const setIncentiveEligibleInputDefaultValue = () => { 
    const dateOfEligibilityInput = document.getElementById('dateOfEligibility');
    if (dateOfEligibilityInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        dateOfEligibilityInput.value = formattedDate;
        dateOfEligibilityInput.max = formattedDate;
        // dateOfEligibilityInput.disabled = false;
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
    if (!clearButton) return;
    const isIncentiveEligibleNote = document.getElementById('isIncentiveEligbleNote');
    if (!isIncentiveEligibleNote) return;
    const selectButton = document.querySelector('.selectButton');
    if (!selectButton) return;
    const dateOfEligibilityInput = document.getElementById('dateOfEligibility');
    if (!dateOfEligibilityInput) return;

    clearButton.addEventListener('click', () => {
        setParticipantPaymentRound();
        dateOfEligibilityInput.disabled = false;
    });
};

const setParticipantPaymentRound = () => { 
    const clearButton = document.getElementById('clearPaymentRoundButton');
    if (!clearButton) return;
    const isIncentiveEligibleNote = document.getElementById('isIncentiveEligbleNote');
    if (!isIncentiveEligibleNote) return;
    const selectButton = document.querySelector('.selectButton');
    if (!selectButton) return;

    isIncentiveEligibleNote.textContent = '';
    selectButton.textContent = ' Select ';
    participantPaymentRound = null;
    setIncentiveEligibleInputDefaultValue();
}

const toggleSubmitButton = (isEligibleForIncentiveUpdate) => { 
    // console.log("🚀 ~ toggleSubmitButton ~ isEligibleForIncentiveUpdate:", isEligibleForIncentiveUpdate)
    const submitButton = document.getElementById('submitButton');
    // submitButton.disabled = true;
    if (submitButton) {
        if (isEligibleForIncentiveUpdate) {
            submitButton.removeAttribute('disabled');
        } else {
            submitButton.disabled = true;
        }
    }
};

const handleSubmitButton = (participant) => { 
    const confirmButton = document.getElementById('confirmUpdateEligibility');
    const dateOfEligibilityInput = document.getElementById('dateOfEligibility');
    
    const selectedDateValue = convertToISO8601(dateOfEligibilityInput.value);
    console.log("🚀 ~ handleSubmitButton ~ selectedDateValue:", selectedDateValue)
    if (confirmButton && dateOfEligibilityInput) {
        setupModalContent(participantPaymentRound);
        confirmButton.addEventListener('click', async (e) => {
            const confirmUpdateEligibilityButton = document.getElementById('confirmUpdateEligibility');
            if (confirmUpdateEligibilityButton) {
                try {
                    showAnimation();
                    const updateResponse = await updateParticipantIncentiveEligibility(participant, participantPaymentRound, selectedDateValue)
                    hideAnimation();
                    console.log("🚀 ~ submitButton.addEventListener ~ updateResponse:", updateResponse)

                    if (updateResponse.code === 200) { 
                        triggerNotificationBanner("Participant incentive eligibility status updated successfully!", "success" ,10000);
                    }
                } catch (error) { 
                    console.error("Failed to update participant incentive eligibility: ", error);
                    triggerNotificationBanner(`${error.message}`, 'danger', 10000);
                } 
            }
        });
    }
}


// Convert ISO to human readable date, adjusting for timezone
const humanReadableMDYTimeZoneOffset = (participantDate) => {
    if (!participantDate) return 'N/A';
    const date = new Date(participantDate);
    // Add timezone offset to prevent date shift
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.toLocaleDateString();
};


const setupModalContent = (participantPaymentRound) => {
    const paymentRoundType = conceptIdToPaymentRoundMapping[participantPaymentRound];
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;
    modalBody.textContent = `Are you sure you want to update the participant's incentive eligibility status for ${paymentRoundType}?`;
}

/**
 * Check if participant is already incentive eligible (Flags)
 * Async function to check if participant is already incentive eligible (Flags) and will return incentive eligilbility status and participant data
 * @param {Object} participant - Participant object
 * @param {String} selectedPaymentRound - Selected payment round  
 * @returns {Object} - Response object { isEligibleForIncentive: Boolean, participantData: Object }
*/
const checkParticipantForEligibleIncentive = async (participant, selectedPaymentRound) => { 
    // Check if participant is already incentive eligible (Flags) AND other incentive eligible conditions
    // if yes, display message and disable input fields
    // if no, enable input fields
    
    const participantObj = participant;
    const connectId = participantObj['Connect_ID'];

    try {
        const idToken = await getIdToken();
        const response = await fetch(`${baseAPI}/dashboard?api=checkParticipantForEligibleIncentive&connectId=${connectId}&currentPaymentRound=${selectedPaymentRound}`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + idToken,
                "Content-Type": "application/json"
            },
        });
        if (!response.ok) {
            const error = (response.status + " Error" + ": " + (await response.json()).message);
            throw new Error(error);
        }

        const responseObj = await response.json();
        console.log("🚀 ~ checkParticipantForEligibleIncentive ~ responseObj:", responseObj)
        return responseObj;
    } catch (error) {
        console.error("Failed to check partipant Eligibility: ", error);
        throw error;
    }
};


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
    const participantObj = participant;
    const connectId = participantObj['Connect_ID'];

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
                dateOfEligibility: selectedDateValue // ISO8601 date format
            }),
        });
        if (!response.ok) {
            const error = (response.status + " Error" + ": " + (await response.json()).message);
            throw new Error(error);
        }

        const responseObj = await response.json();
        console.log("🚀 ~ updateParticipantIncentiveEligibility ~ responseObj:", responseObj)
        return responseObj;
    } catch (error) { 
        console.error("Failed to update participant incentive eligibility: ", error);
        throw error;
    }
};
