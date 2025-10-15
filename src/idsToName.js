import fieldMapping from './fieldToConceptIdMapping.js';
import { timestampValidation} from './utils.js';

export const keyToNameObj = 
{
    452412599 : "Kaiser Permanente Northwest",
    531629870 : "Health Partners",
    657167265 : "Sanford Health",
    548392715 : "Henry Ford Health System",
    303349821 : "Marshfield Clinic",
    125001209 : "Kaiser Permanente Colorado",
    809703864 : "University of Chicago Medicine",
    13 : "National Cancer Institute",
    300267574 : "Kaiser Permanente Hawaii",
    327912200 : "Kaiser Permanente Georgia",
    472940358: "Baylor Scott & White Health",
}

export const keyToShortNameObj = 
{
    452412599 : "KP NW",
    531629870 : "Health Partners",
    657167265 : "Sanford Health",
    548392715 : "Henry Ford Health System",
    303349821 : "Marshfield Clinic",
    125001209 : "KP CO",
    809703864 : "UofC Medicine",
    13 : "NCI",
    300267574 : "KP HI",
    327912200 : "KP GA",
    472940358: "Baylor Scott & White Health",
    1000: "All Sites"
}

export const nameToKeyObj = 
{
    "kpNW": 452412599,
    "hPartners" : 531629870,
    "snfrdHealth": 657167265,
    "hfHealth": 548392715,
    "maClinic": 303349821,
    "kpCO": 125001209,
    "uChiM": 809703864,
    "nci": 13,
    "kpHI": 300267574,
    "kpGA": 327912200,
    "BSWH": 472940358,
    "allResults": 1000
}

export const keyToVerificationStatus = {
    875007964 : 'Not yet verified',
    160161595 : 'Outreach timed out',
    197316935 : 'Verified',
    219863910 : 'Cannot be verified',
    922622075 : 'Duplicate',
    290379732 : 'No longer enrolling'
}

export const keyToDuplicateType = {
    638335430 : 'Active recruit signed in as Passive recruit',
    283434980 : 'Not Active recruit signed in as Passive recruit',
    866029623 : 'Not Active recruit signed in as an Active recruit',
    654558118 : 'Participant already enrolled',
    979256174 : 'Passive recruit signed in as Active recruit',
    696650324 : 'Change in eligibility status',
}

export const updateRecruitmentType = {
    132080040 : 'No Change Needed',
    604663208 : 'Not Active To Passive',
    854903954 : 'Passive To Active',
    965707001 : 'Active To Passive',
}

export const recruitmentType = {
    486306141 : 'Active',
    854703046 : 'Passive',
    180583933 : 'Inactive'
}

// Ordered headers that always appear in the participant results table
export const tableHeaderMap = new Map([
    [fieldMapping.fName, 'First Name (UP)'],
    [fieldMapping.mName, 'Middle Name (UP)'],
    [fieldMapping.lName, 'Last Name (UP)'],
    [fieldMapping.birthMonth, 'DOB Month'],
    [fieldMapping.birthDay, 'DOB Day'],
    [fieldMapping.birthYear, 'DOB Yr'],
    [fieldMapping.email, 'Pref Email'],
    ['Connect_ID', 'Connect ID'],
    [fieldMapping.healthcareProvider, 'Site'],
]);

// Bubbles that can be selected and added to the table.
// When selected, the CID is added to the importantColumns array and the heading name is fetched from the searchBubbleMap.
export const searchBubbleMap = new Map([
    ['Connect_ID', 'Connect ID'],
    ['pin', 'Pin'],
    ['token', 'Token'],
    ['studyId', 'Study ID'],
    [fieldMapping.timeStudyIdSubmitted, 'D/T Study ID Sub'],
    [fieldMapping.recruitmentType, 'Recruit Type'],
    [fieldMapping.recruitmentDate, 'D/T Recruit Type Assigned'],
    [fieldMapping.siteReportedAge, 'Site Reported Age'],
    [fieldMapping.siteReportedRace, 'Site Reported Race/Eth'],
    [fieldMapping.siteReportedSex, 'Site Reported Sex'],
    [fieldMapping.sanfordReportedSex, 'HFH Reported Sex'],
    [fieldMapping.sanfordReportedRace, 'SF Reported Race'],
    [fieldMapping.sanfordReportedEthnicity, 'SF Reported Eth'],
    [fieldMapping.henryFReportedRace, 'HFH Reported Race'],
    [fieldMapping.bswhReportedRaceEthnicity, 'BSWH Reported R/E'],
    [fieldMapping.campaignType, 'Campaign'],
    [fieldMapping.reinvitationCampaignType, 'Reinvitation Type'],
    [fieldMapping.reinvitationDate, 'D/T Reinvitation'],
    [fieldMapping.signedInFlag, 'Signed-in'],
    [fieldMapping.signinDate, 'D/T First Sign-in'],
    [fieldMapping.pinEntered, 'PIN Entered'],
    [fieldMapping.noPin, 'No PIN'],
    [fieldMapping.consentFlag, 'Consent Sub'],
    [fieldMapping.consentDate, 'D/T Consent Sub'],
    [fieldMapping.consentVersion, 'Consent Vers'],
    [fieldMapping.hipaaFlag, 'HIPAA Auth'],
    [fieldMapping.hipaaDate, 'D/T HIPAA Auth'],
    [fieldMapping.hipaaVersion, 'HIPAA Vers'],
    [fieldMapping.userProfileFlag, 'UP Sub'],
    [fieldMapping.userProfileDateTime, 'D/T UP Sub'],
    [fieldMapping.verifiedFlag, 'Verif Status'],
    [fieldMapping.verficationDate, 'D/T Verif'],
    [fieldMapping.automatedVerification, 'Auto Verif'],
    [fieldMapping.outreachRequiredForVerification, 'Outreach Required'],
    [fieldMapping.manualVerification, 'Manual Verif'],
    [fieldMapping.duplicateType, 'Dup Type'],
    [fieldMapping.firstNameMatch, 'First Name Match'],
    [fieldMapping.lastNameMatch, 'Last Name Match'],
    [fieldMapping.dobMatch, 'DOB Match'],
    [fieldMapping.pinMatch, 'PIN Match'],
    [fieldMapping.tokenMatch, 'Token Match'],
    [fieldMapping.zipCodeMatch, 'Zip Match'],
    [fieldMapping.siteMatch, 'Site Match'],
    [fieldMapping.ageMatch, 'Age Match'],
    [fieldMapping.cancerStatusMatch, 'Cx Status Match'],
    [fieldMapping.updateRecruitType, 'Update Recruit Type'],
    [fieldMapping.preConsentOptOut, 'Pre-consent Opt-out'],
    [fieldMapping.datePreConsentOptOut, 'D/T Pre-consent Opt-out'],
    [fieldMapping.maxNumContactsReached, 'Reached Max Contact N'],
    [fieldMapping.signInMechanism, 'Sign-In Mech'],
    [fieldMapping.consentFirstName, 'First Name (Consent)'],
    [fieldMapping.consentMiddleName, 'Middle Name (Consent)'],
    [fieldMapping.consentLastName, 'Last Name (Consent)'],
    [fieldMapping.accountName, 'Acct Name'],
    [fieldMapping.accountPhone, 'Phone Login'],
    [fieldMapping.accountEmail, 'Email Login'],
    [fieldMapping.prefName, 'Pref Name'],
    [fieldMapping.address1, 'Mailing Address Address Line 1'],
    [fieldMapping.address2, 'Mailing Address Address Line 2'],
    [fieldMapping.city, 'Mailing Address City'],
    [fieldMapping.state, 'Mailing Address State'],
    [fieldMapping.zip, 'Mailing Address Zip'],
    [fieldMapping.physicalAddress1, 'Phys Address Address Line 1'],
    [fieldMapping.physicalAddress2, 'Phys Address Address Line 2'],
    [fieldMapping.physicalCity, 'Phys Address City'],
    [fieldMapping.physicalState, 'Phys Address State'],
    [fieldMapping.physicalZip, 'Phys Address Zip'],
    [fieldMapping.email, 'Pref Email'],
    [fieldMapping.email1, 'Addtl Email 1'],
    [fieldMapping.email2, 'Addtl Email 2'],
    [fieldMapping.cellPhone, 'Mobile Phone'],
    [fieldMapping.homePhone, 'Home Phone'],
    [fieldMapping.otherPhone, 'Oth Phone'],
    [fieldMapping.altAddress1, 'Alt Add Line 1'],
    [fieldMapping.altAddress2, 'Alt Add Line 2'],
    [fieldMapping.altCity, 'Alt City'],
    [fieldMapping.altState, 'Alt State'],
    [fieldMapping.altZip, 'Alt Zip'],
    [fieldMapping.altContactFirstName, 'Alt Contact First Name'],
    [fieldMapping.altContactLastName, 'Alt Contact Last Name'],
    [fieldMapping.altContactMobilePhone, 'Alt Contact Cell Phone'],
    [fieldMapping.altContactHomePhone, 'Alt Contact Home Phone'],
    [fieldMapping.altContactEmail, 'Alt Contact Email'],
    [fieldMapping.previousCancer, 'Prev Cx'],
    [fieldMapping.allBaselineSurveysCompleted, 'All Base Surv Complete'],
    [fieldMapping.preferredLanguage, 'Preferred Language'],
    [fieldMapping.participationStatus, 'Participation Status'],
    [fieldMapping.bohStatusFlag1, 'Flag Base Mod BOH'],
    [fieldMapping.mreStatusFlag1, 'Flag Base Mod MRE'],
    [fieldMapping.sasStatusFlag1, 'Flag Base Mod SAS'],
    [fieldMapping.lawStatusFlag1, 'Flag Base Mod LAW'],
    [fieldMapping.ssnFullflag, 'Full SSN'],
    [fieldMapping.ssnPartialFlag, 'Part SSN'],
    [fieldMapping.refusedSurvey, 'Ref Base Survs'],
    [fieldMapping.refusedBlood, 'Ref Base Blood'],
    [fieldMapping.refusedUrine, 'Ref Base Ur'],
    [fieldMapping.refusedMouthwash, 'Ref Base MW'],
    [fieldMapping.refusedSpecimenSurveys, 'Ref Base Spec Surv'],
    [fieldMapping.refusedFutureSamples, 'Ref All Fut Samp'],
    [fieldMapping.refusedQualityOfLifeSurvey, 'Ref 3-mo QOL Surv'],
    [fieldMapping.refusedAllFutureQualityOfLifeSurveys, 'Ref All QOL Surv'],
    [fieldMapping.refusedCancerScreeningHistorySurvey, 'Ref Canc Scrn Hist Srv'],
    [fieldMapping.refusedExperienceSurvey, 'Ref 2024 Connect Exp Srv'],
    [fieldMapping.refusedAllFutureExperienceSurveys, 'Ref All Fut Connect Exp Srvs'],
    [fieldMapping.refusedFutureSurveys, 'Ref All Fut Surv'],
    [fieldMapping.refusedAllFutureActivities, 'Ref All Fut Activities'],
    [fieldMapping.revokeHIPAA, 'Revoke HIPAA'],
    [fieldMapping.dateHipaaRevokeRequested, 'D/T HIPAA Rev Req'],
    [fieldMapping.dateHIPAARevoc, 'D/T HIPAA Rev Signed'],
    [fieldMapping.withdrawConsent, 'Withdraw consent'],
    [fieldMapping.dateWithdrewConsentRequested, 'D/T Withdrew Consent'],
    [fieldMapping.participantDeceased, 'Participant Deceased'],
    [fieldMapping.dateOfDeath, 'Date Part Deceased'],
    [fieldMapping.destroyData, 'Data Dest'],
    [fieldMapping.dateDataDestroyRequested, 'D/T Data Dest Req'],
    [fieldMapping.dateDataDestroy, 'D/T Data Dest Signed'],
    [fieldMapping.suspendContact, 'Suspend Contact Until D/T'],
]);

const verificationStatusMapping = {
    [fieldMapping.notYetVerified]: 'Not Yet Verified',
    [fieldMapping.outreachTimedout]: 'Out Reach Timed Out',
    [fieldMapping.noLongerEnrolling]: 'No Longer Enrolling',
    [fieldMapping.verified]: 'Verified',
    [fieldMapping.cannotBeVerified]: 'Can Not Be Verified',
    [fieldMapping.duplicate]: 'Duplicate'
};

const participationStatusMapping = {
    [fieldMapping.noRefusal]: 'No Refusal',
    [fieldMapping.refusedSome]: 'Refused Some',
    [fieldMapping.refusedAll]: 'Refused All',
    [fieldMapping.revokeHIPAAOnly]: 'Revoke HIPAA Only',
    [fieldMapping.withdrewConsent]: 'Withdrew Consent',
    [fieldMapping.destroyDataStatus]: 'Destroy Data',
    [fieldMapping.deceased]: 'Deceased',
    [fieldMapping.dataDestroyed]: 'Data Destroyed'
};

const surveyStatusMapping = {
    [fieldMapping.submitted1]: 'Submitted',
    [fieldMapping.started1]: 'Started'
};

const ageRangeMapping = {
    [fieldMapping.ageRange1]: '30-34',
    [fieldMapping.ageRange2]: '35-39',
    [fieldMapping.ageRange3]: '40-45',
    [fieldMapping.ageRange4]: '46-50',
    [fieldMapping.ageRange5]: '51-55',
    [fieldMapping.ageRange6]: '56-60',
    [fieldMapping.ageRange7]: '61-65',
    [fieldMapping.ageRange8]: '66-70',
};

const sexMapping = {
    [fieldMapping.female]: 'Female',
    [fieldMapping.male]: 'Male'
};

const raceMapping = {
    // Sanford
    [fieldMapping.africanAmericanSH]: 'African American',
    [fieldMapping.americanIndianSH]: 'American Indian or Alaskan Native',
    [fieldMapping.asianSH]: 'Asian',
    [fieldMapping.whiteSH]: 'Caucasian/White',
    [fieldMapping.hispanicLBSH]: 'Hispanic/Latino/Black',
    [fieldMapping.hispanicLDSH]: 'Hispanic/Latino/Declined',
    [fieldMapping.hispanicLWSH]: 'Hispanic/Latino/White',
    [fieldMapping.nativeHawaiianSH]: 'Native Hawaiian/Pacific Islander',
    [fieldMapping.nativeHawaiianPISH]: 'Pacific Islander',
    [fieldMapping.blankSH]: 'Blank',
    [fieldMapping.declinedSH]: 'Declined',

    // HFH
    [fieldMapping.africanAmericanHF]: 'African American',
    [fieldMapping.whiteHF]: 'Caucasian/White',
    [fieldMapping.otherHF]: 'Other',

    // BSWH
    [fieldMapping.whiteNonHispanic]: 'White non-Hispanic',
    [fieldMapping.blackNonHispanic]: 'Black non-Hispanic',
    [fieldMapping.hispanicLatino]: 'Hispanic/Latino',
    [fieldMapping.asian]: 'Asian',
    [fieldMapping.americanIndianOrAlaskanNative]: 'American Indian or Alaskan Native',
    [fieldMapping.nativeHawaiianOrOtherPacificIslander]: 'Native Hawaiian or Other Pacific Islander',
    [fieldMapping.multiRacial]: 'Multi-racial',

    // Additional
    [fieldMapping.white]: 'White',
    [fieldMapping.other]: 'Other',
};

const ethnicityMapping = {
    // Sanford
    [fieldMapping.ethHispanicLatino]: "Hispanic or Latino",
    [fieldMapping.ethNotHispanicLatino]: "Not Hispanic or Latino",
    [fieldMapping.blankSH]: "Blank",
    [fieldMapping.declinedSH]: "Declined",
    [fieldMapping.unavailable]: "Unavailable/Unknown"
}

const campaignTypeMapping = {
    [fieldMapping.random]: 'Random',
    [fieldMapping.screeningAppointment]: 'Screening Appointment',
    [fieldMapping.nonScreeningAppointment]: 'Non Screening Appointment',
    [fieldMapping.demographicGroup]: 'Demographic Group',
    [fieldMapping.agingOutofStudy]: 'Aging Out of Study',
    [fieldMapping.geographicGroup]: 'Geographic Group',
    [fieldMapping.postScreeningAppointment]: 'Post Screening Appointment',
    [fieldMapping.technologyAdapters]: 'Technology Adapters',
    [fieldMapping.lowIncomeAreas]: 'Low Income Areas/Health Professional Shortage Areas',
    [fieldMapping.researchRegistry]: 'Research Registry',
    [fieldMapping.popUp]: 'Pop up',
    [fieldMapping.noneOftheAbove]: 'None of the Above',
    [fieldMapping.other]: 'Other'
};

const enrollmentStatusMapping = {
    [fieldMapping.signedInEnrollment]: 'Signed In',
    [fieldMapping.consentedEnrollment]: 'Consented',
    [fieldMapping.userProfileCompleteEnrollment]: 'User Profile Complete',
    [fieldMapping.verificationCompleteEnrollment]: 'Verification Complete',
    [fieldMapping.cannotBeVerifiedEnrollment]: 'Cannot Be Verified',
    [fieldMapping.verifiedMimimallyEnrolledEnrollment]: 'Verified Mimimally Enrolled',
    [fieldMapping.fullyEnrolledEnrollment]: 'Fully Enrolled'
};

const preferredLanguageMapping = {
    [fieldMapping.language.en]: 'English',
    [fieldMapping.language.es]: 'Spanish'
};

const duplicateTypeMapping = {
    [fieldMapping.notActiveSignedAsPassive]: 'Not Active recruit signed in as Passive recruit',
    [fieldMapping.alreadyEnrolled]: 'Already Enrolled',
    [fieldMapping.notActiveSignedAsActive]: 'Not Active recruit signed in as Active recruit',
    [fieldMapping.passiveSignedAsActive]: 'Passive recruit signed in as Active recruit',
    [fieldMapping.activeSignedAsPassive]: 'Active recruit signed in as Passive recruit',
    [fieldMapping.eligibilityStatusChanged]: 'Change in eligibility status'
};

const updateRecruitTypeMapping = {
    [fieldMapping.passiveToActive]: 'Passive To Active',
    [fieldMapping.activeToPassive]: 'Active To Passive',
    [fieldMapping.noChangeNeeded]: 'No Change Needed'
};

/**
 * Maps participant data to human-readable text based on concept ID.
 * Primary use: participant results table.
 * @param {string|number} rawValue - top level value from participant data.
 * @param {string|number} conceptID - the concept ID to map.
 * @param {Object} participant - the fetched participant object.
 * @returns {string} - the mapped text.
 */

export function participantConceptIDToTextMapping(rawValue, conceptID, participant) {

    // Handle Object type: display JSON
    if (typeof rawValue === 'object' && rawValue !== null) {
        try {
            return `<pre>${JSON.stringify(rawValue, undefined, 4)}</pre>`;
        } catch (e) {
            return `Error parsing JSON object: ${e.message}`;
        }
    }

    if (typeof conceptID === 'string' && !isNaN(conceptID)) {
        conceptID = parseInt(conceptID);
    }

    // cache state value when it's needed
    let stateValue = '';
    if (rawValue === null || rawValue === undefined) {
        stateValue = participant?.state?.[conceptID];
    }

    // Handle cases based on conceptID
    switch (conceptID) {
        // Healthcare Provider
        case fieldMapping.healthcareProvider:
            return keyToNameObj[rawValue] ?? '';

        // Account Phone
        case fieldMapping.accountPhone:
            return participant?.[fieldMapping.consentFlag] === fieldMapping.yes && fieldMapping.accountPhone in participant ? participant?.[fieldMapping.accountPhone] : 'N/A';

        // Account Email
        case fieldMapping.accountEmail:
            return participant?.[fieldMapping.consentFlag] === fieldMapping.yes && fieldMapping.accountEmail in participant && !rawValue?.toString().startsWith('noreply') ? participant?.[fieldMapping.accountEmail] : 'N/A';

        // Date Formatting
        case fieldMapping.signinDate:
        case fieldMapping.userProfileDateTime:
        case fieldMapping.consentDate:
        case fieldMapping.recruitmentDate:
        case fieldMapping.verficationDate:
        case fieldMapping.datePreConsentOptOut:
        case fieldMapping.studyIdTimeStamp:
        case fieldMapping.dateHipaaRevokeRequested:
        case fieldMapping.dateHIPAARevoc:
        case fieldMapping.dateWithdrewConsentRequested:
        case fieldMapping.dateOfDeath:
        case fieldMapping.dateDataDestroyRequested:
        case fieldMapping.dateDataDestroy:
        case fieldMapping.reinvitationDate:
            if (rawValue) {
                return timestampValidation(rawValue)
            } else if (stateValue) {
                return timestampValidation(stateValue);
            } else {
                return '';
            }
            
        // Suspend Contact (uses date only)
        case fieldMapping.suspendContact:
            return rawValue ? rawValue.toString().split('T')[0] : '';

        // Verification Status
        case fieldMapping.verifiedFlag: {
            return verificationStatusMapping[rawValue] ?? (rawValue ? 'Unknown Status' : '');
        }

        // Participation Status
        case fieldMapping.participationStatus: {
            if (rawValue === '') return 'No Refusal';
            return participationStatusMapping[rawValue] ?? 'ERROR';
        }

        // Survey Status
        case fieldMapping.bohStatusFlag1:
        case fieldMapping.mreStatusFlag1:
        case fieldMapping.lawStatusFlag1:
        case fieldMapping.sasStatusFlag1: {
            return surveyStatusMapping[rawValue] ?? 'Not Started';
        }

        // Refusal Flags (nested)
        case fieldMapping.refusedSurvey:
        case fieldMapping.refusedBlood:
        case fieldMapping.refusedUrine:
        case fieldMapping.refusedMouthwash:
        case fieldMapping.refusedSpecimenSurveys:
        case fieldMapping.refusedFutureSamples:
        case fieldMapping.refusedFutureSurveys:
        case fieldMapping.refusedQualityOfLifeSurvey:
        case fieldMapping.refusedAllFutureQualityOfLifeSurveys:
        case fieldMapping.refusedCancerScreeningHistorySurvey:
        case fieldMapping.refusedExperienceSurvey:
        case fieldMapping.refusedAllFutureExperienceSurveys: {
            const refusalValue = participant?.[fieldMapping.refusalOptions]?.[conceptID];
            return refusalValue === fieldMapping.yes ? 'Yes' : 'No';
        }

        // Refused all (non-nested)
        case fieldMapping.refusedAllFutureActivities: {
            return rawValue === fieldMapping.yes ? 'Yes' : 'No';
        }

        // Study ID
        case 'studyId':
            return participant?.state?.studyId ?? '';

        // Site reported age
        case fieldMapping.siteReportedAge: {
            return ageRangeMapping[stateValue] ?? (stateValue ? 'ERROR' : '');
        }

        // Site reported sex
        case fieldMapping.siteReportedSex:
        case fieldMapping.sanfordReportedSex: {
            return sexMapping[stateValue] ?? (stateValue ? 'Unavailable/Unknown' : '');
        }

        // Site reported race
        case fieldMapping.siteReportedRace:
        case fieldMapping.sanfordReportedRace:
        case fieldMapping.henryFReportedRace:
        case fieldMapping.bswhReportedRaceEthnicity: {
            return raceMapping[stateValue] ?? (stateValue ? 'Unavailable/Unknown' : '');
        }

        // Site reported ethnicity
        case fieldMapping.sanfordReportedEthnicity: {
            return ethnicityMapping[stateValue] ?? (stateValue ? 'Unavailable/Unknown' : '');
        }

        // Pre-consent
        case fieldMapping.preConsentOptOut:
        case fieldMapping.maxNumContactsReached:
        case fieldMapping.outreachRequiredForVerification:
            return stateValue === fieldMapping.yes ? 'Yes' : 'No';

        // Campaign and reinvitation types
        case fieldMapping.campaignType:
        case fieldMapping.reinvitationCampaignType: {
            if (rawValue) {
                return campaignTypeMapping[rawValue] ?? 'Unavailable/Unknown';
            } else if (stateValue) {
                return campaignTypeMapping[stateValue] ?? 'Unavailable/Unknown';
            } else {
                return '';
            }
        }

        // @deprecated. Enrollment status. Data exists in prod.
        case fieldMapping.enrollmentStatus: {
            return enrollmentStatusMapping[rawValue] ?? '';
        }

        // Preferred Language
        case fieldMapping.preferredLanguage: {
            return preferredLanguageMapping[rawValue] ?? '';
        }

        // Verification Method
        case fieldMapping.automatedVerification:
        case fieldMapping.manualVerification:
            return stateValue === fieldMapping.methodUsed ? 'Method Used' : 'Method Not Used';

        // Duplicate Types
        case fieldMapping.duplicateType: {
            return duplicateTypeMapping[stateValue] ?? '';
        }

        // Recruitment type updates
        case fieldMapping.updateRecruitType: {
            return updateRecruitTypeMapping[stateValue] ?? (stateValue === undefined || stateValue === null ? '' : 'No Change Needed');
        }

        // Match Status Flags
        case fieldMapping.firstNameMatch:
        case fieldMapping.lastNameMatch:
        case fieldMapping.dobMatch:
        case fieldMapping.pinMatch:
        case fieldMapping.tokenMatch:
        case fieldMapping.zipCodeMatch:
            return stateValue === fieldMapping.matched ? 'Matched' : 'Not Matched';

        // Criterium Match Flags
        case fieldMapping.siteMatch:
        case fieldMapping.ageMatch:
        case fieldMapping.cancerStatusMatch:
            return stateValue === fieldMapping.criteriumMet ? 'Criterium Met' : 'Not Criterium Met';

        // Default key handling Yes/No, Active/Passive/Inactive, Preferred Contact Method)
        default:
            if (rawValue === fieldMapping.yes) return 'Yes';
            if (rawValue === fieldMapping.no) return 'No';
            if (rawValue === fieldMapping.active) return 'Active';
            if (rawValue === fieldMapping.passive) return 'Passive';
            if (rawValue === fieldMapping.inactive) return 'Not active';
            if (rawValue === fieldMapping.prefPhone) return 'Text Message';
            if (rawValue === fieldMapping.prefEmail) return 'Email';

            // If not found, return the raw value.
            return rawValue?.toString() ?? '';
    }
}
