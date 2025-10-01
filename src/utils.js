import en from "../i18n/en.js";
import es from "../i18n/es.js";
import { nameToKeyObj } from './idsToName.js';
import { appState } from './stateManager.js';

const i18n = {
    es, en
};
              
export const humanReadableFromISO = (participantDate) => {
  const submittedDate = new Date(String(participantDate));
  const humanReadable = submittedDate.toLocaleString('en-US', { month: 'long' }) + ' ' + submittedDate.getDate() + ',' + submittedDate.getFullYear();
  return humanReadable; // October 30, 2020
}

/**
 * Convert ISO8601 date to human readable date
 * @param {String} participantDate - ISO8601 date string
 * @param {boolean} formatToYearMonthDay - Optional flag to format date to YYYY-MM-DD
 * @returns {String} - Human readable date string (MM/DD/YYYY) or YYYY-MM-DD (true)
 * 
*/
export const formatUTCDate = (participantDate, formatToYearMonthDay) => {
  if (!participantDate) return 'N/A';
  const date = new Date(participantDate);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return formatToYearMonthDay ? `${year}-${month}-${day}` : `${month}/${day}/${year}`;
};

/**
 * Convert  human readable date to ISO8601 date
 * @param {String} dateString - human readable date
 * @param {boolean} useEST - If true then use midnight EST otherwise use UTC
 * @returns {String} - ISO8601 date
 * 
*/
export const convertToISO8601 = (dateString, useEST) => {
  let dateObj = new Date(dateString);
  if (useEST) {
    const formattedString = dateObj.toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'longOffset' })
    const matches = formattedString.match(/([+-]\d+):(\d+)$/);
    if (matches) {
      dateObj = new Date(dateString+'T00:00:00.000'+matches[0]);
    }
  }
  return dateObj.toISOString();
};


// TODO: move markUnsaved, clearUnsaved, and clearParticipant to stateManager once it's implemented.
/**
 * Mark there are unsaved changes in the UI
 */
export const markUnsaved = () => {
  appState.setState({ hasUnsavedChanges: true });
};

/**
 * Clear the unsaved changes indicator
 */
export const clearUnsaved = () => {
  appState.setState({ hasUnsavedChanges: false });
};

export const clearParticipant = () => {
  appState.setState({ participant: null });
  // TODO: remove localStorage usage during appState transition
  // (maybe session storage for pt data?)
  localStorage.removeItem('participant');
};

import { keyToNameObj } from './idsToName.js';

export const siteKeyToName = (key) => {
  return keyToNameObj[key];
}

export const getDataAttributes = (el) => {
  let data = {};
  el && [].forEach.call(el.attributes, function(attr) {
      if (/^data-/.test(attr.name)) {
          var camelCaseName = attr.name.substr(5).replace(/-(.)/g, function ($0, $1) {
              return $1.toUpperCase();
          });
          data[camelCaseName] = attr.value;
      }
  });
  return data;
}

export const userLoggedIn = () => {
  return new Promise((resolve, reject) => {
      const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
          unsubscribe();
          if (user) {
              resolve(true);
          } else {
              resolve(false);
          }
      });
  });
}

export const getIdToken = () => {
  return new Promise((resolve, reject) => {
      const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
          unsubscribe();
          if (user) {
              user.getIdToken().then((idToken) => {
                  resolve(idToken);
          }, (error) => {
              resolve(null);
          });
          } else {
              resolve(null);
          }
      });
  });
};

// shows/hides a spinner when HTTP request is made/screen is loading
export const showAnimation = () => {
  if(document.getElementById('loadingAnimation')) document.getElementById('loadingAnimation').style.display = '';
}

export const hideAnimation = () => {
  if(document.getElementById('loadingAnimation')) document.getElementById('loadingAnimation').style.display = 'none';
}

export const urls = {
  'stage': 'dashboard-myconnect-stage.cancer.gov',
  'prod': 'dashboard-myconnect.cancer.gov',
  'dev': 'nci-c4cp.github.io'
}

let api = ``;
if(location.host === urls.prod) api = 'https://api-myconnect.cancer.gov';
else if(location.host === urls.stage) api = 'https://api-myconnect-stage.cancer.gov';
else api = 'https://us-central1-nih-nci-dceg-connect-dev.cloudfunctions.net';
export const baseAPI = api;

export const conceptToSiteMapping = {
  531629870: 'HP',
  548392715: 'HFHS',
  125001209: 'KPCO',
  327912200: 'KPGA',
  300267574: 'KPHI',
  452412599: 'KPNW',
  303349821: 'MFC',
  657167265: 'Sanford',
  809703864: 'UCM',
  472940358: 'BSWH',
  13: 'NCI'
}

/**
 * Renders a site dropdown
 * @param {string} context - Context: 'dashboard', 'table', 'lookup'
 * @param {string} menuId - Menu element ID (defaults to 'dropdownMenuButtonSites')
 * @returns {string} HTML template
 */
export const renderSiteDropdown = (context = 'lookup', menuId = 'dropdownMenuButtonSites') => {
    const showPreferenceLabel = context === 'lookup';

    const sitesDropdown = [
        { key: 'allResults', id: 'all', name: 'All Sites' },
        { key: 'BSWH', id: 'BSWH', name: 'Baylor Scott & White Health' },
        { key: 'hfHealth', id: 'hfHealth', name: 'Henry Ford HS' },
        { key: 'hPartners', id: 'hPartners', name: 'Health Partners' },
        { key: 'kpGA', id: 'kpGA', name: 'KP GA' },
        { key: 'kpHI', id: 'kpHI', name: 'KP HI' },
        { key: 'kpNW', id: 'kpNW', name: 'KP NW' },
        { key: 'kpCO', id: 'kpCO', name: 'KP CO' },
        { key: 'maClinic', id: 'maClinic', name: 'Marshfield Clinic' },
        { key: 'snfrdHealth', id: 'snfrdHealth', name: 'Sanford Health' },
        { key: 'uChiM', id: 'uChiM', name: 'UofC Medicine' },
        // Add NCI for dev and local environments
        ...((location.host !== urls.prod) && (location.host !== urls.stage) ? 
            [{ key: 'nci', id: 'nci', name: 'NCI' }] : [])
    ];
    
    return `
        <div class="dropdown" ${localStorage.getItem('dropDownstatusFlag') === 'false' ? 'hidden' : ''}>
            ${showPreferenceLabel ? `<label class="col-form-label search-label">Site Preference</label> &nbsp;` : ''}
            <button class="btn btn-primary dropdown-toggle" type="button" id="dropdownSites" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-siteKey="allResults">
                All Sites
            </button>
            <ul class="dropdown-menu" id="${menuId}" aria-labelledby="dropdownMenuButton">
                ${sitesDropdown.map(site => `<li><a class="dropdown-item" data-siteKey="${site.key}" id="${site.id}">${site.name}</a></li>`).join('')}
            </ul>
        </div>
    `;
};

export const triggerNotificationBanner = (message, type, timeout) => {
  const alertList = document.getElementById("alert_placeholder");
  if (alertList) {
      alertList.innerHTML = `
          <div class="alert alert-${type} alert-dismissible fade show" role="alert">
              ${message}
              <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                      <span aria-hidden="true">&times;</span>
                  </button>
          </div>`;
  
    if (!timeout) return;
    
    setTimeout(() => {
      const alertElement = alertList.querySelector('.alert');
      if (alertElement) {
          alertElement.classList.remove('show');
          alertElement.addEventListener('transitionend', () => {
              alertElement.remove();
          });
      }
    }, timeout);
  }
}

/**
 * Coordinates are name, date, signature
 */
export const pdfCoordinatesMap = {
  'consent': {
    'HP': {
      'V0.02': [{x: 90, y: 425}, {x0: 90, y0: 385}, {x1: 110, y1: 345}],
      'V0.04': [{x: 90, y: 402}, {x0: 90, y0: 362}, {x1: 110, y1: 322}],
      'V0.05': {
        'Eng': [{x: 90, y: 402}, {x0: 90, y0: 362}, {x1: 110, y1: 322}],
        'Span': [{x: 105, y: 392}, {x0: 105, y0: 352}, {x1: 105, y1: 312}]
      },
      'V0.06': {
        'Eng': [{x: 90, y: 402}, {x0: 90, y0: 362}, {x1: 110, y1: 322}],
        'Span': [{x: 105, y: 392}, {x0: 105, y0: 352}, {x1: 105, y1: 312}]
      },
      'V1.0': [{x: 90, y: 420}, {x0: 90, y0: 380}, {x1: 110, y1: 340}]
    },
    'HFHS': {
      'V0.02': [{x: 110, y: 380}, {x0: 110, y0: 340}, {x1: 115, y1: 300}],
      'V0.03': {
        'Eng': [{x: 90, y: 410}, {x0: 90, y0: 370}, {x1: 110, y1: 330}],
        'Span': [{x: 105, y: 410}, {x0: 105, y0: 370}, {x1: 105, y1: 330}]
      },
      'V0.04': {
        'Eng': [{x: 90, y: 410}, {x0: 90, y0: 370}, {x1: 110, y1: 330}],
        'Span': [{x: 105, y: 410}, {x0: 105, y0: 370}, {x1: 105, y1: 330}]
      },
      'V1.0': [{x: 110, y: 380}, {x0: 110, y0: 340}, {x1: 115, y1: 300}],
    },
    'KPCO': {
      'V0.02': [{x: 110, y: 400}, {x0: 110, y0: 355}, {x1: 110, y1: 315}],
      'V0.03': {
        'Eng': [{x: 110, y: 395}, {x0: 110, y0: 355}, {x1: 110, y1: 315}],
        'Span': [{x: 110, y: 395}, {x0: 110, y0: 355}, {x1: 110, y1: 315}]
      },
      'V0.04': {
        'Eng': [{x: 110, y: 395}, {x0: 110, y0: 355}, {x1: 110, y1: 315}],
        'Span': [{x: 110, y: 395}, {x0: 110, y0: 355}, {x1: 110, y1: 315}]
      },
      'V0.05': {
        'Eng': [{x: 110, y: 395}, {x0: 110, y0: 355}, {x1: 110, y1: 315}],
        'Span': [{x: 110, y: 395}, {x0: 110, y0: 355}, {x1: 110, y1: 315}]
      },
      'V1.0': [{x: 110, y: 400}, {x0: 110, y0: 355}, {x1: 110, y1: 315}]
    },
    'KPGA': {
      'V0.02': [{x: 110, y: 400}, {x0: 110, y0: 360}, {x1: 110, y1: 320}],
      'V0.03': [{x: 110, y: 375}, {x0: 110, y0: 335}, {x1: 110, y1: 295}],
      'V0.04': {
        'Eng': [{x: 110, y: 375}, {x0: 110, y0: 335}, {x1: 110, y1: 295}],
        'Span': [{x: 110, y: 375}, {x0: 110, y0: 335}, {x1: 110, y1: 295}]
      },
      'V0.05': {
        'Eng': [{x: 110, y: 375}, {x0: 110, y0: 335}, {x1: 110, y1: 295}],
        'Span': [{x: 110, y: 375}, {x0: 110, y0: 335}, {x1: 110, y1: 295}]
      },
      'V1.0': [{x: 110, y: 400}, {x0: 110, y0: 360}, {x1: 110, y1: 320}]
    },
    'KPHI': {
      'V0.02': [{x: 100, y: 370}, {x0: 100, y0: 330}, {x1: 110, y1: 286}],
      'V0.03': {
        'Eng': [{x: 110, y: 395}, {x0: 110, y0: 355}, {x1: 110, y1: 315}],
        'Span': [{x: 110, y: 395}, {x0: 110, y0: 355}, {x1: 110, y1: 315}]
      },
      'V0.04': {
        'Eng': [{x: 110, y: 395}, {x0: 110, y0: 355}, {x1: 110, y1: 315}],
        'Span': [{x: 110, y: 395}, {x0: 110, y0: 355}, {x1: 110, y1: 315}]
      },
      'V1.0': [{x: 110, y: 370}, {x0: 110, y0: 330}, {x1: 110, y1: 290}]
    },
    'KPNW': {
      'V0.02': [{x: 110, y: 395}, {x0: 110, y0: 355}, {x1: 110, y1: 315}],
      'V0.03': {
        'Eng': [{x: 110, y: 390}, {x0: 110, y0: 350}, {x1: 110, y1: 310}],
        'Span': [{x: 110, y: 390}, {x0: 110, y0: 350}, {x1: 110, y1: 310}]
      },
      'V0.04': {
        'Eng': [{x: 110, y: 390}, {x0: 110, y0: 350}, {x1: 110, y1: 310}],
        'Span': [{x: 110, y: 390}, {x0: 110, y0: 350}, {x1: 110, y1: 310}]
      },
      'V1.0': [{x: 110, y: 390}, {x0: 110, y0: 350}, {x1: 110, y1: 310}]
    },
    'MFC': {
      'V0.02': [{x: 110, y: 425}, {x0: 110, y0: 385}, {x1: 115, y1: 345}],
      'V0.03': {
        'Eng': [{x: 110, y: 405}, {x0: 110, y0: 365}, {x1: 115, y1: 325}],
        'Span': [{x: 110, y: 395}, {x0: 110, y0: 355}, {x1: 110, y1: 315}]
      },
      'V0.04': {
        'Eng': [{x: 110, y: 405}, {x0: 110, y0: 365}, {x1: 115, y1: 325}],
        'Span': [{x: 110, y: 395}, {x0: 110, y0: 355}, {x1: 110, y1: 315}]
      },
      'V1.0': [{x: 110, y: 420}, {x0: 110, y0: 380}, {x1: 115, y1: 345}]
    },
    'Sanford': {
      'V0.02': [{x: 120, y: 407}, {x0: 105, y0: 365}, {x1: 110, y1: 325}],
      'V0.03': {
        'Eng': [{x: 120, y: 730}, {x0: 120, y0: 690}, {x1: 120, y1: 655}],
        'Span': [{x: 120, y: 200}, {x0: 120, y0: 160}, {x1: 120, y1: 125}]
      },
      'V0.04': {
        'Eng': [{x: 120, y: 730}, {x0: 120, y0: 690}, {x1: 120, y1: 655}],
        'Span': [{x: 120, y: 200}, {x0: 120, y0: 160}, {x1: 120, y1: 125}]
      },
      'V1.0': [{x: 120, y: 407}, {x0: 120, y0: 367}, {x1: 120, y1: 330}]
    },
    'UCM': {
      'V0.02': [ {x: 110, y: 380} , {x0: 110, y0: 342} , {x1: 115, y1: 305} ],
      'V0.04': [ {x: 110, y: 380} , {x0: 110, y0: 342} , {x1: 115, y1: 305} ],
      'V0.05': {
        'Eng': [ {x: 110, y: 410} , {x0: 110, y0: 370} , {x1: 115, y1: 330} ],
        'Span': [ {x: 110, y: 410} , {x0: 110, y0: 370} , {x1: 115, y1: 330} ]
      },
      'V0.06': {
        'Eng': [ {x: 110, y: 410} , {x0: 110, y0: 370} , {x1: 115, y1: 330} ],
        'Span': [ {x: 110, y: 410} , {x0: 110, y0: 370} , {x1: 115, y1: 330} ]
      },
      'V1.0': [{x: 110, y: 380} , {x0: 110, y0: 342} , {x1: 115, y1: 305}]
    },
    'BSWH': {
        'V0.02': {
          'Eng': [{x: 110, y: 405} , {x0: 110, y0: 365} , {x1: 115, y1: 328}],
          'Span': [{x: 110, y: 405} , {x0: 110, y0: 365} , {x1: 115, y1: 328}]
        },
        'V0.03': {
          'Eng': [{x: 110, y: 405} , {x0: 110, y0: 365} , {x1: 115, y1: 328}],
          'Span': [{x: 110, y: 405} , {x0: 110, y0: 365} , {x1: 115, y1: 328}]
        }
    },
    'default': {
      'V0.02': [{x: 110, y: 400}, {x0: 110, y0: 410}, {x1: 110, y1: 330}],
      'V0.04': [{x: 110, y: 400}, {x0: 110, y0: 410}, {x1: 110, y1: 330}],
      'V0.05': [{x: 90, y: 407}, {x0: 90, y0:370},  {x1:110, y1: 330}],
      'V0.06': [{x: 90, y: 407}, {x0: 90, y0:370},  {x1:110, y1: 330}],
      'V1.0': [{x: 110, y: 400}, {x0: 110, y0: 410}, {x1: 110, y1: 330}]
    }
  },
  'hipaa': {
    'HP': {
      "V0.03": {
        "Eng": [{x: 100, y: 420}, {x0: 100, y0: 370}, {x1: 100, y1: 465}],
        "Span": [{x: 188, y: 424}, {x0: 80, y0: 375}, {x1: 80, y1:470}]
      },
      'V0.02': [{x: 100, y: 420}, {x0: 100, y0: 370}, {x1: 100, y1: 465}],
      'V1.0': [{x: 100, y: 420}, {x0: 100, y0: 370}, {x1: 100, y1: 465}]
    },
    'HFHS': {
      'V0.02': {
        "Eng": [{x: 100, y: 425}, {x0: 100, y0: 385}, {x1: 100, y1: 465}],
        "Span": [{x: 188, y: 429}, {x0: 80, y0: 387}, {x1: 80, y1: 467}],
      },
      'V1.0': [{x: 110, y: 440}, {x0: 80, y0: 400}, {x1: 110, y1: 480}]
    },
    'KPCO': {
      'V0.02': {
        "Eng": [{x: 110, y: 410}, {x0: 110, y0: 370}, {x1: 110, y1: 450}],
        "Span": [{x: 188, y: 415}, {x0: 80, y0: 375}, {x1: 80, y1: 455}]
      },
      'V0.03': {
        "Eng": [{x: 110, y: 425}, {x0: 110, y0: 385}, {x1: 110, y1: 465}],
        "Span": [{x: 188, y: 425}, {x0: 80, y0: 385}, {x1: 80, y1: 465}]
      },
      'V1.0': [{x: 110, y: 410}, {x0: 110, y0: 370}, {x1: 110, y1: 450}]
    },
    'KPGA': {
      'V0.02': [{x: 110, y: 345}, {x0: 110, y0: 305}, {x1: 110, y1: 385}],
      'V0.03': {
        'Eng': [{x: 110, y: 345}, {x0: 110, y0: 305}, {x1: 110, y1: 385}],
        'Span': [{x: 188, y: 198}, {x0: 80, y0: 158}, {x1: 80, y1: 238}]
      },
      'V1.0': [{x: 110, y: 345}, {x0: 110, y0: 300}, {x1: 110, y1: 385}]
    },
    'KPHI': {
      'V0.02': {
        "Eng": [{x: 110, y: 410}, {x0: 110, y0: 370}, {x1: 110, y1: 450}],
        "Span": [{x: 188, y: 415}, {x0: 80, y0: 375}, {x1: 80, y1: 455}]
      },
      'V1.0': [{x: 110, y: 410}, {x0: 110, y0: 370}, {x1: 110, y1: 450}]
    },
    'KPNW': {
      'V0.02': {
        "Eng": [{x: 110, y: 415}, {x0: 110, y0: 375}, {x1: 110, y1: 455}],
        "Span": [{x: 188, y: 415}, {x0: 80, y0: 375}, {x1: 80, y1: 455}]
      },
      'V1.0': [{x: 110, y: 415}, {x0: 110, y0: 375}, {x1: 110, y1: 455}]
    },
    'MFC': {
      'V0.02': {
        "Eng": [{x: 100, y: 425}, {x0: 100, y0: 385}, {x1: 100, y1: 465}],
        "Span": [{x: 188, y: 429}, {x0: 80, y0: 387}, {x1: 80, y1: 467}]
      },
      'V1.0': [{x: 100, y: 425}, {x0: 100, y0: 385}, {x1: 100, y1: 465}]
    },
    'Sanford': {
      'V0.02': {
        "Eng": [{x: 100, y: 415}, {x0: 100, y0: 375}, {x1: 100, y1: 455}],
        "Span": [{x: 188, y: 419}, {x0: 80, y0: 377}, {x1: 80, y1: 457}],
      },
      'V1.0': [{x: 100, y: 415}, {x0: 100, y0: 375}, {x1: 100, y1: 455}]
    },
    'UCM': {
      'V0.02': {
        "Eng": [{x: 110, y: 425}, {x0: 110, y0: 385}, {x1: 110, y1: 465}],
        "Span": [{x: 188, y: 429}, {x0: 80, y0: 387}, {x1: 80, y1: 467}]
      },
      'V1.0': [ {x: 110, y: 425} ,  {x0: 110, y0: 385} ,  {x1: 110, y1: 465} ]
    },
    'BSWH': {
      'V0.01': {
        "Eng": [{x: 100, y: 440}, {x0: 100, y0: 400}, {x1: 100, y1: 480}],
        "Span": [{x: 188, y: 414}, {x0: 80, y0: 372}, {x1: 80, y1: 452}]
      }
    },
    'default': {
      'V0.02': [{x: 110, y: 400}, {x0: 110, y0: 410}, {x1: 110, y1: 330}],
      'V1.0': [{x: 100, y: 410}, {x0: 100, y0: 420}, {x1: 100, y1: 450}]
    }
  }
}

/**
 * Returns the translation for a given language or the fall back language of english
 * 
 * @param {String[]} keys 
 * @param {String} language 
 * @param {int} keyIndex 
 * @param {Object} translationObj 
 * @returns String
 */
export const translateText = (keys, language, keyIndex, translationObj) => { 
  if (!language) {
      language = 'en';
  }

  if (typeof keys === 'string') {
      keys = keys.split('.');
  }

  if (!keyIndex) {
      keyIndex = 0;
  }

  if (!translationObj) {
      //Fallback to english if the language doesn't exist
      translationObj = i18n[language] ? i18n[language] : i18n['en'];
  }
  if ((keyIndex + 1) === keys.length) {
      if (!translationObj[keys[keyIndex]]) {
          if (language !== 'en') {
              //If the languange is not English then return english as the fallback
              return translateText(keys, 'en');
          } else {
              return null;
          }
      } else {
          return translationObj[keys[keyIndex]];
      }
  } else {
      if (translationObj[keys[keyIndex]]) {
          let nextIndexKey = keyIndex + 1;
          return translateText(keys, language, nextIndexKey, translationObj[keys[keyIndex]]);
      } else {
          if (language !== 'en') {
              //If the language is not english then return english as the fallback
              return translateText(keys, 'en');
          } else {
              //IF the langauge is already english then retun null because there is no matching translation  
              return null;
          }
      }
  }
}

/**
 * Returns a formatted Date based on the language and options
 * 
 * @param {string} timestamp
 * @param {string} language
 * @param {Object} options - Same as Intl.DateTimeFormat() constructor
 */
export const translateDate = (timestamp, language, options) => {
  if (!language) {
    language = 'en';
  }

  let date;
  if (typeof timestamp === 'string' && /^[0-9]+$/.test(timestamp)) {
      date = new Date(parseInt(timestamp, 10));
  } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
  } else {
      date = new Date(Date.parse(timestamp));
  }
  return date.toLocaleDateString(language, options);
}

/* Checks for each code point whether the given font supports it.
If not, tries to remove diacritics from said code point.
If that doesn't work either, replaces the unsupported character with '?'. */
export function replaceUnsupportedPDFCharacters(string, font) {
  if (!string) return;
  const charSet = font.getCharacterSet()
  const codePoints = []
  for (const codePointStr of string) {
      const codePoint = codePointStr.codePointAt(0);
      if (!charSet.includes(codePoint)) {
          const withoutDiacriticsStr = codePointStr.normalize('NFD').replace(/\p{Diacritic}/gu, '');
          const withoutDiacritics = withoutDiacriticsStr.charCodeAt(0);
          if (charSet.includes(withoutDiacritics)) {
              codePoints.push(withoutDiacritics);
          } else {
              codePoints.push('?'.codePointAt(0));
          }
      } else {
          codePoints.push(codePoint)
      }
  }
  return String.fromCodePoint(...codePoints);
}

export const sortByKey = (arr, key) => {
	return arr.sort((a, b) => {
		if (a[key] > b[key]) return 1;
		if (b[key] > a[key]) return -1;
		return 0;
	});
}

/**
 * Fetches participant data based on the provided query parameters.
 * 
 * @async
 * @function getParticipants
 * @returns {Promise<Object>} A promise that resolves to the API response containing:
 *   - code: HTTP status code (200 for success)
 *   - data: Array of participant objects
 *   - message: Response message (if applicable)
 * @throws {Error} If the API request fails
 */
export const getParticipants = async () => {
	
	const { participantTypeFilter, siteCode, startDateFilter, endDateFilter, cursorHistory, pageNumber, direction } = appState.getState();
  appState.setState({direction: ``});

	const params = new URLSearchParams();
	params.append('api', 'getParticipants');
  params.append('limit', 50);
	params.append('type', participantTypeFilter || 'all');

	if (siteCode && siteCode !== nameToKeyObj.allResults) {
		params.append('site', siteCode);
	}

	if (startDateFilter) {
		params.append('from', `${startDateFilter}T00:00:00.000Z`);
	}

	if (endDateFilter) {
		params.append('to', `${endDateFilter}T23:59:59.999Z`);
	}

  if (pageNumber > 1) {
      params.append('cursor', cursorHistory[pageNumber - 2]);
  }

	const url = `${baseAPI}/dashboard?${params.toString()}`;
	
	try {
		const token = await getIdToken();
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			}
		});

    const responseObj = await response.json();

    if (responseObj.cursor) {
      if (direction === 'previous') cursorHistory.pop();
      
      cursorHistory[pageNumber - 1] = responseObj.cursor;
      appState.setState({cursorHistory});
    }

		return responseObj;
	}
	catch (error) {
		console.error("Error fetching participants:", error);
		return error;
	}
}

export const resetPagination = () => { appState.setState({cursorHistory: [], pageNumber: 1});}
export const resetFilters = () => { appState.setState({participantTypeFilter: '', siteCode: '', startDateFilter: '', endDateFilter: ''});}

// Ensure that the date is a valid ISO 8601 string
export function timestampValidation(iso8601String) {
  if (iso8601String) {
    const dateObj = new Date(iso8601String);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleString();
    }
  }
  return '';
}

/**
 * Escape HTML characters (useful for github-advanced-security bot warnings)
 * @param {string} str - String to escape 
 * @returns {string} - Escaped string
 */
export const escapeHTML = (str) => {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};

/**
 * Handler for navigation guard modals.
 * Returns the modal element id
 */
const navGuardModalHandler = () => {
  const modalId = 'globalNavGuardModal';
  if (document.getElementById(modalId)) return modalId;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="modal fade" id="${modalId}" data-keyboard="false" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content sub-div-shadow">
          <div class="modal-header">
            <h5 class="modal-title" id="${modalId}Title"></h5>
            <button type="button" class="modal-close-btn" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
          </div>
          <div class="modal-body" id="${modalId}Body"></div>
          <div class="modal-footer" id="${modalId}Footer"></div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(wrapper.firstElementChild);
  return modalId;
};

/**
 * Programmatically open Bootstrap modal
 */
const openBootstrapModal = (modalId) => {
  const trigger = document.createElement('button');
  trigger.style.display = 'none';
  trigger.setAttribute('data-toggle', 'modal');
  trigger.setAttribute('data-target', `#${modalId}`);
  document.body.appendChild(trigger);
  trigger.click();
  document.body.removeChild(trigger);
};

/**
 * Show a confirm dialog using the nav guard modal
 * Resolves true on confirm, false on cancel
 */
export const showConfirmModal = ({ title = 'Confirm', message = '', confirmText = 'Continue', cancelText = 'Cancel' } = {}) => {
  return new Promise((resolve) => {
    const modalId = navGuardModalHandler();
    const titleEl = document.getElementById(`${modalId}Title`);
    const bodyEl = document.getElementById(`${modalId}Body`);
    const footerEl = document.getElementById(`${modalId}Footer`);

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = `<div>${escapeHTML(message)}</div>`;
    if (footerEl) {
      footerEl.innerHTML = `
        <button type="button" class="btn btn-danger" id="${modalId}Cancel" data-dismiss="modal">${escapeHTML(cancelText)}</button>
        <button type="button" class="btn btn-primary" id="${modalId}Confirm" data-dismiss="modal">${escapeHTML(confirmText)}</button>`;
    }

    const confirmBtn = document.getElementById(`${modalId}Confirm`);
    const cancelBtn = document.getElementById(`${modalId}Cancel`);

    let handled = false;
    const onConfirm = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onKeydown = (event) => {
      if (event.key === 'Enter') {
        const modalEl = document.getElementById(modalId);
        if (modalEl && modalEl.classList.contains('show')) {
          event.preventDefault();
          // Trigger Bootstrap dismissal and our click handler
          confirmBtn && confirmBtn.click();
        }
      }
    };

    const cleanup = (result) => {
      if (handled) return;
      handled = true;
      confirmBtn && confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn && cancelBtn.removeEventListener('click', onCancel);
      document.removeEventListener('keydown', onKeydown);
      resolve(result);
    };

    confirmBtn && confirmBtn.addEventListener('click', onConfirm);
    cancelBtn && cancelBtn.addEventListener('click', onCancel);
    document.addEventListener('keydown', onKeydown);

    openBootstrapModal(modalId);
  });
};

/**
 * Show an alert dialog using the nav guard modal
 */
export const showAlertModal = ({ title = 'Alert', message = '', okText = 'OK' } = {}) => {
  return new Promise((resolve) => {
    const modalId = navGuardModalHandler();
    const titleEl = document.getElementById(`${modalId}Title`);
    const bodyEl = document.getElementById(`${modalId}Body`);
    const footerEl = document.getElementById(`${modalId}Footer`);

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = `<div>${escapeHTML(message)}</div>`;
    if (footerEl) {
      footerEl.innerHTML = `
        <button type="button" class="btn btn-primary" id="${modalId}Ok" data-dismiss="modal">${escapeHTML(okText)}</button>`;
    }

    const okBtn = document.getElementById(`${modalId}Ok`);
    let handled = false;
    const onOk = () => cleanup();
    const onKeydown = (event) => {
      if (event.key === 'Enter') {
        const modalEl = document.getElementById(modalId);
        if (modalEl && modalEl.classList.contains('show')) {
          event.preventDefault();
          okBtn && okBtn.click();
        }
      }
    };
    const cleanup = () => {
      if (handled) return;
      handled = true;
      okBtn && okBtn.removeEventListener('click', onOk);
      document.removeEventListener('keydown', onKeydown);
      resolve(true);
    };
    okBtn && okBtn.addEventListener('click', onOk);
    document.addEventListener('keydown', onKeydown);
    openBootstrapModal(modalId);
  });
};

export const renderShowMoreDataModal = () => {
    return `
        <div class="modal fade" id="modalShowMoreData" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div class="modal-content sub-div-shadow">
                    <div class="modal-header" id="modalHeader"></div>
                    <div class="modal-body" id="modalBody"></div>
                </div>
            </div>
        </div>
    `;
};
