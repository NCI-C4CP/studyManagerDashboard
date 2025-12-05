import fieldMapping from './fieldToConceptIdMapping.js';

const field = (key, label) => ({ key, label });

/**
 * Categories used to group participant result bubble fields.
 * Each entry contains a key (for DOM hooks), a label for the UI, and the ordered field keys.
 */
const baseBubbleCategories = [
  {
    key: 'default-columns',
    label: 'Default Columns',
    fields: [
      field(fieldMapping.fName, 'First Name (UP)'),
      field(fieldMapping.mName, 'Middle Name (UP)'),
      field(fieldMapping.lName, 'Last Name (UP)'),
      field(fieldMapping.birthMonth, 'DOB Month'),
      field(fieldMapping.birthDay, 'DOB Day'),
      field(fieldMapping.birthYear, 'DOB Yr'),
      field(fieldMapping.email, 'Pref Email'),
      field('Connect_ID', 'Connect ID'),
      field(fieldMapping.healthcareProvider, 'Site'),
    ],
  },
  {
    key: 'identifiers',
    label: 'Identifiers',
    fields: [
      field('Connect_ID', 'Connect ID'),
      field('pin', 'Pin'),
      field('token', 'Token'),
      field('studyId', 'Study ID'),
    ],
  },
  {
    key: 'enrollmentDetails',
    label: 'Enrollment Details',
    fields: [
      field(fieldMapping.healthcareProvider, 'Site'),
      field(fieldMapping.timeStudyIdSubmitted, 'D/T Study ID Sub'),
      field(fieldMapping.recruitmentType, 'Recruit Type'),
      field(fieldMapping.recruitmentDate, 'D/T Recruit Type Assigned'),
      field(fieldMapping.campaignType, 'Campaign'),
      field(fieldMapping.reinvitationCampaignType, 'Reinvitation Type'),
      field(fieldMapping.reinvitationDate, 'D/T Reinvitation'),
      field(fieldMapping.signedInFlag, 'Signed-in'),
      field(fieldMapping.signinDate, 'D/T First Sign-in'),
      field(fieldMapping.pinEntered, 'PIN Entered'),
      field(fieldMapping.noPin, 'No PIN'),
      field(fieldMapping.consentFlag, 'Consent Sub'),
      field(fieldMapping.consentDate, 'D/T Consent Sub'),
      field(fieldMapping.consentVersion, 'Consent Vers'),
      field(fieldMapping.hipaaFlag, 'HIPAA Auth'),
      field(fieldMapping.hipaaDate, 'D/T HIPAA Auth'),
      field(fieldMapping.hipaaVersion, 'HIPAA Ver'),
      field(fieldMapping.userProfileFlag, 'UP Sub'),
      field(fieldMapping.userProfileDateTime, 'D/T UP Sub'),
      field(fieldMapping.verifiedFlag, 'Verif Stat'),
      field(fieldMapping.verficationDate, 'D/T Verif'),
      field(fieldMapping.preConsentOptOut, 'Pre-consent Opt-out'),
      field(fieldMapping.datePreConsentOptOut, 'D/T Pre-consent Opt-out'),
      field(fieldMapping.maxNumContactsReached, 'Reached Max Contact N'),
    ],
  },
  {
    key: 'deIdentifiedData',
    label: 'De-Identified Data',
    fields: [
      field(fieldMapping.siteReportedAge, 'Site Reported Age'),
      field(fieldMapping.siteReportedRace, 'Site Reported Race/Eth'),
      field(fieldMapping.siteReportedSex, 'Site Reported Sex'),
      field(fieldMapping.sanfordReportedSex, 'HFH Reported Sex'),
      field(fieldMapping.sanfordReportedRace, 'SF Reported Race'),
      field(fieldMapping.sanfordReportedEthnicity, 'SF Reported Eth'),
      field(fieldMapping.henryFReportedRace, 'HFH Reported Race'),
      field(fieldMapping.bswhReportedRaceEthnicity, 'BSWH Reported R/E'),
      field(fieldMapping.eligAlgorithmVersion, 'Elig Algorithm Vers'),
      field(fieldMapping.ihcsMemberStatus, 'IHCS Member Status'),
    ],
  },
  {
    key: 'verificationTable',
    label: 'Verification Table Variables',
    fields: [
      field(fieldMapping.automatedVerification, 'Auto Verif'),
      field(fieldMapping.outreachRequiredForVerification, 'Outreach Required'),
      field(fieldMapping.manualVerification, 'Manual Verif'),
      field(fieldMapping.duplicateType, 'Dup Type'),
      field(fieldMapping.updateRecruitType, 'Update Recruit Type'),
      field(fieldMapping.firstNameMatch, 'First Name Match'),
      field(fieldMapping.lastNameMatch, 'Last Name Match'),
      field(fieldMapping.dobMatch, 'DOB Match'),
      field(fieldMapping.pinMatch, 'PIN Match'),
      field(fieldMapping.tokenMatch, 'Token Match'),
      field(fieldMapping.zipCodeMatch, 'Zip Match'),
      field(fieldMapping.siteMatch, 'Site Match'),
      field(fieldMapping.ageMatch, 'Age Match'),
      field(fieldMapping.cancerStatusMatch, 'Cx Status Match'),
    ],
  },
  {
    key: 'accountDetails',
    label: 'Account Details',
    fields: [
      field(fieldMapping.signInMechanism, 'Sign-In Mech'),
      field(fieldMapping.accountPhone, 'Phone Login'),
      field(fieldMapping.accountEmail, 'Email Login'),
      field(fieldMapping.consentFirstName, 'First Name (Consent)'),
      field(fieldMapping.consentMiddleName, 'Middle Name (Consent)'),
      field(fieldMapping.consentLastName, 'Last Name (Consent)'),
    ],
  },
  {
    key: 'userProfileDetails',
    label: 'User Profile Details',
    fields: [
      field(fieldMapping.prefName, 'Pref Name'),
      field(fieldMapping.fName, 'First Name (UP)'),
      field(fieldMapping.mName, 'Middle Name (UP)'),
      field(fieldMapping.lName, 'Last Name (UP)'),
      field(fieldMapping.suffix, 'Suffix (UP)'),
      field(fieldMapping.birthMonth, 'DOB Month'),
      field(fieldMapping.birthDay, 'DOB Day'),
      field(fieldMapping.birthYear, 'DOB Yr'),
      field(fieldMapping.address1, 'Mailing Address Line 1'),
      field(fieldMapping.address2, 'Mailing Address Line 2'),
      field(fieldMapping.address3, 'Mailing Address Line 3'),
      field(fieldMapping.city, 'Mailing Address City'),
      field(fieldMapping.state, 'Mailing Address State'),
      field(fieldMapping.zip, 'Mailing Address Zip'),
      field(fieldMapping.country, 'Mailing Address Country'),
      field(fieldMapping.physicalAddress1, 'Phys Address Line 1'),
      field(fieldMapping.physicalAddress2, 'Phys Address Line 2'),
      field(fieldMapping.physicalAddress3, 'Phys Address Line 3'),
      field(fieldMapping.physicalCity, 'Phys Address City'),
      field(fieldMapping.physicalState, 'Phys Address State'),
      field(fieldMapping.physicalZip, 'Phys Address Zip'),
      field(fieldMapping.physicalCountry, 'Phys Address Country'),
      field(fieldMapping.altAddress1, 'Alt Address Line 1'),
      field(fieldMapping.altAddress2, 'Alt Address Line 2'),
      field(fieldMapping.altAddress3, 'Alt Address Line 3'),
      field(fieldMapping.altCity, 'Alt Address City'),
      field(fieldMapping.altState, 'Alt Address State'),
      field(fieldMapping.altZip, 'Alt Address Zip'),
      field(fieldMapping.altCountry, 'Alt Address Country'),
      field(fieldMapping.email, 'Pref Email'),
      field(fieldMapping.email1, 'Addl Email 1'),
      field(fieldMapping.email2, 'Addl Email 2'),
      field(fieldMapping.cellPhone, 'Mobile Phone'),
      field(fieldMapping.canWeText, 'SMS Opt in'),
      field(fieldMapping.homePhone, 'Home Phone'),
      field(fieldMapping.otherPhone, 'Oth Phone'),
      field(fieldMapping.previousCancer, 'Previous Cx'),
      field(fieldMapping.preferredLanguage, 'Preferred Language'),
    ],
  },
  {
    key: 'studyActivityCompletion',
    label: 'Study Activity Completion',
    fields: [
      // Surveys. Note: all surveys flags are (null, not yet eligible, not started, started, submitted)
      // Except Full SSN and Partial SSN, which are yes/no based on the ssn submission type (if submission has occurred).
      field(fieldMapping.allBaselineSurveysCompleted, 'All Base Surv Complete'),
      field(fieldMapping.bohStatusFlag, 'Flag Base Mod BOH'),
      field(fieldMapping.mreStatusFlag, 'Flag Base Mod MRE'),
      field(fieldMapping.sasStatusFlag, 'Flag Base Mod SAS'),
      field(fieldMapping.lawStatusFlag, 'Flag Base Mod LAW'),
      field(fieldMapping.ssnStatusFlag, 'Flag SSN Surv'),
      field(fieldMapping.ssnFullFlag, 'Full SSN'),
      field(fieldMapping.ssnPartialFlag, 'Part SSN'),
      field(fieldMapping.combinedBoodUrineMouthwashSurvey, 'Flag B/U/MW Rsrch Surv'),
      field(fieldMapping.bloodUrineSurveyFlag, 'Flag Blood/Ur Surv'),
      field(fieldMapping.mouthwashSurveyFlag, 'Flag MW Surv'),
      field(fieldMapping.menstrualFlag, 'Flag Mens Surv'),
      field(fieldMapping.covidFlag, 'Flag COV Surv'),
      field(fieldMapping.promisSurveyFlag, 'Flag 3-mo PROMIS Surv'),
      field(fieldMapping.dhqSurveyStatus, 'Flag 6-mo DHQ3 Surv'),
      field(fieldMapping.cancerScreeningHistorySurveyStatus, 'Flag 9-mo CSH Surv'),
      field(fieldMapping.experienceSurvey, 'Flag 2024 CES Surv'),
      field(fieldMapping.preferenceSurveyStatus, 'Flag 2025 ROI Pref Surv'),
      // Specimen collection status
      field(fieldMapping.baselineBloodCollectedFlag, 'BL Blood Collected'),                 // non-nested
      field(fieldMapping.biospecimenBloodCollection, 'BL Blood Collection Setting'),        // nested 173836415.266600170.592099155
      field(fieldMapping.urineFlag, 'BL Ur Collected'),                                     // non-nested
      field(fieldMapping.biospecimenUrineCollection, 'BL Urine Collection Setting'),        // nested 173836415.266600170.718172863
      field(fieldMapping.baselineMouthwashCollectedFlag, 'BL MW Collected'),                // non-nested
      field(fieldMapping.biospecimenMouthwashCollection, 'BL Mouthwash Collection Setting'),// nested 173836415.266600170.915179629
    ],
  },
  // Done and checked beyond here.
  {
    key: 'refusalsWithdrawals',
    label: 'Refusals/Withdrawals',
    fields: [
      field(fieldMapping.participationStatus, 'Participation Status'),
      field(fieldMapping.refusedSurvey, 'Ref Base Survs'),
      field(fieldMapping.refusedQualityOfLifeSurvey, 'Ref 3-mo QOL Surv'),
      field(fieldMapping.refusedAllFutureQualityOfLifeSurveys, 'Ref All QOL Surv'),
      field(fieldMapping.refusedCancerScreeningHistorySurvey, 'Ref Canc Scrn Hist Srv'),
      field(fieldMapping.refusedExperienceSurvey, 'Ref 2024 Connect Exp Srv'),
      field(fieldMapping.refusedAllFutureExperienceSurveys, 'Ref All Fut Connect Exp Srvs'),
      field(fieldMapping.refusedFutureSurveys, 'Ref All Fut Surv'),
      field(fieldMapping.refusedBlood, 'Ref Base Blood'),
      field(fieldMapping.refusedUrine, 'Ref Base Ur'),
      field(fieldMapping.refusedMouthwash, 'Ref Base MW'),
      field(fieldMapping.refusedFutureSamples, 'Ref All Fut Samp'),
      field(fieldMapping.refusedSpecimenSurveys, 'Ref Base Spec Surv'),
      field(fieldMapping.refusedAllFutureActivities, 'Ref All Fut Activities'),
      field(fieldMapping.revokeHIPAA, 'Revoke HIPAA'),
      field(fieldMapping.dateHipaaRevokeRequested, 'D/T HIPAA Rev Req'),
      field(fieldMapping.withdrawConsent, 'Withdraw consent'),
      field(fieldMapping.dateWithdrewConsentRequested, 'D/T Withdrew Consent'),
      field(fieldMapping.participantDeceased, 'Participant Deceased'),
      field(fieldMapping.dateOfDeath, 'Date Part Deceased'),
      field(fieldMapping.destroyData, 'Data Dest'),
      field(fieldMapping.dateDataDestroyRequested, 'D/T Data Dest Req'),
      field(fieldMapping.dateHIPAARevoc, 'D/T HIPAA Rev Signed'),
      field(fieldMapping.dateDataDestroy, 'D/T Data Dest Signed'),
      field(fieldMapping.suspendContact, 'Suspend Contact Until D/T'),
    ],
  },
];

const mapCategories = () => {
  const bubbleFieldMap = new Map();
  const bubbleCategories = baseBubbleCategories.map((category) => {
    const fields = (category.fields ?? []).map((field) => {
      bubbleFieldMap.set(field.key, field.label);
      return { ...field };
    });
    return { ...category, fields };
  });

  return {
    bubbleFieldMap,
    bubbleCategories,
    defaultColumnKeys: bubbleCategories.find((category) => category.key === 'default-columns')?.fields.map((field) => field.key) ?? [],
  };
};

export const { bubbleFieldMap, bubbleCategories, defaultColumnKeys } = mapCategories();
