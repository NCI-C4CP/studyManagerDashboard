import fieldMapping from './fieldToConceptIdMapping.js';
import { showAnimation, hideAnimation, baseAPI, getIdToken, escapeHTML } from './utils.js';
import { renderRefusalOptions, renderCauseOptions } from './participantWithdrawalRender.js';

export const renderWithdrawalForm = (participant) => {
    if (!participant) {
        participant = JSON.parse(localStorage.getItem("participant"));
    }
    let template = ``;
    template = `        
                <div class="row">
                    <div class="col-md-6">
                        <h6><b><u>Refusal of Study Activites</u></b></h6>
                        <span class="withdrawal-form-span"><i>Select all that apply</i></span>
                        <br />
                        <div class="withdrawal-form-div">
                            <b>Baseline Activities</b>
                            <div class="withdrawal-form-div" style="left: 20px">
                                <div class="form-check">
                                    <span><i><b>Surveys</b></i></span>
                                    <br />
                                    <input class="form-check-input" name="options" type="checkbox" value="Initial Survey​" 
                                    data-optionkey=${fieldMapping.refusedSurvey} id="initialSurveyCheck">
                                    <label class="form-check-label" for="initialSurveyCheck">
                                        Initial Survey​
                                    </label>
                                </div>
                                <br />
                                <div class="form-check">
                                    <span><i><b>Specimen Donations</b></i></span>
                                    <br />
                                    <input class="form-check-input" name="options" type="checkbox" value="Baseline Blood Donation" 
                                    data-optionkey=${fieldMapping.refusedBlood} id="baselineBloodDonationCheck">
                                    <label class="form-check-label" for="baselineBloodDonationCheck">
                                        Baseline Blood Donation
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" name="options" type="checkbox" value="Baseline Urine Donation" 
                                    data-optionkey=${fieldMapping.refusedUrine} id="baselineUrineDonationCheck">
                                    <label class="form-check-label" for="baselineUrineDonationCheck">
                                        Baseline Urine Donation
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" name="options" type="checkbox" value="Baseline Mouthwash (Saliva) Donation" 
                                    data-optionkey=${fieldMapping.refusedMouthwash} id="baselineMouthwashDonationCheck">
                                    <label class="form-check-label" for="baselineMouthwashDonationCheck">
                                        Baseline Mouthwash (Saliva) Donation
                                    </label>
                                </div>
                                <br />
                                <div class="form-check">
                                    <span><i><b>Specimen Surveys</b></i></span>
                                    <br />
                                    <input class="form-check-input" name="options" type="checkbox" value="Baseline Specimen Surveys" 
                                    data-optionkey=${fieldMapping.refusedSpecimenSurveys} id="baselineSpecimenSurveyCheck">
                                    <label class="form-check-label" for="baselineSpecimenSurveyCheck">
                                        Baseline Specimen Surveys
                                    </label>
                                </div>
                            </div>
                        </div>
                        <br />
                        <div class="withdrawal-form-div">
                            <b>Follow Up Activities</b>
                            <div class="withdrawal-form-div" style="left: 20px">
                                <div class="form-check">
                                    <span><i><b>Surveys</b></i></span>
                                    <br />
                                    <input class="form-check-input" name="options" type="checkbox" value="Quality of Life 3-Mo Survey (but willing to do other future surveys)" 
                                    data-optionkey=${fieldMapping.refusedQualityOfLifeSurvey} id="refusedQualityOfLifeSurveyCheck">
                                    <label class="form-check-label" for="refusedQualityOfLifeSurveyCheck">
                                        Quality of Life 3-Mo Survey (but willing to do other future surveys)
                                    </label>
                                    <br />
                                    <input class="form-check-input" name="options" type="checkbox" value="All future QOL Surveys (but willing to do other future surveys)" 
                                    data-optionkey=${fieldMapping.refusedAllFutureQualityOfLifeSurveys} id="refusedAllFutureQualityOfLifeSurveysCheck">
                                    <label class="form-check-label" for="refusedAllFutureQualityOfLifeSurveysCheck">
                                        All future QOL Surveys (but willing to do other future surveys)
                                    </label>
                                    <br />
                                    <input class="form-check-input" name="options" type="checkbox" value="Refused 2024 Connect Experience Survey (but willing to do other future surveys)" 
                                    data-optionkey=${fieldMapping.refusedExperienceSurvey} id="refusedExperienceSurveyCheck">
                                    <label class="form-check-label" for="refusedExperienceSurveyCheck">
                                        2024 Connect Experience Survey (but willing to do other future surveys)
                                    </label>
                                    <br />
                                    <input class="form-check-input" name="options" type="checkbox" value="Cancer Screening History Survey (but willing to do other future surveys)"
                                    data-optionkey=${fieldMapping.refusedCancerScreeningHistorySurvey} id="refusedCancerScreeningHistorySurveyCheck">
                                    <label class="form-check-label" for="refusedCancerScreeningHistorySurveyCheck">
                                        Cancer Screening History Survey (but willing to do other future surveys)
                                    </label>
                                    <br />
                                    <input class="form-check-input" name="options" type="checkbox" value="All future Connect Experience Surveys (but willing to do other future surveys)" 
                                    data-optionkey=${fieldMapping.refusedAllFutureExperienceSurveys} id="refusedAllFutureExperienceSurveysCheck">
                                    <label class="form-check-label" for="refusedAllFutureExperienceSurveysCheck">
                                        All future Connect Experience Surveys (but willing to do other future surveys)
                                    </label>
                                    <br />
                                    <input class="form-check-input" name="options" type="checkbox" value="All future surveys (willing to do specimens)" 
                                    data-optionkey=${fieldMapping.refusedFutureSurveys} id="allFutureSurveysCheck">
                                    <label class="form-check-label" for="allFutureSurveysCheck">
                                        All future surveys (willing to do specimens)​
                                    </label>
                                </div>
                                <br />
                                <div class="form-check">
                                    <span><i><b>Specimen Donations and Specimen Surveys</b></i></span>
                                    <br />
                                    <input class="form-check-input" name="options" type="checkbox" value="All future specimens (willing to do surveys)" 
                                    data-optionkey=${fieldMapping.refusedFutureSamples} id="allFutureSpecimensCheck">
                                    <label class="form-check-label" for="allFutureSpecimensCheck">
                                        All future specimens (willing to do surveys)​
                                    </label>
                                </div>
                                <br />
                                <div class="form-check">
                                    <span><i><b>All Follow Up Activities</b></i></span>
                                    <br />
                                    <input class="form-check-input" name="options" type="checkbox" value="All Future Study Activities" 
                                    data-optionkey=${fieldMapping.refusedAllFutureActivities} id="allFutureStudyActivitiesCheck">
                                    <label class="form-check-label" for="allFutureStudyActivitiesCheck">
                                        All Future Study Activities​
                                    </label>
                                </div>
                            </div>
                        </div>
                        <br />
                        <h6><b><u>Revocation and Withdrawal Options</u></b></h6>
                        <span class="withdrawal-form-span"><i>Select all that apply</i></span>
                        <br />
                        <div class="withdrawal-form-div form-check">
                            <input class="form-check-input" name="options" type="checkbox"
                            value="Revoke HIPAA Authorization"
                            data-optionkey=${fieldMapping.revokeHIPAA} id="revokeHipaaAuthorizationCheck" ${participant && (participant[fieldMapping.revokeHIPAA] === fieldMapping.yes || participant[fieldMapping.withdrawConsent] === fieldMapping.yes || participant[fieldMapping.destroyData] === fieldMapping.yes) ? 'disabled' : ''}>
                            <label class="form-check-label" for="revokeHipaaAuthorizationCheck">
                                Revoke HIPAA Authorization
                            </label>
                        </div>
                        <div class="withdrawal-form-div form-check">
                            <input class="form-check-input" name="options" type="checkbox" value="Withdraw Consent" 
                            data-optionkey=${fieldMapping.withdrawConsent} id="withdrawConsentCheck" ${participant && (participant[fieldMapping.withdrawConsent] === fieldMapping.yes || participant[fieldMapping.destroyData] === fieldMapping.yes) ? 'disabled' : ''}>
                            <label class="form-check-label" for="withdrawConsentCheck">
                                Withdraw Consent
                            </label>
                        </div>
                        <div class="withdrawal-form-div form-check">
                            <input class="form-check-input" name="options" type="checkbox" value="Destroy Data" 
                            data-optionkey=${fieldMapping.destroyData} id="destroyDataCheck" ${participant && participant[fieldMapping.destroyData] === fieldMapping.yes ? 'disabled' : ''}>
                            <label class="form-check-label" for="destroyDataCheck">
                                    Destroy Data
                            </label>
                        </div>
                        <div class="withdrawal-form-div form-check">
                            <input class="form-check-input" name="options" id="participantDeceasedCheck" type="checkbox" 
                            data-optionkey=${fieldMapping.participantDeceased} value="Participant Deceased">
                            <label class="form-check-label" for="participantDeceasedCheck">
                                Participant Deceased
                            </label>
                        </div>
                        &nbsp;
                        <button type="button" class="btn btn-primary next-btn withdrawal-form-next-btn" id="nextFormPage">Next</button>
                    </div>
                    <div class="col-md-6">
                        <div class="row form-row">
                            <span> <b>
                                <u> Refusal/Withdrawal Requested By: </u> </b>
                            </span>
                            <div style="position:relative; left:10px; top:4px;">
                                <div class="form-check">
                                    <input type="radio" id="requestParticipant" name="whoRequested" value="The participant (via the CSC directly or via a Connect site staff)"
                                    data-optionkey=${fieldMapping.requestParticipant}>
                                    <label for="requestParticipant">The participant (via the CSC directly or via a Connect site staff)</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" id="requestPrincipalInvestigator" name="whoRequested" value="The Connect Principal Investigator (or designate)"
                                    data-optionkey=${fieldMapping.requestPrincipalInvestigator}>
                                    <label for="requestPrincipalInvestigator">The Connect Principal Investigator (or designate)</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" id="requestConnectIRB" name="whoRequested" value="Chair of the NIH IRB/Compliance Office/OHSRP"
                                    data-optionkey=${fieldMapping.requestConnectIRB}>
                                    <label for="requestConnectIRB">Chair of the NIH IRB/Compliance Office/OHSRP</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" id="requestPIListed" name="whoRequested" value="Site PI listed on the site-specific consent form"
                                    data-optionkey=${fieldMapping.requestPIListed}>
                                    <label for="requestPIListed">Site PI listed on the site-specific consent form</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" id="requestChairSite" name="whoRequested" value="Chair of the Site IRB"
                                    data-optionkey=${fieldMapping.requestChairSite}>
                                    <label for="requestChairSite">Chair of the Site IRB</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" id="requestOther" name="whoRequested" value="Other (specify):"
                                    data-optionkey=${fieldMapping.requestOther}>
                                    <label for="requestOther">Other (specify):</label>
                                    <input type="text" id="requestOtherText" name="requestOtherText" data-optionkey=${fieldMapping.requestOtherText}><br>
                                </div>
                            </div>
                        </div>
                        <div class="row form-row">
                        <span> <b>
                            <u> SUPERVISOR USE ONLY​ </u><br />
                            <b> Suspend all contact with participant until: </b> <br />
                            <div class="form-group row">
                            <label class="col-md-4 col-form-label">Month</label>
                            <select id="suspendContactUntilMonth" class="form-control required-field col-md-4" data-error-required='Please select your month.'>
                                <option class="option-dark-mode" value="">Select month</option>
                                <option class="option-dark-mode" value="01">1 - January</option>
                                <option class="option-dark-mode" value="02">2 - February</option>
                                <option class="option-dark-mode" value="03">3 - March</option>
                                <option class="option-dark-mode" value="04">4 - April</option>
                                <option class="option-dark-mode" value="05">5 - May</option>
                                <option class="option-dark-mode" value="06">6 - June</option>
                                <option class="option-dark-mode" value="07">7 - July</option>
                                <option class="option-dark-mode" value="08">8 - August</option>
                                <option class="option-dark-mode" value="09">9 - September</option>
                                <option class="option-dark-mode" value="10">10 - October</option>
                                <option class="option-dark-mode" value="11">11 - November</option>
                                <option class="option-dark-mode" value="12">12 - December</option>
                            </select>
                        </div>
                        <div class="form-group row">
                            <label class="col-md-4 col-form-label">Day</label>
                            <select class="form-control required-field col-md-4" data-error-required='Please select your day.' id="suspendContactUntilDay"></select>
                        </div>
                        <div class="form-group row">
                            <label class="col-md-4 col-form-label">Year</label>
                            <input type="text" class="form-control required-field input-validation col-md-4" data-error-required='Please select your year.' data-validation-pattern="year" data-error-validation="Your year must contain four digits in the YYYY format." maxlength="4" id="suspendContactUntilYear" list="yearsOption" title="Year, must be in 1900s" Placeholder="Enter year">
                            <datalist id="yearsOption"></datalist>
                        </div>
                        </span>
                    </div>
                </div>`;
           
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

const clearDateValidationErrors = () => {
    const monthSelect = document.getElementById('suspendContactUntilMonth');
    const daySelect = document.getElementById('suspendContactUntilDay');
    const yearInput = document.getElementById('suspendContactUntilYear');
    
    if (monthSelect) monthSelect.classList.remove('is-invalid');
    if (daySelect) daySelect.classList.remove('is-invalid');
    if (yearInput) yearInput.classList.remove('is-invalid');
    
    const causeOfDeathMonth = document.getElementById('causeOfDeathMonth');
    const causeOfDeathDay = document.getElementById('causeOfDeathDay');
    const causeOfDeathYear = document.getElementById('causeOfDeathYear');
    
    if (causeOfDeathMonth) causeOfDeathMonth.classList.remove('is-invalid');
    if (causeOfDeathDay) causeOfDeathDay.classList.remove('is-invalid');
    if (causeOfDeathYear) causeOfDeathYear.classList.remove('is-invalid');
    
    const validationMessage = document.getElementById('dateValidationMessage');
    if (validationMessage) validationMessage.remove();
};

const showDateValidationErrors = (error, isCauseOfDeathPage = false) => {
    let monthSelect, daySelect, yearInput;
    
    if (isCauseOfDeathPage) {
        monthSelect = document.getElementById('causeOfDeathMonth');
        daySelect = document.getElementById('causeOfDeathDay');
        yearInput = document.getElementById('causeOfDeathYear');

    } else {
        monthSelect = document.getElementById('suspendContactUntilMonth');
        daySelect = document.getElementById('suspendContactUntilDay');
        yearInput = document.getElementById('suspendContactUntilYear');
    }
    
    if (monthSelect) monthSelect.classList.add('is-invalid');
    if (daySelect) daySelect.classList.add('is-invalid');
    if (yearInput) yearInput.classList.add('is-invalid');
    
    let validationMessage = document.getElementById('dateValidationMessage');
    if (!validationMessage) {
        validationMessage = document.createElement('div');
        validationMessage.id = 'dateValidationMessage';
        validationMessage.className = 'invalid-feedback d-block';
        validationMessage.style.marginTop = '10px';
        
        const yearContainer = yearInput?.closest('.form-group');
        if (yearContainer) {
            yearContainer.appendChild(validationMessage);
        }
    }

    validationMessage.textContent = error;
};

export const addEventMonthSelection = (month, day, year) => {
    const selectedMonth = document.getElementById(month);
    const selectedDay = document.getElementById(day);
    const enteredYear = document.getElementById(year);

    if (!selectedMonth || !selectedDay || !enteredYear) {
        console.warn('Month or day or year elements not found for event listener setup');
        return;
    }
    
    selectedMonth.addEventListener('change', () => {
        const value = selectedMonth.value;

        const selectedDay = document.getElementById(day);
        if (!selectedDay) return;

        let template = '<option class="option-dark-mode" value="">Select day</option>';

        if(value === '02'){
            for(let i = 1; i < 30; i++){
                template += `<option class="option-dark-mode" value=${i < 10 ? `0${i}`: `${i}`}>${i}</option>`
            }
        }
        if(value === '01' || value === '03' || value === '05' || value === '07' || value === '08' || value === '10' || value === '12'){
            for(let i = 1; i < 32; i++){
                template += `<option class="option-dark-mode" value=${i < 10 ? `0${i}`: `${i}`}>${i}</option>`
            }
        }
        if(value === '04' || value === '06' || value === '09' || value === '11'){
            for(let i = 1; i < 31; i++){
                template += `<option class="option-dark-mode" value=${i < 10 ? `0${i}`: `${i}`}>${i}</option>`
            }
        }

        selectedDay.innerHTML = template;
        
        // Clear previous validation errors
        clearDateValidationErrors();
    });
}

export const autoSelectOptions = () => {
    const selectedDestroyData = document.getElementById('destroyDataCheck');
    const selectedPtWithdrawn = document.getElementById('withdrawConsentCheck');
    const selectedPtDeceased = document.getElementById('participantDeceasedCheck')
    if (selectedDestroyData) {
        selectedDestroyData.addEventListener('change', function(e) {
            //Sync the value of withdraw consent and revoke hippa to data destroy IF the checkboxes are not already disabled
            let dataDestroyChecked = e.target.checked;
            let withdrawCheckbox = document.getElementById('withdrawConsentCheck');
            if (!withdrawCheckbox.disabled) {
                withdrawCheckbox.checked = dataDestroyChecked;
            }
            let revokeHIPAACheckbox = document.getElementById('revokeHipaaAuthorizationCheck');
            if (!revokeHIPAACheckbox.disabled) {
                revokeHIPAACheckbox.checked = dataDestroyChecked;
            }
          });
    }
    if (selectedPtWithdrawn) {
        selectedPtWithdrawn.addEventListener('change', function() {
            let checkedValue1 = document.getElementById('revokeHipaaAuthorizationCheck');
            checkedValue1.checked = true;
          });
    }
    if (selectedPtDeceased) {
        selectedPtDeceased.addEventListener('change', function() {
            disableEnableWhoRequested('requestParticipant')
            disableEnableWhoRequested('requestPrincipalInvestigator')
            disableEnableWhoRequested('requestConnectIRB')
            disableEnableWhoRequested('requestPIListed')
            disableEnableWhoRequested('requestChairSite')
            disableEnableWhoRequested('requestOther')
            disableEnableWhoRequested('requestOtherText')
          });
    }
}

const disableEnableWhoRequested = (id) => {
    let checkedValue = document.getElementById(id);
    checkedValue.disabled === true ? checkedValue.disabled = false : checkedValue.disabled = true
}

/**
 * Withdrawal Form Date Validation
 * @param {string} month 
 * @param {string} day 
 * @param {string} year 
 * @param {string} validationType - 'suspend' or 'causeOfDeath'
 * @param {boolean} isRequired - whether the date is required (default: false for suspend, true for causeOfDeath)
 * @returns {object} - { isValid: boolean, error: string }
 */
const validateDate = (month, day, year, validationType = 'suspend', isRequired = false) => {
    // Determine if this date is required based on validation type and explicit requirement
    const dateIsRequired = isRequired || validationType === 'causeOfDeath';
    
    // If all date fields are empty
    if (!month && !day && !year) {
        return dateIsRequired
            ? { isValid: false, error: 'Date is required. Please enter month, day, and year.' }
            : { isValid: true, error: null };
    }
    
    // Require completion on partially filled dates
    if (!month || !day || !year) {
        return { isValid: false, error: 'Please complete all date fields (month, day, and year).' };
    }
    
    // Validate. Suspend contact date must be in the future. Cause of death date must be today or earlier.
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    if (selectedDate.getMonth() !== month - 1 || selectedDate.getDate() !== parseInt(day)) {
        return { isValid: false, error: 'Please enter a valid date.' };
    }
    
    if (validationType === 'suspend') {
        if (selectedDate <= today) {
            return { isValid: false, error: 'Suspend contact date must be after today\'s date.' };
        }

    } else if (validationType === 'causeOfDeath') {
        if (selectedDate > today) {
            return { isValid: false, error: 'Date of death cannot be in the future.' };
        }
    }
    
    return { isValid: true, error: null };
};

// Store the current event handler reference to allow proper removal
let currentNextHandler = null;

export const viewOptionsSelected = () => {
    const nextFormPageEle = document.getElementById('nextFormPage');
        if (nextFormPageEle) {
            // Remove any existing listeners to prevent duplicates
            if (currentNextHandler) {
                nextFormPageEle.removeEventListener('click', currentNextHandler);
            }
            nextFormPageEle.addEventListener('click', handleNextButtonClick);
            currentNextHandler = handleNextButtonClick;
        }
}

const handleNextButtonClick = () => { 
    const selectedMonth = escapeHTML(document.getElementById('suspendContactUntilMonth').value);
    const selectedDay = escapeHTML(document.getElementById('suspendContactUntilDay').value);
    const enteredYear = escapeHTML(document.getElementById('suspendContactUntilYear').value);

    // Validate the suspend date (optional - can be empty)
    const dateValidation = validateDate(selectedMonth, selectedDay, enteredYear, 'suspend', false);
    if (!dateValidation.isValid) {
        showDateValidationErrors(dateValidation.error);
        return;
    }
    
    // Clear validation errors if validation passes
    clearDateValidationErrors();

    let suspendDate = selectedMonth +'/'+ selectedDay +'/'+ enteredYear;
    optionsHandler(suspendDate);
    
    // Manually show the modal since we removed Bootstrap auto-trigger
    const modal = document.getElementById('modalShowSelectedData');
    if (modal) {
        // Use Bootstrap 5's vanilla JS modal method to show it
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }
}

const optionsHandler = (suspendDate) => {
    
    const modalHeader = document.getElementById('modalHeader');
    const modalBody = document.getElementById('modalBody');
    const refusalWithdrawalCheckboxes = document.getElementsByName('options');
    const whoRequestedRadioButtons = document.getElementsByName('whoRequested');

    // The 'who requested' field can be skipped if the participant is deceased
    let skipWhoRequested = false;

    // "Refusal of study activities", "Follow-up activities", and "Revocation and Withdrawal" options.
    let selectedRefusalWithdrawalCheckboxes = [];

    // "Refusal/Withdrawal Requested By:" - One radio selected. The array supports the 'other' radio + text input option.
    let selectedWhoRequestedRadios = [];

    let modalTemplate = '<div>';

    modalHeader.innerHTML = `<h5>Options Selected</h5><button type="button" id="closeModal" class="modal-close-btn" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>`;
    
    refusalWithdrawalCheckboxes.forEach(checkbox => { 
        if (checkbox.checked) {  
            selectedRefusalWithdrawalCheckboxes.push(checkbox);
            if (checkbox.value === 'Participant Deceased') {
                skipWhoRequested = true;
            }
            modalTemplate += `<span>${escapeHTML(checkbox.value)}</span> <br />` 
        }
    });

    const requestOtherText = document.getElementById('requestOtherText');
    requestOtherText.value && selectedWhoRequestedRadios.push(requestOtherText);

    whoRequestedRadioButtons.forEach(x => { 
        if (x.checked) {  
            selectedWhoRequestedRadios.push(x);
            modalTemplate += `<span>Requested by: ${escapeHTML(x.value)} </span> ${requestOtherText && escapeHTML(requestOtherText.value)} </br>`
        }
    })
    
    const hasSuspendDate = suspendDate !== '//';
    const hasRequestedBySelection = selectedWhoRequestedRadios.length > 0;
    const hasAnySelections = selectedRefusalWithdrawalCheckboxes.length > 0;
    const canSkipRequestedBy = skipWhoRequested === true;
    let confirmSectionHtml = '';

    if (hasSuspendDate) modalTemplate += `<span>Suspend all contact on case until ${escapeHTML(suspendDate)}</span> <br />`

    if (canSkipRequestedBy || (hasSuspendDate && hasRequestedBySelection)) {
        confirmSectionHtml = ` <button type="button" class="btn btn-primary" data-dismiss="modal" target="_blank" id="proceedFormPage">Confirm</button>`;

    } else if (!hasAnySelections && !hasSuspendDate) {
        confirmSectionHtml = `<span style="color: red;"><b>Make a selection before proceeding!</b></span> <br />
             <button type="button" class="btn btn-secondary" data-dismiss="modal" target="_blank" id="proceedFormPage" disabled>Confirm</button>`;

    } else if (!hasRequestedBySelection) {
        confirmSectionHtml = `<span style="color: red;"><b>Select requested by before proceeding!</b></span> <br />
             <button type="button" class="btn btn-secondary" data-dismiss="modal" target="_blank" id="proceedFormPage" disabled>Confirm</button>`;

    } else {
        confirmSectionHtml = ` <button type="button" class="btn btn-primary" data-dismiss="modal" target="_blank" id="proceedFormPage">Confirm</button>`;
    }

    modalTemplate += `
        <div style="display:inline-block; margin-top:20px;">
        ${confirmSectionHtml}
            <button type="button" class="btn btn-danger" data-dismiss="modal" target="_blank">Cancel</button>
        </div>
    </div>`

    modalBody.innerHTML = modalTemplate;

    proceedToNextPage(selectedRefusalWithdrawalCheckboxes, selectedWhoRequestedRadios, suspendDate)
} 


// Event handler ref to prevent duplicates
let currentProceedHandler = null;

export const proceedToNextPage = (selectedRefusalWithdrawalCheckboxes, selectedWhoRequestedRadios, suspendDate) => {
    const proceedFormPageEle = document.getElementById('proceedFormPage');
    if (proceedFormPageEle) {

        if (currentProceedHandler) {
            proceedFormPageEle.removeEventListener('click', currentProceedHandler);
        }
        
        currentProceedHandler = () => {
            const checkedValue = document.getElementById('participantDeceasedCheck').checked;
            checkedValue ? causeOfDeathPage(selectedRefusalWithdrawalCheckboxes) : reasonForRefusalPage(selectedRefusalWithdrawalCheckboxes, selectedWhoRequestedRadios, suspendDate);
        };
        
        proceedFormPageEle.addEventListener('click', currentProceedHandler);
    }
}

const retainPreviouslySetOptions = (selectedRefusalWithdrawalCheckboxes, selectedWhoRequestedRadios, suspendDate) => {
    // Restore checkbox selections
    selectedRefusalWithdrawalCheckboxes && (
        selectedRefusalWithdrawalCheckboxes.forEach(checkbox => { 
            const checkedValue = document.getElementById(checkbox.id);
            if (checkedValue) {
                checkedValue.checked = true;
            }
        })
    )
    
    // Restore radio button selections
    selectedWhoRequestedRadios && (
        selectedWhoRequestedRadios.forEach(radioButton => { 
            const checkedValue = document.getElementById(radioButton.id);
            if (checkedValue) {
                if (checkedValue.type === 'radio') {
                    checkedValue.checked = true;
                } else if (checkedValue.type === 'text') {
                    checkedValue.value = radioButton.value;
                }
            }
        })
    )
    
    // Restore suspend date fields if provided
    if (suspendDate && suspendDate !== '//') {
        const [month, day, year] = suspendDate.split('/');
        const monthSelect = document.getElementById('suspendContactUntilMonth');
        const daySelect = document.getElementById('suspendContactUntilDay');
        const yearInput = document.getElementById('suspendContactUntilYear');
        
        // Restore month first (this will trigger the change event and populate days)
        if (monthSelect && month) {
            monthSelect.value = month;
            
            // Trigger the change event, then MutationObserver waits for the day dropdown to be populated
            monthSelect.dispatchEvent(new Event('change', { bubbles: true }));
            
            const observer = new MutationObserver((mutationsList, observer) => {
                for(const mutation of mutationsList) {
                    if (mutation.type === 'childList' && daySelect.options.length > 1) {
                        if (day) {
                            daySelect.value = day;
                        }

                        if (yearInput && year) {
                            yearInput.value = year;
                        }

                        observer.disconnect();
                        return;
                    }
                }
            });

            observer.observe(daySelect, { childList: true });
        }
    }
}

export const reasonForRefusalPage = (selectedRefusalWithdrawalCheckboxes, selectedWhoRequestedRadios, suspendDate) => {
    let source = 'page1'
    let renderContent = document.getElementById('formMainPage');
    let template = `
            <div class="modal fade" id="modalShowFinalSelectedData" data-keyboard="false" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
                        <div class="modal-content sub-div-shadow">
                            <div class="modal-header" id="modalHeader"></div>
                            <div class="modal-body" id="modalBody"></div>
                        </div>
                    </div>
            </div>`;

    template += renderRefusalOptions();

    renderContent.innerHTML =  template;
    document.getElementById('backToPrevPage').addEventListener('click', () => {
        renderContent.innerHTML = renderWithdrawalForm();
        
        // Make sure DOM is rendered
        requestAnimationFrame(() => {
            addEventMonthSelection('suspendContactUntilMonth', 'suspendContactUntilDay', 'suspendContactUntilYear');
            retainPreviouslySetOptions(selectedRefusalWithdrawalCheckboxes, selectedWhoRequestedRadios, suspendDate);
            autoSelectOptions();
            viewOptionsSelected();
        });
    })
    document.getElementById('submit').addEventListener('click', async () => {
        await handleResponseSubmission(selectedRefusalWithdrawalCheckboxes, selectedWhoRequestedRadios, source, suspendDate)
    })
}

export const causeOfDeathPage = (selectedRefusalWithdrawalCheckboxes) => {
    const source = 'causeOfDeath'
    let renderContent = document.getElementById('formMainPage');
    let template = ` <div class="modal fade" id="modalShowFinalSelectedData" data-keyboard="false" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
                        <div class="modal-content sub-div-shadow">
                            <div class="modal-header" id="modalHeader"></div>
                            <div class="modal-body" id="modalBody"></div>
                        </div>
                    </div>
            </div>`
    template += renderCauseOptions();
    renderContent.innerHTML =  template;
    addEventMonthSelection('causeOfDeathMonth', 'causeOfDeathDay', 'causeOfDeathYear')
    document.getElementById('backToPrevPage').addEventListener('click', () => {
        renderContent.innerHTML = renderWithdrawalForm();
        
        // Make sure DOM is rendered
        requestAnimationFrame(() => {
            addEventMonthSelection('suspendContactUntilMonth', 'suspendContactUntilDay', 'suspendContactUntilYear');
            retainPreviouslySetOptions(selectedRefusalWithdrawalCheckboxes, [], '//');
            autoSelectOptions();
            viewOptionsSelected();
        });
    })
    
    document.getElementById('submit').addEventListener('click', async() => {
        const causeOfDeathMonth = document.getElementById('causeOfDeathMonth').value;
        const causeOfDeathDay = document.getElementById('causeOfDeathDay').value;
        const causeOfDeathYear = document.getElementById('causeOfDeathYear').value;
        
        // Validate the cause of death date
        const dateValidation = validateDate(causeOfDeathMonth, causeOfDeathDay, causeOfDeathYear, 'causeOfDeath', true);
        if (!dateValidation.isValid) {
            showDateValidationErrors(dateValidation.error, true); // true -> cause of death page
            return;
        }

        clearDateValidationErrors();
        
        const suspendDate = causeOfDeathMonth +'/'+ causeOfDeathDay +'/'+ causeOfDeathYear
        await handleResponseSubmission(selectedRefusalWithdrawalCheckboxes, [], source, suspendDate)
    })
}

const handleResponseSubmission = async (selectedRefusalWithdrawalCheckboxes, selectedWhoRequestedRadios, source, suspendDate) => {
    let selectedReasonsForWithdrawal = []

    const otherReasonsInput = document.getElementById('otherReasonsInput');
    otherReasonsInput?.value && selectedReasonsForWithdrawal.push(otherReasonsInput);

    let checkboxes = document.getElementsByName('options');
    checkboxes.forEach(checkbox => { if (checkbox.checked) {  selectedReasonsForWithdrawal.push(checkbox)} });

    const completeRefusalData = processRefusalWithdrawalResponses(selectedReasonsForWithdrawal, selectedRefusalWithdrawalCheckboxes, selectedWhoRequestedRadios, source, suspendDate);

    try {
        const updatedParticipant = await sendRefusalWithdrawalResponses(completeRefusalData);
        localStorage.setItem('participant', JSON.stringify(updatedParticipant));
        navigateToParticipantSummary(updatedParticipant);

    } catch (error) {
        console.error('Error in handleResponseSubmission():', error);
        alert('An error occurred. Please try again.');
    }
}

const processRefusalWithdrawalResponses = (selectedReasonsForWithdrawal, selectedRefusalWithdrawalCheckboxes, selectedWhoRequestedRadios, source, suspendDate) => {
    let sendRefusalData = {};
    let highestStatus = [];
    sendRefusalData[fieldMapping.refusalOptions] = {};
    selectedRefusalWithdrawalCheckboxes.forEach(x => {
        if (parseInt(x.dataset.optionkey) === fieldMapping.refusedSurvey) {
            setRefusalTimeStamp(sendRefusalData, x.dataset.optionkey, fieldMapping.refBaselineSurveyTimeStamp);
        }
        else if (parseInt(x.dataset.optionkey) === fieldMapping.refusedBlood) {
            setRefusalTimeStamp(sendRefusalData, x.dataset.optionkey, fieldMapping.refBaselineBloodTimeStamp);
        }
        else if (parseInt(x.dataset.optionkey) === fieldMapping.refusedUrine) {
            setRefusalTimeStamp(sendRefusalData, x.dataset.optionkey, fieldMapping.refBaselineUrineTimeStamp);
        }
        else if (parseInt(x.dataset.optionkey) ===  fieldMapping.refusedMouthwash) {
            setRefusalTimeStamp(sendRefusalData, x.dataset.optionkey, fieldMapping.refBaselineMouthwashTimeStamp);
        }
        else if (parseInt(x.dataset.optionkey) ===  fieldMapping.refusedSpecimenSurveys) {
            setRefusalTimeStamp(sendRefusalData, x.dataset.optionkey, fieldMapping.refBaselineSpecimenSurveysTimeStamp);
        }
        else if (parseInt(x.dataset.optionkey) ===  fieldMapping.refusedFutureSurveys) {
            setRefusalTimeStamp(sendRefusalData, x.dataset.optionkey, fieldMapping.refBaselineAllFutureSurveysTimeStamp);
        }
        else if (parseInt(x.dataset.optionkey) ===  fieldMapping.refusedFutureSamples) {
            setRefusalTimeStamp(sendRefusalData, x.dataset.optionkey, fieldMapping.refBaselineAllFutureSpecimensTimeStamp);
        }
        else if (parseInt(x.dataset.optionkey) ===  fieldMapping.refusedQualityOfLifeSurvey) {
            setRefusalTimeStamp(sendRefusalData, x.dataset.optionkey, fieldMapping.refQualityOfLifeSurveyTimeStamp);
        }
        else if (parseInt(x.dataset.optionkey) ===  fieldMapping.refusedAllFutureQualityOfLifeSurveys) {
            setRefusalTimeStamp(sendRefusalData, x.dataset.optionkey, fieldMapping.refAllFutureQualityOfLifeSurveysTimeStamp);
        }
        else if (parseInt(x.dataset.optionkey) ===  fieldMapping.refusedExperienceSurvey) {
            setRefusalTimeStamp(sendRefusalData, x.dataset.optionkey, fieldMapping.refExperienceSurveyTimeStamp);
        }
        else if (parseInt(x.dataset.optionkey) ===  fieldMapping.refusedAllFutureExperienceSurveys) {
            setRefusalTimeStamp(sendRefusalData, x.dataset.optionkey, fieldMapping.refAllFutureExperienceSurveysTimeStamp);
        }
        else if (parseInt(x.dataset.optionkey) ===  fieldMapping.refusedCancerScreeningHistorySurvey) {
            setRefusalTimeStamp(sendRefusalData, x.dataset.optionkey, fieldMapping.refCancerScreeningHistorySurveyTimeStamp);
        }
        else {
            sendRefusalData[x.dataset.optionkey] = fieldMapping.yes
        }
    })

    if (selectedWhoRequestedRadios.length != 0) {
        // Find the radio button and text input (if it exists) from the array.
        // Standard options are radio buttons, the "Other" option is a radio button and text input.
        const selectedRadio = selectedWhoRequestedRadios.find(element => element.type === 'radio');
        const otherTextInput = selectedWhoRequestedRadios.find(element => element.type === 'text');
        
        if (selectedRadio) {
            if (otherTextInput && parseInt(selectedRadio.dataset.optionkey) === fieldMapping.requestOther) {
                sendRefusalData[fieldMapping.whoRequested] = fieldMapping.requestOther
                sendRefusalData[fieldMapping.requestOtherText] = otherTextInput.value
            } else {
                sendRefusalData[fieldMapping.whoRequested] = parseInt(selectedRadio.dataset.optionkey)
            }
        }
    }
    if (suspendDate !== '//' && source !== 'causeOfDeath') { 
        sendRefusalData[fieldMapping.suspendContact] = suspendDate
        sendRefusalData[fieldMapping.startDateSuspendedContact] = new Date().toISOString();
        sendRefusalData[fieldMapping.contactSuspended] = fieldMapping.yes
        updateWhoRequested(sendRefusalData, fieldMapping.whoRequestedSuspendedContact, fieldMapping.whoRequestedSuspendedContactOther)
    }

    const previousSuspendedStatus = localStorage.getItem('suspendContact');
    if (previousSuspendedStatus === 'true' && suspendDate === '//') sendRefusalData[fieldMapping.suspendContact] = ``
    localStorage.removeItem('suspendContact');

    const previousRefusalStatus = localStorage.getItem('participationStatus');
    if (previousRefusalStatus === 'true') {
        const prevParticipantStatusScore =   { "No Refusal": 0,
                                            "Refused some activities": 1,  
                                            "Refused all future activities": 2,
                                            "Revoked HIPAA only": 3,
                                            "Withdrew Consent": 4,
                                            "Destroy Data": 5,
                                            "Deceased": 6, }
        const participant = JSON.parse(localStorage.getItem('participant'));
        let prevParticipantStatusSelection = fieldMapping[participant[fieldMapping.participationStatus]]
        prevParticipantStatusSelection = prevParticipantStatusScore[prevParticipantStatusSelection]
        highestStatus.push(parseInt(prevParticipantStatusSelection))
    }

    if (previousRefusalStatus === 'true' && suspendDate !== '//') sendRefusalData[fieldMapping.participationStatus] = fieldMapping.noRefusal
    
    source === 'causeOfDeath'
        ? combineResponses(selectedReasonsForWithdrawal, sendRefusalData, suspendDate)
        : selectedReasonsForWithdrawal.forEach(input => {
            if (parseInt(input.dataset.optionkey) === fieldMapping.otherReasonsSpecify) {
                sendRefusalData[fieldMapping.otherReasonsSpecify] = input.value
            } else {
                sendRefusalData[input.dataset.optionkey] = fieldMapping.yes
            }
        })

    const statusConceptId = calculateParticipationStatus(selectedRefusalWithdrawalCheckboxes, highestStatus);
    
    if (selectedRefusalWithdrawalCheckboxes.length !== 0) sendRefusalData[fieldMapping.participationStatus] = statusConceptId
    
    if (statusConceptId === fieldMapping.withdrewConsent) {
        sendRefusalData[fieldMapping.dateWithdrewConsentRequested] = new Date().toISOString();
        updateWhoRequested(sendRefusalData, fieldMapping.whoRequestedWithdrewConsent, fieldMapping.whoRequestedWithdrewConsentOther)
    }
    if (statusConceptId === fieldMapping.destroyDataStatus) {
        sendRefusalData[fieldMapping.dateDataDestroyRequested] = new Date().toISOString();
        sendRefusalData[fieldMapping.dataDestroyCategorical] = fieldMapping.requestedDataDestroyNotSigned;
        sendRefusalData[fieldMapping.dataHasBeenDestroyed] = fieldMapping.no;
        updateWhoRequested(sendRefusalData, fieldMapping.whoRequestedDataDestruction, fieldMapping.whoRequestedDataDestructionOther)
    }
    if (statusConceptId === fieldMapping.revokeHIPAAOnly) {
        sendRefusalData[fieldMapping.dateHipaaRevokeRequested] = new Date().toISOString();
        updateWhoRequested(sendRefusalData, fieldMapping.whoRequestedHIPAArevocation, fieldMapping.whoRequestedHIPAArevocationOther)
    }
    if (statusConceptId === fieldMapping.refusedAll) {
        sendRefusalData[fieldMapping.refAllFutureActivitesTimeStamp] = new Date().toISOString(); 
        updateWhoRequested(sendRefusalData, fieldMapping.whoRequestedAllFutureActivities, fieldMapping.whoRequestedAllFutureActivitiesOther)
    } 
    if (statusConceptId === fieldMapping.refusedSome) {
        updateWhoRequested(sendRefusalData, fieldMapping.whoRequested, fieldMapping.requestOtherText)
    }

    let refusalObj = sendRefusalData[fieldMapping.refusalOptions]
    if (JSON.stringify(refusalObj) === '{}') delete sendRefusalData[fieldMapping.refusalOptions]

    sendRefusalData['token'] = localStorage.getItem("token");

    return sendRefusalData;
}

// Note: (updatedWhoRequested == [fieldMapping.whoRequested]) is always false...
const updateWhoRequested = (sendRefusalData, updatedWhoRequested, updatedWhoRequestedOther) => {
    (updatedWhoRequested == [fieldMapping.whoRequested]) ? (Object.assign(sendRefusalData, { [updatedWhoRequested] : { [updatedWhoRequested] : sendRefusalData[fieldMapping.whoRequested] }}))
    :  delete Object.assign(sendRefusalData, { [updatedWhoRequested] : { [updatedWhoRequested] : sendRefusalData[fieldMapping.whoRequested] }})[fieldMapping.whoRequested]
    
    if (sendRefusalData[fieldMapping.requestOtherText]) {
        Object.assign(sendRefusalData[updatedWhoRequested], { [updatedWhoRequestedOther] : sendRefusalData[fieldMapping.requestOtherText]})
        delete sendRefusalData[fieldMapping.requestOtherText]
    }
}

/**
 * Set the refusal time stamp for a given option
 * @param {Object} sendRefusalData - the refusal data object
 * @param {string} optionSelected - the option selected
 * @param {string} refusalOptionTimeStamp - the time stamp for the refusal option
 */
const setRefusalTimeStamp = (sendRefusalData, optionSelected, refusalOptionTimeStamp) =>{
    sendRefusalData[refusalOptionTimeStamp] = new Date().toISOString();
    sendRefusalData[fieldMapping.refusalOptions][optionSelected] = fieldMapping.yes
}

/**
 * Calculate the participation status based on selected options
 * @param {Array} selectedRefusalWithdrawalCheckboxes - array of selected options
 * @param {Array} highestStatus - array of status scores
 * @returns {string} - the participation status
 */
const calculateParticipationStatus = (selectedRefusalWithdrawalCheckboxes, highestStatus) => {
    selectedRefusalWithdrawalCheckboxes.forEach(x => {
        switch (x.value) {
            case "All Future Study Activities":
                highestStatus.push(2)
                break;
            case "Revoke HIPAA Authorization":
                highestStatus.push(3)
                break;
            case "Withdraw Consent":
                highestStatus.push(4)
                break;
            case "Destroy Data":
                highestStatus.push(5)
                break;
            case "Participant Deceased":
                highestStatus.push(6)
                break;
            default:
                highestStatus.push(1)
        }
    })
    highestStatus = highestStatus.filter( value => !Number.isNaN(value) ); // remove NaN from array
    let participationStatusScore = Math.max(...highestStatus);
    return fieldMapping[participationStatusScore.toString()];
}

const combineResponses = (selectedReasonsForWithdrawal, sendRefusalData, suspendDate) => {
    selectedReasonsForWithdrawal.forEach(x => {
        sendRefusalData[fieldMapping.sourceOfDeath] = parseInt(x.dataset.optionkey) })
    if (suspendDate !== '//') {
        sendRefusalData[fieldMapping.dateOfDeath] = suspendDate    
        sendRefusalData[fieldMapping.dateParticipantDeceasedSubmitted] = new Date().toISOString();
    }
}

async function sendRefusalWithdrawalResponses(sendRefusalData) {
    showAnimation();
    
    try {
        const idToken = await getIdToken();
        const refusalPayload = {
            "data": [sendRefusalData]
        };
        
        const response = await fetch(`${baseAPI}/dashboard?api=updateParticipantData`, {
            method: 'POST',
            body: JSON.stringify(refusalPayload),
            headers: {
                Authorization: "Bearer " + idToken,
                "Content-Type": "application/json"
            }
        });

        if (response.status !== 200) {
            throw new Error('Error updating participant data');
        }
        
        const participantResponse = await fetch(`${baseAPI}/dashboard?api=getFilteredParticipants&token=${sendRefusalData['token']}`, {
            method: 'GET',
            headers: {
                Authorization: "Bearer " + idToken,
                "Content-Type": "application/json"
            }
        });
        
        const participantJSON = await participantResponse.json();

        if (participantJSON.code !== 200) {
            console.error('Error:', participantJSON.code + ": " + participantJSON.message || 'No error message provided');
            throw new Error(`Error fetching participant data: ${participantJSON.message || 'Unknown error'}`);
        } else if (participantJSON.data.length !==1) {
            throw new Error(`Found ${participantJSON.data.length} participants. Expected one.`);
        }

        return participantJSON.data[0];

    } catch (error) {
        console.error('Error in sendRefusalWithdrawalResponses:', error);
        alert(`Error: ${error.message || 'An unexpected error occurred. Please try again.'}`);
        
    } finally {
        hideAnimation();
    }
}

const navigateToParticipantSummary = (participant) => {
    localStorage.setItem('participant', JSON.stringify(participant));
    location.replace(window.location.origin + window.location.pathname + '#participantSummary'); // updates url to participantSummary
}