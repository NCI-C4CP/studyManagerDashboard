import { expect } from 'chai';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { surveyFlagToDateMapping, participantConceptIDToTextMapping } from '../src/idsToName.js';

describe('idsToName', () => {
  describe('surveyFlagToDateMapping', () => {
    it('maps baseline surveys to their start and completion concept IDs', () => {
      expect(surveyFlagToDateMapping[fieldMapping.bohStatusFlag]).to.deep.equal({
        startDate: fieldMapping.bohStartDate1,
        completeDate: fieldMapping.bohCompletedDate1,
      });

      expect(surveyFlagToDateMapping[fieldMapping.bloodUrineSurveyFlag]).to.deep.equal({
        startDate: fieldMapping.bloodUrineSurveyStartedDate,
        completeDate: fieldMapping.bloodUrineSurveyCompletedDate,
      });
    });

    it('includes cross-sectional surveys used in summary rows', () => {
      expect(surveyFlagToDateMapping[fieldMapping.experienceSurvey]).to.deep.equal({
        startDate: fieldMapping.experienceSurveyStartDate,
        completeDate: fieldMapping.experienceCompleteDate,
      });

      expect(surveyFlagToDateMapping[fieldMapping.preferenceSurveyStatus]).to.deep.equal({
        startDate: fieldMapping.preferenceSurveyStartDate,
        completeDate: fieldMapping.preferenceSurveyCompletedDate,
      });
    });
  });

  describe('participantConceptIDToTextMapping', () => {
    it('returns survey statuses via getSurveyStatus integration', () => {
      const participant = {
        [fieldMapping.bohStatusFlag]: fieldMapping.started,
        [fieldMapping.bohStartDate1]: '2024-02-10T00:00:00Z',
      };

      const label = participantConceptIDToTextMapping(
        fieldMapping.started,
        fieldMapping.bohStatusFlag,
        participant,
      );

      expect(label).to.equal('Started');
    });

    it('returns Not Eligible fallback for experience survey with no response', () => {
      const label = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.experienceSurvey,
        {},
      );
      expect(label).to.equal('Not Eligible');
    });

    it('returns Not Yet Eligible fallback for DHQ without state', () => {
      const label = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.dhqSurveyStatus,
        {},
      );
      expect(label).to.equal('Not Yet Eligible');
    });

    it('maps nested baseline payment flags from payment round data', () => {
      const participant = {
        [fieldMapping.paymentRound]: {
          [fieldMapping.baselinePayment]: {
            [fieldMapping.paymentIssued]: fieldMapping.yes,
            [fieldMapping.refusedBaselinePayment]: fieldMapping.no,
          },
        },
      };

      const issuedLabel = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.paymentIssued,
        participant,
      );
      expect(issuedLabel).to.equal('Yes');

      const refusedLabel = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.refusedBaselinePayment,
        participant,
      );
      expect(refusedLabel).to.equal('No');
    });

    it('maps participation status codes to human-readable strings', () => {
      const noRefusal = participantConceptIDToTextMapping(
        '',
        fieldMapping.participationStatus,
        {},
      );
      expect(noRefusal).to.equal('No Refusal');

      const refusedAll = participantConceptIDToTextMapping(
        fieldMapping.refusedAll,
        fieldMapping.participationStatus,
        {},
      );
      expect(refusedAll).to.equal('Refused All');
    });

    it('returns ERROR for unknown participation codes', () => {
      const label = participantConceptIDToTextMapping(
        999999,
        fieldMapping.participationStatus,
        {},
      );
      expect(label).to.equal(`ERROR: Unknown Participation Status (${fieldMapping.participationStatus}: 999999)`);
    });

    it('returns Unknown Status for unrecognized verification values', () => {
      const label = participantConceptIDToTextMapping(
        123456,
        fieldMapping.verifiedFlag,
        {},
      );
      expect(label).to.equal(`ERROR: Unknown Verification Status (${fieldMapping.verifiedFlag}: 123456)`);
    });

    it('maps country concept IDs to country names', () => {
      // Test mailing address country
      const mailingCountry = participantConceptIDToTextMapping(
        333208328,
        fieldMapping.country,
        {},
      );
      expect(mailingCountry).to.equal('United States of America');

      // Test physical address country
      const physicalCountry = participantConceptIDToTextMapping(
        794205182,
        fieldMapping.physicalCountry,
        {},
      );
      expect(physicalCountry).to.equal('Canada');

      // Test alternate address country
      const altCountry = participantConceptIDToTextMapping(
        780612099,
        fieldMapping.altCountry,
        {},
      );
      expect(altCountry).to.equal('Germany');
    });

    it('maps country 3-character codes to country names', () => {
      // Test mailing address with code3
      const mailingCountry = participantConceptIDToTextMapping(
        'usa',
        fieldMapping.country,
        {},
      );
      expect(mailingCountry).to.equal('United States of America');

      // Test physical address with code3
      const physicalCountry = participantConceptIDToTextMapping(
        'can',
        fieldMapping.physicalCountry,
        {},
      );
      expect(physicalCountry).to.equal('Canada');

      // Test alternate address with code3
      const altCountry = participantConceptIDToTextMapping(
        'deu',
        fieldMapping.altCountry,
        {},
      );
      expect(altCountry).to.equal('Germany');
    });

    it('handles uppercase country codes', () => {
      const country = participantConceptIDToTextMapping(
        'USA',
        fieldMapping.country,
        {},
      );
      expect(country).to.equal('United States of America');
    });

    it('returns empty string for missing country values', () => {
      const label = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.country,
        {},
      );
      expect(label).to.equal('');

      const nullLabel = participantConceptIDToTextMapping(
        null,
        fieldMapping.physicalCountry,
        {},
      );
      expect(nullLabel).to.equal('');
    });

    it('returns error for unknown country concept IDs', () => {
      const label = participantConceptIDToTextMapping(
        999999999,
        fieldMapping.altCountry,
        {},
      );
      expect(label).to.equal(`ERROR: Unknown Country (${fieldMapping.altCountry}: 999999999)`);
    });

    it('returns error for unknown country codes', () => {
      const label = participantConceptIDToTextMapping(
        'xyz',
        fieldMapping.country,
        {},
      );
      expect(label).to.equal(`ERROR: Unknown Country (${fieldMapping.country}: xyz)`);
    });

    it('maps match status flags to Matched/Not Matched', () => {
      // Test Matched - value comes from participant.state[key]
      const participantMatched = {
        state: { [fieldMapping.firstNameMatch]: fieldMapping.matched },
      };
      const matched = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.firstNameMatch,
        participantMatched,
      );
      expect(matched).to.equal('Matched');

      // Test Not Matched
      const participantNotMatched = {
        state: { [fieldMapping.lastNameMatch]: fieldMapping.notMatched },
      };
      const notMatched = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.lastNameMatch,
        participantNotMatched,
      );
      expect(notMatched).to.equal('Not Matched');

      // Test other match fields
      const participantDob = {
        state: { [fieldMapping.dobMatch]: fieldMapping.matched },
      };
      const dobMatched = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.dobMatch,
        participantDob,
      );
      expect(dobMatched).to.equal('Matched');

      const participantPin = {
        state: { [fieldMapping.pinMatch]: fieldMapping.notMatched },
      };
      const pinNotMatched = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.pinMatch,
        participantPin,
      );
      expect(pinNotMatched).to.equal('Not Matched');
    });

    it('returns empty string for missing match status values', () => {
      const label = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.tokenMatch,
        {},
      );
      expect(label).to.equal('');

      const nullLabel = participantConceptIDToTextMapping(
        null,
        fieldMapping.zipCodeMatch,
        {},
      );
      expect(nullLabel).to.equal('');
    });

    it('returns error for unknown match status values', () => {
      const participant = {
        state: { [fieldMapping.firstNameMatch]: 999999 },
      };
      const label = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.firstNameMatch,
        participant,
      );
      expect(label).to.equal(`ERROR: Unknown Match Status (${fieldMapping.firstNameMatch}: 999999)`);
    });

    it('maps criterium match flags to Criterium Met/Not Met', () => {
      // Test Criterium Met - value comes from participant.state[key]
      const participantMet = {
        state: { [fieldMapping.siteMatch]: fieldMapping.criteriumMet },
      };
      const criteriumMet = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.siteMatch,
        participantMet,
      );
      expect(criteriumMet).to.equal('Criterium Met');

      // Test Criterium Not Met
      const participantNotMet = {
        state: { [fieldMapping.ageMatch]: fieldMapping.criteriumNotMet },
      };
      const criteriumNotMet = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.ageMatch,
        participantNotMet,
      );
      expect(criteriumNotMet).to.equal('Criterium Not Met');

      // Test another criterium field
      const participantCancer = {
        state: { [fieldMapping.cancerStatusMatch]: fieldMapping.criteriumMet },
      };
      const cancerStatus = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.cancerStatusMatch,
        participantCancer,
      );
      expect(cancerStatus).to.equal('Criterium Met');
    });

    it('returns empty string for missing criterium match values', () => {
      const label = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.siteMatch,
        {},
      );
      expect(label).to.equal('');
    });

    it('returns error for unknown criterium match values', () => {
      const participant = {
        state: { [fieldMapping.ageMatch]: 888888 },
      };
      const label = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.ageMatch,
        participant,
      );
      expect(label).to.equal(`ERROR: Unknown Criterium Status (${fieldMapping.ageMatch}: 888888)`);
    });

    it('maps refusal flags using participant.refusalOptions data', () => {
      const participant = {
        [fieldMapping.refusalOptions]: {
          [fieldMapping.refusedSurvey]: fieldMapping.yes,
          [fieldMapping.refusedFutureSurveys]: fieldMapping.no,
        },
      };

      const surveyRefusal = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.refusedSurvey,
        participant,
      );
      const futureRefusal = participantConceptIDToTextMapping(
        undefined,
        fieldMapping.refusedFutureSurveys,
        participant,
      );

      expect(surveyRefusal).to.equal('Yes');
      expect(futureRefusal).to.equal('No');
    });
  });
});
