import { setupTestSuite, createMockParticipant, trackAsyncEventHandlers, mockApi, jsonResponse, expectConsole } from './helpers.js';
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
const searchState = stateManager.searchState;

describe('requestHomeCollectionKit', () => {
    let cleanup;
    let asyncHandlerTracker;

    beforeEach(async () => {
        const suite = await setupTestSuite();
        cleanup = suite.cleanup;
        asyncHandlerTracker = trackAsyncEventHandlers();
    });

    afterEach(async () => {
        try {
            await asyncHandlerTracker?.allSettled();
        } finally {
            asyncHandlerTracker?.restore();
            asyncHandlerTracker = null;
            cleanup?.();
            cleanup = null;
        }
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
            const fetchMock = mockApi({
                'POST requestHomeKit': jsonResponse({ code: 200 }),
            });

            await requestKit(connectId);

            const [url, options] = fetchMock.mock.lastCall;
            expect(url).toContain(`${baseAPI}/dashboard?api=requestHomeKit`);
            expect(JSON.parse(options.body).connectId).toBe(connectId);
        });
    });

    describe('renderKitRequest interactions', () => {
        it('requests an initial kit, refreshes participant state, and shows success', async () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.address1]: '123 Main St',
                [fieldMapping.city]: 'Anytown',
                [fieldMapping.state]: 'NY',
                [fieldMapping.zip]: '12345',
                [fieldMapping.physicalAddress1]: '123 Main St'
            });

            const updatedParticipant = {
                ...participant,
                [fieldMapping.collectionDetails]: {
                    [fieldMapping.baseline]: {
                        [fieldMapping.bioKitMouthwash]: {
                            [fieldMapping.kitStatus]: fieldMapping.kitStatusValues.pending,
                        },
                    },
                },
            };


            document.body.innerHTML = '<div id="mainContent"></div><div id="navBarLinks"></div>';

            const requestKitResponse = vi.fn(() => jsonResponse({ code: 200 }));
            await searchState.setSearchResults({ searchType: 'lookup', token: participant.token }, [participant]);
            mockApi({
                'POST requestHomeKit': requestKitResponse,
                'GET getFilteredParticipants': jsonResponse({ code: 200, data: [updatedParticipant] }),
            });

            renderKitRequest(participant);

            const requestBtn = document.getElementById('requestKitBtn');
            expect(requestBtn).not.toBeNull();
            requestBtn.click();
            await asyncHandlerTracker.allSettled();

            const currentParticipant = participantState.getParticipant();
            expect(requestKitResponse).toHaveBeenCalledOnce();
            expect(currentParticipant).toEqual(updatedParticipant);
            expect(searchState.getSearchResults()).toBeNull();

            const modal = document.getElementById('modalSuccess');
            expect(modal.classList.contains('show') || modal.style.display === 'block').toBe(true);
            expect(document.getElementById('modalHeader').textContent).toContain('Success');
        });

        it.each(['api-error', 'empty', 'multiple'])('preserves the saved kit outcome when the participant lookup returns %s', async (mode) => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.address1]: '123 Main St',
                [fieldMapping.city]: 'Anytown',
                [fieldMapping.state]: 'NY',
                [fieldMapping.zip]: '12345',
                [fieldMapping.physicalAddress1]: '123 Main St',
            });
            await participantState.setParticipant(participant);
            document.body.innerHTML = '<div id="mainContent"></div><div id="navBarLinks"></div>';

            const requestKitResponse = vi.fn(() => jsonResponse({ code: 200 }));
            const otherParticipant = createMockParticipant('other-uid');
            mockApi({
                'POST requestHomeKit': requestKitResponse,
                'GET getFilteredParticipants': jsonResponse(mode === 'api-error'
                    ? { code: 503, message: 'Lookup unavailable' }
                    : { code: 200, data: mode === 'empty' ? [] : [otherParticipant, participant] }),
            });
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
            expectConsole('error', /^err Error:/);

            renderKitRequest(participant);
            document.getElementById('requestKitBtn').click();
            await asyncHandlerTracker.allSettled();

            expect(requestKitResponse).toHaveBeenCalledOnce();
            expect(participantState.getParticipant()).toEqual(participant);
            expect(alertSpy).toHaveBeenCalledExactlyOnceWith(
                'The kit was successfully requested, but refreshing the participant information failed. Participant data displayed may be stale.',
            );
            expect(document.getElementById('modalSuccess').classList.contains('show')).toBe(true);
            expect(document.getElementById('modalHeader').textContent).toContain('Success! Kit requested.');
        });

        it('enables request button when address override is checked', () => {
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

            document.body.innerHTML = '<div id="mainContent"></div><div id="navBarLinks"></div>';

            renderKitRequest(participant);

            const checkbox = document.getElementById('initialOverrideCheckbox');
            const button = document.getElementById('requestKitBtn');
            expect(checkbox).not.toBeNull();
            expect(button.disabled).toBe(true);

            checkbox.click();
            expect(button.disabled).toBe(false);
        });
    });
});
