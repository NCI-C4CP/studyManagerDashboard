import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import { setupVerificationCorrectionsPage, verificationCorrectionsClickHandler } from '../src/dataCorrectionsTool/verificationCorrectionsTool.js';
import { appState, participantState, searchState } from '../src/stateManager.js';
import { baseAPI } from '../src/utils.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';

describe('verificationCorrectionsTool', () => {
    let cleanup;
    let firebaseStub;

    beforeEach(async () => {
        const suite = await setupTestSuite();
        cleanup = suite.cleanup;
        firebaseStub = suite.firebaseStub;

        document.body.innerHTML = `
            <div id="mainContent"></div>
            <div id="navBarLinks"></div>
            <div id="alert_placeholder"></div>
            <div id="modalShowSelectedData" class="modal fade">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header" id="modalHeader"></div>
                        <div class="modal-body" id="modalBody"></div>
                    </div>
                </div>
            </div>
        `;
    });

    afterEach(() => {
        cleanup();
    });

    it('blocks submitting duplicate type when it matches current participant.state value', async () => {
        const participant = createMockParticipant();
        participant.state[fieldMapping.duplicateType] = fieldMapping.activeSignedAsPassive;

        setupVerificationCorrectionsPage(participant);
        await waitForAsyncTasks();

        // Simulate selecting the same duplicate type as current state
        appState.setState({
            correctedOptions: {
                [`state.${fieldMapping.duplicateType}`]: fieldMapping.activeSignedAsPassive,
            }
        });

        const submitBtn = document.getElementById('submitCorrection');
        expect(submitBtn).toBeDefined();
        submitBtn.click();
        await waitForAsyncTasks();

        const modalBody = document.getElementById('modalBody');
        expect(modalBody.innerHTML).toContain('Duplicate Type already set');
        // Confirm button should be absent for invalid selection
        const confirmBtn = modalBody.querySelector('#confirmCorrection');
        expect(confirmBtn).toBeNull();
    });

    describe('setupVerificationCorrectionsPage', () => {
        it('renders the tool interface', async () => {
            const participant = createMockParticipant();
            // Mock state object for duplicateType lookups
            participant.state[fieldMapping.duplicateType] = 123; 
            
            setupVerificationCorrectionsPage(participant);
            await waitForAsyncTasks();

            const content = document.getElementById('mainContent').innerHTML;
            expect(content).toContain('Verification Status');
            expect(content).toContain('Duplicate Type');
            expect(content).toContain('Recruit Type');
            expect(document.getElementById('dropdownVerification')).toBeDefined();
        });
    });

    describe('Interaction', () => {
        it('selecting verification status updates appState', async () => {
            const participant = createMockParticipant();
            setupVerificationCorrectionsPage(participant);
            await waitForAsyncTasks();

            // Simulate dropdown selection for "Verified"
            const verifiedOption = document.getElementById('vrfd');
            
            // Mock dropdown click behavior
            verifiedOption.dispatchEvent(new window.Event('click', { bubbles: true }));
            await waitForAsyncTasks();

            const state = appState.getState().correctedOptions;
            expect(state[fieldMapping.verifiedFlag]).toBe(fieldMapping.verified);
            
            // Verify date input appeared
            const dateContainer = document.getElementById('verificationDateContainer');
            expect(dateContainer.style.display).toBe('block');
        });

        it('selecting a verification status fills verification date and stores corrected options', async () => {
            const participant = createMockParticipant();
            setupVerificationCorrectionsPage(participant);
            await waitForAsyncTasks();

            const verifiedOption = document.getElementById('vrfd');
            verifiedOption.dispatchEvent(new window.Event('click', { bubbles: true }));
            await waitForAsyncTasks();

            const dateContainer = document.getElementById('verificationDateContainer');
            expect(dateContainer.style.display).toBe('block');

            const corrected = appState.getState().correctedOptions;
            expect(corrected[fieldMapping.verficationDate]).toBeDefined();
        });

        it('cleans placeholder selections before rendering modal', async () => {
            const participant = createMockParticipant();
            setupVerificationCorrectionsPage(participant);
            await waitForAsyncTasks();

            appState.setState({
                correctedOptions: {
                    [`state.${fieldMapping.duplicateType}`]: 'select',
                    [`state.${fieldMapping.updateRecruitType}`]: 'select',
                }
            });

            const submitBtn = document.getElementById('submitCorrection');
            submitBtn.click();
            await waitForAsyncTasks();

            const modalBody = document.getElementById('modalBody');
            expect(modalBody.innerHTML).toContain('No corrections selected');
            const confirmBtn = modalBody.querySelector('#confirmCorrection');
            expect(confirmBtn).toBeNull();
        });
    });

    describe('verificationCorrectionsClickHandler (API Submission)', () => {
        it('sends correct payload for verification update', async () => {
            const participant = createMockParticipant();
            await participantState.setParticipant(participant);

            const selectedOptions = {
                [fieldMapping.verifiedFlag]: fieldMapping.verified,
                token: participant.token
            };

            let capturedUrl;
            let capturedBody;

            // Mock fetch for update and lookup
            global.fetch = async (url, options) => {
                if (url.includes('participantDataCorrection')) {
                    capturedUrl = url;
                    capturedBody = JSON.parse(options.body);
                    return {
                        status: 200,
                        json: async () => ({ code: 200 })
                    };
                }
                if (url.includes('getFilteredParticipants')) {
                    return {
                        status: 200,
                        json: async () => ({ 
                            code: 200, 
                            data: [participant] 
                        })
                    };
                }
                return { ok: false };
            };

            // Mock findParticipant since verificationCorrectionsClickHandler calls it.
            // `findParticipant` uses `baseAPI` + `api=getFilteredParticipants`.
            await verificationCorrectionsClickHandler(selectedOptions);

            expect(capturedUrl).toContain(`${baseAPI}/dashboard?api=participantDataCorrection`);
            expect(capturedBody.data[0][fieldMapping.verifiedFlag]).toBe(fieldMapping.verified);
            expect(capturedBody.data[0].token).toBe(participant.token);
        });

        it('invalidates search cache after successful correction', async () => {
            const participant = createMockParticipant();
            await participantState.setParticipant(participant);

            await searchState.setSearchResults(
                { searchType: 'lookup', token: participant.token },
                [participant]
            );
            expect(searchState.getSearchResults()).not.toBe(null);

            global.fetch = async (url) => {
                if (url.includes('participantDataCorrection')) {
                    return { status: 200, ok: true, json: async () => ({ code: 200 }) };
                }
                if (url.includes('getFilteredParticipants')) {
                    return { status: 200, ok: true, json: async () => ({ code: 200, data: [participant] }) };
                }
                return { status: 200, ok: true, json: async () => ({}) };
            };

            await verificationCorrectionsClickHandler({
                [fieldMapping.verifiedFlag]: fieldMapping.verified,
                token: participant.token
            });

            expect(searchState.getSearchResults()).toBe(null);
        });
    });
});
