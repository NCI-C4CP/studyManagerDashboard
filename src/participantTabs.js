import { roleState } from './stateManager.js';
import { escapeHTML } from './utils.js';

/**
 * Tab configuration with role-based visibility
 * Each tab has id, label, and requiresRole (control user access to the tab):
 */
const TAB_CONFIG = [
    {
        id: 'details',
        label: 'Details',
        requiresRole: null, // Always visible
    },
    {
        id: 'summary',
        label: 'Summary',
        requiresRole: null, // Always visible
    },
    {
        id: 'withdrawal',
        label: 'Withdrawal',
        requiresRole: (roleFlags) => roleFlags.isParent, // Only visible to parent users
    },
    {
        id: 'messages',
        label: 'Messages',
        requiresRole: null, // Always visible
    },
    {
        id: 'pathology',
        label: 'Pathology Report Upload',
        requiresRole: (roleFlags) => !roleFlags.helpDesk, // Hidden from helpDesk
    },
    {
        id: 'dataCorrections',
        label: 'Data Corrections',
        requiresRole: (roleFlags) => roleFlags.helpDesk || roleFlags.coordinatingCenter,
    },
    {
        id: 'kitRequests',
        label: 'Kit Requests',
        requiresRole: (roleFlags) => roleFlags.helpDesk || roleFlags.coordinatingCenter,
    },
];

/**
 * Get visible tabs based on current user roles
 * @returns {Array} Array of visible tab configurations
 */
export const getVisibleTabs = () => {
    const roleFlags = roleState.getRoleFlags();

    return TAB_CONFIG.filter(tab => {
        if (!tab.requiresRole) return true;
        return tab.requiresRole(roleFlags);
    });
};

/**
 * Render tab navigation UI using Bootstrap 4 tabs
 * @param {string} activeTabId - The currently active tab ID
 * @returns {string} HTML string for tab navigation
 */
export const renderTabNavigation = (activeTabId = 'details') => {
    const visibleTabs = getVisibleTabs();

    const tabItems = visibleTabs.map(tab => {
        const isActive = tab.id === activeTabId;
        return `
            <li class="nav-item nav-item-${tab.id}">
                <a class="nav-link ${isActive ? 'active' : ''}"
                   id="${tab.id}-tab"
                   href="#${tab.id}-content"
                   role="tab"
                   aria-controls="${tab.id}-content"
                   aria-selected="${isActive}">
                    ${tab.label}
                </a>
            </li>
        `;
    }).join('');

    return `
        <ul class="nav nav-tabs participant-tabs" role="tablist">
            ${tabItems}
        </ul>
    `;
};

/**
 * Render tab content containers
 * @param {string} activeTabId - The currently active tab ID
 * @returns {string} HTML string for tab content containers
 */
export const renderTabContentContainers = (activeTabId = 'details') => {
    const visibleTabs = getVisibleTabs();

    const tabPanes = visibleTabs.map(tab => {
        const isActive = tab.id === activeTabId;
        return `
            <div class="tab-pane fade ${isActive ? 'show active' : ''}"
                 id="${tab.id}-content"
                 role="tabpanel"
                 aria-labelledby="${tab.id}-tab">
                <div id="${tab.id}-tab-content-inner" class="tab-content-inner">
                    ${isActive ? '<div class="text-center p-4"><i class="fas fa-spinner fa-spin fa-2x"></i></div>' : ''}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="tab-content participant-tab-content">
            ${tabPanes}
        </div>
    `;
};

/**
 * Render the complete tabbed participant interface
 * @param {object} participant - The participant object
 * @param {string} activeTabId - The currently active tab ID (defaults to 'details')
 * @returns {string} HTML string for complete tabbed interface
 */
export const renderParticipantTabs = (participant, activeTabId = 'details') => {
    if (!participant) {
        return '<div class="alert alert-warning">No participant data available</div>';
    }

    return `
        <div class="participant-tabs-container">
            ${renderTabNavigation(activeTabId)}
            ${renderTabContentContainers(activeTabId)}
        </div>
    `;
};

/**
 * Load content for a specific tab
 * @param {string} tabId - The tab ID to load content for
 * @param {object} participant - The participant object
 * @param {object} reports - Optional reports object (for summary tab)
 * @returns {Promise<void>}
 */
export const loadTabContent = async (tabId, participant, reports = null) => {
    const contentContainer = document.getElementById(`${tabId}-tab-content-inner`);
    if (!contentContainer) {
        console.error(`Tab content container not found for tab: ${tabId}`);
        return;
    }

    try {
        contentContainer.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';

        let content = '';
        switch (tabId) {
            case 'details':
                // Details content will be rendered directly by participantDetails.js
                // This is handled separately since it's the main page
                content = '<div id="participant-details-content"></div>';
                break;

            case 'summary':
                const { renderSummaryTabContent } = await import('./participantSummary.js');
                // Reports will be fetched inside renderSummaryTabContent
                content = await renderSummaryTabContent(participant, reports);
                break;

            case 'withdrawal':
                const { renderWithdrawalTabContent } = await import('./participantWithdrawal.js');
                content = await renderWithdrawalTabContent(participant);
                break;

            case 'messages':
                const { renderMessagesTabContent } = await import('./participantMessages.js');
                content = await renderMessagesTabContent(participant);
                break;

            case 'pathology':
                const { renderPathologyTabContent } = await import('./pathologyReportUpload.js');
                content = await renderPathologyTabContent(participant);
                break;

            case 'dataCorrections': {
                const { renderDataCorrectionsTabContent, renderDataCorrectionsToolInTab } = await import('./dataCorrectionsTool/dataCorrectionsToolSelection.js');
                const hashParts = window.location.hash.split('/');
                const toolId = hashParts.length > 2 ? hashParts[2] : '';

                content = await renderDataCorrectionsTabContent(participant);
                contentContainer.innerHTML = content;

                if (toolId) {
                    await renderDataCorrectionsToolInTab(toolId, participant, 'dataCorrectionsToolContainer');
                    activateTab(tabId);
                    requestAnimationFrame(() => activateTab(tabId));
                }
                return;
            }

            case 'kitRequests':
                const { renderKitRequestTabContent } = await import('./requestHomeCollectionKit.js');
                content = await renderKitRequestTabContent(participant);
                break;

            default:
                content = `<div class="alert alert-warning">Unknown tab: ${escapeHTML(tabId)}</div>`;
        }
        contentContainer.innerHTML = content;

    } catch (error) {
        console.error(`Error loading tab content for ${tabId}:`, error);
        contentContainer.innerHTML = `
            <div class="alert alert-danger">
                <h4>Error Loading Content</h4>
                <p>Unable to load ${tabId} content. Please try again.</p>
                <p class="small">${error.message}</p>
            </div>
        `;
    }
};

/**
 * Initialize tab switching event listeners
 * @param {object} participant - The participant object
 * @param {object} reports - Optional reports object
 * @returns {void}
 */
export const initializeTabListeners = (participant, reports = null) => {

    // Handle tab clicks and content loading with a delegated event listener
    const navList = document.querySelector('.participant-tabs');
    if (!navList) {
        console.warn('Tab navigation list not found');
        return;
    }

    // Remove existing listener
    const newNavList = navList.cloneNode(true);
    navList.parentNode.replaceChild(newNavList, navList);

    newNavList.addEventListener('click', async (e) => {
        const tabLink = e.target.closest('.nav-link');
        if (!tabLink) return;

        e.preventDefault();

        // Get the tab ID from the ID attribute, update tab state, and update hash
        const tabId = tabLink.id.replace('-tab', '');
        const allTabs = newNavList.querySelectorAll('.nav-link');
        allTabs.forEach(tab => tab.classList.remove('active'));
        tabLink.classList.add('active');

        const allPanes = document.querySelectorAll('.tab-pane');
        allPanes.forEach(pane => {
            pane.classList.remove('show', 'active');
        });
        const activePane = document.getElementById(`${tabId}-content`);
        if (activePane) {
            activePane.classList.add('show', 'active');
        }

        updateHashForTab(tabId, false);

        const contentContainer = document.getElementById(`${tabId}-tab-content-inner`);
        if (!contentContainer) {
            console.error(`Content container not found for tab: ${tabId}`);
            return;
        }

        const hasSpinner = contentContainer.querySelector('.fa-spinner');
        const isEmpty = contentContainer.innerHTML.trim() === '';

        if (tabId === 'dataCorrections') {
            contentContainer.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
            loadTabContent(tabId, participant, reports);
            return;
        }

        if (hasSpinner || isEmpty) {
            loadTabContent(tabId, participant, reports);
        }
    });
};

/**
 * Get tab ID from hash fragment
 * @param {string} hash - The URL hash (e.g., '#participant/summary')
 * @returns {string} The tab ID (defaults to 'details')
 */
export const getTabIdFromHash = (hash) => {
    if (!hash) return 'details';

    // Parse hash like '#participant/summary' or '#participantDetails/summary'
    const parts = hash.split('/');
    if (parts.length > 1) {
        const tabId = parts[1];
        // Verify it's a valid tab ID AND user has access to it
        const visibleTabs = getVisibleTabs();
        const visibleTabIds = visibleTabs.map(tab => tab.id);
        return visibleTabIds.includes(tabId) ? tabId : 'details';
    }

    return 'details';
};

/**
 * Update URL hash to reflect the active tab
 * @param {string} tabId - The tab ID
 * @param {boolean} updateHistory - Whether to update browser history (default: true)
 * @returns {void}
 */
export const updateHashForTab = (tabId, updateHistory = true) => {
    const newHash = `#participantDetails/${tabId}`;
    updateHistory
        ? window.location.hash = newHash
        : window.history.replaceState(null, null, newHash);
};

/**
 * Programmatically activate a tab
 * @param {string} tabId - The tab ID to activate
 * @returns {void}
 */
export const activateTab = (tabId) => {
    const tabLink = document.querySelector(`#${tabId}-tab`);
    if (!tabLink) return;

    const navList = tabLink.closest('.participant-tabs');
    const tabLinks = navList
        ? navList.querySelectorAll('.nav-link')
        : document.querySelectorAll('.participant-tabs .nav-link');
    tabLinks.forEach(link => {
        link.classList.remove('active');
        link.setAttribute('aria-selected', 'false');
    });
    tabLink.classList.add('active');
    tabLink.setAttribute('aria-selected', 'true');

    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('show', 'active');
    });
    const tabPane = document.getElementById(`${tabId}-content`);
    if (tabPane) {
        tabPane.classList.add('show', 'active');
    }
};
