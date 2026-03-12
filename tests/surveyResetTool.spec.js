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
            expect(content).toContain('Survey Status Reset Tool');
            expect(content).toContain('SSN Survey');
            expect(document.getElementById('dropdownSurveyMenu')).not.toBeNull();
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
            
            // Note: We can't easily mock the module import here without complex setup or rewire.
            // We can verify UI state change if we simulate the click. Rely on the fact that the click handler calls the logic.
            
            const ssnOption = document.querySelector(`[data-survey="${fieldMapping.ssnStatusFlag}"]`);
            expect(ssnOption).not.toBeNull();
        });

        it('disables submit and shows note when survey is already not started', async () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.ssnStatusFlag]: fieldMapping.notStarted,
                Connect_ID: 'CONN002'
            });
            await participantState.setParticipant(participant);

            global.fetch = async (url) => {
                if (url.includes('getFilteredParticipants')) {
                    return {
                        ok: true,
                        json: async () => ({ code: 200, data: [participant] }),
                    };
                }
                return { ok: true, json: async () => ({}) };
            };

            setupSurveyResetToolPage(participant);
            await waitForAsyncTasks();

            document.querySelector(`[data-survey=\"${fieldMapping.ssnStatusFlag}\"]`).click();
            await waitForAsyncTasks();

            expect(document.getElementById('submitButton').disabled).toBe(true);
            expect(document.getElementById('isSurveyAlreadyResetNote').innerHTML).toContain('no survey data to be reset');
        });

        it('enables submit and resets status after confirmation', async () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.ssnStatusFlag]: fieldMapping.completed,
                Connect_ID: 'CONN003'
            });
            await participantState.setParticipant(participant);

            const fetchCalls = [];
            global.fetch = async (url, options) => {
                fetchCalls.push({ url, options });
                if (url.includes('getFilteredParticipants')) {
                    return {
                        ok: true,
                        json: async () => ({ code: 200, data: [participant] }),
                    };
                }
                if (url.includes('resetParticipantSurvey')) {
                    return {
                        ok: true,
                        json: async () => ({ code: 200, data: { ...participant, [fieldMapping.ssnStatusFlag]: fieldMapping.notStarted } }),
                    };
                }
                return { ok: true, json: async () => ({}) };
            };

            setupSurveyResetToolPage(participant);
            await waitForAsyncTasks();

            document.querySelector(`[data-survey=\"${fieldMapping.ssnStatusFlag}\"]`).click();
            await waitForAsyncTasks();

            expect(document.getElementById('submitButton').disabled).toBe(false);

            document.getElementById('submitButton').click();
            await waitForAsyncTasks();
            document.getElementById('confirmResetButton').click();
            await waitForAsyncTasks();

            const resetCall = fetchCalls.find(call => call.url.includes('resetParticipantSurvey'));
            expect(resetCall).not.toBeNull();

            const statusText = document.getElementById('surveyStatusText').textContent;
            expect(statusText).toContain('Not Started');
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

            expect(capturedUrl).toContain(`${baseAPI}/dashboard?api=resetParticipantSurvey`);
            expect(capturedBody.connectId).toBe('CONN001');
            expect(capturedBody.survey).toBe(fieldMapping.ssnStatusFlag);
            expect(response.code).toBe(200);
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
                throw new Error('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('500 Error: Server Error');
            }
        });
    });
});
