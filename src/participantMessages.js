import { dashboardNavBarLinks, removeActiveClass } from './navigationBar.js';
import { renderParticipantHeader } from './participantHeader.js';
import fieldMapping from './fieldToConceptIdMapping.js';
import { baseAPI, humanReadableFromISO, getIdToken } from './utils.js';


const headerImportantColumns = [
    { field: fieldMapping.fName },
    { field: fieldMapping.lName },
];

export const renderParticipantMessages = async (participant) => {
    const isParent = localStorage.getItem('isParent')
    document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks(isParent);
    removeActiveClass('nav-link', 'active');
    document.getElementById('participantMessageBtn').classList.add('active');
    if (participant !== null) {
        mainContent.innerHTML = await render(participant);
    }
}

export const render = async (participant) => {
  if (!participant) {
    return `
        <div class="container-fluid">
            <div id="root">
            Please select a participant first!
            </div>
        </div>
         `;
  }

  let messageHtmlStringArray = [];
  const idToken = await getIdToken();
  const messages = await getParticipantMessage(participant.token, idToken);
  if (messages.data.length === 0) {
    const currString = `
        <div class="list-group" style="text-align: center;">
            <span class="list-group-item list-group-item-action" >
                <div class="d-flex w-100 justify-content-between" >
                <h4>No Messages</h4>
                </div>
            </span>
        </div>  <br />`;
    messageHtmlStringArray.push(currString);
  } else {
    for (const message of messages.data) {
      let messageTitle = `Email (${message.notification.title})`;
      const messageBody = message.notification.body.replace(/<style[^>]*>.*?<\/style>/gs, "");
      if (message.notificationType === "sms") {
        messageTitle = "SMS Message";
      }

      const currString = `
        <div class="list-group">
            <span class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                    <small> Attempt: ${message.attempt ?? `N/A`} | Category: ${message.category ?? `N/A`} </small>
                    <h5 class="mb-1">${messageTitle}</h5>
                    <small>Date Sent: ${humanReadableFromISO(message.notification.time)}</small>
                </div>
                <div class="mb-1">
                    ${messageBody}
                </div>
            </span>
        </div>  <br />`;
      messageHtmlStringArray.push(currString);
    }
  }

  return `
    <div class="container-fluid">
        <div id="root root-margin">
            ${renderParticipantHeader(participant)}
            <span> <h4 style="text-align: center;">Participant Messages </h4> </span>
            ${messageHtmlStringArray.join("")}
        </div>
    </div>`;
};

const getParticipantMessage = async (token, idToken) => {
    const response = await fetch (`${baseAPI}/dashboard?api=getParticipantNotification&token=${token}`, {
        method:'GET',
        headers:{
            Authorization:"Bearer "+idToken,
            "Content-Type": "application/json"
            }
    })

    return response.json();
   
}