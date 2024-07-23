import { dashboardNavBarLinks, removeActiveClass } from './navigationBar.js';
import {  baseAPI, humanReadableFromISO, getIdToken } from './utils.js';

export const renderSiteMessages = async () => {
    const isParent = localStorage.getItem('isParent')
    document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks(isParent);
    removeActiveClass('nav-link', 'active');
    document.getElementById('siteMessageBtn').classList.add('active');
    mainContent.innerHTML = await render();
}

export const render = async () => {
    let template = `<div class="container-fluid">`
    template +=` 
        <div id="root root-margin">
            <span> <h4 style="text-align: center; padding-top: 25px;">Site Messages </h4> </span>
        </div>
    </div>`

    const idToken = await getIdToken();  
    let messages =  await getSiteMessage(idToken);
    messages.data.length !== 0 ? (
        messages.data.forEach(message => 
            template += `
                        <div class="list-group">
                        <span class="list-group-item list-group-item-action">
                            <div class="d-flex w-100 justify-content-between">
                            <small> Notification Type: ${message.notificationType !== undefined ? message.notificationType : `N/A`} | Email: ${message.email !== undefined ? message.email : `N/A`} 
                            | Date Sent: ${humanReadableFromISO(message.notification.time)}</small>
                            <br />
                            </div>
                            <h5 style="text-align: center; padding-top: 25px;">${message.notification.title}</h5>
                            <p class="mb-1">${message.notification.body}</p>
                        </span>
                        </div>  <br />`) 
                ): (  
            template += `
                <div class="list-group" style="text-align: center;">
                <span class="list-group-item list-group-item-action" >
                    <div class="d-flex w-100 justify-content-between" >
                    <h4>No Messages</h4>
                    </div>
                </span>
            </div>  <br />`)
    return template;
 }


 const getSiteMessage = async (idToken) => {
    const response = await fetch (`${baseAPI}/dashboard?api=getSiteNotification`, {
        method:'GET',
        headers:{
            Authorization:"Bearer "+idToken,
            "Content-Type": "application/json"
            }
    })

    return response.json();
   
}