import { expect } from 'chai';
import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { baseAPI } from '../src/utils.js';
import { participantState } from '../src/stateManager.js';

describe('participantDetails Integration', () => {
    let module;
    let helpersModule;
    let participantDetails;
    let roleState;
    let appState;
    let firebaseStub;
    let cleanup;
    let domFixtures;

    const loadModules = async () => {
        if (module) return;
        module = await import('../src/participantDetails.js');
        helpersModule = await import('../src/participantDetailsHelpers.js');
        const stateManager = await import('../src/stateManager.js');
        roleState = stateManager.roleState;
        appState = stateManager.appState;
        participantDetails = module.renderParticipantDetails;
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
        expect(mainContent.innerHTML).to.include(participant.Connect_ID);
        
        // Check for Search Buttons
        expect(document.getElementById('backToSearchResultsBtn')).to.exist;
        expect(document.getElementById('backToParticipantLookupBtn')).to.exist;
        
        // Check for Tabs
        expect(document.querySelector('.participant-tabs')).to.exist;
        expect(document.getElementById('details-tab').classList.contains('active')).to.be.true;
    });

    it('Participant Lookup button requests a fresh lookup form instead of cached results', async () => {
        const participant = createMockParticipant('lookup-uid');
        await participantDetails(participant);
        await waitForAsyncTasks();

        const lookupBtn = document.getElementById('backToParticipantLookupBtn');
        expect(lookupBtn).to.exist;

        lookupBtn.click();
        const { participantLookupNavRequest } = await import('../src/navigationBar.js');
        expect(participantLookupNavRequest()).to.equal(true);
        expect(window.location.hash).to.equal('#participantLookup');
    });

    it('loads details tab content by default', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);
        await waitForAsyncTasks();

        const detailsContent = document.getElementById('details-tab-content-inner');
        expect(detailsContent.innerHTML).to.include('Participant Details');
        expect(detailsContent.innerHTML).to.include('Last Name');
        expect(detailsContent.innerHTML).to.include('John'); // Default fName
    });

    it('opens edit modal when Edit button is clicked', async () => {
        const participant = createMockParticipant();
        await participantDetails(participant);
        await waitForAsyncTasks();

        // Find Last Name edit button (row 0 usually)
        // We need to find the button associated with fieldMapping.lName
        // The helper generates buttons with id `${conceptId}button`
        const editButton = document.getElementById(`${fieldMapping.lName}button`);
        expect(editButton).to.exist;

        editButton.click();
        await waitForAsyncTasks();

        const modalHeader = document.getElementById('modalHeader');
        expect(modalHeader.innerHTML).to.include('Edit Last Name');
        
        const modalBody = document.getElementById('modalBody');
        expect(modalBody.querySelector('input')).to.exist;
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
        expect(modalBody).to.exist;
        expect(modalBody.querySelector('input')).to.exist;
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
        expect(row.style.backgroundColor).to.equal('rgb(255, 250, 202)'); // #FFFACA
        
        // Check that value updated in UI
        const valueCell = document.getElementById(`${fieldMapping.lName}value`);
        expect(valueCell.innerHTML).to.include('DoeUpdated');

        // Check that Save Changes button exists
        expect(document.getElementById('updateMemberData')).to.exist;
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

        expect(fetchCalled).to.be.true;
        expect(fetchUrl).to.include('api=updateParticipantDataNotSite');
        // Check that payload contains the update (flat structure)
        expect(fetchBody[fieldMapping.lName]).to.equal('DoeUpdated');
    });
});
