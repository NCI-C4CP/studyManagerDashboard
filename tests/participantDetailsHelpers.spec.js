import { expect } from 'chai';
import { setupTestEnvironment, teardownTestEnvironment, createMockParticipant, installFirebaseStub, waitForAsyncTasks } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';

describe('participantDetailsHelpers', () => {
    let module;
    let roleState;
    let appState;

    const loadModule = async () => {
        if (module && roleState && appState) return;
        module = await import('../src/participantDetailsHelpers.js');
        const stateManager = await import('../src/stateManager.js');
        const state = stateManager?.default ?? stateManager;
        const helpersModule = module?.default ?? module;
        module = helpersModule;
        roleState = state.roleState;
        appState = state.appState;
    };

    beforeEach(async () => {
        setupTestEnvironment();
        installFirebaseStub({ uid: 'test-user' });
        await loadModule();
        // Reset role state to default
        await roleState.setRoleFlags({ isParent: false, helpDesk: false, coordinatingCenter: false });
        // Initialize appState with loginMechanism as expected by getImportantRows
        appState.setState({ loginMechanism: { email: true, phone: true } });
    });

    afterEach(() => {
        teardownTestEnvironment();
    });

    describe('formatPhoneNumber', () => {
        it('formats 10 digit number correctly', () => {
            expect(module.formatPhoneNumber('1234567890')).to.equal('(123) 456-7890');
        });

        it('formats 11 digit number starting with 1 correctly', () => {
            expect(module.formatPhoneNumber('11234567890')).to.equal('(123) 456-7890');
        });

        it('returns empty string for empty input', () => {
            expect(module.formatPhoneNumber('')).to.equal('');
            expect(module.formatPhoneNumber(null)).to.equal('');
        });

        it('handles non-numeric input gracefully', () => {
            expect(module.formatPhoneNumber('abc')).to.equal('() -'); // Current implementation behavior
        });
    });

    describe('getImportantRows', () => {
        it('returns expected rows for a standard participant', () => {
            const participant = createMockParticipant();
            const changedOption = {};
            const rows = module.getImportantRows(participant, changedOption);
            
            const lastNameRow = rows.find(r => r.field === fieldMapping.lName);
            expect(lastNameRow).to.exist;
            expect(lastNameRow.editable).to.be.true;
        });

        it('disables editing for data destroyed participants', () => {
            const participant = createMockParticipant();
            participant[fieldMapping.dataDestroyCategorical] = fieldMapping.requestedDataDestroySigned;
            
            // Debugging: Check values
            console.log('Debug Data Destroyed:', {
                catValue: participant[fieldMapping.dataDestroyCategorical],
                expectedValue: fieldMapping.requestedDataDestroySigned,
                isEqual: participant[fieldMapping.dataDestroyCategorical] === fieldMapping.requestedDataDestroySigned
            });
            const rows = module.getImportantRows(participant, {});
            
            const lastNameRow = rows.find(r => r.field === fieldMapping.lName);
            expect(lastNameRow.editable).to.be.false;
        });

        it('disables editing for duplicate participants', () => {
            const participant = createMockParticipant();
            participant[fieldMapping.verifiedFlag] = fieldMapping.duplicate;

            console.log('Debug Duplicate:', {
                verFlag: participant[fieldMapping.verifiedFlag],
                expectedDuplicate: fieldMapping.duplicate,
                isEqual: participant[fieldMapping.verifiedFlag] === fieldMapping.duplicate
            });
            const rows = module.getImportantRows(participant, {});
            
            const lastNameRow = rows.find(r => r.field === fieldMapping.lName);
            expect(lastNameRow.editable).to.be.false;
        });

        it('shows preferred language edit for helpDesk', () => {
            roleState.setRoleFlags({ helpDesk: true });
            const participant = createMockParticipant();
            const rows = module.getImportantRows(participant, {});
            
            const langRow = rows.find(r => r.field === fieldMapping.preferredLanguage);
            expect(langRow.editable).to.be.true;
        });

        it('shows preferred language edit for coordinatingCenter', () => {
            roleState.setRoleFlags({ coordinatingCenter: true });
            const participant = createMockParticipant();
            const rows = module.getImportantRows(participant, {});
            
            const langRow = rows.find(r => r.field === fieldMapping.preferredLanguage);
            expect(langRow.editable).to.be.true;
        });

        it('hides preferred language edit for regular users', () => {
            const participant = createMockParticipant();
            const rows = module.getImportantRows(participant, {});
            
            const langRow = rows.find(r => r.field === fieldMapping.preferredLanguage);
            expect(langRow.editable).to.be.false;
        });

        it('uses the physical address qualifier in the section header only', () => {
            const participant = createMockParticipant();
            const rows = module.getImportantRows(participant, {});

            const headingRow = rows.find(r => r.field === 'Physical Address');
            expect(headingRow).to.exist;
            expect(headingRow.label).to.equal('Physical Address (if different from mailing address)');

            const physicalFields = [
                fieldMapping.physicalAddress1,
                fieldMapping.physicalAddress2,
                fieldMapping.physicalAddress3,
                fieldMapping.physicalCity,
                fieldMapping.physicalState,
                fieldMapping.physicalZip,
                fieldMapping.physicalCountry,
            ];

            physicalFields.forEach((fieldKey) => {
                const row = rows.find(r => r.field === fieldKey);
                expect(row).to.exist;
                expect(row.label).to.not.include('if different from mailing address');
            });
        });
    });

    describe('getModalLabel', () => {
        it('returns readable label for known keys', () => {
            expect(module.getModalLabel('LastName')).to.equal('Last Name');
            expect(module.getModalLabel('Mobilephone')).to.equal('Mobile Phone');
        });

        it('returns key itself if not found in map', () => {
            expect(module.getModalLabel('UnknownKey')).to.equal('UnknownKey');
        });
    });

    describe('updateParticipantAfterFormSave', () => {
        it('merges nested updates and pushes participant to participantState', async () => {
            const participant = createMockParticipant('test-uid', {
                query: { allPhoneNo: ['1111111111'] },
            });
            const changedUserDataForProfile = {
                [fieldMapping.prefName]: 'New Pref',
                'query.allPhoneNo': ['2222222222'],
            };

            const stateManagerModule = await import('../src/stateManager.js');
            const stateManager = stateManagerModule?.default ?? stateManagerModule;
            const originalSetParticipant = stateManager.participantState.setParticipant;
            const calls = [];
            stateManager.participantState.setParticipant = async (p) => {
                calls.push(p);
            };

            try {
                const updated = await module.updateParticipantAfterFormSave(
                    participant,
                    changedUserDataForProfile,
                );

                expect(updated[fieldMapping.prefName]).to.equal('New Pref');
                expect(updated.query.allPhoneNo).to.deep.equal(['2222222222']);
                expect(calls).to.have.lengthOf(1);
                expect(calls[0]).to.deep.equal(updated);
            } finally {
                stateManager.participantState.setParticipant = originalSetParticipant;
            }
        });
    });

    describe('applyUSPSUnvalidatedFlags', () => {
        it('sets mailing USPS unvalidated flag when any mailing address field is changed', () => {
            const changed = { [fieldMapping.address1]: '123 Main St' };
            module.applyUSPSUnvalidatedFlags(changed);
            expect(changed[fieldMapping.isMailingAddressUSPSUnvalidated]).to.equal(fieldMapping.yes);
        });

        it('sets physical USPS unvalidated flag when any physical address field is changed', () => {
            const changed = { [fieldMapping.physicalZip]: '12345' };
            module.applyUSPSUnvalidatedFlags(changed);
            expect(changed[fieldMapping.isPhysicalAddressUSPSUnvalidated]).to.equal(fieldMapping.yes);
        });

        it('sets alternate USPS unvalidated flag when any alternate address field is changed', () => {
            const changed = { [fieldMapping.altCity]: 'Boston' };
            module.applyUSPSUnvalidatedFlags(changed);
            expect(changed[fieldMapping.isAltAddressUSPSUnvalidated]).to.equal(fieldMapping.yes);
        });

        it('does not set any USPS flags when no address fields are changed', () => {
            const changed = { [fieldMapping.prefName]: 'Test' };
            module.applyUSPSUnvalidatedFlags(changed);
            expect(changed).to.not.have.property(fieldMapping.isMailingAddressUSPSUnvalidated);
            expect(changed).to.not.have.property(fieldMapping.isPhysicalAddressUSPSUnvalidated);
            expect(changed).to.not.have.property(fieldMapping.isAltAddressUSPSUnvalidated);
        });
    });

    describe('findChangedUserDataValues', () => {
        it('captures changed profile fields and previous values for history, excluding emails', () => {
            const existingUserData = {
                [fieldMapping.prefName]: 'Old Pref',
                [fieldMapping.email]: 'old@example.com',
                [fieldMapping.cellPhone]: '5551234567',
                [fieldMapping.voicemailMobile]: fieldMapping.yes,
                [fieldMapping.canWeText]: fieldMapping.no,
            };
            const newUserData = {
                [fieldMapping.prefName]: 'New Pref',
                [fieldMapping.email]: 'new@example.com',
                [fieldMapping.cellPhone]: '5550000000',
            };

            const { changedUserDataForProfile, changedUserDataForHistory } =
                module.findChangedUserDataValues(newUserData, existingUserData);

            expect(changedUserDataForProfile[fieldMapping.prefName]).to.equal('New Pref');
            expect(changedUserDataForProfile[fieldMapping.email]).to.equal('new@example.com');
            expect(changedUserDataForProfile[fieldMapping.cellPhone]).to.equal('5550000000');
            expect(changedUserDataForHistory[fieldMapping.prefName]).to.equal('Old Pref');
            expect(changedUserDataForHistory[fieldMapping.cellPhone]).to.equal('5551234567');
            expect(changedUserDataForHistory[fieldMapping.voicemailMobile]).to.equal(fieldMapping.yes);
            expect(changedUserDataForHistory[fieldMapping.canWeText]).to.equal(fieldMapping.no);
            expect(changedUserDataForHistory).to.not.have.property(fieldMapping.email);
        });

        it('sets voicemail and text preferences to "no" when a cell phone is removed', () => {
            const existingUserData = {
                [fieldMapping.cellPhone]: '5551234567',
                [fieldMapping.voicemailMobile]: fieldMapping.yes,
                [fieldMapping.canWeText]: fieldMapping.yes,
            };
            const newUserData = {
                [fieldMapping.cellPhone]: '',
            };

            const { changedUserDataForProfile, changedUserDataForHistory } =
                module.findChangedUserDataValues(newUserData, existingUserData);

            expect(changedUserDataForProfile[fieldMapping.cellPhone]).to.equal('');
            expect(changedUserDataForProfile[fieldMapping.voicemailMobile]).to.equal(fieldMapping.no);
            expect(changedUserDataForProfile[fieldMapping.canWeText]).to.equal(fieldMapping.no);
            expect(changedUserDataForHistory[fieldMapping.voicemailMobile]).to.equal(fieldMapping.yes);
            expect(changedUserDataForHistory[fieldMapping.canWeText]).to.equal(fieldMapping.yes);
        });

        it('normalizes empty suffix values to "none of these apply"', () => {
            const existingUserData = {
                [fieldMapping.suffix]: fieldMapping.jr,
            };
            const newUserData = {
                [fieldMapping.suffix]: '',
            };

            const { changedUserDataForProfile } =
                module.findChangedUserDataValues(newUserData, existingUserData);

            expect(changedUserDataForProfile[fieldMapping.suffix]).to.equal(fieldMapping.noneOfTheseApply);
        });
    });

    describe('updateUserHistory', () => {
        it('appends a history entry with timestamp and requester', () => {
            const existingHistory = [{
                [fieldMapping.fName]: 'Sam',
                [fieldMapping.userProfileUpdateTimestamp]: '2020-01-01T00:00:00.000Z',
                [fieldMapping.profileChangeRequestedBy]: 'existing@example.com',
            }];
            const existingDataToUpdate = {
                [fieldMapping.prefName]: 'Old Pref',
                [fieldMapping.cellPhone]: '5551234567',
                [fieldMapping.voicemailMobile]: fieldMapping.no,
                [fieldMapping.canWeText]: fieldMapping.yes,
            };

            const history = module.updateUserHistory(
                existingDataToUpdate,
                existingHistory,
                'admin@example.com',
            );

            expect(history).to.have.lengthOf(2);
            expect(history[0]).to.deep.equal(existingHistory[0]);

            const entry = history[1];
            expect(entry[fieldMapping.prefName]).to.equal('Old Pref');
            expect(entry[fieldMapping.cellPhone]).to.equal('5551234567');
            expect(entry[fieldMapping.voicemailMobile]).to.equal(fieldMapping.no);
            expect(entry[fieldMapping.canWeText]).to.equal(fieldMapping.yes);
            expect(entry[fieldMapping.profileChangeRequestedBy]).to.equal('admin@example.com');
            expect(Number.isNaN(Date.parse(entry[fieldMapping.userProfileUpdateTimestamp]))).to.equal(false);
        });

        it('omits email fields and null values from history entries', () => {
            const existingDataToUpdate = {
                [fieldMapping.email]: 'old@example.com',
                [fieldMapping.lName]: 'Doe',
                [fieldMapping.prefName]: null,
            };

            const history = module.updateUserHistory(
                existingDataToUpdate,
                [],
                'admin@example.com',
            );

            expect(history).to.have.lengthOf(1);
            const entry = history[0];
            expect(entry[fieldMapping.lName]).to.equal('Doe');
            expect(entry).to.not.have.property(fieldMapping.email);
            expect(entry).to.not.have.property(fieldMapping.prefName);
        });

        it('adds a default suffix entry when new suffix is provided without an existing suffix', () => {
            const existingDataToUpdate = {
                [fieldMapping.fName]: 'John',
            };

            const history = module.updateUserHistory(
                existingDataToUpdate,
                [],
                'admin@example.com',
                fieldMapping.jr,
            );

            expect(history).to.have.lengthOf(1);
            expect(history[0][fieldMapping.suffix]).to.equal(fieldMapping.noneOfTheseApply);
        });

        it('returns existing history unchanged when there are no tracked history fields', () => {
            const existingHistory = [{
                [fieldMapping.lName]: 'Smith',
                [fieldMapping.userProfileUpdateTimestamp]: '2022-04-01T12:00:00.000Z',
                [fieldMapping.profileChangeRequestedBy]: 'existing@example.com',
            }];

            const history = module.updateUserHistory(
                {},
                existingHistory,
                'admin@example.com',
            );

            expect(history).to.have.lengthOf(1);
            expect(history[0]).to.deep.equal(existingHistory[0]);
        });

        it('preserves empty string address fields in history entries', () => {
            const existingDataToUpdate = {
                [fieldMapping.physicalAddress1]: '',
                [fieldMapping.altCity]: '',
                [fieldMapping.fName]: 'John',
            };

            const history = module.updateUserHistory(
                existingDataToUpdate,
                [],
                'admin@example.com',
            );

            expect(history).to.have.lengthOf(1);
            const entry = history[0];
            expect(entry[fieldMapping.physicalAddress1]).to.equal('');
            expect(entry[fieldMapping.altCity]).to.equal('');
        });
    });

    describe('profile update integration', () => {
        const setupSubmitDom = () => {
            document.body.innerHTML = `
                <div id="mainContent"></div>
                <button class="updateMemberData" id="updateMemberData">Save</button>
            `;
        };

        it('writes history entries in the update payload for verified participants', async () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.cellPhone]: '5551234567',
                [fieldMapping.voicemailMobile]: fieldMapping.no,
                [fieldMapping.canWeText]: fieldMapping.yes,
                [fieldMapping.consentFlag]: fieldMapping.yes,
                [fieldMapping.userProfileHistory]: [{
                    [fieldMapping.fName]: 'Existing',
                    [fieldMapping.userProfileUpdateTimestamp]: '2020-01-01T00:00:00.000Z',
                    [fieldMapping.profileChangeRequestedBy]: 'existing@example.com',
                }],
            });
            participant[fieldMapping.verifiedFlag] = fieldMapping.verified;

            const stateManagerModule = await import('../src/stateManager.js');
            const stateManager = stateManagerModule?.default ?? stateManagerModule;
            stateManager.userSession.setUser({ email: 'admin@example.com' });

            setupSubmitDom();

            const originalFetch = global.fetch;
            const payloads = [];
            global.fetch = async (url, options) => {
                payloads.push(JSON.parse(options.body));
                return { ok: true, json: async () => ({}) };
            };

            try {
                const changedOption = { [fieldMapping.cellPhone]: '5550000000' };
                await module.submitClickHandler(participant, changedOption);
                document.getElementById('updateMemberData').click();
                await waitForAsyncTasks(50);

                expect(payloads).to.have.length.greaterThan(0);
                const payload = payloads[payloads.length - 1];
                const history = payload[fieldMapping.userProfileHistory];
                expect(history).to.have.lengthOf(2);
                const latestEntry = history[1];
                expect(latestEntry[fieldMapping.cellPhone]).to.equal('5551234567');
                expect(latestEntry[fieldMapping.profileChangeRequestedBy]).to.equal('admin@example.com');
                expect(Number.isNaN(Date.parse(latestEntry[fieldMapping.userProfileUpdateTimestamp]))).to.equal(false);
            } finally {
                global.fetch = originalFetch;
            }
        });

        it('skips history updates for non-verified participants', async () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.cellPhone]: '5551234567',
                [fieldMapping.consentFlag]: fieldMapping.yes,
            });
            participant[fieldMapping.verifiedFlag] = fieldMapping.cannotBeVerified;

            const stateManagerModule = await import('../src/stateManager.js');
            const stateManager = stateManagerModule?.default ?? stateManagerModule;
            stateManager.userSession.setUser({ email: 'admin@example.com' });

            setupSubmitDom();

            const originalFetch = global.fetch;
            const payloads = [];
            global.fetch = async (url, options) => {
                payloads.push(JSON.parse(options.body));
                return { ok: true, json: async () => ({}) };
            };

            try {
                const changedOption = { [fieldMapping.cellPhone]: '5550000000' };
                await module.submitClickHandler(participant, changedOption);
                document.getElementById('updateMemberData').click();
                await waitForAsyncTasks(50);

                expect(payloads).to.have.length.greaterThan(0);
                const payload = payloads[payloads.length - 1];
                expect(payload).to.not.have.property(fieldMapping.userProfileHistory);
            } finally {
                global.fetch = originalFetch;
            }
        });

        it('syncs query.allPhoneNo when primary phone values change', async () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.cellPhone]: '5551234567',
                [fieldMapping.homePhone]: '1 (222) 333-4444',
                [fieldMapping.consentFlag]: fieldMapping.yes,
                query: { allPhoneNo: ['5551234567', '2223334444'] },
            });
            participant[fieldMapping.verifiedFlag] = fieldMapping.verified;

            const stateManagerModule = await import('../src/stateManager.js');
            const stateManager = stateManagerModule?.default ?? stateManagerModule;
            stateManager.userSession.setUser({ email: 'admin@example.com' });

            setupSubmitDom();

            const originalFetch = global.fetch;
            const payloads = [];
            global.fetch = async (url, options) => {
                payloads.push(JSON.parse(options.body));
                return { ok: true, json: async () => ({}) };
            };

            try {
                const changedOption = { [fieldMapping.cellPhone]: '5550000000' };
                await module.submitClickHandler(participant, changedOption);
                document.getElementById('updateMemberData').click();
                await waitForAsyncTasks(50);

                const payload = payloads[payloads.length - 1];
                expect(payload['query.allPhoneNo']).to.deep.equal(['5550000000', '2223334444']);
            } finally {
                global.fetch = originalFetch;
            }
        });

        it('syncs query.allEmails while excluding noreply addresses', async () => {
            const participant = createMockParticipant('test-uid', {
                [fieldMapping.accountEmail]: 'old@example.com',
                [fieldMapping.prefEmail]: 'noreply@invalid.com',
                [fieldMapping.email1]: 'SECOND@EXAMPLE.COM',
                [fieldMapping.consentFlag]: fieldMapping.yes,
                query: { allEmails: ['old@example.com'] },
            });
            participant[fieldMapping.verifiedFlag] = fieldMapping.verified;

            const stateManagerModule = await import('../src/stateManager.js');
            const stateManager = stateManagerModule?.default ?? stateManagerModule;
            stateManager.userSession.setUser({ email: 'admin@example.com' });

            setupSubmitDom();

            const originalFetch = global.fetch;
            const payloads = [];
            global.fetch = async (url, options) => {
                payloads.push(JSON.parse(options.body));
                return { ok: true, json: async () => ({}) };
            };

            try {
                const changedOption = { [fieldMapping.accountEmail]: 'New@Example.com' };
                await module.submitClickHandler(participant, changedOption);
                document.getElementById('updateMemberData').click();
                await waitForAsyncTasks(50);

                const payload = payloads[payloads.length - 1];
                expect(payload['query.allEmails']).to.deep.equal(['new@example.com', 'second@example.com']);
            } finally {
                global.fetch = originalFetch;
            }
        });
    });

    describe('doesAltAddressExist handling (altAddressKeys)', () => {
        it('treats explicit "no" flags as not having alternate address data', async () => {
            // This uses submitClickHandler's internal findChangedUserDataValues(), which should set doesAltAddressExist.
            const participant = createMockParticipant('test-uid');
            participant[fieldMapping.verifiedFlag] = fieldMapping.verified;

            document.body.innerHTML = `
                <div id="mainContent"></div>
                <button class="updateMemberData" id="updateMemberData">Save</button>
            `;

            const originalFetch = global.fetch;
            const calls = [];
            global.fetch = async (url, options) => {
                // Capture payload posted by postUserDataUpdate()
                if (options?.body) {
                    try {
                        calls.push(JSON.parse(options.body));
                    } catch {
                        calls.push(options.body);
                    }
                }
                return {
                    ok: true,
                    json: async () => ({}),
                };
            };

            try {
                // Changed option: only toggle isIntlAltAddress to "no"
                const changedOption = { [fieldMapping.isIntlAltAddress]: fieldMapping.no };
                await module.submitClickHandler(participant, changedOption);

                // Click to trigger handler
                document.getElementById('updateMemberData').click();
                await waitForAsyncTasks(25);

                expect(calls).to.have.length.greaterThan(0);
                const payload = calls[calls.length - 1];
                expect(payload[fieldMapping.doesAltAddressExist]).to.equal(fieldMapping.no);
            } finally {
                global.fetch = originalFetch;
            }
        });
    });
});
