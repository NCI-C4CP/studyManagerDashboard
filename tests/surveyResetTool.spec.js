import { setupTestSuite, createMockParticipant, trackAsyncEventHandlers, mockApi, jsonResponse, expectConsole } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { setupSurveyResetToolPage, resetParticipantSurvey } from '../src/dataCorrectionsTool/surveyResetTool.js';
import { participantState } from '../src/stateManager.js';
import { baseAPI } from '../src/utils.js';

describe('surveyResetTool', () => {
    let cleanup;
    let asyncHandlerTracker;

    beforeEach(async () => {
        const suite = await setupTestSuite();
        cleanup = suite.cleanup;
        asyncHandlerTracker = trackAsyncEventHandlers();

        document.body.innerHTML = `
            <div id="mainContent"></div>
            <div id="navBarLinks"></div>
            <div id="alert_placeholder"></div>
        `;
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

    describe('setupSurveyResetToolPage', () => {
        it('renders the survey reset tool interface', () => {
            const participant = createMockParticipant();
            setupSurveyResetToolPage(participant);

            const content = document.getElementById('mainContent').innerHTML;
            expect(content).toContain('Survey Status Reset Tool');
            expect(content).toContain('SSN Survey');
            expect(document.getElementById('dropdownSurveyMenu')).not.toBeNull();
        });
    });

    describe('Interaction', () => {
        it('selects SSN survey and fetches current status', async () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.ssnStatusFlag]: fieldMapping.surveyStatus.started,
                Connect_ID: 'CONN001',
            });
            const fetchedParticipant = { ...participant, [fieldMapping.ssnStatusFlag]: fieldMapping.surveyStatus.completed };
            const fetchSpy = mockApi({
                'GET getFilteredParticipants': () => jsonResponse({ code: 200, data: [fetchedParticipant] }),
            });
            setupSurveyResetToolPage(participant);

            const ssnOption = document.querySelector(`[data-survey="${fieldMapping.ssnStatusFlag}"]`);
            ssnOption.click();
            await asyncHandlerTracker.allSettled();

            expect(fetchSpy).toHaveBeenCalledExactlyOnceWith(
                `${baseAPI}/dashboard?api=getFilteredParticipants&connectId=${participant.Connect_ID}`,
                expect.objectContaining({ method: 'GET' }),
            );
            expect(participantState.getParticipant()).toEqual(fetchedParticipant);
            expect(document.getElementById('surveyStatusText').textContent).toContain('Completed');
            expect(document.getElementById('submitButton').disabled).toBe(false);
        });

        it('disables submit and shows note when survey is already not started', async () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.ssnStatusFlag]: fieldMapping.notStarted,
                Connect_ID: 'CONN002'
            });
            await participantState.setParticipant(participant);

            mockApi({ 'GET getFilteredParticipants': () => jsonResponse({ code: 200, data: [participant] }) });

            setupSurveyResetToolPage(participant);

            document.querySelector(`[data-survey=\"${fieldMapping.ssnStatusFlag}\"]`).click();
            await asyncHandlerTracker.allSettled();

            expect(document.getElementById('submitButton').disabled).toBe(true);
            expect(document.getElementById('isSurveyAlreadyResetNote').innerHTML).toContain('no survey data to be reset');
        });

        it.each([false, true])('resets status after confirmation when reload failure is %s', async (reloadFails) => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.ssnStatusFlag]: fieldMapping.surveyStatus.completed,
                Connect_ID: 'CONN003'
            });
            await participantState.setParticipant(participant);

            // The reset response is a bare participant document. The follow-up data only comes from a reload.
            const followups = [{ [fieldMapping.followups.activityRound]: 'A1' }];
            const resetParticipant = { ...participant, [fieldMapping.ssnStatusFlag]: fieldMapping.notStarted };
            if (reloadFails) {
                expectConsole('error', 'Unable to reload follow-up data. Using the action response. Error: Lookup unavailable');
            }
            const fetchSpy = mockApi({
                'GET getFilteredParticipants': (url) => {
                    const query = new URL(url).searchParams;
                    if (query.has('token') && reloadFails) {
                        return jsonResponse({ message: 'Lookup unavailable' }, { status: 503 });
                    }
                    const record = query.has('token') ? { ...resetParticipant, followups } : participant;
                    return jsonResponse({ code: 200, data: [record] });
                },
                'POST resetParticipantSurvey': () => jsonResponse({ code: 200, data: resetParticipant }),
            });

            setupSurveyResetToolPage(participant);

            document.querySelector(`[data-survey=\"${fieldMapping.ssnStatusFlag}\"]`).click();
            await asyncHandlerTracker.allSettled();

            expect(document.getElementById('submitButton').disabled).toBe(false);

            document.getElementById('submitButton').click();
            await asyncHandlerTracker.allSettled();
            document.getElementById('confirmResetButton').click();
            await asyncHandlerTracker.allSettled();

            expect(fetchSpy).toHaveBeenCalledTimes(3);
            expect(fetchSpy).toHaveBeenNthCalledWith(
                1,
                `${baseAPI}/dashboard?api=getFilteredParticipants&connectId=${participant.Connect_ID}`,
                expect.objectContaining({ method: 'GET' }),
            );
            expect(fetchSpy).toHaveBeenNthCalledWith(
                2,
                `${baseAPI}/dashboard?api=resetParticipantSurvey`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ connectId: participant.Connect_ID, survey: fieldMapping.ssnStatusFlag }),
                }),
            );
            expect(fetchSpy).toHaveBeenNthCalledWith(
                3,
                `${baseAPI}/dashboard?api=getFilteredParticipants&token=${participant.token}`,
                expect.objectContaining({ method: 'GET' }),
            );

            const statusText = document.getElementById('surveyStatusText').textContent;
            expect(statusText).toContain('Not Started');
            expect(participantState.getParticipant()).toEqual(reloadFails ? resetParticipant : { ...resetParticipant, followups });
            expect(document.getElementById('submitButton').disabled).toBe(true);
            if (reloadFails) {
                expect(document.querySelector('.alert-warning')?.textContent).toContain('Saved. Reopen the participant to refresh follow-up data.');
                expect(document.querySelector('.alert-success')).toBeNull();
            } else {
                expect(document.querySelector('.alert-success')?.textContent).toContain('Survey has been successfully reset!');
            }
            expect(document.querySelector('.alert-danger')).toBeNull();
        });
    });

    describe('resetParticipantSurvey', () => {
        it('sends correct reset request to API', async () => {
            const participant = createMockParticipant('test-uid', {
                Connect_ID: 'CONN001'
            });
            await participantState.setParticipant(participant);

            const fetchSpy = mockApi({
                'POST resetParticipantSurvey': () => jsonResponse({
                    code: 200,
                    data: { ...participant, [fieldMapping.ssnStatusFlag]: fieldMapping.notStarted },
                }),
            });

            const response = await resetParticipantSurvey(fieldMapping.ssnStatusFlag);

            expect(fetchSpy).toHaveBeenCalledExactlyOnceWith(
                `${baseAPI}/dashboard?api=resetParticipantSurvey`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ connectId: 'CONN001', survey: fieldMapping.ssnStatusFlag }),
                }),
            );
            expect(response.code).toBe(200);
        });

        it('handles API errors gracefully', async () => {
            const participant = createMockParticipant();
            await participantState.setParticipant(participant);

            mockApi({ 'POST resetParticipantSurvey': () => jsonResponse({ message: 'Server Error' }, { status: 500 }) });
            expectConsole('error', /Failed to reset participant survey:\s+Error: 500 Error: Server Error/);

            await expect(resetParticipantSurvey(fieldMapping.ssnStatusFlag)).rejects.toThrow('500 Error: Server Error');
        });
    });
});
