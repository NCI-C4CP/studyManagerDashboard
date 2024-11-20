import fieldMapping from '../fieldToConceptIdMapping.js';
import { dashboardNavBarLinks, removeActiveClass } from '../navigationBar.js';
// import { showAnimation, hideAnimation, baseAPI, getIdToken, getDataAttributes, triggerNotificationBanner } from './utils.js';
import { renderParticipantHeader } from '../participantHeader.js';

console.log('fieldMapping', fieldMapping);

let paymentRound = null;

const statusMappiong = {

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
    }

};


const renderIncentiveEligibilityToolContent = (participant) => { 
    return `<div id="root root-margin">
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
                                    <a class="dropdown-item" data-payment="baseline">Baseline</a>
                                </div>    
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col my-4">
                        <p>Date of Eligibility:</p>
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
                                <button type="button" class="btn btn-primary">Submit</button>
                            </div>
                        </div>
                    </div>
                </div>    
            </div>
        </div>`;
};


const handlePaymentRoundSelect = () => {
    const paymentRoundElement = document.getElementById('dropdownPaymentMenu');
    if (!paymentRoundElement) return;

    const dropdownPaymentOptions = paymentRoundElement.children;
    if (!dropdownPaymentOptions) return;

    const selectButton = document.querySelector('.selectButton');
    if (!selectButton) return;

    for (let option of dropdownPaymentOptions) {
        option.addEventListener('click', (e) => {
            paymentRound = e.target.dataset.payment;
            console.log("🚀 ~ option.addEventListener ~ paymentRound:", paymentRound)

            if (paymentRound === 'baseline') {
                selectButton.textContent = e.target.textContent;

            } else {
                selectButton.textContent = e.target.textContent;
            }
        });
    }
};

const updatePaymentRoundTextContent = (participant, selectedPaymentRound) => { 
    // if Eligibility Status is NO  add "no" to the incentive eligibile status text content
    // not eligibile put N/A for "Date of Eligibility"

    // if Eligibility Status is YES add "yes" to the incentive eligibile status text content
    // eligibile put "Date of Eligibility" value
    // Disable inputs and set value of input to the date of eligibility
    // Add note to page that participant is already incentive eligible
}


const handleBackToToolSelect = () => {
    const backToToolSelectButton = document.getElementById('backToToolSelect');
    if (!backToToolSelectButton) return;

    backToToolSelectButton.addEventListener('click', () => {
       location.hash = '#dataCorrectionsToolSelection';
    });
}



const setIncentiveEligibleInputDefaultValue = () => { 
    // const dateOfEligibility = document.getElementById('dateOfEligibility');
    // if (!dateOfEligibility) return;
    // const today = new Date().toLocaleDateString('en-CA');
    // dateOfEligibility.value = today;
    // dateOfEligibility.max = today;
    const dateOfEligibility = document.getElementById('dateOfEligibility');
    if (!dateOfEligibility) return;
    
    // Get date in user's timezone, but formatted as YYYY-MM-DD
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    dateOfEligibility.value = formattedDate;
    dateOfEligibility.max = formattedDate;
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




    /*
    Clear - Incentive Eligibility Status:
    - Payment Round: button text 
    - Date of Eligibility: input value to empty
    - Update date of eligibility: input value to today's date
    
    */ 
    clearButton.addEventListener('click', () => {
        isIncentiveEligibleNote.textContent = '';
        selectButton.textContent = 'Select';
        paymentRound = null;
        setIncentiveEligibleInputDefaultValue();
    });
};




// TODO: Add function to check if participant is already incentive eligible, display message and disable input fields
/*
Note participant is already incentive eligible 

<span>
    <i class="fas fa-check-square fa-lg" style="color: #4CAF50; background: white;"></i> 
    This participant is already incentive eligible.
</span>

*/ 