
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
}