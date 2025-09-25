export const renderAllCharts = (inputData) => {
    // Clear any existing metrics cards and rows to prevent double-rendering
    const mainContent = document.getElementById('mainContent');
    mainContent.querySelectorAll('.metrics-card, .row').forEach(el => el.remove());

    const { activeVerificationStatus, passiveVerificationStatus, recruitsCount, collectionStats} = inputData;
    const metricsCards = metricsCardsView({
      activeRecruits: recruitsCount.activeCount,
      verifiedParticipants: activeVerificationStatus.verified + passiveVerificationStatus.verified,
      collectionStats
    });

    mainContent.appendChild(metricsCards);

    const reportsLinkTemplate = `
        <div class="row">
            <div class = "col-lg-12" style="text-align: center">
                Connect Operational and Biospecimen Weekly Metrics Reports are available on Box here: <a href="https://nih.app.box.com/folder/183923726461" target="_blank">Connect Metrics Reports</a>
            </div>
        </div>
    `;

    const tempDiv= document.createElement('div');
    tempDiv.innerHTML = reportsLinkTemplate;
    mainContent.append(...tempDiv.children);
}

const metricsCardsView = ({activeRecruits, verifiedParticipants, collectionStats}) => {
    const row1Template = `
        <div class="metrics-card">
        <div class="card-top"></div>
        <div class="metrics-value">${activeRecruits}</div>
            <p class="metrics-value-description">
            Active Recruits
            </p>
        </div>
        <div class="metrics-card">
        <div class="card-top"></div>
        <div class="metrics-value">${verifiedParticipants}</div>
            <p class="metrics-value-description">Verified Participants</p>
        </div>
    `;

    const row2Template = `
        <div class="metrics-card">
        <div class="card-top"></div>
        <div class="metrics-value">${collectionStats.allCollections}</div>
            <p class="metrics-value-description">Participants with Baseline Samples Collected</p>
        </div>
        <div class="metrics-card">
        <div class="card-top"></div>
        <div class="metrics-value">${collectionStats.clinicalCollections}</div>
            <p class="metrics-value-description">Clinical Collections</p>
        </div>
        <div class="metrics-card">
        <div class="card-top"></div>
        <div class="metrics-value">${collectionStats.researchCollections}</div>
            <p class="metrics-value-description">Research Collections</p>
        </div>
    `;

    const rows = document.createElement('div');

    const row1Div = document.createElement("div");
    row1Div.className = "row d-flex justify-content-center";
    row1Div.innerHTML = row1Template;
    rows.appendChild(row1Div);

    const row2Div = document.createElement("div");
    row2Div.className = "row d-flex justify-content-center";
    row2Div.innerHTML = row2Template;
    rows.appendChild(row2Div);
    
    return rows;
};