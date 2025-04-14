import { dashboardNavBarLinks, removeActiveClass } from './navigationBar.js';
import { renderParticipantHeader } from './participantHeader.js';
import { findParticipant, renderLookupResultsTable } from './participantLookup.js';
import { renderParticipantDetails } from './participantDetails.js';
import fieldMapping from './fieldToConceptIdMapping.js'; 
import { baseAPI, getIdToken, hideAnimation, showAnimation } from './utils.js';


export const renderReplacementKitRequest = (participant) => {
    document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks();
    removeActiveClass('nav-link', 'active');
    document.getElementById('replaceHomeCollectionBtn').classList.add('active');

    mainContent.innerHTML = render(participant);
    bindEventRequestReplacementButton(participant?.['Connect_ID'], participant?.token);
    bindActionReturnSearchResults();
};

const renderReplacementScreen = (kitAlreadyReceived) => {
    return `<div>Request a Home Mouthwash Replacement Kit</div>
                <div><span class="text-danger">NOTE:</span> Make sure you have verified the mailing address with the participant before entering this request and have updated the address in the User Profile if needed.
</div>${
    kitAlreadyReceived ? 
        '<div><span class="text-danger">A home mouthwash kit for this participant has already been received. Please confirm the need for a replacement kit before clicking Request Replacement below.</span></div>' : 
        ''
    }
    <div>
        <button
            id="requestReplacementKitBtn"
            class="btn btn-primary"
            data-toggle="modal" 
            data-target="#modalSuccess"
            name="modalResetParticipant"
        >
            Request Replacement
        </button>
    </div>`;
}

const render = (participant) => {
    let template = `<div class="container">`
    if (!participant) {
        template +=` 
            <div id="root">
                Please select a participant first!
            </div>
        </div>
        `
    } else {
        
        const initialKitStatus = participant[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[fieldMapping.bioKitMouthwash]?.[fieldMapping.kitStatus];
        const replacementKit1Status = participant[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[fieldMapping.bioKitMouthwashBL1]?.[fieldMapping.kitStatus];

        let resetTextTemplate = ``;
        // Is the user's address valid?
        const poBoxRegex = /^(?:P\.?\s*O\.?\s*(?:Box|B\.?)?|Post\s+Office\s+(?:Box|B\.?)?)\s*(\s*#?\s*\d*)((?:\s+(.+))?$)$/i;
        const physicalAddressLineOne = participant[fieldMapping.physicalAddress1];
        const mailingAddressLineOne = participant[fieldMapping.address1];
        if (
            (!physicalAddressLineOne || poBoxRegex.test(physicalAddressLineOne)) &&
            (!mailingAddressLineOne || poBoxRegex.test(mailingAddressLineOne))
        ) {
            resetTextTemplate = `<div>Participant address is invalid; cannot send home mouthwash kit.</div>`;
        } else {
            if (participant[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[fieldMapping.bioKitMouthwashBL2]) {
                // If two replacements, they are out of replacement kits; prevent further.
                resetTextTemplate = `<div>Participant has already used supported number of replacement kits.</div>`;
            } else if (participant[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[fieldMapping.bioKitMouthwashBL1]) {
    
                // If one replacement, mark as eligible for second replacement
                switch(replacementKit1Status) {
                    case undefined:
                    case null:
                    case fieldMapping.kitStatusValues.pending: {
                        resetTextTemplate = '<div>This participant is not eligible for a second replacement home mouthwash kit</div>';
                        break;
                    }
                    case fieldMapping.kitStatusValues.addressUndeliverable: {
                        resetTextTemplate = `<div>Participant address is invalid; cannot send home mouthwash kit.</div>`;
                        break;
                    }
                    case fieldMapping.kitStatusValues.initialized:
                    case fieldMapping.kitStatusValues.addressPrinted:
                    case fieldMapping.kitStatusValues.assigned: {
                        resetTextTemplate = '<div>This participant\'s first replacement home mouthwash kit has not been sent</div>';
                        break;
                    }
                    
                    case fieldMapping.kitStatusValues.shipped:
                        resetTextTemplate = renderReplacementScreen();
                        break;
                    case fieldMapping.kitStatusValues.received:
                        resetTextTemplate = renderReplacementScreen(true);
                        break;
                    default:
                        resetTextTemplate = '<div>Unrecognized kit status ' + replacementKit1Status + '</div>';
                }
            } else if(participant?.[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[fieldMapping.bioKitMouthwash]) {
                switch(initialKitStatus) {
                    case undefined:
                    case null:
                    case fieldMapping.kitStatusValues.pending: {
                        resetTextTemplate = '<div>This participant is not yet eligible for a home mouthwash kit</div>';
                        break;
                    }
                    case fieldMapping.kitStatusValues.addressUndeliverable: {
                        resetTextTemplate = `<div>Participant address is invalid; cannot send home mouthwash kit.</div>`;
                        break;
                    }
                    case fieldMapping.kitStatusValues.initialized:
                    case fieldMapping.kitStatusValues.addressPrinted:
                    case fieldMapping.kitStatusValues.assigned: {
                        resetTextTemplate = '<div>This participant\'s initial home mouthwash kit has not been sent</div>';
                        break;
                    }
                    case fieldMapping.kitStatusValues.shipped:
                        // Eligible for first replacement
                        resetTextTemplate = renderReplacementScreen();
                        break;
                    case fieldMapping.kitStatusValues.received:
                        resetTextTemplate =  renderReplacementScreen(true);
                        break;
                    default:
                        resetTextTemplate = '<div>Unrecognized kit status ' + initialKitStatus + '/<div>';
                }
            } else {
                resetTextTemplate = '<div>This participant is not yet eligible for a home mouthwash kit OR their initial home mouthwash kit has not yet been sent</div>';
            }
        }


        template += `
            <div id="root" > 
            <div id="alert_placeholder"></div>
            <div class="modal fade" id="modalSuccess" data-keyboard="false" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
                    <div class="modal-content sub-div-shadow">
                        <div class="modal-header" id="modalHeader"></div>
                        <div class="modal-body" id="modalBody"></div>
                    </div>
                </div>
            </div>
            ${renderParticipantHeader(participant)}
            <div><h2>Home Mouthwash Replacement Kits</h1></div>
            ${resetTextTemplate}
            ${renderBackToSearchDivAndButton()}
            
        `;
        

        /**
         * kitStatus options:
         * pending: 517216441,
            initialized: 728267588,
            addressPrinted: 849527480,
            assigned: 241974920,
            shipped: 277438316,
            received: 375535639,

         * Considerations:
         * * User not currently eligible for MW (list why?)
         * * User eligible for MW but first kit has not yet been assigned (kitStatus of initialized)
         * * User has returned home MW and it has been received
         * * User is eligible for MW and has no replacements yet (kitStatus of addressPrinted)
         * * User is eligible for MW and has one replacement
         * * User is eligible for MW and has two replacements
         */
    }
    return template;
}

const bindEventRequestReplacementButton = (connectId, token) => {
    const requestReplacementButton = document.getElementById('requestReplacementKitBtn');
    if (requestReplacementButton) {
        requestReplacementButton.addEventListener('click', async () => {
            try {
                showAnimation();

                await requestReplacementKit(connectId);

                const header = document.getElementById('modalHeader');
                const body = document.getElementById('modalBody');  
                header.innerHTML = `
                        <h5>Success! Replacement requested.</h5>
                        <button type="button" id="closeModal" class="modal-close-btn" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    `
                body.innerHTML = `<div>
                    Please wait while we refresh the participant information and navigate to the participant details page.
                </div>`

                // Notify user of success and refresh the participant data
                await refreshParticipantAfterReplacement(token);
                hideAnimation();
            } catch(err) {
                console.error('err', err);
                alert('Error: There was an error requesting a replacement. Please try again.');
                hideAnimation();
            }
            

        });
    }

}

const closeModal = () => {
    const modalClose = document.getElementById('modalSuccess');
    modalClose.querySelector('#closeModal').click();
};

const refreshParticipantAfterReplacement = async (token) => {
    try {
        let participant = await reloadParticipantData(token);
        let changedOption = {};
        // Navigate to the participant details page after 3 seconds
        setTimeout(() => {
            closeModal();
            window.location.href = '#participantDetails';
        }, 3000);
    } catch (err) {
        console.error('err', err);
        alert('The replacement kit was successfully requested, but refreshing the participant information failed. Participant data displayed may be stale.');
    }
}

const reloadParticipantData = async (token) => {
    const query = `token=${token}`;
    // Errors handled in refreshParticipantAfterReplacement
    const {data, code} = await findParticipant(query);
    if (code !== 200) {
        throw new Error(code + ' error reloading participant');
    }
    const reloadedParticipant = data[0];
    return reloadedParticipant;
}

const requestReplacementKit = async (connectId) => {
    try {
        const idToken = await getIdToken();
        const response = await fetch(`${baseAPI}/dashboard?api=requestHomeMWReplacementKit`, {
            method: 'POST',
            headers:{
                Authorization: "Bearer " + idToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({connectId})
        });
        if (!response.ok) { 
            const error = (response.status + ": " + (await response.json()).message);
            throw new Error(error);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error in requestReplacementKit:', error);
        throw error;
    }
    
}

const renderBackToSearchDivAndButton = () => {
    return `
        <div class="float-left">
            <button type="button" class="btn btn-primary" id="displaySearchResultsBtn">Back to Search</button>    
        </div>
        
    `;
};
 const bindActionReturnSearchResults = () => {
    const searchResultsButton = document.getElementById('displaySearchResultsBtn');
    if (searchResultsButton) {
        searchResultsButton.addEventListener('click', () => {
            renderLookupResultsTable();
        })
}};