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
        it('returns standard links for all users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const html = dashboardNavBarLinks();
            
            expect(html).toContain('href="#home"');
            expect(html).toContain('href="#participants/all"');
            expect(html).toContain('href="#participantLookup"');
            expect(html).toContain('href="#logout"');
        });

        it('includes the responsive spacer div', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const html = dashboardNavBarLinks();
            expect(html).toContain('<div class="w-100 d-none d-lg-block"></div>');
        });

        it('shows Kit Eligibility for coordinating center', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: true });
            const html = dashboardNavBarLinks();
            expect(html).toContain('href="#requestAKitConditions"');
        });

        it('hides Kit Eligibility for regular users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const html = dashboardNavBarLinks();
            expect(html).not.toContain('href="#requestAKitConditions"');
        });

        it('shows Site Messages for site managers', async () => {
            await roleState.setRoleFlags({ isSiteManager: true });
            const html = dashboardNavBarLinks();
            expect(html).toContain('href="#siteMessages"');
        });

        it('hides Site Messages for help desk', async () => {
            await roleState.setRoleFlags({ isSiteManager: false, helpDesk: true });
            const html = dashboardNavBarLinks();
            expect(html).not.toContain('href="#siteMessages"');
        });

        it('check links for EHR uploader', async () => {
            await roleState.setRoleFlags({ isSiteManager: false, isEHRUploader: true });
            const html = dashboardNavBarLinks();
            expect(html).toContain('href="#home"');
            expect(html).toContain('href="#ehrUpload"');
            expect(html).toContain('href="#logout"');
            expect(html).not.toContain('href="#requestAKitConditions"');
            expect(html).not.toContain('href="#siteMessages"');
            expect(html).not.toContain('id="notifications"');
        });

        it('shows EHR Upload for regular users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false, isEHRUploader: false });
            const html = dashboardNavBarLinks();
            expect(html).toContain('href="#ehrUpload"');
        });

        it('hides EHR Upload for helpDesk users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false, isEHRUploader: false });
            const html = dashboardNavBarLinks();
            expect(html).not.toContain('href="#ehrUpload"');
        });

        it('shows Notifications for coordinating center', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: true, isEHRUploader: false });
            const html = dashboardNavBarLinks();
            expect(html).toContain('id="notifications"');
        });

        it('hides Notifications for regular users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false, isEHRUploader: false });
            const html = dashboardNavBarLinks();
            expect(html).not.toContain('id="notifications"');
        });
    });
});
