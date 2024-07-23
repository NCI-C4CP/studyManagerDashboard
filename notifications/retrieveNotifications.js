import { dashboardNavBarLinks, removeActiveClass } from '../navigationBar.js';
import { getIdToken, showAnimation, hideAnimation, baseAPI } from '../utils.js';
import { getSchemaHtmlStr, handleEmailPreview } from './storeNotifications.js';
import { appState } from '../stateManager.js';

export const renderRetrieveNotificationSchema = async (showDrafts = false) => {
  const isParent = localStorage.getItem("isParent");
  document.getElementById("navBarLinks").innerHTML = dashboardNavBarLinks(isParent);
  removeActiveClass("nav-link", "active");
  const notificationsAnchor = document.getElementById("notifications");
  notificationsAnchor && notificationsAnchor.classList.add("active");
  showAnimation();
  const idToken = await getIdToken();
  const response = await getNotificationSchemas("all", idToken, showDrafts);
  const schemaArray = response.data || [];
  document.getElementById("mainContent").innerHTML = render(schemaArray, showDrafts);
  const categoryArray = getNotificationSchemaCategories(schemaArray);
  triggerSchemaEdit(categoryArray, "Filter by Category");
  hideAnimation();
  appState.setState({ notification: { showDrafts, schemaArray } });
};

export const showDraftSchemas = async () => {
  await renderRetrieveNotificationSchema(true);
};

const triggerSchemaEdit = (categoryArray, categoryName) => {
  handleViewNotificationSchema();
  handleEditNotificationSchema();
  renderCategorydDropdown(categoryArray);
  triggerCategories(categoryArray, categoryName);
};

const render = (schemaArray, showDrafts) => {
  const titleStr = showDrafts ? "Draft Notification Schemas" : "Completed Notification Schemas";
  return `
        <div class="container-fluid">
            <div id="root root-margin"> 
                <br />
                <span> <h4 style="text-align: center;">${titleStr}</h4> </span>
                <div style="margin-top:10px; padding:15px;" class="dropdown" id="dropdownForm">
                    <button class="btn btn-secondary dropdown-toggle dropdown-toggle-sites" id="dropdownCategories" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Filter by Category
                    </button>
                    <ul class="dropdown-menu" id="dropdownMenuButtonCategories" aria-labelledby="dropdownMenuButton">
                    </ul>
                </div>
            </div>
            ${renderNotificationCards(schemaArray)}
        </div>
        <div class="modal fade" id="modalShowSchema" data-keyboard="false" tabindex="-1" role="dialog" data-backdrop="static" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
                <div class="modal-content sub-div-shadow">
                    <div class="modal-header" id="modalHeader"></div>
                    <div class="modal-body" id="modalBody"></div>
                </div>
            </div>
        </div>`;
};

const getNotificationSchemas = async (category, idToken, showDrafts) => {
  const catgStr = category !== undefined ? category : `all`;
  let apiStr = `${baseAPI}/dashboard?api=retrieveNotificationSchema&category=${catgStr}`;
  if (showDrafts) {
    apiStr += "&drafts=true";
  }

  const response = await fetch(apiStr, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + idToken,
    },
  });

  return response.json();
};

const renderNotificationCards = (schemaArray) => {
  if (!schemaArray || schemaArray.length === 0) return "<h5>No Schemas Found</h5>";

  let template = "";
  schemaArray.forEach((schema, idx) => {
    template += `
      <div class="card detailedRow">
          <div class="card-header">
              Attempt: ${schema.attempt}  |  Notification ${schema.notificationType.length > 1 ? "Types" : "Type"}: 
              ${schema.notificationType[0]}${schema.notificationType[1] ? ", " + schema.notificationType[1] : ""}
              ${schema.notificationType[2] ? ", " + schema.notificationType[2] : ""}
          </div>
          <div class="card-body">
              <h5 class="card-title">Category: ${schema.category} </h5>
              <p class="card-text">${schema.description}</p>
              <button type="button" class="btn btn-success viewSchema" data-toggle="modal" data-target="#modalShowSchema" data-schema-idx=${idx}>View</button>
              <button type="button" class="btn btn-primary editSchema" data-schema-idx=${idx}>Edit</button>
          </div>
      </div>`;
});

  return template;
};

const handleViewNotificationSchema = () => {
  const rows = Array.from(document.getElementsByClassName("detailedRow"));
  if (rows.length > 0) {
    rows.forEach((element) => {
      const viewButton = element.getElementsByClassName("viewSchema")[0];
      viewButton && viewButton.addEventListener("click", () => {
        const schemaData = appState.getState().notification.schemaArray[viewButton.dataset.schemaIdx];
        const header = document.getElementById("modalHeader");
        const body = document.getElementById("modalBody");
        header.innerHTML = `<h5>View Schema</h5><button type="button" class="modal-close-btn" id="closeModal" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>`;

        body.innerHTML = `<div>${getSchemaHtmlStr(schemaData, true)}</div>`;
        handleEmailPreview();
      });
    });
  }
};

const handleEditNotificationSchema = () => {
  const rows = Array.from(document.getElementsByClassName("detailedRow"));
  if (rows.length > 0) {
    rows.forEach((element) => {
      const editButton = element.getElementsByClassName("editSchema")[0];
      editButton.addEventListener("click", () => {
        const schema = appState.getState().notification.schemaArray[editButton.dataset.schemaIdx];
        appState.setState({
          notification: {
            isEditing: true,
            savedSchema: schema,
          },
        });
        const editSchemaRoute = "#notifications/editSchema";
        location.replace(location.origin + location.pathname + editSchemaRoute);
      });
    });
  }
};

const getNotificationSchemaCategories = (schemaArray) => {
  if (!schemaArray || schemaArray.length === 0) return [];
  let categorySet = new Set(["all"]);
  schemaArray.forEach((schema) => {
    categorySet.add(schema.category);
  });

  return Array.from(categorySet);
};

const renderCategorydDropdown = (categoriesHolder) => {
    let unlistedDiv = document.getElementById('dropdownMenuButtonCategories');
    categoriesHolder.forEach( i => {
        let list = document.createElement("li");
        let listHyperLink = document.createElement("a");
        listHyperLink.classList.add("dropdown-item");
        listHyperLink.id = "categoryFilter";
        listHyperLink.setAttribute("category", i);
        listHyperLink.innerHTML = i;
        list.appendChild(listHyperLink);
        unlistedDiv.appendChild(list);
        unlistedDiv.style.maxHeight = "300px"; // Adjust the maximum height as needed
        unlistedDiv.style.overflowY = "auto"; 
    })
}

const triggerCategories = (originalCategoriesHolder, categoryName) => {
    let a = document.getElementById('dropdownCategories');
    let dropdownMenuButton = document.getElementById('dropdownMenuButtonCategories');
    let tempCategory = a.innerHTML = categoryName;
    if (dropdownMenuButton) {
        dropdownMenuButton.addEventListener('click', async (e) => {
            if (categoryName === 'Filter by Category' || categoryName === tempCategory) {
                a.innerHTML = e.target.textContent;
                const idToken = await getIdToken();
                const showDrafts = appState.getState().notification?.showDrafts;
                const response = await getNotificationSchemas(e.target.textContent, idToken, showDrafts);
                appState.setState({ notification: { showDrafts, schemaArray: response.data } });
                document.getElementById("mainContent").innerHTML = render(response.data, showDrafts);
                triggerSchemaEdit(originalCategoriesHolder, e.target.textContent);
            }
        })
    }
}