import { urls } from './utils.js';

export const renderNavBarLinks = () => {
    return `
        <li class="nav-item active">
            <a class="nav-item nav-link active" href="#" title="Home"><i class="fas fa-home"></i> Home</a>
        </li>
    `;
}

export const dashboardNavBarLinks = () => {
    const isParent = localStorage.getItem('isParent');
    const coordinatingCenter = localStorage.getItem('coordinatingCenter');
    const helpDesk = localStorage.getItem('helpDesk');
    
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
        <li class="nav-item" id="participantDetailsBtn">
            <a class="nav-item nav-link ws-nowrap" href="#participantDetails" title="Participant Details"><i class="fa fa-info-circle"></i> Participant Details</a>
        </li>
        <li class="nav-item" id="participantSummaryBtn">
            <a class="nav-item nav-link ws-nowrap" href="#participantSummary" title="Participant Summary"><i class="fa fa-id-badge"></i> Participant Summary</a>
        </li>
        ${isParent === 'true' ?
        (`<li class="nav-item" id="participantWithdrawalBtn">
            <a class="nav-item nav-link ws-nowrap" href="#participantWithdrawal" title="Participant Withdrawal"><i class="fa fa-list-alt"></i> Participant Withdrawal</a>
        </li>`) : (``)  }
        <li class="nav-item" id="participantMessageBtn">
            <a class="nav-item nav-link ws-nowrap" href="#participantMessages" title="Participant Messages"><i class="fa fa-envelope-open"></i> Participant Messages</a>
        </li>
        ${(helpDesk === 'true') ? '' : (`<li class="nav-item" id="pathologyReportUploadBtn">
            <a class="nav-item nav-link ws-nowrap" href="#pathologyReportUpload" title="Pathology Report Upload"><i class="fa fa-upload"></i> Pathology Report Upload</a>
        </li>`)}
        ${(helpDesk === 'true' || coordinatingCenter === 'true') ?
        (`<li class="nav-item" id="participantVerificationBtn">
            <a class="nav-item nav-link ws-nowrap" href="#dataCorrectionsToolSelection" title="Data Corrections Tool"><i class="fa fa-check"></i> Data Corrections Tool</a>
        </li>`) : (``) }
        ${(helpDesk === 'true' || coordinatingCenter === 'true') ?
            (`<li class="nav-item" id="replaceHomeCollectionBtn">
                <a class="nav-item nav-link ws-nowrap" href="#requestHomeCollectionKit" title="Home Collection Kit Request"><i class="fa fa-home"></i> Kit Requests</a>
            </li>`) : (``) }
        ${coordinatingCenter === 'true' ?
            (`<li class="nav-item" id="manageRequestAKitConditionsBtn">
                <a class="nav-item nav-link ws-nowrap" href="#requestAKitConditions" title="Manage Automated Kit Request Eligibility"><i class="fa fa-cogs"></i> CCC use only- Set Kit Eligibility</a>
            </li>`) : (``) }
        ${(helpDesk === 'true' || (coordinatingCenter === 'true' && location.host === urls.prod)) ? '' : (`<li class="nav-item" id="ehrUploadBtn">
            <a class="nav-item nav-link ws-nowrap" href="#ehrUpload" title="EHR Upload"><i class="fa fa-upload"></i> EHR Upload</a>
        </li>`)}
        ${(isParent !== 'true' || coordinatingCenter === 'true') ?
        (`<li class="nav-item" id="siteMessageBtn">
            <a class="nav-item nav-link ws-nowrap" href="#siteMessages" title="Site Messages"><i class="fa fa-comments"></i> Site Messages</a>
        </li>`) : (``) }
        ${coordinatingCenter === 'true' ?
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
    let fileIconElement = document.getElementsByClassName(className);
    Array.from(fileIconElement).forEach(elm => {
        elm.classList.remove(activeClass);
    });
}

// Track if we've already set up the navbar collapse listener
let navbarCollapseSetup = false;

export const setupNavbarCollapse = () => {
    // Only set up once to prevent duplicate listeners
    if (navbarCollapseSetup) {
        return;
    }
    
    // Use event delegation on the navbar container for better performance
    const navbarContainer = document.getElementById('navBarLinks');
    if (navbarContainer) {
        navbarContainer.addEventListener('click', (event) => {
            // Check if the clicked element is a navigation link
            const link = event.target.closest('a[href^="#"]');
            if (link) {
                // Close the navbar after navigation completes using requestAnimationFrame
                requestAnimationFrame(() => {
                    const navbarToggler = document.getElementById('hamburger_menu_button');
                    const navbarCollapse = document.getElementById('navbarNavAltMarkup');
                    
                    if (navbarToggler && navbarCollapse && navbarCollapse.classList.contains('show')) {
                        navbarToggler.click();
                    }
                });
            }
        });
        
        navbarCollapseSetup = true;
    }
}
