import { expect } from 'chai';
import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';
import { renderKitRequest, renderKitRequestTabContent, requestKit } from '../src/requestHomeCollectionKit.js';
import { baseAPI } from '../src/utils.js';
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
            expect(html).to.include('No participant data available');
        });

        it('blocks request if address is PO Box', () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.address1]: 'P.O. Box 123',
                [fieldMapping.isPOBox]: fieldMapping.yes
            });
            const html = renderKitRequestTabContent(participant);
            expect(html).to.include('Participant address is invalid');
            expect(html).to.not.include('Request Initial Kit</button>'); // Button disabled or not present
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
            expect(html).to.include('Participant has withdrawn');
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
            expect(html).to.include('Request Initial Kit');
            expect(html).to.not.include('disabled');
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
            expect(html).to.include('Request Replacement');
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

            expect(capturedUrl).to.include(`${baseAPI}/dashboard?api=requestHomeKit`);
            expect(capturedBody.connectId).to.equal(connectId);
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

            // Stub navbar update to avoid DOM dependency
            const navBarModule = await import('../src/navigationBar.js');
            navBarModule.updateNavBar = () => {};

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
            expect(requestBtn).to.exist;
            requestBtn.click();

            await waitForAsyncTasks();

            const modal = document.getElementById('modalSuccess');
            expect(modal.classList.contains('show') || modal.style.display === 'block').to.be.true;
            expect(document.getElementById('modalHeader').textContent).to.include('Success');
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

            // Stub navbar update to avoid DOM dependency
            const navBarModule = await import('../src/navigationBar.js');
            navBarModule.updateNavBar = () => {};

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
            expect(requestCount).to.equal(1);
            expect(currentParticipant.token).to.equal(participant.token);
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
            expect(checkbox).to.exist;
            expect(button.disabled).to.equal(true);

            checkbox.click();
            await waitForAsyncTasks();
            expect(button.disabled).to.equal(false);
        });
    });
});
