import {
    setupTestEnvironment,
    teardownTestEnvironment,
    installFirebaseStub,
    createMockParticipant,
    clearAllState,
    expectConsole,
    jsonResponse,
    mockApi,
    trackAsyncEventHandlers,
} from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';

describe('Tab Integration Tests', () => {
    let participant;
    let renderParticipantDetails;
    let roleState;
    let participantState;
    let asyncHandlerTracker;
    let fetchMock;

    const loadModules = async () => {
        if (renderParticipantDetails) return;
        ({ renderParticipantDetails } = await import('../src/participantDetails.js'));
        ({ roleState, participantState } = await import('../src/stateManager.js'));
    };

    beforeEach(async () => {
        setupTestEnvironment();
        installFirebaseStub();
        await clearAllState();
        await loadModules();

        asyncHandlerTracker = trackAsyncEventHandlers();
        fetchMock = mockApi({
            'GET retrievePhysicalActivityReport': () => jsonResponse({ code: 200, data: [] }),
            'GET getParticipantNotification': () => jsonResponse({ code: 200, data: [] }),
        });

        participant = createMockParticipant('test-123', {
            token: 'abc-123',
            Connect_ID: '12345678',
            [fieldMapping.verifiedFlag]: fieldMapping.verified,
            [fieldMapping.consentFlag]: fieldMapping.yes,
            [fieldMapping.consentVersion]: 'HP_consent_V0.02_Eng',
            [fieldMapping.hipaaFlag]: fieldMapping.yes,
            [fieldMapping.hipaaVersion]: 'HP_HIPAA_V1.0_Eng',
        });

        await participantState.setParticipant(participant);
        await roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });

        document.body.innerHTML = `
            <div id="mainContent"></div>
            <div id="navBarLinks"></div>
        `;
    });

    afterEach(async () => {
        try {
            await asyncHandlerTracker.allSettled();
        } finally {
            asyncHandlerTracker.restore();
            participantState.clearParticipant();
            teardownTestEnvironment();
        }
    });

    const renderDetails = (tabId = 'details') => renderParticipantDetails(participant, {}, tabId);

    const clickTab = (tabId) => document.getElementById(`${tabId}-tab`).click();
    const tabContent = (tabId) => document.getElementById(`${tabId}-tab-content-inner`);
    const waitForTabContent = (tabId, text) => vi.waitFor(() => {
        expect(tabContent(tabId).textContent).toContain(text);
    });

    const expectActiveTab = (tabId) => {
        expect(document.querySelector('.participant-tabs .nav-link.active')?.id).toBe(`${tabId}-tab`);
        expect(document.querySelector('.participant-tab-content .tab-pane.show.active')?.id).toBe(`${tabId}-content`);
    };

    describe('Complete tab workflows', () => {
        it('loads participant details and switches to messages', async () => {
            await renderDetails();

            for (const tabId of ['details', 'summary', 'messages']) {
                expect(document.getElementById(`${tabId}-tab`)).not.toBeNull();
            }
            expectActiveTab('details');
            expect(tabContent('details').textContent).toContain('Participant Details');

            clickTab('messages');
            await waitForTabContent('messages', 'No Messages');
            expectActiveTab('messages');
        });

        it('switches back to details after viewing summary', async () => {
            await renderDetails('summary');
            expectActiveTab('summary');
            expect(tabContent('summary').textContent).toContain('Participant Summary');

            clickTab('details');
            await asyncHandlerTracker.allSettled();
            expectActiveTab('details');
            expect(tabContent('details').textContent).toContain('Participant Details');
        });

        it('keeps the last tab selected when tabs are clicked in quick succession', async () => {
            await renderDetails();

            clickTab('messages');
            clickTab('summary');
            await waitForTabContent('messages', 'No Messages');
            await waitForTabContent('summary', 'Participant Summary');

            expectActiveTab('summary');
            expect(window.location.hash).toBe('#participantDetails/summary');
        });

        it('reuses loaded summary content when switching away and back', async () => {
            await renderDetails();

            clickTab('summary');
            await waitForTabContent('summary', 'Participant Summary');
            const summaryTable = tabContent('summary').querySelector('table');
            expect(summaryTable).not.toBeNull();

            clickTab('messages');
            await waitForTabContent('messages', 'No Messages');
            clickTab('summary');
            await asyncHandlerTracker.allSettled();

            expectActiveTab('summary');
            expect(tabContent('summary').querySelector('table')).toBe(summaryTable);
            const reportCalls = fetchMock.mock.calls.filter(([url]) =>
                new URL(url).searchParams.get('api') === 'retrievePhysicalActivityReport',
            );
            expect(reportCalls).toHaveLength(1);
        });

        it('respects role-based tab visibility in full workflow', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            await renderDetails();

            expect(document.getElementById('withdrawal-tab')).toBeNull();
            for (const tabId of ['details', 'summary', 'messages']) {
                expect(document.getElementById(`${tabId}-tab`)).not.toBeNull();
            }
        });

    });

    describe('Edge cases and error handling', () => {
        it('handles missing participant gracefully', async () => {
            participantState.clearParticipant();
            await renderParticipantDetails(null, {}, 'details');
            expect(document.getElementById('mainContent').textContent).toContain('No participant data available');
        });

        it('finishes loading a background tab without changing the active tab', async () => {
            const reportResponse = Promise.withResolvers();
            const retrieveReport = vi.fn(() => reportResponse.promise);
            mockApi({ 'GET retrievePhysicalActivityReport': retrieveReport });
            await renderDetails();

            clickTab('summary');
            try {
                await vi.waitFor(() => expect(retrieveReport).toHaveBeenCalledOnce());
                expect(tabContent('summary').querySelector('.fa-spinner')).not.toBeNull();

                clickTab('messages');
                await waitForTabContent('messages', 'No Messages');
                expectActiveTab('messages');
            } finally {
                reportResponse.resolve(jsonResponse({ code: 200, data: [] }));
                await waitForTabContent('summary', 'Participant Summary');
            }

            expectActiveTab('messages');
            expect(window.location.hash).toBe('#participantDetails/messages');
        });

        it('handles network errors during content load gracefully', async () => {
            expectConsole('error', /Error loading tab content for .*messages.*Network error/);
            mockApi({
                'GET getParticipantNotification': () => Promise.reject(new Error('Network error')),
            });

            await renderDetails();
            clickTab('messages');
            await waitForTabContent('messages', 'Error Loading Content');
            expect(tabContent('messages').textContent).toContain('Network error');
            expectActiveTab('messages');
        });

    });

    describe('Browser navigation integration', () => {
        it('updates the URL to the selected tab without adding a history entry', async () => {
            window.history.replaceState(null, '', '#participantDetails/details');
            const initialLength = window.history.length;
            await renderDetails();

            clickTab('summary');
            await waitForTabContent('summary', 'Participant Summary');

            expect(window.location.hash).toBe('#participantDetails/summary');
            expect(window.history.length).toBe(initialLength);
        });

        it('keeps the selected tab in the participant history entry', async () => {
            window.history.replaceState(null, '', '#participantLookup');
            window.history.pushState(null, '', '#participantDetails/details');
            await renderDetails();
            clickTab('summary');
            await waitForTabContent('summary', 'Participant Summary');

            const waitForNavigation = () => new Promise(resolve => {
                window.addEventListener('hashchange', resolve, { once: true });
            });

            const navigatedBack = waitForNavigation();
            window.history.back();
            await navigatedBack;
            expect(window.location.hash).toBe('#participantLookup');

            const navigatedForward = waitForNavigation();
            window.history.forward();
            await navigatedForward;
            expect(window.location.hash).toBe('#participantDetails/summary');
        });
    });

    describe('Role-based access scenarios', () => {
        it('allows coordinatingCenter users to access kitRequests tab', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: true });
            await renderDetails();
            expect(document.getElementById('kitRequests-tab')).not.toBeNull();
        });

        it('hides pathology tab from helpDesk users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });
            await renderDetails();
            expect(document.getElementById('pathology-tab')).toBeNull();
        });
    });
});
