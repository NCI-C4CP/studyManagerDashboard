import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import { renderDataCorrectionsTabContent, renderDataCorrectionsToolInTab, setupDataCorrectionsSelectionToolPage } from '../src/dataCorrectionsTool/dataCorrectionsToolSelection.js';
import { setActiveDataCorrectionsTab } from '../src/dataCorrectionsTool/dataCorrectionsHelpers.js';

describe('dataCorrectionsToolSelection', () => {
    let cleanup;

    beforeEach(async () => {
        const suite = await setupTestSuite();
        cleanup = suite.cleanup;

        document.body.innerHTML = `
            <div id="mainContent"></div>
            <div id="navBarLinks"></div>
        `;
    });

    afterEach(() => {
        cleanup();
    });

    describe('renderDataCorrectionsTabContent', () => {
        it('renders warning if no participant data', () => {
            const html = renderDataCorrectionsTabContent(null);
            expect(html).toContain('No participant data available');
        });

        it('renders tool selection menu', () => {
            const participant = createMockParticipant();
            const html = renderDataCorrectionsTabContent(participant);
            
            expect(html).toContain('Data Corrections Tool');
            expect(html).toContain('data-corrections-selection-tabs');
            expect(html).toContain('Verification Corrections');
            expect(html).toContain('Survey Status Reset');
            expect(html).toContain('Incentive Eligibility');
        });
    });

    describe('Interaction', () => {
        it('navigates to correct tool hash', async () => {
            const participant = createMockParticipant();
            setupDataCorrectionsSelectionToolPage(participant);
            await waitForAsyncTasks();

            const surveyLink = document.querySelector('a[href="#participantDetails/dataCorrections/surveyResetTool"]');
            surveyLink.click();

            expect(window.location.hash).toBe('#participantDetails/dataCorrections/surveyResetTool');
        });
    });

    describe('renderDataCorrectionsToolInTab', () => {
        it('renders a selected tool without removing the surrounding tab content', async () => {
            const participant = createMockParticipant();
            document.body.innerHTML = `<div id="mainContent"></div>`;
            const main = document.getElementById('mainContent');
            main.innerHTML = renderDataCorrectionsTabContent(participant);
            await waitForAsyncTasks();

            window.location.hash = '#participantDetails/dataCorrections/verificationCorrectionsTool';
            await renderDataCorrectionsToolInTab('verificationCorrectionsTool', participant);
            await waitForAsyncTasks();

            const navbars = document.querySelectorAll('.data-corrections-selection-tabs');
            const toolContainer = document.getElementById('dataCorrectionsToolContainer');
            expect(navbars.length).toBe(1);
            expect(main.textContent).toContain('Please select the tool you would like to use');
            expect(main.textContent).toContain('Data Corrections Tool');
            expect(toolContainer.innerHTML).toContain('Verification Status');
        });

        it('ignores hash for tools that are not linked in DOM', async () => {
            const participant = createMockParticipant();
            document.body.innerHTML = `<div id="mainContent"></div>`;
            const main = document.getElementById('mainContent');
            main.innerHTML = `
                <div class="data-corrections-selection-tabs">
                    <ul id="dataCorrectionsTabsGroup">
                        <li><a class="dataCorrectionLink" id="verificationCorrectionsTool" href="#participantDetails/dataCorrections/verificationCorrectionsTool">Verification Corrections</a></li>
                    </ul>
                </div>
                <div id="dataCorrectionsToolContainer"></div>
            `;
            await waitForAsyncTasks();

            window.location.hash = '#participantDetails/dataCorrections/surveyResetTool';
            await renderDataCorrectionsToolInTab('surveyResetTool', participant);
            await waitForAsyncTasks();

            const activeLink = document.querySelector('.dataCorrectionLink.active');
            expect(activeLink).toBeNull();
        });
    });

    describe('setActiveDataCorrectionsTab', () => {
        it('marks the selected tool tab as active when the hash changes', async () => {
            const participant = createMockParticipant();
            document.body.innerHTML = `<div id="mainContent"></div>`;
            document.getElementById('mainContent').innerHTML = renderDataCorrectionsTabContent(participant);
            await waitForAsyncTasks();

            window.location.hash = '#participantDetails/dataCorrections/incentiveEligibilityTool';
            setActiveDataCorrectionsTab();
            let activeLink = document.querySelector('.dataCorrectionLink.active');
            expect(activeLink).toBeDefined();
            expect(activeLink.id).toBe('incentiveEligibilityTool');

            window.location.hash = '#participantDetails/dataCorrections/surveyResetTool';
            setActiveDataCorrectionsTab();
            const activeLinks = Array.from(document.querySelectorAll('.dataCorrectionLink.active'));
            expect(activeLinks).toHaveLength(1);
            expect(activeLinks[0].id).toBe('surveyResetTool');
        });
    });
});
