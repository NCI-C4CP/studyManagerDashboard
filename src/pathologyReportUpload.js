import { dashboardNavBarLinks, removeActiveClass } from "./navigationBar.js";
import {
  getIdToken,
  hideAnimation,
  showAnimation,
  conceptToSiteMapping,
  triggerNotificationBanner,
  baseAPI,
} from "./utils.js";
import { renderParticipantHeader } from "./participantHeader.js";
import { renderLookupResultsTable } from "./participantLookup.js";
import conceptIds from "./fieldToConceptIdMapping.js";

let fileState = {};
let Connect_ID, siteAcronym;

const setupPathologyReportUploadPage = (participantData) => {
  return `
    <div class="container" id="pathologyReportUploadPage">
      <div id="alert_placeholder"></div>
        ${renderParticipantHeader(participantData)}
            <div class="row">
                <div class="col-md-12">
                    <h3 style="text-align: center;">Select Pathology Reports</h3>
                    <form id="uploadForm" enctype="multipart/form-data" style="margin-bottom: 18px;">
                        <input type="file" id="fileInput" name="files" style="display: none;" multiple>
                        <div style="display: flex; align-items: stretch; gap: 18px;">
                            <div style="flex: 1 1 auto;">
                                <div id="dropBox">
                                    <div style="color:#888; font-size:1.1rem; margin-bottom:8px;" id="dropHint">
                                    Drop files here for uploading
                                    <br>
                                Or <a href="#" id="selectFilesLink" style="color:#1976d2; text-decoration:none;">choose your files</a>
                                </div>
                                <div id="selectedFileNames"></div>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                            <button type="submit" class="btn btn-primary" id="uploadBtn" disabled style="margin-top:0;">
                                Upload
                            </button>
                            <button type="button" class="btn btn-info" id="backToSearchBtn" style="margin-top:1rem;">
                                Back to Search
                            </button>
                        </div>
                    </div>
                </form>
                <div id="uploadedFilesWrapper" style="margin-top: 24px; display: none;">
                  <h3 style="text-align: center;">All Uploaded Reports</h3>
                  <div id="uploadedFilesBox" style="border: 2px solid #0078d7; padding: 15px; border-radius: 0.5rem; background: #f8faff">
                      <div id="uploadedFilesNames"></div>
                  </div>
                </div>

                <div class="modal fade" id="warningModal" tabindex="-1" role="dialog" aria-labelledby="warningModalLabel" aria-hidden="true">
                  <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content" style="border-radius:8px;">
                      <div class="modal-header" style="border-bottom:none; background-color:#fff3cd">
                        <h5 class="modal-title" id="warningModalLabel" style="color:black; border-radius:4px; padding:6px 12px;">Duplicate File(s) Found</h5>
                      </div>
                      <div class="modal-body" style="text-align:left;">
                        <span id="duplicateFilesWarning"></span>
                      </div>
                      <div class="modal-footer" style="border-top:none; justify-content:center;">
                        <button id="replaceBtn" class="btn btn-warning" style="margin-right:12px;">Replace</button>
                        <button id="cancelBtn" class="btn btn-secondary">Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
        </div>
    </div>
    `;
};

const showNotAllowedToUpload = (participantData) => {
  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = `
    <div class="container">
      ${renderParticipantHeader(participantData)}
      <div class="row">
        <h4 style="text-align: center;">Participant does not meet the criteria for uploading pathology reports.</h4>
      </div>
      <div style="text-align: center;">
        <button type="button" class="btn btn-info" id="backToSearchBtn" style="margin-top:1rem;">Back to Search</button>
      </div>
    </div>
  `;

  document.querySelector("#backToSearchBtn").addEventListener("click", () => {
    renderLookupResultsTable();
  });
};

const refreshSelectedFiles = () => {
  const selectedFileNamesDiv = document.querySelector("#selectedFileNames");
  const uploadBtn = document.querySelector("#uploadBtn");
  selectedFileNamesDiv.innerHTML = "";

  if (fileState.selected.length === 0) {
    uploadBtn.disabled = true;
    return;
  }

  uploadBtn.disabled = false;
  fileState.selected.forEach((file, idx) => {
    const fileDiv = document.createElement("div");
    fileDiv.style.display = "flex";
    fileDiv.style.alignItems = "center";
    fileDiv.style.gap = "8px";
    fileDiv.style.marginBottom = "4px";

    const removeFileBtn = document.createElement("button");
    removeFileBtn.textContent = "✕";
    removeFileBtn.title = "Remove file";
    removeFileBtn.className = "btn btn-sm btn-warning py-0 px-2";
    removeFileBtn.style.marginRight = "0.75rem";
    removeFileBtn.style.fontSize = "0.85em";
    removeFileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      fileState.selected.splice(idx, 1);
      refreshSelectedFiles();
    });
    fileDiv.appendChild(removeFileBtn);

    const nameSpan = document.createElement("span");
    nameSpan.textContent = file.name;
    fileDiv.appendChild(nameSpan);

    selectedFileNamesDiv.appendChild(fileDiv);
  });
};

const refreshUploadedFilenames = () => {
  const uploadedFilesWrapperDiv = document.querySelector("#uploadedFilesWrapper");
  if (fileState.filenamesUploaded.length === 0) {
    uploadedFilesWrapperDiv.style.display = "none";
    return;
  }

  const ul = document.createElement("ul");
  ul.style = "text-align: left; padding-left: 20px;";
  fileState.filenamesUploaded.forEach((filename) => {
    const li = document.createElement("li");
    li.style = "font-weight: bold;";
    li.textContent = filename;
    ul.appendChild(li);
  });

  document.querySelector("#uploadedFilesNames").replaceChildren(ul);
  uploadedFilesWrapperDiv.style.display = "";
};

const addNewFiles = (newFiles) => {
  const fileArray = Array.from(newFiles);
  const filenameSet = new Set();
  const invalidFileArray = [];
  let selecteFileCount = fileState.selected.length;
  fileState.stage = "select";
  fileState.tobeSelectedDuplicate = [];

  for (const file of fileArray) {
    if (filenameSet.has(file.name)) {
      alert(`Current selection has files with identical name "${file.name}". Please select files with unique names.`);
      return;
    }
    filenameSet.add(file.name);

    if (file.name.startsWith(Connect_ID)) {
      const selectedFileIdx = fileState.selected.findIndex((f) => f.name === file.name);
      if (selectedFileIdx === -1) {
        fileState.selected.push(file);
      } else {
        fileState.tobeSelectedDuplicate.push(file);
      }
    } else {
      invalidFileArray.push(file);
    }
  }

  if (invalidFileArray.length > 0) {
    alert(
      `The following file names should start with Connect ID (${Connect_ID}):\n` +
        invalidFileArray.map((f) => f.name).join("\n")
    );
  }

  if (fileState.tobeSelectedDuplicate.length > 0) {
    let msg = `Below file is already selected for upload. Do you want to replace it with the new file or cancel this selection?`;
    if (fileState.tobeSelectedDuplicate.length > 1) {
      msg = `Below files are already selected for upload. Do you want to replace them with the new files or cancel this selection?`;
    }

    document.querySelector("#duplicateFilesWarning").innerHTML = `${msg}<br>${fileState.tobeSelectedDuplicate
      .map((file) => file.name)
      .join("<br>")}`;
    $("#warningModal").modal({ backdrop: "static", keyboard: false });
  }

  if (fileState.selected.length > selecteFileCount) {
    refreshSelectedFiles();
  }
};

const uploadPathologyReports = async () => {
  if (fileState.tobeUploaded.length === 0) return;

  showAnimation();
  const formData = new FormData();
  fileState.tobeUploaded.forEach((file) => formData.append("files", file));

  const searchParamsStr = new URLSearchParams({
    api: "uploadPathologyReports",
    Connect_ID,
    siteAcronym,
  }).toString();

  const url = `${baseAPI}/dashboard/?${searchParamsStr}`;
  const idToken = await getIdToken();
  try {
    const resp = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: "Bearer " + idToken,
      },
    });

    const respJson = await resp.json();
    if (respJson.code === 200) {
      triggerNotificationBanner("Files uploaded successfully!", "success");
      fileState.filenamesUploaded = respJson.data;
      refreshUploadedFilenames();
      fileState.selected = [];
      refreshSelectedFiles();
    } else {
      triggerNotificationBanner("Upload failed: " + respJson.message, "danger");
    }
  } catch (err) {
    triggerNotificationBanner("Error uploading files: " + err.message, "danger");
  }
  hideAnimation();
};

const getUploadedPathologyReportNames = async () => {
  showAnimation();
  const searchParamsStr = new URLSearchParams({
    api: "getUploadedPathologyReportNames",
    Connect_ID,
    siteAcronym,
  }).toString();
  const url = `${baseAPI}/dashboard/?${searchParamsStr}`;
  const idToken = await getIdToken();
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + idToken,
      },
    });
    const respJson = await resp.json();
    if (respJson.code === 200) {
      fileState.filenamesUploaded = respJson.data;
    } else {
      console.error("Failed to fetch uploaded file names:", respJson.message);
      triggerNotificationBanner("Failed to fetch uploaded file names: " + respJson.message, "danger");
    }
  } catch (e) {
    triggerNotificationBanner("Error fetching uploaded file names: " + e.message, "danger");
  } finally {
    refreshUploadedFilenames();
  }

  hideAnimation();
};

export const renderPathologyReportUploadPage = async (participantData) => {
  document.getElementById("navBarLinks").innerHTML = dashboardNavBarLinks();
  removeActiveClass("nav-link", "active");
  document.getElementById("participantSummaryBtn").classList.add("active");

  const isAllowedToUpload =
    participantData[conceptIds.verifiedFlag] === conceptIds.verified &&
    participantData[conceptIds.consentFlag] === conceptIds.yes &&
    participantData[conceptIds.hippaFlag] === conceptIds.yes &&
    participantData[conceptIds.withdrawConsent] === conceptIds.no &&
    participantData[conceptIds.revokeHIPAA] === conceptIds.no &&
    participantData[conceptIds.destroyData] === conceptIds.no;

  if (!isAllowedToUpload) {
    showNotAllowedToUpload(participantData);
    return;
  }

  Connect_ID = participantData.Connect_ID;
  siteAcronym = conceptToSiteMapping[participantData[conceptIds.healthcareProvider]];
  if (!siteAcronym) {
    triggerNotificationBanner("Invalid healthcare provider: " + participantData.healthcareProvider, "warning");
    return;
  }

  fileState = {
    tobeSelectedDuplicate: [],
    selected: [],
    tobeUploadedDuplicate: [],
    tobeUploaded: [],
    filenamesUploaded: [],
    stage: "select", // "select" or "upload"
  };

  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = setupPathologyReportUploadPage(participantData);
  await getUploadedPathologyReportNames();

  const fileInput = document.querySelector("#fileInput");
  fileInput.addEventListener("change", (e) => {
    const newFiles = e.target.files;
    addNewFiles(newFiles);
  });

  const dropBoxDiv = document.querySelector("#dropBox");
  dropBoxDiv.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropBoxDiv.classList.add("dragover");
  });

  dropBoxDiv.addEventListener("dragleave", () => {
    dropBoxDiv.classList.remove("dragover");
  });

  dropBoxDiv.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropBoxDiv.classList.remove("dragover");
    addNewFiles(e.dataTransfer.files);
  });

  document.querySelector("#selectFilesLink").addEventListener("click", function (e) {
    e.preventDefault();
    fileInput.click();
  });

  document.getElementById("replaceBtn").addEventListener("click", async () => {
    $("#warningModal").modal("hide");

    if (fileState.stage === "select") {
      while (fileState.tobeSelectedDuplicate.length > 0) {
        const file = fileState.tobeSelectedDuplicate.pop();
        const idx = fileState.selected.findIndex((f) => f.name === file.name);
        if (idx !== -1) {
          fileState.selected.splice(idx, 1);
        }
        fileState.selected.push(file);
      }
      refreshSelectedFiles();
    } else if (fileState.stage === "upload") {
      const filenameSet = new Set();
      while (fileState.tobeUploadedDuplicate.length > 0) {
        const file = fileState.tobeUploadedDuplicate.pop();
        if (!filenameSet.has(file.name)) {
          fileState.tobeUploaded.push(file);
          filenameSet.add(file.name);
        }
      }

      await uploadPathologyReports();
    }
  });

  document.getElementById("cancelBtn").addEventListener("click", () => {
    $("#warningModal").modal("hide");
  });

  document.querySelector("#uploadForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    fileState.stage = "upload";
    fileState.tobeUploaded = [];
    fileState.tobeUploadedDuplicate = [];
    const filenameSet = new Set();

    for (const file of fileState.selected) {
      const isDuplicate = fileState.filenamesUploaded.includes(file.name);
      if (isDuplicate) {
        fileState.tobeUploadedDuplicate.push(file);
      } else if (!filenameSet.has(file.name)) {
        fileState.tobeUploaded.push(file);
        filenameSet.add(file.name);
      }
    }

    if (fileState.tobeUploadedDuplicate.length > 0) {
      let msg = `Below file has been uploaded already. Do you want to replace it with the new file or cancel this upload?`;
      if (fileState.tobeUploadedDuplicate.length > 1) {
        msg = `Below files have been uploaded already. Do you want to replace them with the new files or cancel this upload?`;
      }

      document.querySelector("#duplicateFilesWarning").innerHTML = `${msg}<br>${fileState.tobeUploadedDuplicate
        .map((file) => file.name)
        .join("<br>")}`;
      $("#warningModal").modal({ backdrop: "static", keyboard: false });
      return;
    }

    await uploadPathologyReports();
  });

  document.querySelector("#backToSearchBtn").addEventListener("click", () => {
    renderLookupResultsTable();
  });
};
