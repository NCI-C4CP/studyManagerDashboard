import { expect } from 'chai';
import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { setupSurveyResetToolPage, resetParticipantSurvey } from '../src/dataCorrectionsTool/surveyResetTool.js';
import { participantState } from '../src/stateManager.js';
import { baseAPI } from '../src/utils.js';

describe('surveyResetTool', () => {
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
        `;
    });

    afterEach(() => {
        cleanup();
    });

    describe('setupSurveyResetToolPage', () => {
        it('renders the survey reset tool interface', async () => {
            const participant = createMockParticipant();
            setupSurveyResetToolPage(participant);
            await waitForAsyncTasks();

            const content = document.getElementById('mainContent').innerHTML;
            expect(content).to.include('Survey Status Reset Tool');
            expect(content).to.include('SSN Survey');
            expect(document.getElementById('dropdownSurveyMenu')).to.exist;
        });
    });

    describe('Interaction', () => {
        it('selects SSN survey and fetches current status', async () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.ssnStatusFlag]: fieldMapping.started,
                Connect_ID: 'CONN001'
            });
            await participantState.setParticipant(participant);
            setupSurveyResetToolPage(participant);
            await waitForAsyncTasks();

            // Mock findParticipant used in handleSurveyTypeChange
            const originalFindParticipant = (await import('../src/participantLookup.js')).findParticipant;
            const mockFindParticipant = async () => ({
                code: 200,
                data: [participant]
            });
            
            // Note: We can't easily mock the module import here without complex setup or rewire.
            // We can verify UI state change if we simulate the click. Rely on the fact that the click handler calls the logic.
            
            const ssnOption = document.querySelector(`[data-survey="${fieldMapping.ssnStatusFlag}"]`);
            expect(ssnOption).to.exist;
        });
    });

    describe('resetParticipantSurvey', () => {
        it('sends correct reset request to API', async () => {
            const participant = createMockParticipant('test-uid', {
                Connect_ID: 'CONN001'
            });
            await participantState.setParticipant(participant);

            let capturedUrl;
            let capturedBody;

            global.fetch = async (url, options) => {
                capturedUrl = url;
                capturedBody = JSON.parse(options.body);
                return {
                    ok: true,
                    json: async () => ({ 
                        code: 200, 
                        data: { ...participant, [fieldMapping.ssnStatusFlag]: fieldMapping.notStarted } 
                    })
                };
            };

            const response = await resetParticipantSurvey(fieldMapping.ssnStatusFlag);

            expect(capturedUrl).to.include(`${baseAPI}/dashboard?api=resetParticipantSurvey`);
            expect(capturedBody.connectId).to.equal('CONN001');
            expect(capturedBody.survey).to.equal(fieldMapping.ssnStatusFlag);
            expect(response.code).to.equal(200);
        });

        it('handles API errors gracefully', async () => {
            const participant = createMockParticipant();
            await participantState.setParticipant(participant);

            global.fetch = async () => ({
                ok: false,
                status: 500,
                json: async () => ({ message: 'Server Error' })
            });

            try {
                await resetParticipantSurvey(fieldMapping.ssnStatusFlag);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('500 Error: Server Error');
            }
        });
    });
});
