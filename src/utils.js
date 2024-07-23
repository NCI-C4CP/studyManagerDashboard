export const getCurrentTimeStamp = () => {
  const date = new Date(new Date().toISOString());
  const timeStamp = date.toLocaleString('en-US',  {month: 'long'}) + ' ' + date.getDate() + ',' + date.getFullYear() + ' ' + 
                        date.getHours() + ':'+ date.getMinutes()+':'+ date.getSeconds();
  return timeStamp; // January 28, 2021 16:11:54
}
                
export const humanReadableFromISO = (participantDate) => {
  const submittedDate = new Date(String(participantDate));
  const humanReadable = submittedDate.toLocaleString('en-US', { month: 'long' }) + ' ' + submittedDate.getDate() + ',' + submittedDate.getFullYear();
  return humanReadable; // October 30, 2020
}

export const humanReadableMDY = (participantDate) => {
  if (!participantDate) return 'N/A'
  const humanReadableDate = new Date(String(participantDate)).toLocaleDateString()
  return humanReadableDate; // 10/30/2020
}

export const humanReadableY = () => {
  const currentYear = new Date().getFullYear();
  return currentYear;
} // 2021

// Function prevents the user from internal navigation if unsaved changes are present
export const internalNavigatorHandler = (counter) => {
setTimeout(() => {
  document.getElementById('navBarLinks').addEventListener('click', function(e) {
      let getSaveFlag = JSON.parse(localStorage.getItem("flags"));
      let getCounter = JSON.parse(localStorage.getItem("counters"));
      
      if (getCounter > 0 && getSaveFlag === false) {
          // Cancel the event and show alert that the unsaved changes would be lost 
          let confirmFlag = !confirm("Unsaved changes detected. Navigate away?");
          if (confirmFlag) {
            // when user decides to stay on the page
              e.preventDefault();
              return;
          } 
          else {
              counter = 0;
              localStorage.setItem("counters", JSON.stringify(counter));
          }
          return;
      }
  })
}, 50);
}

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
  'prod': 'dashboard-myconnect.cancer.gov'
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

export const triggerNotificationBanner = (message, type) => {
  const alertList = document.getElementById("alert_placeholder");
  if (alertList) {
      alertList.innerHTML = `
          <div class="alert alert-${type} alert-dismissible fade show" role="alert">
              ${message}
              <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                      <span aria-hidden="true">&times;</span>
                  </button>
          </div>`;
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
        'Span': [{x: 90, y: 402}, {x0: 90, y0: 362}, {x1: 110, y1: 322}]
      },
      'V1.0': [{x: 90, y: 420}, {x0: 90, y0: 380}, {x1: 110, y1: 340}]
    },
    'HFHS': {
      'V0.02': [{x: 110, y: 380}, {x0: 110, y0: 340}, {x1: 115, y1: 300}],
      'V0.03': {
        'Eng': [{x: 90, y: 410}, {x0: 90, y0: 370}, {x1: 110, y1: 330}],
        'Span': [{x: 90, y: 410}, {x0: 90, y0: 370}, {x1: 110, y1: 330}]
      },
      'V1.0': [{x: 110, y: 380}, {x0: 110, y0: 340}, {x1: 115, y1: 300}],
    },
    'KPCO': {
      'V0.02': [{x: 110, y: 400}, {x0: 110, y0: 355}, {x1: 110, y1: 315}],
      'V0.03': {
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
      'V1.0': [{x: 110, y: 400}, {x0: 110, y0: 360}, {x1: 110, y1: 320}]
    },
    'KPHI': {
      'V0.02': [{x: 100, y: 370}, {x0: 100, y0: 330}, {x1: 110, y1: 286}],
      'V0.03': {
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
      'V1.0': [{x: 110, y: 390}, {x0: 110, y0: 350}, {x1: 110, y1: 310}]
    },
    'MFC': {
      'V0.02': [{x: 110, y: 425}, {x0: 110, y0: 385}, {x1: 115, y1: 345}],
      'V0.03': {
        'Eng': [{x: 110, y: 405}, {x0: 110, y0: 365}, {x1: 115, y1: 325}],
        'Span': [{x: 110, y: 405}, {x0: 110, y0: 365}, {x1: 115, y1: 325}]
      },
      'V1.0': [{x: 110, y: 420}, {x0: 110, y0: 380}, {x1: 115, y1: 345}]
    },
    'Sanford': {
      'V0.02': [{x: 120, y: 407}, {x0: 105, y0: 365}, {x1: 110, y1: 325}],
      'V0.03': {
        'Eng': [{x: 120, y: 730}, {x0: 120, y0: 690}, {x1: 120, y1: 655}],
        'Span': [{x: 120, y: 730}, {x0: 120, y0: 690}, {x1: 120, y1: 655}]
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
      'V1.0': [{x: 110, y: 380} , {x0: 110, y0: 342} , {x1: 115, y1: 305}]
    },
    'BSWH': {
        'V0.02': {
          'Eng': [{x: 110, y: 405} , {x0: 110, y0: 365} , {x1: 115, y1: 328}],
          'Span': [{x: 110, y: 405} , {x0: 110, y0: 365} , {x1: 115, y1: 328}]
        }
    },
    'default': {
      'V0.02': [{x: 110, y: 400}, {x0: 110, y0: 410}, {x1: 110, y1: 330}],
      'V0.04': [{x: 110, y: 400}, {x0: 110, y0: 410}, {x1: 110, y1: 330}],
      'V0.05': [{x: 90, y: 407}, {x0: 90, y0:370},  {x1:110, y1: 330}],
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

