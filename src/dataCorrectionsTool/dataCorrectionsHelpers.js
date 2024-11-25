/**
* When back button clicked, navigates user back to the data corrections tool selection page.
* @returns {void}
*/
export const handleBackToToolSelect = () => {
    const backToToolSelectButton = document.getElementById('backToToolSelect');
    if (!backToToolSelectButton) return;

    backToToolSelectButton.addEventListener('click', () => {
       location.hash = '#dataCorrectionsToolSelection';
    });
};

export const displayDataCorrectionsNavbar =  () => {
    return `<div class="mt-4">
                <div class="navTabsDataCorrectionsContainer .d-flex">
                    <ul class="btn-group" id="dataCorrectionsTabsGroup">
                        <li>
                            <a class="dataCorrectionLink" id="verificationCorrectionsTool" href="#verificationCorrectionsTool">Verification Corrections</a>
                        </li>

                        <li>
                            <a class="dataCorrectionLink" id="surveyResetTool" href="#surveyResetTool">Survey Status Reset</a>
                        </li>
                        <li>
                            <a class="dataCorrectionLink" id="incentiveEligibilityTool" href="#incentiveEligibilityTool">Incentive Eligibility</a>
                        </li>
                    </ul>
                </div>
            </div>`;
};

export const setActiveDataCorrectionsTab = () => {
    const dataCorrectionsTabs = document.getElementById('dataCorrectionsTabsGroup');
    if (!dataCorrectionsTabs) return;

    document.getElementsByName('dataCorrectionLink').forEach((link) => { 
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`a[href="${location.hash}"]`); 
    if (activeLink) activeLink.classList.add('active');
};    