import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { renderKitRequest, renderKitRequestTabContent, requestKit } from '../src/requestHomeCollectionKit.js';
import { baseAPI } from '../src/utils.js';

vi.mock('../src/navigationBar.js', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, updateNavBar: () => {} };
});

import * as stateManagerModule from '../src/stateManager.js';
const stateManager = stateManagerModule?.default ?? stateManagerModule;
const participantState = stateManager.participantState;

describe('requestHomeCollectionKit', () => {
    let cleanup;
    let firebaseStub;

    beforeEach(async () => {
        const suite = await setupTestSuite();
        cleanup = suite.cleanup;
        firebaseStub = suite.firebaseStub;

        // Mock requestAnimationFrame to run immediately
        global.requestAnimationFrame = (callback) => callback();
    });

    afterEach(() => {
        cleanup();
    });

    describe('renderKitRequestTabContent', () => {
        it('renders "No participant data" if null', () => {
            const html = renderKitRequestTabContent(null);
            expect(html).toContain('No participant data available');
        });

        it('blocks request if address is PO Box', () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.address1]: 'P.O. Box 123',
                [fieldMapping.isPOBox]: fieldMapping.yes
            });
            const html = renderKitRequestTabContent(participant);
            expect(html).toContain('Participant address is invalid');
            expect(html).not.toContain('Request Initial Kit</button>'); // Button disabled or not present
        });

        it('blocks request if participant withdrew consent', () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.address1]: '123 Main St',
                [fieldMapping.city]: 'Anytown',
                [fieldMapping.state]: 'NY',
                [fieldMapping.zip]: '12345',
                [fieldMapping.withdrawConsent]: fieldMapping.yes
            });
            const html = renderKitRequestTabContent(participant);
            expect(html).toContain('Participant has withdrawn');
        });

        it('allows initial kit request for eligible participant', () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.address1]: '123 Main St',
                [fieldMapping.city]: 'Anytown',
                [fieldMapping.state]: 'NY',
                [fieldMapping.zip]: '12345'
            });
            // Ensure no previous kits
            const html = renderKitRequestTabContent(participant);
            expect(html).toContain('Request Initial Kit');
            expect(html).not.toContain('disabled');
        });

        it('allows replacement kit request if initial kit shipped', () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.address1]: '123 Main St',
                [fieldMapping.city]: 'Anytown',
                [fieldMapping.state]: 'NY',
                [fieldMapping.zip]: '12345',
                [fieldMapping.collectionDetails]: {
                    [fieldMapping.baseline]: {
                        [fieldMapping.bioKitMouthwash]: {
                            [fieldMapping.kitStatus]: fieldMapping.kitStatusValues.shipped
                        }
                    }
                }
            });
            const html = renderKitRequestTabContent(participant);
            expect(html).toContain('Request Replacement');
        });
    });

    describe('requestKit (API)', () => {
        it('sends request to API', async () => {
            const connectId = 'CONN001';
            let capturedUrl;
            let capturedBody;

            global.fetch = async (url, options) => {
                capturedUrl = url;
                capturedBody = JSON.parse(options.body);
                return {
                    ok: true,
                    json: async () => ({ code: 200 })
                };
            };

            await requestKit(connectId);

            expect(capturedUrl).toContain(`${baseAPI}/dashboard?api=requestHomeKit`);
            expect(capturedBody.connectId).toBe(connectId);
        });
    });

    describe('renderKitRequest interactions', () => {
        it('shows success modal when initial kit request succeeds', async () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.address1]: '123 Main St',
                [fieldMapping.city]: 'Anytown',
                [fieldMapping.state]: 'NY',
                [fieldMapping.zip]: '12345',
                [fieldMapping.physicalAddress1]: '123 Main St'
            });


            // Prepare DOM
            document.body.innerHTML = '<div id="mainContent"></div><div id="navBarLinks"></div>';

            // Mock API calls for kit request and participant reload
            global.fetch = async (url) => {
                if (url.includes('requestHomeKit')) {
                    return { ok: true, json: async () => ({ code: 200 }) };
                }
                if (url.includes('getFilteredParticipants')) {
                    return { ok: true, json: async () => ({ code: 200, data: [participant] }) };
                }
                return { ok: false, json: async () => ({ message: 'unexpected' }) };
            };

            renderKitRequest(participant);
            await waitForAsyncTasks();

            const requestBtn = document.getElementById('requestKitBtn');
            expect(requestBtn).toBeDefined();
            requestBtn.click();

            await waitForAsyncTasks();

            const modal = document.getElementById('modalSuccess');
            expect(modal.classList.contains('show') || modal.style.display === 'block').toBe(true);
            expect(document.getElementById('modalHeader').textContent).toContain('Success');
        });

        it('updates participant state after successful kit request', async () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.address1]: '123 Main St',
                [fieldMapping.city]: 'Anytown',
                [fieldMapping.state]: 'NY',
                [fieldMapping.zip]: '12345',
                [fieldMapping.physicalAddress1]: '123 Main St'
            });

            const updatedParticipant = { 
                ...participant, 
                token: participant.token, // token is persistent
            };


            document.body.innerHTML = '<div id="mainContent"></div><div id="navBarLinks"></div>';

            let requestCount = 0;
            global.fetch = async (url) => {
                if (url.includes('requestHomeKit')) {
                    requestCount += 1;
                    return { ok: true, json: async () => ({ code: 200 }) };
                }
                if (url.includes('getFilteredParticipants')) {
                    return { ok: true, json: async () => ({ code: 200, data: [updatedParticipant] }) };
                }
                return { ok: false, json: async () => ({ message: 'unexpected' }) };
            };

            renderKitRequest(participant);
            await waitForAsyncTasks();

            document.getElementById('requestKitBtn').click();
            await waitForAsyncTasks(500);

            const currentParticipant = participantState.getParticipant();
            expect(requestCount).toBe(1);
            expect(currentParticipant.token).toBe(participant.token);
        });

        it('enables request button when address override is checked', async () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.address1]: '123 Main St',
                [fieldMapping.city]: 'Anytown',
                [fieldMapping.state]: 'NY',
                [fieldMapping.zip]: '12345',
                [fieldMapping.physicalAddress1]: '123 Main St',
                [fieldMapping.collectionDetails]: {
                    [fieldMapping.baseline]: {
                        [fieldMapping.bioKitMouthwash]: {
                            [fieldMapping.kitStatus]: fieldMapping.kitStatusValues.addressUndeliverable,
                        }
                    }
                }
            });

            // Stub navbar update
            const navBarModule = await import('../src/navigationBar.js');
            navBarModule.updateNavBar = () => {};

            document.body.innerHTML = '<div id="mainContent"></div><div id="navBarLinks"></div>';

            renderKitRequest(participant);
            await waitForAsyncTasks();

            const checkbox = document.getElementById('initialOverrideCheckbox');
            const button = document.getElementById('requestKitBtn');
            expect(checkbox).toBeDefined();
            expect(button.disabled).toBe(true);

            checkbox.click();
            await waitForAsyncTasks();
            expect(button.disabled).toBe(false);
        });
    });
});
