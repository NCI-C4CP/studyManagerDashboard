import { expect } from 'chai';
import { setupTestEnvironment, teardownTestEnvironment, createMockParticipant, installFirebaseStub } from './helpers.js';
import fieldMapping from '../src/fieldToConceptIdMapping.js';

describe('participantDetailsHelpers', () => {
    let module;
    let roleState;
    let appState;

    const loadModule = async () => {
        if (module && roleState && appState) return;
        module = await import('../src/participantDetailsHelpers.js');
        const stateManager = await import('../src/stateManager.js');
        roleState = stateManager.roleState;
        appState = stateManager.appState;
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
});
