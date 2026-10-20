import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { 
    renderWithdrawalForm, 
    autoSelectOptions, 
    processRefusalWithdrawalResponses,
    validateDate
} from '../src/participantWithdrawalForm.js';
import { participantState, uiState } from '../src/stateManager.js';
import { renderRefusalOptions } from '../src/participantWithdrawalRender.js';

describe('participantWithdrawalForm Logic', () => {
    let firebaseStub;
    let cleanup;
    let domFixtures;

    beforeEach(async () => {
        const suite = await setupTestSuite();
        firebaseStub = suite.firebaseStub;
        cleanup = suite.cleanup;
        domFixtures = suite.domFixtures;

        // Render form to body so autoSelectOptions can find elements
        document.body.innerHTML = renderWithdrawalForm();
        autoSelectOptions();
    });

    afterEach(() => {
        cleanup();
    });

    describe('Baseline activity availability', () => {
        const baselineOptionIds = [
            'baselineBloodDonationCheck',
            'baselineUrineDonationCheck',
            'baselineMouthwashDonationCheck',
            'baselineSpecimenSurveyCheck',
        ];

        it('disables and visually mutes Baseline activities for an eligible follow-up participant', async () => {
            await participantState.setParticipant(createMockParticipant('followup-eligible', {
                followup: {
                    eligible: true,
                    [fieldMapping.followups.activityRound]: 'A1',
                },
            }));

            document.body.innerHTML = renderWithdrawalForm();

            baselineOptionIds.forEach(id => {
                expect(document.getElementById(id).disabled).toBe(true);
            });
            expect(document.getElementById('initialSurveyCheck').disabled).toBe(false);
            baselineOptionIds.forEach(id => {
                expect(document.querySelector(`label[for="${id}"].text-grayed-out`)).not.toBeNull();
            });
            expect(document.getElementById('refusedQualityOfLifeSurveyCheck').disabled).toBe(false);
            expect(document.getElementById('withdrawConsentCheck').disabled).toBe(false);

            const currentRoundOption = document.getElementById('currentRoundSiteSpecimenCollectionCheck');
            expect(currentRoundOption).not.toBeNull();
            expect(currentRoundOption.disabled).toBe(false);
            expect(currentRoundOption.dataset.optionkey)
                .toBe(String(fieldMapping.currentRoundCollection.A1.refusal));
            expect(currentRoundOption.nextElementSibling.textContent).toContain('Current Round of Site Specimen Collection (A1)');
            const specimenOptionIds = Array.from(document.querySelectorAll('input[name="options"]'))
                .map(option => option.id);
            expect(specimenOptionIds.indexOf('currentRoundSiteSpecimenCollectionCheck'))
                .toBeLessThan(specimenOptionIds.indexOf('allFutureSpecimensCheck'));
        });

        it('uses the currently eligible activity from the SMDB followups array', async () => {
            await participantState.setParticipant(createMockParticipant('smdb-followups', {
                followups: [{
                    [fieldMapping.followups.activityRound]: 'A1',
                    [fieldMapping.followups.eligibilityStartAt]: '2020-01-01T00:00:00Z',
                    [fieldMapping.followups.eligibilityEndAt]: '2030-01-01T00:00:00Z',
                }],
            }));

            document.body.innerHTML = renderWithdrawalForm();

            baselineOptionIds.forEach(id => {
                expect(document.getElementById(id).disabled).toBe(true);
            });
            expect(document.getElementById('initialSurveyCheck').disabled).toBe(false);
            expect(document.getElementById('currentRoundSiteSpecimenCollectionCheck')
                .nextElementSibling.textContent).toContain('Current Round of Site Specimen Collection (A1)');
        });

        it('keeps Baseline activities selectable when there is no eligible follow-up activity', async () => {
            await participantState.setParticipant(createMockParticipant('baseline-participant', {
                followup: { eligible: false },
            }));

            document.body.innerHTML = renderWithdrawalForm();

            baselineOptionIds.forEach(id => {
                expect(document.getElementById(id).disabled).toBe(false);
            });
            baselineOptionIds.forEach(id => {
                expect(document.querySelector(`label[for="${id}"].text-grayed-out`)).toBeNull();
            });
            expect(document.getElementById('currentRoundSiteSpecimenCollectionCheck')).toBeNull();
        });

        it('does not render a current-round refusal without configured concept IDs', async () => {
            await participantState.setParticipant(createMockParticipant('unmapped-round', {
                followup: {
                    eligible: true,
                    [fieldMapping.followups.activityRound]: 'A2',
                },
            }));

            document.body.innerHTML = renderWithdrawalForm();

            expect(document.getElementById('currentRoundSiteSpecimenCollectionCheck')).toBeNull();
        });
    });

    describe('Checkbox Logic (autoSelectOptions)', () => {
        it('checks "Destroy Data", "Withdraw Consent", and "Revoke HIPAA" when "Destroy Data" is checked', () => {
            const destroyCheck = document.getElementById('destroyDataCheck');
            const withdrawCheck = document.getElementById('withdrawConsentCheck');
            const revokeCheck = document.getElementById('revokeHipaaAuthorizationCheck');

            expect(destroyCheck.checked).toBe(false);
            expect(withdrawCheck.checked).toBe(false);
            expect(revokeCheck.checked).toBe(false);

            destroyCheck.checked = true;
            destroyCheck.dispatchEvent(new window.Event('change'));

            expect(withdrawCheck.checked).toBe(true);
            expect(revokeCheck.checked).toBe(true);
        });

        it('cannot uncheck "Withdraw Consent" if "Destroy Data" is checked', () => {
            const destroyCheck = document.getElementById('destroyDataCheck');
            const withdrawCheck = document.getElementById('withdrawConsentCheck');

            // Check Destroy Data
            destroyCheck.checked = true;
            destroyCheck.dispatchEvent(new window.Event('change'));
            expect(withdrawCheck.checked).toBe(true);

            // Unchecks Withdraw Consent
            withdrawCheck.checked = false;
            withdrawCheck.dispatchEvent(new window.Event('change'));

            // Reverts to true
            expect(withdrawCheck.checked).toBe(true);
        });

        it('cannot uncheck "Revoke HIPAA" if "Withdraw Consent" is checked', () => {
            const withdrawCheck = document.getElementById('withdrawConsentCheck');
            const revokeCheck = document.getElementById('revokeHipaaAuthorizationCheck');

            // Check Withdraw Consent
            withdrawCheck.checked = true;
            withdrawCheck.dispatchEvent(new window.Event('change'));
            expect(revokeCheck.checked).toBe(true);

            // Uncheck Revoke HIPAA
            revokeCheck.checked = false;
            revokeCheck.dispatchEvent(new window.Event('change'));

            // Reverts to true
            expect(revokeCheck.checked).toBe(true);
        });

        it('"Participant Deceased" toggles "Who Requested" inputs', () => {
            const deceasedCheck = document.getElementById('participantDeceasedCheck');
            const participantRadio = document.getElementById('requestParticipant');
            const piRadio = document.getElementById('requestPrincipalInvestigator');

            // Initially enabled
            expect(participantRadio.disabled).toBe(false);
            expect(piRadio.disabled).toBe(false);

            // Check deceased
            deceasedCheck.checked = true;
            deceasedCheck.dispatchEvent(new window.Event('change'));

            expect(participantRadio.disabled).toBe(true);
            expect(piRadio.disabled).toBe(true);

            // Uncheck deceased
            deceasedCheck.checked = false;
            deceasedCheck.dispatchEvent(new window.Event('change'));

            expect(participantRadio.disabled).toBe(false);
            expect(piRadio.disabled).toBe(false);
        });
    });

    describe('Date Validation', () => {
        it('validates future dates for suspend contact', () => {
            const futureYear = new Date().getFullYear() + 1;
            expect(validateDate('01', '01', futureYear.toString(), 'suspend').isValid).toBe(true);
        });

        it('invalidates past dates for suspend contact', () => {
            const pastYear = new Date().getFullYear() - 1;
            expect(validateDate('01', '01', pastYear.toString(), 'suspend').isValid).toBe(false);
        });

        it('validates past dates for cause of death', () => {
            const pastYear = new Date().getFullYear() - 1;
            expect(validateDate('01', '01', pastYear.toString(), 'causeOfDeath').isValid).toBe(true);
        });

        it('invalidates future dates for cause of death', () => {
            const futureYear = new Date().getFullYear() + 1;
            expect(validateDate('01', '01', futureYear.toString(), 'causeOfDeath').isValid).toBe(false);
        });

        it('handles incomplete dates', () => {
            expect(validateDate('01', '', '2023', 'suspend').isValid).toBe(false);
        });
    });

    describe('Payload Construction (processRefusalWithdrawalResponses)', () => {
        const mockCheckbox = (conceptId, value = 'Some Option') => ({
            dataset: { optionkey: conceptId.toString() },
            value: value
        });

        const mockRadio = (conceptId, type = 'radio', value = 'Some Option') => ({
            dataset: { optionkey: conceptId.toString() },
            type,
            value
        });

        beforeEach(async () => {
            const participant = createMockParticipant();
            await participantState.setParticipant(participant);
        });

        it('calculates correct status for "Refused All Future Activities"', async () => {
            const selected = [mockCheckbox(fieldMapping.refusedAllFutureActivities, "All Future Study Activities")];

            const result = await processRefusalWithdrawalResponses(
                [], // reasons
                selected, // refusals
                [mockRadio(fieldMapping.requestParticipant)], // who requested
                'page1', // source
                '//' // suspend date
            );

            expect(result[fieldMapping.participationStatus]).toBe(fieldMapping.refusedAll);
            expect(result[fieldMapping.refAllFutureActivitesTimeStamp]).not.toBeNull();
        });

        it('calculates correct status for "Withdraw Consent"', async () => {
            // When withdrawing consent, HIPAA is also implicitly revoked (usually), but testing the explicit selection
            const selected = [
                mockCheckbox(fieldMapping.withdrawConsent, "Withdraw Consent"),
                mockCheckbox(fieldMapping.revokeHIPAA, "Revoke HIPAA Authorization")
            ];
            
            const result = await processRefusalWithdrawalResponses(
                [], 
                selected, 
                [mockRadio(fieldMapping.requestParticipant)], 
                'page1', 
                '//'
            );

            expect(result[fieldMapping.participationStatus]).toBe(fieldMapping.withdrewConsent);
            expect(result[fieldMapping.dateWithdrewConsentRequested]).not.toBeNull();
        });

        it('calculates correct status for "Destroy Data"', async () => {
            const selected = [
                mockCheckbox(fieldMapping.destroyData, "Destroy Data"),
                mockCheckbox(fieldMapping.withdrawConsent, "Withdraw Consent"),
                mockCheckbox(fieldMapping.revokeHIPAA, "Revoke HIPAA Authorization")
            ];
            
            const result = await processRefusalWithdrawalResponses(
                [], 
                selected, 
                [mockRadio(fieldMapping.requestParticipant)], 
                'page1', 
                '//'
            );

            expect(result[fieldMapping.participationStatus]).toBe(fieldMapping.destroyDataStatus);
            expect(result[fieldMapping.dataDestroyCategorical]).toBe(fieldMapping.requestedDataDestroyNotSigned);
        });

        it('calculates "Refused Some" for baseline specific refusals', async () => {
            const selected = [mockCheckbox(fieldMapping.refusedBlood, "Baseline Blood Donation")];
            
            const result = await processRefusalWithdrawalResponses(
                [], 
                selected, 
                [mockRadio(fieldMapping.requestParticipant)], 
                'page1', 
                '//'
            );

            // "Refused some" is the default lower status (score 1)
            expect(result[fieldMapping.participationStatus]).toBe(fieldMapping.refusedSome);
            expect(result[fieldMapping.refBaselineBloodTimeStamp]).not.toBeNull();
        });

        it('saves both added withdrawal items in the participant update payload', async () => {
            await participantState.setParticipant(createMockParticipant('followup-payload', {
                token: 'followup-payload-token',
                followup: {
                    eligible: true,
                    [fieldMapping.followups.activityRound]: 'A1',
                },
            }));

            document.body.innerHTML = renderWithdrawalForm();
            const currentRoundRefusal = document.getElementById('currentRoundSiteSpecimenCollectionCheck');

            document.body.innerHTML = renderRefusalOptions();
            const collectionLocationReason = document.getElementById('noLongerGeographicallyNearCollectionLocation');

            const result = await processRefusalWithdrawalResponses(
                [collectionLocationReason],
                [currentRoundRefusal],
                [mockRadio(fieldMapping.requestParticipant)],
                'page1',
                '//',
            );

            expect(result).toMatchObject({
                token: 'followup-payload-token',
                [fieldMapping.refusalOptions]: {
                    [fieldMapping.currentRoundCollection.A1.refusal]: fieldMapping.yes,
                },
                [fieldMapping.noLongerGeographicallyNearCollectionLocation]: fieldMapping.yes,
                [fieldMapping.participationStatus]: fieldMapping.refusedSome,
            });
            expect(result).not.toHaveProperty(String(fieldMapping.currentRoundCollection.A1.refusal));
            expect(result[fieldMapping.currentRoundCollection.A1.refusedAt])
                .toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });

        it('handles suspend contact', async () => {
            const result = await processRefusalWithdrawalResponses(
                [], 
                [], 
                [mockRadio(fieldMapping.requestParticipant)], 
                'page1', 
                '12/31/2099'
            );

            expect(result[fieldMapping.suspendContact]).toBe('12/31/2099');
            expect(result[fieldMapping.contactSuspended]).toBe(fieldMapping.yes);
        });

        it('does not overwrite prior participation status during suspend-only submission', async () => {
            const participant = createMockParticipant({
                [fieldMapping.participationStatus]: fieldMapping.refusedAll
            });
            await participantState.setParticipant(participant);
            await uiState.setWithdrawalStatusFlags({ hasPriorParticipationStatus: true });

            const result = await processRefusalWithdrawalResponses(
                [],
                [],
                [mockRadio(fieldMapping.requestParticipant)],
                'page1',
                '12/31/2099'
            );

            expect(result[fieldMapping.contactSuspended]).toBe(fieldMapping.yes);
            // participationStatus should not update on suspend-only submission if there is a prior status
            expect(result[fieldMapping.participationStatus]).toBeUndefined();
            expect(result[fieldMapping.suspendContact]).toBe('12/31/2099');
            // the following refusal timestamps should not be set on suspend-only submission if there is a prior status
            expect(result[fieldMapping.refBaselineBloodTimeStamp]).toBeUndefined();
            expect(result[fieldMapping.refBaselineUrineTimeStamp]).toBeUndefined();
            expect(result[fieldMapping.refBaselineMouthwashTimeStamp]).toBeUndefined();
            expect(result[fieldMapping.refBaselineSpecimenSurveysTimeStamp]).toBeUndefined();
            expect(result[fieldMapping.refBaselineAllFutureSpecimensTimeStamp]).toBeUndefined();
            expect(result[fieldMapping.refBaselineAllFutureSurveysTimeStamp]).toBeUndefined();
            expect(result[fieldMapping.refQualityOfLifeSurveyTimeStamp]).toBeUndefined();
            expect(result[fieldMapping.refAllFutureQualityOfLifeSurveysTimeStamp]).toBeUndefined();
            expect(result[fieldMapping.refExperienceSurveyTimeStamp]).toBeUndefined();
            expect(result[fieldMapping.refAllFutureActivitesTimeStamp]).toBeUndefined();
            expect(result[fieldMapping.refCancerScreeningHistorySurveyTimeStamp]).toBeUndefined();
            expect(result[fieldMapping.refAllFutureExperienceSurveysTimeStamp]).toBeUndefined();
        });

        it('clears "who requested" if only baseline refusals selected', async () => {
            // This logic is tricky. Scenario: User selects ONLY "Baseline Blood Donation".
            // hasBaselineRefusalsSelected = true. statusConceptId = refusedSome.
            // The `if` block is NOT entered. `whoRequested` is not cleared.
            const selected = [mockCheckbox(fieldMapping.refusedBlood)];
            const result = await processRefusalWithdrawalResponses(
                [], selected, [mockRadio(fieldMapping.requestParticipant)], 'page1', '//'
            );
            
            // Expect whoRequested to be present.
            expect(result[fieldMapping.whoRequested]).not.toBeNull();
        });
    });
});
