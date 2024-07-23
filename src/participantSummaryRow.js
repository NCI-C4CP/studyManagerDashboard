import { humanReadableMDY } from './utils.js';
import fieldMapping from './fieldToConceptIdMapping.js';

export const userProfile = (participant) => {
    let template = ``;

    if (!participant) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Enrollment", "N/A", "User Profile", "N/A", "N/A", "N/A", "N", "N/A");
    } else if (participant[fieldMapping.userProfileFlag] === fieldMapping.yes) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Enrollment", "N/A", "User Profile", "Submitted",
                                    humanReadableMDY(participant[fieldMapping.userProfileDateTime]), "N/A", "N", "N/A");
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
        humanReadableMDY(participant[fieldMapping.verficationDate]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.verifiedFlag] === fieldMapping.cannotBeVerified) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Enrollment", "N/A", "Verification Status", "Can't be Verified",
        humanReadableMDY(participant[fieldMapping.verficationDate]) || "N/A", "N/A", "N", "N/A");
    } else if (participant[fieldMapping.verifiedFlag] === fieldMapping.notYetVerified) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Enrollment", "N/A", "Verification Status", "Not yet Verified",
        "N/A", "N/A", "N", "N/A");
    } else if (participant[fieldMapping.verifiedFlag] === fieldMapping.duplicate) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Enrollment", "N/A", "Verification Status", "Duplicate",
        humanReadableMDY(participant[fieldMapping.verficationDate]) || "N/A", "N/A", "N", "N/A");
    } else {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Enrollment", "N/A", "Verification Status", "Outreach Timed Out",
        humanReadableMDY(participant[fieldMapping.verficationDate]) || "N/A", "N/A", "N", "N/A");
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
  517216441: "Pending",
  849527480: "Address Printed",
  241974920: "Assigned",
  277438316: "Shipped",
  375535639: "Received",
};

export const baselineMouthwashSample = (participantModule) => {
  const homeMouthwashData =
    participantModule[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[fieldMapping.bioKitMouthwash] || {};
  const collectionTime =
    participantModule[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[fieldMapping.mouthwashDateTime] ||
    "";
  const [yyyy, mm, dd] = collectionTime.split("T")[0].split("-");

  let collectionDate = "N/A";
  if (yyyy && mm && dd) {
    collectionDate = `${mm}/${dd}/${yyyy}`;
  }

  const kitStatusStr = kitStatusCidToString[homeMouthwashData[fieldMapping.kitStatus]];
  let displayedFields = {
    icon: {faIcon: "fa fa-times fa-2x", style: "color: red"},
    status: "Not Collected",
    date: "N/A",
    setting: "N/A",
    refused: "N",
    extra: kitStatusStr ? "Kit " + kitStatusStr : "N/A",
  };

  const baselineMouthwashCollected = participantModule[fieldMapping.mouthwash];
  if (baselineMouthwashCollected === fieldMapping.yes) {
    displayedFields = {
      ...displayedFields,
      icon: {faIcon: "fa fa-check fa-2x", style: "color: green"},
      status: "Collected",
      date: collectionDate,
      setting: "Research",
    };
  }

  const isHomeMouthwash = homeMouthwashData[fieldMapping.kitType] === fieldMapping.kitTypeValues.mouthwash;
  if (isHomeMouthwash) {
    displayedFields = {
      ...displayedFields,
      icon: {faIcon: "fa fa-times fa-2x", style: "color: red"},
      status: "Not Collected",
      date: "N/A",
      setting: "Home",
    };
  }

  const isHomeMouthwashTubeReceived =
    homeMouthwashData[fieldMapping.kitStatus] === fieldMapping.kitStatusValues.received;
  if (isHomeMouthwashTubeReceived) {
    displayedFields = {
      ...displayedFields,
      icon: {faIcon: "fa fa-check fa-2x", style: "color: green"},
      status: "Collected",
      date: collectionDate,
      setting: "Home",
    };
  }

  const refusedMouthwashOption = participantModule[fieldMapping.refusalOptions]?.[fieldMapping.refusedMouthwash];
  if (refusedMouthwashOption === fieldMapping.yes) {
    displayedFields.refused = "Y";
  }

  return getTemplateRow(
    displayedFields.icon.faIcon,
    displayedFields.icon.style,
    "Baseline",
    "Sample",
    "Mouthwash",
    displayedFields.status,
    displayedFields.date,
    displayedFields.setting,
    displayedFields.refused,
    displayedFields.extra
  );
};

export const baselineBOHSurvey = (participant) => {
    let refusedSurveyOption = participant[fieldMapping.refusalOptions]?.[fieldMapping.refusedSurvey];
    let template = ``;
    
    if (refusedSurveyOption === fieldMapping.yes) {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Survey", "BOH", "N/A", "N/A", "N/A", "Y", "N/A");
    } else if (participant[fieldMapping.bohStatusFlag1] === fieldMapping.submitted1) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Survey", "BOH", "Submitted",
        humanReadableMDY(participant[fieldMapping.bohCompletedDate1]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.bohStatusFlag1] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "BOH", "Started",
        humanReadableMDY(participant[fieldMapping.bohStartDate1]), "N/A", "N", "N/A");
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
        humanReadableMDY(participant[fieldMapping.mreCompletedDate1]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.mreStatusFlag1] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "MRE", "Started",
        humanReadableMDY(participant[fieldMapping.mreStartDate1]), "N/A", "N", "N/A");
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
        humanReadableMDY(participant[fieldMapping.sasCompletedDate1]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.sasStatusFlag1] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "SAS", "Started",
        humanReadableMDY(participant[fieldMapping.sasStartDate1]), "N/A", "N", "N/A");
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
    } else if (participant[fieldMapping.lawStausFlag1] === fieldMapping.submitted1) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Survey", "LAW", "Submitted",
        humanReadableMDY(participant[fieldMapping.lawCompletedDate1]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.lawStausFlag1] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "LAW", "Started",
        humanReadableMDY(participant[fieldMapping.lawStartDate1]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.lawStausFlag1] === fieldMapping.notStarted1) {
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
        humanReadableMDY(participant[fieldMapping.covidCompletedDate]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.covidFlag] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "COVID", "Started",
        humanReadableMDY(participant[fieldMapping.covidStartDate]), "N/A", "N", "N/A");
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
        humanReadableMDY(participant[fieldMapping.combinedBoodUrineMouthwashSurveyCompleteDate]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.combinedBoodUrineMouthwashSurvey] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "Blood/Urine/Mouthwash", "Started",
        humanReadableMDY(participant[fieldMapping.combinedBoodUrineMouthwashSurveyStartDate]), "N/A", "N", "N/A");
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
        humanReadableMDY(participant[fieldMapping.bloodUrineSurveyCompletedDate]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.bloodUrineSurveyFlag] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "Clinical Blood/Urine", "Started",
        humanReadableMDY(participant[fieldMapping.bloodUrineSurveyStartedDate]), "N/A", "N", "N/A");
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
        humanReadableMDY(participantModule[fieldMapping.mouthwashSurveyCompletedDate]), "N/A", "N", "N/A");
    } else if (participantModule[fieldMapping.mouthwashSurveyFlag] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "Home Mouthwash", "Started",
        humanReadableMDY(participantModule[fieldMapping.mouthwashSurveyStartedDate]), "N/A", "N", "N/A");
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

export const baselineMenstrualSurvey = (participant) => {
    let template = ``;

    if (participant[fieldMapping.menstrualFlag] === fieldMapping.submitted1) {
        template += getTemplateRow("fa fa-check fa-2x", "color: green", "Baseline", "Survey", "Menstrual Cycle", "Submitted",
        humanReadableMDY(participant[fieldMapping.menstrualDateTimeCompleted]), "N/A", "N", "N/A");
    } else if (participant[fieldMapping.menstrualFlag] === fieldMapping.started1) {
        template += getTemplateRow("fa fa-hashtag fa-2x", "color: orange", "Baseline", "Survey", "Menstrual Cycle", "Started",
        humanReadableMDY(participant[fieldMapping.menstrualDateTimeStart]), "N/A", "N", "N/A");
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
        humanReadableMDY(baselineEMR[fieldMapping.baselineEMRpushDate]), "N/A", "N/A", "N/A");
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
                                    humanReadableMDY(participantModule[fieldMapping.paymentRoundup][fieldMapping.baselinePayment][fieldMapping.baselinePaymentDate]),
                                        "N/A", "N/A", checkIncentiveIssued(participantModule)
    );
    } else {
        template += getTemplateRow("fa fa-times fa-2x", "color: red", "Baseline", "Payment", "N/A", "Not Eligible", "N/A", "N/A", "N/A", checkIncentiveIssued(participantModule)
    );
}

return template;
}

const getSurveyStatus = (participant, surveyFlag, startDate, completeDate) => {
    switch (participant[surveyFlag]) {
        case fieldMapping.submitted1:
            return {
                icon: "fa fa-check fa-2x",
                color: "color: green",
                itemStatus: "Submitted",
                date: humanReadableMDY(participant[completeDate]),
            };
        case fieldMapping.started1:
            return {
                icon: "fa fa-hashtag fa-2x",
                color: "color: orange",
                itemStatus: "Started",
                date: humanReadableMDY(participant[startDate]),
            };
        case fieldMapping.notYetEligible1:
            return {
                icon: "fa fa-times fa-2x",
                color: "color: red",
                itemStatus: "Not Yet Eligible",
                date: "N/A",
            };
        default:
            return {
                icon: "fa fa-times fa-2x",
                color: "color: red",
                itemStatus: "Not Started",
                date: "N/A",
            };
    }
};

const checkIncentiveIssued = (participantModule) => {
    return participantModule[fieldMapping.paymentRoundup] &&
    (participantModule[fieldMapping.paymentRoundup][fieldMapping.biospecimenFollowUp][fieldMapping.paymentIssued] === (fieldMapping.yes)) ? 
    `Issued on ${humanReadableMDY(participantModule[fieldMapping.paymentRoundup][fieldMapping.biospecimenFollowUp][fieldMapping.datePaymentIssued])}`: 
    (participantModule[fieldMapping.paymentRoundup]?.[fieldMapping.biospecimenFollowUp]?.[fieldMapping.refusedBaselinePayment] === (fieldMapping.yes)) ? 
    `Declined on ${humanReadableMDY(participantModule[fieldMapping.paymentRoundup][fieldMapping.biospecimenFollowUp][fieldMapping.refusedBaselinePaymentDate])}`:
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
                biospecimenSampleDateTime += humanReadableMDY(biospecimenRow[fieldMapping.biospecimenCollectionDetail][fieldMapping.biospecimenFollowUp][researchDateTime])
            ) : 
        (biospecimenRow[fieldMapping.biospecimenCollectionDetail][fieldMapping.biospecimenFollowUp][biospecimenFlag]) === (fieldMapping.biospecimenClinical) ?
            (
                biospecimenSampleDateTime += humanReadableMDY(biospecimenRow[fieldMapping.biospecimenCollectionDetail][fieldMapping.biospecimenFollowUp][clinicalDateTime])
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