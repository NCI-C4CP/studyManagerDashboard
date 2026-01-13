import fieldMapping from './fieldToConceptIdMapping.js';
import { renderParticipantDetails } from './participantDetails.js';
import { findParticipant } from './participantLookup.js';
import { appState, participantState, roleState, userSession, markUnsaved, clearUnsaved, invalidateSearchResultsCache } from './stateManager.js';
import { baseAPI, getDataAttributes, getIdToken, hideAnimation, showAnimation, triggerNotificationBanner, escapeHTML } from './utils.js';
import { getCountryCode3List, getCountryNameByCode3 } from './countryMapping.js';

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

const countryCodes = getCountryCode3List();

export const getFieldValues = (variableValue, conceptId) => {
    if (!variableValue || (conceptId === "Change Login Email" && variableValue.startsWith("noreply"))) return "";
    if (variableValue in fieldValues) return fieldValues[variableValue];
    if (countryCodes.includes(variableValue)) return getCountryNameByCode3(variableValue);

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
        const forceAllChars = input.dataset.forceAllChars === 'true';
        if (forceAllChars) {
            return;
        }
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
        const forceAllChars = event.target.dataset.forceAllChars === 'true';
        if (forceAllChars) {
            return;
        }
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

export const isAddressInternational = (participant, changedOption, fieldMappingKey) => {
    if (changedOption[fieldMappingKey]) {
        return parseInt(changedOption[fieldMappingKey], 10) === fieldMapping.yes ? true : false;
    } else if (participant[fieldMappingKey]) {
        return parseInt(participant[fieldMappingKey],10) === fieldMapping.yes ? true : false;
    }
    return false;
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

    const isMailingInternational = isAddressInternational(participant, changedOption, fieldMapping.isIntlAddr);
    const isPhysicalInternational = isAddressInternational(participant, changedOption, fieldMapping.physicalAddrIntl);
    const isAltInternational = isAddressInternational(participant, changedOption, fieldMapping.isIntlAltAddress);

    const { coordinatingCenter, helpDesk } = roleState.getRoleFlags();

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
        { field: fieldMapping.isIntlAddr,
            label: 'Mailing Address is International Address',
            editable: isEditable,
            display: true,
            validationType: 'permissionSelector',
            isRequired: true
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
        { field: fieldMapping.address3,
            label: 'Mailing Address Line 3',
            editable: isEditable && isMailingInternational,
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
            label: 'Mailing Address State / Region',
            editable: isEditable,
            display: true,
            validationType: isMailingInternational ? 'none' : 'state',
            isRequired: isMailingInternational ? false : true
        },
        { field: fieldMapping.zip,
            label: 'Mailing Address Zip / Postal Code',
            editable: isEditable,
            display: true,
            validationType: isMailingInternational ? 'none' : 'zip',
            isRequired: true
        },
        { field: fieldMapping.country,
            label: 'Mailing Address Country',
            editable: isEditable && isMailingInternational,
            display: true,
            validationType: 'none',
            isRequired: false
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
            label: 'Physical Address (if different from mailing address)',
            editable: false,
            display: true,
            validationType: 'none',
            isRequired: false,
            isHeading: true,
        },
        { field: fieldMapping.physicalAddrIntl,
            label: 'Physical Address is International Address',
            editable: isEditable,
            display: true,
            validationType: 'permissionSelector',
            isRequired: true
        },
        { field: fieldMapping.physicalAddress1,
            label: 'Physical Address Line 1',
            editable: isEditable,
            display: true,
            validationType: 'address',
            isRequired: false
        },
        { field: fieldMapping.physicalAddress2,
            label: 'Physical Address Line 2',
            editable: isEditable,
            display: true,
            validationType: 'address',
            isRequired: false
        },
        { field: fieldMapping.physicalAddress3,
            label: 'Physical Address Line 3',
            editable: isEditable && isPhysicalInternational,
            display: true,
            validationType: 'address',
            isRequired: false
        },
        { field: fieldMapping.physicalCity,
            label: 'Physical City',
            editable: isEditable,
            display: true,
            validationType: 'city',
            isRequired: false
        },
        { field: fieldMapping.physicalState,
            label: 'Physical State / Region',
            editable: isEditable,
            display: true,
            validationType: isPhysicalInternational ? 'none' : 'state',
            isRequired: false
        },
        { field: fieldMapping.physicalZip,
            label: 'Physical Zip / Postal Code',
            editable: isEditable,
            display: true,
            validationType: isPhysicalInternational ? 'none' : 'zip',
            isRequired: false
        },
        { field: fieldMapping.physicalCountry,
            label: 'Physical Address Country',
            editable: isEditable && isPhysicalInternational,
            display: true,
            validationType: 'none',
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
        { field: fieldMapping.isIntlAltAddress,
            label: 'Alternate Address is International Address',
            editable: isEditable,
            display: true,
            validationType: 'permissionSelector',
            isRequired: true
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
        { field: fieldMapping.altAddress3,
            label: 'Alternate Address Line 3',
            editable: isEditable && isAltInternational,
            display: true,
            validationType: 'address',
            isRequired: false
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
            label: 'Alternate State / Region',
            editable: isEditable,
            display: true,
            validationType: isAltInternational ? 'none' : 'state',
            isRequired: false,
        },
        {
            field: fieldMapping.altZip,
            label: 'Alternate Zip / Postal Code',
            editable: isEditable,
            display: true,
            validationType: isAltInternational ? 'none' : 'zip',
            isRequired: false,
        },
        { field: fieldMapping.altCountry,
            label: 'Alternate Address Country',
            editable: isEditable && isAltInternational,
            display: true,
            validationType: 'none',
            isRequired: false
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
            editable: (helpDesk || coordinatingCenter) && isEditable,
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
        invalidateSearchResultsCache();
        const query = `token=${token}`;
        const response = await findParticipant(query);

        if (response.code === 200 && response.data && response.data[0]) {
            const participant = response.data[0];
            
            await renderParticipantDetails(participant);
            
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

export const resetChanges = async (participant) => {
    const cancelButtons = [document.getElementById("cancelChangesUpper"), document.getElementById("cancelChangesLower")];

    const handleCancelChanges = async () => {
        if (appState.getState().hasUnsavedChanges) {
            await renderParticipantDetails(participant);
            clearUnsaved();
            triggerNotificationBanner('Changes cancelled.', 'warning');
        }
    };

    cancelButtons.forEach(button => {
        if (button) {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener("click", async () => {
                await handleCancelChanges();
            });
        }
    });
}

/**
 * Handle the listeners for the login update forms
 * for login updates (email or phone), authUpdateObj and changedOption are generated from the form
 * for login removal, authUpdateObj and changedOption are generated from the participant object
 */
export const attachUpdateLoginMethodListeners = (participantAuthenticationEmail, participantAuthenticationPhone) => {
    const createListener = (loginType) => {
        const typeName = capitalizeFirstLetter(loginType);
        return () => {
            const modal = document.getElementById('modalShowMoreData');
            const header = modal?.querySelector('#modalHeader');
            const body = modal?.querySelector('#modalBody');
            if (!header || !body) {
                triggerNotificationBanner('Error opening edit modal. Please refresh and try again.', 'danger');
                return;
            }
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
                    const { authUpdateObj, changedOption } = getUpdatedAuthenticationFormValues(participantAuthenticationEmail, participantAuthenticationPhone);
                    if (authUpdateObj && changedOption) {
                        await processParticipantLoginMethod(participantAuthenticationEmail, authUpdateObj, changedOption, 'update');
                    }
                });
            }

            if (loginType === 'email') {
                const removeEmailLoginBtn = document.getElementById('removeUserLoginEmail');
                if (removeEmailLoginBtn) {
                    removeEmailLoginBtn.addEventListener('click', async () => {
                        await processParticipantLoginMethod(participantAuthenticationEmail, {}, {}, 'removeEmail');
                    });
                }
            }

            if (loginType === 'phone') {
                const removePhoneLoginBtn = document.getElementById('removeUserLoginPhone');
                if (removePhoneLoginBtn) {
                    removePhoneLoginBtn.addEventListener('click', async () => {
                        await processParticipantLoginMethod(participantAuthenticationEmail, {}, {}, 'removePhone');
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
    const authUpdateObj = {};
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
        authUpdateObj['phone'] = cleanedPhoneNumber;
        authUpdateObj['flag'] = 'updatePhone';
        changedOption[fieldMapping.signInMechanism] = 'phone';
        changedOption[fieldMapping.accountPhone] = `+1`+ cleanedPhoneNumber;
    } else if (emailField &&  emailField.value === document.getElementById('confirmEmail').value) {
        if (!validEmailFormat.test(emailField.value)) {
            alert('Invalid email format. Please enter a valid email address in the format: abc@example.com');
            return {}, {};
        }
        authUpdateObj['email'] = emailField.value;
        authUpdateObj['flag'] = 'updateEmail';
        changedOption[fieldMapping.signInMechanism] = 'password';
        changedOption[fieldMapping.accountEmail] = emailField.value;
    } else {
        alert(`Your entered inputs don't match`);
        return {}, {};
    }

    if ((phoneField && phoneField.value && participantAuthenticationEmail && !participantAuthenticationEmail.startsWith('noreply')) || (emailField && emailField.value && !emailField.value.startsWith('noreply') && participantAuthenticationPhone)) {
        changedOption[fieldMapping.signInMechanism] = 'passwordAndPhone';
    }

    return { authUpdateObj, changedOption };
}

const getLoginRemovalAuthData = (processType, participantAuthenticationEmail, participantUid) => {
    const removalAuthData = {};
    const removalChangedData = {};
    if (processType === 'removeEmail') {
        const placeholderForEmailRemoval = `noreply${participantUid}@NCI-C4CP.github.io`;
        removalAuthData['email'] = placeholderForEmailRemoval;
        removalAuthData['flag'] = 'updateEmail';
        removalChangedData[fieldMapping.accountEmail] = placeholderForEmailRemoval;
        removalChangedData[fieldMapping.signInMechanism] = 'phone';
    } else if (processType === 'removePhone') {
        removalAuthData['email'] = participantAuthenticationEmail;
        removalAuthData['flag'] = 'replaceSignin';
        removalChangedData[fieldMapping.accountPhone] = '';
        removalChangedData[fieldMapping.signInMechanism] = 'password';
    }
    return { removalAuthData, removalChangedData };
};

/**
 * Process the participant's login method
 * Possibilities include: update email, update phone, remove email, remove phone
 * Removal of one auth method is only possible if the participant has both an email and phone login
 * For update operations: authUpdateObj is populated from the form and passed in
 * For removal operations: authUpdateObj is populated inside this function based on current login information
 * Post updated login data to Firebase Auth. On success, also post updated login data to Firestore
 * @param {string} participantAuthenticationEmail - the participant's current email login 
 * @param {object} authUpdateObj - the data object sent to firebaseAuth to update the participant's login method
 * @param {object} changedOption - the data object sent to firestore to update the participant's login data
 * @param {string} processType - the type of process to be performed -> update, removeEmail, removePhone
 */
const processParticipantLoginMethod = async (participantAuthenticationEmail, authUpdateObj, changedOption, processType) => {
    const participant = participantState.getParticipant();
    const participantUid = participant['state']['uid'];
    const participantToken = participant['token'];
    authUpdateObj['uid'] = participantUid;
    changedOption['token'] = participantToken;

    if (processType === 'removeEmail' || processType === 'removePhone') {
        
        // Validate that we have the required email for removal operations
        if (processType === 'removePhone' && !participantAuthenticationEmail) {
            throw new Error('Cannot remove phone login: participant authentication email is required');
        }
        
        // Get the removal-specific data and merge it with existing objects
        const { removalAuthData, removalChangedData } = getLoginRemovalAuthData(processType, participantAuthenticationEmail, participantUid);
        
        // Merge removal data with existing objects instead of overwriting
        Object.assign(authUpdateObj, removalAuthData);
        Object.assign(changedOption, removalChangedData);
    }

    const confirmation = confirm('Are you sure you want to continue with this update?');
    if (confirmation) {
        try {
            showAnimation();
            const isParticipantConsented = participant[fieldMapping.consentFlag] === fieldMapping.yes;
            if (isParticipantConsented) {
                if (primaryPhoneTypes.some(phoneKey => phoneKey in changedOption)) {
                    changedOption = handleQueryArrayField(
                        primaryPhoneTypes,
                        'query.allPhoneNo',
                        normalizePhoneForQuery,
                        changedOption,
                        participant
                    );
                }
                if (primaryEmailTypes.some(emailKey => emailKey in changedOption)) {
                    changedOption = handleQueryArrayField(
                        primaryEmailTypes,
                        'query.allEmails',
                        normalizeEmailForQuery,
                        changedOption,
                        participant,
                        (val) => !val.startsWith('noreply')
                    );
                }
            }

            // Validate required fields
            if (!authUpdateObj.uid) {
                throw new Error('Missing uid in auth update payload');
            }
            if (!authUpdateObj.flag) {
                throw new Error('Missing flag in auth update payload');
            }

            const url = `${baseAPI}/dashboard?api=updateUserAuthentication`;
            const signinMechanismPayload = { "data": authUpdateObj };
            
            const idToken = await getIdToken();
            const response = await postLoginData(url, signinMechanismPayload, idToken);
            const responseJSON = await response.json();

            if (response.status === 200) {
                const updateResult = await updateParticipantFirestoreProfile(changedOption, idToken);
                if (!updateResult) {
                    showAuthUpdateAPIError('modalBody', "IMPORTANT: There was an error updating the participant's profile.\n\nPLEASE PROCESS THE OPERATION AGAIN.");
                    console.error('Failed to update participant Firestore profile');

                } else {
                    await updateUIOnAuthResponse(changedOption, responseJSON, response.status);
                }

            } else {
                showAuthUpdateAPIError('modalBody', responseJSON.message);
            }

        } catch (error) {
            console.error(error);
            showAuthUpdateAPIError('modalBody', 'Operation Unsuccessful!');

        } finally {
            hideAnimation();
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
        console.error(`Error in updating participant data (updateParticipantFirestoreProfile()): ${responseJSON.error || responseJSON.message || 'Unknown error'}`);
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

const updateUIOnAuthResponse = async (changedOption, responseData, status) => {
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
    const modal = document.getElementById('modalShowMoreData');
    const body = modal?.querySelector(`#${bodyId}`) || document.getElementById(bodyId);
    if (!body) return false;
    body.innerHTML = `<div>${message}</div>`;
    return false;
}

export const updateParticipantAfterFormSave = async (participant, changedUserDataForProfile) => {
    const updatedParticipant = { ...participant };

    // Handles nested keys instead of shallow merge with ...changedUserDataForProfile
    Object.entries(changedUserDataForProfile).forEach(([key, value]) => {
        if (typeof key === 'string' && key.includes('.')) {
            const pathSegments = key.split('.');
            const finalKey = pathSegments[pathSegments.length - 1];
            let target = updatedParticipant;
            for (let i = 0; i < pathSegments.length - 1; i++) {
                const segment = pathSegments[i];
                const currentValue = target[segment];
                if (typeof currentValue !== 'object' || currentValue === null) {
                    target[segment] = {};
                }
                target = target[segment];
            }
            target[finalKey] = value;
        } else {
            updatedParticipant[key] = value;
        }
    });

    await participantState.setParticipant(updatedParticipant);
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
                    requestAnimationFrame(async () => {
                        await renderParticipantDetails(participant, changedOption, null, { preserveScrollPosition: true });
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
                    requestAnimationFrame(async () => {
                        await renderParticipantDetails(participant, changedOption, null, { preserveScrollPosition: true });
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
        fieldMapping.isPOBoxAltAddress,
        fieldMapping.isIntlAddr,
        fieldMapping.physicalAddrIntl,
        fieldMapping.isIntlAltAddress
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
            // Router handles fetching reports and rendering - navigate to summary tab
            window.location.hash = '#participantDetails/summary';
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

// Only primary phone types go to the query.allPhoneNo array (used for participant search). All phone types get cleaned for Firestore.
// Edge case: Account phone number (Firebase Auth login) retains the +1 prefix in the participant profile, but not in the query.allPhoneNo array.
export const primaryPhoneTypes = [fieldMapping.cellPhone, fieldMapping.homePhone, fieldMapping.otherPhone, fieldMapping.accountPhone];
const allPhoneTypes = [...primaryPhoneTypes, fieldMapping.altContactMobilePhone, fieldMapping.altContactHomePhone];
const primaryEmailTypes = [fieldMapping.accountEmail, fieldMapping.prefEmail, fieldMapping.email1, fieldMapping.email2];

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
                if (firstNameTypes.some(firstNameKey => firstNameKey in changedUserDataForProfile)) {
                    changedUserDataForProfile = handleQueryArrayField(
                        firstNameTypes,
                        'query.firstName',
                        normalizeNameForQuery,
                        changedUserDataForProfile,
                        participant
                    );
                }
                if (lastNameTypes.some(lastNameKey => lastNameKey in changedUserDataForProfile)) {
                    changedUserDataForProfile = handleQueryArrayField(
                        lastNameTypes,
                        'query.lastName',
                        normalizeNameForQuery,
                        changedUserDataForProfile,
                        participant
                    );
                }

                // There isn't currently a likely case where a participant has not consented and other profile data is being updated.
                // However, these two arrays will not exist or be created/updated pre-consent, so this check is a safeguard.
                const isParticipantConsented = participant[fieldMapping.consentFlag] === fieldMapping.yes;
                if (isParticipantConsented) {
                    if (primaryPhoneTypes.some(phoneKey => phoneKey in changedUserDataForProfile)) {
                        changedUserDataForProfile = handleQueryArrayField(
                            primaryPhoneTypes,
                            'query.allPhoneNo',
                            normalizePhoneForQuery,
                            changedUserDataForProfile,
                            participant
                        );
                    }
                    if (primaryEmailTypes.some(emailKey => emailKey in changedUserDataForProfile)) {
                        changedUserDataForProfile = handleQueryArrayField(
                            primaryEmailTypes,
                            'query.allEmails',
                            normalizeEmailForQuery,
                            changedUserDataForProfile,
                            participant,
                            (val) => !val.startsWith('noreply')
                        );
                    }
                }
                
                const isSuccess = await processUserDataUpdate(changedUserDataForProfile, changedUserDataForHistory, participant[fieldMapping.userProfileHistory], participant.state.uid, adminUserEmail, isParticipantVerified);
                if (!isSuccess) {
                    throw new Error('Error: There was an error processing your changes. Please try again.');
                }

                invalidateSearchResultsCache();
                clearUnsaved();
                triggerNotificationBanner('Success! Changes Saved.', 'success');

                const updatedParticipant = await updateParticipantAfterFormSave(participant, changedUserDataForProfile);
                const resetChanges = {};
                await renderParticipantDetails(updatedParticipant, resetChanges, 'details', { preserveScrollPosition: true });

            } catch (error) {
                console.error('Error:', error);
                triggerNotificationBanner('Error: There was an error processing your changes. Please try again.', 'danger');

            } finally {
                hideAnimation();
            }
        });
    }
};

const compareArraysIgnoreOrder = (a = [], b = []) => {
    if (a.length !== b.length) return false;
    const setA = new Set(a);
    for (const val of b) {
        if (!setA.has(val)) return false;
    }
    return true;
};

/**
 * Remove +1 prefix, keep only 10 digits for consistent search experience
 * @param {string} phoneNumber - phone number with or without +1 prefix
 * @returns {string} - 10-digit phone number for search
 */
const normalizePhoneForQuery = (phoneNumber) => {
    if (!phoneNumber) return '';
    // Remove +1 prefix and any non-digit characters, then take last 10 digits
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
};

const normalizeEmailForQuery = (email) => {
    return (email || '').trim().toLowerCase();
};

const normalizeNameForQuery = (name) => {
    return (name || '').trim().toLowerCase();
};

/**
 * Address field groups used for USPS validation flags and history tracking.
 * Mailing address CIDs.
 */
export const mailingAddressKeys = [
    fieldMapping.isIntlAddr,
    fieldMapping.address1,
    fieldMapping.address2,
    fieldMapping.address3,
    fieldMapping.city,
    fieldMapping.state,
    fieldMapping.zip,
    fieldMapping.country,
    fieldMapping.isPOBox,
];

/**
 * Physical address CIDs.
 */
export const physicalAddressKeys = [
    fieldMapping.physicalAddrIntl,
    fieldMapping.physicalAddress1,
    fieldMapping.physicalAddress2,
    fieldMapping.physicalAddress3,
    fieldMapping.physicalCity,
    fieldMapping.physicalState,
    fieldMapping.physicalZip,
    fieldMapping.physicalCountry,
];

/**
 * Alternate address CIDs (optional alternate contact address).
 */
export const altAddressKeys = [
    fieldMapping.isIntlAltAddress,
    fieldMapping.altAddress1,
    fieldMapping.altAddress2,
    fieldMapping.altAddress3,
    fieldMapping.altCity,
    fieldMapping.altState,
    fieldMapping.altZip,
    fieldMapping.altCountry,
    fieldMapping.isPOBoxAltAddress,
];

/**
 * If any address fields for a given address type are updated, mark the corresponding USPS validation
 * flag as "unvalidated". We do not run USPS validation in this app, but we do run it in the PWA.
 *
 * @param {Object} changedUserDataForProfile - The object with participant profile updates.
 * @returns {Object} - The same object with USPS "unvalidated" flags when applicable.
 */
export const applyUSPSUnvalidatedFlags = (changedUserDataForProfile) => {
    if (!changedUserDataForProfile || typeof changedUserDataForProfile !== 'object') return changedUserDataForProfile;

    const hasAnyKey = (keys) =>
        keys.some((k) => Object.prototype.hasOwnProperty.call(changedUserDataForProfile, k));

    if (hasAnyKey(mailingAddressKeys)) {
        changedUserDataForProfile[fieldMapping.isMailingAddressUSPSUnvalidated] = fieldMapping.yes;
    }
    if (hasAnyKey(physicalAddressKeys)) {
        changedUserDataForProfile[fieldMapping.isPhysicalAddressUSPSUnvalidated] = fieldMapping.yes;
    }
    if (hasAnyKey(altAddressKeys)) {
        changedUserDataForProfile[fieldMapping.isAltAddressUSPSUnvalidated] = fieldMapping.yes;
    }

    return changedUserDataForProfile;
};

/**
 * Build a query array from: `changed` (if provided) otherwise from `participant`
 * Empty strings and falsy values are skipped; uniqueness enforced via Set
 */
const buildQueryArray = (participant, changed, types, normalizeFn, filterFn) => {
    const values = new Set();
    types.forEach((fieldType) => {
        if (Object.prototype.hasOwnProperty.call(changed, fieldType)) {
            const raw = changed[fieldType];
            if (raw) {
                const normalized = normalizeFn(raw);
                if (normalized && (!filterFn || filterFn(normalized))) values.add(normalized);
            }
        } else if (participant && participant[fieldType]) {
            const normalized = normalizeFn(participant[fieldType]);
            if (normalized && (!filterFn || filterFn(normalized))) values.add(normalized);
        }
    });
    return Array.from(values);
};

// Handler to keep query.* arrays in sync with profile changes
const handleQueryArrayField = (types, queryKey, normalizeFn, changedUserDataForProfile, participant, filterFn = null) => {
    const [rootKey, arrayKey] = queryKey.split('.');
    const existingArray = rootKey && arrayKey && Array.isArray(participant?.[rootKey]?.[arrayKey])
        ? participant[rootKey][arrayKey]
        : [];

    const nextArray = buildQueryArray(participant, changedUserDataForProfile, types, normalizeFn, filterFn);

    if (!compareArraysIgnoreOrder(nextArray, existingArray)) {
        changedUserDataForProfile[queryKey] = nextArray;
    }

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
export const findChangedUserDataValues = (newUserData, existingUserData) => {
    const changedUserDataForProfile = {};
    const changedUserDataForHistory = {};
    const excludeHistoryKeys = new Set([fieldMapping.email, fieldMapping.email1, fieldMapping.email2].map(String));
    const keysToSkipIfNull = [fieldMapping.canWeText.toString(), fieldMapping.voicemailMobile.toString(), fieldMapping.voicemailHome.toString(), fieldMapping.voicemailOther.toString()];

    newUserData = cleanPhoneNumber(newUserData);

    // Check if any alt address fields are being modified. Only proceed with alt address checks if fields are being modified.
    const isAltAddressModified = altAddressKeys.some(field => field in newUserData);
    if (isAltAddressModified) {
        // Alt address has specific doesAltAddressExist flag
        // Determine whether the alternate address exists based on the new and existing data
        const getDoesAltAddressExistValue = (field) => {
            if (field in newUserData) {
                return newUserData[field];
            }
            return existingUserData[field] || '';
        };

        const isValidAltAddressUpdate = (value) => {
            if (value == null || value === '' || value === 'NA') return false;

            // Treat "no" as "no data" so we don't mark the alt address as existing due to falsy/negative flags.
            if (value?.toString?.() === fieldMapping.no.toString()) return false;
            return true;
        };

        // Check if any field has a non-empty value after all updates
        const hasAltAddressData = altAddressKeys.some(field => {
            const activeAltAddressValue = getDoesAltAddressExistValue(field);
            return isValidAltAddressUpdate(activeAltAddressValue);
        });

        changedUserDataForProfile[fieldMapping.doesAltAddressExist] =
            hasAltAddressData ? fieldMapping.yes : fieldMapping.no;
    }

    Object.keys(newUserData).forEach(key => {
        if (newUserData[key] !== existingUserData[key]) {
            changedUserDataForProfile[key] = newUserData[key];
            if (!excludeHistoryKeys.has(key)) {
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

    // If any address values were updated, mark corresponding USPS validation flags as unvalidated.
    // USPS address validation happens in the PWA, but not in SMDB.
    const profileKeysBeforeUSPS = new Set(Object.keys(changedUserDataForProfile));
    applyUSPSUnvalidatedFlags(changedUserDataForProfile);
    Object.keys(changedUserDataForProfile).forEach((key) => {
        if (!profileKeysBeforeUSPS.has(key)) {
            if (!Object.prototype.hasOwnProperty.call(changedUserDataForHistory, key)) {
                changedUserDataForHistory[key] = existingUserData[key] ?? '';
            }
        }
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
export const updateUserHistory = (existingDataToUpdate, userHistory, adminEmail, newSuffix) => {
    const userProfileHistoryArray = [];
    if (userHistory && Object.keys(userHistory).length > 0) userProfileHistoryArray.push(...userHistory);

    const newUserHistoryMap = populateUserHistoryMap(existingDataToUpdate, adminEmail, newSuffix);
    if (newUserHistoryMap && Object.keys(newUserHistoryMap).length > 0) {
        userProfileHistoryArray.push(newUserHistoryMap);
    }

    return userProfileHistoryArray;
};

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
        // Address field groups
        ...mailingAddressKeys,
        ...physicalAddressKeys,
        ...altAddressKeys,
        // USPS validation flags
        fieldMapping.isMailingAddressUSPSUnvalidated,
        fieldMapping.isPhysicalAddressUSPSUnvalidated,
        fieldMapping.isAltAddressUSPSUnvalidated,
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
