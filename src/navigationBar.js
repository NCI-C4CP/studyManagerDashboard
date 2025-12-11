import { urls } from './utils.js';
import { roleState } from './stateManager.js';

/**
 * Handle participant lookup nav when already on the participantLookup hash
 * @returns {boolean} - True if a participant lookup nav request was made, false otherwise
 */
let participantLookupNavRequested = false;
export const participantLookupNavRequest = () => {
    const requested = participantLookupNavRequested;
    participantLookupNavRequested = false;
    return requested;
};

export const setParticipantLookupNavRequest = (value = false) => {
    participantLookupNavRequested = !!value;
};

export const renderNavBarLinks = () => {
    return `
        <li class="nav-item active">
            <a class="nav-item nav-link active" href="#" title="Home"><i class="fas fa-home"></i> Home</a>
        </li>
    `;
}

export const dashboardNavBarLinks = () => {
    const { isParent, coordinatingCenter, helpDesk } = roleState.getRoleFlags();
    
    // Set up navbar collapse after DOM is updated
    requestAnimationFrame(() => {
        setupNavbarCollapse();
    });
    
    return `
        <li class="nav-item">
            <a class="nav-item nav-link ws-nowrap" href="#home" title="Home" id="dashboardBtn"><i class="fas fa-home"></i> Home</a>
        </li>
        <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle ws-nowrap" id="participants" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="fas fa-users"></i> Participants
            </a>
            <div class="dropdown-menu sub-div-shadow" aria-labelledby="participants">
                <a class="dropdown-item" href="#participants/notyetverified" id="notVerifiedBtn">Not Yet Verified Participants</a>
                <a class="dropdown-item" href="#participants/cannotbeverified" id="cannotVerifiedBtn">Cannot Be Verified Participants</a>
                <a class="dropdown-item" href="#participants/verified" id="verifiedBtn">Verified Participants</a>
                <a class="dropdown-item" href="#participants/all" id="allBtn">All Participants</a>
                <a class="dropdown-item" href="#participants/profilenotsubmitted" id="profileNotSubmitted">Profile Not Submitted</a>
                <a class="dropdown-item" href="#participants/consentnotsubmitted" id="consentNotSubmitted">Consent Not Submitted</a>
                <a class="dropdown-item" href="#participants/notsignedin" id="notSignedIn">Not Signed In</a>
            </div>
        </li>
        <li class="nav-item" id="participantLookupBtn">
            <a class="nav-item nav-link ws-nowrap" href="#participantLookup" title="Participant Lookup"><i class="fas fa-search"></i> Participant Lookup</a>
        </li>
        ${coordinatingCenter ?
            (`<li class="nav-item" id="manageRequestAKitConditionsBtn">
                <a class="nav-item nav-link ws-nowrap" href="#requestAKitConditions" title="Manage Automated Kit Request Eligibility"><i class="fa fa-cogs"></i> CCC use only- Set Kit Eligibility</a>
            </li>`) : (``) }
        <div class="w-100 d-none d-lg-block"></div>
        ${(!isParent || coordinatingCenter) ?
        (`<li class="nav-item" id="siteMessageBtn">
            <a class="nav-item nav-link ws-nowrap" href="#siteMessages" title="Automated Refusal/Withdrawal Notifications to Sites"><i class="fa fa-comments"></i> Automated Refusal/Withdrawal Notifications to Sites</a>
        </li>`) : (``) }
        ${(helpDesk || (coordinatingCenter && location.host === urls.prod)) ? '' : (`<li class="nav-item" id="ehrUploadBtn">
            <a class="nav-item nav-link ws-nowrap" href="#ehrUpload" title="EHR Upload"><i class="fa fa-upload"></i> EHR Upload</a>
        </li>`)}
        ${coordinatingCenter ?
        (`<li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle ws-nowrap" id="notifications" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <i class="fa fa-bell"></i> Notifications 
                </a>
                <div class="dropdown-menu sub-div-shadow" aria-labelledby="notifications">
                    <a class="dropdown-item" href="#notifications/createnotificationschema" id="createNotificationSchema">Create A New Schema</a>
                    <a class="dropdown-item" href="#notifications/retrievenotificationschema" id="retrieveNotificationSchema">Show Completed Schemas</a>
                    <a class="dropdown-item" href="#notifications/showDraftSchemas" id="showDraftSchemas">Show Draft Schemas</a>
                </div>
            </li>`) : (``) }
        <li class="nav-item">
            <a class="nav-item nav-link ws-nowrap" href="#logout" title="Log Out"><i class="fas fa-sign-out-alt"></i> Log Out</a>
        </li>
    `;
}

export const  renderLogin = () => {
    return `
        <h1>Site Study Manager Dashboard</h1>

        </br></br>
        <h4>Single Sign-On</h4>
        <form id="ssoLogin">
            <div class="row">
                <div class="col">
                    <input type="email" required id="ssoEmail" class="form-control col-md-3" placeholder="Enter Your Organizational Email">
                </div>
            </div>
            <div class="row">
                <div class="col">
                    <button type="submit" class="btn btn-primary">Log In</button>
                </div>
            </div>
        </form>
    `;
}

export const removeActiveClass = (className, activeClass) => {
    if (typeof document === 'undefined') return;
    let fileIconElement = document.getElementsByClassName(className);
    Array.from(fileIconElement).forEach(elm => {
        elm.classList.remove(activeClass);
    });
}

// Track if we've already set up the navbar collapse listener
let navbarCollapseSetup = false;

const setupNavbarCollapse = () => {
    if (typeof document === 'undefined') return;
    // Only set up once to prevent duplicate listeners
    if (navbarCollapseSetup) {
        return;
    }
    
    // Use event delegation on the navbar container
    const navbarContainer = document.getElementById('navBarLinks');
    if (!navbarContainer) {
        return;
    }

    navbarContainer.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"]');
        if (!link) return;

        const href = link.getAttribute('href');

        // force the hash change event when already on the participantLookup hash
        if (href === '#participantLookup' && href === window.location.hash) {
            event.preventDefault();
            participantLookupNavRequested = true;
            requestAnimationFrame(() => {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                    if (typeof window.onhashchange === 'function') {
                        window.onhashchange();
                    }
                }
            });
        } else if (href === '#participantLookup') {
            participantLookupNavRequested = true;
        }

        requestAnimationFrame(() => {
            const navbarToggler = document.getElementById('hamburger_menu_button');
            const navbarCollapse = document.getElementById('navbarNavAltMarkup');
            
            if (navbarToggler && navbarCollapse && navbarCollapse.classList.contains('show')) {
                navbarToggler.click();
            }
        });
    });
    
    navbarCollapseSetup = true;
}

/**
 * Helper function to update active navigation elements based on participant type
 * 
 * @function updateActiveElements
 * @param {string} type - The participant filter type
 */
export const updateActiveElements = (type) => {
    
    const titleMap = {
        'all': 'All Participants',
        'notyetverified': 'Not Verified Participants',
        'cannotbeverified': 'Cannot Be Verified Participants',
        'verified': 'Verified Participants',
        'profileNotSubmitted': 'Profile Not Submitted',
        'consentNotSubmitted': 'Consent Not Submitted',
        'notSignedIn': 'Not Signed In'
    };

    const buttonMap = {
        'all': 'allBtn',
        'notyetverified': 'notVerifiedBtn',
        'cannotbeverified': 'cannotVerifiedBtn',
        'verified': 'verifiedBtn',
        'profileNotSubmitted': 'profileNotSubmitted',
        'consentNotSubmitted': 'consentNotSubmitted',
        'notSignedIn': 'notSignedIn'
    };
    
    removeActiveClass('dropdown-item', 'dd-item-active');
    removeActiveClass('nav-link', 'active');

    document.getElementById('participants').innerHTML = `<i class="fas fa-users"></i> ${titleMap[type]}`;
    document.getElementById('participants').classList.add('active');
    document.getElementById(buttonMap[type])?.classList.add('dd-item-active');
};

export const updateNavBar = (activeElementId) => {
    if (!activeElementId) return;
    if (typeof document === 'undefined') return;

    const navBarLinks = document.getElementById('navBarLinks');
    if (!navBarLinks) return;

    navBarLinks.innerHTML = dashboardNavBarLinks();
    removeActiveClass('nav-link', 'active');
    const activeElement = document.getElementById(activeElementId);
    activeElement?.classList.add('active');
}
