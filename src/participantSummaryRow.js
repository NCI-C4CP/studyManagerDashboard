import { formatUTCDate } from './utils.js';
import fieldMapping from './fieldToConceptIdMapping.js';

/**
 * Mapping rules for the participant summary table.
 * Ordered based on table rows.
 * Specs location (10/2025): https://nih.app.box.com/file/1940543138318
 */

// Icon and color constants for Icon table column.
const ICONS = {
    CHECKMARK: "fa fa-check fa-2x",
    HASHTAG: "fa fa-hashtag fa-2x",
    X: "fa fa-times fa-2x",
};

const COLORS = {
    GREEN: "icon--success",
    ORANGE: "icon--warning",
    RED: "icon--error",
};

/**
 * ENROLLMENT / AGREEMENT
 */

export const consentHandler = (participant) => {
    const isSigned = participant && participant[fieldMapping.consentFlag] === fieldMapping.yes;
    const icon = isSigned ? ICONS.CHECKMARK : ICONS.X;
    const color = isSigned ? COLORS.GREEN : COLORS.RED;
    const status = isSigned ? "Signed" : "Not Signed";
    const date = isSigned ? (participant[fieldMapping.consentDate] && formatUTCDate(participant[fieldMapping.consentDate])) : "N/A";
    const version = isSigned ? participant[fieldMapping.consentVersion] : "N/A";
    const extra = isSigned
        ? '<a class="link--action" target="_blank" id="downloadCopy">Download Link</a>'
        : '<span class="link--disabled">Download Link</span>';
    return getTemplateRow(icon, color, "Enrollment", "Agreement", "Consent", status, date, version, "N/A", extra);
}

export const hipaaHandler = (participant) => {
    const isSigned = participant && participant[fieldMapping.hipaaFlag] === fieldMapping.yes;
    const icon = isSigned ? ICONS.CHECKMARK : ICONS.X;
    const color = isSigned ? COLORS.GREEN : COLORS.RED;
    const status = isSigned ? "Signed" : "Not Signed";
    const date = isSigned ? (participant[fieldMapping.hipaaDate] && formatUTCDate(participant[fieldMapping.hipaaDate])) : "N/A";
    const version = isSigned ? participant[fieldMapping.hipaaVersion] : "N/A";
    const extra = isSigned
        ? '<a class="link--action" target="_blank" id="downloadCopyHIPAA">Download Link</a>'
        : '<span class="link--disabled">Download Link</span>';
    return getTemplateRow(icon, color, "Enrollment", "Agreement", "HIPAA", status, date, version, "N/A", extra);
}

export const userProfile = (participant) => {
    let icon = ICONS.X;
    let color = COLORS.RED;
    let status = "Not Submitted";
    let date = "N/A";
    let refused = "N/A";

    if (participant[fieldMapping.userProfileFlag] === fieldMapping.yes) {
        icon = ICONS.CHECKMARK;
        color = COLORS.GREEN;
        status = "Submitted";
        date = formatUTCDate(participant[fieldMapping.userProfileDateTime]);
        refused = "N";
    }

    return getTemplateRow(icon, color, "Enrollment", "N/A", "User Profile", status, date, "N/A", refused, "N/A");
}

export const verificationStatus = (participant) => {
    let icon = ICONS.X;
    let color = COLORS.RED;
    let status = "N/A";
    let verificationDate = formatUTCDate(participant?.[fieldMapping.verficationDate]) || "N/A";

    if (participant) {
        const verificationFlag = participant[fieldMapping.verifiedFlag];

        if (verificationFlag === fieldMapping.cannotBeVerified) {
            status = "Cannot Be Verified";
        
        } else if (verificationFlag === fieldMapping.noLongerEnrolling) {
            status = "No Longer Enrolling";
        
        } else if (verificationFlag === fieldMapping.duplicate) {
            status = "Duplicate";

        } else if (verificationFlag === fieldMapping.notYetVerified) {
            icon = ICONS.HASHTAG;
            color = COLORS.ORANGE;
            status = "Not yet Verified";
            verificationDate = "N/A";

        } else if (verificationFlag === fieldMapping.outreachTimedout) {
            icon = ICONS.HASHTAG;
            color = COLORS.ORANGE;
            status = "Outreach Timed Out";

        } else if (verificationFlag === fieldMapping.verified) {
            icon = ICONS.CHECKMARK;
            color = COLORS.GREEN;
            status = "Verified";       
        
        } else {
            status = "Error: unhandled status in verificationStatus"
        }
    }

    return getTemplateRow(icon, color, "Enrollment", "N/A", "Verification Status", status, verificationDate, "N/A", "N", "N/A");
}

/**
 * SURVEYS
 */

export const baselineBOHSurvey = (participant) => {
    const refusal = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedSurvey] === fieldMapping.yes ? 'Y' : 'N';
    const { icon, color, itemStatus, date } = getSurveyStatus(participant, fieldMapping.bohStatusFlag1, fieldMapping.bohStartDate1, fieldMapping.bohCompletedDate1);

    return getTemplateRow(icon, color, "Baseline", "Survey", "BOH", itemStatus, date, "N/A", refusal, "N/A");
}

export const baselineMRESurvey = (participant) => {
    const refusal = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedSurvey] === fieldMapping.yes ? 'Y' : 'N';
    const { icon, color, itemStatus, date } = getSurveyStatus(participant, fieldMapping.mreStatusFlag1, fieldMapping.mreStartDate1, fieldMapping.mreCompletedDate1);
    
    return getTemplateRow(icon, color, "Baseline", "Survey", "MRE", itemStatus, date, "N/A", refusal, "N/A");
}

export const baselineSASSurvey = (participant) => {
    const refusal = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedSurvey] === fieldMapping.yes ? 'Y' : 'N';
    const { icon, color, itemStatus, date } = getSurveyStatus(participant, fieldMapping.sasStatusFlag1, fieldMapping.sasStartDate1, fieldMapping.sasCompletedDate1);
    
    return getTemplateRow(icon, color, "Baseline", "Survey", "SAS", itemStatus, date, "N/A", refusal, "N/A");
}

export const baselineLAWSurvey = (participant) => {
    const refusal = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedSurvey] === fieldMapping.yes ? 'Y' : 'N';
    const { icon, color, itemStatus, date } = getSurveyStatus(participant, fieldMapping.lawStatusFlag1, fieldMapping.lawStartDate1, fieldMapping.lawCompletedDate1);
    
    return getTemplateRow(icon, color, "Baseline", "Survey", "LAW", itemStatus, date, "N/A", refusal, "N/A");
}

export const baselineSSN = (participant) => {
    const { icon, color, itemStatus, date } = getSurveyStatus(participant, fieldMapping.ssnStatusFlag, fieldMapping.ssnSurveyStartedDate, fieldMapping.ssnSurveyCompletedDate);

    return getTemplateRow(icon, color, "Baseline", "Survey", "SSN", itemStatus, date, "N/A", "N", "N/A");
}

export const baselineCOVIDSurvey = (participant) => {
    const { icon, color, itemStatus, date } = getSurveyStatus(participant, fieldMapping.covidFlag, fieldMapping.covidStartDate, fieldMapping.covidCompletedDate);
    
    return getTemplateRow(icon, color, "Baseline", "Survey", "COVID", itemStatus, date, "N/A", "N", "N/A");
}

export const baselineResearchBUMSurvey = (participant) => {
    const refusal = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedSpecimenSurveys] === fieldMapping.yes ? 'Y' : 'N';
    const { icon, color, itemStatus, date } = getSurveyStatus(participant, fieldMapping.combinedBoodUrineMouthwashSurvey, fieldMapping.combinedBoodUrineMouthwashSurveyStartDate, fieldMapping.combinedBoodUrineMouthwashSurveyCompleteDate);
    
    return getTemplateRow(icon, color, "Baseline", "Survey", "Research B/U/M", itemStatus, date, "N/A", refusal, "N/A");
}

export const baselineClinicalBloodUrineSurvey = (participant) => {
    const refusal = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedSpecimenSurveys] === fieldMapping.yes ? 'Y' : 'N';
    const { icon, color, itemStatus, date } = getSurveyStatus(participant, fieldMapping.bloodUrineSurveyFlag, fieldMapping.bloodUrineSurveyStartedDate, fieldMapping.bloodUrineSurveyCompletedDate);
    
    return getTemplateRow(icon, color, "Baseline", "Survey", "Clinical Blood/Urine", itemStatus, date, "N/A", refusal, "N/A");
}

export const baselineHomeMouthwashSurvey = (participantModule) => {
    const refusal = participantModule[fieldMapping.refusalOptions]?.[fieldMapping.refusedSpecimenSurveys] === fieldMapping.yes ? 'Y' : 'N';
    const { icon, color, itemStatus, date } = getSurveyStatus(participantModule, fieldMapping.mouthwashSurveyFlag, fieldMapping.mouthwashSurveyStartedDate, fieldMapping.mouthwashSurveyCompletedDate);
    
    return getTemplateRow(icon, color, "Baseline", "Survey", "Home Mouthwash", itemStatus, date, "N/A", refusal, "N/A");
};

export const baselineMenstrualSurvey = (participant) => {
    const { icon, color, itemStatus, date } = getSurveyStatus(participant, fieldMapping.menstrualFlag, fieldMapping.menstrualDateTimeStart, fieldMapping.menstrualDateTimeCompleted);
    
    return getTemplateRow(icon, color, "Baseline", "Survey", "Menstrual Cycle", itemStatus, date, "N/A", "N", "N/A");
}

export const baselinePromisSurvey = (participant) => {
    const refusedAllFutureSurveys = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedFutureSurveys];
    const refusedAllFutureActivities = participant[fieldMapping.refusedAllFutureActivities];
    const refusedQualityOfLifeSurvey = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedQualityOfLifeSurvey];
    const refusal = refusedAllFutureSurveys === fieldMapping.yes || refusedAllFutureActivities === fieldMapping.yes || refusedQualityOfLifeSurvey === fieldMapping.yes ? "Y" : "N";
    const { icon, color, itemStatus, date } = getSurveyStatus(participant, fieldMapping.promisSurveyFlag, fieldMapping.promisSurveyStartedDate, fieldMapping.promisSurveyCompletedDate);

    return getTemplateRow(icon, color, "Follow-Up 3-mo", "Survey", "Quality of Life", itemStatus, date, "N/A", refusal, "N/A");
};

export const baselineExperienceSurvey = (participant) => {
    const refusedAllFutureSurveys = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedFutureSurveys];
    const refusedAllFutureActivities = participant[fieldMapping.refusedAllFutureActivities];
    const refusedExperienceSurvey = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedExperienceSurvey];
    const refusal = refusedAllFutureSurveys === fieldMapping.yes || refusedAllFutureActivities === fieldMapping.yes || refusedExperienceSurvey === fieldMapping.yes ? "Y" : "N";
    const { icon, color, itemStatus, date } = getSurveyStatus(participant, fieldMapping.experienceSurvey, fieldMapping.experienceSurveyStartDate, fieldMapping.experienceCompleteDate);

    return getTemplateRow(icon, color, "Cross-Sectional 2024", "Survey", "2024 Connect Experience", itemStatus, date, "N/A", refusal, "N/A");
};

export const dhqSurvey = (data) => {
    // Note: There's no DHQ-specific refusal, just the generic refusals that apply to all surveys
    const refusedAllFutureSurveys = data[fieldMapping.refusalOptions]?.[fieldMapping.refusedFutureSurveys];
    const refusedAllFutureActivities = data[fieldMapping.refusedAllFutureActivities];
    const refusal = refusedAllFutureSurveys === fieldMapping.yes || refusedAllFutureActivities === fieldMapping.yes ? "Y" : "N";

    
    let { icon, color, itemStatus, date } = getSurveyStatus(data, fieldMapping.dhqSurveyStatus, fieldMapping.dhqSurveyStartDate, fieldMapping.dhqSurveyCompletedDate);

    // Custom properties for the DHQ Row's 'Setting' column
    const dhqUsername = data[fieldMapping.dhqUsername];
    const dhqStudyID = data[fieldMapping.dhqStudyID];
    const setting = dhqUsername && dhqStudyID ? `Username: ${dhqUsername}, Study ID: ${dhqStudyID.replace('study_', ' ')}` : "N/A";
    
    return getTemplateRow(icon, color, "Follow-Up 6-mo", "Survey", "DHQ III", itemStatus, date, setting, refusal, "N/A");
};

export const cancerScreeningHistorySurvey = (data) => {
    const refusedAllFutureSurveys = data[fieldMapping.refusalOptions]?.[fieldMapping.refusedFutureSurveys];
    const refusedAllFutureActivities = data[fieldMapping.refusedAllFutureActivities];
    const refusedCancerScreeningHistorySurvey = data[fieldMapping.refusalOptions]?.[fieldMapping.refusedCancerScreeningHistorySurvey];
    const refused = refusedAllFutureSurveys === fieldMapping.yes || refusedAllFutureActivities === fieldMapping.yes || refusedCancerScreeningHistorySurvey === fieldMapping.yes ? "Y" : "N";
    let { icon, color, itemStatus, date } = getSurveyStatus(data, fieldMapping.cancerScreeningHistorySurveyStatus, fieldMapping.cancerScreeningHistorySurveyStartDate, fieldMapping.cancerScreeningHistorySurveyCompletedDate);

    return getTemplateRow(icon, color, "Follow-Up 9-mo", "Survey", "Cancer Screening History", itemStatus, date, "N/A", refused, "N/A");
};

/**
 * SAMPLES 
 */

export const baselineBloodSample = (participant) => {
    const refusal = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedBlood] === fieldMapping.yes ? 'Y' : 'N';
    const baselineBloodCollectedFlag = participant[fieldMapping.baselineBloodCollectedFlag];

    let icon = ICONS.X;
    let iconColor = COLORS.RED;
    let status = 'Not Collected';
    let date = 'N/A';
    let setting = 'N/A';
    
    if (baselineBloodCollectedFlag === fieldMapping.yes) {
        const baselineCollection = participant[fieldMapping.biospecimenCollectionDetail]?.[fieldMapping.biospecimenBaselineCollection];

        icon = ICONS.CHECKMARK;
        iconColor = COLORS.GREEN;
        status = 'Collected';
        date = setSampleDateTime(baselineCollection, fieldMapping.biosepcimenBloodCollection, fieldMapping.researchBloodCollectedDateTime, fieldMapping.clinicalBloodCollectedDateTime);
        setting = biospecimenStatus(baselineCollection, fieldMapping.biosepcimenBloodCollection, fieldMapping.biospecimenBaselineCollection);
    }

    return getTemplateRow(icon, iconColor, "Baseline", "Sample", "Blood", status, date, setting, refusal, "N/A");
}

export const baselineUrineSample = (participant) => {
    const refusal = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedUrine] === fieldMapping.yes ? 'Y' : 'N';
    const urineFlag = participant[fieldMapping.urineFlag];

    let icon = ICONS.X;
    let iconColor = COLORS.RED;
    let status = 'Not Collected';
    let date = 'N/A';
    let setting = 'N/A';
    
    if (urineFlag === fieldMapping.yes) {
        const baselineCollection = participant[fieldMapping.biospecimenCollectionDetail]?.[fieldMapping.biospecimenBaselineCollection];
        icon = ICONS.CHECKMARK;
        iconColor = COLORS.GREEN;
        status = 'Collected';
        date = setSampleDateTime(baselineCollection, fieldMapping.biosepcimenUrineCollection, fieldMapping.urineDateTime, fieldMapping.clinicalUrineDateTime);
        setting = biospecimenStatus(baselineCollection, fieldMapping.biosepcimenUrineCollection, fieldMapping.biospecimenBaselineCollection);
    }

    return getTemplateRow(icon, iconColor, "Baseline", "Sample", "Urine", status, date, setting, refusal, "N/A");
}

export const baselineResearchMouthwashSample = (participant) => {
    return mouthwashSampleTemplate(participant, "Research Mouthwash");
};

export const baselineHomeMouthwashSample = (participant) => {
    return mouthwashSampleTemplate(participant, "Home Mouthwash Initial", fieldMapping.bioKitMouthwash);
};

export const baselineMouthwashR1Sample = (participant) => {
    return mouthwashSampleTemplate(participant, "Home Mouthwash R1", fieldMapping.bioKitMouthwashBL1);
};

export const baselineMouthwashR2Sample = (participant) => {
    return mouthwashSampleTemplate(participant, "Home Mouthwash R2", fieldMapping.bioKitMouthwashBL2);
};

/**
 * PAYMENTS / INCENTIVES
 */

export const baselinePayment = (participantModule) => {
    let template = ``;

    let icon = ICONS.X;
    let iconColor = COLORS.RED;
    let status = 'N/A';
    let date = 'N/A';
    let setting = 'N/A';
    let extra = 'N/A';

    if (participantModule) {
        if (
            participantModule[fieldMapping.paymentRound] &&
            participantModule[fieldMapping.paymentRound][fieldMapping.baselinePayment][fieldMapping.eligiblePayment] === fieldMapping.yes
        ) {
            icon = ICONS.CHECKMARK;
            iconColor = COLORS.GREEN;
            status = 'Eligible';
            date = formatUTCDate(participantModule[fieldMapping.paymentRound][fieldMapping.baselinePayment][fieldMapping.eligiblePaymentRoundTimestamp]);
        } else {
            status = 'Not Eligible';
        }

        if (
            participantModule[fieldMapping.paymentRound] &&
            participantModule[fieldMapping.paymentRound][fieldMapping.baselinePayment][fieldMapping.paymentChosen]
        ) {
            setting = participantModule[fieldMapping.paymentRound][fieldMapping.baselinePayment][fieldMapping.paymentChosen];
        }
        extra = checkIncentiveIssued(participantModule);
    }

    return getTemplateRow(icon, iconColor, "Baseline", "Payment", "N/A", status, date, setting, "N/A", extra);
}

/**
 * ROI / REPORTS
 */

export const baselinePhysActReport = (participantModule, reports) => {
    let reportData;
    if (reports && reports.physActReport) {
        reportData = reports.physActReport;
    }

    let icon, iconColor, status, date, refused, extra;
    if (reportData) {
        icon = ICONS.CHECKMARK;
        iconColor = COLORS.GREEN;
        status = 'Available';
        date =  reportData['d_'+fieldMapping.reports.physicalActivity.reportTS] ? formatUTCDate(reportData['d_'+fieldMapping.reports.physicalActivity.reportTS]) : 'N/A';
        if (participantModule[fieldMapping.reports.physicalActivityReport] && participantModule[fieldMapping.reports.physicalActivityReport][fieldMapping.reports.physicalActivity.status]) {
            switch (participantModule[fieldMapping.reports.physicalActivityReport][fieldMapping.reports.physicalActivity.status]) {
                case fieldMapping.reports.unread:
                    refused = 'Unread';
                    break;
                case fieldMapping.reports.viewed:
                    refused = 'Viewed';
                    break;
                case fieldMapping.reports.declined:
                    refused = 'Declined';
                    break;
                default:
                    refused = 'N/A';
            }
        } else {
            refused = 'N/A';
        }
        extra = '<a class="link--action" target="_blank" id="downloadPhysActReport">Download Link</a>'
    } else {
        icon = ICONS.X;
        iconColor = COLORS.RED;
        status = 'Unavailable';
        date = 'N/A';
        refused = 'N/A';
        extra = '<span class="link--disabled">Download Link</span>'
    }

    let template = getTemplateRow(icon, iconColor, "Baseline", "ROI", "Phys Act", status, date, "N/A", refused, extra);
    return template
}

// Note: `refused` (used for naming consistency across this file) refers to the report viewed status, visible in the table's 'Refused' column.
export const dhq3Report = (participantData, reports) => {
    let icon, iconColor, status, date, refused, extra;

    const isSurveySubmitted = participantData[fieldMapping.dhqSurveyStatus] === fieldMapping.submitted;
    if (isSurveySubmitted) {
        icon = ICONS.CHECKMARK;
        iconColor = COLORS.GREEN;
        status = 'Available';
        refused = "Int: "
        date = participantData[fieldMapping.dhqSurveyCompletedDate] ? formatUTCDate(participantData[fieldMapping.dhqSurveyCompletedDate]) : 'N/A';
        
        // For submitted DHQ surveys, display both the internal and external report statuses.
        switch (participantData[fieldMapping.reports.dhq3.reportStatusInternal]) {
            case fieldMapping.reports.unread:
                refused += 'Unread, ';
                break;
            case fieldMapping.reports.viewed:
                refused += 'Viewed, ';
                break;
            case fieldMapping.reports.declined:
                refused += 'Declined, ';
                break;
            default:
                refused += 'Unread, ';
        }

        switch (participantData[fieldMapping.reports.dhq3.reportStatusExternal]) {
            case fieldMapping.reports.unread:
                refused += 'Ext: Unread';
                break;
            case fieldMapping.reports.viewed:
                refused += 'Ext: Viewed';
                break;
            case fieldMapping.reports.declined:
                refused += 'Ext: Declined';
                break;
            default:
                refused += 'Ext: Unread';
        }
        
        extra = '<a class="link--action" target="_blank" id="downloadDHQHEIReport">Download Link</a>'

    } else {
        icon = ICONS.X;
        iconColor = COLORS.RED;
        status = 'Unavailable';
        date = 'N/A';
        refused = 'N/A';
        extra = '<span class="link--disabled">Download Link</span>'
    }

    return getTemplateRow(icon, iconColor, "Baseline", "ROI", "HEI Report - DHQ III", status, date, "N/A", refused, extra);
}

/**
 * HELPER FUNCTIONS
 */

const getSurveyStatus = (participant, surveyFlag, startDate, completeDate) => {
    switch (participant[surveyFlag]) {
        case fieldMapping.submitted1:
            return {
                icon: ICONS.CHECKMARK,
                color: COLORS.GREEN,
                itemStatus: "Submitted",
                date: formatUTCDate(participant[completeDate]),
            };
        case fieldMapping.started1:
            return {
                icon: ICONS.HASHTAG,
                color: COLORS.ORANGE,
                itemStatus: "Started",
                date: formatUTCDate(participant[startDate]),
            };
        case fieldMapping.notStarted1:
            return {
                icon: ICONS.X,
                color: COLORS.RED,
                itemStatus: "Not Started",
                date: "N/A",
            };
        case fieldMapping.notYetEligible1:
            return {
                icon: ICONS.X,
                color: COLORS.RED,
                itemStatus: "Not Yet Eligible",
                date: "N/A",
            };
        default:
            // Special case: Experience and Cancer Screening History surveys have the 'Not Eligible' status as a fallback value.
            if ([fieldMapping.experienceSurvey, fieldMapping.cancerScreeningHistorySurveyStatus].includes(surveyFlag)) {
                return {
                    icon: ICONS.X,
                    color: COLORS.RED,
                    itemStatus: "Not Eligible",
                    date: "N/A",
                };
            // Special case: DHQ survey has the 'Not Yet Eligible' status as a fallback value.
            }  else if ([fieldMapping.dhqSurveyStatus].includes(surveyFlag)) {
                return {
                    icon: ICONS.X,
                    color: COLORS.RED,
                    itemStatus: "Not Yet Eligible",
                    date: "N/A",
                };
            // Standard fallback value.
            } else {
                return {
                    icon: ICONS.X,
                    color: COLORS.RED,
                    itemStatus: "N/A",
                    date: "N/A",
                };
            }
    }
};

const kitStatusCidToString = {
  728267588: "Initialized",
  517216441: "Pending",
  332067457: "Address Undeliverable",
  849527480: "Address Printed",
  241974920: "Assigned",
  277438316: "Shipped",
  375535639: "Received",
};

const mouthwashSampleTemplate = (participantModule, itemName, path = null) => {
    const refusedMouthwashOption = participantModule[fieldMapping.refusalOptions]?.[fieldMapping.refusedMouthwash] === fieldMapping.yes;
    let displayedFields;

    // Research Mouthwash is part of a full specimen colllection (it uses biospecimenCollectionDetail structure like blood/urine).
    if (itemName === "Research Mouthwash") {
        const baselineCollection = participantModule[fieldMapping.biospecimenCollectionDetail]?.[fieldMapping.biospecimenBaselineCollection];
        const mouthwashCollectionType = baselineCollection?.[fieldMapping.biospecimenMouthwashCollection];

        // IF 684635302 = Yes AND 173836415.266600170.915179629 = Research (534621077), THEN green check and 'Collected' displays. Else, red x and 'Not Collected' displays.
        const isCollected = participantModule[fieldMapping.baselineMouthwashCollectedFlag] === fieldMapping.yes
            && mouthwashCollectionType === fieldMapping.biospecimenResearch;

        // Date used: 173836415.266600170.448660695 (mouthwashDateTime) in biospecimenCollectionDetail.baseline
        const collectionDate = isCollected ? formatMouthwashCollectionDate(baselineCollection?.[fieldMapping.mouthwashDateTime]) : "N/A";

        displayedFields = {
            icon: isCollected ?
                {icon: ICONS.CHECKMARK, style: COLORS.GREEN} :
                {icon: ICONS.X, style: COLORS.RED},
            status: isCollected ? "Collected" : "Not Collected",
            date: collectionDate,
            setting: isCollected ? "Research" : "N/A",
            refused: refusedMouthwashOption ? "Y" : "N",
            extra: "N/A",
        };
    }
    // Home Mouthwash (Initial, R1, R2) uses the kit tracking system (kitTrackingDetail structure)
    else {
        // Initial kits have some specific behavior vs. replacement kits
        const isInitialKit = path === fieldMapping.bioKitMouthwash;
        const homeMouthwashData = participantModule[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[path] || {};

        const kitStatusCid = homeMouthwashData[fieldMapping.kitStatus];
        const kitStatusStr = kitStatusCidToString[kitStatusCid];

        // IF kitType = homeMouthwash AND kitStatus = received, THEN Green check displays. Else, red x displays.
        const isCollected = homeMouthwashData[fieldMapping.kitType] === fieldMapping.kitTypeValues.homeMouthwash
            && kitStatusCid === fieldMapping.kitStatusValues.received;

        // Date from kitReceivedTime when collected
        const collectionDate = isCollected ? formatMouthwashCollectionDate(homeMouthwashData[fieldMapping.kitReceivedTime]) : "N/A";

        displayedFields = {
            icon: isCollected ?
                {icon: ICONS.CHECKMARK, style: COLORS.GREEN} :
                {icon: ICONS.X, style: COLORS.RED},
            status: path ? isCollected ? "Collected" : "Not Collected" : "Error: Path is required for home mouthwash samples",
            date: collectionDate,
            setting: isCollected ? "Home" : "N/A",
            refused: isInitialKit ? refusedMouthwashOption ? "Y" : "N" : "N/A", // Refused = Y/N for initial kit. Always N/A for R1 & R2)
            extra: kitStatusStr ? "Kit " + kitStatusStr : "N/A",
        };
    }

    return getTemplateRow(
        displayedFields.icon.icon,
        displayedFields.icon.style,
        "Baseline",
        "Sample",
        itemName,
        displayedFields.status,
        displayedFields.date,
        displayedFields.setting,
        displayedFields.refused,
        displayedFields.extra
    );
}

const checkIncentiveIssued = (participantModule) => {
    const paymentRound = participantModule[fieldMapping.paymentRound];
    if (!paymentRound) return "N/A";
    
    const baselineCollection = paymentRound[fieldMapping.biospecimenBaselineCollection];
    if (!baselineCollection) return "N/A";
    
    if (baselineCollection[fieldMapping.paymentIssued] === fieldMapping.yes) {
        return `Issued on ${formatUTCDate(baselineCollection[fieldMapping.datePaymentIssued])}`;
    } else if (baselineCollection[fieldMapping.refusedBaselinePayment] === fieldMapping.yes) {
        return `Declined on ${formatUTCDate(baselineCollection[fieldMapping.refusedBaselinePaymentDate])}`;
    }
    
    return "N/A";
}

const biospecimenStatus = (collection, biospecimenFlag, collectionRound) => {    
    if (!collection) return "N/A";
    
    const collectionType = collection[biospecimenFlag];
    
    if (collectionType === fieldMapping.biospecimenResearch) {
        return "Research";
    } else if (collectionType === fieldMapping.biospecimenClinical) {
        return "Clinical";
    } else if (collectionType === fieldMapping.biospecimenHome) {
        return "Home";
    }
    
    return "N/A";
}

const setSampleDateTime = (collection, biospecimenFlag, researchCollectedDateTime, clinicalCollectedDateTime) => {
    if (!collection) return "N/A";

    const collectionType = collection[biospecimenFlag];

    if (collectionType === fieldMapping.biospecimenResearch) {
        return formatUTCDate(collection[researchCollectedDateTime]);
    } else if (collectionType === fieldMapping.biospecimenClinical) {
        return formatUTCDate(collection[clinicalCollectedDateTime]);
    }

    return "N/A";
}

// Note: formatUTCDate is used on all dates except for mouthwash collection dates (see Box doc linked at top of file)
const formatMouthwashCollectionDate = (isoDateTime) => {
    if (!isoDateTime) return "N/A";
    
    try {
        const [yyyy, mm, dd] = isoDateTime.split("T")[0].split("-");
        if (yyyy && mm && dd && yyyy.length === 4 && mm.length === 2 && dd.length === 2) {
            return `${mm}/${dd}/${yyyy}`;
        }

        throw new Error("BAD TIMESTAMP FORMAT");

    } catch (error) {
        console.error("Error formatting mouthwash collection date:", error);
        return error.message;
    }
};

const getTemplateRow = (icon, color, timeline, category, item, status, date, setting, refused, extra) => {
    return `
        <td><i class="${icon} ${color}"></i></td>
        <td>${timeline}</td>
        <td>${category}</td>
        <td>${item}</td>
        <td>${status}</td>
        <td>${date}</td>
        <td>${setting}</td>
        <td>${refused}</td>
        <td>${extra}</td>
    `;
}