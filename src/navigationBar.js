export const renderNavBarLinks = () => {
    return `
        <li class="nav-item active">
            <a class="nav-item nav-link active" href="#" title="Home"><i class="fas fa-home"></i> Home</a>
        </li>
    `;
}

export const dashboardNavBarLinks = (isParent) => {
    const coordinatingCenter = localStorage.getItem('coordinatingCenter');
    const helpDesk = localStorage.getItem('helpDesk');
    return `
        <li class="nav-item">
            <a class="nav-item nav-link ws-nowrap" href="#home" title="Home" id="dashboardBtn"><span data-target="#navbarNavAltMarkup" data-toggle="collapse"><i class="fas fa-home"></i> Home</span></a>
        </li>
        <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle ws-nowrap" id="participants" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="fas fa-users"></i> Participants
            </a>
            <div class="dropdown-menu sub-div-shadow" aria-labelledby="participants">
                <a class="dropdown-item" href="#participants/notyetverified" id="notVerifiedBtn"><span data-target="#navbarNavAltMarkup" data-toggle="collapse">Not Yet Verified Participants</span></a>
                <a class="dropdown-item" href="#participants/cannotbeverified" id="cannotVerifiedBtn"><span data-target="#navbarNavAltMarkup" data-toggle="collapse">Cannot Be Verified Participants</span></a>
                <a class="dropdown-item" href="#participants/verified" id="verifiedBtn"><span data-target="#navbarNavAltMarkup" data-toggle="collapse">Verified Participants</span></a>
                <a class="dropdown-item" href="#participants/all" id="allBtn"><span data-target="#navbarNavAltMarkup" data-toggle="collapse">All Participants</span></a>
                <a class="dropdown-item" href="#participants/profilenotsubmitted" id="profileNotSubmitted"><span data-target="#navbarNavAltMarkup" data-toggle="collapse">Profile Not Submitted</span></a>
                <a class="dropdown-item" href="#participants/consentnotsubmitted" id="consentNotSubmitted"><span data-target="#navbarNavAltMarkup" data-toggle="collapse">Consent Not Submitted</span></a>
                <a class="dropdown-item" href="#participants/notsignedin" id="notSignedIn"><span data-target="#navbarNavAltMarkup" data-toggle="collapse">Not Signed In</span></a>
            </div>
        </li>
        <li class="nav-item" id="participantLookupBtn">
            <a class="nav-item nav-link ws-nowrap" href="#participantLookup" title="Participant Lookup"><span data-target="#navbarNavAltMarkup" data-toggle="collapse"><i class="fas fa-search"></i> Participant Lookup</span></a>
        </li>
        <li class="nav-item" id="participantDetailsBtn">
            <a class="nav-item nav-link ws-nowrap" href="#participantDetails" title="Participant Details"><span data-target="#navbarNavAltMarkup" data-toggle="collapse"><i class="fa fa-info-circle"></i> Participant Details</span></a>
        </li>
        <li class="nav-item" id="participantSummaryBtn">
            <a class="nav-item nav-link ws-nowrap" href="#participantSummary" title="Participant Summary"><span data-target="#navbarNavAltMarkup" data-toggle="collapse"><i class="fa fa-id-badge"></i> Participant Summary</span></a>
        </li>
        ${isParent === 'true' ?
        (`<li class="nav-item" id="participantWithdrawalBtn">
            <a class="nav-item nav-link ws-nowrap" href="#participantWithdrawal" title="Participant Withdrawal"><span data-target="#navbarNavAltMarkup" data-toggle="collapse"><i class="fa fa-list-alt"></i> Participant Withdrawal</span></a>
        </li>`) : (``)  }
        <li class="nav-item" id="participantMessageBtn">
            <a class="nav-item nav-link ws-nowrap" href="#participantMessages" title="Participant Messages"><span data-target="#navbarNavAltMarkup" data-toggle="collapse"><i class="fa fa-envelope-open"></i> Participant Messages</span></a>
        </li>
        ${(helpDesk === 'true' || coordinatingCenter === 'true') ?
        (`<li class="nav-item" id="participantVerificationBtn">
            <a class="nav-item nav-link ws-nowrap" href="#dataCorrectionsTool" title="Data Corrections Tool"><span data-target="#navbarNavAltMarkup" data-toggle="collapse"><i class="fa fa-check"></i> Data Corrections Tool</span></a>
        </li>`) : (``) }
        ${(isParent !== 'true' || coordinatingCenter === 'true') ?
        (`<li class="nav-item" id="siteMessageBtn">
            <a class="nav-item nav-link ws-nowrap" href="#siteMessages" title="Site Messages"><span data-target="#navbarNavAltMarkup" data-toggle="collapse"><i class="fa fa-comments""></i> Site Messages</span></a>
        </li>`) : (``) }
        ${coordinatingCenter === 'true' ?
        (`<li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle ws-nowrap" id="notifications" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <i class="fa fa-bell"></i> Notifications 
                </a>
                <div class="dropdown-menu sub-div-shadow" aria-labelledby="notifications">
                    <a class="dropdown-item" href="#notifications/createnotificationschema" id="createNotificationSchema"><span data-target="#navbarNavAltMarkup" data-toggle="collapse">Create A New Schema</span></a>
                    <a class="dropdown-item" href="#notifications/retrievenotificationschema" id="retrieveNotificationSchema"><span data-target="#navbarNavAltMarkup" data-toggle="collapse">Show Completed Schemas</span></a>
                    <a class="dropdown-item" href="#notifications/showDraftSchemas" id="showDraftSchemas"><span data-target="#navbarNavAltMarkup" data-toggle="collapse">Show Draft Schemas</span></a>
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
