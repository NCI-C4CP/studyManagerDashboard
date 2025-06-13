import { formatUTCDate } from './utils.js';
import fieldMapping from './fieldToConceptIdMapping.js';

export const userProfile = (participant) => {
    let template = ``;

    if (!participant) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Enrollment", "N/A", "User Profile", "N/A", "N/A", "N/A", "N", "N/A");
    } else if (participant[fieldMapping.userProfileFlag] === fieldMapping.yes) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Enrollment", "N/A", "User Profile", "Submitted",
        formatUTCDate(participant[fieldMapping.userProfileDateTime]), "N/A", "N", "N/A");
    } else {
      template += getTemplateRow("fa fa-times fa-2x", "color: red", "Enrollment", "N/A", "User Profile", "Not Submitted", "N/A", "N/A", "N/A", "N/A");
    }
    
    return template;
}

export const verificationStatus = (participant) => {
    let template = ``;

    if (!participant) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Enrollment", "N/A", "Verification", "N/A", "N/A", "N/A", "N", "N/A");
    } else if (participant[fieldMapping.verifiedFlag] === fieldMapping.verified) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Enrollment", "N/A", "Verification Status", "Verified",
        formatUTCDate(participant[fieldMapping.verficationDate]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.verifiedFlag] === fieldMapping.cannotBeVerified) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Enrollment", "N/A", "Verification Status", "Can't be Verified",
        formatUTCDate(participant[fieldMapping.verficationDate]) || "N/A", "N/A", "N", "N/A");
    } else if (participant[fieldMapping.verifiedFlag] === fieldMapping.notYetVerified) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Enrollment", "N/A", "Verification Status", "Not yet Verified",
        "N/A", "N/A", "N", "N/A");
    } else if (participant[fieldMapping.verifiedFlag] === fieldMapping.duplicate) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Enrollment", "N/A", "Verification Status", "Duplicate",
        formatUTCDate(participant[fieldMapping.verficationDate]) || "N/A", "N/A", "N", "N/A");
    } else {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Enrollment", "N/A", "Verification Status", "Outreach Timed Out",
        formatUTCDate(participant[fieldMapping.verficationDate]) || "N/A", "N/A", "N", "N/A");
    }
    
    return template;
}

export const baselineBloodSample = (participantModule) => {
    // TODO: should we use const instead of let for refusedBloodOption
    let refusedBloodOption = participantModule[fieldMapping.refusalOptions]?.[fieldMapping.refusedBlood];
    let template = ``;
    
    if (refusedBloodOption === fieldMapping.yes) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Sample", "Blood", "Not Collected", "N/A", "N/A", "Y", "N/A");
    } else if (!participantModule[fieldMapping.bloodFlag]) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Sample", "Blood", "Not Collected", "N/A", "N/A", "N", "N/A");
    } else if (participantModule[fieldMapping.bloodFlag] === fieldMapping.yes) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Sample", "Blood", "Collected",
        participantModule[fieldMapping.biospecimenCollectionDetail] && setSampleDateTime(participantModule, fieldMapping.biosepcimenBloodCollection, fieldMapping.bloodDateTime, fieldMapping.clinicalBloodDateTime),
        biospecimenStatus(participantModule, fieldMapping.biosepcimenBloodCollection), "N", "N/A");
    } else {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Sample", "Blood", "Not Collected", "N/A", "N/A", "N", "N/A");
    }
    
    return template;
}

export const baselineUrineSample = (participantModule) => {
    let template = ``;
    let refusedUrineOption = participantModule[fieldMapping.refusalOptions]?.[fieldMapping.refusedUrine];
    let urineFlag = participantModule[fieldMapping.urineFlag];

    if (refusedUrineOption === fieldMapping.yes) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Sample", "Urine", "Not Collected", "N/A", "N/A", "Y", "N/A");
    } else if (!urineFlag) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Sample", "Urine", "Not Collected", "N/A", "N/A", "N", "N/A");
    } else if (urineFlag === fieldMapping.yes) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Sample", "Urine", "Collected", 
        participantModule[fieldMapping.biospecimenCollectionDetail] && setSampleDateTime(participantModule, fieldMapping.biosepcimenUrineCollection, fieldMapping.urineDateTime, fieldMapping.clinicalUrineDateTime), 
        biospecimenStatus(participantModule, fieldMapping.biosepcimenUrineCollection), "N", "N/A");
    } else {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Sample", "Urine", "Not Collected", "N/A", "N/A", "N", "N/A");
    }

    return template;
}

const kitStatusCidToString = {
  728267588: "Initialized",
  517216441: "Pending",
  332067457: "Address Undeliverable",
  849527480: "Address Printed",
  241974920: "Assigned",
  277438316: "Shipped",
  375535639: "Received",
};

const mouthwashSampleTemplate = (participantModule, path, itemName) => {
    // Initial kits have some specific behavior vs. replacement kits
    const isInitialKit = path === fieldMapping.bioKitMouthwash;
    const homeMouthwashData =
        participantModule[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[path] || {};
    const collectionTime =
        (
            homeMouthwashData[fieldMapping.kitType] === fieldMapping.kitTypeValues.homeMouthwash || !isInitialKit ?
                // Home collection kits, including all replacement kits, use kit received time
                participantModule[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[path]?.[fieldMapping.kitReceivedTime] :
                // Research kits (initial kits with appropriate kit type) use kit collection time
                participantModule[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[fieldMapping.mouthwashDateTime]
        )
        || "";

    const [yyyy, mm, dd] = collectionTime.split("T")[0].split("-");

    let collectionDate = "N/A";
    if (yyyy && mm && dd) {
        collectionDate = `${mm}/${dd}/${yyyy}`;
    }
    
    const kitStatusCid = homeMouthwashData[fieldMapping.kitStatus];
    const kitStatusStr = kitStatusCidToString[kitStatusCid];
    const setting = homeMouthwashData[fieldMapping.kitType] === fieldMapping.kitTypeValues.homeMouthwash
            ? 'Home'
            // Only initial kits can be research; replacement kits are by definition home collections
            : (isInitialKit ? 'Research' : 'N/A');
    const isCollected = homeMouthwashData[fieldMapping.kitType] === fieldMapping.kitTypeValues.homeMouthwash ?
        kitStatusCid === fieldMapping.kitStatusValues.received :
        // Only initial kits can be research; replacement kits are by definition home collections,
        // so the participantModule result here only applies to initial kits
        participantModule[fieldMapping.mouthwash] === fieldMapping.yes && path === fieldMapping.bioKitMouthwash;
    const refusedMouthwashOption = participantModule[fieldMapping.refusalOptions]?.[fieldMapping.refusedMouthwash] === fieldMapping.yes;

    let displayedFields = {
        icon: isCollected ? 
            {faIcon: "fa fa-check fa-2x", style: "color: green"} :
            {faIcon: "fa fa-times fa-2x", style: "color: red"},
        status: isCollected ? "Collected" : "Not Collected",
        date: isCollected ? collectionDate : "N/A",
        setting: isCollected ? setting : "N/A",
        refused: isInitialKit ? (refusedMouthwashOption ? "Y" : "N") : "N/A",
        extra: kitStatusStr ? "Kit " + kitStatusStr : "N/A",
    };
    
    return getTemplateRow(
        displayedFields.icon.faIcon,
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

export const baselineMouthwashSample = (participantModule) => {
    return mouthwashSampleTemplate(participantModule, fieldMapping.bioKitMouthwash, "Mouthwash");
};

export const baselineMouthwashR1Sample = (participantModule) => {
    return mouthwashSampleTemplate(participantModule, fieldMapping.bioKitMouthwashBL1, "Mouthwash R1");
  };

export const baselineMouthwashR2Sample = (participantModule) => {
    return mouthwashSampleTemplate(participantModule, fieldMapping.bioKitMouthwashBL2, "Mouthwash R2");
  };

export const baselineBOHSurvey = (participant) => {
    let refusedSurveyOption = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedSurvey];
    let template = ``;
    
    if (refusedSurveyOption === fieldMapping.yes) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "BOH", "N/A", "N/A", "N/A", "Y", "N/A");
    } else if (participant[fieldMapping.bohStatusFlag1] === fieldMapping.submitted1) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Survey", "BOH", "Submitted",
        formatUTCDate(participant[fieldMapping.bohCompletedDate1]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.bohStatusFlag1] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "BOH", "Started",
        formatUTCDate(participant[fieldMapping.bohStartDate1]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.bohStatusFlag1] === fieldMapping.notStarted1) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "BOH", "Not Started", "N/A", "N/A", "N", "N/A");
    } else {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "BOH", "N/A", "N/A", "N/A", "N", "N/A");
    }
    
    return template;    
}

export const baselineMRESurvey = (participant) => {
    let refusedSurveyOption = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedSurvey];
    let template = ``;
    
    if (refusedSurveyOption === fieldMapping.yes) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "MRE", "N/A", "N/A", "N/A", "Y", "N/A");
    } else if (participant[fieldMapping.mreStatusFlag1] === fieldMapping.submitted1) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Survey", "MRE", "Submitted",
        formatUTCDate(participant[fieldMapping.mreCompletedDate1]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.mreStatusFlag1] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "MRE", "Started",
        formatUTCDate(participant[fieldMapping.mreStartDate1]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.mreStatusFlag1] === fieldMapping.notStarted1) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "MRE", "Not Started", "N/A", "N/A", "N", "N/A");
    } else {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "MRE", "N/A", "N/A", "N/A", "N", "N/A");
    }
    
    return template;    
}

export const baselineSASSurvey = (participant) => {
    let refusedSurveyOption = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedSurvey];
    let template = ``;
    
    if (refusedSurveyOption === fieldMapping.yes) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "SAS", "N/A", "N/A", "N/A", "Y", "N/A");
    } else if (participant[fieldMapping.sasStatusFlag1] === fieldMapping.submitted1) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Survey", "SAS", "Submitted",
        formatUTCDate(participant[fieldMapping.sasCompletedDate1]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.sasStatusFlag1] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "SAS", "Started",
        formatUTCDate(participant[fieldMapping.sasStartDate1]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.sasStatusFlag1] === fieldMapping.notStarted1) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "SAS", "Not Started", "N/A", "N/A", "N", "N/A");
    } else {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "SAS", "N/A", "N/A", "N/A", "N", "N/A");
    }
    
    return template;    
}

export const baselineLAWSurvey = (participant) => {
    let refusedSurveyOption = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedSurvey];
    let template = ``;

    if (refusedSurveyOption === fieldMapping.yes) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "LAW", "N/A", "N/A", "N/A", "Y", "N/A");
    } else if (participant[fieldMapping.lawStatusFlag1] === fieldMapping.submitted1) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Survey", "LAW", "Submitted",
        formatUTCDate(participant[fieldMapping.lawCompletedDate1]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.lawStatusFlag1] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "LAW", "Started",
        formatUTCDate(participant[fieldMapping.lawStartDate1]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.lawStatusFlag1] === fieldMapping.notStarted1) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "LAW", "Not Started", "N/A", "N/A", "N", "N/A");
    } else {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "LAW", "N/A", "N/A", "N/A", "N", "N/A");
    }

    return template;
}

export const baselineSSN = (participant) => {
    const { icon, color, itemStatus, date } = getSurveyStatus(participant, fieldMapping.ssnStatusFlag, fieldMapping.ssnPartialDate, fieldMapping.ssnFulldate);

    const timeline = "Baseline";
    const category = "Survey";
    const item = "SSN";
    const setting = "N/A";
    const refused = "N";
    const extra = "N/A";

    return getTemplateRow(icon, color, timeline, category, item, itemStatus, date, setting, refused, extra);
}

export const baselineCOVIDSurvey = (participant) => {
    let template = ``;

    if (participant[fieldMapping.covidFlag] === fieldMapping.submitted1) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Survey", "COVID", "Submitted",
        formatUTCDate(participant[fieldMapping.covidCompletedDate]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.covidFlag] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "COVID", "Started",
        formatUTCDate(participant[fieldMapping.covidStartDate]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.covidFlag] === fieldMapping.notStarted1) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "COVID", "Not Started", "N/A", "N/A", "N", "N/A");
    } else {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "COVID", "N/A", "N/A", "N/A", "N", "N/A");
    }
    return template;
}


export const baselineBiospecSurvey = (participant) => {
    let combinedBoodUrineMouthwashSurvey = participant[fieldMapping.combinedBoodUrineMouthwashSurvey] && participant[fieldMapping.combinedBoodUrineMouthwashSurvey];
    let refusedSpecimenOption = participant[fieldMapping.refusalOptions] && participant[fieldMapping.refusalOptions][fieldMapping.refusedSpecimenSurveys];
    let template = ``;

    if (refusedSpecimenOption === fieldMapping.yes) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "Blood/Urine/Mouthwash", "N/A", "N/A", "N/A", "Y", "N/A");
    } else if (!combinedBoodUrineMouthwashSurvey) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "Blood/Urine/Mouthwash", "N/A", "N/A", "N/A", "N", "N/A");
    } else if (participant[fieldMapping.combinedBoodUrineMouthwashSurvey] === fieldMapping.submitted1) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Survey", "Blood/Urine/Mouthwash", "Submitted",
        formatUTCDate(participant[fieldMapping.combinedBoodUrineMouthwashSurveyCompleteDate]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.combinedBoodUrineMouthwashSurvey] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "Blood/Urine/Mouthwash", "Started",
        formatUTCDate(participant[fieldMapping.combinedBoodUrineMouthwashSurveyStartDate]), "N/A", "N", "N/A");
    } else {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "Blood/Urine/Mouthwash", "Not Started", "N/A", "N/A", "N", "N/A");
    }

    return template;
}

export const baselineBloodUrineSurvey = (participant) => {
    let refusedSpecimenOption = participant[fieldMapping.refusalOptions] && participant[fieldMapping.refusalOptions][fieldMapping.refusedSpecimenSurveys];
    let template = ``;
    
    if (refusedSpecimenOption === fieldMapping.yes) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "Clinical Blood/Urine", "N/A", "N/A", "N/A", "Y", "N/A");
    } else if (!participant) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "Clinical Blood/Urine", "N/A", "N/A", "N/A", "N", "N/A");
    } else if (participant[fieldMapping.bloodUrineSurveyFlag] === fieldMapping.submitted1) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Survey", "Clinical Blood/Urine", "Submitted",
        formatUTCDate(participant[fieldMapping.bloodUrineSurveyCompletedDate]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.bloodUrineSurveyFlag] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "Clinical Blood/Urine", "Started",
        formatUTCDate(participant[fieldMapping.bloodUrineSurveyStartedDate]), "N/A", "N", "N/A");
    } else {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "Clinical Blood/Urine", "Not Started", "N/A", "N/A", "N", "N/A");
    }

    return template; 
}

export const baselineMouthwashSurvey = (participantModule) => {
    let refusedSpecimenOption = participantModule[fieldMapping.refusalOptions] && participantModule[fieldMapping.refusalOptions][fieldMapping.refusedSpecimenSurveys];
    let template = ``;
    
    if (refusedSpecimenOption === fieldMapping.yes) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "Home Mouthwash", "N/A", "N/A", "N/A", "Y", "N/A");
    } else if (!participantModule) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "Home Mouthwash", "N/A", "N/A", "N/A", "N", "N/A");
    } else if (participantModule[fieldMapping.mouthwashSurveyFlag] === fieldMapping.submitted1) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Survey", "Home Mouthwash", "Submitted",
        formatUTCDate(participantModule[fieldMapping.mouthwashSurveyCompletedDate]), "N/A", "N", "N/A");
    } else if (participantModule[fieldMapping.mouthwashSurveyFlag] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "Home Mouthwash", "Started",
        formatUTCDate(participantModule[fieldMapping.mouthwashSurveyStartedDate]), "N/A", "N", "N/A");
    } else {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "Home Mouthwash", "Not Started", "N/A", "N/A", "N", "N/A");
    }

    return template;
};

export const baselinePromisSurvey = (participant) => {
    
    const refusedAllFutureSurveys = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedFutureSurveys];
    const refusedAllFutureActivities = participant[fieldMapping.refusedAllFutureActivities];
    const refusedQualityOfLifeSurvey = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedQualityOfLifeSurvey];

    const { icon, color, itemStatus, date } = getSurveyStatus(participant, fieldMapping.promisSurveyFlag, fieldMapping.promisSurveyStartedDate, fieldMapping.promisSurveyCompletedDate);

    const timeline = "Follow-Up 3-mo";
    const category = "Survey";
    const item = "Quality of Life";
    const setting = "N/A";
    const refused = refusedAllFutureSurveys === fieldMapping.yes || refusedAllFutureActivities === fieldMapping.yes || refusedQualityOfLifeSurvey === fieldMapping.yes ? "Y" : "N";
    const extra = "N/A";

    return getTemplateRow(icon, color, timeline, category, item, itemStatus, date, setting, refused, extra);
};

export const baselineExperienceSurvey = (participant) => {
    
    const refusedAllFutureSurveys = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedFutureSurveys];
    const refusedAllFutureActivities = participant[fieldMapping.refusedAllFutureActivities];
    const refusedExperienceSurvey = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedExperienceSurvey];

    const { icon, color, itemStatus, date } = getSurveyStatus(participant, fieldMapping.experienceSurvey, fieldMapping.experienceSurveyStartDate, fieldMapping.experienceCompleteDate);

    const timeline = "Cross-Sectional 2024";
    const category = "Survey";
    const item = "2024 Connect Experience";
    const setting = "N/A";
    const refused = refusedAllFutureSurveys === fieldMapping.yes || refusedAllFutureActivities === fieldMapping.yes || refusedExperienceSurvey === fieldMapping.yes ? "Y" : "N";
    const extra = "N/A";

    return getTemplateRow(icon, color, timeline, category, item, itemStatus, date, setting, refused, extra);
};

export const dhqSurvey = (data) => {
    // Note: Decision was made to not include refusal options specific to the Diet History Questionnaire
    let { icon, color, itemStatus, date } = getSurveyStatus(data, fieldMapping.dhqSurveyStatus, fieldMapping.dhqSurveyStartDate, fieldMapping.dhqSurveyCompletedDate);

    if (!data[fieldMapping.dhqSurveyStatus]) itemStatus = "Not Eligible";

    const dhqUsername = data[fieldMapping.dhqUsername];
    const dhqStudyID = data[fieldMapping.dhqStudyID];
    const setting = dhqUsername && dhqStudyID ? `Username: ${dhqUsername}, Study ID: ${dhqStudyID.replace('study_', ' ')}` : "N/A";
    
    return getTemplateRow(icon, color, "Follow-Up 6-mo", "Survey", "DHQ III", itemStatus, date, setting, "N/A", "N/A");
};

export const cancerScreeningHistorySurvey = (data) => {
    const refusedAllFutureSurveys = data[fieldMapping.refusalOptions]?.[fieldMapping.refusedFutureSurveys];
    const refusedAllFutureActivities = data[fieldMapping.refusedAllFutureActivities];
    const refusedCancerScreeningHistorySurvey = data[fieldMapping.refusalOptions]?.[fieldMapping.refusedCancerScreeningHistorySurvey];
    const refused = refusedAllFutureSurveys === fieldMapping.yes || refusedAllFutureActivities === fieldMapping.yes || refusedCancerScreeningHistorySurvey === fieldMapping.yes ? "Y" : "N";
    let { icon, color, itemStatus, date } = getSurveyStatus(data, fieldMapping.cancerScreeningHistorySurveyStatus, fieldMapping.cancerScreeningHistorySurveyStartDate, fieldMapping.cancerScreeningHistorySurveyCompletedDate);

    if (!data[fieldMapping.cancerScreeningHistorySurveyStatus]) itemStatus = "Not Eligible";

    return getTemplateRow(icon, color, "Follow-Up 9-mo", "Survey", "Cancer Screening History", itemStatus, date, "N/A", refused, "N/A");
};

export const baselineMenstrualSurvey = (participant) => {
    let template = ``;

    if (participant[fieldMapping.menstrualFlag] === fieldMapping.submitted1) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Survey", "Menstrual Cycle", "Submitted",
        formatUTCDate(participant[fieldMapping.menstrualDateTimeCompleted]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.menstrualFlag] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "Menstrual Cycle", "Started",
        formatUTCDate(participant[fieldMapping.menstrualDateTimeStart]), "N/A", "N", "N/A");
    } else {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "Menstrual Cycle", "Not Started", "N/A", "N/A", "N", "N/A");
    }

    return template;
}

export const baselineEMR = (participantModule) => {
    const baselineEMR = participantModule[fieldMapping.baselineEMR]
    let template = ``;

    if (!baselineEMR) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "EMR", "N/A", "Not Pushed", "N/A", "N/A", "N", "N/A");
    } else if (baselineEMR[fieldMapping.baselineEMRflag] === fieldMapping.yes) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "EMR", "N/A", "Pushed",
        formatUTCDate(baselineEMR[fieldMapping.baselineEMRpushDate]), "N/A", "N/A", "N/A");
    } else {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "EMR", "N/A", "Not Pushed", "N/A", "N/A", "N/A", "N/A");
    }
    
    return template;    
}

export const baselinePayment = (participantModule) => {
    let template = ``;

    if (!participantModule) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Payment", "N/A", "N/A", "N/A", "N/A", "N/A", "N/A");
    } else if (
        participantModule[fieldMapping.paymentRoundup] &&
        participantModule[fieldMapping.paymentRoundup][fieldMapping.baselinePayment][fieldMapping.eligiblePayment] === fieldMapping.yes
    ) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Payment", "N/A", "Eligible", 
            formatUTCDate(participantModule[fieldMapping.paymentRoundup][fieldMapping.baselinePayment][fieldMapping.eligiblePaymentRoundTimestamp]),
            "N/A", "N/A", checkIncentiveIssued(participantModule)
        );
    } else {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Payment", "N/A", "Not Eligible", "N/A", "N/A", "N/A", checkIncentiveIssued(participantModule));
    }

    return template;
}

export const baselinePhysActReport = (participantModule, reports) => {
    let reportData;
    if (reports && reports.physActReport) {
        reportData = reports.physActReport;
    }

    let icon, iconColor, status, date, refused, extra;
    if (reportData) {
        icon = "fa fa-check fa-2x";
        iconColor = "color: green";
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
        extra = '<a style="color: blue; text-decoration: underline; cursor: pointer;" target="_blank" id="downloadPhysActReport">Download Link</a>'
    } else {
        icon = "fa fa-times fa-2x";
        iconColor = "color: red";
        status = 'Unavailable';
        date = 'N/A';
        refused = 'N/A';
        extra = '<span style="color: grey; text-decoration: underline;">Download Link</span>'
    }

    let template = getTemplateRow(icon, iconColor, "Baseline", "ROI", "Phys Act", status, date, "N/A", refused, extra);
    return template
}

export const dhq3Report = (participantData, reports) => {

    let icon, iconColor, status, date, refused, extra;

    const isSurveySubmitted = participantData[fieldMapping.dhqSurveyStatus] === fieldMapping.submitted;
    if (isSurveySubmitted) {
        icon = "fa fa-check fa-2x";
        iconColor = "color: green";
        status = 'Available';
        date = participantData[fieldMapping.dhqSurveyCompletedDate] ? formatUTCDate(participantData[fieldMapping.dhqSurveyCompletedDate]) : 'N/A';
        
        switch (participantData[fieldMapping.reports.dhq3.reportStatusInternal]) {
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
                refused = 'Unread';
        }
        
        extra = '<a style="color: blue; text-decoration: underline; cursor: pointer;" target="_blank" id="downloadDHQHEIReport">Download Link</a>'

    } else {
        icon = "fa fa-times fa-2x";
        iconColor = "color: red";
        status = 'Unavailable';
        date = 'N/A';
        refused = 'N/A';
        extra = '<span style="color: grey; text-decoration: underline;">Download Link</span>'
    }

    return getTemplateRow(icon, iconColor, "Baseline", "ROI", "HEI Report - DHQ III", status, date, "N/A", refused, extra);
}


const getSurveyStatus = (participant, surveyFlag, startDate, completeDate) => {
    switch (participant[surveyFlag]) {
        case fieldMapping.submitted1:
            return {
                icon: "fa fa-check fa-2x",
                color: "color: green",
                itemStatus: "Submitted",
                date: formatUTCDate(participant[completeDate]),
            };
        case fieldMapping.started1:
            return {
                icon: "fa fa-hashtag fa-2x",
                color: "color: orange",
                itemStatus: "Started",
                date: formatUTCDate(participant[startDate]),
            };
        case fieldMapping.notYetEligible1:
            return {
                icon: "fa fa-times fa-2x",
                color: "color: red",
                itemStatus: "Not Yet Eligible",
                date: "N/A",
            };
        default:
            if ([fieldMapping.experienceSurvey, fieldMapping.dhqSurveyStatus].includes(surveyFlag) && (participant[surveyFlag] === null || participant[surveyFlag] === undefined)) {
                return {
                    icon: "fa fa-times fa-2x",
                    color: "color: red",
                    itemStatus: "Not Eligible",
                    date: "N/A",
                };
            }  else {
                return {
                    icon: "fa fa-times fa-2x",
                    color: "color: red",
                    itemStatus: "Not Started",
                    date: "N/A",
                };
            }
    }
};

const checkIncentiveIssued = (participantModule) => {
    return participantModule[fieldMapping.paymentRoundup] &&
    (participantModule[fieldMapping.paymentRoundup][fieldMapping.biospecimenFollowUp][fieldMapping.paymentIssued] === (fieldMapping.yes)) ? 
    `Issued on ${formatUTCDate(participantModule[fieldMapping.paymentRoundup][fieldMapping.biospecimenFollowUp][fieldMapping.datePaymentIssued])}`: 
    (participantModule[fieldMapping.paymentRoundup]?.[fieldMapping.biospecimenFollowUp]?.[fieldMapping.refusedBaselinePayment] === (fieldMapping.yes)) ? 
    `Declined on ${formatUTCDate(participantModule[fieldMapping.paymentRoundup][fieldMapping.biospecimenFollowUp][fieldMapping.refusedBaselinePaymentDate])}`:
    `N/A`
}

const biospecimenStatus = (biospecimenRow, biospecimenFlag) => {
    let template = ``;
    (biospecimenRow[fieldMapping.biospecimenCollectionDetail] &&
    !(biospecimenRow[fieldMapping.biospecimenCollectionDetail][fieldMapping.biospecimenFollowUp])) ?  
    (
        template += `N/A`
    ) : 
    (
        biospecimenRow[fieldMapping.biospecimenCollectionDetail] && (biospecimenRow[fieldMapping.biospecimenCollectionDetail][fieldMapping.biospecimenFollowUp][biospecimenFlag]) === (fieldMapping.biospecimenResearch) ?  
        (   
            template += `Research`
        ) : 
        biospecimenRow[fieldMapping.biospecimenCollectionDetail] && (biospecimenRow[fieldMapping.biospecimenCollectionDetail][fieldMapping.biospecimenFollowUp][biospecimenFlag]) === (fieldMapping.biospecimenClinical) ?
        (
            template += `Clinical`
        ) :  
        biospecimenRow[fieldMapping.biospecimenCollectionDetail] && (biospecimenRow[fieldMapping.biospecimenCollectionDetail][fieldMapping.biospecimenFollowUp][biospecimenFlag]) === (fieldMapping.biospecimenHome) ?
        (
            template += `Home`
        ) : (
            template += `N/A`
        )
    )   
    return template;
}

const setSampleDateTime = (biospecimenRow, biospecimenFlag, researchDateTime, clinicalDateTime) => {
    let biospecimenSampleDateTime = ``;
    
    (biospecimenRow[fieldMapping.biospecimenCollectionDetail] &&
        
         (biospecimenRow[fieldMapping.biospecimenCollectionDetail][fieldMapping.biospecimenFollowUp][biospecimenFlag]) === (fieldMapping.biospecimenResearch) ?  
            (   
                biospecimenSampleDateTime += formatUTCDate(biospecimenRow[fieldMapping.biospecimenCollectionDetail][fieldMapping.biospecimenFollowUp][researchDateTime])
            ) : 
        (biospecimenRow[fieldMapping.biospecimenCollectionDetail][fieldMapping.biospecimenFollowUp][biospecimenFlag]) === (fieldMapping.biospecimenClinical) ?
            (
                biospecimenSampleDateTime += formatUTCDate(biospecimenRow[fieldMapping.biospecimenCollectionDetail][fieldMapping.biospecimenFollowUp][clinicalDateTime])
            ) : ``
    )   
    return biospecimenSampleDateTime;
}

const biospecimenStatusMouthwash = (biospecimenRow) => {
    let template = ``;
    !(biospecimenRow) ?  
    (
        template += `N/A`
    ) : 
    (
        (biospecimenRow[fieldMapping.biospecimenFlag]) === (fieldMapping.biospecimenClinical) ?
        (
            template += `Clinical`
        ) : (
            template += `Home`
        )
    )   
    return template;
}

const getTemplateRow = (faIcon, color, timeline, category, item, status, date, setting, refused, extra) => {
    let template = ``;
    template += 
    `
        <td><i class="${faIcon}" style="${color};"></i></td>
        <td>${timeline}</td>
        <td>${category}</td>
        <td>${item}</td>
        <td>${status}</td>
        <td>${date}</td>
        <td>${setting}</td>
        <td>${refused}</td>
        <td>${extra}</td>
    `
    return template;
}