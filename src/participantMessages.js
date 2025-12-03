import { baseAPI, humanReadableFromISO, getIdToken } from './utils.js';

/**
 * Render participant messages content for use in a tab
 * @param {object} participant - The participant object
 * @returns {Promise<string>} HTML string for messages tab content
 */
export const renderMessagesTabContent = async (participant) => {
    if (!participant) {
        return '<div class="alert alert-warning">No participant data available</div>';
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
            let messageBody = message.notification.body;
            let previous;
            do {
                previous = messageBody;
                messageBody = messageBody.replace(/<style[^>]*>.*?<\/style>/gs, "");
            } while (messageBody !== previous);
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
        <div>
            <h4 style="text-align: center;">Participant Messages</h4>
            ${messageHtmlStringArray.join("")}
        </div>
    `;
};

export const getParticipantMessage = async (token, idToken) => {
    const response = await fetch (`${baseAPI}/dashboard?api=getParticipantNotification&token=${token}`, {
        method:'GET',
        headers:{
            Authorization:"Bearer "+idToken,
            "Content-Type": "application/json"
            }
    })

    return response.json();
   
}
