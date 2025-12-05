/**
 * Render the tabbed navigation used within the data corrections tool.
 * @returns {string}
 */
export const displayDataCorrectionsNavbar =  () => {
    return `<div class="mt-4 data-corrections-selection-tabs">
                <div class="navTabsDataCorrectionsContainer">
                    <ul class="btn-group" id="dataCorrectionsTabsGroup">
                        <li>
                            <a class="dataCorrectionLink" id="verificationCorrectionsTool" href="#participantDetails/dataCorrections/verificationCorrectionsTool">Verification Corrections</a>
                        </li>

                        <li>
                            <a class="dataCorrectionLink" id="surveyResetTool" href="#participantDetails/dataCorrections/surveyResetTool">Survey Status Reset</a>
                        </li>
                        <li>
                            <a class="dataCorrectionLink" id="incentiveEligibilityTool" href="#participantDetails/dataCorrections/incentiveEligibilityTool">Incentive Eligibility</a>
                        </li>
                    </ul>
                </div>
            </div>`;
};

export const dataCorrectionsHeaderNote = () => `
    <div class="mb-2">
        <h4><b>Data Corrections Tool</b></h4>
        <span style="position:relative; font-size: 15px; top:2px;">
            <b>Note: This tool should only be used to make corrections to participant data post-verification. All changes need to be approved by the CCC before being applied to the participant record via this tool.</b>
        </span>
    </div>
`;

export const setActiveDataCorrectionsTab = () => {
    const dataCorrectionsTabs = document.getElementById('dataCorrectionsTabsGroup');
    if (!dataCorrectionsTabs) return;
    
    document.querySelectorAll(".dataCorrectionLink").forEach((link) => { 
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`a[href="${location.hash}"]`); 
    if (activeLink) activeLink.classList.add('active');
};    
