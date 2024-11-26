import { dashboardNavBarLinks, removeActiveClass } from '../navigationBar.js';
import { renderParticipantHeader } from '../participantHeader.js';

export const setupDataCorrectionsSelectionToolPage = (participant) => {
    if (participant !== undefined) {
        const isParent = localStorage.getItem('isParent')
        document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks(isParent);
        removeActiveClass('nav-link', 'active');
        document.getElementById('participantVerificationBtn').classList.add('active');
        mainContent.innerHTML = renderDataCorrectionsSelectionContent(participant);        
        setupContinueNavigationHandler();
        setupDropdownSelectionHandler();
    }
}

const renderDataCorrectionsSelectionContent = (participant) => {
    return `
        <div id="root root-margin">
            <div class="container-fluid">
                    ${renderParticipantHeader(participant)}

                    <div class="row">
                        <div class="col">                    
                            <h4><b>Data Corrections Tool</b></h4>
                            <span style="position:relative; font-size: 15px; top:2px;">
                                <b>Note: This tool should only be used to make corrections to participant data post-verification. All changes need to be approved by the CCC before being applied to the participant record via this tool.</b>
                            </span>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col">
                            <p class="font-weight-bold" style="font-size:1.2rem;"> Please select the tool you would like to use: </p>
                            <div class="btn-group dropright">
                            <!-- Todo: Add dropdown color later -->
                                <button type="button" class="btn btn-info dropdown-toggle selectButton" data-toggle="dropdown" aria-expanded="false">
                                    Select
                                </button>
                                <div id="dropdownToolsMenu" class="dropdown-menu">
                                    <a class="dropdown-item">Select</a>
                                    <a class="dropdown-item" data-tool="verificationCorrections">Verification Corrections</a>
                                    <a class="dropdown-item" data-tool="surveyReset">Survey Reset</a>
                                    <a class="dropdown-item" data-tool="incentiveEligibility">Incentive Eligibility</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row mt-5">
                        <div class="col">
                            <button type="button" class="btn btn-primary continueButton disabled">Continue</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

const setupContinueNavigationHandler = () => {
    const continueBtn = document.querySelector('.continueButton');
    const selectButton = document.querySelector('.selectButton');
    if (!continueBtn || !selectButton) return;
    
    continueBtn.addEventListener('click', () => {
        const selectedButtonType = selectButton.getAttribute('data-tool');
        if (!selectedButtonType) return;

        if (selectedButtonType === 'verificationCorrections') {
            window.location.hash = '#verificationCorrectionsTool';
        } else if (selectedButtonType === 'surveyReset') {
            window.location.hash = '#surveyResetTool';
        } else if (selectedButtonType === 'incentiveEligibility') {
            window.location.hash = '#incentiveEligibilityTool';
        }
    });
}

const setupDropdownSelectionHandler = () => { 
    // get dropdown menu options element
    const dropdownMenu = document.getElementById('dropdownToolsMenu');
    const dropdownOptions = dropdownMenu.querySelectorAll('.dropdown-item');
    const selectButton = document.querySelector('.selectButton');
    const continueButton = document.querySelector('.continueButton');

    if (!dropdownMenu || !dropdownOptions || !selectButton || !continueButton) return;

    for (let option of dropdownOptions) {
        option.addEventListener('click', (e) => {
            const selectedText = e.target.textContent.trim();
            const selectedToolType = e.target.getAttribute('data-tool');

            if (selectedToolType) {
                selectButton.textContent = selectedText;
                continueButton.classList.remove('disabled');
                selectButton.setAttribute('data-tool', selectedToolType);
            } else {
                selectButton.textContent = 'Select';
                continueButton.classList.add('disabled');
                selectButton.setAttribute('data-tool', '');
            }
        });
    }
};