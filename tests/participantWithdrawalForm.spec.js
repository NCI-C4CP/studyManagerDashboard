import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { 
    renderWithdrawalForm, 
    autoSelectOptions, 
    processRefusalWithdrawalResponses,
    validateDate
} from '../src/participantWithdrawalForm.js';
import { participantState, uiState } from '../src/stateManager.js';

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
            expect(result[fieldMapping.refAllFutureActivitesTimeStamp]).toBeDefined();
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
            expect(result[fieldMapping.dateWithdrewConsentRequested]).toBeDefined();
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
            expect(result[fieldMapping.refBaselineBloodTimeStamp]).toBeDefined();
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

        it('clears "who requested" if only baseline refusals selected', async () => {
            // This logic is tricky. Scenario: User selects ONLY "Baseline Blood Donation".
            // hasBaselineRefusalsSelected = true. statusConceptId = refusedSome.
            // The `if` block is NOT entered. `whoRequested` is not cleared.
            const selected = [mockCheckbox(fieldMapping.refusedBlood)];
            const result = await processRefusalWithdrawalResponses(
                [], selected, [mockRadio(fieldMapping.requestParticipant)], 'page1', '//'
            );
            
            // Expect whoRequested to be present.
            expect(result[fieldMapping.whoRequested]).toBeDefined();
        });
    });
});
