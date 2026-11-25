import { setupTestSuite, mockApi, jsonResponse } from './helpers.js';
import { renderRequestAKitConditions, processRequestAKitConditions, storeRequestAKitConditions } from '../src/requestAKitConditions.js';

describe('requestAKitConditions', () => {
    let cleanup;

    beforeEach(async () => {
        const suite = await setupTestSuite();
        cleanup = suite.cleanup;

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
            mockApi({
                'GET https://raw.githubusercontent.com/episphere/conceptGithubActions/master/jsons/varToConcept.json': jsonResponse({ Key1: '123456789' }),
                'GET retrieveRequestAKitConditions': jsonResponse({
                    data: { conditions: '[]', sorts: '[]', limit: 10 },
                }),
            });

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
            const fetchMock = mockApi({
                'GET processRequestAKitConditions': jsonResponse({ success: true }),
            });

            await processRequestAKitConditions(false);
            expect(fetchMock.mock.lastCall[0]).toContain('api=processRequestAKitConditions&updateDb=false');
        });

        it('calls processing API correctly for live run', async () => {
            const fetchMock = mockApi({
                'GET processRequestAKitConditions': jsonResponse({ success: true }),
            });

            await processRequestAKitConditions(true);
            expect(fetchMock.mock.lastCall[0]).toContain('api=processRequestAKitConditions&updateDb=true');
        });
    });

    describe('storeRequestAKitConditions', () => {
        it('sends schema to API', async () => {
            const schema = { limit: 100, conditions: "[]" };
            const fetchMock = mockApi({
                'POST updateRequestAKitConditions': jsonResponse({ code: 200 }),
            });

            await storeRequestAKitConditions(schema);
            const [url, options] = fetchMock.mock.lastCall;
            expect(url).toContain('api=updateRequestAKitConditions');
            expect(JSON.parse(options.body).data).toEqual(schema);
        });
    });
});
