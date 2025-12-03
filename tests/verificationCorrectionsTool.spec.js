import { expect } from 'chai';
import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import { setupVerificationCorrectionsPage, verificationCorrectionsClickHandler } from '../src/dataCorrectionsTool/verificationCorrectionsTool.js';
import { appState, participantState } from '../src/stateManager.js';
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
        expect(submitBtn).to.exist;
        submitBtn.click();
        await waitForAsyncTasks();

        const modalBody = document.getElementById('modalBody');
        expect(modalBody.innerHTML).to.include('Duplicate Type already set');
        // Confirm button should be absent for invalid selection
        const confirmBtn = modalBody.querySelector('#confirmCorrection');
        expect(confirmBtn).to.not.exist;
    });

    describe('setupVerificationCorrectionsPage', () => {
        it('renders the tool interface', async () => {
            const participant = createMockParticipant();
            // Mock state object for duplicateType lookups
            participant.state[fieldMapping.duplicateType] = 123; 
            
            setupVerificationCorrectionsPage(participant);
            await waitForAsyncTasks();

            const content = document.getElementById('mainContent').innerHTML;
            expect(content).to.include('Verification Status');
            expect(content).to.include('Duplicate Type');
            expect(content).to.include('Recruit Type');
            expect(document.getElementById('dropdownVerification')).to.exist;
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
            expect(state[fieldMapping.verifiedFlag]).to.equal(fieldMapping.verified);
            
            // Verify date input appeared
            const dateContainer = document.getElementById('verificationDateContainer');
            expect(dateContainer.style.display).to.equal('block');
        });

        it('selecting a verification status fills verification date and stores corrected options', async () => {
            const participant = createMockParticipant();
            setupVerificationCorrectionsPage(participant);
            await waitForAsyncTasks();

            const verifiedOption = document.getElementById('vrfd');
            verifiedOption.dispatchEvent(new window.Event('click', { bubbles: true }));
            await waitForAsyncTasks();

            const dateContainer = document.getElementById('verificationDateContainer');
            expect(dateContainer.style.display).to.equal('block');

            const corrected = appState.getState().correctedOptions;
            expect(corrected[fieldMapping.verficationDate]).to.exist;
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
            expect(modalBody.innerHTML).to.include('No corrections selected');
            const confirmBtn = modalBody.querySelector('#confirmCorrection');
            expect(confirmBtn).to.not.exist;
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

            expect(capturedUrl).to.include(`${baseAPI}/dashboard?api=participantDataCorrection`);
            expect(capturedBody.data[0][fieldMapping.verifiedFlag]).to.equal(fieldMapping.verified);
            expect(capturedBody.data[0].token).to.equal(participant.token);
        });
    });
});
