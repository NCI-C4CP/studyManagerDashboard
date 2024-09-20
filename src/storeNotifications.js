import { dashboardNavBarLinks, removeActiveClass } from './navigationBar.js';
import { showAnimation, hideAnimation, baseAPI, getIdToken, triggerNotificationBanner } from './utils.js';
import { appState } from './stateManager.js';

const converter = new showdown.Converter();
const newsletterCategories = ["newsletter", "eNewsletter", "anniversaryNewsletter"];
const langArray = ["english", "spanish"];
let conceptsOptionsStr = "";
let concepts = null;

export const editNotificationSchema = async () => {
  const notificationData = appState.getState().notification || {};
  if (!notificationData.isEditing) {
    const createSchemaRoute = "#notifications/createnotificationschema";
    location.replace(location.origin + location.pathname + createSchemaRoute);
    return;
  }

  await renderSchemaPage(notificationData.savedSchema);
};

export const createNotificationSchema = async () => {
  appState.setState({ notification: { } });
  await renderSchemaPage();
};

const renderSchemaPage = async (schemaData = null) => {
  const isParent = localStorage.getItem("isParent");
  document.getElementById("navBarLinks").innerHTML = dashboardNavBarLinks(isParent);
  removeActiveClass("nav-link", "active");
  document.getElementById("notifications").classList.add("active");

  if (!concepts) {
    concepts = await getConcepts();
    if (concepts) {
      for (const key in concepts) {
        conceptsOptionsStr += `<option value="${concepts[key]}">${key}</option>`;
      }
    }
  }

  const isEditing = appState.getState().notification?.isEditing;
  const titleStr = isEditing ? "Edit Notification Schema" : "Create Notification Schema";

  mainContent.innerHTML = `
    <div class="container-fluid">
        <div id="root root-margin"> 
            <div id="alert_placeholder"></div>
            <br />
            <span> <h4 style="text-align: center;" id="getCurrentTitle">${titleStr}</h4> </span>
            <form method="post" class="mt-3" id="configForm">
                ${getSchemaHtmlStr(schemaData)}
                <div class="mt-4 mb-4 d-flex justify-content-center">
                    <button type="submit" title="Save schema as complete. Notifications triggered" class="btn btn-primary" id="updateId">
                        Save Changes
                    </button>
                    <button type="submit" title="Save schema as a draft. Notifications NOT triggered" class="btn btn-outline-secondary ml-2" id="saveSchemaAsDraft" data-draft="true">
                        Save as Draft
                    </button>
                    <button type="button" class="btn btn-danger ml-2" id="exitForm">Exit Without Saving</button>
                </div>
                ${schemaData?.id ? getDryRunHtlmStr() : ""}
            </form>
        </div>
    </div>`;
  
  handleEmailPreview();
  handleSMSCharacterCount();
  handleLangSelection("email", schemaData);
  handleLangSelection("sms", schemaData);
  handleDeleteExistingConditions();
  handleAddCondition();
  handleNotficationDivs(schemaData);
  handleFormSubmit();
  handleExitForm();
  handleDryRun();
};

const getDryRunHtlmStr = () => `
  <hr style="border: solid gray 1px"/>
  <div class="row form-group align-items-center">
      <div class="col-md-3">
          <button type="button" class="btn btn-secondary" id="dryRunBtn" title="Test notification schemas scheduled at 3pm or 8pm">Dry Run</button>
      </div>
      <textarea class="col-md-8" id="dryRunResult" cols="30" rows="5" style="font-family: monospace, Courier New"></textarea>
  </div>`;

export const getSchemaHtmlStr = (schemaData = null, isReadOnly = false) => {
  const readonlyCheck = isReadOnly ? "disabled" : "";
  let conditionHtmlStrAll = "";
  let index = 0;

  if (schemaData?.conditions) {
    const conditions = JSON.parse(schemaData.conditions);
    for (const condition of conditions) {
      if (Array.isArray(condition) && condition.length === 3) {
        conditionHtmlStrAll += getConditionHtmlStr(index, isReadOnly, condition);
        index++;
      } else if (typeof condition === "string") {
        conditionHtmlStrAll += getSQLConditionHtmlStr(index, isReadOnly, condition);
        index++;
      }
    }
  } else {
    conditionHtmlStrAll = getConditionHtmlStr(index, isReadOnly);
  }

  return `
    <div class="row form-group">
        <label class="col-form-label col-md-3" for="attempt">Attempt</label>
        <input autocomplete="off" required class="col-md-8" type="text" id="attempt" placeholder="eg. 1st contact" ${schemaData?.attempt? `value="${schemaData.attempt}"`: "" } ${readonlyCheck}>
    </div>
    
    <div class="row form-group">
        <label class="col-form-label col-md-3" for="description">Description</label>
        <textarea class="col-md-8" required id="description" cols="30" rows="3" ${readonlyCheck}>${schemaData?.description ?? ""}</textarea>
    </div>
    
    <div class="row form-group">
        <label class="col-form-label col-md-3" for="category">Category</label>
        <input autocomplete="off" required class="col-md-8" type="text" id="category" placeholder="eg. consented" ${schemaData?.category? `value="${schemaData.category}"`: ""} ${readonlyCheck}>
    </div>

    <div class="row form-group">
        <label class="col-form-label col-md-3">Notification Type</label>
        <input type="checkbox" name="notification-checkbox" data-target-type="email" id="emailCheckBox" ${schemaData?.notificationType?.includes("email")? "checked": ""} ${readonlyCheck} style="height: 25px;">&nbsp;
        <label class="mr-3" for="emailCheckBox">Email</label>
        <input type="checkbox" name="notification-checkbox" data-target-type="sms" id="smsCheckBox" ${schemaData?.notificationType?.includes("sms")? "checked": ""} ${readonlyCheck} style="height: 25px;">&nbsp;
        <label class="mr-3" for="smsCheckBox">SMS</label>
        <input type="checkbox" disabled name="notification-checkbox" data-type="push" id="pushNotificationCheckBox" ${schemaData?.notificationType?.includes("push")? "checked": ""} style="height: 25px;">&nbsp;<label for="pushNotificationCheckBox">Push Notification</label>
    </div>

    <div class="row">
        <label class="col-form-label col-md-3" for="condition-key">Schedule at (EST)</label>
        <div class="col-md-1 form-check">
            <input class="form-check-input" type="radio" value="15:00" ${schemaData?.scheduleAt !== "20:00" ? "checked" : ""} ${readonlyCheck} name="scheduleAt" id="scheduleAt1">
            <label class="form-check-label" for="scheduleAt1">
                3:00 PM
            </label>
        </div>
        <div class="col-md-1 form-check">
            <input class="form-check-input" type="radio" value="20:00" ${schemaData?.scheduleAt === "20:00" ? "checked" : ""} ${readonlyCheck} name="scheduleAt" id="scheduleAt2">
            <label class="form-check-label" for="scheduleAt2">
                8:00 PM
            </label>
        </div>
    </div>
    <div id="emailDiv">${schemaData?.email ? getEmailDivHtml(schemaData.email, isReadOnly, true) : "" }</div>
    <div id="smsDiv">${schemaData?.sms ? getSmsDivHtml(schemaData.sms, isReadOnly, true) : "" }</div>
    <div id="pushDiv">${schemaData?.push?.subject ? getPushDivHtml(schemaData) : "" }</div>
    <div id="conditionsDiv" data-current-index="${index}">
        ${conditionHtmlStrAll}
    </div>
    <div class="form-group">
        <button type="button" class="btn btn-outline-primary" id="addOneCondition" ${readonlyCheck}>Add Condition</button>
        <button type="button" class="btn btn-outline-secondary" id="addSqlCondition" ${readonlyCheck}>Add SQL Condition(s)</button>
    </div>
    
    <div class="row form-group">
        <label class="col-form-label col-md-3">Email Field Concept</label>
        <div class="email-concept col-md-8 p-0">
            <input id="emailConceptId" required list="dataListEmailConcept" class="form-control" ${schemaData?.emailField ? `value="${schemaData.emailField}"`: ""} ${readonlyCheck}>
            <datalist id="dataListEmailConcept">
                ${conceptsOptionsStr}
            </datalist>
        </div>
    </div>
    
    <div class="row form-group">
        <label class="col-form-label col-md-3">Phone No. Concept</label>
        <div class="phone-concept col-md-8 p-0">
            <input id="phoneConceptId" required list="dataListPhoneConcept" class="form-control" ${schemaData?.phoneField ? `value="${schemaData.phoneField}"`: ""} ${readonlyCheck}>
            <datalist id="dataListPhoneConcept">
                ${conceptsOptionsStr}
            </datalist>
        </div>
    </div>

    <div class="row form-group">
        <label class="col-form-label col-md-3">First Name Concept</label>
        <div class="first-name-concept col-md-8 p-0">
            <input id="firstNameConceptId" required list="dataListFirstNameConcept" class="form-control" ${schemaData?.firstNameField ? `value="${schemaData.firstNameField}"`: ""} ${readonlyCheck}>
            <datalist id="dataListFirstNameConcept">
                ${conceptsOptionsStr}
            </datalist>
        </div>
    </div>

    <div class="row form-group">
        <label class="col-form-label col-md-3">Preferred Name Concept</label>
        <div class="preferred-name-concept col-md-8 p-0">
            <input id="preferredNameConceptId" required list="dataListPreferredNameConcept" class="form-control" ${schemaData?.preferredNameField ? `value="${schemaData.preferredNameField}"`: ""} ${readonlyCheck}>
            <datalist id="dataListPreferredNameConcept">
                ${conceptsOptionsStr}
            </datalist>
        </div>
    </div>

    <div class="row form-group">
        <label class="col-form-label col-md-3">Primary Field</label>
        <div class="primary-field col-md-8 p-0">
            <input id="primaryFieldConceptId" required list="dataListPrimaryField" class="form-control" ${schemaData?.primaryField ? `value="${schemaData.primaryField}"`: ""} ${readonlyCheck}>
            <datalist id="dataListPrimaryField">
                ${conceptsOptionsStr}
            </datalist>
        </div>
    </div>
    
    <div class="row form-group">
        <label class="col-form-label col-md-3">Start Time</label>
        <input required autocomplete="off" pattern="[0-9]+" class="col-md-2 mr-2" type="number" id="startDays" min="0" ${schemaData?.time?.start ? `value="${schemaData.time.start.day ?? 0}"` : `value="0"`} ${readonlyCheck}>
        <input required autocomplete="off" pattern="[0-9]+" class="col-md-2 mr-2" type="number" min="0" max="23" id="startHours" ${schemaData?.time?.start ? `value="${schemaData.time.start.hour ?? 0}"` : `value="0"`} ${readonlyCheck}>
        <input required autocomplete="off" pattern="[0-9]+" class="col-md-2" type="number" min="0" max="59" id="startMinutes" ${schemaData?.time?.start ? `value="${schemaData.time.start.minute ?? 0}"` : `value="0"`} ${readonlyCheck}>
    </div>
        <div class="row form-group">
        <label class="col-form-label col-md-3">Stop Time</label>
        <input required autocomplete="off" pattern="[0-9]+" class="col-md-2 mr-2" type="number" id="stopDays" min="1" ${schemaData?.time?.stop ? `value="${schemaData.time.stop.day ?? 2}"` : `value="2"`} ${readonlyCheck}>
        <input required autocomplete="off" pattern="[0-9]+" class="col-md-2 mr-2" type="number" min="0" max="23" id="stopHours" ${schemaData?.time?.stop? `value="${schemaData.time.stop.hour ?? 0}"` : `value="0"`} ${readonlyCheck}>
        <input required autocomplete="off" pattern="[0-9]+" class="col-md-2" type="number" min="0" max="59" id="stopMinutes" ${schemaData?.time?.stop ? `value="${schemaData.time.stop.minute ?? 0}"` : `value="0"`} ${readonlyCheck}>
    </div>`;
};

const handleFormSubmit = () => {
  const form = document.getElementById("configForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let schema = {};
    schema.id = appState.getState().notification?.savedSchema?.id ?? "";
    const hasSchemaId = schema.id.length > 0;
    schema.isDraft = e.submitter.dataset.draft === "true";
    schema["attempt"] = document.getElementById("attempt").value.trim();
    schema["description"] = document.getElementById("description").value.trim();
    schema["category"] = document.getElementById("category").value.trim();
    schema["notificationType"] = Array.from(document.getElementsByName("notification-checkbox"))
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.dataset.targetType);
    if (schema["notificationType"].length === 0) { 
      triggerNotificationBanner("Please select at least one notification type!", "danger");
      return;
    }

    schema["scheduleAt"] = Array.from(document.getElementsByName("scheduleAt")).filter((dt) => dt.checked)[0].value;
    schema["sendType"]= "scheduled";
    schema["emailField"] = document.getElementById("emailConceptId").value;
    schema["phoneField"] = document.getElementById("phoneConceptId").value;
    schema["firstNameField"] = document.getElementById("firstNameConceptId").value;
    const preferredNameValue = document.getElementById("preferredNameConceptId").value;
    if (preferredNameValue) {
      schema["preferredNameField"] = preferredNameValue;
    }

    schema["primaryField"] = document.getElementById("primaryFieldConceptId").value;
    schema["time"] = {
      start: {
        day: parseInt(document.getElementById("startDays").value),
        hour: parseInt(document.getElementById("startHours").value),
        minute: parseInt(document.getElementById("startMinutes").value),
      },
      stop: {
        day: parseInt(document.getElementById("stopDays").value),
        hour: parseInt(document.getElementById("stopHours").value),
        minute: parseInt(document.getElementById("stopMinutes").value),
      },
    };

    const emailInputDivList = document.querySelectorAll("#emailDiv div[data-email-lang]");
    if (emailInputDivList.length > 0) {
      schema["email"] = {};
      emailInputDivList.forEach((emailInputDiv) => {
        const lang = emailInputDiv.dataset.emailLang;
        schema["email"][lang] = {};
        schema["email"][lang]["subject"] = emailInputDiv.querySelector(`#${lang}EmailSubject`).value;
        if (newsletterCategories.includes(schema["category"])) {
          schema["email"][lang]["body"] = emailInputDiv.querySelector(`#${lang}EmailBody`).value;
        } else {
          schema["email"][lang]["body"] = emailInputDiv.querySelector(`#${lang}EmailBody`).value.replace(/\n/g, "<br/>");
        }
      });

      schema.email.subject = schema.email.english.subject;
      schema.email.body = schema.email.english.body;
    }

    const smsInputDivList = document.querySelectorAll("#smsDiv div[data-sms-lang]");
    if (smsInputDivList.length > 0) {
      schema["sms"] = {};
      smsInputDivList.forEach((smsInputDiv) => {
        const lang = smsInputDiv.dataset.smsLang;
        schema["sms"][lang] = {};
        schema["sms"][lang]["body"] = smsInputDiv.querySelector(`#${lang}SmsBody`).value;
      });
      
      schema.sms.body = schema.sms.english.body;
    }

    const pushSubjectEle = document.getElementById("pushSubject");
    if (pushSubjectEle) {
      schema["push"] = { subject: pushSubjectEle.value, body: document.getElementById("pushBody").value };
    }

    let conditionArray = [];
    const conditionRowArray = Array.from(document.querySelectorAll("#conditionsDiv div[data-condition-idx]"));
    for (const conditionRow of conditionRowArray) {
      if (conditionRow.dataset.conditionType === "sql") {
        conditionArray.push([conditionRow.querySelector("textarea").value.trim()]);
        continue;
      }

      const conditionKey = conditionRow.querySelector("input[name=condition-key]").value.trim().split(/\s+/)[0];
      const conditionOperator = conditionRow.querySelector("select[name=condition-operator]").value.trim().split(/\s+/)[0];
      const conditionValueType = conditionRow.querySelector("select[name=value-type]").value.trim().split(/\s+/)[0];
      const conditionValue = conditionRow.querySelector("input[name=condition-value]").value.trim().split(/\s+/)[0];
      if (conditionValueType === "string") {
        conditionArray.push([conditionKey, conditionOperator, conditionValue]);
      } else if (conditionValueType === "number") {
        conditionArray.push([conditionKey, conditionOperator, parseInt(conditionValue)]);
      }
    }
    schema["conditions"] = JSON.stringify(conditionArray);

    const currSchemaId = await storeNotificationSchema(schema);
    if (!hasSchemaId && currSchemaId.length > 0) {
      const form = document.getElementById("configForm");
      const wrapperDiv = document.createElement("div");
      wrapperDiv.innerHTML = getDryRunHtlmStr();
      form && form.append(...wrapperDiv.children);
      handleDryRun();
    }
  });
};

const handleAddCondition = () => {
  const conditionDiv = document.getElementById("conditionsDiv");
  const idAndCallbacks = [
    ["addOneCondition", getConditionHtmlStr],
    ["addSqlCondition", getSQLConditionHtmlStr],
  ];

  for (const [btnId, getHtmlStr] of idAndCallbacks) {
    const btn = document.getElementById(btnId);
    if (!btn || btn.hasClickListener) continue;

    btn.addEventListener("click", () => {
      const index = parseInt(conditionDiv.dataset.currentIndex) + 1;
      const wrapperDiv = document.createElement("div");
      wrapperDiv.innerHTML = getHtmlStr(index);
      conditionDiv.appendChild(wrapperDiv.firstElementChild);
      conditionDiv.querySelector(`button[data-btn-idx="${index}"]`).addEventListener("click", handleDeleteCondition);
      conditionDiv.dataset.currentIndex = index;
      btn.hasClickListener = true;
    });
  }
};

const handleDeleteExistingConditions = () => {
  const btns = document.querySelectorAll("#conditionsDiv button[data-btn-idx]");
  btns.forEach((btn) => {
    if (!btn.hasClickListener) {
      btn.addEventListener("click", handleDeleteCondition);
      btn.hasClickListener = true;
    }
  });
};

const getConditionHtmlStr = (index = 0, isReadOnly = false, condition = []) => {
  const readonlyCheck = isReadOnly ? "disabled" : "";
  const [conditionKey = null, conditionOperator = null, conditionValue = null] = condition;
  return `
    <div class="row form-group" data-condition-idx="${index}" data-condition-type="simple">
        <label class="col-form-label col-md-3">Condition</label>
        <div class="col-md-2 mr-2 p-0">
          <input required list="dataListConditionKey${index}" class="form-control" name="condition-key" ${conditionKey ? `value="${conditionKey}"` : ""} ${readonlyCheck}>
          <datalist id="dataListConditionKey${index}">
              ${conceptsOptionsStr}
          </datalist>
        </div>
        <select name="condition-operator" class="col-md-2 form-control mr-2" ${readonlyCheck}>
            <option value="equals" ${conditionOperator === "equals" ? "selected" : ""}>equals</option>
            <option value="notequals" ${conditionOperator === "notequals" ? "selected" : ""}>notequals</option>
            <option value="greater" ${conditionOperator === "greater" ? "selected" : ""}>greater</option>
            <option value="greaterequals" ${conditionOperator === "greaterequals" ? "selected" : ""}>greaterequals</option>
            <option value="less" ${conditionOperator === "less" ? "selected" : ""}>less</option>
            <option value="lessequals" ${conditionOperator === "lessequals" ? "selected" : ""}>lessequals</option>
        </select>
        <select name="value-type" class="col-md-1 form-control mr-2" ${readonlyCheck}>
            <option value="number" ${typeof conditionValue === "number" ? "selected" : ""}>number</option>
            <option value="string" ${typeof conditionValue === "string" ? "selected" : ""}>string</option>
        </select>
        <div class="condition-value col-md-2 mr-2 p-0">
          <input required  list="dataListConditionValue${index}" class="form-control" name="condition-value" ${conditionValue ? `value="${conditionValue}"` : ""} ${readonlyCheck}>
          <datalist id="dataListConditionValue${index}">
              ${conceptsOptionsStr}
          </datalist>
        </div>
        <button type ="button" data-btn-idx="${index}" ${readonlyCheck} class="btn btn-warning ml-1 col-md-1" title="Delete condition in this row">Delete</button>
    </div>`;
};

const getSQLConditionHtmlStr = (index = 0, isReadOnly = false, conditionStr = "") => {
  const readonlyCheck = isReadOnly ? "disabled" : "";
  return `
    <div class="row form-group" data-condition-idx="${index}" data-condition-type="sql">
        <label class="col-form-label col-md-3">SQL Conditions</label>
        <div class="col-md-7 mr-2 p-0">
          <textarea required class="form-control" rows="2" placeholder='d_685002411.d_867203506=104430631 AND (d_827220437=531629870 OR d_827220437=548392715) AND d_914594314>"2024-01-01" AND d_914594314<"2024-09-10T20:05:16.490Z"' ${readonlyCheck}>${conditionStr}</textarea>
        </div>
        <button type ="button" data-btn-idx="${index}" ${readonlyCheck} class="btn btn-warning ml-4 col-md-1" title="Delete SQL conditions in this row">Delete</button>
    </div>`;
};

const handleDeleteCondition = (event) => {
  event.target.parentElement.remove();
};

const getConcepts = async () => {
  if (concepts) return concepts;

  try {
    const response = await fetch("https://raw.githubusercontent.com/episphere/conceptGithubActions/master/jsons/varToConcept.json");
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error in fetching concepts.", error);
    return null;
  }
}; 


const getEmailInputHtmlStr = (lang, emailLangData, isReadOnly) => {
  const langStrWithCap = getStringWithCap(lang);
  const readonlyCheck = isReadOnly ? "disabled" : "";

  return `
    <div data-email-lang="${lang}">
        <div class="row">
            <label class="col-form-label col-md-3" for="${lang}EmailSubject">${langStrWithCap} Subject</label>
            <input autocomplete="off" required class="col-md-8" type="text" id="${lang}EmailSubject" placeholder="${langStrWithCap} Email Subject" ${emailLangData?.subject ? `value="${emailLangData.subject}"`: ""} ${readonlyCheck}>
        </div>
        <div class="row" data-email-body="${lang}">
            <label class="col-form-label col-md-3" for="${lang}EmailBody">${langStrWithCap} Body</label>
            <textarea rows="5" class="col-md-4"  id="${lang}EmailBody" placeholder="${langStrWithCap} Email Content" ${readonlyCheck}>${emailLangData?.body ?? ""}</textarea>
            <div class="col-md-4" id="${lang}EmailBodyPreview"></div>
        </div>
    </div>`;
};

const getEmailDivHtml = (emailData = null, isReadOnly = false, isInitialRun = false) => {
  if (isInitialRun && !emailData) return "";
  if (!emailData) emailData = { english: {} };

  const readonlyCheck = isReadOnly ? "disabled" : "";
  return `
    <div class="row">
        <div class="col" data-input-type="email">
            <div class="row">
                <h5 class="col-md-3">Email</h5>
                ${langArray
                  .map(
                    (lang) =>
                      `<input type="checkbox" data-type="email" data-lang="${lang}" id="${lang}CheckBox" ${ lang === "english" ? "checked disabled" :
                        emailData[lang] ? "checked" : ""
                      } ${readonlyCheck} style="height: 25px;">&nbsp;
                      <label class="mr-3" for="${lang}CheckBox">${getStringWithCap(lang)}</label>`
                  )
                  .join("")}
            </div>
            ${langArray
              .filter((lang) => emailData[lang])
              .map((lang) => getEmailInputHtmlStr(lang, emailData[lang], isReadOnly))
              .join("")}

        </div>
    </div>`;
};

const getSmsInputHtmlStr = (lang, smsLangData, isReadOnly) => {
  const langStrWithCap = getStringWithCap(lang);
  return `
    <div data-sms-lang="${lang}">
        <div class="row">
            <label class="col-form-label col-md-3" for="${lang}SmsBody">${langStrWithCap} Body (<small id="${lang}CharacterCount">${smsLangData?.body?.length ?? 0} characters</small>)</label>
            <textarea rows="2" class="col-md-8" id="${lang}SmsBody" placeholder="${langStrWithCap} SMS Content" ${isReadOnly ? "disabled": ""}>${smsLangData?.body ?? ""}</textarea>
        </div>
    </div>`;
};

const getSmsDivHtml = (smsData = null, isReadOnly = false, isInitialRun = false) => {
  if (isInitialRun && !smsData) return "";
  if (!smsData) smsData = { english: {} };

  const readonlyCheck = isReadOnly ? "disabled" : "";
  return `
    <div class="row">
        <div class="col" data-input-type="sms">
            <div class="row">
                <h5 class="col-md-3">SMS</h5>
                ${langArray
                  .map(
                    (lang) =>
                      `<input type="checkbox" data-type="sms" data-lang="${lang}" id="${lang}SmsCheckBox" ${lang === "english" ? "checked disabled" :
                        smsData[lang] ? "checked" : ""
                      } ${readonlyCheck} style="height: 25px;">&nbsp;
                      <label class="mr-3" for="${lang}SmsCheckBox">${getStringWithCap(lang)}</label>`
                  )
                  .join("")}

            </div>
            ${langArray
              .filter((lang) => smsData[lang])
              .map((lang) => getSmsInputHtmlStr(lang, smsData[lang], isReadOnly))
              .join("")}
        </div>
    </div>`;
};

const getPushDivHtml = (schemaData = null) => {
  return `
    <div class="row">
        <div class="col">
            <h5>Push notification</h5>
            <div class="row">
                <label class="col-form-label col-md-3" for="pushSubject">Subject</label>
                <input autocomplete="off" required class="col-md-8" type="text" id="pushSubject" placeholder="Push notification subject" ${schemaData?.push?.subject ? `value="${schemaData.push.subject}"`: ""}>
            </div>
            <div class="row">
                <label class="col-form-label col-md-3" for="pushBody">Body</label>
                <textarea rows="2" class="col-md-8" id="pushBody" placeholder="Push notification body">${schemaData?.push?.body ?? ""}</textarea>
            </div>
        </div>
    </div>`;
};

const handleNotficationDivs = (schemaData) => {
  const emailCheckbox = document.getElementById("emailCheckBox");
  emailCheckbox.addEventListener("click", () => {
    if (emailCheckbox.checked === true) {
      document.getElementById("emailDiv").innerHTML = getEmailDivHtml(schemaData?.email);
      handleLangSelection("email", schemaData);
      handleEmailPreview();
    } else {
      document.getElementById("emailDiv").innerHTML = "";
    }
  });

  const smsCheckbox = document.getElementById("smsCheckBox");
  smsCheckbox.addEventListener("click", () => {
    if (smsCheckbox.checked === true) {
      document.getElementById("smsDiv").innerHTML = getSmsDivHtml(schemaData?.sms);
      handleLangSelection("sms", schemaData);
      handleSMSCharacterCount();
    } else {
      document.getElementById("smsDiv").innerHTML = "";
    }
  });

  const pushCheckbox = document.getElementById("pushNotificationCheckBox");
  pushCheckbox.addEventListener("click", () => {
    if (pushCheckbox.checked === true) {
      document.getElementById("pushDiv").innerHTML = getPushDivHtml(schemaData);
    } else {
      document.getElementById("pushDiv").innerHTML = "";
    }
  });
};

const handleSMSCharacterCount = (smsInputDivList = null) => {
  if (!smsInputDivList) {
    smsInputDivList = document.querySelectorAll("#smsDiv div[data-sms-lang]");
    if (smsInputDivList.length === 0) return;
  }

  for (const smsInputDiv of smsInputDivList) {
    const smsBodyEle = smsInputDiv.querySelector("textarea");
    const characterCountEle = smsInputDiv.querySelector("small");
    if (!smsBodyEle || !characterCountEle || smsBodyEle.hasInputListener) continue;

    smsBodyEle.addEventListener("input", () => {
      characterCountEle.innerText = `${smsBodyEle.value.length} characters`;
    });
    smsBodyEle.hasInputListener = true;
  }
};

export const handleEmailPreview = (emailDivList = null) => {
  if (!emailDivList) {
    emailDivList = document.querySelectorAll("#emailDiv div[data-email-lang]");
    if (emailDivList.length === 0) return;
  }

  for (const emailInputDiv of emailDivList) {
    const emailBodyDiv = emailInputDiv.querySelector("div[data-email-body]");
    const lang = emailBodyDiv.dataset.emailBody;
    const emailBody = emailBodyDiv.querySelector("textarea");
    const emailPreview = emailBodyDiv.querySelector(`#${lang}EmailBodyPreview`);
    if (!emailBody || !emailPreview || emailBody.hasMouseEnterListener) continue;

    emailBody.addEventListener("mouseenter", () => {
      emailPreview.innerHTML = converter.makeHtml(emailBody.value);
    });
    emailBody.hasMouseEnterListener = true;
  }
};

const handleLangSelection = (notificationType, shemaData = null) => {
  const checkboxes = document.querySelectorAll(`input[type=checkbox][data-type=${notificationType}]`);
  if (checkboxes.length === 0) return;

  for (const checkbox of checkboxes) {
    if (checkbox.hasClickListener) continue;

    checkbox.addEventListener("click", () => {
      const lang = checkbox.dataset.lang;
      const currDiv = document.querySelector(`div[data-${notificationType}-lang=${lang}]`);

      if (!checkbox.checked) {
        currDiv && currDiv.remove();
      } else {
        const wrapperDiv = document.createElement("div");
        if (notificationType === "email") {
          wrapperDiv.innerHTML = getEmailInputHtmlStr(lang, shemaData?.email?.[lang]);
          handleEmailPreview([wrapperDiv]);
        } else if (notificationType === "sms") {
          wrapperDiv.innerHTML = getSmsInputHtmlStr(lang, shemaData?.sms?.[lang]);
          handleSMSCharacterCount([wrapperDiv]);
        }

        if (!currDiv) {
          const parentDiv = document.querySelector(`div[data-input-type=${notificationType}]`);
          parentDiv.append(wrapperDiv.firstElementChild);
        } else {
          currDiv.replaceWith(wrapperDiv.firstElementChild);
        }
      }

    });

    checkbox.hasClickListener = true;
  }
};

const storeNotificationSchema = async (schema) => {
  showAnimation();
  const idToken = await getIdToken();
  const schemaPayload = { data: schema };

  const response = await fetch(`${baseAPI}/dashboard?api=storeNotificationSchema`, {
    method: "POST",
    body: JSON.stringify(schemaPayload),
    headers: {
      Authorization: "Bearer " + idToken,
      "Content-Type": "application/json",
    },
  });
  hideAnimation();
  const res = await response.json();
  if (res.code === 200 && res.data?.length > 0) {
    schema.id = res.data[0].schemaId;
    appState.setState((state) => ({
      notification: { savedSchema: schema, isEditing: state.notification?.isEditing ?? false },
    }));
    triggerNotificationBanner(`Notfication Schema Saved as ${schema.isDraft ? "Draft" : "Complete"}.`, "success");
    return res.data[0].schemaId;
  }

  triggerNotificationBanner("Error in saving notification schema!", "danger");
  return "";
};

const handleExitForm = () => {
  const exitBtn = document.getElementById("exitForm");
  exitBtn.addEventListener("click", () => {
    const loadDetailsPage = "#notifications/retrievenotificationschema";
    location.replace(window.location.origin + window.location.pathname + loadDetailsPage);
  });
};

const handleDryRun = () => {
  const resultEle = document.getElementById("dryRunResult");
  const dryRunBtn = document.getElementById("dryRunBtn");
  if (!dryRunBtn || dryRunBtn.hasClickListener) return;

  dryRunBtn.addEventListener("click", async () => {
    showAnimation();
    const schemaId = appState.getState().notification.savedSchema.id;
    const idToken = await getIdToken();
    const res = await fetch(`${baseAPI}/dashboard?api=dryRunNotificationSchema&schemaId=${schemaId}`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + idToken,
      },
    });

    const resJson = await res.json();
    const dataObj = resJson.data[0];
    let strArray = [];
    ["email", "sms"].forEach((key) => {
      langArray.forEach((lang) => {
        strArray.push(`${getStringWithCap(lang)} ${key} count:`.padEnd(30, " ") +  `${dataObj?.[key]?.[lang] ?? 0}`);
      });
    });

    let dryRunSummary = strArray.join("\n") + "\n";
    if (resJson.code === 200) {
      dryRunSummary += "Everything looks good!";
    } else {
      dryRunSummary = `Error occurred during dry run:\n${resJson.message}`;
    }

    resultEle.textContent = dryRunSummary;
    hideAnimation();
  });

  dryRunBtn.hasClickListener = true;
};

function getStringWithCap(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
