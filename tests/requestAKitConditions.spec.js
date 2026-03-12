import { setupTestSuite, waitForAsyncTasks } from './helpers.js';
import { renderRequestAKitConditions, processRequestAKitConditions, storeRequestAKitConditions } from '../src/requestAKitConditions.js';
import { baseAPI } from '../src/utils.js';

describe('requestAKitConditions', () => {
    let cleanup;
    let firebaseStub;

    beforeEach(async () => {
        const suite = await setupTestSuite();
        cleanup = suite.cleanup;
        firebaseStub = suite.firebaseStub;

        document.body.innerHTML = `
            <div id="mainContent"></div>
            <div id="navBarLinks"></div>
            <div id="alert_placeholder"></div>
        `;
    });

    afterEach(() => {
        cleanup();
    });

    describe('renderRequestAKitConditions', () => {
        it('renders conditions interface', async () => {
            // Mock fetch for concepts and current kit conditions
            global.fetch = async (url) => {
                if (url.includes('varToConcept.json')) {
                    return {
                        ok: true,
                        json: async () => ({ "Key1": "123456789" })
                    };
                }
                if (url.includes('retrieveRequestAKitConditions')) {
                    return {
                        ok: true,
                        json: async () => ({ 
                            data: { 
                                conditions: '[]',
                                sorts: '[]',
                                limit: 10
                            } 
                        })
                    };
                }
                return { ok: false };
            };

            await renderRequestAKitConditions();
            
            const content = document.getElementById('mainContent').innerHTML;
            expect(content).toContain('Set Kit Eligibility');
            expect(content).toContain('Add Condition');
            expect(content).toContain('Add Sort');
            expect(content).toContain('Save Changes');
        });
    });

    describe('processRequestAKitConditions', () => {
        it('calls processing API correctly for dry run', async () => {
            let capturedUrl;
            
            global.fetch = async (url) => {
                capturedUrl = url;
                return {
                    ok: true,
                    json: async () => ({ success: true })
                };
            };

            await processRequestAKitConditions(false);
            expect(capturedUrl).toContain('api=processRequestAKitConditions&updateDb=false');
        });

        it('calls processing API correctly for live run', async () => {
            let capturedUrl;
            
            global.fetch = async (url) => {
                capturedUrl = url;
                return {
                    ok: true,
                    json: async () => ({ success: true })
                };
            };

            await processRequestAKitConditions(true);
            expect(capturedUrl).toContain('api=processRequestAKitConditions&updateDb=true');
        });
    });

    describe('storeRequestAKitConditions', () => {
        it('sends schema to API', async () => {
            const schema = { limit: 100, conditions: "[]" };
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

            await storeRequestAKitConditions(schema);
            expect(capturedUrl).toContain('api=updateRequestAKitConditions');
            expect(capturedBody.data).toEqual(schema);
        });
    });
});
