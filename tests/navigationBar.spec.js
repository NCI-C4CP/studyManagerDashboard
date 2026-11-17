import { setupTestEnvironment, teardownTestEnvironment, installFirebaseStub } from './helpers.js';

describe('navigationBar', () => {
    let renderNavBarLinks;
    let dashboardNavBarLinks;
    let roleState;

    const loadModule = async () => {
        if (renderNavBarLinks && dashboardNavBarLinks && roleState) return;
        const module = await import('../src/navigationBar.js');
        const stateModule = await import('../src/stateManager.js');
        const nav = module?.default ?? module;
        const state = stateModule?.default ?? stateModule;
        renderNavBarLinks = nav.renderNavBarLinks;
        dashboardNavBarLinks = nav.dashboardNavBarLinks;
        roleState = state.roleState;
    };

    beforeEach(async () => {
        setupTestEnvironment();
        // Install Firebase stub as stateManager/crypto likely depends on it
        installFirebaseStub({ uid: 'test-user' });
        await loadModule();
        roleState.clear();
    });

    afterEach(() => {
        teardownTestEnvironment();
    });

    describe('renderNavBarLinks', () => {
        it('returns basic home link', () => {
            const html = renderNavBarLinks();
            expect(html).toContain('href="#"');
            expect(html).toContain('Home');
        });
    });

    describe('dashboardNavBarLinks', () => {
        it('renders standard links and hides restricted links for regular users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const html = dashboardNavBarLinks();
            
            expect(html).toContain('href="#home"');
            expect(html).toContain('href="#participants/all"');
            expect(html).toContain('href="#participantLookup"');
            expect(html).toContain('href="#logout"');
            expect(html).toContain('href="#ehrUpload"');
            expect(html).toContain('<div class="w-100 d-none d-lg-block"></div>');
            expect(html).not.toContain('href="#requestAKitConditions"');
            expect(html).not.toContain('id="notifications"');
        });

        it('shows Kit Eligibility, Notifications, and API Key Generator for coordinating center', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: true });
            const html = dashboardNavBarLinks();
            expect(html).toContain('href="#requestAKitConditions"');
            expect(html).toContain('id="notifications"');
            expect(html).toContain('href="#generateServiceAccountKey"');
        });

        it('shows Site Messages and API Key Generator for site managers', async () => {
            await roleState.setRoleFlags({ isSiteManager: true });
            const html = dashboardNavBarLinks();
            expect(html).toContain('href="#siteMessages"');
            expect(html).toContain('href="#generateServiceAccountKey"');
            expect(html).toContain('API Key Generator');
        });

        it('hides Site Messages, EHR Upload, and API Key Generator for help desk', async () => {
            await roleState.setRoleFlags({ isSiteManager: false, helpDesk: true });
            const html = dashboardNavBarLinks();
            expect(html).not.toContain('href="#siteMessages"');
            expect(html).not.toContain('href="#ehrUpload"');
            expect(html).not.toContain('href="#generateServiceAccountKey"');
        });

        it('renders EHR uploader links and hides unrelated tools', async () => {
            await roleState.setRoleFlags({ isSiteManager: false, isEHRUploader: true });
            const html = dashboardNavBarLinks();
            expect(html).toContain('href="#home"');
            expect(html).toContain('href="#ehrUpload"');
            expect(html).toContain('href="#logout"');
            expect(html).not.toContain('href="#requestAKitConditions"');
            expect(html).not.toContain('href="#siteMessages"');
            expect(html).not.toContain('id="notifications"');
            expect(html).not.toContain('href="#generateServiceAccountKey"');
        });

        it('shows only home, API Key Generator, and logout for delegated site users', async () => {
            await roleState.setRoleFlags({ isSiteManager: false, isEHRUploader: false, helpDesk: false, coordinatingCenter: false, isDelegatedSiteUser: true });
            const html = dashboardNavBarLinks();
            expect(html).toContain('href="#home"');
            expect(html).toContain('href="#generateServiceAccountKey"');
            expect(html).toContain('href="#logout"');
            expect(html).not.toContain('href="#participantLookup"');
            expect(html).not.toContain('href="#participants/all"');
            expect(html).not.toContain('href="#ehrUpload"');
            expect(html).not.toContain('href="#siteMessages"');
            expect(html).not.toContain('id="notifications"');
        });
    });
});
