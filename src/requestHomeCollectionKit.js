import { dashboardNavBarLinks, removeActiveClass } from './navigationBar.js';
import { renderParticipantHeader } from './participantHeader.js';
import { findParticipant, renderLookupResultsTable } from './participantLookup.js';
import fieldMapping from './fieldToConceptIdMapping.js'; 
import { baseAPI, getIdToken, hideAnimation, showAnimation } from './utils.js';


export const renderKitRequest = (participant) => {
    document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks();
    removeActiveClass('nav-link', 'active');
    document.getElementById('replaceHomeCollectionBtn').classList.add('active');

    mainContent.innerHTML = render(participant);
    bindEventRequestReplacementButton(participant?.['Connect_ID'], participant?.token);
    bindEventRequestKitButton(participant?.['Connect_ID'], participant?.token);
    bindActionReturnSearchResults();
};

const renderReplacementScreen = (kitAlreadyReceived) => {
    return `${
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

const renderInitialKitSection = (alreadyOrdered) => {
    if(alreadyOrdered) {
        return `<div>An initial home MW kit for the participant has already been ordered.</div>`;
    } else {
        return `<div>
        <button
            id="requestKitBtn"
            class="btn btn-primary"
            data-toggle="modal" 
            data-target="#modalSuccess"
            name="modalResetParticipant"
        >
            Request Initial Kit
        </button>
    </div>`;
    }
}

const render = (participant) => {
    let template = `<div class="container" style="padding-top:1rem;">`
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

        let initialKitSectionText = ``;
        let replacementKitSectionText = ``;
        // Is the user's address valid?
        const poBoxRegex = /^(?:P\.?\s*O\.?\s*(?:Box|B\.?)?|Post\s+Office\s+(?:Box|B\.?)?)\s*(\s*#?\s*\d*)((?:\s+(.+))?$)$/i;
        const physicalAddressLineOne = participant[fieldMapping.physicalAddress1];
        const mailingAddressLineOne = participant[fieldMapping.address1];
        if (
            (!physicalAddressLineOne || poBoxRegex.test(physicalAddressLineOne)) &&
            (!mailingAddressLineOne || poBoxRegex.test(mailingAddressLineOne))
        ) {
            initialKitSectionText = `<div>Participant address is invalid; cannot send home mouthwash kit.</div>`;
            replacementKitSectionText = initialKitSectionText;
        } else if (participant[fieldMapping.verifiedFlag] !== fieldMapping.verified) {
            initialKitSectionText = `<div>Participant is not verified; cannot send home mouthwash kit.</div>`;
            replacementKitSectionText = initialKitSectionText;
        } else if (participant[fieldMapping.withdrawConsent] == fieldMapping.yes
        ) {
            initialKitSectionText = `<div>Participant has withdrawn from the study.</div>`;
            replacementKitSectionText = initialKitSectionText;
        } else if ( participant[fieldMapping.participantDeceased] == fieldMapping.yes) {
            initialKitSectionText = `<div>Participant is deceased.</div>`;
            replacementKitSectionText = initialKitSectionText;
        } else {
            if (participant[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[fieldMapping.bioKitMouthwashBL2]) {
                initialKitSectionText = renderInitialKitSection(true);
                replacementKitSectionText = `<div>Participant has already used supported number of replacement kits.</div>`;
                // If two replacements, they are out of replacement kits; prevent further.
            } else if (participant[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[fieldMapping.bioKitMouthwashBL1]) {
    
                initialKitSectionText = renderInitialKitSection(true);
                // If one replacement, mark as eligible for second replacement
                switch(replacementKit1Status) {
                    case undefined:
                    case null:
                    case fieldMapping.kitStatusValues.pending: {
                        replacementKitSectionText = '<div>This participant is not eligible for a second replacement home mouthwash kit</div>';
                        break;
                    }
                    case fieldMapping.kitStatusValues.addressUndeliverable: {
                        replacementKitSectionText = `<div>Participant address is invalid; cannot send home mouthwash kit.</div>`;
                        break;
                    }
                    case fieldMapping.kitStatusValues.initialized:
                    case fieldMapping.kitStatusValues.addressPrinted:
                    case fieldMapping.kitStatusValues.assigned: {
                        replacementKitSectionText = '<div>This participant\'s first replacement home mouthwash kit has not been sent</div>';
                        break;
                    }
                    
                    case fieldMapping.kitStatusValues.shipped:
                        replacementKitSectionText = renderReplacementScreen();
                        break;
                    case fieldMapping.kitStatusValues.received:
                        replacementKitSectionText = renderReplacementScreen(true);
                        break;
                    default:
                        replacementKitSectionText = '<div>Unrecognized kit status ' + replacementKit1Status + '</div>';
                }
            } else if(participant?.[fieldMapping.collectionDetails]?.[fieldMapping.baseline]?.[fieldMapping.bioKitMouthwash]) {
                switch(initialKitStatus) {
                    case undefined:
                    case null:
                    case fieldMapping.kitStatusValues.pending: {
                        initialKitSectionText = renderInitialKitSection(false);
                        replacementKitSectionText = '<div>This participant is not yet eligible for a home mouthwash replacement kit</div>';
                        break;
                    }
                    case fieldMapping.kitStatusValues.addressUndeliverable: {
                        initialKitSectionText = `<div>Participant address is invalid; cannot send home mouthwash kit.</div>`;
                        replacementKitSectionText = `<div>Participant address is invalid; cannot send home mouthwash kit.</div>`;
                        break;
                    }
                    case fieldMapping.kitStatusValues.initialized:
                    case fieldMapping.kitStatusValues.addressPrinted:
                    case fieldMapping.kitStatusValues.assigned: {
                        initialKitSectionText = renderInitialKitSection(true);
                        replacementKitSectionText = '<div>This participant\'s initial home mouthwash kit has not been sent</div>';
                        break;
                    }
                    case fieldMapping.kitStatusValues.shipped:
                        initialKitSectionText = renderInitialKitSection(true);
                        // Eligible for first replacement
                        replacementKitSectionText = renderReplacementScreen();
                        break;
                    case fieldMapping.kitStatusValues.received:
                        initialKitSectionText = renderInitialKitSection(true);
                        replacementKitSectionText =  renderReplacementScreen(true);
                        break;
                    default:
                        initialKitSectionText = renderInitialKitSection(true);
                        replacementKitSectionText = '<div>Unrecognized kit status ' + initialKitStatus + '/<div>';
                }
            } else {
                initialKitSectionText = renderInitialKitSection(false);
                replacementKitSectionText = '<div>This participant is not yet eligible for a home mouthwash replacement kit OR their initial home mouthwash kit has not yet been sent</div>';
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
            <div><h1>Kit Requests</h1></div>
            <div><span class="text-danger">Note for all kit requests:</span> Make sure you have verified the mailing address with the participant before entering this request and have updated the address in the User Profile if needed.
</div>
            <div style="height:1em;"></div>
            <h2>Request an Initial Home Mouthwash Kit</h2>
            ${initialKitSectionText}
            <div style="height:2em;"></div>
            <h2>Request a Home Mouthwash Replacement Kit</h2>
            ${replacementKitSectionText}
            <div style="height:1em;"></div>
            ${renderBackToSearchDivAndButton()}
        `;
    }
    return template;
}

const bindEventRequestKitButton = (connectId, token) => {
    const requestKitButton = document.getElementById('requestKitBtn');
    if(requestKitButton) {
        requestKitButton.addEventListener('click', async () => {
            try {
                showAnimation();

                await requestKit(connectId);

                const header = document.getElementById('modalHeader');
                const body = document.getElementById('modalBody');  
                header.innerHTML = `
                        <h5>Success! Kit requested.</h5>
                        <button type="button" id="closeModal" class="modal-close-btn" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    `
                body.innerHTML = `<div>
                    Please wait while we refresh the participant information and navigate to the participant details page.
                </div>`

                // Notify user of success and refresh the participant data
                await refreshParticipantAfterSuccess(token);
                hideAnimation();
            } catch(err) {
                console.error('err', err);
                alert('Error: There was an error requesting a kit. Please try again.');
                hideAnimation();
            }
        });
    }
}

const bindEventRequestReplacementButton = (connectId, token) => {
    const requestReplacementButton = document.getElementById('requestReplacementKitBtn');
    if (requestReplacementButton) {
        requestReplacementButton.addEventListener('click', async () => {
            try {
                showAnimation();

                await requestKit(connectId);

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
                await refreshParticipantAfterSuccess(token);
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

const refreshParticipantAfterSuccess = async (token) => {
    try {
        await reloadParticipantData(token);
        // Navigate to the participant details page after 3 seconds
        setTimeout(() => {
            closeModal();
            window.location.href = '#participantDetails';
        }, 3000);
    } catch (err) {
        console.error('err', err);
        alert('The kit was successfully requested, but refreshing the participant information failed. Participant data displayed may be stale.');
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

const requestKit = async (connectId) => {
    try {
        const idToken = await getIdToken();
        const response = await fetch(`${baseAPI}/dashboard?api=requestHomeKit`, {
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
        console.error('Error in requestKit:', error);
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