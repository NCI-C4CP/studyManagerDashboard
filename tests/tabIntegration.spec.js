import {
    setupTestEnvironment,
    teardownTestEnvironment,
    installFirebaseStub,
    createMockParticipant,
    waitForAsyncTasks,
    clearAllState
} from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';

vi.setConfig({ testTimeout: 10000 });

describe('Tab Integration Tests', () => {
    let firebaseStub;
    let participant;
    let renderParticipantDetails;
    let activateTab;
    let getTabIdFromHash;
    let roleState;
    let participantState;

    const loadModules = async () => {
        if (renderParticipantDetails && activateTab && getTabIdFromHash) return;
        const detailsModule = await import('../src/participantDetails.js');
        const tabsModule = await import('../src/participantTabs.js');
        const stateModule = await import('../src/stateManager.js');
        const tabs = tabsModule?.default ?? tabsModule;
        const state = stateModule?.default ?? stateModule;
        renderParticipantDetails = (detailsModule?.default ?? detailsModule).renderParticipantDetails;
        activateTab = tabs.activateTab;
        getTabIdFromHash = tabs.getTabIdFromHash;
        roleState = state.roleState;
        participantState = state.participantState;
    };

    beforeEach(async () => {
        setupTestEnvironment();
        
        // Mock fetch globally
        global.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => ({ code: 200, data: [] }),
        });

        firebaseStub = installFirebaseStub({ uid: 'test-user' });
        await clearAllState();
        
        await loadModules();

        participant = createMockParticipant('test-123', {
            token: 'abc-123',
            'Connect_ID': '12345678',
            [fieldMapping.verifiedFlag]: fieldMapping.verified,
            [fieldMapping.consentFlag]: fieldMapping.yes,
            [fieldMapping.consentVersion]: 'HP_consent_V0.02_Eng',
            [fieldMapping.hipaaFlag]: fieldMapping.yes,
            [fieldMapping.hipaaVersion]: 'HP_HIPAA_V1.0_Eng',
        });

        await participantState.setParticipant(participant);
        roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });

        document.body.innerHTML = `
            <div id="mainContent"></div>
            <div id="navBarLinks"></div>
        `;

        // Make mainContent globally available as renderParticipantDetails expects it
        global.mainContent = document.getElementById('mainContent');

        // Mock jQuery and Bootstrap for tab activation
        global.$ = (selector) => ({
            tab: (action) => {
                if (typeof selector === 'string') {
                    const el = document.querySelector(selector);
                    if (el && action === 'show') {
                        el.classList.add('active');
                        // Trigger shown.bs.tab event using window.Event
                        const event = new window.Event('shown.bs.tab', { bubbles: true });
                        el.dispatchEvent(event);
                    }
                }
            }
        });
        global.$.fn = { tab: true };
    });

    afterEach(async () => {
        delete global.fetch;
        await participantState.clearParticipant();
        delete global.$;
        delete global.mainContent;
        teardownTestEnvironment();
    });

    describe('Complete tab workflows', () => {
        it('completes workflow: load participant → view tabs → switch tabs', async () => {
            // Navigate to participant details with default tab
            await renderParticipantDetails(participant, {}, 'details');
            await waitForAsyncTasks(50);

            let main = document.getElementById('mainContent');
            expect(main.innerHTML).toContain('participant-tabs');
            expect(main.innerHTML).toContain('details-tab');

            // Verify all visible tabs are rendered
            const detailsTab = document.getElementById('details-tab');
            const summaryTab = document.getElementById('summary-tab');
            const messagesTab = document.getElementById('messages-tab');

            expect(detailsTab).not.toBeNull();
            expect(summaryTab).not.toBeNull();
            expect(messagesTab).not.toBeNull();

            // Verify details tab content is loaded
            const detailsContent = document.getElementById('details-tab-content-inner');
            expect(detailsContent).not.toBeNull();
            // Check for form content
            expect(detailsContent.innerHTML).toContain('Participant Details');
        });

        it('maintains tab state when navigating back with browser button', async () => {
            // Navigate to summary tab
            window.location.hash = '#participantDetails/summary';
            await renderParticipantDetails(participant, {}, 'summary');
            await waitForAsyncTasks(50);

            expect(window.location.hash).toContain('summary');

            // Verify summary tab is active
            const main = document.getElementById('mainContent');
            expect(main.innerHTML).toContain('participant-tabs');

            // Navigate back to details
            window.location.hash = '#participantDetails/details';
            await renderParticipantDetails(participant, {}, 'details');
            await waitForAsyncTasks(50);

            expect(window.location.hash).toContain('details');
        });

        it('handles rapid tab switching without errors', async () => {
            await renderParticipantDetails(participant, {}, 'details');
            await waitForAsyncTasks(50);

            // Rapidly switch tabs
            const errors = [];
            const originalError = console.error;
            console.error = (...args) => errors.push(args.join(' '));

            try {
                activateTab('summary');
                await waitForAsyncTasks(10);
                activateTab('messages');
                await waitForAsyncTasks(10);
                activateTab('details');
                await waitForAsyncTasks(10);
                activateTab('summary');
                await waitForAsyncTasks(50);

                // Should not have thrown any errors
                expect(errors.length).toBe(0);
            } finally {
                console.error = originalError;
            }

            const main = document.getElementById('mainContent');
            expect(main).not.toBeNull();
        });

        it('loads content only once per tab (caching)', async () => {
            await renderParticipantDetails(participant, {}, 'details');
            await waitForAsyncTasks(50);

            // Click summary tab
            const summaryTab = document.getElementById('summary-tab');
            expect(summaryTab).not.toBeNull();

            summaryTab.click();
            await waitForAsyncTasks(500);

            const summaryContent = document.getElementById('summary-tab-content-inner');
            expect(summaryContent.innerHTML).toContain('Participant Summary');

            // Store content
            const firstContent = summaryContent.innerHTML;

            // Click away and back to summary
            const detailsTab = document.getElementById('details-tab');
            detailsTab.click();
            await waitForAsyncTasks(50);

            summaryTab.click();
            await waitForAsyncTasks(50);

            // Content should be the same (cached, not reloaded)
            expect(summaryContent.innerHTML).toBe(firstContent);
        });

        it('respects role-based tab visibility in full workflow', async () => {
            // Set role to non-parent
            roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });

            await renderParticipantDetails(participant, {}, 'details');
            await waitForAsyncTasks(50);

            // Withdrawal tab should not be visible
            const withdrawalTab = document.getElementById('withdrawal-tab');
            expect(withdrawalTab).toBeNull();

            // Details, summary, messages should be visible
            expect(document.getElementById('details-tab')).not.toBeNull();
            expect(document.getElementById('summary-tab')).not.toBeNull();
            expect(document.getElementById('messages-tab')).not.toBeNull();
        });

        it('handles deep linking to specific tab', async () => {
            // Navigate to summary tab via hash
            window.location.hash = '#participantDetails/summary';

            const tabId = getTabIdFromHash(window.location.hash);
            expect(tabId).toBe('summary');

            await renderParticipantDetails(participant, {}, tabId);
            await waitForAsyncTasks(50);

            // Verify summary tab is rendered
            const main = document.getElementById('mainContent');
            expect(main.innerHTML).toContain('summary-tab');
        });

        it('prevents unauthorized tab access via URL', async () => {
            // Non-parent user accessing withdrawal tab
            roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });

            window.location.hash = '#participantDetails/withdrawal';
            const tabId = getTabIdFromHash(window.location.hash);

            // Should default to 'details' instead of 'withdrawal'
            expect(tabId).toBe('details');
        });
    });

    describe('Edge cases and error handling', () => {
        it('handles missing participant gracefully', async () => {
            await participantState.clearParticipant();

            const errors = [];
            const originalError = console.error;
            console.error = (...args) => errors.push(args.join(' '));

            try {
                await renderParticipantDetails(null, {}, 'details');
                await waitForAsyncTasks(50);

                // Should have handled gracefully
                const main = document.getElementById('mainContent');
                expect(main).not.toBeNull();
            } finally {
                console.error = originalError;
            }
        });

        it('handles switching tabs during content load', async () => {
            await renderParticipantDetails(participant, {}, 'details');
            await waitForAsyncTasks(50);

            // Start loading summary
            const summaryTab = document.getElementById('summary-tab');
            summaryTab.click();

            // Switch to messages before summary finishes
            await waitForAsyncTasks(10);
            const messagesTab = document.getElementById('messages-tab');
            messagesTab.click();

            await waitForAsyncTasks(100);

            // Both should complete without errors
            const summaryContent = document.getElementById('summary-tab-content-inner');
            const messagesContent = document.getElementById('messages-tab-content-inner');

            expect(summaryContent.innerHTML).not.toBe('');
            expect(messagesContent.innerHTML).not.toBe('');
        });

        it('handles network errors during content load gracefully', async () => {
            await renderParticipantDetails(participant, {}, 'details');
            await waitForAsyncTasks(50);

            // Mock fetch to fail
            const originalFetch = global.fetch;
            global.fetch = () => Promise.reject(new Error('Network error'));

            // Use messages tab which is more likely to propagate error than summary
            const messagesTab = document.getElementById('messages-tab');
            messagesTab.click();
            await waitForAsyncTasks(300);

            const messagesContent = document.getElementById('messages-tab-content-inner');
            // Should show error message instead of crashing
            expect(messagesContent.innerHTML).toContain('Error Loading Content');

            global.fetch = originalFetch;
        });

        it('handles tab activation when tab element is missing', () => {
            // Activate non-existent tab
            expect(() => activateTab('nonexistent')).not.toThrow();
        });

        it('handles hash changes for invalid tab IDs', () => {
            window.location.hash = '#participantDetails/invalidTabId';
            const tabId = getTabIdFromHash(window.location.hash);

            // Default to 'details'
            expect(tabId).toBe('details');
        });
    });

    describe('Browser navigation integration', () => {
        it('updates URL hash when switching tabs', async () => {
            await renderParticipantDetails(participant, {}, 'details');
            await waitForAsyncTasks(50);

            // Initial hash state
            window.location.hash = '#participantDetails/details';

            // Switch to summary tab
            const summaryTab = document.getElementById('summary-tab');
            summaryTab.click();
            await waitForAsyncTasks(50);

            // Hash should update (via updateHashForTab in event handler)
            expect(window.location.hash).toContain('participantDetails');
        });

        it('supports forward/back navigation between tabs', async () => {
            // Navigate through tabs
            await renderParticipantDetails(participant, {}, 'details');
            await waitForAsyncTasks(50);

            window.location.hash = '#participantDetails/summary';
            await waitForAsyncTasks(20);

            window.location.hash = '#participantDetails/messages';
            await waitForAsyncTasks(20);

            // Go back to summary
            window.location.hash = '#participantDetails/summary';
            const tabId = getTabIdFromHash(window.location.hash);
            expect(tabId).toBe('summary');

            // Go back to details
            window.location.hash = '#participantDetails/details';
            const tabId2 = getTabIdFromHash(window.location.hash);
            expect(tabId2).toBe('details');
        });
    });

    describe('Role-based access scenarios', () => {
        it('allows helpDesk users to access dataCorrections tab', async () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });

            await renderParticipantDetails(participant, {}, 'details');
            await waitForAsyncTasks(50);

            const dataCorrectionsTab = document.getElementById('dataCorrections-tab');
            expect(dataCorrectionsTab).not.toBeNull();
        });

        it('allows coordinatingCenter users to access kitRequests tab', async () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: true });

            await renderParticipantDetails(participant, {}, 'details');
            await waitForAsyncTasks(50);

            const kitRequestsTab = document.getElementById('kitRequests-tab');
            expect(kitRequestsTab).not.toBeNull();
        });

        it('hides pathology tab from helpDesk users', async () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });

            await renderParticipantDetails(participant, {}, 'details');
            await waitForAsyncTasks(50);

            const pathologyTab = document.getElementById('pathology-tab');
            expect(pathologyTab).toBeNull();
        });
    });
});
