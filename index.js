import { renderParticipantLookup } from './src/participantLookup.js';
import { renderNavBarLinks, dashboardNavBarLinks, renderLogin, removeActiveClass } from './src/navigationBar.js';
import { renderTable, renderData, activeColumns, renderFilters } from './src/participantCommons.js';
import { renderParticipantDetails } from './src/participantDetails.js';
import { renderParticipantSummary } from './src/participantSummary.js';
import { renderParticipantMessages } from './src/participantMessages.js';
import { renderReplacementKitRequest } from './src/replaceHomeCollectionKit.js';
import { setupDataCorrectionsSelectionToolPage } from './src/dataCorrectionsTool/dataCorrectionsToolSelection.js';
import { setupVerificationCorrectionsPage } from './src/dataCorrectionsTool/verificationCorrectionsTool.js';
import { setupSurveyResetToolPage } from './src/dataCorrectionsTool/surveyResetTool.js';
import { setupIncentiveEligibilityToolPage } from './src/dataCorrectionsTool/incentiveEligibilityTool.js';
import { renderSiteMessages } from './src/siteMessages.js';
import { renderParticipantWithdrawal } from './src/participantWithdrawal.js';
import { createNotificationSchema, editNotificationSchema } from './src/storeNotifications.js';
import { renderRetrieveNotificationSchema, showDraftSchemas } from './src/retrieveNotifications.js';
import { internalNavigatorHandler, getIdToken, userLoggedIn, baseAPI, urls, getParticipants, showAnimation, hideAnimation, sortByKey, resetPagination, resetFilters } from './src/utils.js';
import fieldMapping from './src/fieldToConceptIdMapping.js';
import { nameToKeyObj } from './src/idsToName.js';
import { renderAllCharts } from './src/participantChartsRender.js';
import { firebaseConfig as devFirebaseConfig } from "./config/dev/config.js";
import { firebaseConfig as stageFirebaseConfig } from "./config/stage/config.js";
import { firebaseConfig as prodFirebaseConfig } from "./config/prod/config.js";
import { SSOConfig as devSSOConfig} from './config/dev/identityProvider.js';
import { SSOConfig as stageSSOConfig} from './config/stage/identityProvider.js';
import { SSOConfig as prodSSOConfig} from './config/prod/identityProvider.js';
import { appState } from './src/stateManager.js';

let saveFlag = false;
let counter = 0;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./serviceWorker.js")
    .then((registration) => {
      registration.onupdatefound = () => {
        const sw = registration.installing;
        if (sw) {
          sw.onstatechange = () => sw.state === "activated" && sw.postMessage({ action: "getAppVersion" });
        }
      };
    })
    .catch((err) => {
      console.error("Service worker registration failed.", err);
    });

  navigator.serviceWorker.ready.then(() => {
    const sw = navigator.serviceWorker.controller;
    sw && sw.postMessage({ action: "getAppVersion" });
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data.action === "sendAppVersion") {
      document.getElementById("appVersion").textContent = event.data.payload;
    }
  });
}

const datadogConfig = {
    clientToken: 'pubcb2a7770dcbc09aaf1da459c45ecff65',
    applicationId: '571977b4-ca80-4a04-b8fe-5d5148508afd',
    site: 'ddog-gov.com',
    service: 'studymanager',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input'
}

const isLocalDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const statsDataTimeLimit = 1200000; // 20 minutes

window.onload = async () => {
    if(location.host === urls.prod) {
        !firebase.apps.length ? firebase.initializeApp(prodFirebaseConfig) : firebase.app();
        window.DD_RUM && window.DD_RUM.init({ ...datadogConfig, env: 'prod' });
    } 
    else if(location.host === urls.stage) {
        !firebase.apps.length ? firebase.initializeApp(stageFirebaseConfig) : firebase.app();
        window.DD_RUM && window.DD_RUM.init({ ...datadogConfig, env: 'stage' });
    } 
    else if (isLocalDev) {
        let localDevFirebaseConfig = null;
        let hasError = false;
        try {
          const localDevConfig = await import("./config/local-dev/config.js");
          localDevFirebaseConfig = localDevConfig.firebaseConfig;
          if (!localDevFirebaseConfig) hasError = true;
        } catch (error) {
          hasError = true;
        }

        if (hasError) {
          console.error("Local development requires firebaseConfig defined in /config/local-dev/config.js.");
          return;
        }
        !firebase.apps.length ? firebase.initializeApp(localDevFirebaseConfig) : firebase.app(); 
    } 
    else {
        !firebase.apps.length ? firebase.initializeApp(devFirebaseConfig) : firebase.app();
        !isLocalDev && window.DD_RUM && window.DD_RUM.init({ ...datadogConfig, env: 'dev' });
    }

    !isLocalDev && window.DD_RUM && window.DD_RUM.startSessionReplayRecording();

    router();
    localStorage.setItem("flags", JSON.stringify(saveFlag));
    localStorage.setItem("counters", JSON.stringify(counter));
    activityCheckController();
    const userSession = localStorage.getItem('userSession');
    userSession && appState.setState({ userSession: JSON.parse(userSession) });

    const statsData = localStorage.getItem("statsData");
    const statsDataUpdateTime = localStorage.getItem("statsDataUpdateTime");
    if (statsData && Date.now() - parseInt(statsDataUpdateTime) < statsDataTimeLimit) {
      appState.setState({statsData: JSON.parse(statsData), statsDataUpdateTime});
    } else {
      appState.setState({statsData: {}, statsDataUpdateTime: 0});
    }
    
};

window.onhashchange = () => {
    router();
};

const dataCorrectionsToolRoutes = [
    '#dataCorrectionsToolSelection',
    '#incentiveEligibilityTool',
    '#surveyResetTool',
    '#verificationCorrectionsTool',
];


const router = async () => {
    const hash = decodeURIComponent(window.location.hash);
    const route = hash || '#';
    const isParent = localStorage.getItem('isParent')
    if (await userLoggedIn() || localStorage.dashboard) {
        if (route === '#home') renderDashboard();
        else if (route === '#participants/notyetverified') renderParticipants('notyetverified');
        else if (route === '#participants/cannotbeverified') renderParticipants('cannotbeverified');
        else if (route === '#participants/verified') renderParticipants('verified');
        else if (route === '#participants/all') renderParticipants('all');
        else if (route === '#participants/profilenotsubmitted') renderParticipants('profileNotSubmitted');
        else if (route === '#participants/consentnotsubmitted') renderParticipants('consentNotSubmitted');
        else if (route === '#participants/notsignedin') renderParticipants('notSignedIn');
        else if (route === '#participantLookup') renderParticipantLookup();
        else if (route === '#participantDetails') {
            if (JSON.parse(localStorage.getItem("participant")) === null) {
                alert("No participant selected. Please select a participant from the participants dropdown or the participant lookup page");
            } else {
                let participant = JSON.parse(localStorage.getItem("participant"));
                let changedOption = {};
                renderParticipantDetails(participant, changedOption);
            }
        }
        else if (route === '#participantSummary') {
            if (JSON.parse(localStorage.getItem("participant")) === null) {
                alert("No participant selected. Please select a participant from the participants dropdown or the participant lookup page");
            }
            else {
                let participant = JSON.parse(localStorage.getItem("participant"));
                let reports = {};
                //Retrive the Physical Activity Report
                let physActReport = await retrievePhysicalActivityReport(participant);
                if (physActReport) {
                    reports.physActReport = physActReport;
                }
                renderParticipantSummary(participant, reports);
            }
        }
        else if (route === '#participantMessages') {
            if (JSON.parse(localStorage.getItem("participant")) === null) {
                alert("No participant selected. Please select a participant from the participants dropdown or the participant lookup page");
            }
            else {
                let participant = JSON.parse(localStorage.getItem("participant"))
                renderParticipantMessages(participant);
            }
        }
        else if (route === '#replaceHomeCollectionKit') {
            const participant = JSON.parse(localStorage.getItem("participant"));
            if (participant === null) {
                alert("No participant selected. Please select a participant from the participants dropdown or the participant lookup page");
            }
            else {
                let participant = JSON.parse(localStorage.getItem("participant"))
                renderReplacementKitRequest(participant);
            }
        }
        else if (dataCorrectionsToolRoutes.includes(route)) {
            if (JSON.parse(localStorage.getItem("participant")) === null) {
                alert("No participant selected. Please select a participant from the participants dropdown or the participant lookup page");
            }
            else {
                let participant = JSON.parse(localStorage.getItem("participant"));

                switch(route) {
                    case '#dataCorrectionsToolSelection':
                        setupDataCorrectionsSelectionToolPage(participant)
                        break;
                    case '#verificationCorrectionsTool':
                        setupVerificationCorrectionsPage(participant)
                        break;
                    case '#surveyResetTool':
                        setupSurveyResetToolPage(participant)
                        break;
                    case '#incentiveEligibilityTool':
                        setupIncentiveEligibilityToolPage(participant)
                        break;
                    default:
                        window.location.hash = '#dataCorrectionsToolSelection';
                        break;
                }
            }
        }

        else if (route === '#siteMessages') renderSiteMessages();
        else if (route === '#participantWithdrawal' && isParent === 'true') {
            if (JSON.parse(localStorage.getItem("participant")) === null) {
                renderParticipantWithdrawal();
            }
            else {
                let participant = JSON.parse(localStorage.getItem("participant"))
                renderParticipantWithdrawal(participant);
            }
        }
        else if (route === '#notifications/createnotificationschema') createNotificationSchema();
        else if (route === '#notifications/retrievenotificationschema') renderRetrieveNotificationSchema();
        else if (route === '#notifications/editSchema') editNotificationSchema();
        else if (route === '#notifications/showDraftSchemas') showDraftSchemas();
        else if (route === '#logout') clearLocalStorage();
        else window.location.hash = '#home';
    }
    else if (route === '#') homePage();
    else window.location.hash = '#';
}

const headsupBanner = () => {
    return `<div class="alert alert-danger alert-dismissible fade show" role="alert">
            <center> Warning: This is a test environment, <b> do not use real participant data  </b> </center>
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>`;
};

const homePage = () => {
    if (localStorage.dashboard) {
        window.location.hash = '#home';
    }
    else {
        document.getElementById('navBarLinks').innerHTML = renderNavBarLinks();
        const mainContent = document.getElementById('mainContent')
        mainContent.innerHTML = renderLogin();

        const form = document.getElementById('ssoLogin');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('ssoEmail').value;
            let tenantID = '';
            let provider = '';
            
            if(location.host === urls.prod) {
                let config = prodSSOConfig(email);
                tenantID = config.tenantID;
                provider = config.provider;
            }
            else if(location.host === urls.stage) {
                let config = stageSSOConfig(email);
                tenantID = config.tenantID;
                provider = config.provider;
            }
            else {
                let config = devSSOConfig(email);
                tenantID = config.tenantID;
                provider = config.provider;
            }

            const saml = new firebase.auth.SAMLAuthProvider(provider);
            firebase.auth().tenantId = tenantID;
            firebase.auth().signInWithPopup(saml)
                .then((result) => {
                    appState.setState({userSession:{email: result.user.email}});
                    localStorage.setItem('userSession', JSON.stringify({email: result.user.email}));
                    location.hash = '#home'
                })
                .catch((error) => {
                    console.log(error);
                });
        });
    }
};

const renderActivityCheck = () => {
    return  `<div class="modal fade" id="siteManagerMainModal" data-keyboard="false" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
                        <div class="modal-content sub-div-shadow">
                            <div class="modal-header" id="siteManagerModalHeader"></div>
                            <div class="modal-body" id="siteManagerModalBody"></div>
                        </div>
                    </div>
                </div>`
}

const renderDashboard = async () => {
    if (localStorage.dashboard || await getIdToken()) {
        showAnimation();
        const idToken = await getIdToken();
        const isAuthorized = await authorize(idToken);

        if (isAuthorized && isAuthorized.code === 200) {
            localStorage.setItem('isParent', isAuthorized.isParent)
            localStorage.setItem('coordinatingCenter', isAuthorized.coordinatingCenter)
            localStorage.setItem('helpDesk', isAuthorized.helpDesk)
            document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks();
            removeActiveClass('nav-link', 'active');
            document.getElementById('dashboardBtn').classList.add('active');
            mainContent.innerHTML = '';
            mainContent.innerHTML = renderActivityCheck();
            location.host !== urls.prod ? mainContent.innerHTML = headsupBanner() : ``
            renderCharts(idToken);
        }
        internalNavigatorHandler(counter); // function call to prevent internal navigation when there's unsaved changes
        if (isAuthorized.code === 401) {
            clearLocalStorage();
        }
    } else {
        hideAnimation();
        window.location.hash = '#';
    }
}

const renderCharts = async (accessToken) => {
    let statsData = {};
    let currentTime = Date.now();
    const statsDataUpdateTime = appState.getState().statsDataUpdateTime ?? 0;

    if (currentTime - statsDataUpdateTime < statsDataTimeLimit) {
      statsData = appState.getState().statsData;
    } else {
      const response = await getStatsForDashboard(accessToken);
      if (response.code !== 200) return;
      
      [statsData] = response.data;
      if (!statsData || Object.keys(statsData).length === 0) return;

      appState.setState({statsData, statsDataUpdateTime: currentTime});
      localStorage.setItem("statsData", JSON.stringify(statsData));
      localStorage.setItem("statsDataUpdateTime", currentTime);
    }

    localStorage.setItem('dropDownstatusFlag', false);
    if (localStorage.getItem('isParent') === 'true') {
        localStorage.setItem('dropDownstatusFlag', true);
        const siteSelectionRow = document.createElement('div');
        siteSelectionRow.classList = ['row'];
        siteSelectionRow.id = 'siteSelection';
        siteSelectionRow.innerHTML = renderSiteKeyList();
        mainContent.appendChild(siteSelectionRow);
        const sitekeyName = 'Filter by Site';
        handleSiteSelection(sitekeyName);
    }

    const transformedData = transformDataForCharts(statsData);
    renderAllCharts(transformedData);
    hideAnimation();
};

const transformDataForCharts = (siteData) => {
  const {
    race: raceMetrics,
    age: ageMetrics,
    gender: genderMetrics,
    verification: verificationMetrics,
    workflow: workflowMetrics,
    recruitsCount: recruitsCountMetrics,
    optOuts: optOutsMetrics,
    allModules: allModulesMetrics,
    moduleOne: moduleOneMetrics,
    modulesTwoThree: modulesTwoThreeMetrics,
    modulesNone: modulesNoneMetrics,
    ssn: ssnMetrics,
    biospecimen: biospecimenMetrics,
    allCollections: allCollectionsMetrics,
    clinicalCollections: clinicalCollectionsMetrics,
    researchCollections: researchCollectionsMetrics,
  } = siteData;

  const recruitsCount = filterRecruits(recruitsCountMetrics);
  const activeRecruitsFunnel = filterRecruitsFunnel(workflowMetrics, "active", recruitsCount.activeCount);
  const passiveRecruitsFunnel = filterRecruitsFunnel(workflowMetrics, "passive", recruitsCount.passiveCount);
  const totalRecruitsFunnel = filterTotalRecruitsFunnel(activeRecruitsFunnel, passiveRecruitsFunnel);

  const activeCurrentWorkflow = filterCurrentWorkflow(workflowMetrics, "active");
  const passiveCurrentWorkflow = filterCurrentWorkflow(workflowMetrics, "passive");
  const totalCurrentWorkflow = filterTotalCurrentWorkflow(activeCurrentWorkflow, passiveCurrentWorkflow);
  const activeVerificationStatus = filterVerification(verificationMetrics, "active");
  const passiveVerificationStatus = filterVerification(verificationMetrics, "passive");
  const denominatorVerificationStatus = filterDenominatorVerificationStatus(workflowMetrics);
  const genderStats = filterGenderMetrics(
    genderMetrics,
    activeVerificationStatus.verified,
    passiveVerificationStatus.verified
  );
  const raceStats = filterRaceMetrics(
    raceMetrics,
    activeVerificationStatus.verified,
    passiveVerificationStatus.verified
  );
  const ageStats = filterAgeMetrics(ageMetrics, activeVerificationStatus.verified, passiveVerificationStatus.verified);
  const optOutsStats = filterOptOutsMetrics(optOutsMetrics);
  const modulesStats = filterModuleMetrics(
    allModulesMetrics,
    moduleOneMetrics,
    modulesTwoThreeMetrics,
    modulesNoneMetrics,
    activeVerificationStatus.verified,
    passiveVerificationStatus.verified
  );
  const ssnStats = filterSsnMetrics(ssnMetrics, activeVerificationStatus.verified, passiveVerificationStatus.verified);
  const biospecimenStats = filterBiospecimenStats(
    biospecimenMetrics,
    activeVerificationStatus.verified + passiveVerificationStatus.verified
  );
  const collectionStats = filterCollectionMetrics(allCollectionsMetrics, clinicalCollectionsMetrics, researchCollectionsMetrics);

  return {
    activeRecruitsFunnel,
    passiveRecruitsFunnel,
    totalRecruitsFunnel,
    activeCurrentWorkflow,
    passiveCurrentWorkflow,
    totalCurrentWorkflow,
    genderStats,
    raceStats,
    ageStats,
    activeVerificationStatus,
    passiveVerificationStatus,
    denominatorVerificationStatus,
    recruitsCount,
    modulesStats,
    ssnStats,
    optOutsStats,
    biospecimenStats,
    collectionStats
  };
};

const renderSiteKeyList = () => {
    const template = `    
        <div style="margin-top:10px; padding:15px;" class="dropdown">
            <button class="btn btn-secondary dropdown-toggle dropdown-toggle-sites" id="dropdownSites" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Filter by Site
            </button>
            <ul class="dropdown-menu" id="dropdownMenuButtonSites" aria-labelledby="dropdownMenuButton">
                <li><a class="dropdown-item" data-siteKey="allResults" id="all">All</a></li>
                <li><a class="dropdown-item" data-siteKey="BSWH" id="BSWH">Baylor Scott & White Health</a></li>
                <li><a class="dropdown-item" data-siteKey="hfHealth" id="hfHealth">Henry Ford HS</a></li>
                <li><a class="dropdown-item" data-siteKey="hPartners" id="hPartners">Health Partners</a></li>
                <li><a class="dropdown-item" data-siteKey="kpGA" id="kpGA">KP GA</a></li>
                <li><a class="dropdown-item" data-siteKey="kpHI" id="kpHI">KP HI</a></li>
                <li><a class="dropdown-item" data-siteKey="kpNW" id="kpNW">KP NW</a></li>
                <li><a class="dropdown-item" data-siteKey="kpCO" id="kpCO">KP CO</a></li>
                <li><a class="dropdown-item" data-siteKey="maClinic" id="maClinic">Marshfield Clinic</a></li>
                ${((location.host !== urls.prod) && (location.host !== urls.stage)) ? `<li><a class="dropdown-item" data-siteKey="nci" id="nci">NCI</a></li>` : ``}
                <li><a class="dropdown-item" data-siteKey="snfrdHealth" id="snfrdHealth">Sanford Health</a></li>
                <li><a class="dropdown-item" data-siteKey="uChiM" id="uChiM">UofC Medicine</a></li>
            </ul>
        </div>
        `;
    return template;
};

const handleSiteSelection = (siteTextContent) => {
  const siteSelectionButton = document.getElementById("dropdownSites");
  siteSelectionButton.innerHTML = siteTextContent;
  const dropdownMenuButton = document.getElementById("dropdownMenuButtonSites");
  dropdownMenuButton &&
    dropdownMenuButton.addEventListener("click", (e) => {
      reRenderDashboard(e.target.textContent, e.target.dataset.sitekey);
    });
};

const retrievePhysicalActivityReport = async (participant) => {
    if (!participant || !participant.state || !participant.state.uid) {
        return null;
    }
    
    try {
        const idToken = await getIdToken();
        const response = await fetch(`${baseAPI}/dashboard?api=retrievePhysicalActivityReport&uid=${participant.state.uid}`, {
            method: "GET",
            headers:{
                Authorization: "Bearer " + idToken,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) { 
            const error = (response.status + ": " + (await response.json()).message);
            throw new Error(error);
        }
        
        let data = await response.json();
        if (data.code === 200) {
            return data.data ? data.data[0] : null;
        }
    } catch (error) {
        console.error('Error in retrievePhysicalActivityReport:', error);
        throw error;
    }

}

/**
 * Get all stats data for dashboard metrics rendering
 * @param {string} accessToken 
 */
const getStatsForDashboard = async (accessToken) => {
  try {
    const response = await fetch(
      `${baseAPI}/dashboard?api=getStatsForDashboard`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      }
    );

    return await response.json();
  } catch (error) {
    console.error(error);
    return { code: 500, data: [], message: "Internal Server Error" };
  }
};

const authorize = async (siteKey) => {
    const response = await fetch(`${baseAPI}/dashboard?api=validateSiteUsers`, {
        method: 'GET',
        headers: {
            Authorization: "Bearer " + siteKey
        }
    });
    return await response.json();

}

const filterGenderMetrics = (participantsGenderMetrics, activeVerifiedParticipants, passiveVerifiedParticipants) => {
    const verifiedParticipants =  activeVerifiedParticipants + passiveVerifiedParticipants
    let genderObject = { female: 0, male: 0, intersex: 0, unavailable: 0, verifiedParticipants: 0 }
    participantsGenderMetrics && participantsGenderMetrics.forEach(i => {
        (parseInt(i.sex) === fieldMapping.male) ?
            genderObject['male'] += parseInt(i.sexCount)
        : (parseInt(i.sex) === fieldMapping.female) ?
            genderObject['female'] += parseInt(i.sexCount)
        : (parseInt(i.sex) === fieldMapping.intersex) ?
            genderObject['intersex'] += parseInt(i.sexCount)
        : (parseInt(i.sex) === fieldMapping.unavailable) ?
            genderObject['unavailable'] += parseInt(i.sexCount)
        : (parseInt(i.kpSex) === fieldMapping.male) ? // kp harmonization
            genderObject['male'] += parseInt(i.kpSexCount)
        : (parseInt(i.kpSex) === fieldMapping.female) ?
            genderObject['female'] += parseInt(i.kpSexCount)
        : (parseInt(i.kpSex) === fieldMapping.neitherMF) ?
            genderObject['intersex'] += parseInt(i.kpSexCount)
        : (parseInt(i.kpSex) === fieldMapping.unavailable) ?
            genderObject['unavailable'] += parseInt(i.kpSexCount)
        : (parseInt(i.kpSex) === fieldMapping.other) ?
            genderObject['intersex'] += parseInt(i.kpSexCount) 
        : (parseInt(i.shHfSex) === fieldMapping.male) ? // SH & HF harmonization
            genderObject['male'] += parseInt(i.shHfSexCount)
        : (parseInt(i.shHfSex) === fieldMapping.female) ?
            genderObject['female'] += parseInt(i.shHfSexCount)
        : (parseInt(i.shHfSex) === fieldMapping.unavailable) ?
            genderObject['unavailable'] += parseInt(i.shHfSexCount)
        : ``
})
    genderObject.verifiedParticipants = verifiedParticipants
    return genderObject;
}


const filterRaceMetrics = (participantsRaceMetrics, activeVerifiedParticipants, passiveVerifiedParticipants) => {
    const verifiedParticipants =  activeVerifiedParticipants + passiveVerifiedParticipants
    let raceObject = { white: 0, other: 0, unavailable: 0, verifiedParticipants: 0 }
    participantsRaceMetrics && participantsRaceMetrics.forEach(i => {

        (parseInt(i.race) === fieldMapping.white) ?
        raceObject['white'] += parseInt(i.raceCount)
        :  (parseInt(i.shRace) === fieldMapping.whiteSH) ?
        raceObject['white'] += parseInt(i.shRaceCount)
        :  (parseInt(i.hfRace) === fieldMapping.whiteHF) ?
        raceObject['white'] += parseInt(i.hfRaceCount)
        :  (parseInt(i.race) === fieldMapping.other) ?
        raceObject['other'] += parseInt(i.raceCount)

        :  (parseInt(i.shRace) === fieldMapping.africanAmericanSH) ? // SH Harmonization
        raceObject['other'] += parseInt(i.shRaceCount)
        :  (parseInt(i.shRace) === fieldMapping.americanIndianSH) ?
        raceObject['other'] += parseInt(i.shRaceCount)
        :  (parseInt(i.shRace) === fieldMapping.asianSH) ?
        raceObject['other'] += parseInt(i.shRaceCount)
        :  (parseInt(i.shRace) === fieldMapping.hispanicLBSH) ?
        raceObject['other'] += parseInt(i.shRaceCount)
        :  (parseInt(i.shRace) === fieldMapping.hispanicLDSH) ?
        raceObject['other'] += parseInt(i.shRaceCount)
        :  (parseInt(i.shRace) === fieldMapping.hispanicLWSH) ?
        raceObject['other'] += parseInt(i.shRaceCount)
        :  (parseInt(i.shRace) === fieldMapping.nativeHawaiianSH) ?
        raceObject['other'] += parseInt(i.shRaceCount)
        :  (parseInt(i.shRace) === fieldMapping.nativeHawaiianPISH) ?
        raceObject['other'] += parseInt(i.shRaceCount)
        :  (parseInt(i.shRace) === fieldMapping.pacificIslanderSH) ?
        raceObject['other'] += parseInt(i.shRaceCount)
        :  (parseInt(i.shRace) === fieldMapping.blankSH) ?
        raceObject['unavailable'] += parseInt(i.shRaceCount)
        :  (parseInt(i.shRace) === fieldMapping.declinedSH) ?
        raceObject['unavailable'] += parseInt(i.shRaceCount)
        :  (parseInt(i.shRace) === fieldMapping.unavailable) ?
        raceObject['unavailable'] += parseInt(i.shRaceCount)
        
        :  (parseInt(i.hfRace) === fieldMapping.africanAmericanHF) ? // HF Harmonization
        raceObject['other'] += parseInt(i.hfRaceCount)
        :  (parseInt(i.hfRace) === fieldMapping.otherHF) ?
        raceObject['other'] += parseInt(i.hfRaceCount)
      
        :  (parseInt(i.race) === fieldMapping.unavailable) ?
        raceObject['unavailable'] += parseInt(i.raceCount)
        : (parseInt(i.hfRace) === fieldMapping.unavailable) ?
        raceObject['unavailable'] += parseInt(i.hfRaceCount)
     :``
})
    raceObject.verifiedParticipants = verifiedParticipants
    return raceObject;

}

const filterAgeMetrics = (participantsAgeMetrics, activeVerifiedParticipants, passiveVerifiedParticipants) => {
    const verifiedParticipants =  activeVerifiedParticipants + passiveVerifiedParticipants
    let ageObject = { '30-34': 0, '35-39': 0, '40-45': 0, '46-50': 0, '51-55': 0, '56-60': 0, '61-65': 0, '66-70': 0, verifiedParticipants: 0 }
    participantsAgeMetrics && participantsAgeMetrics.forEach(i => {
        if (parseInt(i.recruitmentAge) === fieldMapping.ageRange1) {
            ageObject['30-34'] +=  parseInt(i.recruitmentAgeCount)
        }
        else if (parseInt(i.recruitmentAge) === fieldMapping.ageRange2) {
            ageObject['35-39'] +=  parseInt(i.recruitmentAgeCount)
        }
        else if (parseInt(i.recruitmentAge) === fieldMapping.ageRange3) {
            ageObject['40-45'] +=  parseInt(i.recruitmentAgeCount)
        }
        else if (parseInt(i.recruitmentAge) === fieldMapping.ageRange4) {
            ageObject['46-50'] +=  parseInt(i.recruitmentAgeCount)
        }
        else if (parseInt(i.recruitmentAge) === fieldMapping.ageRange5) {
            ageObject['51-55'] +=  parseInt(i.recruitmentAgeCount)
        }
        else if (parseInt(i.recruitmentAge) === fieldMapping.ageRange6) {
            ageObject['56-60'] +=  parseInt(i.recruitmentAgeCount)
        }
        else if (parseInt(i.recruitmentAge) === fieldMapping.ageRange7) {
            ageObject['61-65'] +=  parseInt(i.recruitmentAgeCount)
        }
        else if (parseInt(i.recruitmentAge) === fieldMapping.ageRange8) {
            ageObject['66-70'] +=  parseInt(i.recruitmentAgeCount)
        }
    })
    ageObject.verifiedParticipants = verifiedParticipants
    return ageObject;
}

const filterOptOutsMetrics = (participantOptOutsMetric) => {
    let currentWorflowObj = {}
    let totalOptOuts = 0
    participantOptOutsMetric && participantOptOutsMetric.filter( i => totalOptOuts += i.totalOptOuts );
    currentWorflowObj.totalOptOuts = totalOptOuts
    return currentWorflowObj;
}

const filterModuleMetrics = (allModulesMetrics, moduleOneMetrics, modulesTwoThreeMetrics, moduleNoneMetrics, activeVerifiedParticipants, passiveVerifiedParticipants) => {
    let noModules = 0;
    let moduleOne = 0;
    let modulesTwoThree = 0;
    let allModules = 0;
    let allModulesBlood = 0;
    let allModulesAllSamples = 0;
  
    allModulesMetrics && allModulesMetrics.forEach((data) => {
        allModules += data.countAllModules;
        allModulesBlood += data.countAllModulesBlood;
        allModulesAllSamples += data.countAllModulesBloodUrineMouthwash;
    });
    moduleOneMetrics && moduleOneMetrics.forEach((data) => moduleOne += data.countModule1);
    modulesTwoThreeMetrics && modulesTwoThreeMetrics.forEach((data) =>  modulesTwoThree += data.countModules);
    moduleNoneMetrics && moduleNoneMetrics.forEach((data) =>  noModules += data.countModules);

    return {
        noModulesSubmitted: noModules,
        moduleOneSubmitted: moduleOne,
        modulesTwoThreeSubmitted: modulesTwoThree,
        modulesSubmitted: allModules,
        verifiedParticipants: activeVerifiedParticipants + passiveVerifiedParticipants,
        allModulesBlood,
        allModulesAllSamples
    };
};

const filterSsnMetrics = (participantsSsnMetrics, activeVerifiedParticipants, passiveVerifiedParticipants) => {
    let currentWorflowObj = {}
    let ssnFullFlagCounter = 0
    let ssnHalfFlagCounter = 0
    let ssnNoFlagCounter = 0
    const verifiedParticipants = activeVerifiedParticipants +  passiveVerifiedParticipants

    participantsSsnMetrics && participantsSsnMetrics.filter( i => {
        if (i.SSN === 'ssnFlag') { ssnFullFlagCounter += i.SSN_token }
        if (i.SSN === 'ssnHalfFlag') { ssnHalfFlagCounter += i.SSN_token }
        if (i.SSN === 'ssnNoFlag' ) { ssnNoFlagCounter += i.SSN_token }

    })
    currentWorflowObj.ssnNoFlagCounter = ssnNoFlagCounter;
    currentWorflowObj.ssnFullFlagCounter = ssnFullFlagCounter;
    currentWorflowObj.ssnHalfFlagCounter = ssnHalfFlagCounter;
    currentWorflowObj.verifiedParticipants = verifiedParticipants;
    return currentWorflowObj; 
}

const filterCollectionMetrics = (allCollectionsMetrics, clinicalCollectionsMetrics, researchCollectionsMetrics) => {
    let allCollections = 0;
    let researchCollections = 0;
    let clinicalCollections = 0;

    if (Array.isArray(allCollectionsMetrics)) {
        allCollections = allCollectionsMetrics.reduce((prev, current) => {
            return prev += current.verfiedPts;
        }, allCollections);
    }
    if (Array.isArray(researchCollectionsMetrics)) {
        researchCollections = researchCollectionsMetrics.reduce((prev, current) => {
            return prev += current.verfiedPts;
        }, researchCollections);
    }
    if (Array.isArray(allCollectionsMetrics)) {
        clinicalCollections = clinicalCollectionsMetrics.reduce((prev, current) => {
            return prev += current.verfiedPts;
        }, clinicalCollections);
    }

    return {allCollections, researchCollections, clinicalCollections};
}

const filterRecruitsFunnel = (data, recruit) => {
    let recruitType = fieldMapping[recruit];
    let currentWorflowObj = {};
    let signedInCount = 0;
    let consentedCount = 0;
    let submittedProfileCount = 0;
    let verificationCount = 0;
    let verifiedCount = 0;
    let signedIn = ``
    if (recruitType === fieldMapping.active) {
        signedIn = data.filter(i => (i.recruitType === recruitType && i.signedStatus === fieldMapping.yes && (i.verificationStatus != fieldMapping.duplicate) ));
        signedIn.forEach((i) => {
            signedInCount += i.signedCount
        })
    }
    else {
        signedIn = data.filter(i => (i.recruitType === recruitType && i.signedStatus === fieldMapping.yes ));
        signedIn.forEach((i) => {
            signedInCount += i.signedCount
        })
    }
    let consented = ``
    if (recruitType === fieldMapping.active) { 
        consented = data.filter(i =>
            (i.recruitType === recruitType && i.signedStatus === fieldMapping.yes && i.consentStatus === fieldMapping.yes && (i.verificationStatus != fieldMapping.duplicate)))
        consented.forEach((i) => {
            consentedCount += i.consentCount
        })
    }
    else {
        consented = data.filter(i =>
            (i.recruitType === recruitType && i.signedStatus === fieldMapping.yes && i.consentStatus === fieldMapping.yes))
        consented.forEach((i) => {
            consentedCount += i.consentCount
        })
    }
    let submittedProfile = ``
    if (recruitType === fieldMapping.active) { 
        submittedProfile = data.filter(i =>
            (i.recruitType === recruitType && i.signedStatus === fieldMapping.yes && i.consentStatus === fieldMapping.yes && i.submittedStatus === fieldMapping.yes && (i.verificationStatus != fieldMapping.duplicate)))
        submittedProfile.forEach((i) => {
            submittedProfileCount += i.submittedCount
        })
    }
    else {
        submittedProfile = data.filter(i =>
            (i.recruitType === recruitType && i.signedStatus === fieldMapping.yes && i.consentStatus === fieldMapping.yes && i.submittedStatus === fieldMapping.yes))
        submittedProfile.forEach((i) => {
            submittedProfileCount += i.submittedCount
        })
    }
    let verification = ``
    if (recruitType === fieldMapping.active) {
        verification = data.filter(i =>
            (i.recruitType === recruitType && i.signedStatus === fieldMapping.yes && i.consentStatus === fieldMapping.yes && i.submittedStatus === fieldMapping.yes && (i.verificationStatus === fieldMapping.verified || i.verificationStatus === fieldMapping.cannotBeVerified)))
        verification.forEach((i) => {
            verificationCount += i.verificationCount
        })
    }
    else { 
        verification = data.filter(i =>
            (i.recruitType === recruitType && i.signedStatus === fieldMapping.yes && i.consentStatus === fieldMapping.yes && i.submittedStatus === fieldMapping.yes && (i.verificationStatus === fieldMapping.verified || i.verificationStatus === fieldMapping.cannotBeVerified || i.verificationStatus === fieldMapping.duplicate)))
        verification.forEach((i) => {
            verificationCount += i.verificationCount
        })
    }
    let verified = data.filter(i =>
        (i.recruitType === recruitType && i.signedStatus === fieldMapping.yes && i.consentStatus === fieldMapping.yes && i.submittedStatus === fieldMapping.yes && (i.verificationStatus === fieldMapping.verified)))
    verified.forEach((i) => {
        verifiedCount += i.verificationCount
    })

    currentWorflowObj.signedIn = signedInCount;
    currentWorflowObj.consented = consentedCount;
    currentWorflowObj.submittedProfile = submittedProfileCount;
    currentWorflowObj.verification = verificationCount;
    currentWorflowObj.verified = verifiedCount;
    return currentWorflowObj;
}

const filterTotalRecruitsFunnel = (activeRecruitsStats, passiveRecruitsStats) => {
    let currentWorflowObj = {}
    currentWorflowObj.signedIn = activeRecruitsStats.signedIn + passiveRecruitsStats.signedIn
    currentWorflowObj.consented = activeRecruitsStats.consented + passiveRecruitsStats.consented
    currentWorflowObj.submittedProfile = activeRecruitsStats.submittedProfile + passiveRecruitsStats.submittedProfile
    currentWorflowObj.verification = activeRecruitsStats.verification + passiveRecruitsStats.verification
    currentWorflowObj.verified = activeRecruitsStats.verified + passiveRecruitsStats.verified

    return currentWorflowObj;
}


const filterCurrentWorkflow = (data, recruit) => {
    let recruitType = fieldMapping[recruit]
    let currentWorflowObj = {}
    let notSignedIn = data.filter(i => (i.recruitType === recruitType && i.signedStatus === fieldMapping.no && i.verificationStatus != fieldMapping.duplicate))
    let signedIn = ``
    if (recruitType === fieldMapping.active) {
        signedIn = data.filter(i => (i.recruitType === recruitType && i.signedStatus === fieldMapping.yes && i.consentStatus === fieldMapping.no && i.verificationStatus != fieldMapping.duplicate))
    } else {
        signedIn = data.filter(i => (i.recruitType === recruitType && i.signedStatus === fieldMapping.yes && i.consentStatus === fieldMapping.no))
    }
    let consented = ``
    if (recruitType === fieldMapping.active) {
        consented = data.filter(i => (i.recruitType === recruitType && i.consentStatus === fieldMapping.yes && i.submittedStatus === fieldMapping.no && i.verificationStatus != fieldMapping.duplicate))
    } else {
        consented = data.filter(i => (i.recruitType === recruitType && i.consentStatus === fieldMapping.yes && i.submittedStatus === fieldMapping.no))
    }
    let submittedProfile = data.filter(i =>
        (i.recruitType === recruitType && i.submittedStatus === fieldMapping.yes && (i.verificationStatus === fieldMapping.notYetVerified || i.verificationStatus === fieldMapping.outreachTimedout)))
    let verification = ``
    if (recruitType === fieldMapping.active) {
        verification = data.filter(i =>
            (i.recruitType === recruitType && i.submittedStatus === fieldMapping.yes && (i.verificationStatus === fieldMapping.verified || i.verificationStatus === fieldMapping.cannotBeVerified)))
    }
    else {
       verification = data.filter(i =>
        (i.recruitType === recruitType && i.submittedStatus === fieldMapping.yes && (i.verificationStatus === fieldMapping.verified || i.verificationStatus === fieldMapping.cannotBeVerified || i.verificationStatus === fieldMapping.duplicate)))
    }
    if (recruitType === fieldMapping.passive) currentWorflowObj.notSignedIn = 0
    else currentWorflowObj.notSignedIn = getCummulativeCountHandler(notSignedIn);
    currentWorflowObj.signedIn = getCummulativeCountHandler(signedIn);
    currentWorflowObj.consented = getCummulativeCountHandler(consented);
    currentWorflowObj.submittedProfile = getCummulativeCountHandler(submittedProfile);
    currentWorflowObj.verification = getCummulativeCountHandler(verification);
    return currentWorflowObj;
}

const getCummulativeCountHandler = (objectHolder) => {
    let workflowCounter = 0;
    if (objectHolder[0] !== undefined) {
        objectHolder.forEach(i => {
            workflowCounter += i.verificationCount
        })
    }
    else {
        return workflowCounter;
    }
    return workflowCounter;
}

const filterTotalCurrentWorkflow = (activeCurrentWorkflow, passiveCurrentWorkflow) => {
    let currentWorflowObj = {}
    currentWorflowObj.notSignedIn = activeCurrentWorkflow.notSignedIn + passiveCurrentWorkflow.notSignedIn;
    currentWorflowObj.signedIn = activeCurrentWorkflow.signedIn +  passiveCurrentWorkflow.signedIn;
    currentWorflowObj.consented = activeCurrentWorkflow.consented + passiveCurrentWorkflow.consented;
    currentWorflowObj.submittedProfile = activeCurrentWorkflow.submittedProfile + passiveCurrentWorkflow.submittedProfile;
    currentWorflowObj.verification = activeCurrentWorkflow.verification + passiveCurrentWorkflow.verification;
    return currentWorflowObj;
}

const filterVerification = (data, recruit) => {
    let currentVerificationObj = {};
    let recruitType = fieldMapping[recruit]
    let outreachTimedout = 0;
    let notYetVerified = 0;
    let verified = 0;
    let cannotBeVerified = 0;
    let duplicate = 0;
    let filteredData = data.filter(i => i.recruitType === recruitType);
    filteredData.forEach((i) => {

        if (i.verificationStatus === fieldMapping.notYetVerified) {
            notYetVerified += i.verificationCount
        }
        else if (i.verificationStatus === fieldMapping.outreachTimedout) {
            outreachTimedout += i.verificationCount
        }
        else if (i.verificationStatus === fieldMapping.verified) {
            verified += i.verificationCount
        }
        else if (i.verificationStatus === fieldMapping.cannotBeVerified) {
            cannotBeVerified += i.verificationCount
        }
        else if (i.verificationStatus === fieldMapping.duplicate) {
            duplicate += i.verificationCount
        }
    });
    currentVerificationObj.notYetVerified = notYetVerified 
    currentVerificationObj.outreachTimedout = outreachTimedout
    currentVerificationObj.verified = verified
    currentVerificationObj.cannotBeVerified = cannotBeVerified
    if (recruitType === fieldMapping.active)  currentVerificationObj.duplicate = duplicate
    else currentVerificationObj.duplicate = duplicate
    return currentVerificationObj;

}

const filterDenominatorVerificationStatus = (data) => {
    let currentObj = {};
    let activeConsentCount = 0
    let passiveConsentCount = 0
    let activeDenominator = data.filter(i => i.recruitType === fieldMapping.active && (i.recruitType !== fieldMapping.inactive)
        && i.consentStatus === fieldMapping.yes && i.submittedStatus === fieldMapping.yes);
    activeDenominator.forEach((i) => {
        activeConsentCount += i.consentCount
    })
    let passiveDenominator = data.filter(i => i.recruitType === fieldMapping.passive && (i.recruitType !== fieldMapping.inactive)
        && i.consentStatus === fieldMapping.yes && i.submittedStatus === fieldMapping.yes);
    passiveDenominator.forEach((i) => {
        passiveConsentCount += i.consentCount
    })
    currentObj.activeDenominator = activeConsentCount
    currentObj.passiveDenominator = passiveConsentCount
    return currentObj;
}

const filterRecruits = (data) => {
    let currentObj = { 'activeCount': 0, 'passiveCount': 0 };
    let activeCount = 0;
    let passiveCount = 0;
    data.forEach((i) => {
        if (i.recruitType === fieldMapping.active) {
            activeCount = i.counter + activeCount
            currentObj.activeCount = activeCount
        } else if (i.recruitType === fieldMapping.passive) {
            passiveCount = i.counter + passiveCount
            currentObj.passiveCount = passiveCount;
        }
    })
    return currentObj;
}

const filterBiospecimenStats = (data, verifiedParticipants) => {
    let currenntBiospecimenStats = {};
    let all = 0;
    let bloodUrine = 0;
    let bloodMouthwash = 0;
    let urineMouthwash = 0;
    let mouthwash = 0;
    let urine = 0;
    let blood = 0;
    let none = 0;
    data && data.filter( i => {
        if (i.baselineBlood === fieldMapping.yes && i.baselineUrine === fieldMapping.yes && i.baselineMouthwash === fieldMapping.yes) { all += i.verfiedPts }
        if (i.baselineBlood === fieldMapping.yes && i.baselineUrine === fieldMapping.yes && i.baselineMouthwash === fieldMapping.no) { bloodUrine += i.verfiedPts }
        if (i.baselineBlood === fieldMapping.yes && i.baselineUrine === fieldMapping.no && i.baselineMouthwash === fieldMapping.yes) { bloodMouthwash += i.verfiedPts }
        if (i.baselineBlood === fieldMapping.no && i.baselineUrine === fieldMapping.yes && i.baselineMouthwash === fieldMapping.yes) { urineMouthwash += i.verfiedPts }
        if (i.baselineBlood === fieldMapping.yes && i.baselineUrine === fieldMapping.no && i.baselineMouthwash === fieldMapping.no) { blood += i.verfiedPts }
        if (i.baselineBlood === fieldMapping.no && i.baselineUrine === fieldMapping.yes && i.baselineMouthwash === fieldMapping.no) { urine += i.verfiedPts }
        if (i.baselineBlood === fieldMapping.no && i.baselineUrine === fieldMapping.no && i.baselineMouthwash === fieldMapping.yes) { mouthwash += i.verfiedPts }
        if ((i.baselineBlood === fieldMapping.no || i.baselineBlood === null) && (i.baselineUrine === fieldMapping.no || i.baselineUrine === null) 
            && (i.baselineMouthwash === fieldMapping.no || i.baselineMouthwash === null)) { none += i.verfiedPts }
    })

    currenntBiospecimenStats.all = all;
    currenntBiospecimenStats.bloodUrine = bloodUrine;
    currenntBiospecimenStats.bloodMouthwash = bloodMouthwash;
    currenntBiospecimenStats.urineMouthwash = urineMouthwash;
    currenntBiospecimenStats.urine = urine;
    currenntBiospecimenStats.mouthwash = mouthwash;
    currenntBiospecimenStats.blood = blood;
    currenntBiospecimenStats.none = none;
    return currenntBiospecimenStats;
}

const reRenderDashboard = async (siteTextContent, siteKey) => {
  mainContent.innerHTML = `<div class="row" id="siteSelection">${renderSiteKeyList()}</div>`;
  const siteCode = nameToKeyObj[siteKey];
  const siteData = filterDataBySiteCode(siteCode);
  const transformedData = transformDataForCharts(siteData);
  renderAllCharts(transformedData);
  handleSiteSelection(siteTextContent);
  hideAnimation();
};


export const clearLocalStorage = () => {
    firebase.auth().signOut();
    internalNavigatorHandler(counter);
    hideAnimation();
    delete localStorage.dashboard;
    delete localStorage.participant;
    delete localStorage.userSession;
    appState.setState({userSession: {}});
    window.location.hash = '#';
};

/**
 * Filter and return data matching the site code
 * @param {number} siteCode - site code
 * @returns {object}
 */
const filterDataBySiteCode = (siteCode) => {
  const statsData = appState.getState().statsData;
  if (siteCode === nameToKeyObj.allResults) {
    return statsData;
  }

  let result = {};
  for (const [key, dataArray] of Object.entries(statsData)) {
    result[key] = dataArray.filter((data) => data.siteCode === siteCode);
  }

  return result;
};
/**
 * Renders the participants table based on the specified filter type.
 *
 * @async
 * @function renderParticipants
 * @param {string} type - The participant filter type
 * 
 * @returns {Promise<void>}
 */
const renderParticipants = async (type) => {
    showAnimation();

    resetFilters();
    resetPagination();

    appState.setState({ participantTypeFilter: type, siteCode: `` });
    const response = await getParticipants();
    const data = sortByKey(response.data, fieldMapping.healthcareProvider);

    if (response.code === 200) {

        document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks();
        updateActiveElements(type);
        mainContent.innerHTML = renderTable(data, type);

        renderData(data, type);
        activeColumns(data);
        renderFilters();
        hideAnimation();
    }

    internalNavigatorHandler(counter);
    if (response.code === 401) {
        clearLocalStorage();
    }
}

/**
 * Helper function to update active navigation elements based on participant type
 * 
 * @function updateActiveElements
 * @param {string} type - The participant filter type
 */
const updateActiveElements = (type) => {
    
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

const activityCheckController = () => {
    let time;
    const resetTimer = () => {
        clearTimeout(time);
        time = setTimeout(() => {
            const resposeTimeout = setTimeout(() => {
                // log out user if they don't respond to warning after 5 minutes.
                clearLocalStorage();
            }, 300000)
            // Show warning after 20 minutes of no activity.
            const button = document.createElement('button');
            button.dataset.toggle = 'modal';
            button.dataset.target = '#siteManagerMainModal'
            document.body.appendChild(button);
            button.click();
            const header = document.getElementById('siteManagerModalHeader');
            const body = document.getElementById('siteManagerModalBody');
            header && (header.innerHTML = `<h5 class="modal-title">Inactive</h5>`)

            body && (body.innerHTML = `You were inactive for 20 minutes, would you like to extend your session?
                            <div class="modal-footer">
                                <button type="button" title="Close" class="btn btn-dark log-out-user" data-dismiss="modal">Log Out</button>
                                <button type="button" title="Continue" class="btn btn-primary extend-user-session" data-dismiss="modal">Continue</button>
                            </div>`)
            document.body.removeChild(button);
            Array.from(document.getElementsByClassName('log-out-user')).forEach(e => {
                e.addEventListener('click', () => {
                    clearLocalStorage();
                })
            })
            Array.from(document.getElementsByClassName('extend-user-session')).forEach(e => {
                e.addEventListener('click', () => {
                    clearTimeout(resposeTimeout);
                    resetTimer;
                })
            });
        }, 1200000);
    }
    window.onload = resetTimer;
    document.onmousemove = resetTimer;
    document.onkeypress = resetTimer;
};