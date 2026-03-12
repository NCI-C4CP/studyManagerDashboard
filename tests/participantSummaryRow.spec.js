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

      expect(status).toEqual({
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

      expect(status).toEqual({
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

      expect(status.date).toBe('N/A');
      expect(status.itemStatus).toBe('Submitted');
    });

    it('returns N/A metadata when survey flag is unmapped', () => {
      const status = getSurveyStatus({}, 999999);
      expect(status).toEqual({
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

      expect(status).toEqual({
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

      expect(status).toEqual({
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
        expect(status).toEqual({
          icon: 'fa fa-times fa-2x',
          color: 'icon--error',
          itemStatus: 'Not Eligible',
          date: 'N/A',
        });
      });
    });

    it('falls back to Not Yet Eligible for DHQ', () => {
      const status = getSurveyStatus({}, fieldMapping.dhqSurveyStatus);
      expect(status).toEqual({
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
      expect(status).toEqual({
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

      expect(row).toContain('fa fa-check fa-2x icon--success');
      expect(row).toContain('Signed');
      expect(row).toContain(formatDate('2024-03-20T00:00:00Z'));
      expect(row).toContain('v2');
      expect(row).toContain('id="downloadCopy"');
      expect(row).not.toContain('link--disabled');
    });

    it('renders not signed consent row with disabled link', () => {
      const participant = {
        [fieldMapping.consentFlag]: fieldMapping.no,
      };

      const row = consentHandler(participant);

      expect(row).toContain('fa fa-times fa-2x icon--error');
      expect(row).toContain('Not Signed');
      expect(row).toContain('N/A');
      expect(row).toContain('link--disabled');
      expect(row).not.toContain('id="downloadCopy"');
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
      expect(row).toContain('HIPAA');
      expect(row).toContain('fa fa-check');
      expect(row).toContain('icon--success');
      expect(row).toContain(formatDate('2024-04-02T00:00:00Z'));
      expect(row).toContain('downloadCopyHIPAA');
    });

    it('renders disabled HIPAA row when not signed', () => {
      const row = hipaaHandler(buildParticipant());
      expect(row).toContain('Not Signed');
      expect(row).toContain('link--disabled');
    });

    it('renders user profile submission state', () => {
      const submittedRow = userProfile(buildParticipant({
        [fieldMapping.userProfileFlag]: fieldMapping.yes,
        [fieldMapping.userProfileDateTime]: '2024-05-01T00:00:00Z',
      }));
      expect(submittedRow).toContain('Submitted');
      expect(submittedRow).toContain(formatDate('2024-05-01T00:00:00Z'));
      expect(submittedRow).toContain('N</td>');

      const pendingRow = userProfile(buildParticipant());
      expect(pendingRow).toContain('Not Submitted');
      expect(pendingRow).toContain('N/A');
    });
  });

  describe('verificationStatus', () => {
    const createParticipant = (flag) => buildParticipant({
      [fieldMapping.verifiedFlag]: flag,
      [fieldMapping.verficationDate]: '2024-05-10T00:00:00Z',
    });

    it('marks verified participants with checkmark and date', () => {
      const row = verificationStatus(createParticipant(fieldMapping.verified));
      expect(row).toContain('fa fa-check');
      expect(row).toContain('icon--success');
      expect(row).toContain('Verified');
      expect(row).toContain(formatDate('2024-05-10T00:00:00Z'));
    });

    it('shows pending icons for not yet verified participants', () => {
      const row = verificationStatus(createParticipant(fieldMapping.notYetVerified));
      expect(row).toContain('fa fa-hashtag');
      expect(row).toContain('Not yet Verified');
      expect(row).toContain('N/A');
    });

    it('handles outreach timed out with warning styling', () => {
      const row = verificationStatus(createParticipant(fieldMapping.outreachTimedout));
      expect(row).toContain('fa fa-hashtag');
      expect(row).toContain('Outreach Timed Out');
    });

    it('flags unknown statuses as errors', () => {
      const row = verificationStatus(createParticipant(999999));
      expect(row).toContain('Error: unhandled status in verificationStatus');
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
      expect(row).toContain('Y');
      expect(row).toContain('Submitted');
      expect(row).toContain(formatDate('2024-03-03T00:00:00Z'));
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
      expect(row).toContain('Collected');
      expect(row).toContain('Research');
      expect(row).toContain('01/10/2024');
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
      expect(row).toContain('Collected');
      expect(row).toContain('Clinical');
      expect(row).toContain('Y');
      expect(row).toContain('02/02/2024');
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
      expect(row).toContain('Invalid timestamp format: not-a-date');
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
      expect(row).toContain('Home Mouthwash Initial');
      expect(row).toContain('Collected');
      expect(row).toContain('Kit Received');
      expect(row).toContain('Y');
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
      expect(row).toContain('Home Mouthwash R1');
      expect(row).toContain('Not Collected');
      expect(row).toContain('Kit Pending');
      expect(row).toContain('N/A');
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
      expect(row).toContain('Eligible');
      expect(row).toContain('Gift Card');
      expect(row).toContain('05/01/2024');
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
      expect(row).toContain('Issued on 05/02/2024');
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
      expect(row).toContain('Not Eligible');
      expect(row).toContain('Declined on 05/03/2024');
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
      expect(row).toContain('Available');
      expect(row).toContain('Viewed');
      expect(row).toContain('downloadPhysActReport');
    });

    it('renders DHQ3 HEI report rows with combined internal/external statuses', () => {
      const participant = buildParticipant({
        [fieldMapping.dhqSurveyStatus]: fieldMapping.submitted,
        [fieldMapping.dhqSurveyCompletedDate]: '2024-07-07T00:00:00Z',
        [fieldMapping.reports.dhq3.reportStatusInternal]: fieldMapping.reports.viewed,
        [fieldMapping.reports.dhq3.reportStatusExternal]: fieldMapping.reports.declined,
      });

      const row = dhq3Report(participant, {});
      expect(row).toContain('Available');
      expect(row).toContain('Int: Viewed, Ext: Declined');
      expect(row).toContain('downloadDHQHEIReport');
    });

    it('disables DHQ3 HEI report when survey not submitted', () => {
      const row = dhq3Report(buildParticipant(), {});
      expect(row).toContain('Unavailable');
      expect(row).toContain('link--disabled');
    });
  });

  describe('biospecimenStatus', () => {
    it('returns Research when collection type is research', () => {
      const collection = {
        [fieldMapping.biospecimenBloodCollection]: fieldMapping.biospecimenResearch,
      };

      const status = biospecimenStatus(collection, fieldMapping.biospecimenBloodCollection, fieldMapping.biospecimenBaselineCollection);

      expect(status).toBe('Research');
    });

    it('returns Clinical when collection type is clinical', () => {
      const collection = {
        [fieldMapping.biospecimenUrineCollection]: fieldMapping.biospecimenClinical,
      };

      const status = biospecimenStatus(collection, fieldMapping.biospecimenUrineCollection, fieldMapping.biospecimenBaselineCollection);

      expect(status).toBe('Clinical');
    });

    it('returns Home when collection type is home', () => {
      const collection = {
        [fieldMapping.biospecimenMouthwashCollection]: fieldMapping.biospecimenHome,
      };

      const status = biospecimenStatus(collection, fieldMapping.biospecimenMouthwashCollection, fieldMapping.biospecimenBaselineCollection);

      expect(status).toBe('Home');
    });

    it('returns N/A when collection is null', () => {
      const status = biospecimenStatus(null, fieldMapping.biospecimenBloodCollection, fieldMapping.biospecimenBaselineCollection);

      expect(status).toBe('N/A');
    });

    it('returns N/A when collection type is unrecognized', () => {
      const collection = {
        [fieldMapping.biospecimenBloodCollection]: 999999,
      };

      const status = biospecimenStatus(collection, fieldMapping.biospecimenBloodCollection, fieldMapping.biospecimenBaselineCollection);

      expect(status).toBe('N/A');
    });
  });

  describe('additional verification statuses', () => {
    const createParticipant = (flag) => buildParticipant({
      [fieldMapping.verifiedFlag]: flag,
      [fieldMapping.verficationDate]: '2024-05-10T00:00:00Z',
    });

    it('handles cannotBeVerified status', () => {
      const row = verificationStatus(createParticipant(fieldMapping.cannotBeVerified));
      expect(row).toContain('fa fa-times');
      expect(row).toContain('icon--error');
      expect(row).toContain('Cannot Be Verified');
    });

    it('handles noLongerEnrolling status', () => {
      const row = verificationStatus(createParticipant(fieldMapping.noLongerEnrolling));
      expect(row).toContain('fa fa-times');
      expect(row).toContain('icon--error');
      expect(row).toContain('No Longer Enrolling');
    });

    it('handles duplicate status', () => {
      const row = verificationStatus(createParticipant(fieldMapping.duplicate));
      expect(row).toContain('fa fa-times');
      expect(row).toContain('icon--error');
      expect(row).toContain('Duplicate');
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
      expect(row).toContain('DHQ III');
      expect(row).toContain('Follow-Up 6-mo');
      expect(row).toContain('Submitted');
      expect(row).toContain('Username: participant123');
      expect(row).toContain('Study ID:  456');
    });

    it('renders N/A setting when username or study ID is missing', () => {
      const participant = buildParticipant({
        [fieldMapping.dhqSurveyStatus]: fieldMapping.started,
        [fieldMapping.dhqSurveyStartDate]: '2024-08-10T00:00:00Z',
      });

      const row = dhqSurvey(participant);
      expect(row).toContain('Started');
      const settingMatch = row.match(/<td>N\/A<\/td>/g);
      expect(settingMatch).not.toBeNull();
    });

    it('includes refusal when all future activities are refused', () => {
      const participant = buildParticipant({
        [fieldMapping.refusedAllFutureActivities]: fieldMapping.yes,
        [fieldMapping.dhqSurveyStatus]: fieldMapping.notStarted,
      });

      const row = dhqSurvey(participant);
      expect(row).toContain('Not Started');
      expect(row).toContain('>Y<');
    });

    it('includes refusal when all future surveys are refused', () => {
      const participant = buildParticipant({
        [fieldMapping.refusalOptions]: {
          [fieldMapping.refusedFutureSurveys]: fieldMapping.yes,
        },
        [fieldMapping.dhqSurveyStatus]: fieldMapping.notStarted,
      });

      const row = dhqSurvey(participant);
      expect(row).toContain('>Y<');
    });
  });

  describe('baselinePromisSurvey', () => {
    it('renders PROMIS survey with correct timeline', () => {
      const participant = buildParticipant({
        [fieldMapping.promisSurveyFlag]: fieldMapping.submitted,
        [fieldMapping.promisSurveyCompletedDate]: '2024-09-01T00:00:00Z',
      });

      const row = baselinePromisSurvey(participant);
      expect(row).toContain('Follow-Up 3-mo');
      expect(row).toContain('Quality of Life');
      expect(row).toContain('Submitted');
    });

    it('marks refusal when quality of life survey is refused', () => {
      const participant = buildParticipant({
        [fieldMapping.refusalOptions]: {
          [fieldMapping.refusedQualityOfLifeSurvey]: fieldMapping.yes,
        },
        [fieldMapping.promisSurveyFlag]: fieldMapping.notStarted,
      });

      const row = baselinePromisSurvey(participant);
      expect(row).toContain('>Y<');
    });

    it('marks refusal when all future surveys are refused', () => {
      const participant = buildParticipant({
        [fieldMapping.refusalOptions]: {
          [fieldMapping.refusedFutureSurveys]: fieldMapping.yes,
        },
        [fieldMapping.promisSurveyFlag]: fieldMapping.notStarted,
      });

      const row = baselinePromisSurvey(participant);
      expect(row).toContain('>Y<');
    });

    it('marks refusal when all future activities are refused', () => {
      const participant = buildParticipant({
        [fieldMapping.refusedAllFutureActivities]: fieldMapping.yes,
        [fieldMapping.promisSurveyFlag]: fieldMapping.notStarted,
      });

      const row = baselinePromisSurvey(participant);
      expect(row).toContain('>Y<');
    });

    it('shows no refusal when none of the refusal flags are set', () => {
      const participant = buildParticipant({
        [fieldMapping.promisSurveyFlag]: fieldMapping.notStarted,
      });

      const row = baselinePromisSurvey(participant);
      expect(row).toContain('>N<');
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
      expect(row).toContain('Home Mouthwash R2');
      expect(row).toContain('Collected');
      expect(row).toContain('Kit Received');
      expect(row).toContain('10/10/2024');
      expect(row).toContain('Home');
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
      expect(row).toContain('Home Mouthwash R2');
      expect(row).toContain('Not Collected');
      expect(row).toContain('Kit Shipped');
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
      expect(refusalMatch).not.toBeNull();
      expect(refusalMatch.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases and null/undefined handling', () => {
    it('handles null participant in verificationStatus', () => {
      const row = verificationStatus(null);
      expect(row).toContain('N/A');
      expect(row).toContain('fa fa-times');
    });

    it('handles undefined participant in verificationStatus', () => {
      const row = verificationStatus(undefined);
      expect(row).toContain('N/A');
      expect(row).toContain('fa fa-times');
    });

    it('handles missing refusalOptions gracefully in baselineBOHSurvey', () => {
      const participant = {
        [fieldMapping.bohStatusFlag]: fieldMapping.submitted,
        [fieldMapping.bohCompletedDate1]: '2024-03-03T00:00:00Z',
      };

      const row = baselineBOHSurvey(participant);
      expect(row).toContain('N</td>');
      expect(row).toContain('Submitted');
    });

    it('handles empty refusalOptions object in baselinePromisSurvey', () => {
      const participant = buildParticipant({
        [fieldMapping.refusalOptions]: {},
        [fieldMapping.promisSurveyFlag]: fieldMapping.notStarted,
      });

      const row = baselinePromisSurvey(participant);
      expect(row).toContain('>N<');
    });

    it('handles missing biospecimenCollectionDetail in baselineBloodSample', () => {
      const participant = buildParticipant({
        [fieldMapping.baselineBloodCollectedFlag]: fieldMapping.no,
      });

      const row = baselineBloodSample(participant);
      expect(row).toContain('Not Collected');
      expect(row).toContain('N/A');
    });

    it('handles missing collectionDetails in baselineHomeMouthwashSample', () => {
      const participant = buildParticipant();

      const row = baselineHomeMouthwashSample(participant);
      expect(row).toContain('Not Collected');
      expect(row).toContain('N/A');
    });

    it('handles missing paymentRound in baselinePayment', () => {
      const participant = {};

      const row = baselinePayment(participant);
      expect(row).toContain('N/A');
    });

    it('handles null participant in baselinePayment', () => {
      const row = baselinePayment(null);
      expect(row).toContain('N/A');
    });

    it('handles missing reports object in baselinePhysActReport', () => {
      const participant = buildParticipant();

      const row = baselinePhysActReport(participant, null);
      expect(row).toContain('Unavailable');
      expect(row).toContain('link--disabled');
    });

    it('handles empty reports object in baselinePhysActReport', () => {
      const participant = buildParticipant();

      const row = baselinePhysActReport(participant, {});
      expect(row).toContain('Unavailable');
    });

    it('handles missing physActReport in reports', () => {
      const participant = buildParticipant();
      const reports = { otherReport: {} };

      const row = baselinePhysActReport(participant, reports);
      expect(row).toContain('Unavailable');
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
      expect(row).toContain('Available');
      expect(row).toContain('N/A');
    });

    it('handles missing dhqSurveyCompletedDate in dhq3Report', () => {
      const participant = buildParticipant({
        [fieldMapping.dhqSurveyStatus]: fieldMapping.submitted,
      });

      const row = dhq3Report(participant, {});
      expect(row).toContain('Available');
      expect(row).toContain('N/A');
    });

    it('handles missing internal/external report statuses in dhq3Report', () => {
      const participant = buildParticipant({
        [fieldMapping.dhqSurveyStatus]: fieldMapping.submitted,
        [fieldMapping.dhqSurveyCompletedDate]: '2024-07-07T00:00:00Z',
      });

      const row = dhq3Report(participant, {});
      expect(row).toContain('Int: Unread');
      expect(row).toContain('Ext: Unread');
    });

    it('handles consent with missing date', () => {
      const participant = {
        [fieldMapping.consentFlag]: fieldMapping.yes,
        [fieldMapping.consentVersion]: 'v2',
      };

      const row = consentHandler(participant);
      expect(row).toContain('Signed');
      expect(row).toContain('undefined');
    });

    it('handles HIPAA with missing date', () => {
      const participant = buildParticipant({
        [fieldMapping.hipaaFlag]: fieldMapping.yes,
        [fieldMapping.hipaaVersion]: 'HP_HIPAA_V1.0',
      });

      const row = hipaaHandler(participant);
      expect(row).toContain('Signed');
    });
  });
});
