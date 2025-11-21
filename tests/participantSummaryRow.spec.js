import { expect } from 'chai';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import {
  getSurveyStatus,
  biospecimenStatus,
  consentHandler,
  hipaaHandler,
  userProfile,
  verificationStatus,
  baselineBOHSurvey,
  baselinePromisSurvey,
  dhqSurvey,
  baselineBloodSample,
  baselineUrineSample,
  baselineResearchMouthwashSample,
  baselineHomeMouthwashSample,
  baselineMouthwashR1Sample,
  baselineMouthwashR2Sample,
  baselinePayment,
  baselinePhysActReport,
  dhq3Report,
} from '../src/participantSummaryRow.js';

const formatDate = (iso) => {
  const date = new Date(iso);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${mm}/${dd}/${yyyy}`;
};

const buildParticipant = (overrides = {}) => ({
  [fieldMapping.refusalOptions]: {},
  ...overrides,
});

describe('participantSummaryRow', () => {
  describe('getSurveyStatus', () => {
    it('returns submitted metadata with formatted completion date', () => {
      const participant = {
        [fieldMapping.bohStatusFlag]: fieldMapping.submitted,
        [fieldMapping.bohCompletedDate1]: '2024-04-15T00:00:00Z',
      };

      const status = getSurveyStatus(participant, fieldMapping.bohStatusFlag);

      expect(status).to.deep.equal({
        icon: 'fa fa-check fa-2x',
        color: 'icon--success',
        itemStatus: 'Submitted',
        date: formatDate('2024-04-15T00:00:00Z'),
      });
    });

    it('returns started metadata with formatted start date', () => {
      const participant = {
        [fieldMapping.bloodUrineSurveyFlag]: fieldMapping.started,
        [fieldMapping.bloodUrineSurveyStartedDate]: '2024-01-05T12:00:00Z',
      };

      const status = getSurveyStatus(participant, fieldMapping.bloodUrineSurveyFlag);

      expect(status).to.deep.equal({
        icon: 'fa fa-hashtag fa-2x',
        color: 'icon--warning',
        itemStatus: 'Started',
        date: formatDate('2024-01-05T12:00:00Z'),
      });
    });

    it('returns N/A date when timestamps are missing for started/submitted', () => {
      const participant = {
        [fieldMapping.mouthwashSurveyFlag]: fieldMapping.submitted,
      };

      const status = getSurveyStatus(participant, fieldMapping.mouthwashSurveyFlag);

      expect(status.date).to.equal('N/A');
      expect(status.itemStatus).to.equal('Submitted');
    });

    it('returns N/A metadata when survey flag is unmapped', () => {
      const status = getSurveyStatus({}, 999999);
      expect(status).to.deep.equal({
        icon: 'fa fa-times fa-2x',
        color: 'icon--error',
        itemStatus: 'N/A',
        date: 'N/A',
      });
    });

    it('returns not started metadata when survey never began', () => {
      const participant = {
        [fieldMapping.mreStatusFlag]: fieldMapping.notStarted,
      };

      const status = getSurveyStatus(participant, fieldMapping.mreStatusFlag);

      expect(status).to.deep.equal({
        icon: 'fa fa-times fa-2x',
        color: 'icon--error',
        itemStatus: 'Not Started',
        date: 'N/A',
      });
    });

    it('returns not yet eligible metadata when survey not available', () => {
      const participant = {
        [fieldMapping.promisSurveyFlag]: fieldMapping.notYetEligible,
      };

      const status = getSurveyStatus(participant, fieldMapping.promisSurveyFlag);

      expect(status).to.deep.equal({
        icon: 'fa fa-times fa-2x',
        color: 'icon--error',
        itemStatus: 'Not Yet Eligible',
        date: 'N/A',
      });
    });

    it('falls back to Not Eligible for Experience/CSH/Preference surveys', () => {
      const flags = [
        fieldMapping.experienceSurvey,
        fieldMapping.cancerScreeningHistorySurveyStatus,
        fieldMapping.preferenceSurveyStatus,
      ];

      flags.forEach((flag) => {
        const status = getSurveyStatus({}, flag);
        expect(status).to.deep.equal({
          icon: 'fa fa-times fa-2x',
          color: 'icon--error',
          itemStatus: 'Not Eligible',
          date: 'N/A',
        });
      });
    });

    it('falls back to Not Yet Eligible for DHQ', () => {
      const status = getSurveyStatus({}, fieldMapping.dhqSurveyStatus);
      expect(status).to.deep.equal({
        icon: 'fa fa-times fa-2x',
        color: 'icon--error',
        itemStatus: 'Not Yet Eligible',
        date: 'N/A',
      });
    });

    it('returns N/A metadata for unknown survey states', () => {
      const participant = {
        [fieldMapping.sasStatusFlag]: 12345,
      };

      const status = getSurveyStatus(participant, fieldMapping.sasStatusFlag);
      expect(status).to.deep.equal({
        icon: 'fa fa-times fa-2x',
        color: 'icon--error',
        itemStatus: 'N/A',
        date: 'N/A',
      });
    });
  });

  describe('consentHandler', () => {
    it('renders signed consent row with download link and formatted date', () => {
      const participant = {
        [fieldMapping.consentFlag]: fieldMapping.yes,
        [fieldMapping.consentDate]: '2024-03-20T00:00:00Z',
        [fieldMapping.consentVersion]: 'v2',
      };

      const row = consentHandler(participant);

      expect(row).to.include('fa fa-check fa-2x icon--success');
      expect(row).to.include('Signed');
      expect(row).to.include(formatDate('2024-03-20T00:00:00Z'));
      expect(row).to.include('v2');
      expect(row).to.include('id="downloadCopy"');
      expect(row).to.not.include('link--disabled');
    });

    it('renders not signed consent row with disabled link', () => {
      const participant = {
        [fieldMapping.consentFlag]: fieldMapping.no,
      };

      const row = consentHandler(participant);

      expect(row).to.include('fa fa-times fa-2x icon--error');
      expect(row).to.include('Not Signed');
      expect(row).to.include('N/A');
      expect(row).to.include('link--disabled');
      expect(row).to.not.include('id="downloadCopy"');
    });
  });

  describe('agreement handlers and profile state', () => {
    it('renders HIPAA row with active download when signed', () => {
      const participant = buildParticipant({
        [fieldMapping.hipaaFlag]: fieldMapping.yes,
        [fieldMapping.hipaaDate]: '2024-04-02T00:00:00Z',
        [fieldMapping.hipaaVersion]: 'HP_HIPAA_V1.0',
      });

      const row = hipaaHandler(participant);
      expect(row).to.include('HIPAA');
      expect(row).to.include('fa fa-check');
      expect(row).to.include('icon--success');
      expect(row).to.include(formatDate('2024-04-02T00:00:00Z'));
      expect(row).to.include('downloadCopyHIPAA');
    });

    it('renders disabled HIPAA row when not signed', () => {
      const row = hipaaHandler(buildParticipant());
      expect(row).to.include('Not Signed');
      expect(row).to.include('link--disabled');
    });

    it('renders user profile submission state', () => {
      const submittedRow = userProfile(buildParticipant({
        [fieldMapping.userProfileFlag]: fieldMapping.yes,
        [fieldMapping.userProfileDateTime]: '2024-05-01T00:00:00Z',
      }));
      expect(submittedRow).to.include('Submitted');
      expect(submittedRow).to.include(formatDate('2024-05-01T00:00:00Z'));
      expect(submittedRow).to.include('N</td>');

      const pendingRow = userProfile(buildParticipant());
      expect(pendingRow).to.include('Not Submitted');
      expect(pendingRow).to.include('N/A');
    });
  });

  describe('verificationStatus', () => {
    const createParticipant = (flag) => buildParticipant({
      [fieldMapping.verifiedFlag]: flag,
      [fieldMapping.verficationDate]: '2024-05-10T00:00:00Z',
    });

    it('marks verified participants with checkmark and date', () => {
      const row = verificationStatus(createParticipant(fieldMapping.verified));
      expect(row).to.include('fa fa-check');
      expect(row).to.include('icon--success');
      expect(row).to.include('Verified');
      expect(row).to.include(formatDate('2024-05-10T00:00:00Z'));
    });

    it('shows pending icons for not yet verified participants', () => {
      const row = verificationStatus(createParticipant(fieldMapping.notYetVerified));
      expect(row).to.include('fa fa-hashtag');
      expect(row).to.include('Not yet Verified');
      expect(row).to.include('N/A');
    });

    it('handles outreach timed out with warning styling', () => {
      const row = verificationStatus(createParticipant(fieldMapping.outreachTimedout));
      expect(row).to.include('fa fa-hashtag');
      expect(row).to.include('Outreach Timed Out');
    });

    it('flags unknown statuses as errors', () => {
      const row = verificationStatus(createParticipant(999999));
      expect(row).to.include('Error: unhandled status in verificationStatus');
    });
  });

  describe('survey rows and refusals', () => {
    it('includes refusal flag on baseline BOH survey rows', () => {
      const participant = buildParticipant({
        [fieldMapping.refusalOptions]: {
          [fieldMapping.refusedSurvey]: fieldMapping.yes,
        },
        [fieldMapping.bohStatusFlag]: fieldMapping.submitted,
        [fieldMapping.bohCompletedDate1]: '2024-03-03T00:00:00Z',
      });

      const row = baselineBOHSurvey(participant);
      expect(row).to.include('Y');
      expect(row).to.include('Submitted');
      expect(row).to.include(formatDate('2024-03-03T00:00:00Z'));
    });
  });

  describe('biospecimen samples', () => {
    it('renders collected blood sample status with research date', () => {
      const participant = buildParticipant({
        [fieldMapping.refusalOptions]: {
          [fieldMapping.refusedBlood]: fieldMapping.no,
        },
        [fieldMapping.baselineBloodCollectedFlag]: fieldMapping.yes,
        [fieldMapping.biospecimenCollectionDetail]: {
          [fieldMapping.biospecimenBaselineCollection]: {
            [fieldMapping.biospecimenBloodCollection]: fieldMapping.biospecimenResearch,
            [fieldMapping.researchBloodCollectedDateTime]: '2024-01-10T00:00:00Z',
          },
        },
      });

      const row = baselineBloodSample(participant);
      expect(row).to.include('Collected');
      expect(row).to.include('Research');
      expect(row).to.include('01/10/2024');
    });

    it('renders clinical urine collection details', () => {
      const participant = buildParticipant({
        [fieldMapping.refusalOptions]: {
          [fieldMapping.refusedUrine]: fieldMapping.yes,
        },
        [fieldMapping.urineFlag]: fieldMapping.yes,
        [fieldMapping.biospecimenCollectionDetail]: {
          [fieldMapping.biospecimenBaselineCollection]: {
            [fieldMapping.biospecimenUrineCollection]: fieldMapping.biospecimenClinical,
            [fieldMapping.clinicalUrineDateTime]: '2024-02-02T00:00:00Z',
          },
        },
      });

      const row = baselineUrineSample(participant);
      expect(row).to.include('Collected');
      expect(row).to.include('Clinical');
      expect(row).to.include('Y');
      expect(row).to.include('02/02/2024');
    });

    it('displays research mouthwash collection errors for malformed dates', () => {
      const participant = buildParticipant({
        [fieldMapping.baselineMouthwashCollectedFlag]: fieldMapping.yes,
        [fieldMapping.biospecimenCollectionDetail]: {
          [fieldMapping.biospecimenBaselineCollection]: {
            [fieldMapping.biospecimenMouthwashCollection]: fieldMapping.biospecimenResearch,
            [fieldMapping.mouthwashDateTime]: 'not-a-date',
          },
        },
      });

      const row = baselineResearchMouthwashSample(participant);
      expect(row).to.include('Invalid timestamp format: not-a-date');
    });

    it('renders home mouthwash initial kits with refusal state and kit status', () => {
      const participant = buildParticipant({
        [fieldMapping.refusalOptions]: {
          [fieldMapping.refusedMouthwash]: fieldMapping.yes,
        },
        [fieldMapping.collectionDetails]: {
          [fieldMapping.baseline]: {
            [fieldMapping.bioKitMouthwash]: {
              [fieldMapping.kitType]: fieldMapping.kitTypeValues.homeMouthwash,
              [fieldMapping.kitStatus]: fieldMapping.kitStatusValues.received,
              [fieldMapping.kitReceivedTime]: '2024-04-04T00:00:00Z',
            },
          },
        },
      });

      const row = baselineHomeMouthwashSample(participant);
      expect(row).to.include('Home Mouthwash Initial');
      expect(row).to.include('Collected');
      expect(row).to.include('Kit Received');
      expect(row).to.include('Y');
    });

    it('renders replacement kits without refusal data and exposes kit status text', () => {
      const participant = buildParticipant({
        [fieldMapping.collectionDetails]: {
          [fieldMapping.baseline]: {
            [fieldMapping.bioKitMouthwashBL1]: {
              [fieldMapping.kitType]: fieldMapping.kitTypeValues.homeMouthwash,
              [fieldMapping.kitStatus]: fieldMapping.kitStatusValues.pending,
            },
          },
        },
      });

      const row = baselineMouthwashR1Sample(participant);
      expect(row).to.include('Home Mouthwash R1');
      expect(row).to.include('Not Collected');
      expect(row).to.include('Kit Pending');
      expect(row).to.include('N/A');
    });
  });

  describe('payments and reports', () => {
    it('renders payment eligibility and choice', () => {
      const participant = {
        [fieldMapping.paymentRound]: {
          [fieldMapping.baselinePayment]: {
            [fieldMapping.eligiblePayment]: fieldMapping.yes,
            [fieldMapping.eligiblePaymentRoundTimestamp]: '2024-05-01T00:00:00Z',
            [fieldMapping.paymentChosen]: 'Gift Card',
          },
        },
      };

      const row = baselinePayment(participant);
      expect(row).to.include('Eligible');
      expect(row).to.include('Gift Card');
      expect(row).to.include('05/01/2024');
    });

    it('renders issued payment metadata when incentives are processed', () => {
      const participant = {
        [fieldMapping.paymentRound]: {
          [fieldMapping.biospecimenBaselineCollection]: {
            [fieldMapping.paymentIssued]: fieldMapping.yes,
            [fieldMapping.datePaymentIssued]: '2024-05-02T00:00:00Z',
          },
        },
      };

      const row = baselinePayment(participant);
      expect(row).to.include('Issued on 05/02/2024');
    });

    it('renders declined payment when participant refused baseline payment', () => {
      const participant = {
        [fieldMapping.paymentRound]: {
          [fieldMapping.baselinePayment]: {
            [fieldMapping.eligiblePayment]: fieldMapping.no,
            [fieldMapping.paymentChosen]: 'Direct Deposit',
          },
          [fieldMapping.biospecimenBaselineCollection]: {
            [fieldMapping.refusedBaselinePayment]: fieldMapping.yes,
            [fieldMapping.refusedBaselinePaymentDate]: '2024-05-03T00:00:00Z',
          },
        },
      };

      const row = baselinePayment(participant);
      expect(row).to.include('Not Eligible');
      expect(row).to.include('Declined on 05/03/2024');
    });

    it('renders physical activity report availability with viewed status', () => {
      const timestampKey = `d_${fieldMapping.reports.physicalActivity.reportTS}`;
      const participant = buildParticipant({
        [fieldMapping.reports.physicalActivityReport]: {
          [fieldMapping.reports.physicalActivity.status]: fieldMapping.reports.viewed,
        },
      });
      const reports = {
        physActReport: {
          [timestampKey]: '2024-06-06T00:00:00Z',
        },
      };

      const row = baselinePhysActReport(participant, reports);
      expect(row).to.include('Available');
      expect(row).to.include('Viewed');
      expect(row).to.include('downloadPhysActReport');
    });

    it('renders DHQ3 HEI report rows with combined internal/external statuses', () => {
      const participant = buildParticipant({
        [fieldMapping.dhqSurveyStatus]: fieldMapping.submitted,
        [fieldMapping.dhqSurveyCompletedDate]: '2024-07-07T00:00:00Z',
        [fieldMapping.reports.dhq3.reportStatusInternal]: fieldMapping.reports.viewed,
        [fieldMapping.reports.dhq3.reportStatusExternal]: fieldMapping.reports.declined,
      });

      const row = dhq3Report(participant, {});
      expect(row).to.include('Available');
      expect(row).to.include('Int: Viewed, Ext: Declined');
      expect(row).to.include('downloadDHQHEIReport');
    });

    it('disables DHQ3 HEI report when survey not submitted', () => {
      const row = dhq3Report(buildParticipant(), {});
      expect(row).to.include('Unavailable');
      expect(row).to.include('link--disabled');
    });
  });

  describe('biospecimenStatus', () => {
    it('returns Research when collection type is research', () => {
      const collection = {
        [fieldMapping.biospecimenBloodCollection]: fieldMapping.biospecimenResearch,
      };

      const status = biospecimenStatus(collection, fieldMapping.biospecimenBloodCollection, fieldMapping.biospecimenBaselineCollection);

      expect(status).to.equal('Research');
    });

    it('returns Clinical when collection type is clinical', () => {
      const collection = {
        [fieldMapping.biospecimenUrineCollection]: fieldMapping.biospecimenClinical,
      };

      const status = biospecimenStatus(collection, fieldMapping.biospecimenUrineCollection, fieldMapping.biospecimenBaselineCollection);

      expect(status).to.equal('Clinical');
    });

    it('returns Home when collection type is home', () => {
      const collection = {
        [fieldMapping.biospecimenMouthwashCollection]: fieldMapping.biospecimenHome,
      };

      const status = biospecimenStatus(collection, fieldMapping.biospecimenMouthwashCollection, fieldMapping.biospecimenBaselineCollection);

      expect(status).to.equal('Home');
    });

    it('returns N/A when collection is null', () => {
      const status = biospecimenStatus(null, fieldMapping.biospecimenBloodCollection, fieldMapping.biospecimenBaselineCollection);

      expect(status).to.equal('N/A');
    });

    it('returns N/A when collection type is unrecognized', () => {
      const collection = {
        [fieldMapping.biospecimenBloodCollection]: 999999,
      };

      const status = biospecimenStatus(collection, fieldMapping.biospecimenBloodCollection, fieldMapping.biospecimenBaselineCollection);

      expect(status).to.equal('N/A');
    });
  });

  describe('additional verification statuses', () => {
    const createParticipant = (flag) => buildParticipant({
      [fieldMapping.verifiedFlag]: flag,
      [fieldMapping.verficationDate]: '2024-05-10T00:00:00Z',
    });

    it('handles cannotBeVerified status', () => {
      const row = verificationStatus(createParticipant(fieldMapping.cannotBeVerified));
      expect(row).to.include('fa fa-times');
      expect(row).to.include('icon--error');
      expect(row).to.include('Cannot Be Verified');
    });

    it('handles noLongerEnrolling status', () => {
      const row = verificationStatus(createParticipant(fieldMapping.noLongerEnrolling));
      expect(row).to.include('fa fa-times');
      expect(row).to.include('icon--error');
      expect(row).to.include('No Longer Enrolling');
    });

    it('handles duplicate status', () => {
      const row = verificationStatus(createParticipant(fieldMapping.duplicate));
      expect(row).to.include('fa fa-times');
      expect(row).to.include('icon--error');
      expect(row).to.include('Duplicate');
    });
  });

  describe('dhqSurvey', () => {
    it('renders DHQ survey with username and study ID in setting column', () => {
      const participant = buildParticipant({
        [fieldMapping.dhqSurveyStatus]: fieldMapping.submitted,
        [fieldMapping.dhqSurveyCompletedDate]: '2024-08-15T00:00:00Z',
        [fieldMapping.dhqUsername]: 'participant123',
        [fieldMapping.dhqStudyID]: 'study_456',
      });

      const row = dhqSurvey(participant);
      expect(row).to.include('DHQ III');
      expect(row).to.include('Follow-Up 6-mo');
      expect(row).to.include('Submitted');
      expect(row).to.include('Username: participant123');
      expect(row).to.include('Study ID:  456');
    });

    it('renders N/A setting when username or study ID is missing', () => {
      const participant = buildParticipant({
        [fieldMapping.dhqSurveyStatus]: fieldMapping.started,
        [fieldMapping.dhqSurveyStartDate]: '2024-08-10T00:00:00Z',
      });

      const row = dhqSurvey(participant);
      expect(row).to.include('Started');
      const settingMatch = row.match(/<td>N\/A<\/td>/g);
      expect(settingMatch).to.not.be.null;
    });

    it('includes refusal when all future activities are refused', () => {
      const participant = buildParticipant({
        [fieldMapping.refusedAllFutureActivities]: fieldMapping.yes,
        [fieldMapping.dhqSurveyStatus]: fieldMapping.notStarted,
      });

      const row = dhqSurvey(participant);
      expect(row).to.include('Not Started');
      expect(row).to.include('>Y<');
    });

    it('includes refusal when all future surveys are refused', () => {
      const participant = buildParticipant({
        [fieldMapping.refusalOptions]: {
          [fieldMapping.refusedFutureSurveys]: fieldMapping.yes,
        },
        [fieldMapping.dhqSurveyStatus]: fieldMapping.notStarted,
      });

      const row = dhqSurvey(participant);
      expect(row).to.include('>Y<');
    });
  });

  describe('baselinePromisSurvey', () => {
    it('renders PROMIS survey with correct timeline', () => {
      const participant = buildParticipant({
        [fieldMapping.promisSurveyFlag]: fieldMapping.submitted,
        [fieldMapping.promisSurveyCompletedDate]: '2024-09-01T00:00:00Z',
      });

      const row = baselinePromisSurvey(participant);
      expect(row).to.include('Follow-Up 3-mo');
      expect(row).to.include('Quality of Life');
      expect(row).to.include('Submitted');
    });

    it('marks refusal when quality of life survey is refused', () => {
      const participant = buildParticipant({
        [fieldMapping.refusalOptions]: {
          [fieldMapping.refusedQualityOfLifeSurvey]: fieldMapping.yes,
        },
        [fieldMapping.promisSurveyFlag]: fieldMapping.notStarted,
      });

      const row = baselinePromisSurvey(participant);
      expect(row).to.include('>Y<');
    });

    it('marks refusal when all future surveys are refused', () => {
      const participant = buildParticipant({
        [fieldMapping.refusalOptions]: {
          [fieldMapping.refusedFutureSurveys]: fieldMapping.yes,
        },
        [fieldMapping.promisSurveyFlag]: fieldMapping.notStarted,
      });

      const row = baselinePromisSurvey(participant);
      expect(row).to.include('>Y<');
    });

    it('marks refusal when all future activities are refused', () => {
      const participant = buildParticipant({
        [fieldMapping.refusedAllFutureActivities]: fieldMapping.yes,
        [fieldMapping.promisSurveyFlag]: fieldMapping.notStarted,
      });

      const row = baselinePromisSurvey(participant);
      expect(row).to.include('>Y<');
    });

    it('shows no refusal when none of the refusal flags are set', () => {
      const participant = buildParticipant({
        [fieldMapping.promisSurveyFlag]: fieldMapping.notStarted,
      });

      const row = baselinePromisSurvey(participant);
      expect(row).to.include('>N<');
    });
  });

  describe('baselineMouthwashR2Sample', () => {
    it('renders R2 replacement kit as collected when received', () => {
      const participant = buildParticipant({
        [fieldMapping.collectionDetails]: {
          [fieldMapping.baseline]: {
            [fieldMapping.bioKitMouthwashBL2]: {
              [fieldMapping.kitType]: fieldMapping.kitTypeValues.homeMouthwash,
              [fieldMapping.kitStatus]: fieldMapping.kitStatusValues.received,
              [fieldMapping.kitReceivedTime]: '2024-10-10T00:00:00Z',
            },
          },
        },
      });

      const row = baselineMouthwashR2Sample(participant);
      expect(row).to.include('Home Mouthwash R2');
      expect(row).to.include('Collected');
      expect(row).to.include('Kit Received');
      expect(row).to.include('10/10/2024');
      expect(row).to.include('Home');
    });

    it('renders R2 kit as not collected when shipped but not received', () => {
      const participant = buildParticipant({
        [fieldMapping.collectionDetails]: {
          [fieldMapping.baseline]: {
            [fieldMapping.bioKitMouthwashBL2]: {
              [fieldMapping.kitType]: fieldMapping.kitTypeValues.homeMouthwash,
              [fieldMapping.kitStatus]: fieldMapping.kitStatusValues.shipped,
            },
          },
        },
      });

      const row = baselineMouthwashR2Sample(participant);
      expect(row).to.include('Home Mouthwash R2');
      expect(row).to.include('Not Collected');
      expect(row).to.include('Kit Shipped');
    });

    it('always shows N/A for refusal on R2 replacement kits', () => {
      const participant = buildParticipant({
        [fieldMapping.refusalOptions]: {
          [fieldMapping.refusedMouthwash]: fieldMapping.yes,
        },
        [fieldMapping.collectionDetails]: {
          [fieldMapping.baseline]: {
            [fieldMapping.bioKitMouthwashBL2]: {
              [fieldMapping.kitType]: fieldMapping.kitTypeValues.homeMouthwash,
              [fieldMapping.kitStatus]: fieldMapping.kitStatusValues.received,
              [fieldMapping.kitReceivedTime]: '2024-10-10T00:00:00Z',
            },
          },
        },
      });

      const row = baselineMouthwashR2Sample(participant);
      const refusalMatch = row.match(/>N\/A</g);
      expect(refusalMatch).to.not.be.null;
      expect(refusalMatch.length).to.be.greaterThan(0);
    });
  });

  describe('edge cases and null/undefined handling', () => {
    it('handles null participant in verificationStatus', () => {
      const row = verificationStatus(null);
      expect(row).to.include('N/A');
      expect(row).to.include('fa fa-times');
    });

    it('handles undefined participant in verificationStatus', () => {
      const row = verificationStatus(undefined);
      expect(row).to.include('N/A');
      expect(row).to.include('fa fa-times');
    });

    it('handles missing refusalOptions gracefully in baselineBOHSurvey', () => {
      const participant = {
        [fieldMapping.bohStatusFlag]: fieldMapping.submitted,
        [fieldMapping.bohCompletedDate1]: '2024-03-03T00:00:00Z',
      };

      const row = baselineBOHSurvey(participant);
      expect(row).to.include('N</td>');
      expect(row).to.include('Submitted');
    });

    it('handles empty refusalOptions object in baselinePromisSurvey', () => {
      const participant = buildParticipant({
        [fieldMapping.refusalOptions]: {},
        [fieldMapping.promisSurveyFlag]: fieldMapping.notStarted,
      });

      const row = baselinePromisSurvey(participant);
      expect(row).to.include('>N<');
    });

    it('handles missing biospecimenCollectionDetail in baselineBloodSample', () => {
      const participant = buildParticipant({
        [fieldMapping.baselineBloodCollectedFlag]: fieldMapping.no,
      });

      const row = baselineBloodSample(participant);
      expect(row).to.include('Not Collected');
      expect(row).to.include('N/A');
    });

    it('handles missing collectionDetails in baselineHomeMouthwashSample', () => {
      const participant = buildParticipant();

      const row = baselineHomeMouthwashSample(participant);
      expect(row).to.include('Not Collected');
      expect(row).to.include('N/A');
    });

    it('handles missing paymentRound in baselinePayment', () => {
      const participant = {};

      const row = baselinePayment(participant);
      expect(row).to.include('N/A');
    });

    it('handles null participant in baselinePayment', () => {
      const row = baselinePayment(null);
      expect(row).to.include('N/A');
    });

    it('handles missing reports object in baselinePhysActReport', () => {
      const participant = buildParticipant();

      const row = baselinePhysActReport(participant, null);
      expect(row).to.include('Unavailable');
      expect(row).to.include('link--disabled');
    });

    it('handles empty reports object in baselinePhysActReport', () => {
      const participant = buildParticipant();

      const row = baselinePhysActReport(participant, {});
      expect(row).to.include('Unavailable');
    });

    it('handles missing physActReport in reports', () => {
      const participant = buildParticipant();
      const reports = { otherReport: {} };

      const row = baselinePhysActReport(participant, reports);
      expect(row).to.include('Unavailable');
    });

    it('handles missing report status in baselinePhysActReport', () => {
      const timestampKey = `d_${fieldMapping.reports.physicalActivity.reportTS}`;
      const participant = buildParticipant();
      const reports = {
        physActReport: {
          [timestampKey]: '2024-06-06T00:00:00Z',
        },
      };

      const row = baselinePhysActReport(participant, reports);
      expect(row).to.include('Available');
      expect(row).to.include('N/A');
    });

    it('handles missing dhqSurveyCompletedDate in dhq3Report', () => {
      const participant = buildParticipant({
        [fieldMapping.dhqSurveyStatus]: fieldMapping.submitted,
      });

      const row = dhq3Report(participant, {});
      expect(row).to.include('Available');
      expect(row).to.include('N/A');
    });

    it('handles missing internal/external report statuses in dhq3Report', () => {
      const participant = buildParticipant({
        [fieldMapping.dhqSurveyStatus]: fieldMapping.submitted,
        [fieldMapping.dhqSurveyCompletedDate]: '2024-07-07T00:00:00Z',
      });

      const row = dhq3Report(participant, {});
      expect(row).to.include('Int: Unread');
      expect(row).to.include('Ext: Unread');
    });

    it('handles consent with missing date', () => {
      const participant = {
        [fieldMapping.consentFlag]: fieldMapping.yes,
        [fieldMapping.consentVersion]: 'v2',
      };

      const row = consentHandler(participant);
      expect(row).to.include('Signed');
      expect(row).to.include('undefined');
    });

    it('handles HIPAA with missing date', () => {
      const participant = buildParticipant({
        [fieldMapping.hipaaFlag]: fieldMapping.yes,
        [fieldMapping.hipaaVersion]: 'HP_HIPAA_V1.0',
      });

      const row = hipaaHandler(participant);
      expect(row).to.include('Signed');
    });
  });
});
