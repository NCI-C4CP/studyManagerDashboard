import { expect } from 'chai';
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
            expect(html).to.include('No participant data available');
        });

        it('renders tool selection menu', () => {
            const participant = createMockParticipant();
            const html = renderDataCorrectionsTabContent(participant);
            
            expect(html).to.include('Data Corrections Tool');
            expect(html).to.include('data-corrections-selection-tabs');
            expect(html).to.include('Verification Corrections');
            expect(html).to.include('Survey Status Reset');
            expect(html).to.include('Incentive Eligibility');
        });
    });

    describe('Interaction', () => {
        it('navigates to correct tool hash', async () => {
            const participant = createMockParticipant();
            setupDataCorrectionsSelectionToolPage(participant);
            await waitForAsyncTasks();

            const surveyLink = document.querySelector('a[href="#participantDetails/dataCorrections/surveyResetTool"]');
            surveyLink.click();

            expect(window.location.hash).to.equal('#participantDetails/dataCorrections/surveyResetTool');
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
            expect(navbars.length).to.equal(1);
            expect(main.textContent).to.include('Please select the tool you would like to use');
            expect(main.textContent).to.include('Data Corrections Tool');
            expect(toolContainer.innerHTML).to.include('Verification Status');
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
            expect(activeLink).to.exist;
            expect(activeLink.id).to.equal('incentiveEligibilityTool');

            window.location.hash = '#participantDetails/dataCorrections/surveyResetTool';
            setActiveDataCorrectionsTab();
            const activeLinks = Array.from(document.querySelectorAll('.dataCorrectionLink.active'));
            expect(activeLinks).to.have.length(1);
            expect(activeLinks[0].id).to.equal('surveyResetTool');
        });
    });
});
