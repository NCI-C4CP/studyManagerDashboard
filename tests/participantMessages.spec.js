import { setupTestSuite, createMockParticipant, waitForAsyncTasks } from './helpers.js';
import { renderMessagesTabContent, getParticipantMessage } from '../src/participantMessages.js';
import { baseAPI } from '../src/utils.js';

describe('participantMessages', () => {
    let firebaseStub;
    let cleanup;

    beforeEach(async () => {
        const suite = await setupTestSuite();
        firebaseStub = suite.firebaseStub;
        cleanup = suite.cleanup;
    });

    afterEach(() => {
        cleanup();
    });

    describe('renderMessagesTabContent', () => {
        it('renders "No participant data available" if participant is missing', async () => {
            const html = await renderMessagesTabContent(null);
            expect(html).toContain('No participant data available');
        });

        it('renders "No Messages" when API returns empty list', async () => {
            const participant = createMockParticipant();
            
            // Mock fetch to return empty list
            global.fetch = async (url) => {
                if (url.includes('getParticipantNotification')) {
                    return {
                        ok: true,
                        json: async () => ({ code: 200, data: [] })
                    };
                }
                return { ok: false };
            };

            const html = await renderMessagesTabContent(participant);
            expect(html).toContain('No Messages');
            expect(html).toContain('Participant Messages');
        });

        it('renders email messages correctly', async () => {
            const participant = createMockParticipant();
            const mockMessages = [
                {
                    notificationType: 'email',
                    attempt: 1,
                    category: 'Welcome',
                    notification: {
                        title: 'Welcome to Connect',
                        body: '<p>Hello World</p>',
                        time: '2023-01-01T12:00:00Z'
                    }
                }
            ];

            global.fetch = async (url) => {
                if (url.includes('getParticipantNotification')) {
                    return {
                        ok: true,
                        json: async () => ({ code: 200, data: mockMessages })
                    };
                }
                return { ok: false };
            };

            const html = await renderMessagesTabContent(participant);
            expect(html).toContain('Email (Welcome to Connect)');
            expect(html).toContain('Hello World');
            expect(html).toContain('Attempt: 1');
            expect(html).toContain('Category: Welcome');
        });

        it('renders SMS messages correctly', async () => {
            const participant = createMockParticipant();
            const mockMessages = [
                {
                    notificationType: 'sms',
                    notification: {
                        title: 'SMS Notification', // Ignored for SMS rendering logic
                        body: 'Please complete your survey',
                        time: '2023-01-02T12:00:00Z'
                    }
                }
            ];

            global.fetch = async (url) => {
                if (url.includes('getParticipantNotification')) {
                    return {
                        ok: true,
                        json: async () => ({ code: 200, data: mockMessages })
                    };
                }
                return { ok: false };
            };

            const html = await renderMessagesTabContent(participant);
            expect(html).toContain('SMS Message');
            expect(html).toContain('Please complete your survey');
        });

        it('sanitizes HTML style tags from message body', async () => {
            const participant = createMockParticipant();
            const mockMessages = [
                {
                    notificationType: 'email',
                    notification: {
                        title: 'Style Test',
                        body: '<style>body { color: red; }</style><p>Content</p><style>div { display: none; }</style>',
                        time: '2023-01-01T12:00:00Z'
                    }
                }
            ];

            global.fetch = async (url) => {
                if (url.includes('getParticipantNotification')) {
                    return {
                        ok: true,
                        json: async () => ({ code: 200, data: mockMessages })
                    };
                }
                return { ok: false };
            };

            const html = await renderMessagesTabContent(participant);
            expect(html).toContain('<p>Content</p>');
            expect(html).not.toContain('<style>');
            expect(html).not.toContain('color: red');
        });
    });

    describe('getParticipantMessage', () => {
        it('calls correct API endpoint with token', async () => {
            const token = 'test-token-123';
            const idToken = 'mock-id-token';
            let capturedUrl = '';
            let capturedHeaders = {};

            global.fetch = async (url, options) => {
                capturedUrl = url;
                capturedHeaders = options.headers;
                return {
                    ok: true,
                    json: async () => ({ success: true })
                };
            };

            await getParticipantMessage(token, idToken);

            expect(capturedUrl).toContain(`${baseAPI}/dashboard?api=getParticipantNotification`);
            expect(capturedUrl).toContain(`token=${token}`);
            expect(capturedHeaders.Authorization).toBe('Bearer ' + idToken);
        });
    });
});
