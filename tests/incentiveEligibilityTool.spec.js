import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { setupIncentiveEligibilityToolPage } from '../src/dataCorrectionsTool/incentiveEligibilityTool.js';

describe('incentiveEligibilityTool', () => {
    let cleanup;

    beforeEach(async () => {
        const suite = await setupTestSuite({
            domFixtures: [{ id: 'mainContent' }]
        });
        cleanup = suite.cleanup;
    });

    afterEach(() => {
        cleanup();
    });

    it('sends the selected eligibility date when updating incentive eligibility', async () => {
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

        const fetchCalls = [];
        global.fetch = async (url, options = {}) => {
            fetchCalls.push({ url, options });
            if (url.includes('getFilteredParticipants')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ code: 200, data: [participantData] }),
                };
            }
            if (url.includes('updateParticipantIncentiveEligibility')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ code: 200, data: participantData }),
                };
            }
            return { ok: true, status: 200, json: async () => ({}) };
        };

        setupIncentiveEligibilityToolPage(participant, { containerId: 'mainContent', skipNavBarUpdate: true });
        await waitForAsyncTasks();

        const baselineOption = document.querySelector(`[data-payment="${fieldMapping.baseline}"]`);
        expect(baselineOption).not.toBeNull();
        baselineOption.click();
        await waitForAsyncTasks();

        const dateInput = document.getElementById('dateOfEligibilityInput');
        expect(dateInput).not.toBeNull();
        expect(dateInput.disabled).toBe(false);

        dateInput.value = '2024-01-02';
        dateInput.dispatchEvent(new window.Event('change', { bubbles: true }));

        const confirmBtn = document.getElementById('confirmUpdateEligibility');
        expect(confirmBtn).not.toBeNull();
        confirmBtn.click();
        await waitForAsyncTasks();

        const updateCall = fetchCalls.find(call => call.url.includes('updateParticipantIncentiveEligibility'));
        expect(updateCall).not.toBeNull();
        const body = JSON.parse(updateCall.options.body);
        expect(body.dateOfEligibilityInput).toContain('2024-01-02');
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

        global.fetch = async (url) => {
            if (url.includes('getFilteredParticipants')) {
                return {
                    ok: true,
                    json: async () => ({ code: 200, data: [participantData] }),
                };
            }
            return { ok: true, json: async () => ({}) };
        };

        setupIncentiveEligibilityToolPage(participant, { containerId: 'mainContent', skipNavBarUpdate: true });
        await waitForAsyncTasks();

        const baselineOption = document.querySelector(`[data-payment="${fieldMapping.baseline}"]`);
        baselineOption.click();
        await waitForAsyncTasks();

        const submitButton = document.getElementById('submitButton');
        expect(submitButton.disabled).toBe(true);

        const note = document.getElementById('isIncentiveEligibleNote');
        expect(note.innerHTML).toContain('already incentive eligible');
    });
});
