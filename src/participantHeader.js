import fieldMapping from './fieldToConceptIdMapping.js';
import { humanReadableMDY } from './utils.js';
import { keyToNameObj } from './idsToName.js';

export const renderParticipantHeader = (participant) => {
  const readableVerificationDate = humanReadableMDY(participant[fieldMapping.verficationDate]);
  let verificationHtmlStr = "";
  if (participant[fieldMapping.verifiedFlag] === fieldMapping.verified) {
    verificationHtmlStr = `<span><b>Verified</b></span>: ${readableVerificationDate}`;
  } else if (participant[fieldMapping.verifiedFlag] === fieldMapping.cannotBeVerified) {
    verificationHtmlStr = `<span><b>Can't Be Verified</b></span>: ${readableVerificationDate}`;
  } else if (participant[fieldMapping.verifiedFlag] === fieldMapping.notYetVerified) {
    verificationHtmlStr = `<span><b>Not Yet Verified</b></span>: N/A`;
  } else if (participant[fieldMapping.verifiedFlag] === fieldMapping.duplicate) {
    verificationHtmlStr = `<span><b>Duplicate</b></span>: ${readableVerificationDate}`;
  } else {
    verificationHtmlStr = `<span><b>Outreach Timed Out</b></span>: ${readableVerificationDate}`;
  }

  return `
    <div class="alert alert-light" role="alert">
        <span><b>Connect_ID</b></span>: ${participant["Connect_ID"] || ""} &nbsp;
        <span><b>First Name</b></span>: ${participant[fieldMapping.fName] || ""} &nbsp;
        <span><b>Last Name</b></span>: ${participant[fieldMapping.lName] || ""} &nbsp;
        <span><b>DOB Yr</b></span>: ${participant[fieldMapping.birthYear] || ""} &nbsp;
        ${
          participant[fieldMapping.consentFlag] === fieldMapping.yes
          ? `<span><b>Consented</b></span>: ${humanReadableMDY(participant[fieldMapping.consentDate])}`
          : "<span><b>Not Consented</b></span>: N/A"
        } &nbsp;
        ${verificationHtmlStr} &nbsp;
        <span><b>Site</b></span>: ${renderSiteLocation(participant)} &nbsp;
        <span><b>Year(s) in Connect</b></span>: ${getYearsInConnect(participant)} &nbsp;
        <span><b>Participation Status</b></span>: ${getParticipantStatus(participant)} &nbsp;
        ${getParticipantSuspendedDate(participant)}
    </div>`;
}; 

// Year(s) in Connect : 1  
const getYearsInConnect = (participant) => {
    let timeProfileSubmitted = participant[fieldMapping.timeProfileSubmitted];
    let submittedYear = String(timeProfileSubmitted);
    submittedYear = submittedYear.split("-");
    submittedYear = parseInt(submittedYear[0]);
    const currentTime = new Date().toISOString();
    let currentYear = currentTime.split("-");
    currentYear = parseInt(currentYear[0]);
    let totalYears =  currentYear - submittedYear;
    totalYears <= 0 ? totalYears = '< 1' : totalYears;
    let yearsInConnect = totalYears;
    return typeof(yearsInConnect) !== 'string' && isNaN(yearsInConnect) ? 'N/A' : yearsInConnect;
};

const renderSiteLocation = (participant) => {
    const siteHealthcareProvider = participant[fieldMapping.healthcareProvider];
    return keyToNameObj[siteHealthcareProvider];
};

export const getParticipantStatus = (participant) => {
    if (typeof participant !== "string") {
        if (participant[fieldMapping.dataHasBeenDestroyed] === fieldMapping.yes)
            return "Data Destroyed";
        else if (participant[fieldMapping.participationStatus] !== undefined && participant[fieldMapping.participationStatus] !== ``) {
            const statusValue = participant[fieldMapping.participationStatus];
            return fieldMapping[statusValue];
        } else return `No Refusal`;
    }
};

export const getParticipantSuspendedDate = (participant) => {
    if (participant[fieldMapping.suspendContact] !== "" && participant[fieldMapping.suspendContact] !== undefined ) {
        let suspendContactRequestedFrom  = humanReadableMDY(participant[fieldMapping.startDateSuspendedContact]);
        let suspendedDate = participant[fieldMapping.suspendContact];
        return `<span><b>Suspended Contact </b></span>: From:  ${suspendContactRequestedFrom}  To:  ${suspendedDate}`;
    }

    return "";
};
