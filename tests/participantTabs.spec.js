import {
    setupTestEnvironment,
    teardownTestEnvironment,
    installFirebaseStub,
    createMockParticipant,
    clearAllState,
    mockApi,
    jsonResponse,
    expectConsole,
    trackAsyncEventHandlers
} from './helpers.js';

describe('participantTabs', () => {
    let getVisibleTabs;
    let renderTabNavigation;
    let renderTabContentContainers;
    let loadTabContent;
    let getTabIdFromHash;
    let updateHashForTab;
    let activateTab;
    let initializeTabListeners;
    let roleState;
    let appState;
    let asyncHandlerTracker;
    let participantState;
    let fieldMapping;

    const loadModule = async () => {
        if (getVisibleTabs) return;
        const module = await import('../src/participantTabs.js');
        const stateModule = await import('../src/stateManager.js');
        const tabs = module?.default ?? module;
        const state = stateModule?.default ?? stateModule;
        roleState = state.roleState;
        appState = state.appState;
        participantState = state.participantState;
        fieldMapping = (await import('../src/fieldToConceptIdMapping.js')).default;
        getVisibleTabs = tabs.getVisibleTabs;
        renderTabNavigation = tabs.renderTabNavigation;
        renderTabContentContainers = tabs.renderTabContentContainers;
        loadTabContent = tabs.loadTabContent;
        getTabIdFromHash = tabs.getTabIdFromHash;
        updateHashForTab = tabs.updateHashForTab;
        activateTab = tabs.activateTab;
        initializeTabListeners = tabs.initializeTabListeners;
    };

    beforeEach(async () => {
        setupTestEnvironment();
        installFirebaseStub();
        asyncHandlerTracker = trackAsyncEventHandlers();

        await clearAllState();
        await loadModule();
    });

    afterEach(async () => {
        try {
            await asyncHandlerTracker.allSettled();
        } finally {
            asyncHandlerTracker.restore();
            teardownTestEnvironment();
        }
    });

    describe('getVisibleTabs', () => {
        it('shows correct tabs for parent users', async () => {
            // Parent sees: Details, Summary, Withdrawal, Messages, Pathology (if not helpDesk)
            await roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });
            const tabs = getVisibleTabs();
            const tabIds = tabs.map(t => t.id);
            expect(tabIds).toContain('withdrawal');
            expect(tabIds).toContain('pathology');
            expect(tabIds).toContain('details');
            expect(tabIds).toContain('summary');
            expect(tabIds).toContain('messages');
            expect(tabs.length).toBeGreaterThanOrEqual(5);
        });

        it('hides withdrawal tab from non-parent users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });
            const tabs = getVisibleTabs();
            expect(tabs.map(t => t.id)).not.toContain('withdrawal');
        });

        it('hides pathology tab from helpDesk users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });
            const tabs = getVisibleTabs();
            expect(tabs.map(t => t.id)).not.toContain('pathology');
        });

        it('shows dataCorrections and kitRequests to helpDesk users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });
            const tabs = getVisibleTabs();
            expect(tabs.map(t => t.id)).toContain('dataCorrections');
            expect(tabs.map(t => t.id)).toContain('kitRequests');
        });

        it('shows dataCorrections and kitRequests to coordinatingCenter users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: true });
            const tabs = getVisibleTabs();
            expect(tabs.map(t => t.id)).toContain('dataCorrections');
            expect(tabs.map(t => t.id)).toContain('kitRequests');
        });

        it('hides dataCorrections and kitRequests from regular users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const tabs = getVisibleTabs();
            expect(tabs.map(t => t.id)).not.toContain('dataCorrections');
            expect(tabs.map(t => t.id)).not.toContain('kitRequests');
        });

        it('always shows details, summary, and messages tabs', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const tabs = getVisibleTabs();
            expect(tabs.map(t => t.id)).toEqual(expect.arrayContaining(['details', 'summary', 'messages']));
        });
    });

    describe('renderTabNavigation', () => {
        beforeEach(async () => {
            await roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });
        });

        it('renders Bootstrap tab navigation with correct structure', () => {
            const html = renderTabNavigation('details');
            expect(html).toContain('<ul class="nav nav-tabs participant-tabs"');
            expect(html).toContain('id="details-tab"');
            // data-toggle="tab" was removed
            expect(html).not.toContain('data-toggle="tab"');
        });

        it('marks specified tab as active', () => {
            const html = renderTabNavigation('summary');
            expect(html).toContain('id="summary-tab"');
            expect(html).toContain('class="nav-link active"');
            expect(html).toContain('aria-selected="true"');
        });

        it('renders only visible tabs based on role', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const html = renderTabNavigation('details');
            expect(html).not.toContain('id="withdrawal-tab"');
            expect(html).toContain('id="details-tab"');
        });

        it('defaults to details tab when activeTabId is not provided', () => {
            const html = renderTabNavigation();
            expect(html).toContain('id="details-tab"');
            expect(html).toContain('class="nav-link active"');
        });

        it('includes proper ARIA attributes for accessibility', () => {
            const html = renderTabNavigation('details');
            expect(html).toContain('role="tab"');
            expect(html).toContain('aria-controls="details-content"');
            expect(html).toContain('role="tablist"');
        });
    });

    describe('renderTabContentContainers', () => {
        beforeEach(async () => {
            await roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });
        });

        it('renders tab content containers with correct structure', () => {
            const html = renderTabContentContainers('details');
            expect(html).toContain('class="tab-content participant-tab-content"');
            expect(html).toContain('id="details-content"');
            expect(html).toContain('class="tab-pane');
        });

        it('marks specified tab content as active', () => {
            const html = renderTabContentContainers('summary');
            expect(html).toContain('id="summary-content"');
            expect(html).toContain('show active');
        });

        it('shows loading spinner for active tab', () => {
            const html = renderTabContentContainers('details');
            expect(html).toContain('fa-spinner');
        });

        it('renders only visible tab containers based on role', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const html = renderTabContentContainers('details');
            expect(html).not.toContain('id="withdrawal-content"');
            expect(html).toContain('id="details-content"');
        });

        it('keeps dataCorrections tab active when deep-linking into a tool', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });
            window.location.hash = '#participantDetails/dataCorrections/verificationCorrectionsTool';

            const navHtml = renderTabNavigation('dataCorrections');
            const containersHtml = renderTabContentContainers('dataCorrections');
            document.body.innerHTML = `${navHtml}${containersHtml}`;

            const participant = createMockParticipant('test-123');
            await loadTabContent('dataCorrections', participant);

            const dataCorrectionsTab = document.getElementById('dataCorrections-tab');
            expect(dataCorrectionsTab.classList.contains('active')).toBe(true);
            expect(dataCorrectionsTab.getAttribute('aria-selected')).toBe('true');
        });

        it('resets dataCorrections content to selector when reselecting the tab', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });

            // First load a specific tool
            window.location.hash = '#participantDetails/dataCorrections/verificationCorrectionsTool';
            const navHtml = renderTabNavigation('dataCorrections');
            const containersHtml = renderTabContentContainers('dataCorrections');
            document.body.innerHTML = `${navHtml}${containersHtml}`;

            const participant = createMockParticipant('test-123');
            await loadTabContent('dataCorrections', participant);

            let container = document.getElementById('dataCorrectionsToolContainer');
            expect(container.innerHTML).toContain('Verification Status');

            // Reselect base tab (no tool hash) should show selector, not tool content
            window.location.hash = '#participantDetails/dataCorrections';
            await loadTabContent('dataCorrections', participant);

            container = document.getElementById('dataCorrectionsToolContainer');
            const contentWrapper = document.getElementById('dataCorrections-tab-content-inner');
            expect(contentWrapper.innerHTML).toContain('Please select the tool you would like to use');
            expect(container.innerHTML).not.toContain('Verification Status');
        });
    });

    describe('loadTabContent', () => {
        let participant;

        beforeEach(() => {
            participant = createMockParticipant('test-123');
        });

        it('shows loading spinner before content loads', async () => {
            const response = Promise.withResolvers();
            mockApi({
                'GET retrievePhysicalActivityReport': () => response.promise,
            });

            document.body.innerHTML = '<div id="summary-tab-content-inner"></div>';
            const loading = loadTabContent('summary', participant);
            const container = document.getElementById('summary-tab-content-inner');
            try {
                expect(container.querySelector('.fa-spinner')).not.toBeNull();
            } finally {
                response.resolve(jsonResponse({ code: 200, data: [] }));
                await loading;
            }

            expect(container.querySelector('.fa-spinner')).toBeNull();
            expect(container.textContent).toContain('Participant Summary');
        });

        it('loads details tab content', async () => {
            document.body.innerHTML = '<div id="details-tab-content-inner"></div>';
            await loadTabContent('details', participant);
            const container = document.getElementById('details-tab-content-inner');
            expect(container.innerHTML).toContain('participant-details-content');
        });

        it('re-renders details tab when clicked to reflect updated participant state', async () => {
            document.body.innerHTML = renderTabNavigation() + renderTabContentContainers();
            await participantState.setParticipant(participant);
            initializeTabListeners(participant);

            const updated = { ...participant, [fieldMapping.lName]: 'Updated name' };
            await participantState.setParticipant(updated);
            const renderParticipantDetails = vi.fn();
            appState.setState({ changedOption: {} });
            global.__dynamicImportForParticipantTabs = async () => ({ renderParticipantDetails });

            try {
                document.getElementById('details-tab').click();
                await asyncHandlerTracker.allSettled();

                expect(renderParticipantDetails).toHaveBeenCalledExactlyOnceWith(
                    updated, {}, 'details', { preserveScrollPosition: true },
                );
            } finally {
                delete global.__dynamicImportForParticipantTabs;
            }
        });

        it('loads summary tab content', async () => {
            document.body.innerHTML = '<div id="summary-tab-content-inner"></div>';
            await loadTabContent('summary', participant, {});
            const container = document.getElementById('summary-tab-content-inner');
            expect(container.innerHTML).toContain('Participant Summary');
        });

        it('loads messages tab content', async () => {
            document.body.innerHTML = '<div id="messages-tab-content-inner"></div>';
            mockApi({
                'GET getParticipantNotification': () => jsonResponse({ code: 200, data: [] }),
            });
            await loadTabContent('messages', participant);
            const container = document.getElementById('messages-tab-content-inner');
            expect(container.innerHTML).toContain('Participant Messages');
        });

        it('logs error when container not found', async () => {
            expectConsole('error', /Tab content container not found for tab: details/);
            await loadTabContent('details', participant);
        });

        it('shows error message for unknown tab ID', async () => {
            document.body.innerHTML = '<div id="unknown-tab-content-inner"></div>';
            await loadTabContent('unknown', participant);
            const container = document.getElementById('unknown-tab-content-inner');
            expect(container.innerHTML).toContain('Unknown tab');
        });
    });

    describe('getTabIdFromHash', () => {
        beforeEach(async () => {
            await roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });
        });

        it('extracts tab ID from hash', () => {
            expect(getTabIdFromHash('#participantDetails/summary')).toBe('summary');
            expect(getTabIdFromHash('#participantDetails/withdrawal')).toBe('withdrawal');
            expect(getTabIdFromHash('#participantDetails/messages')).toBe('messages');
        });

        it('defaults to details for invalid hash format', () => {
            expect(getTabIdFromHash('#participantDetails')).toBe('details');
            expect(getTabIdFromHash('#')).toBe('details');
            expect(getTabIdFromHash('')).toBe('details');
        });

        it('defaults to details for unauthorized tab access', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            expect(getTabIdFromHash('#participantDetails/withdrawal')).toBe('details');
            expect(getTabIdFromHash('#participantDetails/dataCorrections')).toBe('details');
        });

        it('allows access to authorized tabs', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });
            expect(getTabIdFromHash('#participantDetails/dataCorrections')).toBe('dataCorrections');
            expect(getTabIdFromHash('#participantDetails/kitRequests')).toBe('kitRequests');
        });

        it('handles hash with trailing slash', () => {
            expect(getTabIdFromHash('#participantDetails/summary/')).toBe('summary');
        });
    });

    describe('updateHashForTab', () => {
        it('updates URL hash with history entry by default', () => {
            const initialLength = window.history.length;
            updateHashForTab('summary');
            expect(window.location.hash).toBe('#participantDetails/summary');
            expect(window.history.length).toBe(initialLength + 1);
        });

        it('updates URL hash for different tabs', () => {
            updateHashForTab('withdrawal');
            expect(window.location.hash).toBe('#participantDetails/withdrawal');

            updateHashForTab('messages');
            expect(window.location.hash).toBe('#participantDetails/messages');
        });

        it('updates URL hash without history entry when updateHistory is false', () => {
            window.history.replaceState(null, '', '#participantDetails/details');
            const initialLength = window.history.length;

            updateHashForTab('summary', false);

            expect(window.location.hash).toBe('#participantDetails/summary');
            expect(window.history.length).toBe(initialLength);
        });
    });

    describe('activateTab', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <ul class="participant-tabs">
                    <li class="nav-item">
                        <a id="summary-tab" class="nav-link" aria-selected="false">Summary</a>
                    </li>
                    <li class="nav-item">
                        <a id="details-tab" class="nav-link active" aria-selected="true">Details</a>
                    </li>
                </ul>
                <div id="summary-content" class="tab-pane">Summary content</div>
                <div id="details-content" class="tab-pane show active">Details content</div>
            `;
        });

        it('activates specified tab and toggles panes', () => {
            activateTab('summary');
            const summaryTab = document.getElementById('summary-tab');
            const detailsTab = document.getElementById('details-tab');
            const summaryPane = document.getElementById('summary-content');
            const detailsPane = document.getElementById('details-content');

            expect(summaryTab.classList.contains('active')).toBe(true);
            expect(summaryTab.getAttribute('aria-selected')).toBe('true');
            expect(detailsTab.classList.contains('active')).toBe(false);
            expect(detailsTab.getAttribute('aria-selected')).toBe('false');
            expect(summaryPane.classList.contains('show')).toBe(true);
            expect(summaryPane.classList.contains('active')).toBe(true);
            expect(detailsPane.classList.contains('show')).toBe(false);
            expect(detailsPane.classList.contains('active')).toBe(false);
        });

        it('handles missing tab gracefully', () => {
            expect(() => activateTab('nonexistent')).not.toThrow();
        });

        it('handles missing nav list gracefully', () => {
            document.body.innerHTML = '<a id="summary-tab" class="nav-link">Summary</a>';
            expect(() => activateTab('summary')).not.toThrow();
        });
    });

    describe('initializeTabListeners', () => {
        let participant;

        beforeEach(async () => {
            participant = createMockParticipant('test-123');
            await roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });

            // Stub dynamic import hook to prevent renderParticipantDetails from firing
            // during tab click tests (it would replace the DOM and cause unhandled rejections)
            global.__dynamicImportForParticipantTabs = async () => ({
                renderParticipantDetails: () => {},
            });

            document.body.innerHTML = `
                <div id="mainContent"></div>
                <div id="navBarLinks"></div>
                <ul class="participant-tabs">
                    <li class="nav-item">
                        <a id="details-tab" class="nav-link" href="#details-content">Details</a>
                    </li>
                    <li class="nav-item">
                        <a id="summary-tab" class="nav-link" href="#summary-content">Summary</a>
                    </li>
                </ul>
                <div class="tab-content">
                    <div id="details-content" class="tab-pane">
                        <div id="details-tab-content-inner"></div>
                    </div>
                    <div id="summary-content" class="tab-pane">
                        <div id="summary-tab-content-inner"></div>
                    </div>
                </div>
            `;
        });

        afterEach(() => {
            delete global.__dynamicImportForParticipantTabs;
        });

        it('attaches event listeners to all visible tabs', async () => {
            // Test event delegation by simulating a click
            initializeTabListeners(participant);

            const detailsTab = document.getElementById('details-tab');
            detailsTab.click();
            await asyncHandlerTracker.allSettled();

            // Verify active class
            expect(detailsTab.classList.contains('active')).toBe(true);
        });

        it('handles missing tab elements gracefully', () => {
            document.body.innerHTML = '<div id="details-tab-content-inner"></div>';
            expectConsole('warn', /Tab navigation list not found/);

            expect(() => initializeTabListeners(participant)).not.toThrow();
        });

        it('restores pending changes when navigating back to details tab', async () => {
            const pendingChanges = { prefName: 'PendingPref' };
            await participantState.setParticipant(participant);
            appState.setState({ changedOption: pendingChanges });
            const renderParticipantDetails = vi.fn();
            global.__dynamicImportForParticipantTabs = async () => ({ renderParticipantDetails });

            initializeTabListeners(participant);
            document.getElementById('details-tab').click();
            await asyncHandlerTracker.allSettled();

            expect(renderParticipantDetails).toHaveBeenCalledExactlyOnceWith(
                participant, pendingChanges, 'details', { preserveScrollPosition: true },
            );
        });
    });

    describe('Tab Edge Cases', () => {
        it('handles missing participant gracefully in loadTabContent', async () => {
            // Details tab doesn't require participant to render container
            document.body.innerHTML = '<div id="details-tab-content-inner"></div>';
            await loadTabContent('details', null);
            const detailsContainer = document.getElementById('details-tab-content-inner');
            expect(detailsContainer.innerHTML).toContain('participant-details-content');

            // Summary tab does require participant
            document.body.innerHTML = '<div id="summary-tab-content-inner"></div>';
            await loadTabContent('summary', null);
            const summaryContainer = document.getElementById('summary-tab-content-inner');
            expect(summaryContainer.innerHTML).toContain('No participant data available');
        });

        it('handles rapid tab ID extraction from different hash formats', async () => {
            // Test with parent role to ensure withdrawal tab is accessible
            await roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });

            const testCases = [
                ['#participantDetails/summary', 'summary'],
                ['#participantDetails/withdrawal', 'withdrawal'],
                ['#participantDetails/', 'details'],
                ['#participantDetails', 'details'],
                ['#invalid/format', 'details'],
                ['', 'details'],
            ];

            testCases.forEach(([hash, expected]) => {
                const result = getTabIdFromHash(hash);
                expect(result).toBe(expected, `Failed for hash: ${hash}, got: ${result}`);
            });
        });
    });
});
