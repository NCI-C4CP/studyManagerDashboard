import {renderNavBarLinks, dashboardNavBarLinks, renderLogin, removeActiveClass} from './navigationBar.js';
import fieldMapping from './fieldToConceptIdMapping.js'; 
import { renderParticipantHeader } from './participantHeader.js';
import { getCurrentTimeStamp } from './utils.js';

export const importantColumns = [ 
    { field: fieldMapping.lName,
        editable: true,
        display: true } ,
    { field: fieldMapping.fName,
        editable: true,
        display: true } ,
     { field: fieldMapping.prefName,
    editable: true,
    display: true } ,
     { field: fieldMapping.mName,
    editable: true,
    display: true } ,
     { field: fieldMapping.suffix,
    editable: true,
    display: true } ,
     { field: fieldMapping.birthMonth,
    editable: false,
    display: true } ,
     { field: fieldMapping.birthDay,
    editable: false,
    display: true } ,
     { field: fieldMapping.birthYear,
    editable: false,
    display: true } ,
     { field: fieldMapping.homePhone,
    editable: true,
    display: true } ,
    { field: fieldMapping.cellPhone,
    editable: true,
    display: true },
    { field: fieldMapping.otherPhone,
    editable: true,
    display: true },
    { field: fieldMapping.prefEmail,
    editable: true,
    display: true },
    { field: fieldMapping.prefContact,
    editable: true,
    display: true },
    { field: fieldMapping.canWeText,
    editable: true,
    display: true },
    { field: fieldMapping.ssnOnFile,
    editable: true,
    display: true },
    { field: fieldMapping.address1,
    editable: true,
    display: true },
    { field: fieldMapping.city,
    editable: true,
    display: true },
    { field: fieldMapping.state,
    editable: true,
    display: true },
    { field: 'Connect_ID',
    editable: false,
    display: true }
]

// Would be updated soon: Prevents unsaved changes to be lost when hit referesh
let saveFlag = false;
let counter = 0;
window.addEventListener('beforeunload',  (e) => {
    if (saveFlag === false && counter > 0) { 
    // Cancel the event and show alert that the unsaved changes would be lost 
        e.preventDefault(); 
        e.returnValue = ''; 
    } 

})

// window.addEventListener('popstate', function (e) {
//     // The URL changed...
//     if (window.location.hash !== "#participantLookup") {
//         alert('Unsave changes detected')
//         // add a modal
        
//     }
// });


export function renderParticipantDetails(participant, adminSubjectAudit, changedOption, siteKey){

    document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks();
    removeActiveClass('nav-link', 'active');
    document.getElementById('participantDetailsBtn').classList.add('active');
    mainContent.innerHTML = render(participant);
    let originalHTML =  mainContent.innerHTML;
    viewAuditHandler(adminSubjectAudit);
    changeParticipantDetail(participant, adminSubjectAudit, changedOption, originalHTML, siteKey);
    editAltContact(participant, adminSubjectAudit);
  
}

export function render(participant) {
    let template = `<div class="container">`
    if (!participant) {
        template +=` 
            <div id="root">
            Please select a participant first!
            </div>
        </div>
         `
    } else {
        let conceptIdMapping = JSON.parse(localStorage.getItem('conceptIdMapping'));
        template += `
                <div id="root"> `
        template += renderParticipantHeader(participant);
        template += `<table class="table detailsTable"> <h4 style="text-align: center;"> Participant Details </h4><tbody class="participantDetailTable">`
     
        importantColumns.forEach(x => template += `<tr class="detailedRow"><th scope="row"><div class="mb-3"><label class="form-label">
            ${conceptIdMapping[x.field] && conceptIdMapping[x.field] ? conceptIdMapping[x.field]['Variable Label'] || conceptIdMapping[x.field]['Variable Name'] : x.field}</label></div></th>
            <td>${participant[x.field] !== undefined ?  participant[x.field] : ""}</td> <td> 
            <a class="showMore" data-toggle="modal" data-target="#modalShowMoreData" 
                data-participantkey=${conceptIdMapping[x.field] && conceptIdMapping[x.field] ? conceptIdMapping[x.field]['Variable Label'].replace(/\s/g, "") || conceptIdMapping[x.field]['Variable Name'].replace(/\s/g, "") : ""}
                data-participantconceptid=${x.field} data-participantValue=${participant[x.field]} name="modalParticipantData" >
                ${x.editable ? `<button type="button" class="btn btn-primary">Edit</button>`
                 : `<button type="button" class="btn btn-primary" disabled>Edit</button>`
                }
            </a></td></tr>&nbsp;`) 
        

            template += `</tbody></table>
                    <br />
                    <table class="table">
                                <h4 style="text-align: center;"> Alternate Contact Details &nbsp;</h4>
                                    <thead>
                                        <tr>
                                        <th scope="col">Contact Name</th>
                                        <th scope="col">Relationship</th>
                                        <th scope="col">Home Number</th>
                                        <th scope="col">Mobile Number</th>
                                        <th scope="col">Email</th>
                                        <th scope="col"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr class="detaileAltRow">
                                        <td>${participant.Module1 && participant.Module1.ALTCONTACT1 ? participant.Module1.ALTCONTACT1.ALTCONTACT1_FNAME : ""} `+` ${participant.Module1  && participant.Module1.ALTCONTACT1 ? participant.Module1.ALTCONTACT1.ALTCONTACT1_LNAME : ""} </td>
                                        <td></td>
                                        <td>${participant.Module1  && participant.Module1.ALTCONTACT2 ? participant.Module1.ALTCONTACT2.ALTCONTACT2_HOME : ""}</td>
                                        <td>${participant.Module1  && participant.Module1.ALTCONTACT2 ? participant.Module1.ALTCONTACT2.ALTCONTACT2_MOBILE : ""}</td>
                                        <td>${participant.Module1  && participant.Module1.ALTCONTACT2 ? participant.Module1.ALTCONTACT2.ALTCONTACT2_EMAIL : ""}</td>
                                        <td> <button type="button" id="altContact" data-toggle="modal" data-target="#modalShowMoreData" class="btn btn-primary">Edit</button> </td>
                                        </tr>
                                    </tbody>
                                    </table>
                                    <div style="display:inline-block;">
                                        <button type="submit" id="sendResponse" class="btn btn-primary" >Save Changes</button>
                                            &nbsp;
                                        <button type="button" id="adminAudit" data-toggle="modal" data-target="#modalShowMoreData" class="btn btn-success">Audit History</button>
                                            &nbsp;
                                        <button type="button" id="cancelChanges" class="btn btn-danger">Cancel Changes</button>
                                        &nbsp;
                                        <b>Last Modified by: <span id="modifiedId"></span></b>
                                    </div>
                            </div>
                        </div>
        `;


        template += ` <div class="modal fade" id="modalShowMoreData" data-keyboard="false" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div class="modal-content sub-div-shadow">
                    <div class="modal-header" id="modalHeader"></div>
                    <div class="modal-body" id="modalBody"></div>
                </div>
            </div>
        </div>`
     
    }
    return template;
}


function changeParticipantDetail(participant, adminSubjectAudit, changedOption, originalHTML, siteKey){

    const a = Array.from(document.getElementsByClassName('detailedRow'))
    if (a) {
        a.forEach(element => {
            let editRow = element.getElementsByClassName('showMore')[0];
            const values = editRow;
            let data = getDataAttributes(values);
            editRow.addEventListener('click', () => {
                const header = document.getElementById('modalHeader');
                const body = document.getElementById('modalBody');
                header.innerHTML = `<h5>${data.participantkey}</h5><button type="button" class="modal-close-btn" id="closeModal" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>`
                let template = '<div>'
                template += `
                <form id="formResponse" method="post">
                        <span><strong>Field Modified</strong></span> :  <span id="fieldModified" data-fieldconceptid=${data.participantconceptid} data-fieldModified=${data.participantkey}>${data.participantkey}</span>
                        <br >
                        <span><strong>Field Value</strong></span> :  <input required type="text" name="newValue" id="newValue" data-currentValue=${data.participantvalue} value=${data.participantvalue}>
                        <br >
                        <br >
                        <span style="display: block;"><strong>Comment :</strong></span>  <textarea required type="text" name="comment" id="comment" style="height: 100px; width: 400px; display: block;"> </textarea></li>
                        <br >

                    <div style="display:inline-block;">
                        <button type="submit" class="btn btn-primary" id="disableEditModal" data-toggle="modal">Submit</button>
                        <button type="submit" class="btn btn-danger" data-dismiss="modal" target="_blank">Cancel</button>
                    </div>
                </form>
               </div>`
                body.innerHTML = template;
                saveResponses(participant, adminSubjectAudit, changedOption, element);
                postEditedResponse(participant, adminSubjectAudit, changedOption, siteKey);
                viewAuditHandler(adminSubjectAudit);
                showSaveAlert();
                resetChanges(participant, originalHTML, siteKey);            
            });

        })
    }
    else {

    }
}
// creates payload to be sent to backend and update the UI. Remaps the field name back to concept id along with new responses.
function saveResponses(participant, adminSubjectAudit, changedOption, editedElement) {
   
    let displayAuditHistory = {};
    let conceptId = [];
    const a = document.getElementById('formResponse')
    a.addEventListener('submit', e => {
        e.preventDefault()
        // fieldModifiedData   
        let fieldModifiedData = getDataAttributes(document.getElementById('fieldModified'));
        conceptId.push(fieldModifiedData.fieldconceptid);
        // new value
        let newUpdatedValue = document.getElementById('newValue').value;
        changedOption[conceptId[conceptId.length - 1]] = newUpdatedValue;
        // update changed field on UI
        let updatedEditedValue = editedElement.querySelectorAll("td")[0];
        updatedEditedValue.innerHTML = newUpdatedValue;
        
        ///////////////////////////////////////////////
        // participant token
        displayAuditHistory.token = participant.token;
        // fieldModifiedData
        let fieldChanged = getDataAttributes(document.getElementById('fieldModified'));
        displayAuditHistory.fieldModified = fieldChanged.fieldmodified;
        // currentValue
        let currentValueData = getDataAttributes(document.getElementById('newValue'));
        displayAuditHistory.currentvalue = currentValueData.currentvalue;
        // newValue
        displayAuditHistory.newValue = document.getElementById('newValue').value;
        // timeStamp
        let timeStampData =  getCurrentTimeStamp();
        displayAuditHistory.timeStamp = timeStampData;
        // comment
        displayAuditHistory.comment = document.getElementById('comment').value;
        // userID
        let userIdData = getCurrentTimeStamp();
        displayAuditHistory.userId = userIdData;
        // Source
        let source = "Site Manager Dashboard";
        displayAuditHistory.source = source;
        adminSubjectAudit.push(displayAuditHistory);
      
    })

}

// For alternate contact details. Would be updates once concept ids for alt details are ready

function editAltContact(participant, adminSubjectAudit) {
    const a = document.getElementById('altContact');
    a.addEventListener('click',  () => {
       altContactHandler(participant, adminSubjectAudit);
   })
}

function altContactHandler(participant, adminSubjectAudit) {
    const header = document.getElementById('modalHeader');
    const body = document.getElementById('modalBody');
    header.innerHTML = `<h5>Alternate Contact Details</h5><button type="button" class="modal-close-btn" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>`
    let template = '<div>'
    template += `

            <br />
            <span id='fieldName' data-fieldName='First Name'><strong>Name</strong></span> : <input type="text" name="newName" id="newName" data-currrentFName=${participant.Module1 && participant.Module1.ALTCONTACT1.ALTCONTACT1_FNAME} value=${participant.Module1 && participant.Module1.ALTCONTACT1.ALTCONTACT1_FNAME} />
            <br />
            <span id='fieldLName' data-fieldLName='Last Name'><strong>Last Name</strong></span> : <input type="text" name="newLName" id="newLName" data-currrentLName=${participant.Module1 && participant.Module1.ALTCONTACT1.ALTCONTACT1_LNAME} value=${participant.Module1 && participant.Module1.ALTCONTACT1.ALTCONTACT1_LNAME} />
            <br />
            <span id='fieldRelationship' data-fieldRelationship='relationship'><strong>Relationship</strong></span> : <input type="text" name="newRelationship" id="newRelationship" />
            <br />
            <span id='fieldHome' data-fieldHome='home'><strong>Home Number</strong></span> : <input type="text" name="newHome" id="newHome" data-currentHome=${participant.Module1 && participant.Module1.ALTCONTACT2.ALTCONTACT2_HOME} value=${participant.Module1 && participant.Module1.ALTCONTACT2.ALTCONTACT2_HOME} />
            <br />
            <span id='fieldMobile' data-fieldMobile='mobile'><strong>Mobile Number</strong></span> : <input type="text" name="newMobile" id="newMobile" data-currentMobile=${participant.Module1 && participant.Module1.ALTCONTACT2.ALTCONTACT2_MOBILE} value=${participant.Module1 && participant.Module1.ALTCONTACT2.ALTCONTACT2_MOBILE} />
            <br />
            <span id='fieldEmail' data-fieldEmail='email'><strong>Email</strong></span> : <input type="text" name="newEmail" id="newEmail" data-currentEmail=${participant.Module1 && participant.Module1.ALTCONTACT2.ALTCONTACT2_EMAIL} value="${participant.Module1 && participant.Module1.ALTCONTACT2.ALTCONTACT2_EMAIL}" />
            <br />

            <div style="display:inline-block;">
                <button type="button" class="btn btn-primary" id="altDetailsSubmit">Submit</button>
                <button type="submit" class="btn btn-danger" data-dismiss="modal" target="_blank">Cancel</button>
            </div>

   </div>`
    body.innerHTML = template;
    saveAltResponse(adminSubjectAudit, participant);
    viewAuditHandler(adminSubjectAudit);
} 

function saveAltResponse(adminSubjectAudit, participant) {
    const a = document.getElementById('altDetailsSubmit')
    a.addEventListener('click', (e) => {
        e.preventDefault()
        let changedModuleOption = {};
        let altNewName = document.getElementById('newName').value;
        let altCurrentName = getDataAttributes(document.getElementById('newName'));
        changedModuleOption['Name'] = altNewName;

        let altNewLName = document.getElementById('newLName').value;
        let altCurrentLName = getDataAttributes(document.getElementById('newLName'));
        changedModuleOption['Last Name'] = altNewLName;

        let newRelationship = document.getElementById('newRelationship').value;
        // let altFieldRelationship = getDataAttributes(document.getElementById('fieldRelationship'))
        // let altCurrentRelationship = getDataAttributes(document.getElementById('currentRelationship'))
        changedModuleOption['Relationship'] = newRelationship;


        let altCurrentHome = getDataAttributes(document.getElementById('newHome'));
        let newHome = document.getElementById('newHome').value;
        changedModuleOption['Home'] = newHome;

        let altCurrentMobile = getDataAttributes(document.getElementById('newMobile'));
        console.log('altCurrentMobile',altCurrentMobile);
        let newMobile = document.getElementById('newMobile').value;
        changedModuleOption['Mobile'] = newMobile;

        let newEmail = document.getElementById('newEmail').value;
        let altCurrentEmail = getDataAttributes(document.getElementById('newEmail'));
        changedModuleOption['Email'] = newEmail;

        for (let key in changedModuleOption) {
            changedModuleOption[key] === '' ?
                delete changedModuleOption[key] : ''
        }

        // timeStamp
        let timeStampData =  getCurrentTimeStamp();
        // userID
        let userIdData = getCurrentTimeStamp();

        const module1 = {'token': participant.token, 'Module': changedModuleOption, 'timeStamp': timeStampData, 'userId': userIdData};
        adminSubjectAudit.push(module1);
        alert('Changes Submitted');
        let editedElement;
        const a = Array.from(document.getElementsByClassName('detaileAltRow'))
        a.forEach(element =>
            editedElement = element
        )

        let updatedEditedValue = editedElement.querySelectorAll("td")[0];
        if (altNewName !== '' && altNewLName !== '') {
            updatedEditedValue.innerHTML = altNewName +" "+ altNewLName;
        }
        else if (altNewName !== '') {
            updatedEditedValue.innerHTML = altNewName +" "+ altCurrentLName.currrentlname;
        }
        else if (altNewLName !== '') {
            updatedEditedValue.innerHTML = altCurrentName.currrentfname +" "+ altNewLName;
        }

        updatedEditedValue = editedElement.querySelectorAll("td")[1];
        updatedEditedValue.innerHTML = newRelationship !== '' ? newRelationship : null

        updatedEditedValue = editedElement.querySelectorAll("td")[2];
        updatedEditedValue.innerHTML = newHome !== '' ? newHome : altCurrentHome.currenthome

        updatedEditedValue = editedElement.querySelectorAll("td")[3];
        updatedEditedValue.innerHTML = newMobile !== '' ? newMobile : altCurrentMobile.currentmobile

        updatedEditedValue = editedElement.querySelectorAll("td")[4];
        updatedEditedValue.innerHTML = newEmail !== '' ? newEmail : altCurrentEmail.currentemail
      
    })
}

/////// Helper Functions /////////

function getDataAttributes(el) {
    let data = {};
    [].forEach.call(el.attributes, function(attr) {
        if (/^data-/.test(attr.name)) {
            var camelCaseName = attr.name.substr(5).replace(/-(.)/g, function ($0, $1) {
                return $1.toUpperCase();
            });
            data[camelCaseName] = attr.value;
        }
    });
    return data;
}

function showSaveAlert() {
    const a = document.getElementById('disableEditModal');
    a.addEventListener('click', e => {
        counter++;
        const modalClose = document.getElementById('modalShowMoreData')
        const closeButton = modalClose.querySelector('#closeModal').click()
    })
   
}

function resetChanges(participant, originalHTML, siteKey) {
    const a = document.getElementById("cancelChanges");
    a.addEventListener("click", () => {
        if (saveFlag === false) {
            alert('Changes cancelled');
            mainContent.innerHTML = originalHTML;
            renderParticipantDetails(participant, [], {}, siteKey);
        }
        else {  
            alert('No changes to save or cancel');
        }
    })
    
}


function postEditedResponse(participant, adminSubjectAudit, changedOption, siteKey) {

    const a = document.getElementById('sendResponse');
    a.addEventListener('click', () => {
        const participantToken = participant.token;
        changedOption['token'] = participantToken;
        clickHandler(adminSubjectAudit, changedOption, siteKey);
    })
}



// async-await function to make HTTP POST request
async function clickHandler(adminSubjectAudit, updatedOptions, siteKey)  {

   const idToken = siteKey;
   
    const updateParticpantPayload = {
        "data": updatedOptions
    }

    const response = await (await fetch(`https://us-central1-nih-nci-dceg-connect-dev.cloudfunctions.net/updateParticipantData`,{
        method:'POST',
        body: JSON.stringify(updateParticpantPayload),
        headers:{
            Authorization:"Bearer "+idToken,
            "Content-Type": "application/json"
            }
        }))
        if (response.status === 200) {
            saveFlag = true
            let lastModifiedHolder;
            adminSubjectAudit.length === 0 ? "" : lastModifiedHolder = adminSubjectAudit[adminSubjectAudit.length - 1]
            let a = document.getElementById('modifiedId')
            a.innerHTML = 'Placeholder for User id' + ' @ ' + lastModifiedHolder.timeStamp;
         }
           else { 
               (alert('Error'))
        }
 }

// Admin audit displaying logs
 function viewAuditHandler(adminSubjectAudit) {
    const a = document.getElementById('adminAudit');
    a.addEventListener('click',  () => {
        buttonAuditHandler(adminSubjectAudit);
    })
}

 function buttonAuditHandler(adminSubjectAudit) {
        const header = document.getElementById('modalHeader');
        const body = document.getElementById('modalBody');
        header.innerHTML = `<h5>Audit History</h5><button type="button" class="modal-close-btn" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>`
        let template = '<div>'
        adminSubjectAudit.length === 0 ? (
            template+= `<span> No changes to show </span></div>`
        ) : (
        adminSubjectAudit.map(element => {
            let JSONresponse = JSON.stringify(element);
            template += `<span>
               ${JSONresponse};
            </span>
        </div>`
        }))
       
        body.innerHTML = template;
    } 

