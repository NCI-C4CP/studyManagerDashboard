import { expect } from 'chai';
import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { setupVerificationCorrectionsPage, verificationCorrectionsClickHandler } from '../src/dataCorrectionsTool/verificationCorrectionsTool.js';
import { appState, participantState } from '../src/stateManager.js';
import { baseAPI } from '../src/utils.js';

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
            const dropdownBtn = document.getElementById('dropdownVerification');
            const verifiedOption = document.getElementById('vrfd');
            
            // Mock dropdown click behavior
            const menu = document.getElementById('dropdownMenuButtonVerificationOptns');
            verifiedOption.dispatchEvent(new window.Event('click', { bubbles: true }));
            await waitForAsyncTasks();

            const state = appState.getState().correctedOptions;
            expect(state[fieldMapping.verifiedFlag]).to.equal(fieldMapping.verified);
            
            // Verify date input appeared
            const dateContainer = document.getElementById('verificationDateContainer');
            expect(dateContainer.style.display).to.equal('block');
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
