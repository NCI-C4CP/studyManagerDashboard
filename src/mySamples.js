import { updateNavBar } from './navigationBar.js';
import { showAnimation, hideAnimation, baseAPI, getIdToken, triggerNotificationBanner } from './utils.js';
import { appState } from './stateManager.js';

const converter = new showdown.Converter();
const langObj = { en: 'English', es: 'Spanish' };
const langArray = Object.keys(langObj).sort();

/**
 * Fetches all My Samples data from backend API
 * @returns {Promise<Array>} Array of My Samples records, or empty array on error.
 */
const getAllMySamples = async () => {
  showAnimation();
  const idToken = await getIdToken();

  const response = await fetch(`${baseAPI}/dashboard?api=getAllMySamples`, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + idToken,
    },
  });
  hideAnimation();
  const res = await response.json();
  if (res.code === 200) {
    return res.data;
  }

  triggerNotificationBanner('Error in retrieving My Samples!', 'danger');
  return [];
};

/**
 * Saves or publishes a My Samples content changes.
 * @param {{ update: Object, id: string }} payload - The update payload containing new content and the record ID.
 * @param {'save'|'publish'} action - Whether to save as draft or publish.
 * @returns {Promise<void>}
 */
const updateMySamples = async (payload, action = 'save') => {
  showAnimation();
  const idToken = await getIdToken();
  const response = await fetch(`${baseAPI}/dashboard?api=updateMySamples&action=${action}`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      Authorization: 'Bearer ' + idToken,
      'Content-Type': 'application/json',
    },
  });
  hideAnimation();
  const res = await response.json();
  if (res.code === 200) {
    const selectedData = appState.getState().mySamples.selectedData;
    if (action === 'save') {
      selectedData.saved = payload.update;
    } else if (action === 'publish') {
      selectedData.published = payload.update;
      selectedData.saved = null;
    }

    triggerNotificationBanner(`My Samples ${action === 'publish' ? 'Published' : 'Saved'}.`, 'success');
    return;
  }

  triggerNotificationBanner(`Error Updating My Samples: ${res.message}`, 'danger');
};

const handleExitForm = () => {
  const exitBtn = document.getElementById('exitFormBtn');
  exitBtn.addEventListener('click', async () => {
    await renderMySamplesPage();
  });
};

/**
 * Renders content editor and viewer.
 * @param {{ en: string, es: string }} contentData - Content keyed by language code.
 * @param {boolean} isReadOnly - Whether the fields should be disabled.
 * @returns {string} HTML string for the content form section.
 */
const renderContent = (contentData, isReadOnly = false) => {
  const readonlyCheck = isReadOnly ? 'disabled' : '';
  return `
    <div class="row">
        <div class="col" data-template="mySamples">
            ${langArray
              .map((lang) => {
                const langFull = langObj[lang];
                const adjustedHtmlContent = contentData[lang];
                return `
                <div class="row" data-content-lang="${lang}">
                    <label class="col-form-label col-md-1" for="${lang}Content">${langFull}</label>
                    <textarea rows="5" class="col-md-5"  id="${lang}Content" placeholder="${langFull} Content" ${readonlyCheck}>${adjustedHtmlContent}</textarea>
                    <div class="col ms-3" id="${lang}ContentPreview"></div>
                </div>
                `;
              })
              .join('')}
        </div>
    </div>
  `;
};

/**
 * Renders the full edit or view form for a selected My Samples record.
 * @param {{ siteName: string, siteAcronym: string, saved: Object|null, published: Object, id: string }} selectedData - The selected site's My Samples data.
 * @param {'edit'|'view'} type - Whether to render in edit or read-only view mode.
 * @returns {string} HTML string for the selected data.
 */
const renderSeletedContent = (selectedData, type) => {
  let isReadOnly = true;
  let titleStr = '';
  if (type === 'edit') {
    titleStr = `Edit My Samples Template for ${selectedData.siteAcronym}`;
    isReadOnly = false;
  }

  const readonlyCheck = isReadOnly ? 'disabled' : '';
  return `
    <div class="container-fluid">
        <div id="root root-margin"> 
            <div id="alert_placeholder"></div>
            <br />
            <span> <h4 style="text-align: center">${titleStr}</h4> </span>
            <form method="post" class="mt-3" id="mySamplesForm">
                ${renderContent(selectedData.saved || selectedData.published, isReadOnly)}
                <div class="mt-4 mb-4 d-flex justify-content-center">
                    <button type="submit" title="Save as a draft. Not used in MyConnect." class="btn btn-primary" id="saveBtn" data-action="save" ${readonlyCheck}>
                        Save as Draft
                    </button>
                    <button type="submit" title="Publish and use in MyConnect." class="btn btn-success ms-2" id="publishBtn" data-action="publish" ${readonlyCheck}>
                        Publish
                    </button>
                    <button type="button" class="btn btn-danger ms-2" id="exitFormBtn" ${readonlyCheck}>Exit Editing</button>
                </div>
            </form>
        </div>
    </div>`;
};

/**
 * Attaches a submit listener to the My Samples form, collecting textarea content
 * and calling updateMySamples with the appropriate save or publish action.
 */
const handleFormSubmit = () => {
  const form = document.getElementById('mySamplesForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = { update: {} };
    const action = e.submitter.dataset.action;
    const contentDivList = document.querySelectorAll('div[data-content-lang]');
    for (const contentDiv of contentDivList) {
      const lang = contentDiv.dataset.contentLang;
      const textareaEle = contentDiv.querySelector('textarea');
      if (textareaEle) {
        const currContent = textareaEle.value.trim();
        if (currContent.length === 0) {
          triggerNotificationBanner(`Please fill in the ${langObj[lang]} content!`, 'danger');
          return;
        }

        data.update[lang] = currContent;
      }
    }

    data.id = appState.getState().mySamples.selectedData.id;
    await updateMySamples(data, action);
  });
};

/**
 * Attaches mouseenter listeners to each language textarea to render a live
 * markdown/HTML preview in the preview area.
 */
const handleContentPreview = () => {
  const contentDivList = document.querySelectorAll('div[data-content-lang]');
  if (contentDivList.length === 0) return;

  for (const contentDiv of contentDivList) {
    const lang = contentDiv.dataset.contentLang;
    const textareaEle = contentDiv.querySelector('textarea');
    const contentPreviewDiv = contentDiv.querySelector(`#${lang}ContentPreview`);
    if (!textareaEle || !contentPreviewDiv || textareaEle.hasRefreshListener) continue;

    textareaEle.addEventListener('mouseenter', () => {
      contentPreviewDiv.innerHTML = converter.makeHtml(`<div>${textareaEle.value}</div>`);
    });
    textareaEle.hasRefreshListener = true;
  }
};

/**
 * Attaches click listeners to View and Edit buttons on each site's content card,
 * opening the modal for viewing or navigating to the edit form.
 */
const handleViewAndEdit = () => {
  const contentDivList = Array.from(document.querySelectorAll('div.card.contentRow'));
  if (contentDivList.length > 0) {
    contentDivList.forEach((contentDiv) => {
      const idx = contentDiv.dataset.idx;
      const selectedData = appState.getState().mySamples.allData[idx];
      const editButton = contentDiv.querySelector('#editContent');
      editButton &&
        editButton.addEventListener('click', () => {
          appState.setState((state) => ({
            mySamples: {
              ...state.mySamples,
              selectedData,
            },
          }));
          mainContent.innerHTML = renderSeletedContent(selectedData, 'edit');
          handleContentPreview();
          handleFormSubmit();
          handleExitForm();
        });

      const viewButton = contentDiv.querySelector('#viewContent');
      viewButton &&
        viewButton.addEventListener('click', () => {
          const header = document.getElementById('modalHeader');
          header.innerHTML = `<h5>View My Samples Content for ${selectedData.siteAcronym}</h5><button type="button" class="btn-close" id="closeModal" data-bs-dismiss="modal" aria-label="Close"></button>`;
          const body = document.getElementById('modalBody');
          body.innerHTML = renderSeletedContent(selectedData, 'view');
          handleContentPreview();
        });
    });
  }
};

/**
 * Renders My Samples entry page, fetching data from backend API if not already cached in app state.
 * @returns {Promise<void>}
 */
export const renderMySamplesPage = async () => {
  updateNavBar('mySamplesBtn');
  if (!appState.getState().mySamples) {
    showAnimation();
    const dataArray = await getAllMySamples();
    hideAnimation();
    appState.setState({ mySamples: { allData: dataArray } });
  }

  let wrappedHtml = '';
  const dataArray = appState.getState().mySamples.allData;
  if (!dataArray || dataArray.length === 0) {
    wrappedHtml = '<h5>My Samples Data Not Found</h5>';
  }

  dataArray.forEach((data, idx) => {
    wrappedHtml += `
      <div class="card contentRow" data-idx=${idx}>
          <div class="card-header">
              Site: ${data.siteAcronym}
          </div>
          <div class="card-body">
              <h5 class="card-title">${data.siteName} </h5>
              <button type="button" class="btn btn-primary" title="View published content" id="viewContent" data-action="view" data-bs-toggle="modal" data-bs-target="#modalShowContent">View</button>
              <button type="button" class="btn btn-success" id="editContent" data-action="edit">${data.saved ? 'Edit Draft' : 'Edit'}</button>
          </div>
      </div>`;
  });

  const html = `
        <div class="container-fluid">
            <div id="root root-margin"> 
                <br />
                <span> <h4 style="text-align: center;">My Samples Contents</h4> </span>
            </div>
            ${wrappedHtml}
        </div>
        <div class="modal fade" id="modalShowContent" data-bs-keyboard="false" tabindex="-1" role="dialog" data-bs-backdrop="static" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
                <div class="modal-content sub-div-shadow">
                    <div class="modal-header" id="modalHeader"></div>
                    <div class="modal-body" id="modalBody"></div>
                </div>
            </div>
        </div>`;

  document.getElementById('mainContent').innerHTML = html;
  handleViewAndEdit();
};
