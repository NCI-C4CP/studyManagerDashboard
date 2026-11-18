import { setupTestSuite, createMockParticipant, trackAsyncEventHandlers, mockApi, jsonResponse, expectConsole } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { setupIncentiveEligibilityToolPage } from '../src/dataCorrectionsTool/incentiveEligibilityTool.js';
import { participantState } from '../src/stateManager.js';
import { baseAPI } from '../src/utils.js';

describe('incentiveEligibilityTool', () => {
    let cleanup;
    let asyncHandlerTracker;

    beforeEach(async () => {
        const suite = await setupTestSuite({
            domFixtures: [{ id: 'mainContent' }]
        });
        cleanup = suite.cleanup;
        asyncHandlerTracker = trackAsyncEventHandlers();
    });

    afterEach(async () => {
        try {
            await asyncHandlerTracker?.allSettled();
        } finally {
            asyncHandlerTracker?.restore();
            asyncHandlerTracker = null;
            cleanup();
        }
    });

    it.each([false, true])('updates the selected eligibility date when reload failure is %s', async (reloadFails) => {
        const participant = createMockParticipant('connect-123');
        const participantData = {
            ...participant,
            [fieldMapping.paymentRound]: {
                [fieldMapping.baselinePayment]: {
                    [fieldMapping.norcPaymentEligibility]: fieldMapping.no,
                    [fieldMapping.eligiblePayment]: fieldMapping.no,
                    [fieldMapping.eligiblePaymentRoundTimestamp]: null,
                }
            }
        };

        const eligibilityDate = '2024-01-02T00:00:00.000Z';
        const updatedParticipant = {
            ...participantData,
            [fieldMapping.paymentRound]: {
                [fieldMapping.baselinePayment]: {
                    ...participantData[fieldMapping.paymentRound][fieldMapping.baselinePayment],
                    [fieldMapping.norcPaymentEligibility]: fieldMapping.yes,
                    [fieldMapping.eligiblePayment]: fieldMapping.yes,
                    [fieldMapping.eligiblePaymentRoundTimestamp]: eligibilityDate,
                }
            }
        };
        // The update response is a bare participant document. The follow-up data only comes from a reload.
        const followups = [{ [fieldMapping.followups.activityRound]: 'A1' }];
        if (reloadFails) {
            expectConsole('error', 'Unable to reload follow-up data. Using the action response. Error: Lookup unavailable');
        }
        const fetchSpy = mockApi({
            'GET getFilteredParticipants': (url) => {
                const query = new URL(url).searchParams;
                if (query.has('token') && reloadFails) {
                    return jsonResponse({ message: 'Lookup unavailable' }, { status: 503 });
                }
                const record = query.has('token') ? { ...updatedParticipant, followups } : participantData;
                return jsonResponse({ code: 200, data: [record] });
            },
            'POST updateParticipantIncentiveEligibility': () => jsonResponse({ code: 200, data: updatedParticipant }),
        });

        setupIncentiveEligibilityToolPage(participant, { containerId: 'mainContent', skipNavBarUpdate: true });

        const baselineOption = document.querySelector(`[data-payment="${fieldMapping.baseline}"]`);
        expect(baselineOption).not.toBeNull();
        baselineOption.click();
        await asyncHandlerTracker.allSettled();

        const dateInput = document.getElementById('dateOfEligibilityInput');
        expect(dateInput).not.toBeNull();
        expect(dateInput.disabled).toBe(false);

        dateInput.value = '2024-01-02';
        dateInput.dispatchEvent(new window.Event('change', { bubbles: true }));

        const confirmBtn = document.getElementById('confirmUpdateEligibility');
        expect(confirmBtn).not.toBeNull();
        confirmBtn.click();
        await asyncHandlerTracker.allSettled();

        expect(fetchSpy).toHaveBeenCalledTimes(3);
        expect(fetchSpy).toHaveBeenNthCalledWith(
            1,
            `${baseAPI}/dashboard?api=getFilteredParticipants&connectId=${participant.Connect_ID}`,
            expect.objectContaining({ method: 'GET' }),
        );
        expect(fetchSpy).toHaveBeenNthCalledWith(
            2,
            `${baseAPI}/dashboard?api=updateParticipantIncentiveEligibility`,
            expect.objectContaining({ method: 'POST' }),
        );
        expect(JSON.parse(fetchSpy.mock.calls[1][1].body)).toEqual({
            connectId: participant.Connect_ID,
            currentPaymentRound: String(fieldMapping.baseline),
            dateOfEligibilityInput: eligibilityDate,
        });
        expect(fetchSpy).toHaveBeenNthCalledWith(
            3,
            `${baseAPI}/dashboard?api=getFilteredParticipants&token=${participant.token}`,
            expect.objectContaining({ method: 'GET' }),
        );
        expect(participantState.getParticipant()).toEqual(reloadFails ? updatedParticipant : { ...updatedParticipant, followups });
        expect(document.getElementById('dateOfEligibilityText').textContent).toContain('01/02/2024');
        expect(document.getElementById('incentiveStatusText').textContent).toContain('Status: Eligible');
        if (reloadFails) {
            expect(document.querySelector('.alert-warning')?.textContent).toContain('Saved. Reopen the participant to refresh follow-up data.');
            expect(document.querySelector('.alert-success')).toBeNull();
        } else {
            expect(document.querySelector('.alert-success')?.textContent).toContain('Participant incentive eligibility status updated successfully!');
        }
        expect(document.querySelector('.alert-danger')).toBeNull();
    });

    it('disables submit and shows already-eligible note when participant is already eligible', async () => {
        const participant = createMockParticipant('connect-eligible');
        const participantData = {
            ...participant,
            [fieldMapping.paymentRound]: {
                [fieldMapping.baselinePayment]: {
                    [fieldMapping.norcPaymentEligibility]: fieldMapping.no,
                    [fieldMapping.eligiblePayment]: fieldMapping.yes,
                    [fieldMapping.eligiblePaymentRoundTimestamp]: '2024-01-01T00:00:00.000Z',
                }
            }
        };

        mockApi({ 'GET getFilteredParticipants': () => jsonResponse({ code: 200, data: [participantData] }) });

        setupIncentiveEligibilityToolPage(participant, { containerId: 'mainContent', skipNavBarUpdate: true });

        const baselineOption = document.querySelector(`[data-payment="${fieldMapping.baseline}"]`);
        baselineOption.click();
        await asyncHandlerTracker.allSettled();

        const submitButton = document.getElementById('submitButton');
        expect(submitButton.disabled).toBe(true);

        const note = document.getElementById('isIncentiveEligibleNote');
        expect(note.innerHTML).toContain('already incentive eligible');
    });
});
