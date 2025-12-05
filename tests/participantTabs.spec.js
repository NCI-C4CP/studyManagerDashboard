import { expect } from 'chai';
import {
    setupTestEnvironment,
    teardownTestEnvironment,
    installFirebaseStub,
    createMockParticipant,
    waitForAsyncTasks,
    clearAllState
} from './helpers.js';

describe('participantTabs', () => {
    let firebaseStub;
    let getVisibleTabs;
    let renderTabNavigation;
    let renderTabContentContainers;
    let loadTabContent;
    let getTabIdFromHash;
    let updateHashForTab;
    let activateTab;
    let initializeTabListeners;
    let roleState;
    let participantState;
    let fieldMapping;

    const loadModule = async () => {
        if (getVisibleTabs) return;
        const module = await import('../src/participantTabs.js');
        const stateModule = await import('../src/stateManager.js');
        const tabs = module?.default ?? module;
        const state = stateModule?.default ?? stateModule;
        roleState = state.roleState;
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
        firebaseStub = installFirebaseStub({ uid: 'test-user' });
        
        // Mock fetch
        global.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => ({ code: 200, data: [] }),
        });

        await clearAllState();
        await loadModule();
    });

    afterEach(() => {
        delete global.fetch;
        teardownTestEnvironment();
    });

    describe('getVisibleTabs', () => {
        it('shows correct tabs for parent users', () => {
            // Parent sees: Details, Summary, Withdrawal, Messages, Pathology (if not helpDesk)
            roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });
            const tabs = getVisibleTabs();
            const tabIds = tabs.map(t => t.id);
            expect(tabIds).to.include('withdrawal');
            expect(tabIds).to.include('pathology');
            expect(tabIds).to.include('details');
            expect(tabIds).to.include('summary');
            expect(tabIds).to.include('messages');
            expect(tabs.length).to.be.at.least(5);
        });

        it('hides withdrawal tab from non-parent users', () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });
            const tabs = getVisibleTabs();
            expect(tabs.map(t => t.id)).to.not.include('withdrawal');
        });

        it('hides pathology tab from helpDesk users', () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });
            const tabs = getVisibleTabs();
            expect(tabs.map(t => t.id)).to.not.include('pathology');
        });

        it('shows dataCorrections and kitRequests to helpDesk users', () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });
            const tabs = getVisibleTabs();
            expect(tabs.map(t => t.id)).to.include('dataCorrections');
            expect(tabs.map(t => t.id)).to.include('kitRequests');
        });

        it('shows dataCorrections and kitRequests to coordinatingCenter users', () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: true });
            const tabs = getVisibleTabs();
            expect(tabs.map(t => t.id)).to.include('dataCorrections');
            expect(tabs.map(t => t.id)).to.include('kitRequests');
        });

        it('hides dataCorrections and kitRequests from regular users', () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const tabs = getVisibleTabs();
            expect(tabs.map(t => t.id)).to.not.include('dataCorrections');
            expect(tabs.map(t => t.id)).to.not.include('kitRequests');
        });

        it('always shows details, summary, and messages tabs', () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const tabs = getVisibleTabs();
            expect(tabs.map(t => t.id)).to.include.members(['details', 'summary', 'messages']);
        });
    });

    describe('renderTabNavigation', () => {
        beforeEach(() => {
            roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });
        });

        it('renders Bootstrap tab navigation with correct structure', () => {
            const html = renderTabNavigation('details');
            expect(html).to.include('<ul class="nav nav-tabs participant-tabs"');
            expect(html).to.include('id="details-tab"');
            // data-toggle="tab" was removed
            expect(html).to.not.include('data-toggle="tab"');
        });

        it('marks specified tab as active', () => {
            const html = renderTabNavigation('summary');
            expect(html).to.include('id="summary-tab"');
            expect(html).to.include('class="nav-link active"');
            expect(html).to.include('aria-selected="true"');
        });

        it('renders only visible tabs based on role', () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const html = renderTabNavigation('details');
            expect(html).to.not.include('id="withdrawal-tab"');
            expect(html).to.include('id="details-tab"');
        });

        it('defaults to details tab when activeTabId is not provided', () => {
            const html = renderTabNavigation();
            expect(html).to.include('id="details-tab"');
            expect(html).to.include('class="nav-link active"');
        });

        it('includes proper ARIA attributes for accessibility', () => {
            const html = renderTabNavigation('details');
            expect(html).to.include('role="tab"');
            expect(html).to.include('aria-controls="details-content"');
            expect(html).to.include('role="tablist"');
        });
    });

    describe('renderTabContentContainers', () => {
        beforeEach(() => {
            roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });
        });

        it('renders tab content containers with correct structure', () => {
            const html = renderTabContentContainers('details');
            expect(html).to.include('class="tab-content participant-tab-content"');
            expect(html).to.include('id="details-content"');
            expect(html).to.include('class="tab-pane');
        });

        it('marks specified tab content as active', () => {
            const html = renderTabContentContainers('summary');
            expect(html).to.include('id="summary-content"');
            expect(html).to.include('show active');
        });

        it('shows loading spinner for active tab', () => {
            const html = renderTabContentContainers('details');
            expect(html).to.include('fa-spinner');
        });

        it('renders only visible tab containers based on role', () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const html = renderTabContentContainers('details');
            expect(html).to.not.include('id="withdrawal-content"');
            expect(html).to.include('id="details-content"');
        });

        it('keeps dataCorrections tab active when deep-linking into a tool', async () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });
            window.location.hash = '#participantDetails/dataCorrections/verificationCorrectionsTool';

            const navHtml = renderTabNavigation('dataCorrections');
            const containersHtml = renderTabContentContainers('dataCorrections');
            document.body.innerHTML = `${navHtml}${containersHtml}`;

            const participant = createMockParticipant('test-123');
            await loadTabContent('dataCorrections', participant);

            const dataCorrectionsTab = document.getElementById('dataCorrections-tab');
            expect(dataCorrectionsTab.classList.contains('active')).to.be.true;
            expect(dataCorrectionsTab.getAttribute('aria-selected')).to.equal('true');
        });

        it('resets dataCorrections content to selector when reselecting the tab', async () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });

            // First load a specific tool
            window.location.hash = '#participantDetails/dataCorrections/verificationCorrectionsTool';
            const navHtml = renderTabNavigation('dataCorrections');
            const containersHtml = renderTabContentContainers('dataCorrections');
            document.body.innerHTML = `${navHtml}${containersHtml}`;

            const participant = createMockParticipant('test-123');
            await loadTabContent('dataCorrections', participant);

            let container = document.getElementById('dataCorrectionsToolContainer');
            expect(container.innerHTML).to.include('Verification Status');

            // Reselect base tab (no tool hash) should show selector, not tool content
            window.location.hash = '#participantDetails/dataCorrections';
            await loadTabContent('dataCorrections', participant);

            container = document.getElementById('dataCorrectionsToolContainer');
            const contentWrapper = document.getElementById('dataCorrections-tab-content-inner');
            expect(contentWrapper.innerHTML).to.include('Please select the tool you would like to use');
            expect(container.innerHTML).to.not.include('Verification Status');
        });
    });

    describe('loadTabContent', () => {
        let participant;

        beforeEach(() => {
            participant = createMockParticipant('test-123');
        });

        it('shows loading spinner before content loads', async () => {
            const originalFetch = global.fetch;
            global.fetch = async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ code: 200, data: [] }),
                };
            };

            document.body.innerHTML = '<div id="summary-tab-content-inner"></div>';
            const promise = loadTabContent('summary', participant);
            await waitForAsyncTasks(10); // Wait for initial render (spinner) but less than fetch delay
            const container = document.getElementById('summary-tab-content-inner');
            expect(container.innerHTML).to.include('fa-spinner');
            await promise;
            
            global.fetch = originalFetch;
        });

        it('loads details tab content', async () => {
            document.body.innerHTML = '<div id="details-tab-content-inner"></div>';
            await loadTabContent('details', participant);
            const container = document.getElementById('details-tab-content-inner');
            expect(container.innerHTML).to.include('participant-details-content');
        });

        it('re-renders details tab when clicked to reflect updated participant state', async () => {
            document.body.innerHTML = `
                <div id="mainContent"></div>
                <div id="navBarLinks"></div>
                <div id="details-tab-content-inner"></div>
                <a id="details-tab" class="nav-link active"></a>
                <a id="summary-tab" class="nav-link"></a>
            `;

            await participantState.setParticipant(participant);

            // Simulate tab click handler manually invoking loadTabContent then re-render details
            await loadTabContent('details', participant);
            const updated = { ...participant, [fieldMapping.verifiedFlag]: fieldMapping.verified };
            await participantState.setParticipant(updated);

            // Click summary then details to trigger re-render via participantTabs handler
            document.getElementById('summary-tab').click();
            document.getElementById('details-tab').click();
            await loadTabContent('details', participantState.getParticipant());

            const container = document.getElementById('details-tab-content-inner');
            expect(container.innerHTML).to.include('participant-details-content');
        });

        it('loads summary tab content', async () => {
            document.body.innerHTML = '<div id="summary-tab-content-inner"></div>';
            await loadTabContent('summary', participant, null);
            await waitForAsyncTasks(50);
            const container = document.getElementById('summary-tab-content-inner');
            expect(container.innerHTML).to.include('Participant Summary');
        });

        it('loads messages tab content', async () => {
            document.body.innerHTML = '<div id="messages-tab-content-inner"></div>';
            await loadTabContent('messages', participant);
            await waitForAsyncTasks(50);
            const container = document.getElementById('messages-tab-content-inner');
            expect(container.innerHTML).to.include('Participant Messages');
        });

        it('handles errors gracefully with error message', async () => {
            document.body.innerHTML = '<div id="summary-tab-content-inner"></div>';
            // Pass null participant to trigger error in summary rendering
            await loadTabContent('summary', null);
            const container = document.getElementById('summary-tab-content-inner');
            expect(container.innerHTML).to.include('No participant data available');
        });

        it('logs error when container not found', async () => {
            const errors = [];
            const originalError = console.error;
            console.error = (...args) => errors.push(args.join(' '));

            document.body.innerHTML = ''; // No container
            await loadTabContent('details', participant);

            expect(errors.some(e => e.includes('Tab content container not found'))).to.be.true;
            console.error = originalError;
        });

        it('shows error message for unknown tab ID', async () => {
            document.body.innerHTML = '<div id="unknown-tab-content-inner"></div>';
            await loadTabContent('unknown', participant);
            const container = document.getElementById('unknown-tab-content-inner');
            expect(container.innerHTML).to.include('Unknown tab');
        });
    });

    describe('getTabIdFromHash', () => {
        beforeEach(() => {
            roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });
        });

        it('extracts tab ID from hash', () => {
            expect(getTabIdFromHash('#participantDetails/summary')).to.equal('summary');
            expect(getTabIdFromHash('#participantDetails/withdrawal')).to.equal('withdrawal');
            expect(getTabIdFromHash('#participantDetails/messages')).to.equal('messages');
        });

        it('defaults to details for invalid hash format', () => {
            expect(getTabIdFromHash('#participantDetails')).to.equal('details');
            expect(getTabIdFromHash('#')).to.equal('details');
            expect(getTabIdFromHash('')).to.equal('details');
        });

        it('defaults to details for unauthorized tab access', () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            expect(getTabIdFromHash('#participantDetails/withdrawal')).to.equal('details');
            expect(getTabIdFromHash('#participantDetails/dataCorrections')).to.equal('details');
        });

        it('allows access to authorized tabs', () => {
            roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });
            expect(getTabIdFromHash('#participantDetails/dataCorrections')).to.equal('dataCorrections');
            expect(getTabIdFromHash('#participantDetails/kitRequests')).to.equal('kitRequests');
        });

        it('handles hash with trailing slash', () => {
            expect(getTabIdFromHash('#participantDetails/summary/')).to.equal('summary');
        });
    });

    describe('updateHashForTab', () => {
        it('updates URL hash with history entry by default', () => {
            updateHashForTab('summary');
            expect(window.location.hash).to.equal('#participantDetails/summary');
        });

        it('updates URL hash for different tabs', () => {
            updateHashForTab('withdrawal');
            expect(window.location.hash).to.equal('#participantDetails/withdrawal');

            updateHashForTab('messages');
            expect(window.location.hash).to.equal('#participantDetails/messages');
        });

        it('updates URL hash without history entry when updateHistory is false', () => {
            window.location.hash = '#participantDetails/details';
            
            // Mock replaceState to verify call
            let replaceStateCalled = false;
            const originalReplaceState = window.history.replaceState;
            window.history.replaceState = () => { replaceStateCalled = true; };
            
            updateHashForTab('summary', false);
            
            expect(replaceStateCalled).to.be.true;
            window.history.replaceState = originalReplaceState;
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

            expect(summaryTab.classList.contains('active')).to.be.true;
            expect(summaryTab.getAttribute('aria-selected')).to.equal('true');
            expect(detailsTab.classList.contains('active')).to.be.false;
            expect(detailsTab.getAttribute('aria-selected')).to.equal('false');
            expect(summaryPane.classList.contains('show')).to.be.true;
            expect(summaryPane.classList.contains('active')).to.be.true;
            expect(detailsPane.classList.contains('show')).to.be.false;
            expect(detailsPane.classList.contains('active')).to.be.false;
        });

        it('handles missing tab gracefully', () => {
            expect(() => activateTab('nonexistent')).to.not.throw();
        });

        it('handles missing nav list gracefully', () => {
            document.body.innerHTML = '<a id="summary-tab" class="nav-link">Summary</a>';
            expect(() => activateTab('summary')).to.not.throw();
        });
    });

    describe('initializeTabListeners', () => {
        let participant;

        beforeEach(() => {
            participant = createMockParticipant('test-123');
            roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });

            document.body.innerHTML = `
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

        it('initializes without errors when all tabs are present', () => {
            expect(() => initializeTabListeners(participant)).to.not.throw();
        });

        it('attaches event listeners to all visible tabs', () => {
            // Test event delegation by simulating a click
            initializeTabListeners(participant);

            const detailsTab = document.getElementById('details-tab');
            detailsTab.click();
            
            // Verify active class
            expect(detailsTab.classList.contains('active')).to.be.true;
        });

        it('handles missing tab elements gracefully', () => {
            const warnings = [];
            const originalWarn = console.warn;
            console.warn = (...args) => warnings.push(args.join(' '));

            document.body.innerHTML = '<div id="details-tab-content-inner"></div>';

            expect(() => initializeTabListeners(participant)).to.not.throw();

            console.warn = originalWarn;
        });

        it('restores pending changes when navigating back to details tab', async () => {
            const { participantState, appState } = await import('../src/stateManager.js');
            await participantState.setParticipant(participant);
            appState.setState({ changedOption: { prefName: 'PendingPref' } });

            let calledWithPending = false;
            // stub dynamic import hook on window for this test
            const originalHook = global.__dynamicImportForParticipantTabs;
            global.__dynamicImportForParticipantTabs = async (path) => {
                if (path === './participantDetails.js') {
                    return {
                        renderParticipantDetails: (_p, pendingChanges) => {
                            calledWithPending = pendingChanges?.prefName === 'PendingPref';
                        }
                    };
                }
                return import(path);
            };

            initializeTabListeners(participant);

            const detailsTab = document.getElementById('details-tab');
            detailsTab.click();

            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(calledWithPending).to.be.true;

            global.__dynamicImportForParticipantTabs = originalHook;
        });
    });

    describe('Tab Edge Cases', () => {
        it('handles missing participant gracefully in loadTabContent', async () => {
            // Details tab doesn't require participant to render container
            document.body.innerHTML = '<div id="details-tab-content-inner"></div>';
            await loadTabContent('details', null);
            const detailsContainer = document.getElementById('details-tab-content-inner');
            expect(detailsContainer.innerHTML).to.include('participant-details-content');

            // Summary tab does require participant
            document.body.innerHTML = '<div id="summary-tab-content-inner"></div>';
            await loadTabContent('summary', null);
            const summaryContainer = document.getElementById('summary-tab-content-inner');
            expect(summaryContainer.innerHTML).to.include('No participant data available');
        });

        it('handles rapid tab ID extraction from different hash formats', () => {
            // Test with parent role to ensure withdrawal tab is accessible
            roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });

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
                expect(result).to.equal(expected, `Failed for hash: ${hash}, got: ${result}`);
            });
        });
    });
});
