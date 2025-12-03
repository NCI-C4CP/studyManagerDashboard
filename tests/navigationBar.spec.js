import { expect } from 'chai';
import { setupTestEnvironment, teardownTestEnvironment, installFirebaseStub } from './helpers.js';

describe('navigationBar', () => {
    let renderNavBarLinks;
    let dashboardNavBarLinks;
    let roleState;

    const loadModule = async () => {
        if (renderNavBarLinks && dashboardNavBarLinks && roleState) return;
        const module = await import('../src/navigationBar.js');
        const stateModule = await import('../src/stateManager.js');
        renderNavBarLinks = module.renderNavBarLinks;
        dashboardNavBarLinks = module.dashboardNavBarLinks;
        roleState = stateModule.roleState;
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
            expect(html).to.include('href="#"');
            expect(html).to.include('Home');
        });
    });

    describe('dashboardNavBarLinks', () => {
        it('returns standard links for all users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const html = dashboardNavBarLinks();
            
            expect(html).to.include('href="#home"');
            expect(html).to.include('href="#participants/all"');
            expect(html).to.include('href="#participantLookup"');
            expect(html).to.include('href="#logout"');
        });

        it('includes the responsive spacer div', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const html = dashboardNavBarLinks();
            expect(html).to.include('<div class="w-100 d-none d-lg-block"></div>');
        });

        it('shows Kit Eligibility for coordinating center', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: true });
            const html = dashboardNavBarLinks();
            expect(html).to.include('href="#requestAKitConditions"');
        });

        it('hides Kit Eligibility for regular users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const html = dashboardNavBarLinks();
            expect(html).to.not.include('href="#requestAKitConditions"');
        });

        it('shows Site Messages for coordinating center', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: true });
            const html = dashboardNavBarLinks();
            expect(html).to.include('href="#siteMessages"');
        });

        it('hides Site Messages for parent users', async () => {
            await roleState.setRoleFlags({ isParent: true, helpDesk: false, coordinatingCenter: false });
            const html = dashboardNavBarLinks();
            expect(html).to.not.include('href="#siteMessages"');
        });

        it('shows EHR Upload for regular users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const html = dashboardNavBarLinks();
            expect(html).to.include('href="#ehrUpload"');
        });

        it('hides EHR Upload for helpDesk users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: true, coordinatingCenter: false });
            const html = dashboardNavBarLinks();
            expect(html).to.not.include('href="#ehrUpload"');
        });

        it('shows Notifications for coordinating center', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: true });
            const html = dashboardNavBarLinks();
            expect(html).to.include('id="notifications"');
        });

        it('hides Notifications for regular users', async () => {
            await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
            const html = dashboardNavBarLinks();
            expect(html).to.not.include('id="notifications"');
        });
    });
});
