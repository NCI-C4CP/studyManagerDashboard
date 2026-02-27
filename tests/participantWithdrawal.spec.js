import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { renderParticipantWithdrawal } from '../src/participantWithdrawal.js';
import { participantState } from '../src/stateManager.js';

vi.mock('../src/navigationBar.js', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, updateNavBar: () => {} };
});

describe('participantWithdrawal', () => {
    let module;
    let firebaseStub;
    let cleanup;
    let domFixtures;

    const loadModule = async () => {
        if (module) return;
        module = await import('../src/participantWithdrawal.js');
    };

    beforeEach(async () => {
        const suite = await setupTestSuite();
        firebaseStub = suite.firebaseStub;
        cleanup = suite.cleanup;
        domFixtures = suite.domFixtures;

        // Setup DOM
        document.body.innerHTML = `
            <div id="mainContent"></div>
            <div id="navBarLinks"></div>
            <div id="modalShowSelectedData" class="modal fade">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header" id="modalHeader"></div>
                        <div class="modal-body" id="modalBody"></div>
                    </div>
                </div>
            </div>
        `;


        await loadModule();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders withdrawal form for valid participant', async () => {
        const participant = createMockParticipant();
        await participantState.setParticipant(participant);
        await renderParticipantWithdrawal(participant);
        await waitForAsyncTasks();

        const mainContent = document.getElementById('mainContent');
        expect(mainContent.innerHTML).toContain('Refusal of Study Activities');
        expect(mainContent.innerHTML).toContain('Refusal/Withdrawal Requested By');
        expect(mainContent.innerHTML).toContain(participant.Connect_ID);
    });

    it('shows access denied for duplicate participant', async () => {
        const participant = createMockParticipant('duplicate-uid', {
            [fieldMapping.verifiedFlag]: fieldMapping.duplicate
        });
        await participantState.setParticipant(participant);
        await renderParticipantWithdrawal(participant);
        await waitForAsyncTasks();

        const mainContent = document.getElementById('mainContent');
        expect(mainContent.innerHTML).toContain('Access Denied');
        expect(mainContent.innerHTML).toContain('Duplicate account');
        expect(mainContent.innerHTML).not.toContain('Refusal of Study Activities');
        
        // Check buttons
        expect(document.getElementById('goToParticipantSummaryBtn')).not.toBeNull();
        expect(document.getElementById('goToParticipantDetailsBtn')).not.toBeNull();
    });

    it('uses unique modal IDs to avoid conflicts with other tabs', async () => {
        const participant = createMockParticipant();
        await participantState.setParticipant(participant);
        const existingGenericHeader = document.getElementById('modalHeader');
        const existingGenericBody = document.getElementById('modalBody');
        await renderParticipantWithdrawal(participant);
        await waitForAsyncTasks();

        expect(document.getElementById('withdrawalModalHeader')).not.toBeNull();
        expect(document.getElementById('withdrawalModalBody')).not.toBeNull();
        // Ensure we did not introduce or replace the generic modal header/body used by other flows
        expect(document.getElementById('modalHeader')).toBe(existingGenericHeader);
        expect(document.getElementById('modalBody')).toBe(existingGenericBody);
    });

    it('shows previous refusal status alert', async () => {
        const participant = createMockParticipant('refused-uid', {
            [fieldMapping.participationStatus]: fieldMapping.refusedSome,
            [fieldMapping.refusalOptions]: {
                [fieldMapping.refusedSurvey]: fieldMapping.yes
            }
        });
        await participantState.setParticipant(participant);
        await renderParticipantWithdrawal(participant);
        await waitForAsyncTasks();

        const alertPlaceholder = document.getElementById('alert_placeholder');
        expect(alertPlaceholder.innerHTML).toContain('Previously Selected Refusal Option(s)');
        expect(alertPlaceholder.innerHTML).toContain('Initial Survey');
    });

    it('shows suspended contact alert', async () => {
        const participant = createMockParticipant('suspended-uid', {
            [fieldMapping.participationStatus]: fieldMapping.noRefusal,
            [fieldMapping.suspendContact]: '12/31/2099',
            [fieldMapping.startDateSuspendedContact]: '2023-01-01'
        });
        await participantState.setParticipant(participant);
        await renderParticipantWithdrawal(participant);
        await waitForAsyncTasks();

        const alertPlaceholder = document.getElementById('alert_placeholder');
        // Note: The exact text depends on getParticipantSuspendedDate implementation which formats the date
        expect(alertPlaceholder.innerHTML).toContain('12/31/2099');
    });
});
