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
                            <a class="dataCorrectionLink active" id="verificationCorrectionsTool" href="#verificationCorrectionsTool">Verification Corrections</a>
                        </li>

                        <li>
                            <a class="dataCorrectionLink" id="surveyResetTool" href="#surveyResetTool">Survey Status Reset</a>
                        </li>
                        <li>
                            <a class="dataCorrectionLink" id="incentiveEligibilityTool" href="#incentiveEligibilityTool">Incentive Eligibility</a>
                        </li>
                    </ul>
                </div>
                <div class="dataCorrectionsNavLine"></div>
            </div>`;
};

export const setActiveDataCorrectionsTab = () => {
    const dataCorrectionsTabs = document.getElementById('dataCorrectionsTabs');
    if (!dataCorrectionsTabs) return;

    const currentHash = location.hash;
    console.log("🚀 ~ setActiveDataCorrectionsTab ~ currentHash:", currentHash)
    // const activeLink = document.querySelector(`a[href="${currentHash}"]`); 
    // console.log("🚀 ~ setActiveDataCorrectionsTab ~ activeLink:", activeLink)
    // dataCorrectionsTabs.addEventListener('click', (event) => {
    //     // Remove active class from all buttons
    //     // add active class to only the link that was clicked based on hash

    //     const dataCorrectionButtons = document.querySelectorAll('.dataCorrectionLink');
    //     dataCorrectionButtons.forEach((link) => {
    //         link.classList.remove('active');
    //     });
    //     event.target.classList.add('active');
    // });
};    