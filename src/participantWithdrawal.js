import { dashboardNavBarLinks, removeActiveClass } from './navigationBar.js';
import fieldMapping from './fieldToConceptIdMapping.js';
import { renderParticipantHeader, getParticipantStatus, getParticipantSuspendedDate } from './participantHeader.js';
import { renderParticipantWithdrawalLandingPage, viewOptionsSelected, proceedToNextPage, autoSelectOptions, addEventMonthSelection } from './participantWithdrawalForm.js'


export const renderParticipantWithdrawal = (participant) => {
    if (participant !== undefined) {
        const isParent = localStorage.getItem('isParent')
        document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks(isParent);
        removeActiveClass('nav-link', 'active');
        document.getElementById('participantWithdrawalBtn').classList.add('active');
        mainContent.innerHTML = render(participant);
        autoSelectOptions();
        viewOptionsSelected();
        proceedToNextPage();
        addEventMonthSelection('UPMonth', 'UPDay');
        checkPreviousWithdrawalStatus(participant);
    }
}


export const render = (participant) => {
    localStorage.setItem('token', participant.token)
    let template = `<div class="container-fluid">`
    if (!participant) {
        template +=` 
            <div id="root">
            Please select a participant first!
            </div>
        </div>
         `
    } else {
        template += `
                <div id="root root-margin">
                    ${renderParticipantHeader(participant)}
                    <div id="alert_placeholder"></div>
                    <div id="formMainPage">
                    ${renderParticipantWithdrawalLandingPage()}
                    </div>
                </div>
                `;
    }
    return template;
}

const checkPreviousWithdrawalStatus = (participant) => {
    let template = ``;
    let alertList = document.getElementById('alert_placeholder');
    if (participant[fieldMapping.participationStatus] !== fieldMapping.noRefusal && participant[fieldMapping.participationStatus] !== ``) {
        localStorage.setItem('participationStatus', true)
        template += `<div class="alert alert-warning alert-dismissible fade show" role="alert">
                        Previously Selected Refusal Option(s): <b> ${getParticipantSelectedRefusals(participant)} </b>
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>`
    } else if (participant[fieldMapping.suspendContact] !== "" && participant[fieldMapping.suspendContact] !== ``) {
        localStorage.setItem('suspendContact', true)
        template += `<div class="alert alert-warning alert-dismissible fade show" role="alert">
                        <b> ${getParticipantSuspendedDate(participant)} </b>
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>`
    }
    alertList.innerHTML = template;
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
