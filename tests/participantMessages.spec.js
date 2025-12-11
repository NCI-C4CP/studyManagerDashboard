import { expect } from 'chai';
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
            expect(html).to.include('No participant data available');
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
            expect(html).to.include('No Messages');
            expect(html).to.include('Participant Messages');
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
            expect(html).to.include('Email (Welcome to Connect)');
            expect(html).to.include('Hello World');
            expect(html).to.include('Attempt: 1');
            expect(html).to.include('Category: Welcome');
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
            expect(html).to.include('SMS Message');
            expect(html).to.include('Please complete your survey');
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
            expect(html).to.include('<p>Content</p>');
            expect(html).to.not.include('<style>');
            expect(html).to.not.include('color: red');
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

            expect(capturedUrl).to.include(`${baseAPI}/dashboard?api=getParticipantNotification`);
            expect(capturedUrl).to.include(`token=${token}`);
            expect(capturedHeaders.Authorization).to.equal('Bearer ' + idToken);
        });
    });
});
