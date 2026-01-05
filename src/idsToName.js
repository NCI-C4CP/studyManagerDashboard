import fieldMapping from './fieldToConceptIdMapping.js';
import { timestampValidation } from './utils.js';
import { biospecimenStatus, getSurveyStatus } from './participantSummaryRow.js';
import { formatPhoneNumber, suffixToTextMap } from './participantDetailsHelpers.js';
import { getCountryNameByConceptId, getCountryNameByCode3 } from './countryMapping.js';

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

export const verificationStatusMapping = {
    [fieldMapping.notYetVerified]: 'Not yet verified',
    [fieldMapping.outreachTimedout]: 'Outreach timed out',
    [fieldMapping.noLongerEnrolling]: 'No longer enrolling',
    [fieldMapping.verified]: 'Verified',
    [fieldMapping.cannotBeVerified]: 'Cannot be verified',
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

export const surveyFlagToDateMapping = {
    [fieldMapping.bohStatusFlag]: {
        startDate: fieldMapping.bohStartDate1,
        completeDate: fieldMapping.bohCompletedDate1,
    },
    [fieldMapping.mreStatusFlag]: {
        startDate: fieldMapping.mreStartDate1,
        completeDate: fieldMapping.mreCompletedDate1,
    },
    [fieldMapping.sasStatusFlag]: {
        startDate: fieldMapping.sasStartDate1,
        completeDate: fieldMapping.sasCompletedDate1,
    },
    [fieldMapping.lawStatusFlag]: {
        startDate: fieldMapping.lawStartDate1,
        completeDate: fieldMapping.lawCompletedDate1,
    },
    [fieldMapping.ssnStatusFlag]: {
        startDate: fieldMapping.ssnSurveyStartedDate,
        completeDate: fieldMapping.ssnSurveyCompletedDate,
    },
    [fieldMapping.combinedBoodUrineMouthwashSurvey]: {
        startDate: fieldMapping.combinedBoodUrineMouthwashSurveyStartDate,
        completeDate: fieldMapping.combinedBoodUrineMouthwashSurveyCompleteDate,
    },
    [fieldMapping.bloodUrineSurveyFlag]: {
        startDate: fieldMapping.bloodUrineSurveyStartedDate,
        completeDate: fieldMapping.bloodUrineSurveyCompletedDate,
    },
    [fieldMapping.mouthwashSurveyFlag]: {
        startDate: fieldMapping.mouthwashSurveyStartedDate,
        completeDate: fieldMapping.mouthwashSurveyCompletedDate,
    },
    [fieldMapping.menstrualFlag]: {
        startDate: fieldMapping.menstrualDateTimeStart,
        completeDate: fieldMapping.menstrualDateTimeCompleted,
    },
    [fieldMapping.covidFlag]: {
        startDate: fieldMapping.covidStartDate,
        completeDate: fieldMapping.covidCompletedDate,
    },
    [fieldMapping.promisSurveyFlag]: {
        startDate: fieldMapping.promisSurveyStartedDate,
        completeDate: fieldMapping.promisSurveyCompletedDate,
    },
    [fieldMapping.dhqSurveyStatus]: {
        startDate: fieldMapping.dhqSurveyStartDate,
        completeDate: fieldMapping.dhqSurveyCompletedDate,
    },
    [fieldMapping.cancerScreeningHistorySurveyStatus]: {
        startDate: fieldMapping.cancerScreeningHistorySurveyStartDate,
        completeDate: fieldMapping.cancerScreeningHistorySurveyCompletedDate,
    },
    [fieldMapping.experienceSurvey]: {
        startDate: fieldMapping.experienceSurveyStartDate,
        completeDate: fieldMapping.experienceCompleteDate,
    },
    [fieldMapping.preferenceSurveyStatus]: {
        startDate: fieldMapping.preferenceSurveyStartDate,
        completeDate: fieldMapping.preferenceSurveyCompletedDate,
    },
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

const ihcsMemberStatusMapping = {
    [fieldMapping.ihcsMemberStatusValues.memberHealthPlan]: 'Member Health Plan',
    [fieldMapping.ihcsMemberStatusValues.nonMemberPatient]: 'Non Member Patient',
    [fieldMapping.ihcsMemberStatusValues.memberAndPatient]: 'Member and Patient',
}

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

        // Account Phone - returns empty string if not consented or no phone number.
        case fieldMapping.accountPhone:
            const firebaseAuthPhoneNumber = participant?.[fieldMapping.consentFlag] === fieldMapping.yes && participant?.[fieldMapping.accountPhone];
            return firebaseAuthPhoneNumber ? formatPhoneNumber(firebaseAuthPhoneNumber) : '';

        // Account Email - returns empty string if not consented or no email address.
        case fieldMapping.accountEmail:
            return participant?.[fieldMapping.consentFlag] === fieldMapping.yes && !rawValue?.toString().startsWith('noreply') && participant?.[fieldMapping.accountEmail] || '';

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
            if (!rawValue) return '';
            return verificationStatusMapping[rawValue] ?? `ERROR: Unknown Verification Status (${conceptID}: ${rawValue})`;
        }

        // Participation Status
        case fieldMapping.participationStatus: {
            if (rawValue === '') return 'No Refusal';
            return participationStatusMapping[rawValue] ?? `ERROR: Unknown Participation Status (${conceptID}: ${rawValue})`;
        }

        // Survey Status
        case fieldMapping.bohStatusFlag:
        case fieldMapping.mreStatusFlag:
        case fieldMapping.sasStatusFlag:
        case fieldMapping.lawStatusFlag:
        case fieldMapping.ssnStatusFlag:
        case fieldMapping.combinedBoodUrineMouthwashSurvey:
        case fieldMapping.bloodUrineSurveyFlag:
        case fieldMapping.mouthwashSurveyFlag:
        case fieldMapping.menstrualFlag:
        case fieldMapping.covidFlag:
        case fieldMapping.promisSurveyFlag:
        case fieldMapping.dhqSurveyStatus:
        case fieldMapping.cancerScreeningHistorySurveyStatus:
        case fieldMapping.experienceSurvey:
        case fieldMapping.preferenceSurveyStatus: {
            const { itemStatus } = getSurveyStatus(participant, conceptID);

            return itemStatus;
        }

        // Suffix
        case fieldMapping.suffix: {
            const value = rawValue ?? stateValue;
            if (!value) return '';

            const suffixText = suffixToTextMap.get(parseInt(value, 10));
            return suffixText ?? `ERROR: Unknown Suffix (${conceptID}: ${value})`;
        }

        // Baseline Collection items (nested in 173836415.266600170)
        case fieldMapping.biospecimenBloodCollection:
        case fieldMapping.biospecimenUrineCollection:
        case fieldMapping.biospecimenMouthwashCollection: {
            const baselineCollection = participant?.[fieldMapping.biospecimenCollectionDetail]?.[fieldMapping.biospecimenBaselineCollection];
            return biospecimenStatus(baselineCollection, conceptID, fieldMapping.biospecimenBaselineCollection);
        }

        // Baseline payment flags (nested in 130371375.266600170)
        case fieldMapping.paymentIssued:
        case fieldMapping.refusedBaselinePayment: {
            const paymentRound = participant?.[fieldMapping.paymentRound];
            const baselinePaymentRound = paymentRound?.[fieldMapping.baselinePayment];
            const nestedValue = baselinePaymentRound?.[conceptID];
            if (nestedValue === fieldMapping.yes) return 'Yes';
            if (nestedValue === fieldMapping.no) return 'No';
            return nestedValue?.toString() ?? '';
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
            if (!stateValue) return '';
            return ageRangeMapping[stateValue] ?? `ERROR: Unknown Age Range (${stateValue})`;
        }

        // Site reported sex
        case fieldMapping.siteReportedSex:
        case fieldMapping.sanfordReportedSex: {
            if (!stateValue) return '';
            return sexMapping[stateValue] ?? `ERROR: Unknown Sex (${stateValue})`;
        }

        // Site reported race
        case fieldMapping.siteReportedRace:
        case fieldMapping.sanfordReportedRace:
        case fieldMapping.henryFReportedRace:
        case fieldMapping.bswhReportedRaceEthnicity: {
            if (!stateValue) return '';
            return raceMapping[stateValue] ?? `ERROR: Unknown Race (${stateValue})`;
        }

        // Site reported ethnicity
        case fieldMapping.sanfordReportedEthnicity: {
            if (!stateValue) return '';
            return ethnicityMapping[stateValue] ?? `ERROR: Unknown Ethnicity (${stateValue})`;
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
                return campaignTypeMapping[rawValue] ?? `ERROR: Unknown Campaign Type (${conceptID}: ${rawValue})`;
            } else if (stateValue) {
                return campaignTypeMapping[stateValue] ?? `ERROR: Unknown Campaign Type (${conceptID}: ${stateValue})`;
            } else {
                return '';
            }
        }

        // @deprecated. Enrollment status. Data exists in prod.
        case fieldMapping.enrollmentStatus: {
            if (!rawValue) return '';
            return enrollmentStatusMapping[rawValue] ?? `ERROR: Unknown Enrollment Status (${conceptID}: ${rawValue})`;
        }

        // Preferred Language
        case fieldMapping.preferredLanguage: {
            if (!rawValue) return '';
            return preferredLanguageMapping[rawValue] ?? `ERROR: Unknown Preferred Language (${conceptID}: ${rawValue})`;
        }

        // Verification Method
        case fieldMapping.automatedVerification:
        case fieldMapping.manualVerification:
            if (!stateValue) return '';
            if (stateValue === fieldMapping.methodUsed) return 'Method Used';
            if (stateValue === fieldMapping.methodNotUsed) return 'Method Not Used';
            return `ERROR: Unknown Method Status (${conceptID}: ${stateValue})`;

        // Duplicate Types
        case fieldMapping.duplicateType: {
            if (!stateValue) return '';
            return duplicateTypeMapping[stateValue] ?? `ERROR: Unknown Duplicate Type (${conceptID}: ${stateValue})`;
        }

        // Recruitment type updates
        case fieldMapping.updateRecruitType: {
            if (!stateValue) return '';
            return updateRecruitTypeMapping[stateValue] ?? `ERROR: Unknown Update Recruit Type (${conceptID}: ${stateValue})`;
        }

        // De-identified eligibility algorithm version
        case fieldMapping.eligAlgorithmVersion: {
            return stateValue ?? '';
        }

        // IHCS member status
        case fieldMapping.ihcsMemberStatus: {
            if (!stateValue) return '';
            return ihcsMemberStatusMapping[stateValue] ?? `ERROR: Unknown IHCS Member Status (${conceptID}: ${stateValue})`;
        }

        // Country fields (3-char code or concept ID -> country name)
        case fieldMapping.country:
        case fieldMapping.physicalCountry:
        case fieldMapping.altCountry: {
            if (!rawValue) return '';

            // Countries are stored as 3-character codes. Fall back to concept ID if not found for possible future cases.
            let countryName;
            isNaN(rawValue)
                ? countryName = getCountryNameByCode3(rawValue)
                : countryName = getCountryNameByConceptId(rawValue);

            return countryName ?? `ERROR: Unknown Country (${conceptID}: ${rawValue})`;
        }

        // Match Status Flags
        case fieldMapping.firstNameMatch:
        case fieldMapping.lastNameMatch:
        case fieldMapping.dobMatch:
        case fieldMapping.pinMatch:
        case fieldMapping.tokenMatch:
        case fieldMapping.zipCodeMatch:
            if (!stateValue) return '';
            if (stateValue === fieldMapping.matched) return 'Matched';
            if (stateValue === fieldMapping.notMatched) return 'Not Matched';
            return `ERROR: Unknown Match Status (${conceptID}: ${stateValue})`;

        // Criterium Match Flags
        case fieldMapping.siteMatch:
        case fieldMapping.ageMatch:
        case fieldMapping.cancerStatusMatch:
            if (!stateValue) return '';
            if (stateValue === fieldMapping.criteriumMet) return 'Criterium Met';
            if (stateValue === fieldMapping.criteriumNotMet) return 'Criterium Not Met';
            return `ERROR: Unknown Criterium Status (${conceptID}: ${stateValue})`;

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
