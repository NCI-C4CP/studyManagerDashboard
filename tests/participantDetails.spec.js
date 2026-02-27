import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';

describe('participantDetails Integration', () => {
    let module;
    let helpersModule;
    let participantDetails;
    let roleState;
    let appState;
    let participantState;
    let firebaseStub;
    let cleanup;
    let domFixtures;

    const loadModules = async () => {
        if (module) return;
        module = await import('../src/participantDetails.js');
        helpersModule = await import('../src/participantDetailsHelpers.js');
        const stateManager = await import('../src/stateManager.js');
        const state = stateManager?.default ?? stateManager;
        const detailsModule = module?.default ?? module;
        helpersModule = helpersModule?.default ?? helpersModule;
        roleState = state.roleState;
        appState = state.appState;
        participantState = state.participantState;
        participantDetails = detailsModule.renderParticipantDetails;
    };

    beforeEach(async () => {
        const suite = await setupTestSuite();
        firebaseStub = suite.firebaseStub;
        cleanup = suite.cleanup;
        domFixtures = suite.domFixtures;

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

        // Mock global confirm
        global.confirm = () => true;
        global.alert = () => {};

        await loadModules();
        
        // Reset roles and state
        await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
        appState.setState({ loginMechanism: { email: true, phone: true } });
    });

    afterEach(() => {
        cleanup();
        delete global.confirm;
        delete global.alert;
    });

    it('renders participant details page structure correctly', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);
        await waitForAsyncTasks();

        const mainContent = document.getElementById('mainContent');
        
        // Check for Header
        expect(mainContent.innerHTML).toContain(participant.Connect_ID);
        
        // Check for Search Buttons
        expect(document.getElementById('backToSearchResultsBtn')).not.toBeNull();
        expect(document.getElementById('backToParticipantLookupBtn')).not.toBeNull();
        
        // Check for Tabs
        expect(document.querySelector('.participant-tabs')).not.toBeNull();
        expect(document.getElementById('details-tab').classList.contains('active')).toBe(true);
    });

    it('Participant Lookup button requests a fresh lookup form instead of cached results', async () => {
        const participant = createMockParticipant('lookup-uid');
        await participantDetails(participant);
        await waitForAsyncTasks();

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
        await waitForAsyncTasks();

        const detailsContent = document.getElementById('details-tab-content-inner');
        expect(detailsContent.innerHTML).toContain('Participant Details');
        expect(detailsContent.innerHTML).toContain('Last Name');
        expect(detailsContent.innerHTML).toContain('John'); // Default fName
    });

    it('opens edit modal when Edit button is clicked', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);
        await waitForAsyncTasks();

        // Find Last Name edit button (row 0 usually)
        // We need to find the button associated with fieldMapping.lName
        // The helper generates buttons with id `${conceptId}button`
        const editButton = document.getElementById(`${fieldMapping.lName}button`);
        expect(editButton).not.toBeNull();

        editButton.click();
        await waitForAsyncTasks();

        const modalHeader = document.getElementById('modalHeader');
        expect(modalHeader.innerHTML).toContain('Edit Last Name');
        
        const modalBody = document.getElementById('modalBody');
        expect(modalBody.querySelector('input')).not.toBeNull();
    });

    it('clears pending edits and participant state when navigating back to search results', async () => {
        const participant = createMockParticipant('pending-edits');
        const pendingChanges = { [fieldMapping.prefName]: 'Staged Name' };

        await participantState.setParticipant(participant);
        appState.setState({ changedOption: pendingChanges, hasUnsavedChanges: true });

        await participantDetails(participant, pendingChanges);
        await waitForAsyncTasks();

        const backBtn = document.getElementById('backToSearchResultsBtn');
        expect(backBtn).not.toBeNull();

        backBtn.click();
        await waitForAsyncTasks(100);

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
        await waitForAsyncTasks();

        const editButton = document.getElementById(`${fieldMapping.lName}button`);
        editButton.click();
        await waitForAsyncTasks();
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await waitForAsyncTasks(100);

        const modalBody = document.getElementById('modalBody');
        expect(modalBody).not.toBeNull();
        expect(modalBody.querySelector('input')).not.toBeNull();
    });

    it('stages changes when modal form is submitted', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);
        await waitForAsyncTasks();

        // Open modal for Last Name
        const editButton = document.getElementById(`${fieldMapping.lName}button`);
        editButton.click();
        await waitForAsyncTasks();

        // Modify value
        const input = document.querySelector('#modalBody input');
        input.value = 'DoeUpdated';
        
        // Submit form
        const form = document.getElementById('formResponse');
        form.dispatchEvent(new window.Event('submit'));
        await waitForAsyncTasks();

        // Check that UI updated (yellow background on row)
        const row = document.getElementById(`${fieldMapping.lName}row`);
        expect(row.style.backgroundColor).toBe('rgb(255, 250, 202)'); // #FFFACA
        
        // Check that value updated in UI
        const valueCell = document.getElementById(`${fieldMapping.lName}value`);
        expect(valueCell.innerHTML).toContain('DoeUpdated');

        // Check that Save Changes button exists
        expect(document.getElementById('updateMemberData')).not.toBeNull();
    });

    it('submits data to API when Save Changes is clicked', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);
        await waitForAsyncTasks();

        // Make a change first
        const editButton = document.getElementById(`${fieldMapping.lName}button`);
        editButton.click();
        await waitForAsyncTasks();
        const input = document.querySelector('#modalBody input');
        input.value = 'DoeUpdated';
        document.getElementById('formResponse').dispatchEvent(new window.Event('submit'));
        await waitForAsyncTasks();

        // Mock fetch for API call
        let fetchCalled = false;
        let fetchUrl = '';
        let fetchBody = null;

        global.fetch = async (url, options) => {
            if (url.includes('updateParticipantData')) {
                fetchCalled = true;
                fetchUrl = url;
                fetchBody = JSON.parse(options.body);
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ code: 200, message: 'Success' })
                };
            }
            return { ok: true, json: async () => ({}) };
        };

        // Click Save Changes
        const saveBtn = document.getElementById('updateMemberData');
        saveBtn.click();
        await waitForAsyncTasks();

        expect(fetchCalled).toBe(true);
        expect(fetchUrl).toContain('api=updateParticipantDataNotSite');
        // Check that payload contains the update (flat structure)
        expect(fetchBody[fieldMapping.lName]).toBe('DoeUpdated');
    });

    it('persists changes to participant state and clears dirty markers after save', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);
        await waitForAsyncTasks();

        // Stage a Preferred Name change
        const editButton = document.getElementById(`${fieldMapping.prefName}button`);
        editButton.click();
        await waitForAsyncTasks();

        const input = document.querySelector('#modalBody input');
        input.value = 'UpdatedPref';
        document.getElementById('formResponse').dispatchEvent(new window.Event('submit'));
        await waitForAsyncTasks();

        // Stub fetch for save operation
        const originalFetch = global.fetch;
        global.fetch = async (url, options) => {
            if (url.includes('updateParticipantDataNotSite')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ code: 200, message: 'Success' })
                };
            }
            return { ok: true, status: 200, json: async () => ({}) };
        };

        // Save changes
        document.getElementById('updateMemberData').click();
        await waitForAsyncTasks();
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Value should reflect updated preference
        try {
            const prefValueCell = document.getElementById(`${fieldMapping.prefName}value`);
            expect(prefValueCell.innerHTML).toContain('UpdatedPref');

            // No dirty state note after successful save
            const row = document.getElementById(`${fieldMapping.prefName}row`);
            const actionCell = row?.querySelector('td:last-child');
            expect(actionCell?.textContent || '').not.toContain('Please save changes');

            // Participant state updated for subsequent renders/tabs
        } finally {
            global.fetch = originalFetch;
        }
    });

    it('preserves scroll position after submitting an edit on the Details tab', async () => {
        const participant = createMockParticipant();
        const originalScrollTo = window.scrollTo;
        const scrollCalls = [];

        window.scrollTo = (...args) => {
            scrollCalls.push(args[0]);
            const top = typeof args[0] === 'object' && args[0] !== null && 'top' in args[0] ? args[0].top : args[1];
            if (typeof top === 'number') {
                window.scrollY = top;
            }
        };

        window.scrollY = 0;

        await participantDetails(participant);
        await waitForAsyncTasks();

        const editButton = document.getElementById(`${fieldMapping.lName}button`);
        editButton.click();
        await waitForAsyncTasks();

        const input = document.querySelector('#modalBody input');
        input.value = 'DoeUpdated';

        window.scrollY = 275;
        document.getElementById('formResponse').dispatchEvent(new window.Event('submit'));

        // Wait for the re-render and the follow-up scroll restoration
        await waitForAsyncTasks();
        await waitForAsyncTasks(100);

        const lastCall = scrollCalls[scrollCalls.length - 1];
        expect(lastCall).toEqual({ top: 275, behavior: 'auto' });

        window.scrollTo = originalScrollTo;
    });
});
