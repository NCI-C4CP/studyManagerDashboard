import { updateNavBar } from './navigationBar.js';
import fieldMapping from './fieldToConceptIdMapping.js';
import { renderParticipantHeader, getParticipantStatus, getParticipantSuspendedDate } from './participantHeader.js';
import { renderWithdrawalForm, viewOptionsSelected, proceedToNextPage, autoSelectOptions, addEventMonthSelection } from './participantWithdrawalForm.js';
import { uiState } from './stateManager.js';


export const renderParticipantWithdrawal = async (participant) => {
    const mainContent = document.getElementById('mainContent');
    updateNavBar('participantWithdrawalBtn');

    // Deny access if participant is duplicate. Provide warning message and nav buttons.
    if (participant[fieldMapping.verifiedFlag] === fieldMapping.duplicate) {
        mainContent.innerHTML = buildAccessDeniedTemplate(participant);

        document.getElementById('goToParticipantSummaryBtn').addEventListener('click', () => {
            window.location.hash = '#participantDetails/summary';
        });
        document.getElementById('goToParticipantDetailsBtn').addEventListener('click', () => {
            window.location.hash = '#participantDetails';
        });
        document.getElementById('goToParticipantLookupBtn').addEventListener('click', () => {
            window.location.hash = '#participantLookup';
        });
        return;
    }
    
    mainContent.innerHTML = buildWithdrawalTemplate(participant);
    autoSelectOptions();
    viewOptionsSelected();
    proceedToNextPage();
    addEventMonthSelection('suspendContactUntilMonth', 'suspendContactUntilDay', 'suspendContactUntilYear');
    await checkPreviousWithdrawalStatus(participant);
}

/**
 * Render participant withdrawal content for use in a tab
 * @param {object} participant - The participant object
 * @returns {Promise<string>} HTML string for withdrawal tab content
 */
export const renderWithdrawalTabContent = async (participant) => {
    if (!participant) {
        return '<div class="alert alert-warning">No participant data available</div>';
    }

    // Reset backdrops from prior visits
    if (typeof document !== 'undefined') {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((el) => el.remove());
    }

    // Check if participant is duplicate - deny access
    if (participant[fieldMapping.verifiedFlag] === fieldMapping.duplicate) {
        return `
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                <h4 class="alert-heading">Access Denied</h4>
                <p>Duplicate account. Withdrawal page is not accessible for this participant.</p>
            </div>
        `;
    }

    const content = `
        ${renderParticipantHeader(participant)}
        <div id="alert_placeholder"></div>
        <div id="formMainPage">
            ${renderWithdrawalForm()}
        </div>
    `;

    // Schedule event handlers to run after DOM is updated
    requestAnimationFrame(async () => {
        autoSelectOptions();
        viewOptionsSelected();
        proceedToNextPage();
        addEventMonthSelection('suspendContactUntilMonth', 'suspendContactUntilDay', 'suspendContactUntilYear');
        await checkPreviousWithdrawalStatus(participant);
    });

    return content;
};

export const buildAccessDeniedTemplate = (participant) => {
    return `
        <div class="container-fluid">
            <div id="root root-margin">
                ${renderParticipantHeader(participant)}
                <div class="alert alert-warning alert-dismissible fade show" role="alert">
                    <h4 class="alert-heading">Access Denied</h4>
                    <p>Duplicate account. Withdrawal page is not accessible for this participant.</p>
                </div>
                <div class="text-center">
                    <button type="button" class="btn btn-primary mt-3 mr-2" id="goToParticipantSummaryBtn">Participant Summary</button>
                    <button type="button" class="btn btn-secondary mt-3 mr-2" id="goToParticipantDetailsBtn">Participant Details</button>
                    <button type="button" class="btn btn-info mt-3" id="goToParticipantLookupBtn">Participant Lookup</button>
                </div>
            </div>
        </div>
    `;
}

export const buildWithdrawalTemplate = (participant) => {
    return `
        <div class="container-fluid">
            <div id="root root-margin">
                ${renderParticipantHeader(participant)}
                <div id="alert_placeholder"></div>
                <div id="formMainPage">
                  ${renderWithdrawalForm()}
                </div>
            </div>
        </div>`;
}

const checkPreviousWithdrawalStatus = async (participant) => {
    let template = ``;
    let alertList = document.getElementById('alert_placeholder');
    const withdrawalFlags = {
        hasPriorParticipationStatus: false,
        hasPriorSuspendedContact: false,
    };

    if (participant[fieldMapping.participationStatus] !== fieldMapping.noRefusal && participant[fieldMapping.participationStatus] !== ``) {
        withdrawalFlags.hasPriorParticipationStatus = true;
        template += `<div class="alert alert-warning alert-dismissible fade show" role="alert">
                        Previously Selected Refusal Option(s): <b> ${getParticipantSelectedRefusals(participant)} </b>
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>`
    } else if (participant[fieldMapping.suspendContact] !== "" && participant[fieldMapping.suspendContact] !== ``) {
        withdrawalFlags.hasPriorSuspendedContact = true;
        template += `<div class="alert alert-warning alert-dismissible fade show" role="alert">
                        <b> ${getParticipantSuspendedDate(participant)} </b>
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>`
    }

    alertList.innerHTML = template;
    await uiState.setWithdrawalStatusFlags(withdrawalFlags);
}

const getParticipantSelectedRefusals = (participant) => {
  let strArray = [];
  const refusalOptions = participant[fieldMapping.refusalOptions];

  if (refusalOptions) {
    if (refusalOptions[fieldMapping.refusedSurvey] === fieldMapping.yes) strArray.push("Initial Survey");
    if (refusalOptions[fieldMapping.refusedBlood] === fieldMapping.yes) strArray.push("Baseline Blood Donation");
    if (refusalOptions[fieldMapping.refusedUrine] === fieldMapping.yes) strArray.push("Baseline Urine Donation");
    if (refusalOptions[fieldMapping.refusedMouthwash] === fieldMapping.yes)
      strArray.push("Baseline Mouthwash (Saliva) Donation");
    if (refusalOptions[fieldMapping.refusedSpecimenSurveys] === fieldMapping.yes)
      strArray.push("Baseline Specimen Surveys");
    if (refusalOptions[fieldMapping.refusedFutureSamples] === fieldMapping.yes)
      strArray.push("All future specimens (willing to do surveys)");
    if (refusalOptions[fieldMapping.refusedQualityOfLifeSurvey] === fieldMapping.yes)
      strArray.push("Refused QOL survey 3-mo (but willing to do other future surveys)");
    if (refusalOptions[fieldMapping.refusedAllFutureQualityOfLifeSurveys] === fieldMapping.yes)
      strArray.push("Refused all future QOL surveys (but willing to do other future surveys)");
    if (refusalOptions[fieldMapping.refusedExperienceSurvey] === fieldMapping.yes)
      strArray.push("Refused 2024 Connect Experience Survey (but willing to do other future surveys)");
    if (refusalOptions[fieldMapping.refusedCancerScreeningHistorySurvey] === fieldMapping.yes)
      strArray.push("Refused Cancer Screening History Survey (willing to do specimens)");
    if (refusalOptions[fieldMapping.refusedAllFutureExperienceSurveys] === fieldMapping.yes)
      strArray.push("Refused all future Connect Experience surveys (but willing to do other future surveys)");
    if (refusalOptions[fieldMapping.refusedFutureSurveys] === fieldMapping.yes)
      strArray.push("All future surveys (willing to do specimens)");
  }

  if (participant[fieldMapping.refusedAllFutureActivities] === fieldMapping.yes)
    strArray.push("All Future Study Activities");
  if (participant[fieldMapping.revokeHIPAA] === fieldMapping.yes) strArray.push("Revoke HIPAA Authorization");
  if (participant[fieldMapping.withdrawConsent] === fieldMapping.yes) strArray.push("Withdraw Consent");
  if (participant[fieldMapping.destroyData] === fieldMapping.yes) strArray.push("Destroy Data");
  if (participant[fieldMapping.participantDeceased] === fieldMapping.yes) strArray.push("Participant Deceased");

  return strArray.join(", ");
};
