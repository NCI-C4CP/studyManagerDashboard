import fieldMapping from './fieldToConceptIdMapping.js';
import { renderParticipantDetails } from './participantDetails.js';
import { findParticipant } from './participantLookup.js';
import { appState, participantState, userSession, markUnsaved, clearUnsaved } from './stateManager.js';
import { baseAPI, getDataAttributes, getIdToken, hideAnimation, showAnimation, triggerNotificationBanner, escapeHTML } from './utils.js';

export const allStates = {
    "Alabama":1,
    "Alaska":2,
    "Arizona":3,
    "Arkansas":4,
    "California":5,
    "Colorado":6,
    "Connecticut":7,
    "Delaware":8,
    "District of Columbia": 9,
    "Florida":10,
    "Georgia":11,
    "Hawaii":12,
    "Idaho":13,
    "Illinois":14,
    "Indiana":15,
    "Iowa":16,
    "Kansas":17,
    "Kentucky":18,
    "Louisiana":19,
    "Maine":20,
    "Maryland":21,
    "Massachusetts":22,
    "Michigan":23,
    "Minnesota":24,
    "Mississippi":25,
    "Missouri":26,
    "Montana":27,
    "Nebraska":28,
    "Nevada":29,
    "New Hampshire":30,
    "New Jersey":31,
    "New Mexico":32,
    "New York":33,
    "North Carolina":34,
    "North Dakota":35,
    "Ohio":36,
    "Oklahoma":37,
    "Oregon":38,
    "Pennsylvania":39,
    "Rhode Island":40,
    "South Carolina":41,
    "South Dakota":42,
    "Tennessee":43,
    "Texas":44,
    "Utah":45,
    "Vermont":46,
    "Virginia":47,
    "Washington":48,
    "West Virginia":49,
    "Wisconsin":50,
    "Wyoming":51,
    "NA": 52
}

const textAndVoicemailPermissionIds = [fieldMapping.canWeText, fieldMapping.voicemailMobile, fieldMapping.voicemailHome, fieldMapping.voicemailOther];

export const closeModal = () => {
    const modalClose = document.getElementById('modalShowMoreData');
    modalClose.querySelector('#closeModal').click();
};

const fieldValues = {     
    [fieldMapping.yes]: 'Yes',
    [fieldMapping.no]: 'No',
    [fieldMapping.noneOfTheseApply]: '',
    [fieldMapping.jr]: 'Jr.',
    [fieldMapping.sr]: 'Sr.',
    [fieldMapping.one]: 'I, 1st',
    [fieldMapping.two]: 'II, 2nd',
    [fieldMapping.three]: 'III, 3rd',
    [fieldMapping.four]: 'IV, 4th',
    [fieldMapping.five]: 'V, 5th',
    [fieldMapping.six]: 'VI, 6th',
    [fieldMapping.seven]: 'VII, 7th',
    [fieldMapping.eight]: 'VIII, 8th',
    [fieldMapping.second]: '2nd',
    [fieldMapping.third]: '3rd',
    [fieldMapping.prefPhone]: 'Phone',
    [fieldMapping.email]: 'Email',
    [fieldMapping.language.en]: 'English',
    [fieldMapping.language.es]: 'Spanish',
}

export const getFieldValues = (variableValue, conceptId) => {
    if (!variableValue || (conceptId === "Change Login Email" && variableValue.startsWith("noreply"))) return "";
    if (variableValue in fieldValues) return fieldValues[variableValue];

    const formattedPhoneValue = variableValue ? formatPhoneNumber(variableValue.toString()) : "";
    const phoneFieldValues = {
        [fieldMapping.cellPhone]: formattedPhoneValue,
        [fieldMapping.homePhone]: formattedPhoneValue,
        [fieldMapping.otherPhone]: formattedPhoneValue,
        [fieldMapping.altContactMobilePhone]: formattedPhoneValue,
        [fieldMapping.altContactHomePhone]: formattedPhoneValue,
        'Change Login Phone': formattedPhoneValue
    }

    return phoneFieldValues[conceptId] ?? variableValue;
}

export const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';

    // Clean the phone number - remove all non-digits, then remove the leading 1 if it exists
    let cleanNumber = phoneNumber.toString().replace(/\D/g, '');
    if (cleanNumber.length === 11 && cleanNumber.startsWith('1')) {
        cleanNumber = cleanNumber.substring(1);
    }

    return `(${cleanNumber.substring(0,3)}) ${cleanNumber.substring(3,6)}-${cleanNumber.substring(6,10)}`;
};

/**
 * Format phone number as the user types
 * Limit to 10 digits only
 * @param {string} value - the input value
 * @returns {string} - formatted phone number
 */
export const formatPhoneNumberInput = (value) => {
    const digits = (value || '').replace(/\D/g, '').substring(0, 10);
    if (!digits) return '';
    else if (digits.length <= 3) return digits;
    else if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
    else return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
};

export const formatNameInput = (value) => {
    if (!value) return '';
    // Replace any character that is NOT in the allowed set.
    return value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'\-.]/g, '');
};

/**
 * Format zip code input to allow only digits, max 5 characters
 * @param {string} value - the input value
 * @returns {string} - formatted zip code
 */
export const formatZipInput = (value) => {
    if (!value) return '';
    // Only allow digits, limit to 5 characters
    return value.replace(/\D/g, '').substring(0, 5);
};

/**
 * Add input formatting event listeners for phone, name, and zip fields
 */
export const addFormInputFormattingListeners = () => {
    const phoneInputs = document.querySelectorAll('.phone-input, input[type="tel"]');

    phoneInputs.forEach((input, index) => {
        if (input.dataset.currentValue && input.dataset.currentValue !== 'undefined' && !input.value) {
            const formattedValue = formatPhoneNumber(input.dataset.currentValue.toString());
            input.value = formattedValue;
        }
    });

    // Remove existing listeners to prevent duplicates
    document.removeEventListener('input', handleFormInputFormatting);
    document.removeEventListener('keydown', handleFormKeydown);

    // Add fresh listeners using event delegation
    document.addEventListener('input', handleFormInputFormatting);
    document.addEventListener('keydown', handleFormKeydown);
};

const nameFieldConceptIds = [
    fieldMapping.lName,
    fieldMapping.fName,
    fieldMapping.mName,
    fieldMapping.prefName,
    fieldMapping.altContactFirstName,
    fieldMapping.altContactLastName
];

const zipFieldConceptIds = [
    fieldMapping.zip,
    fieldMapping.physicalZip,
    fieldMapping.altZip
];

/**
 * Handle form input formatting for phone, name, and zip fields
 */
const handleFormInputFormatting = (event) => {
    const input = event.target;

    // Phone input handling
    if (input.matches('.phone-input, input[type="tel"]')) {
        const oldValue = input.value;
        const oldCursor = input.selectionStart || 0;
        const newValue = formatPhoneNumberInput(oldValue);

        if (oldValue === newValue) return;

        input.value = newValue;
        const newCursor = getNewCursorPosition(oldValue, newValue, oldCursor);
        input.setSelectionRange(newCursor, newCursor);
        return; // Done
    }

    // Name input handling
    if (input.matches('input[type="text"][id^="newValue"]')) {
        const conceptId = parseInt(input.id.replace('newValue', ''), 10);
        if (nameFieldConceptIds.includes(conceptId)) {
            const oldValue = input.value;
            const sanitizedValue = formatNameInput(oldValue);

            if (oldValue !== sanitizedValue) {
                const cursorPosition = input.selectionStart || 0;
                const numCharsRemovedBeforeCursor = (oldValue.slice(0, cursorPosition).match(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'\-.]/g) || []).length;

                input.value = sanitizedValue;
                input.setSelectionRange(cursorPosition - numCharsRemovedBeforeCursor, cursorPosition - numCharsRemovedBeforeCursor);
            }
        }

        // Zip code input handling
        if (zipFieldConceptIds.includes(conceptId)) {
            const oldValue = input.value;
            const formattedValue = formatZipInput(oldValue);

            if (oldValue !== formattedValue) {
                const cursorPosition = input.selectionStart || 0;
                input.value = formattedValue;
                // Keep cursor at end if we hit the 5-digit limit, otherwise maintain position
                const newCursorPosition = formattedValue.length >= 5 ? 5 : Math.min(cursorPosition, formattedValue.length);
                input.setSelectionRange(newCursorPosition, newCursorPosition);
            }
        }
    }
};

/**
 * Handle keydown events to prevent invalid characters for phone and zip inputs.
 * Allow backspace, tab, enter, escape, arrow keys, delete, home, end, and control keys.
 * Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z (copy/paste/select all).
 * Prevent non-numeric keys (allow digits only) for phone and zip fields.
 */
const handleFormKeydown = (event) => {
    if (event.target.matches('.phone-input, input[type="tel"]')) {
        const controlKeys = ['Backspace', 'Tab', 'Enter', 'Escape', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (controlKeys.includes(event.key)) return;

        if (event.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(event.key.toLowerCase())) return;

        // Only allow digits (0-9)
        const isDigit = /^[0-9]$/.test(event.key);
        if (!isDigit) {
            event.preventDefault();
        }
    }

    // Handle zip code input keydown
    if (event.target.matches('input[type="text"][id^="newValue"]')) {
        const conceptId = parseInt(event.target.id.replace('newValue', ''), 10);
        if (zipFieldConceptIds.includes(conceptId)) {
            const controlKeys = ['Backspace', 'Tab', 'Enter', 'Escape', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
            if (controlKeys.includes(event.key)) return;

            if (event.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(event.key.toLowerCase())) return;

            // Only allow digits (0-9)
            const isDigit = /^[0-9]$/.test(event.key);
            if (!isDigit) {
                event.preventDefault();
            }
        }
    }
};

/**
 * Calculate new cursor position after formatting the phone number.
 * If digits were removed or cursor was at end -> move to end
 * If digits were added or cursor was at start -> move to start
 * 
 */
const getNewCursorPosition = (oldValue, newValue, oldCursorPosition) => {
    const oldDigits = oldValue.replace(/\D/g, '');
    const newDigits = newValue.replace(/\D/g, '');

    // If digits were removed or cursor was at end -> move to end
    if (newDigits.length < oldDigits.length || oldCursorPosition >= oldValue.length) return newValue.length;

    const digitsBeforeCursor = oldValue.slice(0, oldCursorPosition).replace(/\D/g, '').length;
    if (digitsBeforeCursor === 0) return 0;

    // Walk newValue to find position after the same count of digits
    let digitCount = 0;
    for (let i = 0; i < newValue.length; i++) {
        if (/\d/.test(newValue[i])) digitCount++;
        if (digitCount === digitsBeforeCursor) return i + 1;
    }

    return newValue.length;
};

const isPhoneNumberInForm = (participant, changedOption, fieldMappingKey) => {
    return !!participant?.[fieldMappingKey] || !!changedOption?.[fieldMappingKey];
};

export const getImportantRows = (participant, changedOption) => {
    const isParticipantVerified = participant[fieldMapping.verifiedFlag] === fieldMapping.verified;
    const isParticipantDataDestroyed = participant[fieldMapping.dataDestroyCategorical] === fieldMapping.requestedDataDestroySigned;
    const isParticipantDuplicate = participant[fieldMapping.verifiedFlag] === fieldMapping.duplicate;
    const isParticipantCannotBeVerified = participant[fieldMapping.verifiedFlag] === fieldMapping.cannotBeVerified;

    // Condition handles editing restrictions
    const isEditable = !isParticipantDataDestroyed && !isParticipantDuplicate && !isParticipantCannotBeVerified;

    // For duplicate accounts, allow NORC/CCC staff to edit login fields only.
    // https://github.com/episphere/connect/issues/1472 -- This is a main way they resolve duplicate account login issues.
    const isNORCOrCCC = getIsNORCOrCCC();
    const canEditLoginForDuplicateAccounts = isParticipantDuplicate && isNORCOrCCC && !isParticipantDataDestroyed;

    const isCellPhonePresent = isPhoneNumberInForm(participant, changedOption, fieldMapping.cellPhone);
    const isHomePhonePresent = isPhoneNumberInForm(participant, changedOption, fieldMapping.homePhone);
    const isOtherPhonePresent = isPhoneNumberInForm(participant, changedOption, fieldMapping.otherPhone);
    const coordinatingCenter = localStorage.getItem('coordinatingCenter');
    const helpDesk = localStorage.getItem('helpDesk');

    // Participant Data Rows
    const participantDataRows = [ 
        { field: fieldMapping.lName,
            label: 'Last Name',
            editable: isEditable,
            display: true,
            validationType: 'name',
            isRequired: true
        },
        { field: fieldMapping.fName,
            label: 'First Name',
            editable: isEditable,
            display: true,
            validationType: 'name',
            isRequired: true
        },
        { field: fieldMapping.prefName,
            label: 'Preferred Name',
            editable: isEditable,
            display: true,
            validationType: 'name',
            isRequired: false
        },
        { field: fieldMapping.mName,
            label: 'Middle Name',
            editable: isEditable,
            display: true,
            validationType: 'name',
            isRequired: false
        },
        { field: fieldMapping.suffix,
            label: 'Suffix',
            editable: isEditable,
            display: true,
            validationType: 'suffix',
            isRequired: false
        },
        { field: fieldMapping.cellPhone,
            label: 'Cell Phone',
            editable: isEditable,
            display: true,
            validationType: 'phoneNumber',
            isRequired: false
        },
        { field: fieldMapping.canWeText,
            label: 'Can we text your mobile phone?',
            editable: isEditable && isCellPhonePresent,
            display: true,
            validationType: 'permissionSelector',
            isRequired: false
        },
        { field: fieldMapping.voicemailMobile,
            label: 'Can we leave a voicemail at your mobile phone number?',
            editable: isEditable && isCellPhonePresent,
            display: true,
            validationType: 'permissionSelector',
            isRequired: false
        },
        { field: fieldMapping.homePhone,
            label: 'Home Phone',
            editable: isEditable,
            display: true,
            validationType: 'phoneNumber',
            isRequired: false
        },
        { field: fieldMapping.voicemailHome,
            label: 'Can we leave a voicemail at your home phone number?',
            editable: isEditable && isHomePhonePresent,
            display: true,
            validationType: 'permissionSelector',
            isRequired: false
        },
        { field: fieldMapping.otherPhone,
            label: 'Other Phone',
            editable: isEditable,
            display: true,
            validationType: 'phoneNumber',
            isRequired: false
        },
        { field: fieldMapping.voicemailOther,
            label: '   Can we leave a voicemail at your other phone number?',
            editable: isEditable && isOtherPhonePresent,
            display: true,
            validationType: 'permissionSelector',
            isRequired: false
        },
        { field: fieldMapping.email,
            label: 'Preferred Email',
            editable: isEditable,
            display: true,
            validationType: 'email',
            isRequired: true
        },
        { field: fieldMapping.email1,
            label: 'Additional Email 1',
            editable: isEditable,
            display: true,
            validationType: 'email',
            isRequired: false
        },
        { field: fieldMapping.email2,
            label: 'Additional Email 2',
            editable: isEditable,
            display: true,
            validationType: 'email',
            isRequired: false
        },
    ];

    // Mailing Address Rows
    const mailingAddressRows = [
        {
            field: 'Mailing Address',
            label: 'Mailing Address',
            editable: false,
            display: true,
            validationType: 'none',
            isRequired: false,
            isHeading: true,
        },
        { field: fieldMapping.address1,
            label: 'Mailing Address Line 1',
            editable: isEditable,
            display: true,
            validationType: 'address',
            isRequired: true
        },
        { field: fieldMapping.address2,
            label: 'Mailing Address Line 2',
            editable: isEditable,
            display: true,
            validationType: 'address',
            isRequired: false
        },
        { field: fieldMapping.city,
            label: 'Mailing Address City',
            editable: isEditable,
            display: true,
            validationType: 'city',
            isRequired: true
        },
        { field: fieldMapping.state,
            label: 'Mailing Address State',
            editable: isEditable,
            display: true,
            validationType: 'state',
            isRequired: true
        },
        { field: fieldMapping.zip,
            label: 'Mailing Address Zip',
            editable: isEditable,
            display: true,
            validationType: 'zip',
            isRequired: true
        },
        { field: fieldMapping.isPOBox,
            label: 'Mailing Address is PO Box',
            editable: isEditable,
            display: true,
            validationType: 'permissionSelector',
            isRequired: false
        },
    ];

    // Physical Address Rows
    const physicalAddressRows = [
        {
            field: 'Physical Address',
            label: 'Physical Address',
            editable: false,
            display: true,
            validationType: 'none',
            isRequired: false,
            isHeading: true,
        },
        { field: fieldMapping.physicalAddress1,
            label: 'Physical Address Line 1 (if different from mailing address)',
            editable: isEditable,
            display: true,
            validationType: 'address',
            isRequired: false
        },
        { field: fieldMapping.physicalAddress2,
            label: 'Physical Address Line 2 (if different from mailing address)',
            editable: isEditable,
            display: true,
            validationType: 'address',
            isRequired: false
        },
        { field: fieldMapping.physicalCity,
            label: 'Physical City (if different from mailing address)',
            editable: isEditable,
            display: true,
            validationType: 'city',
            isRequired: false
        },
        { field: fieldMapping.physicalState,
            label: 'Physical State (if different from mailing address)',
            editable: isEditable,
            display: true,
            validationType: 'state',
            isRequired: false
        },
        { field: fieldMapping.physicalZip,
            label: 'Physical Zip (if different from mailing address)',
            editable: isEditable,
            display: true,
            validationType: 'zip',
            isRequired: false
        },
    ];
    
    // Alternate Address Rows
    const alternateAddressRows = [
        {
            field: 'Alternate Address',
            label: 'Alternate Address (For any other mailing addresses you have)',
            editable: false,
            display: true,
            validationType: 'none',
            isRequired: false,
            isHeading: true,
        },
        {
            field: fieldMapping.altAddress1,
            label: 'Alternate Address Line 1',
            editable: isEditable,
            display: true,
            validationType: 'address',
            isRequired: false,
        },
        {
            field: fieldMapping.altAddress2,
            label: 'Alternate Address Line 2',
            editable: isEditable,
            display: true,
            validationType: 'address',
            isRequired: false,
        },
        {
            field: fieldMapping.altCity,
            label: 'Alternate City',
            editable: isEditable,
            display: true,
            validationType: 'city',
            isRequired: false,
        },
        {
            field: fieldMapping.altState,
            label: 'Alternate State',
            editable: isEditable,
            display: true,
            validationType: 'state',
            isRequired: false,
        },
        {
            field: fieldMapping.altZip,
            label: 'Alternate Zip',
            editable: isEditable,
            display: true,
            validationType: 'zip',
            isRequired: false,
        },
        {
            field: fieldMapping.isPOBoxAltAddress,
            label: 'Alternate Address is PO Box',
            editable: isEditable,
            display: true,
            validationType: 'permissionSelector',
            isRequired: false
        },
    ];

    // Alternate Contact Rows
    const alternateContactRows = [
        {
            field: 'Alternate Contact',
            label: 'Alternate Contact (To help us get in touch with you if we lose contact)',
            editable: false,
            display: true,
            validationType: 'none',
            isRequired: false,
            isHeading: true,
        },
        {
            field: fieldMapping.altContactFirstName,
            label: 'Alternate Contact First Name',
            editable: isEditable,
            display: true,
            validationType: 'name',
            isRequired: false,            
        },
        {
            field: fieldMapping.altContactLastName,
            label: 'Alternate Contact Last Name',
            editable: isEditable,
            display: true,
            validationType: 'name',
            isRequired: false,
        },
        {
            field: fieldMapping.altContactMobilePhone,
            label: 'Alternate Contact Mobile Phone',
            editable: isEditable,
            display: true,
            validationType: 'phoneNumber',
            isRequired: false,
        },
        {
            field: fieldMapping.altContactHomePhone,
            label: 'Alternate Contact Home Phone',
            editable: isEditable,
            display: true,
            validationType: 'phoneNumber',
            isRequired: false,
        },
        {
            field: fieldMapping.altContactEmail,
            label: 'Alternate Contact Email Address',
            editable: isEditable,
            display: true,
            validationType: 'email',
            isRequired: false,
        },
    ];

    // Birth Date Rows
    const birthDateRows = [
        {
            field: 'Date of Birth',
            label: 'Date of Birth',
            editable: false,
            display: !isParticipantVerified,
            validationType: 'none',
            isRequired: false,
            isHeading: true,
        },
        { field: fieldMapping.birthMonth,
            label: 'Birth Month',
            editable: isEditable && !isParticipantVerified,
            display: !isParticipantVerified,
            validationType: 'month',
            isRequired: false
        },
        { field: fieldMapping.birthDay,
            label: 'Birth Day',
            editable: isEditable && !isParticipantVerified,
            display: !isParticipantVerified,
            validationType: 'day',
            isRequired: true
        },
        { field: fieldMapping.birthYear,
            label: 'Birth Year',
            editable: isEditable && !isParticipantVerified,
            display: !isParticipantVerified,
            validationType: 'year',
            isRequired: true
        },
    ];

    // Connect ID and Preferred Language Rows
    const identificationRows = [
        {
            field: 'Identification and Language Settings',
            label: 'Identification and Language Settings',
            editable: false,
            display: true,
            validationType: 'none',
            isRequired: false,
            isHeading: true,
        },
        { field: 'Connect_ID',
            label: 'Connect ID',
            editable: false,
            display: true,
            validationType: 'none',
            isRequired: true
        },
        { field: fieldMapping.preferredLanguage,
            label: 'Preferred Language',
            editable: (helpDesk === 'true' || coordinatingCenter === 'true') && isEditable,
            display: true,
            validationType: 'none',
            isRequired: false
        },
    ];

    // Authentication Data Rows
    const loginChangeInfoArray = [
        { field: 'Login Update Memo',
            label: 'Login Settings (Save any profile edits before making login changes)',
            editable: false,
            display: true,
            validationType: 'none',
            isRequired: false,
            isHeading: true,
        },
        { field: `Change Login Email`,
            label: 'Email Login',
            editable: isEditable || canEditLoginForDuplicateAccounts,
            display: appState.getState().loginMechanism.email,
            validationType: 'none'
        },
        { field: `Change Login Phone`,
            label: 'Phone Login',
            editable: isEditable || canEditLoginForDuplicateAccounts,
            display:  appState.getState().loginMechanism.phone,
            validationType: 'none'
        }
    ];

    // Concatenate all rows. Only display login rows for NORC/CCC staff.
    const finalParticipantRows = [
        ...participantDataRows,
        ...mailingAddressRows,
        ...physicalAddressRows,
        ...alternateAddressRows,
        ...alternateContactRows,
        ...birthDateRows,
        ...identificationRows,
        ...(isNORCOrCCC ? loginChangeInfoArray : [])
    ];

    return finalParticipantRows;
};

/**
 * Determine whether a phone number is present in the form or in the changed options.
 * A phone number is present if:
 *  - it is present in the participant object or the changedOption object
 *  - AND it is not an empty string in the changedOption object (empty string in changedOption means the user is trying to delete the phone number)
 *  - AND the conceptId is not the same as the phoneType (conceptId is the field name being changed, phoneType is the field being checked see: getRequiredField())
 * This is used for validating phone number updates:
 * If no number is present, require a phone number before allowing user to submit the update
 * If a number is present, allow user to submit the update
 */
function isPhoneNumberPresent(participant, changedOption, conceptId, phoneType) {
    return (participant[phoneType] || changedOption[phoneType]) && changedOption[phoneType] !== '' && conceptId != phoneType;
}

/**
 * Get whether a field is required or not
 * Automatically required fields: fName, lName, birthMonth, birthYear, birthDay, prefEmail, addressLine1, city, state, zip.
 * Make sure automatically required fields are present
 * Additional requirement: at least one phone number must be present.
 * If user is editing phone numbers, don't allow all of them to be empty (make at least one required)
 */
const getIsRequiredField = (participant, changedOption, newValueElement, conceptId) => {
    const isRequiredFieldArray = getImportantRows(participant, changedOption)
        .filter(row => row.isRequired === true)
        .map(row => row.field);

    if (isRequiredFieldArray.includes(parseInt(conceptId))) {
        return true;
    }

    if (!newValueElement?.value && (conceptId == fieldMapping.cellPhone || conceptId == fieldMapping.homePhone || conceptId == fieldMapping.otherPhone)) {
        const isCellPhonePresent = isPhoneNumberPresent(participant, changedOption, conceptId, fieldMapping.cellPhone);
        const isHomePhonePresent = isPhoneNumberPresent(participant, changedOption, conceptId, fieldMapping.homePhone);
        const isOtherPhonePresent = isPhoneNumberPresent(participant, changedOption, conceptId, fieldMapping.otherPhone);
        return !(isCellPhonePresent || isHomePhonePresent || isOtherPhonePresent);
    }
};

/**
 * get a user-friendly label for the modal
 * @param {string} participantKey - the participant key (existing data structure) from the participant form 
 * @returns - user-friendly label for the modal
 */
export const getModalLabel = (participantKey) => {
    const labels = {
        LastName: 'Last Name',
        FirstName: 'First Name',
        MiddleName: 'Middle Name',
        PreferredName: 'Preferred Name',
        BirthMonth: 'Birth Month',
        BirthDay: 'Birth Day',
        BirthYear: 'Birth Year',
        Mobilephone: 'Mobile Phone',
        Text: 'Do we have permission to text this number',
        Mobilevoicemail: 'Do we have permission to leave a voicemail at this number',
        Homephone: 'Home Phone',
        Homevoicemail: 'Do we have permission to leave a voicemail at this number',
        Otherphone: 'Other Phone',
        Othervoicemail: 'Do we have permission to leave a voicemail at this number',
        Preferredemail: 'Preferred Email',
        Additionalemail1: 'Additional Email 1',
        Additionalemail2: 'Additional Email 2',
        Addressline1: 'Address Line 1',
        Addressline2: 'Address Line 2',
    };

    return labels[participantKey] || participantKey;
};

export const reloadParticipantData = async (token) => {
    try {
        showAnimation();
        const query = `token=${token}`;
        const response = await findParticipant(query);

        if (response.code === 200 && response.data && response.data[0]) {
            const participant = response.data[0];
            
            participantState.setParticipant(participant);
            renderParticipantDetails(participant);
            
        } else {
            console.error('Failed to reload participant data:', response);
            triggerNotificationBanner('Error reloading participant data', 'danger', 4000);
        }

    } catch (error) {
        console.error('Error in reloadParticipantData:', error);
        triggerNotificationBanner('Error reloading participant data', 'danger', 4000);

    } finally {
        hideAnimation();
    }
}

export const resetChanges = (participant) => {
    const cancelButtons = [document.getElementById("cancelChangesUpper"), document.getElementById("cancelChangesLower")];

    const handleCancelChanges = () => {
        if (appState.getState().hasUnsavedChanges) {
            renderParticipantDetails(participant);
            clearUnsaved();
            triggerNotificationBanner('Changes cancelled.', 'warning');
        }
    };

    cancelButtons.forEach(button => {
        if (button) {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener("click", handleCancelChanges);
        }
    });
}

/**
 * Handle the listeners for the login update forms
 * for login updates (email or phone), switch package and changedOption are generated from the form
 * for login removal, switch package and changedOption are generated from the participant object
 */
export const attachUpdateLoginMethodListeners = (participantAuthenticationEmail, participantAuthenticationPhone, participantToken, participantUid) => {
    const createListener = (loginType) => {
        const typeName = capitalizeFirstLetter(loginType);
        return () => {
            const header = document.getElementById('modalHeader');
            const body = document.getElementById('modalBody');
            header.innerHTML = `
                <h5>${typeName} Login</h5>
                <button type="button" class="modal-close-btn" data-dismiss="modal" id="closeModal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>`;
            const currentLogins = { 
                phone: participantAuthenticationPhone, 
                email: participantAuthenticationEmail 
            };
            const inputFields = generateLoginFormInputFields(currentLogins, loginType);
            const formButtons = generateAuthenticationFormButtons(!!(currentLogins.email && !currentLogins.email.startsWith('noreply')), !!currentLogins.phone, loginType);
            body.innerHTML = `
                <div>
                    <form id="authDataForm" method="post">
                        ${inputFields}${formButtons}
                    </form>
                </div>`;

            const formResponse = document.getElementById('authDataForm');
            if (formResponse) {
                formResponse.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const { switchPackage, changedOption } = getUpdatedAuthenticationFormValues(participantAuthenticationEmail, participantAuthenticationPhone);
                    if (switchPackage && changedOption) {
                        await processParticipantLoginMethod(participantAuthenticationEmail, participantToken, participantUid, switchPackage, changedOption, 'update');
                    }
                });
            }

            if (loginType === 'email') {
                const removeEmailLoginBtn = document.getElementById('removeUserLoginEmail');
                if (removeEmailLoginBtn) {
                    removeEmailLoginBtn.addEventListener('click', async () => {
                        await processParticipantLoginMethod(participantAuthenticationEmail, participantToken, participantUid, {}, {}, 'removeEmail');
                    });
                }
            }

            if (loginType === 'phone') {
                const removePhoneLoginBtn = document.getElementById('removeUserLoginPhone');
                if (removePhoneLoginBtn) {
                    removePhoneLoginBtn.addEventListener('click', async () => {
                        await processParticipantLoginMethod(participantAuthenticationEmail, participantToken, participantUid, {}, {}, 'removePhone');
                    });
                }

                addFormInputFormattingListeners();
            }
        };
    };

    const updateEmailButton = document.getElementById('updateUserLoginEmail');
    const updatePhoneButton = document.getElementById('updateUserLoginPhone');
    requestAnimationFrame(() => {
        updateEmailButton && updateEmailButton.addEventListener('click', createListener('email'));
        updatePhoneButton && updatePhoneButton.addEventListener('click', createListener('phone'));
    });
};

const generateLoginFormInputFields = (currentLogins, loginType) => {
    const currentEmailLogin = currentLogins.email && !currentLogins.email.startsWith('noreply') ? currentLogins.email : 'Not in use';
    const currentPhoneLogin = currentLogins.phone ? formatPhoneNumber(currentLogins.phone) : 'Not in use';
    
    const loginTypeConfig = {
        phone: {
            currentLogin: currentPhoneLogin,
            labelForNewLogin: 'Enter New Phone Number',
            newLoginId: 'newPhone',
            confirmLabel: 'Confirm New Phone Number',
            confirmId: 'confirmPhone',
        },
        email: {
            currentLogin: currentEmailLogin,
            labelForNewLogin: 'Enter New Email Address',
            newLoginId: 'newEmail',
            confirmLabel: 'Confirm New Email Address',
            confirmId: 'confirmEmail',
        }
    }

    const { currentLogin, labelForNewLogin, newLoginId, confirmLabel, confirmId } = loginTypeConfig[loginType];

    return `<div class="form-group">
                <label class="col-form-label search-label">Current ${capitalizeFirstLetter(loginType)} Login</label>
                <input class="form-control" value="${currentLogin}" disabled/>
                <label class="col-form-label search-label">${labelForNewLogin}</label>
                ${loginType === 'phone' ?
                    `<input class="form-control phone-input" id="${newLoginId}" placeholder="${labelForNewLogin}" maxlength="14"/>` :
                    `<input class="form-control" id="${newLoginId}" placeholder="${labelForNewLogin}"/>`}
                <label class="col-form-label search-label">${confirmLabel}</label>
                ${loginType === 'phone' ?
                    `<input class="form-control phone-input" id="${confirmId}" placeholder="${confirmLabel}" maxlength="14"/>` :
                    `<input class="form-control" id="${confirmId}" placeholder="${confirmLabel}"/>`}
            </div>`;
};

const generateAuthenticationFormButtons = (doesEmailLoginExist, doesPhoneLoginExist, loginType) => {
    return `
        <div class="form-group">
            <button type="button" class="btn btn-danger mr-2" data-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary" data-toggle="modal">Submit</button>
            ${loginType === 'email' && doesEmailLoginExist && doesPhoneLoginExist ? `<button type="button" class="btn btn-warning float-right" id="removeUserLoginEmail">Remove this Login</button>` : ''}
            ${loginType === 'phone' && doesEmailLoginExist && doesPhoneLoginExist ? `<button type="button" class="btn btn-warning float-right" id="removeUserLoginPhone">Remove this Login</button>` : ''}
        </div>
        `;
};

const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const getUpdatedAuthenticationFormValues = (participantAuthenticationEmail, participantAuthenticationPhone) => {
    const switchPackage = {};
    const changedOption = {};
    const phoneField = document.getElementById('newPhone');
    const emailField = document.getElementById('newEmail');
    if (phoneField && phoneField.value === document.getElementById('confirmPhone').value) {
        if (!validPhoneNumberFormat.test(phoneField.value)) {
            alert('Invalid phone number format. Please enter a 10 digit phone number.');
            return {}, {} ;
        }
        let cleanedPhoneNumber = phoneField.value.toString();
        if (cleanedPhoneNumber.startsWith('+1')) cleanedPhoneNumber = cleanedPhoneNumber.substring(2);
        cleanedPhoneNumber = cleanedPhoneNumber.replace(/\D/g, '').trim();
        switchPackage['phone'] = cleanedPhoneNumber;
        switchPackage['flag'] = 'updatePhone';
        changedOption[fieldMapping.signInMechanism] = 'phone';
        changedOption[fieldMapping.accountPhone] = `+1`+ cleanedPhoneNumber;
    } else if (emailField &&  emailField.value === document.getElementById('confirmEmail').value) {
        if (!validEmailFormat.test(emailField.value)) {
            alert('Invalid email format. Please enter a valid email address in the format: abc@example.com');
            return {}, {};
        }
        switchPackage['email'] = emailField.value;
        switchPackage['flag'] = 'updateEmail';
        changedOption[fieldMapping.signInMechanism] = 'password';
        changedOption[fieldMapping.accountEmail] = emailField.value;
    } else {
        alert(`Your entered inputs don't match`);
        return {}, {};
    }

    if ((phoneField && phoneField.value && participantAuthenticationEmail && !participantAuthenticationEmail.startsWith('noreply')) || (emailField && emailField.value && !emailField.value.startsWith('noreply') && participantAuthenticationPhone)) {
        changedOption[fieldMapping.signInMechanism] = 'passwordAndPhone';
    }

    return { switchPackage, changedOption };
}

const getLoginRemovalSwitchPackage = (processType, participantAuthenticationEmail, participantUid) => {
    const switchPackage = {};
    const changedOption = {};
    if (processType === 'removeEmail') {
        const placeholderForEmailRemoval = `noreply${participantUid}@NCI-C4CP.github.io`;
        switchPackage['email'] = placeholderForEmailRemoval;
        switchPackage['flag'] = 'updateEmail';
        changedOption[fieldMapping.accountEmail] = placeholderForEmailRemoval;
        changedOption[fieldMapping.signInMechanism] = 'phone';
    } else if (processType === 'removePhone') {
        switchPackage['email'] = participantAuthenticationEmail;
        switchPackage['flag'] = 'replaceSignin';
        changedOption[fieldMapping.accountPhone] = '';
        changedOption[fieldMapping.signInMechanism] = 'password';
    }
    return { switchPackage, changedOption };
};

/**
 * Process the participant's login method
 * Possibilities include: update email, update phone, remove email, remove phone
 * Removal of one auth method is only possible if the participant has both an email and phone login
 * For update operations: Switch package is populated from the form and passed in
 * For removal operations: Switch package is populated inside this function based on current login information
 * Post updated login data to Firebase Auth. On success, also post updated login data to Firestore
 * @param {string} participantAuthenticationEmail - the participant's current email login 
 * @param {string} participantToken - the participant's current token
 * @param {string} participantUid - the participant's current uid
 * @param {object} switchPackage - the data object sent to firebaseAuth to update the participant's login method
 * @param {object} changedOption - the data object sent to firestore to update the participant's login data
 * @param {string} processType - the type of process to be performed -> update, removeEmail, removePhone
 */
const processParticipantLoginMethod = async (participantAuthenticationEmail, participantToken, participantUid, switchPackage, changedOption, processType) => {        
    if (processType === 'removeEmail' || processType === 'removePhone') {
        ({switchPackage, changedOption} = getLoginRemovalSwitchPackage(processType, participantAuthenticationEmail, participantUid));
    }

    const confirmation = confirm('Are you sure want to continue with this update?');
    if (confirmation) {
        showAnimation();
        try {
            switchPackage['uid'] = participantUid;
            changedOption['token'] = participantToken;
            const url = `${baseAPI}/dashboard?api=updateUserAuthentication`;
            const signinMechanismPayload = { "data": switchPackage };
            
            const idToken = await getIdToken();
            const response = await postLoginData(url, signinMechanismPayload, idToken);
            const responseJSON = await response.json();

            if (response.status === 200) {
                const updateResult = await updateParticipantFirestoreProfile(changedOption, idToken);
                hideAnimation();
                if (!updateResult) {
                    showAuthUpdateAPIError('modalBody', "IMPORTANT: There was an error updating the participant's profile.\n\nPLEASE PROCESS THE OPERATION AGAIN.");
                    console.error('Failed to update participant Firestore profile');
                } else {
                    await updateUIOnAuthResponse(switchPackage, changedOption, responseJSON, response.status);
                }   
            } else {
                hideAnimation();
                showAuthUpdateAPIError('modalBody', responseJSON.message);
            }
        } catch (error) {
            hideAnimation();
            console.error(error);
            showAuthUpdateAPIError('modalBody', 'Operation Unsuccessful!');
        }
    }
}

/**
 * Package the updated participant login data to firestore
 * @param {object} updatedOptions - the data object sent to firestore to update the participant's login data 
 * @param {*} bearerToken - the bearer token
 * @returns {boolean} - true if the update was successful, false otherwise
 */
const updateParticipantFirestoreProfile = async (updatedOptions, bearerToken) =>  {
    const updateParticpantPayload = {
        "data": [updatedOptions]
    }

    const url = `${baseAPI}/dashboard?api=updateParticipantData`;
    const response = await postLoginData(url, updateParticpantPayload, bearerToken);
    const responseJSON = await response.json();

    if (response.status === 200) {
        clearUnsaved();
        showAuthUpdateAPIAlert('success', 'Participant detail updated!');
        return true;
    } else { 
        hideAnimation();
        console.error(`Error in updating participant data (updateParticipantFirestoreProfile()): ${responseJSON.error}`);
        return false;
    }
}

const postLoginData = async (url = '', data = {}, bearerToken) => {
    try {
        return await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${bearerToken}`
            }
        });
    } catch (error) {
        console.error('Fetch Error:', error);
        throw error;
    }
}

const updateUIOnAuthResponse = async (switchPackage, changedOption, responseData, status) => {
    hideAnimation();

    if (status === 200) {
        showAuthUpdateAPIAlert('success', 'Operation successful!');
        closeModal();

        // Reload participant data and route through state manager
        await reloadParticipantData(changedOption.token);
    } else {
        const errorMessage = responseData.error || 'Operation Unsuccessful!';
        showAuthUpdateAPIError('modalBody', errorMessage);
    }
}

const showAuthUpdateAPIAlert = (type, message) => {
    const alertList = document.getElementById("alert_placeholder");
    alertList.innerHTML = `
        <div class="alert alert-${type}" alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>`;
}

const showAuthUpdateAPIError = (bodyId, message) => {
    const body = document.getElementById(bodyId);
    body.innerHTML = `<div>${message}</div>`;
    return false;
}

export const updateParticipantAfterFormSave = (participant, changedUserDataForProfile) => {
    const updatedParticipant = { ...participant, ...changedUserDataForProfile };
    appState.setState({ participant: updatedParticipant });
    return updatedParticipant;
}

/**
 * Creates payload to be sent to backend and update the UI. Maps the field name back to concept id along with new responses.
 * Updates the UI with the new responses.
 * @param {object} participant - the original participant obj
 * @param {object} changedOption - updated data obj
 * @param {HTMLElement} editedElement - the currently edited HTML element
 */

export const saveResponses = (participant, changedOption, editedElement, conceptId) => {
    let conceptIdArray = [];
    const formResponse = document.getElementById('formResponse');

    // Rm existing event listeners, then add a new one
    if (formResponse) {
        const newForm = formResponse.cloneNode(true);
        formResponse.parentNode.replaceChild(newForm, formResponse);
    }

    const freshFormResponse = document.getElementById('formResponse');
    if (freshFormResponse) {
        freshFormResponse.addEventListener('submit', e => {
            e.preventDefault()
            const modifiedData = getDataAttributes(document.getElementById(`fieldModified${conceptId}`));
            conceptIdArray.push(modifiedData.fieldconceptid);

            const newValueElement = document.getElementById(`newValue${conceptId}`);     
            const dataValidationType = getImportantRows(participant, changedOption).find(row => row.field == modifiedData.fieldconceptid).validationType;
            const currentConceptId = conceptIdArray[conceptIdArray.length - 1];
            const isRequired = getIsRequiredField(participant, changedOption, newValueElement, currentConceptId);
            
            if (newValueElement.value != participant[currentConceptId] || textAndVoicemailPermissionIds.includes(parseInt(currentConceptId))) {
                const newValueIsValid = validateNewValue(newValueElement, dataValidationType, isRequired);

                if (newValueIsValid) {
                    changedOption[currentConceptId] = newValueElement.value;
                    // if a changed field is a date of birth field then we need to update full date of birth  
                    if (fieldMapping.birthDay in changedOption || fieldMapping.birthMonth in changedOption || fieldMapping.birthYear in changedOption) {
                        const fallbackDoB = (participant[fieldMapping.dateOfBirthComplete] || '').toString();
                        const fallbackMonth = fallbackDoB ? fallbackDoB.slice(4,6) : '';
                        const fallbackDay = fallbackDoB ? fallbackDoB.slice(6,8) : '';

                        const dayRaw = changedOption[fieldMapping.birthDay] || participant[fieldMapping.birthDay] || fallbackDay || '01';
                        const monthRaw = changedOption[fieldMapping.birthMonth] || participant[fieldMapping.birthMonth] || fallbackMonth || '01';
                        const yearRaw = changedOption[fieldMapping.birthYear] || participant[fieldMapping.birthYear] || (fallbackDoB ? fallbackDoB.slice(0,4) : '1900');

                        const day = dayRaw.toString().padStart(2, '0');
                        const month = monthRaw.toString().padStart(2, '0');
                        const year = yearRaw.toString();

                        const dateOfBirthComplete = fieldMapping.dateOfBirthComplete;
                        conceptIdArray.push(dateOfBirthComplete);
                        changedOption[fieldMapping.dateOfBirthComplete] =  `${year}${month}${day}`;
                    }

                    changedOption = forceDataTypesForFirestore(changedOption);
                    closeModal();

                    // Reattach event listeners after each edit and mark unsaved participant data changes
                    requestAnimationFrame(() => {
                        renderParticipantDetails(participant, changedOption);
                        submitClickHandler(participant, changedOption);

                        addFormInputFormattingListeners();
                        markUnsaved();

                        // Highlight any new phone permission fields that need attention
                        highlightNewPhonePermissions(changedOption);
                    });
                }
            } else {
                // Value is being changed back to its original value.
                if (Object.prototype.hasOwnProperty.call(changedOption, currentConceptId)) {
                    delete changedOption[currentConceptId];

                    // If that was the last pending change, clear the unsaved flag.
                    if (Object.keys(changedOption).length === 0) {
                        clearUnsaved();
                    }

                    // Re-render to remove dirty indicators from the field.
                    requestAnimationFrame(() => {
                        renderParticipantDetails(participant, changedOption);
                        submitClickHandler(participant, changedOption);
                    });
                }
                closeModal();
            }
        });
    }
};

const forceDataTypesForFirestore = (changedOption) => {
    const fieldsToInteger = [
        fieldMapping.suffix, 
        fieldMapping.canWeText, 
        fieldMapping.voicemailMobile, 
        fieldMapping.voicemailHome, 
        fieldMapping.voicemailOther,
        fieldMapping.preferredLanguage,
        fieldMapping.isPOBox,
        fieldMapping.isPOBoxAltAddress
    ];
    
    const fieldsToString = [
        fieldMapping.zip,
        fieldMapping.birthDay,
        fieldMapping.birthMonth,
        fieldMapping.birthYear,
        fieldMapping.dateOfBirthComplete
    ];
    
    fieldsToInteger.forEach(field => {
        if (changedOption[field]) {
            changedOption[field] = parseInt(changedOption[field]);
        }
    });
    
    fieldsToString.forEach(field => {
        if (changedOption[field]) {
            changedOption[field] = changedOption[field].toString();
        }
    });

    return changedOption;
};

/**
 * Handle suffix text and phone permission text -> convert concept id to text
 */
const getUITextForUpdatedValue = (newValue, conceptIdArray) => {
    if (conceptIdArray.toString().includes(fieldMapping.suffix.toString())) {
        return suffixToTextMap.get(parseInt(newValue));
    } else if (conceptIdArray.toString().includes(fieldMapping.preferredLanguage.toString())) {
        return languageToTextMap.get(parseInt(newValue));
    } else if (conceptIdArray.some(id => [fieldMapping.canWeText.toString(), fieldMapping.voicemailMobile.toString(), fieldMapping.voicemailHome.toString(), fieldMapping.voicemailOther.toString(), fieldMapping.isPOBox.toString(), fieldMapping.isPOBoxAltAddress.toString()].includes(id.toString()))) {
        return newValue === fieldMapping.yes.toString() ? "Yes" : "No";
    } else {
        return newValue;
    }
};

const phoneTypeToPermissionsMapping = {
    [fieldMapping.cellPhone]: [fieldMapping.voicemailMobile, fieldMapping.canWeText],
    [fieldMapping.homePhone]: [fieldMapping.voicemailHome],
    [fieldMapping.otherPhone]: [fieldMapping.voicemailOther]
};

/**
 * Highlight phone permission fields that need attention after adding a phone number
 * This runs after the page re-renders and the permission buttons actually exist in the DOM
 * @param {object} changedOption - the data that was just changed
 */
const highlightNewPhonePermissions = (changedOption) => {
    // Check each phone type that was changed
    const phoneFields = [
        { field: fieldMapping.cellPhone, permissions: [fieldMapping.voicemailMobile, fieldMapping.canWeText] },
        { field: fieldMapping.homePhone, permissions: [fieldMapping.voicemailHome] },
        { field: fieldMapping.otherPhone, permissions: [fieldMapping.voicemailOther] }
    ];

    phoneFields.forEach(({ field, permissions }) => {
        // If this phone field was changed and now has a valid phone number
        if (changedOption[field] && validPhoneNumberFormat.test(changedOption[field])) {

            permissions.forEach(permissionField => {
                const buttonId = `${permissionField}button`;
                const noteId = `${permissionField}note`;

                const button = document.getElementById(buttonId);
                const noteField = document.getElementById(noteId);

                if (button && noteField) {
                    // Show the button (should already be visible after re-render)
                    button.style.display = 'block';

                    // Add yellow background and warning text
                    noteField.parentNode.parentNode.style.backgroundColor = "yellow";
                    noteField.style.display = "block";
                    noteField.innerHTML = `<i style="color:red;"><u>IMPORTANT:</u><br>*Please confirm participant's contact permission*</i>`;
                }
            });
        }
    });
};

export const showSaveNoteInModal = (conceptId) => {
    const a = document.getElementById(`newValue${conceptId}`);
    if (a) {
        a.addEventListener('click', () => {
            const b = document.getElementById('showNote');
            b.innerHTML = `After 'Submit' you must click 'Save Changes' at the top or bottom of screen for your changes to be saved.`
        });
    }
};

export const suffixList = { 612166858: 0, 
    255907182: 1, 
    226924545: 2, 
    270793412: 3, 
    959021713: 4,
    611945488: 5,
    773963342: 6,
    911299066: 7,
    528373182: 8,
    233284019: 9, 
    643664527: 10, 
    537892528: 11 };

export const languageList = { 
    163149180: 0, 
    773342525: 1};

export const suffixToTextMap = new Map([
    [398561594, ''],
    [612166858, 'Jr.'],
    [255907182, 'Sr.'],
    [226924545, 'I, 1st'],
    [270793412, 'II, 2nd'],
    [959021713, 'III, 3rd'],
    [611945488, 'IV, 4th'],
    [773963342, 'V, 5th'],
    [911299066, 'VI, 6th'],
    [528373182, 'VII, 7th'],
    [233284019, 'VIII, 8th'],
    [643664527, '2nd'],
    [537892528, '3rd'],
  ]);

export const languageToTextMap = new Map([
    [163149180, 'English'],
    [773342525, 'Spanish'],
  ]);

export const removeAllErrors = () => {
    const showError = document.getElementById('showError');
    if (showError) {
        showError.style.display = 'none';
    }
}

export const errorMessage = (msg, editedElement) => {
    const showError = document.getElementById('showError');
    if (showError) {
        const escapedMsg = escapeHTML(msg);
        showError.innerHTML = `<p style="color: red; font-style: bold; font-size: 16px;">${escapedMsg}</p>`;
        showError.style.display = 'block';
    }
    if (editedElement && editedElement.focus) editedElement.focus();
}

/**
 * Route new value to the correct validation function based on the value type
 * @param {HTMLElement} newValueElement - the element that was edited
 * @param {string} newValueType - the type of value that was edited
 * @param {boolean} isRequired - whether the value is required or optional
 */
const validateNewValue = (newValueElement, newValueType, isRequired) => {
    let isValid = false;
    switch (newValueType) {
        case 'address':
            isValid = validateAddress(newValueElement, isRequired);
            break;
        case 'city':
            isValid = validateCity(newValueElement, isRequired);
            break;
        case 'day':
            isValid = validateDay(newValueElement, isRequired);
            break;
        case 'email':
            isValid = validateEmail(newValueElement, isRequired);
            break;
        case 'month':
            isValid = validateMonth(newValueElement, isRequired);
            break;
        case 'phoneNumber':
            isValid = validatePhoneNumber(newValueElement, isRequired);
            break;
        case 'name':
            isValid = validateName(newValueElement, isRequired);
            break;    
        case 'year':
            isValid = validateYear(newValueElement, isRequired);
            break;
        case 'zip':
            isValid = validateZip(newValueElement, isRequired);
            break;
        case 'state':
            isValid = validateState(newValueElement, isRequired);
            break;
        case 'none':
        case 'permissionSelector':
        case 'suffix':
            isValid = true;
            break;
        default:
            console.error('Error: Invalid value type in validateNewValue function.');
            break;
    }
    return isValid;
};

export const validateAddress = (addressLineElement, isRequired) => {
    removeAllErrors();

    if (isRequired && !addressLineElement.value) {
        errorMessage('Error: Please enter a value.', addressLineElement);
        return false;
    }
    
    if (addressLineElement.value) {
        // Check character limit (100 characters)
        if (addressLineElement.value.length > 800) {
            errorMessage('Error: Address must be 800 characters or less. Please shorten your input.', addressLineElement);
            return false;
        }
    }
    
    return true;
};

export const validateDay = (dayElement) => {
    removeAllErrors();
    const day = dayElement.value;
    if (!day || day < 1 || day > 31) {
        errorMessage('Error: Must be a valid day 01-31. Please try again.', dayElement);
        return false;
    }
    return true;
};

export const validateEmail = (emailElement, isRequired) => {
    removeAllErrors();
    if (isRequired && !emailElement.value) {
        errorMessage('Error: This field is required. Please enter a value.', emailElement);
        return false;
    }
    
    if (emailElement.value && !validEmailFormat.test(emailElement.value)) {
        errorMessage('Error: The email address format is not valid. Please enter an email address in this format: name@example.com.', emailElement);
        return false;
    }
    return true;
};

export const validateMonth = (monthElement) => {
    removeAllErrors();
    const month = monthElement.value;
    if (!month || month < 1 || month > 12) {
        errorMessage('Error: Must be a valid month 01-12. Please try again.', monthElement);
        return false;
    }
    return true;
};

export const validateName = (textElement, isRequired) => {
    removeAllErrors();

    if (isRequired && !textElement.value) {
        errorMessage('Error: This field is required. Please enter a value.', textElement);
        return false;
    }

    if (textElement.value) {
        if (textElement.value.length > 800) {
            errorMessage('Error: name must be 800 characters or less. Please shorten your input.', textElement);
            return false;
        }

        // Use validNameFormat for name fields (allows international characters)
        if (!validNameFormat.test(textElement.value)) {
            errorMessage('Error: Only letters, dashes, apostrophes, periods, and spaces are allowed. Please try again.', textElement);
            return false;
        }
    }
    return true;
};

export const validatePhoneNumber = (phoneNumberElement, isRequired) => {
    removeAllErrors();
    if (isRequired && !phoneNumberElement.value) {
        errorMessage('At least one phone number is required. Please enter a 10-digit phone number. Example: (999) 999-9999.', phoneNumberElement);
        return false;
    }

    if (phoneNumberElement.value) {
        const phoneDigits = phoneNumberElement.value.replace(/\D/g, '');
        if (phoneDigits.startsWith('0')) {
            errorMessage('Error: Phone number cannot start with 0. Please enter a 10-digit phone number without the country code. Example: (999) 999-9999', phoneNumberElement);
            return false;
        }

        if (!validPhoneNumberFormat.test(phoneDigits)) {
            errorMessage('Please enter a valid phone number format. Example: (999) 999-9999.', phoneNumberElement);
            return false;
        }
    }
    return true;
}

export const validateYear = (yearElement) => {
    removeAllErrors();
    const year = yearElement.value;
    const currentYear = new Date().getFullYear();
    if (!year || year < 1900 || year > currentYear) {
        errorMessage(`Error: Must be a valid year 1900-${currentYear}. Please try again.`, yearElement);
        return false;
    }
    return true;
};

/**
 * Validate mailing state only (always required)
 */
const validateState = (stateElement, isRequired) => {
    removeAllErrors();
    if (isRequired && !stateElement.value) {
        errorMessage('Error: State is required. Please select a value.', stateElement);
        return false;
    }
    return true;
};

export const validateZip = (zipElement) => {
    removeAllErrors();
    const zip = zipElement.value;
    const zipRegExp = /^[0-9]{5}$/;
    if (!zip || !zipRegExp.test(zip)) {
        errorMessage('Error: Must be 5 digits. Please try again.', zipElement);
        return false;
    }
    return true;
};

export const validateCity = (cityElement, isRequired) => {
    removeAllErrors();

    if (isRequired && !cityElement.value) {
        errorMessage('Error: This field is required. Please enter a value.', cityElement);
        return false;
    }

    if (cityElement.value) {
        // Check character limit (800 characters)
        if (cityElement.value.length > 800) {
            errorMessage('Error: City name must be 800 characters or less. Please shorten your input.', cityElement);
            return false;
        }
    }
    return true;
};

// These match validations RegExps in connectApp -> shared.js
export const validEmailFormat = /^[a-zA-Z0-9.!#$%&'*+"\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,63}$/;
export const validNameFormat = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-.]+$/i;
export const validPhoneNumberFormat =
  /^[\+]?(?:1|1-|1\.|1\s+)?[(]?[0-9]{3}[)]?(?:-|\s+|\.)?[0-9]{3}(?:-|\s+|\.)?[0-9]{4}$/;

export const viewParticipantSummary = (participant) => {
    const viewSummaryBtn = document.getElementById('viewSummary');
    if (viewSummaryBtn) {
        viewSummaryBtn.addEventListener('click',  () => {
            // Router handles fetching reports and rendering
            window.location.hash = '#participantSummary';
        })
    }
}

const cleanPhoneNumber = (changedOption) => {
    allPhoneTypes.forEach(phoneNumber => {
        if (phoneNumber in changedOption) {
            changedOption[phoneNumber] = changedOption[phoneNumber].toString().replace(/\D/g, '');
        }
    });
    return changedOption;
};

const firstNameTypes = [fieldMapping.consentFirstName, fieldMapping.fName, fieldMapping.prefName];
const lastNameTypes = [fieldMapping.consentLastName, fieldMapping.lName];

// Only primary phone types go to User Profile history.
export const primaryPhoneTypes = [fieldMapping.cellPhone, fieldMapping.homePhone, fieldMapping.otherPhone];
// All phone types get cleaned for Firestore.
const allPhoneTypes = [...primaryPhoneTypes, fieldMapping.altContactMobilePhone, fieldMapping.altContactHomePhone];

const emailTypes = [fieldMapping.prefEmail, fieldMapping.email1, fieldMapping.email2];

/**
 * Process the user's update and submit the new user data to Firestore.
 * if participant is verified, fetch logged in admin's email (the person processing the edit) to attach to the user's history update.
 * If successful, update the participant data obj and clear the unsaved changes flag.
 * Else, alert the user that the update was unsuccessful.
 * @param {object} participant - the original participant obj
 * @param {object} changedOption - the updated user data obj
 */
export const submitClickHandler = async (participant, changedOption) => {
    const isParticipantVerified = participant[fieldMapping.verifiedFlag] == fieldMapping.verified;
    const adminUserEmail = userSession.getUserEmail();
    const submitButtons = document.getElementsByClassName('updateMemberData');
    
    // Remove existing listeners to prevent duplicates
    for (const button of submitButtons) {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    }
    
    // Add fresh listeners
    const freshSubmitButtons = document.getElementsByClassName('updateMemberData');
    for (const button of freshSubmitButtons) {
        button.addEventListener('click', async (e) => {
            if (Object.keys(changedOption).length === 0) {
                triggerNotificationBanner('No changes to submit. No changes have been made. Please update the form and try again if changes are needed.', 'info');
                return;
            }

            try {
                showAnimation();

                let { changedUserDataForProfile, changedUserDataForHistory } = findChangedUserDataValues(changedOption, participant);
                if (firstNameTypes.some(firstNameKey => firstNameKey in changedUserDataForProfile)) changedUserDataForProfile = handleNameField(firstNameTypes, 'firstName', changedUserDataForProfile, participant);
                if (lastNameTypes.some(lastNameKey => lastNameKey in changedUserDataForProfile)) changedUserDataForProfile = handleNameField(lastNameTypes, 'lastName', changedUserDataForProfile, participant);
                if (primaryPhoneTypes.some(phoneKey => phoneKey in changedUserDataForProfile)) changedUserDataForProfile = handleAllPhoneNoField(changedUserDataForProfile, participant);
                if (emailTypes.some(emailKey => emailKey in changedUserDataForProfile)) changedUserDataForProfile = handleAllEmailField(changedUserDataForProfile, participant);
                
                const isSuccess = await processUserDataUpdate(changedUserDataForProfile, changedUserDataForHistory, participant[fieldMapping.userProfileHistory], participant.state.uid, adminUserEmail, isParticipantVerified);
                if (!isSuccess) {
                    throw new Error('Error: There was an error processing your changes. Please try again.');
                }

                clearUnsaved()
                triggerNotificationBanner('Success! Changes Saved.', 'success');

                const updatedParticipant = updateParticipantAfterFormSave(participant, changedUserDataForProfile);
                renderParticipantDetails(updatedParticipant);

            } catch (error) {
                console.error('Error:', error);
                triggerNotificationBanner('Error: There was an error processing your changes. Please try again.', 'danger');

            } finally {
                hideAnimation();
            }
        });
    }
};

/**
 * Handle the query.frstName and query.lastName fields.
 * Check changedUserDataForProfile the participant profile for all name types. If a name is in changedUserDataForProfile, Add it to the queryNameArray.
 * Else, check the existing participant profile and add that to the queryNameArray.
 * If a nameType is an empty string in changedUserData, don't add it to the queryNameArray even if it exists in the participant profile. The empty string means the participant wants the name removed.
 * Lastly, remove duplicates. This happens when consent name matches the first or last name.
 * @param {array} nameTypes - array of name types to check.
 * @param {string} fieldName - the name of the field to update.
 * @param {object} changedUserDataForProfile - the changed user data.
 * @param {object} participant - the existing participant object.
 */
const handleNameField = (nameTypes, fieldName, changedUserDataForProfile, participant) => {
    const queryNameArray = [];
    nameTypes.forEach(nameType => {
        if (changedUserDataForProfile[nameType]) {
            queryNameArray.push(changedUserDataForProfile[nameType].toLowerCase());
        } else if (participant[nameType] && changedUserDataForProfile[nameType] !== '') {
            queryNameArray.push(participant[nameType].toLowerCase());
        }
    });

    const uniqueNameArray = Array.from(new Set(queryNameArray));

    changedUserDataForProfile[`query.${fieldName}`] = uniqueNameArray;

    return changedUserDataForProfile;
};

/**
 * Handle the allPhoneNo field in the user profile
 * If a number is in the changedUserDataForProfile, the participant has added this phone number. Add it to the allPhoneNo field.
 * Then check the userData profile for an existing value at the field being updated. The participant is updating this phone number. Remove it from the allPhoneNo field.
 * If an empty string is in the changedUserDataForProfile, the participant has removed this phone number. Remove it from the allPhoneNo field.
 */
const handleAllPhoneNoField = (changedUserDataForProfile, participant) => {
    const allPhoneNo = participant.query.allPhoneNo ?? [];
    
    primaryPhoneTypes.forEach(phoneType => {
      if (changedUserDataForProfile[phoneType] && !allPhoneNo.includes(changedUserDataForProfile[phoneType])) {
        allPhoneNo.push(changedUserDataForProfile[phoneType]);
      }
  
      if (changedUserDataForProfile[phoneType] || changedUserDataForProfile[phoneType] === '') {
        const indexToRemove = allPhoneNo.indexOf(participant[phoneType]);  
        if (indexToRemove !== -1) {
          allPhoneNo.splice(indexToRemove, 1);
        }  
      }
    });
  
    changedUserDataForProfile['query.allPhoneNo'] = allPhoneNo;
    
    return changedUserDataForProfile;
  };
  
  /**
   * Handle the allEmails field in the user profile
   * If an email is in the changedUserDataForProfile, the participant has added this email. Add it to the allEmails field.
   * If an email is in the changedUserDataForHistory, the participant has removed this email. Remove it from the allEmails field.
   */
  const handleAllEmailField = (changedUserDataForProfile, participant) => {
    const allEmails = participant.query.allEmails ?? [];
  
    emailTypes.forEach(emailType => {
      if (changedUserDataForProfile[emailType] && !allEmails.includes(changedUserDataForProfile[emailType])) {
        allEmails.push(changedUserDataForProfile[emailType].trim()?.toLowerCase());
      }
  
      if (changedUserDataForProfile[emailType] || changedUserDataForProfile[emailType] === '') {
        const indexToRemove = allEmails.indexOf(participant[emailType]);  
        if (indexToRemove !== -1) {
          allEmails.splice(indexToRemove, 1);
        }  
      }
    });
  
    changedUserDataForProfile['query.allEmails'] = allEmails;
    
    return changedUserDataForProfile;
  };

  /**
 * Iterate the new values, compare them to existing values, and return the changed values.
 * write an empty string to firestore if the history value is null/undefined/empty
 * write an empty string to firestore if the profile value is null/undefined/empty 
 * @param {object} newUserData - the newly entered form fields
 * @param {object} existingUserData - the existing user profile data
 * @returns {changedUserDataForProfile, changedUserDataForHistory} - parallel objects containing the changed values
 * Contact information requires special handling because of the preference selectors
 *   if the user is changing their cell phone number, we need to update the canWeVoicemailMobile and canWeText values
 *   the same is true for homePhone and otherPhone (canWeVoicemailHome and canWeVoicemailOther)
 *   if user deletes a number, set canWeVoicemail and canWeText to '' (empty string)
 *   if user updates a number, ensure the canWeVoicemail and canWeText values are set. Use previous values as fallback.
*/
const findChangedUserDataValues = (newUserData, existingUserData) => {
    const changedUserDataForProfile = {};
    const changedUserDataForHistory = {};
    const excludeHistoryKeys = [fieldMapping.email, fieldMapping.email1, fieldMapping.email2];
    const keysToSkipIfNull = [fieldMapping.canWeText.toString(), fieldMapping.voicemailMobile.toString(), fieldMapping.voicemailHome.toString(), fieldMapping.voicemailOther.toString()];

    newUserData = cleanPhoneNumber(newUserData);

    const altAddressFields = [
        fieldMapping.altAddress1,
        fieldMapping.altAddress2,
        fieldMapping.altCity,
        fieldMapping.altState,
        fieldMapping.altZip
    ];

    // Check if any alt address fields are being modified. Only proceed with alt address checks if fields are being modified.
    const isAltAddressModified = altAddressFields.some(field => field in newUserData);
    if (isAltAddressModified) {
        // Determine whether the alternate address exists based on the new and existing data
        const getDoesAltAddressExistValue = (field) => {
            if (field in newUserData) {
                return newUserData[field];
            }
            return existingUserData[field] || '';
        };

        // Check if any field has a non-empty value after all updates
        const hasAltAddressData = altAddressFields.some(field => {
            const activeAltAddressValue = getDoesAltAddressExistValue(field);
            return activeAltAddressValue && activeAltAddressValue !== '' && activeAltAddressValue !== 'NA';
        });

        changedUserDataForProfile[fieldMapping.doesAltAddressExist] =
            hasAltAddressData ? fieldMapping.yes : fieldMapping.no;
    }

    Object.keys(newUserData).forEach(key => {
        if (newUserData[key] !== existingUserData[key]) {
            changedUserDataForProfile[key] = newUserData[key];
            if (!excludeHistoryKeys.includes(key)) {
                changedUserDataForHistory[key] = existingUserData[key] ?? '';
            }
        }
    });

    if (fieldMapping.cellPhone in changedUserDataForProfile) {
        if (!newUserData[fieldMapping.cellPhone]) {
            changedUserDataForProfile[fieldMapping.voicemailMobile] = fieldMapping.no;
            changedUserDataForProfile[fieldMapping.canWeText] = fieldMapping.no;
        } else {
            changedUserDataForProfile[fieldMapping.voicemailMobile] = newUserData[fieldMapping.voicemailMobile] ?? existingUserData[fieldMapping.voicemailMobile] ?? fieldMapping.no;
            changedUserDataForProfile[fieldMapping.canWeText] = newUserData[fieldMapping.canWeText] ?? existingUserData[fieldMapping.canWeText] ?? fieldMapping.no;
        }

        if (existingUserData[fieldMapping.voicemailMobile]) changedUserDataForHistory[fieldMapping.voicemailMobile] = existingUserData[fieldMapping.voicemailMobile];
        if (existingUserData[fieldMapping.canWeText]) changedUserDataForHistory[fieldMapping.canWeText] = existingUserData[fieldMapping.canWeText];
    }

    if (fieldMapping.homePhone in changedUserDataForProfile) {
        if (!newUserData[fieldMapping.homePhone]) {
            changedUserDataForProfile[fieldMapping.voicemailHome] = fieldMapping.no;
        } else {
            changedUserDataForProfile[fieldMapping.voicemailHome] = newUserData[fieldMapping.voicemailHome] ?? existingUserData[fieldMapping.voicemailHome] ?? fieldMapping.no;
        }

        if (existingUserData[fieldMapping.voicemailHome]) changedUserDataForHistory[fieldMapping.voicemailHome] = existingUserData[fieldMapping.voicemailHome];
    }

    if (fieldMapping.otherPhone in changedUserDataForProfile) {
        if (!newUserData[fieldMapping.otherPhone]) {
            changedUserDataForProfile[fieldMapping.voicemailOther] = fieldMapping.no;
        } else {
            changedUserDataForProfile[fieldMapping.voicemailOther] = newUserData[fieldMapping.voicemailOther] ?? existingUserData[fieldMapping.voicemailOther] ?? fieldMapping.no;
        }

        if (existingUserData[fieldMapping.voicemailOther]) changedUserDataForHistory[fieldMapping.voicemailOther] = existingUserData[fieldMapping.voicemailOther];
    }

    if (fieldMapping.suffix in changedUserDataForProfile) {
        if (!newUserData[fieldMapping.suffix]) {
          changedUserDataForProfile[fieldMapping.suffix] = fieldMapping.noneOfTheseApply;
        }
    }

    keysToSkipIfNull.forEach(key => {
        if (changedUserDataForHistory[key] === '') changedUserDataForHistory[key] = null;
    });

    return { changedUserDataForProfile, changedUserDataForHistory };
};

/**
 * Check whether changes were made to the user profile. If so, update the user profile and history.
 * Only write the history portion if the user is verified. Do not write history if the user is not verified.
 * Specifically, don't write history if the submittedFlag is true but participant[fieldMapping.verifiedFlag] !== fieldMapping.verified.
 * Updated requirement 05/25/2023: do not write emails (prefEmail, additionalEmail1, additionalEmail2) to user history
 * @param {object} changedUserDataForProfile - the changed values to be written to the user profile
 * @param {object} changedUserDataForHistory  - the previous values to be written to history.
 * @param {object} userHistory - the user's existing history
 * @param {string} type - the type of data being changed (e.g. name, contact info, mailing address, log-in email)
 * @returns {boolean} - whether the write operation was successful to control the UI messaging
 */
const processUserDataUpdate = async (changedUserDataForProfile, changedUserDataForHistory, userHistory, participantUid, adminEmail, isParticipantVerified) => {
        if (isParticipantVerified) {
            changedUserDataForProfile[fieldMapping.userProfileHistory] = updateUserHistory(changedUserDataForHistory, userHistory, adminEmail, changedUserDataForProfile[fieldMapping.suffix]);
        }

        changedUserDataForProfile['uid'] = participantUid;
        await postUserDataUpdate(changedUserDataForProfile)
        .catch(function (error) {
            console.error('Error writing document (postUserDataUpdate) ', error);
            return false;
        });
        return true;
};
  
/**
 * Update the user's history based on new data entered by the user. This only triggers if the user's profile is verified.
 * Prepare it for POST to user's proifle in firestore
 * This routine runs once per form submission.
 * First, check for user history and add it to the userProfileHistoryArray.
 * Next, create a new map of the user's changes and add it to the userProfileHistoryArray with a timestamp
 * @param {array of objects} existingDataToUpdate - the existingData to write to history (parallel data structure to newDataToWrite)
 * @param {array of objects} userHistory - the user's existing history
 * @returns {userProfileHistoryArray} -the array of objects to write to user profile history, with the new data added to the end of the array
 */
const updateUserHistory = (existingDataToUpdate, userHistory, adminEmail, newSuffix) => {
    const userProfileHistoryArray = [];
    if (userHistory && Object.keys(userHistory).length > 0) userProfileHistoryArray.push(...userHistory);

    const newUserHistoryMap = populateUserHistoryMap(existingDataToUpdate, adminEmail, newSuffix);
    if (newUserHistoryMap && Object.keys(newUserHistoryMap).length > 0) {
        userProfileHistoryArray.push(newUserHistoryMap);
    }

    return userProfileHistoryArray;
};

/**
 * Delete properties in fields are empty string or 'no' before write to user profile history in firestore
 * @param {array of object} data - The data to write to history
 * @returns {array of object} - this will write to user profile history
 */

const prepareUserHistoryData = (data) => {
    const fields = [
        // Physical adress
        fieldMapping.physicalAddress1,
        fieldMapping.physicalAddress2,
        fieldMapping.physicalCity,
        fieldMapping.physicalState,
        fieldMapping.physicalZip,
        // Alternate adress
        fieldMapping.altAddress1,
        fieldMapping.altAddress2,
        fieldMapping.altCity,
        fieldMapping.altState,
        fieldMapping.altZip,
        fieldMapping.isPOBoxAltAddress,
    ];
    fields.forEach(key => {
        if (data[key] === '' || data[key] === fieldMapping.no) {
            delete data[key];
        }
    });

    return data;
}

const populateUserHistoryMap = (existingData, adminEmail, newSuffix) => {
    const userHistoryMap = {};
    const keys = [
        fieldMapping.fName,
        fieldMapping.mName,
        fieldMapping.lName,
        fieldMapping.suffix,
        fieldMapping.prefName,
        fieldMapping.birthDay,
        fieldMapping.birthMonth,
        fieldMapping.birthYear,
        fieldMapping.dateOfBirthComplete,
        fieldMapping.cellPhone,
        fieldMapping.voicemailMobile,
        fieldMapping.canWeText,
        fieldMapping.homePhone,
        fieldMapping.voicemailHome,
        fieldMapping.otherPhone,
        fieldMapping.voicemailOther,
        // Mailing address
        fieldMapping.address1,
        fieldMapping.address2,
        fieldMapping.city,
        fieldMapping.state,
        fieldMapping.zip,
        fieldMapping.isPOBox,
        // Physical address
        fieldMapping.physicalAddress1,
        fieldMapping.physicalAddress2,
        fieldMapping.physicalCity,
        fieldMapping.physicalState,
        fieldMapping.physicalZip,
        // Alternate adress
        fieldMapping.altAddress1,
        fieldMapping.altAddress2,
        fieldMapping.altCity,
        fieldMapping.altState,
        fieldMapping.altZip,
        fieldMapping.isPOBoxAltAddress,
    ];

    keys.forEach((key) => {
        existingData[key] != null && (userHistoryMap[key] = existingData[key]);
    });

    if (existingData[fieldMapping.cellPhone]) {
        userHistoryMap[fieldMapping.voicemailMobile] = existingData[fieldMapping.voicemailMobile] ?? fieldMapping.no;
        userHistoryMap[fieldMapping.canWeText] = existingData[fieldMapping.canWeText] ?? fieldMapping.no;
    }

    if (existingData[fieldMapping.homePhone]) {
        userHistoryMap[fieldMapping.voicemailHome] = existingData[fieldMapping.voicemailHome] ?? fieldMapping.no;
    }

    if (existingData[fieldMapping.otherPhone]) {
        userHistoryMap[fieldMapping.voicemailOther] = existingData[fieldMapping.voicemailOther] ?? fieldMapping.no;
    }

    if (newSuffix && !existingData[fieldMapping.suffix]) {
        userHistoryMap[fieldMapping.suffix] = fieldMapping.noneOfTheseApply;
    }

    if (Object.keys(userHistoryMap).length > 0) {
        userHistoryMap[fieldMapping.userProfileUpdateTimestamp] = new Date().toISOString();
        userHistoryMap[fieldMapping.profileChangeRequestedBy] = adminEmail;

        // temp pull out - adding back early June
        // return prepareUserHistoryData(userHistoryMap);
        
        return userHistoryMap;
    } else {
        return null;
    }
};

export const postUserDataUpdate = async (changedUserData) => {
    try {
        const idToken = await getIdToken();
        const response = await fetch(`${baseAPI}/dashboard?api=updateParticipantDataNotSite`, {
            method: "POST",
            headers:{
                Authorization: "Bearer " + idToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(changedUserData)
        });

        if (!response.ok) { 
            const error = (response.status + ": " + (await response.json()).message);
            throw new Error(error);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in postUserDataUpdate:', error);
        throw error;
    }
}

// Check if user is NORC or CCC staff (but not site staff).
export const getIsNORCOrCCC = () => {
    const adminUserEmail = userSession.getUserEmail();
    const permDomains = /(nih.gov|norc.org)$/i;
    return permDomains.test(adminUserEmail.split('@')[1]);
}
