import {
    setupTestSuite,
    createMockParticipant,
    jsonResponse,
    mockApi,
    trackAsyncEventHandlers,
} from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';

describe('participantDetails Integration', () => {
    let module;
    let participantDetails;
    let roleState;
    let appState;
    let participantState;
    let cleanup;
    let asyncHandlerTracker;

    const loadModules = async () => {
        if (module) return;
        module = await import('../src/participantDetails.js');
        const stateManager = await import('../src/stateManager.js');
        const state = stateManager?.default ?? stateManager;
        const detailsModule = module?.default ?? module;
        roleState = state.roleState;
        appState = state.appState;
        participantState = state.participantState;
        participantDetails = detailsModule.renderParticipantDetails;
    };

    beforeEach(async () => {
        const suite = await setupTestSuite();
        cleanup = suite.cleanup;
        asyncHandlerTracker = trackAsyncEventHandlers();

        // Setup DOM for rendering
        document.body.innerHTML = `
            <div id="mainContent"></div>
            <div id="navBarLinks"></div>
            <div id="modalShowMoreData" class="modal fade">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header" id="modalHeader"></div>
                        <div class="modal-body" id="modalBody"></div>
                        <div class="modal-footer" id="modalFooter"></div>
                    </div>
                </div>
            </div>
        `;

        await loadModules();
        
        // Reset roles and state
        await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
        appState.setState({ loginMechanism: { email: true, phone: true } });
    });

    afterEach(async () => {
        try {
            await asyncHandlerTracker.allSettled();
        } finally {
            asyncHandlerTracker.restore();
            cleanup();
        }
    });

    const openEditModal = async (field) => {
        document.getElementById(`${field}button`).click();
        await new Promise(resolve => requestAnimationFrame(resolve));
        return document.querySelector('#modalShowMoreData input');
    };

    const stageEdit = async (field, value) => {
        const input = await openEditModal(field);
        input.value = value;
        document.getElementById('formResponse').dispatchEvent(new window.Event('submit', { cancelable: true }));
        await vi.waitFor(() => {
            expect(document.getElementById(`${field}value`).textContent).toContain(value);
            expect(appState.getState().hasUnsavedChanges).toBe(true);
        });
    };

    it('renders participant details page structure correctly', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);

        const mainContent = document.getElementById('mainContent');
        
        // Check for Header
        expect(mainContent.innerHTML).toContain(participant.Connect_ID);
        
        // Check for Search Buttons
        expect(document.getElementById('backToSearchResultsBtn')).not.toBeNull();
        expect(document.getElementById('backToParticipantLookupBtn')).not.toBeNull();
        
        // Check for Tabs
        expect(document.querySelector('.participant-tabs')).not.toBeNull();
        expect(document.querySelector('.participant-tabs .nav-link.active')?.id).toBe('details-tab');
        expect(document.querySelector('.participant-tab-content .tab-pane.show.active')?.id).toBe('details-content');
    });

    it('keeps the current Details tab selected when the dashboard navigation updates', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);

        const { updateNavBar } = await import('../src/navigationBar.js');
        updateNavBar('dashboardBtn');

        expect(document.getElementById('dashboardBtn').classList.contains('active')).toBe(true);
        expect(document.querySelector('.participant-tabs .nav-link.active')?.id).toBe('details-tab');
        expect(document.querySelector('.participant-tab-content .tab-pane.show.active')?.id).toBe('details-content');
    });

    it('Participant Lookup button requests a fresh lookup form instead of cached results', async () => {
        const participant = createMockParticipant('lookup-uid');
        await participantDetails(participant);

        const lookupBtn = document.getElementById('backToParticipantLookupBtn');
        expect(lookupBtn).not.toBeNull();

        lookupBtn.click();
        const navModule = await import('../src/navigationBar.js');
        const { participantLookupNavRequest } = navModule?.default ?? navModule;
        expect(participantLookupNavRequest()).toBe(true);
        expect(window.location.hash).toBe('#participantLookup');
    });

    it('loads details tab content by default', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);

        const detailsContent = document.getElementById('details-tab-content-inner');
        expect(detailsContent.innerHTML).toContain('Participant Details');
        expect(detailsContent.innerHTML).toContain('Last Name');
        expect(detailsContent.innerHTML).toContain('John'); // Default fName
    });

    it('opens edit modal when Edit button is clicked', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);

        const input = await openEditModal(fieldMapping.lName);

        const modalHeader = document.getElementById('modalHeader');
        expect(modalHeader.textContent).toContain('Edit Last Name');
        expect(input).not.toBeNull();
    });

    it('clears pending edits and participant state when navigating back to search results', async () => {
        const participant = createMockParticipant('pending-edits');
        const pendingChanges = { [fieldMapping.prefName]: 'Staged Name' };

        await participantState.setParticipant(participant);
        appState.setState({ changedOption: pendingChanges, hasUnsavedChanges: true });

        await participantDetails(participant, pendingChanges);

        const backBtn = document.getElementById('backToSearchResultsBtn');
        expect(backBtn).not.toBeNull();

        backBtn.click();
        await asyncHandlerTracker.allSettled();

        expect(appState.getState().changedOption).toEqual({});
        expect(appState.getState().hasUnsavedChanges).toBe(false);
        expect(participantState.getParticipant()).toBeNull();
    });

    it('keeps edit modal populated when withdrawal modal markup is present', async () => {
        const participant = createMockParticipant();
        await participantState.setParticipant(participant);

        // Inject only the withdrawal modal shells (with their unique IDs) to mimic having visited the withdrawal tab
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="modalShowSelectedData">
                <div class="modal-dialog"><div class="modal-content">
                    <div class="modal-header" id="withdrawalModalHeader"></div>
                    <div class="modal-body" id="withdrawalModalBody"></div>
                </div></div>
            </div>
            <div class="modal fade" id="modalShowFinalSelectedData">
                <div class="modal-dialog"><div class="modal-content">
                    <div class="modal-header" id="withdrawalFinalModalHeader"></div>
                    <div class="modal-body" id="withdrawalFinalModalBody"></div>
                </div></div>
            </div>
        `);

        await participantDetails(participant);

        const input = await openEditModal(fieldMapping.lName);

        expect(input).not.toBeNull();
        expect(document.getElementById('withdrawalModalBody').children).toHaveLength(0);
        expect(document.getElementById('withdrawalFinalModalBody').children).toHaveLength(0);
    });

    it('stages changes when modal form is submitted', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);
        expect(document.getElementById(`${fieldMapping.lName}row`).style.getPropertyValue('--bs-table-bg')).toBe('');

        await stageEdit(fieldMapping.lName, 'DoeUpdated');

        expect(appState.getState().changedOption[fieldMapping.lName]).toBe('DoeUpdated');
        expect(participantState.getParticipant()[fieldMapping.lName]).toBe(participant[fieldMapping.lName]);
        const row = document.getElementById(`${fieldMapping.lName}row`);
        expect(row.style.getPropertyValue('--bs-table-bg')).toBe('#FFFACA');
        expect(row.textContent).toContain('Please save changes');
        expect(document.getElementById('updateMemberData')).not.toBeNull();
    });

    it('highlights phone permissions that need confirmation after editing a phone number', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);

        await stageEdit(fieldMapping.cellPhone, '(555) 222-3333');

        expect(document.getElementById(`${fieldMapping.cellPhone}row`).style.getPropertyValue('--bs-table-bg')).toBe('#FFFACA');
        for (const field of [fieldMapping.canWeText, fieldMapping.voicemailMobile]) {
            const row = document.getElementById(`${field}row`);
            const note = document.getElementById(`${field}note`);
            expect(row.style.getPropertyValue('--bs-table-bg')).toBe('yellow');
            expect(note.style.display).toBe('block');
            expect(note.textContent).toContain("Please confirm participant's contact permission");
        }
    });

    it('submits data to API when Save Changes is clicked', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);

        await stageEdit(fieldMapping.lName, 'DoeUpdated');
        const updateParticipant = vi.fn(() => jsonResponse({ code: 200, message: 'Success' }));
        mockApi({ 'POST updateParticipantDataNotSite': updateParticipant });

        document.getElementById('updateMemberData').click();
        await asyncHandlerTracker.allSettled();

        expect(updateParticipant).toHaveBeenCalledOnce();
        const [, options] = updateParticipant.mock.calls[0];
        expect(JSON.parse(options.body)).toMatchObject({
            uid: participant.state.uid,
            [fieldMapping.lName]: 'DoeUpdated',
        });
    });

    it('persists changes to participant state and clears dirty markers after save', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);

        await stageEdit(fieldMapping.prefName, 'UpdatedPref');
        mockApi({
            'POST updateParticipantDataNotSite': () => jsonResponse({ code: 200, message: 'Success' }),
        });

        document.getElementById('updateMemberData').click();
        await asyncHandlerTracker.allSettled();

        expect(participantState.getParticipant()[fieldMapping.prefName]).toBe('UpdatedPref');
        expect(appState.getState()).toMatchObject({ hasUnsavedChanges: false, changedOption: {} });
        expect(document.getElementById(`${fieldMapping.prefName}value`).textContent).toContain('UpdatedPref');
        expect(document.getElementById(`${fieldMapping.prefName}row`).textContent).not.toContain('Please save changes');
        expect(document.getElementById(`${fieldMapping.prefName}row`).style.getPropertyValue('--bs-table-bg')).toBe('');
    });

    it('preserves scroll position after submitting an edit on the Details tab', async () => {
        const participant = createMockParticipant();
        const originalScrollY = window.scrollY;
        const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

        try {
            await participantDetails(participant);
            await new Promise(resolve => requestAnimationFrame(resolve));
            scrollTo.mockClear();

            window.scrollY = 275;
            await stageEdit(fieldMapping.lName, 'DoeUpdated');
            await new Promise(resolve => requestAnimationFrame(resolve));

            expect(scrollTo).toHaveBeenLastCalledWith({ top: 275, behavior: 'auto' });
        } finally {
            window.scrollY = originalScrollY;
            scrollTo.mockRestore();
        }
    });
});
