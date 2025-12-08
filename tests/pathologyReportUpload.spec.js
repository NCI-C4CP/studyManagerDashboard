import { expect } from 'chai';
import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import conceptIds from '../src/fieldToConceptIdMapping.js';
import { renderPathologyTabContent } from '../src/pathologyReportUpload.js';
import { baseAPI } from '../src/utils.js';

describe('pathologyReportUpload', () => {
    let cleanup;
    let firebaseStub;

    beforeEach(async () => {
        const suite = await setupTestSuite();
        cleanup = suite.cleanup;
        firebaseStub = suite.firebaseStub;

        // Mock jQuery modal
        window.$ = () => ({
            modal: () => {}
        });
    });

    afterEach(() => {
        cleanup();
        if (typeof window !== 'undefined') {
            delete window.$;
        }
    });

    describe('renderPathologyTabContent', () => {
        it('renders "No participant data" if null', async () => {
            const html = await renderPathologyTabContent(null);
            expect(html).to.include('No participant data available');
        });

        it('blocks access if participant is not verified', async () => {
            const participant = createMockParticipant('test-uid', {
                [conceptIds.verifiedFlag]: conceptIds.notYetVerified
            });
            const html = await renderPathologyTabContent(participant);
            expect(html).to.include('Participant does not meet the criteria');
        });

        it('blocks access if participant withdrew consent', async () => {
            const participant = createMockParticipant('test-uid', {
                [conceptIds.withdrawConsent]: conceptIds.yes
            });
            const html = await renderPathologyTabContent(participant);
            expect(html).to.include('Participant does not meet the criteria');
        });

        it('renders upload interface for eligible participant', async () => {
            const participant = createMockParticipant('test-uid', {
                [conceptIds.verifiedFlag]: conceptIds.verified,
                [conceptIds.consentFlag]: conceptIds.yes,
                [conceptIds.hipaaFlag]: conceptIds.yes,
                [conceptIds.withdrawConsent]: conceptIds.no,
                [conceptIds.revokeHIPAA]: conceptIds.no,
                [conceptIds.destroyData]: conceptIds.no,
                [conceptIds.healthcareProvider]: 125001209 // KPCO ID
            });

            // Mock getUploadedPathologyReportNames
            global.fetch = async (url) => {
                if (url.includes('getUploadedPathologyReportNames')) {
                    return {
                        ok: true,
                        json: async () => ({ code: 200, data: [] })
                    };
                }
                return { ok: false };
            };

            const html = await renderPathologyTabContent(participant);
            expect(html).to.include('Select Pathology Reports');
            expect(html).to.include('Drop files here');
        });

        it('clicking "choose your files" opens file picker instead of navigating', async () => {
            const participant = createMockParticipant('test-uid', {
                [conceptIds.verifiedFlag]: conceptIds.verified,
                [conceptIds.consentFlag]: conceptIds.yes,
                [conceptIds.hipaaFlag]: conceptIds.yes,
                [conceptIds.withdrawConsent]: conceptIds.no,
                [conceptIds.revokeHIPAA]: conceptIds.no,
                [conceptIds.destroyData]: conceptIds.no,
                [conceptIds.healthcareProvider]: 125001209
            });

            global.fetch = async (url) => {
                if (url.includes('getUploadedPathologyReportNames')) {
                    return { ok: true, json: async () => ({ code: 200, data: [] }) };
                }
                return { ok: false };
            };

            const html = await renderPathologyTabContent(participant);
            document.body.innerHTML = `<div id="mainContent">${html}</div>`;

            await waitForAsyncTasks();

            const fileInput = document.getElementById('fileInput');
            let clicked = false;
            fileInput.click = () => { clicked = true; };

            const link = document.getElementById('selectFilesLink');
            const event = new window.Event('click', { bubbles: true, cancelable: true });
            link.dispatchEvent(event);

            expect(clicked).to.be.true;
            expect(event.defaultPrevented).to.be.true;
        });

        it('dropping files does not navigate away and prevents default navigation', async () => {
            const participant = createMockParticipant('test-uid', {
                [conceptIds.verifiedFlag]: conceptIds.verified,
                [conceptIds.consentFlag]: conceptIds.yes,
                [conceptIds.hipaaFlag]: conceptIds.yes,
                [conceptIds.withdrawConsent]: conceptIds.no,
                [conceptIds.revokeHIPAA]: conceptIds.no,
                [conceptIds.destroyData]: conceptIds.no,
                [conceptIds.healthcareProvider]: 125001209
            });

            global.fetch = async (url) => {
                if (url.includes('getUploadedPathologyReportNames')) {
                    return { ok: true, json: async () => ({ code: 200, data: [] }) };
                }
                return { ok: false };
            };

            const html = await renderPathologyTabContent(participant);
            document.body.innerHTML = `<div id="mainContent">${html}</div>`;
            await waitForAsyncTasks();

            const dropEvent = new window.Event('drop', { bubbles: true, cancelable: true });
            let prevented = false;
            dropEvent.preventDefault = () => { prevented = true; };
            dropEvent.stopPropagation = () => {};
            dropEvent.dataTransfer = { files: [] };

            window.dispatchEvent(dropEvent);

            expect(prevented).to.be.true;
        });

    });
});
