import { setupTestSuite, createMockParticipant, mockApi, jsonResponse, expectConsole } from './helpers.js';
import { setupVerificationCorrectionsPage, verificationCorrectionsClickHandler } from '../src/dataCorrectionsTool/verificationCorrectionsTool.js';
import { appState, participantState, searchState } from '../src/stateManager.js';
import { baseAPI } from '../src/utils.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';

describe('verificationCorrectionsTool', () => {
    let cleanup;

    beforeEach(async () => {
        const suite = await setupTestSuite();
        cleanup = suite.cleanup;

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

    it('blocks submitting duplicate type when it matches current participant.state value', () => {
        const participant = createMockParticipant();
        participant.state[fieldMapping.duplicateType] = fieldMapping.activeSignedAsPassive;

        setupVerificationCorrectionsPage(participant);

        // Simulate selecting the same duplicate type as current state
        appState.setState({
            correctedOptions: {
                [`state.${fieldMapping.duplicateType}`]: fieldMapping.activeSignedAsPassive,
            }
        });

        const submitBtn = document.getElementById('submitCorrection');
        expect(submitBtn).not.toBeNull();
        submitBtn.click();

        const modalBody = document.getElementById('modalBody');
        expect(modalBody.innerHTML).toContain('Duplicate Type already set');
        // Confirm button should be absent for invalid selection
        const confirmBtn = modalBody.querySelector('#confirmCorrection');
        expect(confirmBtn).toBeNull();
    });

    describe('setupVerificationCorrectionsPage', () => {
        it('renders the tool interface', () => {
            const participant = createMockParticipant();
            // Mock state object for duplicateType lookups
            participant.state[fieldMapping.duplicateType] = 123; 
            
            setupVerificationCorrectionsPage(participant);

            const content = document.getElementById('mainContent').innerHTML;
            expect(content).toContain('Verification Status');
            expect(content).toContain('Duplicate Type');
            expect(content).toContain('Recruit Type');
            expect(document.getElementById('dropdownVerification')).not.toBeNull();
        });
    });

    describe('Interaction', () => {
        it('selecting a verification status fills verification date and stores corrected options', () => {
            const participant = createMockParticipant();
            setupVerificationCorrectionsPage(participant);

            const verifiedOption = document.getElementById('vrfd');
            verifiedOption.dispatchEvent(new window.Event('click', { bubbles: true }));

            const dateContainer = document.getElementById('verificationDateContainer');
            expect(dateContainer.style.display).toBe('block');

            const corrected = appState.getState().correctedOptions;
            expect(corrected[fieldMapping.verifiedFlag]).toBe(fieldMapping.verified);
            const date = document.getElementById('verificationDateInput').value;
            expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(corrected[fieldMapping.verficationDate]).toContain(date);
        });

        it('cleans placeholder selections before rendering modal', () => {
            const participant = createMockParticipant();
            setupVerificationCorrectionsPage(participant);

            appState.setState({
                correctedOptions: {
                    [`state.${fieldMapping.duplicateType}`]: 'select',
                    [`state.${fieldMapping.updateRecruitType}`]: 'select',
                }
            });

            const submitBtn = document.getElementById('submitCorrection');
            submitBtn.click();

            const modalBody = document.getElementById('modalBody');
            expect(modalBody.innerHTML).toContain('No corrections selected');
            const confirmBtn = modalBody.querySelector('#confirmCorrection');
            expect(confirmBtn).toBeNull();
        });
    });

    describe('verificationCorrectionsClickHandler (API Submission)', () => {
        it.each([true, false])('renders the saved correction when follow-ups loaded is %s', async (followupsLoaded) => {
            const participant = createMockParticipant('verification-uid', {
                [fieldMapping.verifiedFlag]: fieldMapping.outreachTimedout,
            });
            const updatedParticipant = {
                ...participant,
                [fieldMapping.verifiedFlag]: fieldMapping.verified,
                ...(followupsLoaded ? { followups: [{ [fieldMapping.followups.activityRound]: 'A1' }] } : {}),
            };
            await participantState.setParticipant(participant);
            setupVerificationCorrectionsPage(participant);
            expect(document.getElementById('mainContent').textContent).toContain('Current Verification Status: Outreach timed out');
            await searchState.setSearchResults({ searchType: 'lookup', token: participant.token }, [participant]);
            expect(searchState.getSearchResults()).not.toBeNull();

            const selectedOptions = {
                [fieldMapping.verifiedFlag]: fieldMapping.verified,
                token: participant.token,
            };
            const fetchSpy = mockApi({
                'POST participantDataCorrection': () => jsonResponse({ code: 200 }),
                'GET getFilteredParticipants': () => jsonResponse({ code: 200, data: [updatedParticipant] }),
            });
            await verificationCorrectionsClickHandler(selectedOptions);

            expect(fetchSpy).toHaveBeenCalledTimes(2);
            expect(fetchSpy).toHaveBeenNthCalledWith(
                1,
                `${baseAPI}/dashboard?api=participantDataCorrection`,
                expect.objectContaining({ method: 'POST', body: JSON.stringify({ data: [selectedOptions] }) }),
            );
            expect(fetchSpy).toHaveBeenNthCalledWith(
                2,
                `${baseAPI}/dashboard?api=getFilteredParticipants&token=${participant.token}`,
                expect.objectContaining({ method: 'GET' }),
            );
            expect(participantState.getParticipant()).toEqual(updatedParticipant);
            expect(searchState.getSearchResults()).toBeNull();
            expect(document.getElementById('mainContent').textContent).toContain('Current Verification Status: Verified');
            if (followupsLoaded) {
                expect(document.querySelector('.alert-success')?.textContent).toContain('Correction(s) updated.');
            } else {
                expect(document.querySelector('.alert-warning')?.textContent).toContain('Saved. Reopen the participant to refresh follow-up data.');
                expect(document.querySelector('.alert-success')).toBeNull();
            }
        });

        it('keeps the displayed participant and warns when a saved correction cannot be reloaded', async () => {
            const participant = createMockParticipant('verification-uid', {
                [fieldMapping.verifiedFlag]: fieldMapping.outreachTimedout,
            });
            await participantState.setParticipant(participant);
            setupVerificationCorrectionsPage(participant);
            await searchState.setSearchResults({ searchType: 'lookup', token: participant.token }, [participant]);
            expect(searchState.getSearchResults()).not.toBeNull();

            const fetchSpy = mockApi({
                'POST participantDataCorrection': () => jsonResponse({ code: 200 }),
                'GET getFilteredParticipants': () => jsonResponse({ message: 'Lookup unavailable' }, { status: 503 }),
            });
            expectConsole('error', 'Error in findParticipant(): Error: Error fetching participants: 503 - Lookup unavailable');
            await verificationCorrectionsClickHandler({
                [fieldMapping.verifiedFlag]: fieldMapping.verified,
                token: participant.token,
            });

            expect(fetchSpy).toHaveBeenCalledTimes(2);
            expect(participantState.getParticipant()).toEqual(participant);
            expect(searchState.getSearchResults()).toBeNull();
            expect(document.getElementById('mainContent').textContent).toContain('Current Verification Status: Outreach timed out');
            expect(document.querySelector('.alert-warning')?.textContent).toContain('Correction saved, but participant data could not be refreshed.');
        });
    });
});
