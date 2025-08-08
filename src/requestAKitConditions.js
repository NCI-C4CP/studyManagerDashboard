import { dashboardNavBarLinks, removeActiveClass } from './navigationBar.js';
import { baseAPI, getIdToken, hideAnimation, showAnimation, triggerNotificationBanner } from './utils.js';

let conceptsOptionsStr = "";
let concepts = null;

export const renderRequestAKitConditions = async () => {
    document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks();
    removeActiveClass('nav-link', 'active');
    document.getElementById('manageRequestAKitConditionsBtn')?.classList.add('active');

    showAnimation();

    if (!concepts) {
        concepts = await getConcepts();
        if (concepts) {
        for (const key in concepts) {
            conceptsOptionsStr += `<option value="${concepts[key]}">${key}</option>`;
        }
        }
    }

    // @TODO: Error handling
    const response = await getRequestAKitConditions();

    console.log('Get requestAKitConditions response', response);

    mainContent.innerHTML = render(response.data);

    handleDeleteExistingConditions();
    handleAddCondition();
    handleDeleteExistingSorts();
    handleAddSort();
    handleFormSubmit();
    handleExitForm();
    handleRunButtons();
    hideAnimation();
}

const render = (data = {}) => {
    
    const isReadOnly = false;
    let conditionHtmlStrAll = "";
    let sortsHtmlStrAll = "";
    let conditionIndex = 0;

    if (data?.conditions) {
        const conditions = JSON.parse(data.conditions);
        for (const condition of conditions) {
            if (Array.isArray(condition) && condition.length === 3) {
                conditionHtmlStrAll += getConditionHtmlStr(conditionIndex, isReadOnly, condition);
                conditionIndex++;
            } else if (typeof condition === "string") {
                conditionHtmlStrAll += getSQLConditionHtmlStr(conditionIndex, isReadOnly, condition);
                conditionIndex++;
            }
        }
    } else {
        conditionHtmlStrAll = getConditionHtmlStr(conditionIndex, isReadOnly);
    }

    let sortIndex = 0;
    if(data?.sorts) {
        const sorts = JSON.parse(data.sorts);
        for (const sort of sorts) {
            if (Array.isArray(sort) && sort.length === 2) {
                sortsHtmlStrAll += getSortHTMLStr(sortIndex, sort);
                sortIndex++;
            }
        }
    } else {
      sortsHtmlStrAll = getSortHTMLStr(sortIndex);
    }


    return `
    <div class="container-fluid">
      <h2>Select Participants to Make Eligible for Home Mouthwash Kits</h2>
      <div id="root root-margin"> 
        <div id="alert_placeholder"></div>
        <br />
        <form method="post" class="mt-3" id="configForm">
          <div id="conditionsDiv" data-current-index="${conditionIndex}">${conditionHtmlStrAll}</div>
          <div class="form-group">
            <button type="button" class="btn btn-outline-primary" id="addOneCondition">Add Condition</button>
            <button type="button" class="btn btn-outline-secondary" id="addSqlCondition">Add SQL Condition(s)</button>
          </div>
          <div id="sortsDiv" data-current-index="${sortIndex}">${sortsHtmlStrAll}</div>
          <div class="form-group">
            <button type="button" class="btn btn-outline-primary" id="addOneSort">Add Sort</button>
          </div>
          <div class="row form-group mt-4 mb-4 d-flex">
            <div class="col-md-12">
              Limit updates to the first <input type="number" class="mr-0 ml-0" id="limit" value="${data.limit || ''}" /> participants found.
            </div>
          </div>
          <div class="mt-4 mb-4 d-flex justify-content-center">
              <button type="submit" title="Save schema as complete." class="btn btn-primary" id="updateId">
                  Save Changes
              </button>
              <button type="button" class="btn btn-danger ml-2" id="exitForm">Exit Without Saving</button>
          </div>
        </form>

        <hr style="border: solid gray 1px" />
        <div class="row form-group align-items-center">
            <div class="col-md-3">
                <button type="button" class="btn btn-secondary" id="dryRunBtn" title="See the SQL query that is run and how many results it returns without a limit">Save & Dry Run Without Limit</button>
            </div>
            <div class="col-md-12" id="dry-run-results"></div>
        </div>
        <div class="row form-group align-items-center">
            <div class="col-md-3">
              <button type="button" class="btn btn-success" id="liveRunBtn" title="Run the query and update the results.">Save & Run Eligibility Updates</button>
            </div>
            <div class="col-md-12" id="live-run-results"></div>
        </div>

        


      </div>
    </div>`;
}

const getRequestAKitConditions = async () => {
    const idToken = await getIdToken();
    const url = `${baseAPI}/dashboard?api=retrieveRequestAKitConditions`;
    
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + idToken,
        },
      });
    
      return response.json();
}

const getConditionHtmlStr = (index = 0, isReadOnly = false, condition = []) => {
  const readonlyCheck = isReadOnly ? "disabled" : "";
  const [conditionKey = null, conditionOperator = null, conditionValue = null] = condition;
  return `
    <div class="row form-group" data-condition-idx="${index}" data-condition-type="simple">
        <label class="col-form-label col-md-2">Condition</label>
        <div class="col-md-3 mr-2 p-0">
          <input list="dataListConditionKey${index}" class="form-control" name="condition-key" ${conditionKey ? `value="${conditionKey}"` : ""} ${readonlyCheck}>
          <datalist id="dataListConditionKey${index}">
              ${conceptsOptionsStr}
          </datalist>
        </div>
        <select name="condition-operator" class="col-md-1 form-control mr-2" ${readonlyCheck}>
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
        <div class="condition-value col-md-3 mr-2 p-0">
          <input list="dataListConditionValue${index}" class="form-control" name="condition-value" ${conditionValue ? `value="${conditionValue}"` : ""} ${readonlyCheck}>
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

const handleDeleteConditionOrSort = (event) => {
  event.target.parentElement.remove();
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
      conditionDiv.querySelector(`button[data-btn-idx="${index}"]`).addEventListener("click", handleDeleteConditionOrSort);
      conditionDiv.dataset.currentIndex = index;
      btn.hasClickListener = true;
    });
  }
};

const handleDeleteExistingConditions = () => {
  const btns = document.querySelectorAll("#conditionsDiv button[data-btn-idx]");
  btns.forEach((btn) => {
    if (!btn.hasClickListener) {
      btn.addEventListener("click", handleDeleteConditionOrSort);
      btn.hasClickListener = true;
    }
  });
};

const getSortHTMLStr = (index = 0, sort = []) => {
  const [sortKey = null, sortOrder = 'ASC'] = sort;
  return `
    <div class="row form-group" data-sort-idx="${index}">
        <label class="col-form-label col-md-1">Order By</label>
        <div class="col-md-3 mr-2 p-0">
          <input list="dataListSortKey${index}" class="form-control" name="sort-key" ${sortKey ? `value="${sortKey}"` : ""}>
          <datalist id="dataListSortKey${index}">
              ${conceptsOptionsStr}
          </datalist>
        </div>
        <select name="sort-order" class="col-md-1 form-control mr-2">
            <option value="ASC" ${sortOrder === "ASC" ? "selected" : ""}>ASC</option>
            <option value="DESC" ${sortOrder === "DESC" ? "selected" : ""}>DESC</option>
        </select>
        <button type ="button" data-btn-idx="${index}" class="btn btn-warning ml-1 col-md-1" title="Delete sort in this row">Delete</button>
    </div>
  `;
}

const handleAddSort = () => {
  const sortDiv = document.getElementById("sortsDiv");
  const idAndCallbacks = [
    ["addOneSort", getSortHTMLStr]
  ];

  for (const [btnId, getHtmlStr] of idAndCallbacks) {
    const btn = document.getElementById(btnId);
    if (!btn || btn.hasClickListener) continue;

    btn.addEventListener("click", () => {
      const index = parseInt(sortDiv.dataset.currentIndex) + 1;
      const wrapperDiv = document.createElement("div");
      wrapperDiv.innerHTML = getHtmlStr(index);
      sortDiv.appendChild(wrapperDiv.firstElementChild);
      sortDiv.querySelector(`button[data-btn-idx="${index}"]`).addEventListener("click", handleDeleteConditionOrSort);
      sortDiv.dataset.currentIndex = index;
      btn.hasClickListener = true;
    });
  }
};

const handleDeleteExistingSorts = () => {
  const btns = document.querySelectorAll("#sortsDiv button[data-btn-idx]");
  btns.forEach((btn) => {
    if (!btn.hasClickListener) {
      btn.addEventListener("click", handleDeleteConditionOrSort);
      btn.hasClickListener = true;
    }
  });
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

const saveForm = async () => {
    let schema = {};

    schema.limit = document.getElementById('limit').value;

    let conditionArray = [];
    const conditionRowArray = Array.from(document.querySelectorAll("#conditionsDiv div[data-condition-idx]"));
    for (const conditionRow of conditionRowArray) {
      if (conditionRow.dataset.conditionType === "sql") {
        const sqlCondition = conditionRow.querySelector("textarea").value.trim();
        if (sqlCondition.length > 0) conditionArray.push(sqlCondition);
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
    console.log('conditionArray', conditionArray);
    schema["conditions"] = JSON.stringify(conditionArray);

    let sortArray = [];
    const sortRowArray = Array.from(document.querySelectorAll("#sortsDiv div[data-sort-idx]"));
    for (const sortRow of sortRowArray) {
      const sortKey = sortRow.querySelector("input[name=sort-key]").value.trim().split(/\s+/)[0];
      const sortOrder = sortRow.querySelector("select[name=sort-order]").value.trim().split(/\s+/)[0] || 'ASC';
      sortArray.push([sortKey, sortOrder]);
    }

    schema["sorts"] = JSON.stringify(sortArray);

    console.log('schema', schema);

    const response = await storeRequestAKitConditions(schema);
    
    return response;
}

const handleFormSubmit = () => {
  const form = document.getElementById("configForm");
  console.log('Binding form submit to form', form);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const response = await saveForm();

      if(response.code === 200) {
        triggerNotificationBanner("Updates saved", "success");
      } else {
        console.log('res', response);
        triggerNotificationBanner("Error in saving page", "danger");
      }

      console.log('response', response);
    } catch (e) {
      console.error('erroer', e);
      triggerNotificationBanner("Error in saving page", "danger");
    }
  });
}

const handleExitForm = () => {
  const exitBtn = document.getElementById("exitForm");
  exitBtn.addEventListener("click", () => {
        // Return to dashboard
        location.replace(window.location.origin + window.location.pathname);
  });
};

const handleRunButtons = () => {
  const dryRunBtn = document.getElementById("dryRunBtn");
  if (dryRunBtn && !dryRunBtn.hasClickListener) {
    dryRunBtn.addEventListener("click", async () => {
        showAnimation();

        try {
          // Save first
          await saveForm();

          const resJson = await processRequestAKitConditions(false);

          console.log('resJson', resJson);
          let {data, message, code, success} = resJson;

          const displayDiv = document.getElementById('dry-run-results');
          if(success === true) {
            triggerNotificationBanner('Dry run successful! See results below.', 'success');
            const {count, queryStr} = data;
            // Update div
            displayDiv.innerHTML = `
            <div>
              BigQuery String run: ${queryStr}
            </div>
            <div>
              Returns ${count} results
            </div>
            `;
          } else {
            triggerNotificationBanner(`${code} Error in dry run: ${message}`, 'danger');
            displayDiv.innerHTML = `${code} Error in dry run: ${message}`;
          }
        } catch(err) {
          console.error('Error', err);
          triggerNotificationBanner(`Error in dry run: see console`, 'danger');
        }

        hideAnimation();
      });
  } 

  const liveRunBtn = document.getElementById("liveRunBtn");
  if (liveRunBtn && !liveRunBtn.hasClickListener) {
    liveRunBtn.addEventListener("click", async () => {
        showAnimation();

        await saveForm();

        const resJson = await processRequestAKitConditions(true);

        console.log('resJson', resJson);

        let {data, message, code, success} = resJson;

        const displayDiv = document.getElementById('live-run-results');
        if(success === true) {
          triggerNotificationBanner('Updates successful! See results below.', 'success');
          const {count, queryStr} = data;
          // Update div
          displayDiv.innerHTML = `
          <div>
            BigQuery String run: ${queryStr}
          </div>
          <div>
            Updated ${count} participants
          </div>
          `;
        } else {
          displayDiv.innerHTML = `${code} Error in processing updates: ${message}`;
        }

        hideAnimation();
      });
  }

  
}

const processRequestAKitConditions = async (updateDb = false) => { 
const idToken = await getIdToken();

    const res = await fetch(`${baseAPI}/dashboard?api=processRequestAKitConditions&updateDb=${updateDb}`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + idToken,
      },
    });

    return await res.json();
}

const storeRequestAKitConditions = async (schema) => {
  showAnimation();
  const idToken = await getIdToken();

  const schemaPayload = {data : schema };
  const response = await fetch(`${baseAPI}/dashboard?api=updateRequestAKitConditions`, {
    method: "POST",
    body: JSON.stringify(schemaPayload),
    headers: {
      Authorization: "Bearer " + idToken,
      "Content-Type": "application/json",
    },
  });
  hideAnimation();
  const res = await response.json();
  
  return res;
}