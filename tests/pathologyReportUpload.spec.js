import { setupTestSuite, createMockParticipant, mockApi, jsonResponse } from './helpers.js';
import conceptIds from '../src/fieldToConceptIdMapping.js';
import { renderPathologyTabContent } from '../src/pathologyReportUpload.js';

describe('pathologyReportUpload', () => {
    let cleanup;
    let windowListeners;

    beforeEach(async () => {
        const suite = await setupTestSuite({
            domFixtures: [{ id: 'mainContent' }],
        });
        cleanup = suite.cleanup;
        windowListeners = vi.spyOn(window, 'addEventListener');
    });

    afterEach(() => {
        for (const [type, listener, options] of windowListeners.mock.calls) {
            if (type === 'dragover' || type === 'drop') {
                window.removeEventListener(type, listener, options);
            }
        }
        windowListeners.mockRestore();
        cleanup();
    });

    const mountUpload = async (filenames = []) => {
        mockApi({
            'GET getUploadedPathologyReportNames': () => jsonResponse({ code: 200, data: filenames }),
        });
        const participant = createMockParticipant('test-uid', {
            [conceptIds.verifiedFlag]: conceptIds.verified,
            [conceptIds.consentFlag]: conceptIds.yes,
            [conceptIds.hipaaFlag]: conceptIds.yes,
            [conceptIds.withdrawConsent]: conceptIds.no,
            [conceptIds.revokeHIPAA]: conceptIds.no,
            [conceptIds.destroyData]: conceptIds.no,
            [conceptIds.healthcareProvider]: 125001209,
        });

        // The renderer schedules initialization for after its caller mounts the HTML.
        const frame = vi.spyOn(global, 'requestAnimationFrame').mockImplementationOnce(() => 0);
        try {
            document.getElementById('mainContent').innerHTML = await renderPathologyTabContent(participant);
            const [[initialize]] = frame.mock.calls;
            await initialize();
        } finally {
            frame.mockRestore();
        }
    };

    describe('renderPathologyTabContent', () => {
        it('renders "No participant data" if null', async () => {
            const html = await renderPathologyTabContent(null);
            expect(html).toContain('No participant data available');
        });

        it('blocks access if participant is not verified', async () => {
            const participant = createMockParticipant('test-uid', {
                [conceptIds.verifiedFlag]: conceptIds.notYetVerified
            });
            const html = await renderPathologyTabContent(participant);
            expect(html).toContain('Participant does not meet the criteria');
        });

        it('blocks access if participant withdrew consent', async () => {
            const participant = createMockParticipant('test-uid', {
                [conceptIds.withdrawConsent]: conceptIds.yes
            });
            const html = await renderPathologyTabContent(participant);
            expect(html).toContain('Participant does not meet the criteria');
        });

        it('renders the upload interface and lists existing reports', async () => {
            await mountUpload(['existing-report.pdf']);

            expect(document.getElementById('mainContent').textContent).toContain('Select Pathology Reports');
            expect(document.getElementById('dropBox').textContent).toContain('Drop files here');
            expect(document.getElementById('uploadedFilesNames').textContent).toContain('existing-report.pdf');
            expect(document.getElementById('uploadedFilesWrapper').style.display).not.toBe('none');
        });

        it('clicking "choose your files" opens file picker instead of navigating', async () => {
            await mountUpload();
            const fileInput = document.getElementById('fileInput');
            const openPicker = vi.spyOn(fileInput, 'click').mockImplementation(() => {});

            const link = document.getElementById('selectFilesLink');
            const event = new window.Event('click', { bubbles: true, cancelable: true });
            link.dispatchEvent(event);

            expect(openPicker).toHaveBeenCalledOnce();
            expect(event.defaultPrevented).toBe(true);
        });

        it('dropping files outside the upload area prevents default navigation', async () => {
            await mountUpload();

            const dropEvent = new window.Event('drop', { bubbles: true, cancelable: true });
            window.dispatchEvent(dropEvent);

            expect(dropEvent.defaultPrevented).toBe(true);
        });
    });
});
