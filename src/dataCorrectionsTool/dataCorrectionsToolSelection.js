import { updateNavBar } from '../navigationBar.js';
import { renderParticipantHeader } from '../participantHeader.js';
import { dataCorrectionsHeaderNote, displayDataCorrectionsNavbar, setActiveDataCorrectionsTab } from './dataCorrectionsHelpers.js';

export const setupDataCorrectionsSelectionToolPage = (participant, { containerId = 'dataCorrectionsToolContainer', withChrome = false } = {}) => {
    if (participant !== undefined) {
        updateNavBar('participantVerificationBtn');
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.getElementById('mainContent');
        }
        if (!container) return;
        container.innerHTML = renderDataCorrectionsTabContent(participant);
        setActiveDataCorrectionsTab();
    }
}

/**
 * Render data corrections tool content for use in a tab
 * @param {object} participant - The participant object
 * @returns {string} HTML string for data corrections tab content
 */
export const renderDataCorrectionsTabContent = (participant) => {
    if (!participant) {
        return '<div class="alert alert-warning">No participant data available</div>';
    }

    const content = `
        <div>
            ${renderParticipantHeader(participant)}
            ${dataCorrectionsHeaderNote()}
            <div class="row mt-3">
                <div class="col">
                    <p class="font-weight-bold" style="font-size:1.2rem;"> Please select the tool you would like to use: </p>
                    ${displayDataCorrectionsNavbar()}
                </div>
            </div>
            <div id="dataCorrectionsToolContainer"></div>
        </div>
    `;

    // Schedule event handlers to run after DOM is updated
    if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
            if (typeof document === 'undefined') return;
            setupSelectionTabLinks();
            setActiveDataCorrectionsTab();
        });
    }

    return content;
};

const setupContinueNavigationHandler = () => {
    const continueBtn = document.querySelector('.continueButton');
    const selectButton = document.querySelector('.selectButton');
    if (!continueBtn || !selectButton) return;
    
    continueBtn.addEventListener('click', () => {
        const selectedButtonType = selectButton.getAttribute('data-tool');
        if (!selectedButtonType) return;

        if (selectedButtonType === 'verificationCorrections') {
            window.location.hash = '#participantDetails/dataCorrections/verificationCorrectionsTool';
        } else if (selectedButtonType === 'surveyReset') {
            window.location.hash = '#participantDetails/dataCorrections/surveyResetTool';
        } else if (selectedButtonType === 'incentiveEligibility') {
            window.location.hash = '#participantDetails/dataCorrections/incentiveEligibilityTool';
        }
    });
}

const setupSelectionTabLinks = () => {
    if (typeof document === 'undefined') return;
    const links = document.querySelectorAll('.data-corrections-selection-tabs a');
    if (!links || links.length === 0) return;
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetHash = link.getAttribute('href');
            if (targetHash) {
                window.location.hash = targetHash;
            }
        });
    });
};

/**
 * Render a specific data corrections tool inside the tabbed experience.
 * @param {string} toolId - Tool identifier (e.g., 'verificationCorrectionsTool')
 * @param {object} participant - The participant object
 * @param {string} containerId - Target container ID
 */
export const renderDataCorrectionsToolInTab = async (toolId, participant, containerId = 'dataCorrectionsToolContainer') => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const commonOptions = { containerId, skipNavBarUpdate: true };

    if (toolId === 'verificationCorrectionsTool') {
        const module = await import('./verificationCorrectionsTool.js');
        const setupVerificationCorrectionsPage = module?.setupVerificationCorrectionsPage || module?.default?.setupVerificationCorrectionsPage;
        return setupVerificationCorrectionsPage?.(participant, commonOptions);
    }
    if (toolId === 'surveyResetTool') {
        const module = await import('./surveyResetTool.js');
        const setupSurveyResetToolPage = module?.setupSurveyResetToolPage || module?.default?.setupSurveyResetToolPage;
        return setupSurveyResetToolPage?.(participant, commonOptions);
    }
    if (toolId === 'incentiveEligibilityTool') {
        const module = await import('./incentiveEligibilityTool.js');
        const setupIncentiveEligibilityToolPage = module?.setupIncentiveEligibilityToolPage || module?.default?.setupIncentiveEligibilityToolPage;
        return setupIncentiveEligibilityToolPage?.(participant, commonOptions);
    }

    container.innerHTML = `<div class="alert alert-warning">Unknown data corrections tool.</div>`;
};
